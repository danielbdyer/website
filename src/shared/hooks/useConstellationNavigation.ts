import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { applyCameraLook, cameraBasis, unproject } from '@/shared/geometry/camera';
import {
  TRAIL_LENGTH,
  applyCameraYaw,
  broadcastCameraToFirmament,
  broadcastCursorToFirmament,
  projectGlyph,
  projectStars,
  projectThreads,
  projectTrail,
  writeGlyphChannels,
  type NavigableEdge,
} from '@/shared/dom/skyProjector';
import {
  hasVisitedBefore,
  markVisited,
  persistCursorPos,
  readPersistedCursorPos,
} from '@/shared/state/cursorStorage';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import {
  NORTH_POLE,
  geodesicDistance,
  raySphereIntersect,
  slerp,
  stepOnSphere,
  tangentTowards,
  unitVector,
} from '@/shared/geometry/sphere';
import {
  MAX_ANGULAR_VELOCITY,
  VELOCITY_SAMPLE_WINDOW_MS,
  WELL_RADIUS_RAD,
  easeOutCubic,
  flickAngularVelocity,
  geodesicNearestNode,
  geodesicNeighborInDirection,
  sphericalWellForce,
  tangentHoldDirection,
  type NavigableNode,
  type PointerSample,
} from '@/shared/geometry/wellPhysics';

// Force-field navigation across the constellation's latent sphere.
//
// The cursor lives on the surface of the unit sphere. Position is a
// UnitVector3 (always on the sphere); velocity is a tangent vector
// (always perpendicular to position). Forces are tangent. Each tick
// integrates velocity from acceleration, advances position by
// velocity * dt, then re-normalizes back onto the sphere — a small
// straight step in the tangent plane followed by a projection.
//
// Three input gestures inject motion:
//
//   - Pointer drag: a strong tangent spring pulls the cursor toward
//     the pointed-at sphere point (computed by ray-casting through
//     the camera). On release, the gesture's recent angular
//     velocity (tangent at the cursor's current position) is added
//     to the cursor's velocity — a flick imparts momentum.
//   - Held arrow keys: as long as keys are held, a constant tangent
//     acceleration pushes the cursor in the held direction
//     (decomposed against the camera's right/up basis projected
//     onto the sphere's tangent plane at the cursor).
//   - The well field: every node is a gravity well radiating a
//     tangent attractor force that falls off with geodesic
//     distance. Always on. Between two nodes the pulls compete
//     (the saddle); inside a well one wins (the local minimum).
//     Friction lets a coasting cursor settle into whatever well
//     its momentum carries it into. *Code naming note: in the
//     design lexicon "basin" is the editorial cluster — a named
//     gathering of stars. The per-star physics here is the *well*
//     each star carries; the cluster meaning lives at the chrome
//     layer. CONSTELLATION_DESIGN.md §"Constellation Lexicon".*
//
// `prefers-reduced-motion: reduce` short-circuits the loop and
// pointer/keyboard fall back to direct snap-to-nearest by geodesic
// distance. The graph is still navigable; it just stops moving.

// NavigableNode lives in @/shared/geometry/wellPhysics so the pure
// physics functions can stand alone. Re-exported here so existing
// consumers (Constellation organism, layout module) keep their
// import path stable across the refactor.
export type { NavigableNode } from '@/shared/geometry/wellPhysics';

// NavigableEdge lives in @/shared/dom/skyProjector — it's a render-
// layer concern (x1/y1/x2/y2 written per tick), not a physics one.
// Re-exported here so existing consumers (Constellation organism)
// keep their import path stable across the refactor.
export type { NavigableEdge } from '@/shared/dom/skyProjector';

interface UseConstellationNavigationArgs {
  readonly nodes: readonly NavigableNode[];
  readonly edges: readonly NavigableEdge[];
  readonly viewboxSize: number;
  readonly setActiveKey: (key: string) => void;
  readonly cameraRef: RefObject<SVGGElement | null>;
  /** Companion glyph — a small mote at the cursor's projected screen
   *  position. The hook updates its cx and cy each RAF tick so the
   *  visitor can see *where they are* on the latent sphere. */
  readonly glyphRef: RefObject<SVGCircleElement | null>;
  /** When set to a node key (`{room}/{slug}`), the sky opens centered
   *  on that star, claimed and active — the visitor looked up from the
   *  work and arrives at its place among its relations. Takes priority
   *  over the restored cursor and the demonstration drift: an explicit
   *  jump is not a first-visit. CONSTELLATION_PARALLEL.md §"The
   *  Orientation Contract." */
  readonly focusKey?: string | undefined;
}

// Hook-local physics tuning. The well-field constants
// (INFLUENCE_RADIUS_RAD, WELL_RADIUS_RAD, WELL_STIFFNESS,
// MAX_ANGULAR_VELOCITY, VELOCITY_SAMPLE_WINDOW_MS) live in
// @/shared/geometry/wellPhysics — this file imports the ones it
// needs. The constants below tune the visitor's input gestures
// against the well field and only matter at the hook boundary.
// A press only becomes a drag after the pointer travels this far —
// below it, the press is a tap and the star's native anchor click
// proceeds untouched. Without the threshold every pointerdown
// captured the pointer, which retargeted the eventual click to the
// drag surface and made opening a work nearly impossible.
const DRAG_THRESHOLD_PX = 7;
// Drag feel, tuned toward deliberate weight. The world should read
// as a body with mass that the visitor *guides*, not a surface that
// snaps to the pointer. DRAG_SPRING softened (the cursor follows with
// a little give); DRAG_DAMPING set near-critical for the new spring
// (k≈36 → c≈12: a smooth glide, no overshoot); FLICK_SCALE halved so a
// release is a gentle continuation rather than a throw. The dominant
// "too fast" lever is the velocity cap in wellPhysics (lowered there).
// FREE_DAMPING (coast friction) is high enough that a coast settles
// into a well without overshoot — the landing reads as decisive, not
// wobbly — which matters more now that the closer camera magnifies
// every motion (see ORBIT_DISTANCE).
const DRAG_SPRING = 36;
const DRAG_DAMPING = 12;
const FREE_DAMPING = 5;
const HOLD_ACCEL = 5.5;
const FLICK_SCALE = 0.3;
const MAX_DT_SECONDS = 0.033;
const IDLE_VELOCITY_EPSILON = 0.005;
const IDLE_ACCELERATION_EPSILON = 0.04;
// Settle assist — inside a claimed well at low speed, the claimed
// star wins decisively: the cursor eases onto the node itself and
// the integrator is allowed to rest there. Without this, the sum of
// neighboring wells holds a slow tug-of-war at every settle point —
// the cursor creeps for seconds, the camera chases it, and the
// whole world drifts under a pointer that thought it had arrived.
const SETTLE_SPEED = 0.3;
const SETTLE_RATE = 9;
const SETTLE_REST_RAD = 0.004;

// Camera orbit constants. The camera sits at -ORBIT_DISTANCE *
// cameraSurfacePos and looks at origin — so the surface point lands
// near image center. cameraSurfacePos slerps toward state.pos with
// a damped catch-up rate, which means the camera *trails* the
// cursor: when the visitor flicks, the cursor leads, the glyph
// drifts off-center, the world re-projects toward where the visitor
// is reaching. Settled state: glyph at center, world centered on
// the active well.
const ORBIT_DISTANCE = 1.6;
const CAMERA_LAG_RATE = 6;
const CAMERA_FOV_Y = Math.PI / 4;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 10;
const WORLD_UP: UnitVector3 = { x: 0, y: 1, z: 0 };

// Yaw — a small rotation flourish on top of the orbit, driven by
// the cursor's screen-space x-velocity. Bounded so it never reads
// as tilt.
const YAW_VELOCITY_SCALE = 800;
const MAX_YAW_DEG = 5;

// Passive mouse-look. While the pointer hovers the sky (no press, no
// drag), the camera peers a few degrees toward the cursor — true
// perspective parallax, the space's depth made felt, distinct from the
// drag that commits the centerpoint to travel. The offset eases in and
// out (LOOK_EASE_RATE) and stands down during a drag so the drag's
// ray-casting reads a clean camera. LOOK_REST_EPSILON lets the loop
// sleep once the peer has settled (held or returned to center).
const MAX_LOOK_RAD = 0.12;
const LOOK_EASE_RATE = 5;
const LOOK_REST_EPSILON = 0.002;

interface MutableVec3 {
  x: number;
  y: number;
  z: number;
}

interface MutableVec2 {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

// geodesicNearestNode, sphericalWellForce, tangentHoldDirection,
// flickAngularVelocity, geodesicNeighborInDirection, easeOutCubic —
// all the pure helpers shared with the demonstration drift, the
// keyboard fallback, and the performance tests — live in
// @/shared/geometry/wellPhysics.

function pruneSamples(samples: PointerSample[], now: number, windowMs: number): void {
  const cutoff = now - windowMs * 2;
  while (samples.length > 0 && samples[0]!.time < cutoff) samples.shift();
}

function prefersReducedMotion(): boolean {
  return (
    globalThis.window !== undefined &&
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

interface NavState {
  pos: MutableVec3;
  vel: MutableVec3;
  mode: 'free' | 'dragging';
  dragTarget: UnitVector3 | null;
  /** A pointer that has gone down but not yet crossed the drag
   *  threshold. Cleared on promotion (→ dragging) or release (a
   *  tap — the click proceeds to whatever anchor it landed on). */
  press: { pointerId: number; clientX: number; clientY: number } | null;
  pointerSamples: PointerSample[];
  pointerId: number | null;
  heldKeys: Set<string>;
  lastTime: number;
  raf: number | null;
  activeKey: string | null;
  accelBuffer: MutableVec3;
  /** Passive mouse-look offset, normalized [-1, 1] per axis. `look`
   *  eases toward `lookTarget` each tick; the eased value scales
   *  MAX_LOOK_RAD into the camera's yaw/pitch peer. Driven by the
   *  cursor on free hover, zeroed during a drag, returned to center
   *  on pointer-leave. */
  look: MutableVec2;
  lookTarget: MutableVec2;
  /** Sphere point the orbital camera follows. Slerps toward `pos`
   *  with CAMERA_LAG_RATE so the cursor leads, the camera trails. */
  cameraSurfacePos: MutableVec3;
  /** Live camera + basis, rebuilt each tick from cameraSurfacePos.
   *  Pointer events read from these for ray-casting; keyboard hold
   *  reads from currentBasis to decompose against the visitor's
   *  current frame of reference. */
  currentCamera: Camera;
  currentBasis: CameraBasis;
  /** Last four sphere positions (newest at index 0). The companion
   *  glyph's ghost-decay trail reads these per frame to render a
   *  short fade-tail behind the cursor during fast travel. The
   *  trail is the *trace* the design's semiotic layer asks of the
   *  glyph — *a footstep in sand; a breath on glass.* Length is
   *  fixed at TRAIL_LENGTH so allocations never happen on the hot
   *  path. */
  trailHistory: MutableVec3[];
  /** When non-null, the cursor is in the middle of an autonomous
   *  drift (P2 first-visit demonstration). The tick reads from
   *  this and slerps pos along the great-circle arc; physics is
   *  suspended for the duration. Any visitor input cancels — the
   *  visitor is never forced to watch. */
  demoDrift: DemoDrift | null;
  /** Pending demo-drift setTimeout handle while the carpet roll
   *  is still completing. Stored on the state so the input
   *  handlers can clear it on first interaction; otherwise a
   *  fast tap-and-release before DEMO_DELAY_MS could let the
   *  drift kick in after the visitor already took control. */
  demoTimeoutId: ReturnType<typeof setTimeout> | null;
}

// TRAIL_LENGTH and the trail-strength tuning live in
// @/shared/dom/skyProjector since they're rendering concerns shared
// with the Stage component.

// Demonstration drift — the visitor's first lesson. After the
// carpet roll completes, the cursor drifts autonomously to the
// nearest star, settles, the basin claims, the visitor learns
// *the cursor is mine, and it can travel.* Reduced-motion snaps
// to the same target without animation. Returning visitors
// (localStorage shows a prior visit) get a shorter demo; in-
// session returns (sessionStorage has a cursor) skip the demo
// entirely. Q11 (drift-target choice) is closed: nearest by
// geodesic distance from the polestar — most spatially honest;
// teaches the physics by demonstrating settle into the closest
// well. CONSTELLATION_DESIGN.md §"First-Visit Choreography".
const DEMO_DELAY_MS = 1400;
const DEMO_FULL_DURATION_MS = 600;
const DEMO_FAST_DURATION_MS = 300;
interface DemoDrift {
  readonly startPos: UnitVector3;
  readonly target: UnitVector3;
  readonly startTime: number;
  readonly durationMs: number;
}

/** Build the orbital camera that places `surfacePos` near the
 *  image center. Camera sits at -ORBIT_DISTANCE * surfacePos,
 *  looking at the origin, with world-up as the up reference.
 *  cameraBasis handles degeneracy when surfacePos is parallel to
 *  world-up (the south/north poles of the up vector). */
function orbitalCamera(surfacePos: UnitVector3): Camera {
  return {
    position: {
      x: -surfacePos.x * ORBIT_DISTANCE,
      y: -surfacePos.y * ORBIT_DISTANCE,
      z: -surfacePos.z * ORBIT_DISTANCE,
    },
    target: { x: 0, y: 0, z: 0 },
    up: WORLD_UP,
    fovY: CAMERA_FOV_Y,
    near: CAMERA_NEAR,
    far: CAMERA_FAR,
  };
}

/** Convert a pointer event to a unit-sphere position by ray-casting
 *  through the camera. Returns null when the ray misses the sphere
 *  (pointer outside the sphere's silhouette). */
function pointerToSphere(
  e: PointerEvent<SVGSVGElement>,
  camera: Camera,
  basis: CameraBasis,
): UnitVector3 | null {
  const svg = e.currentTarget;
  const bounds = svg.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return null;
  const screenX = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
  const screenY = -(((e.clientY - bounds.top) / bounds.height) * 2 - 1);
  const ray = unproject(screenX, screenY, camera, basis, 1);
  return raySphereIntersect(ray.origin, ray.direction);
}

interface RuntimeRefs {
  readonly stateRef: RefObject<NavState>;
  readonly nodesRef: RefObject<readonly NavigableNode[]>;
  readonly edgesRef: RefObject<readonly NavigableEdge[]>;
  readonly cameraRef: RefObject<SVGGElement | null>;
  readonly glyphRef: RefObject<SVGCircleElement | null>;
  readonly viewboxSize: number;
  readonly setActiveKey: (key: string) => void;
}

function flipActive(state: NavState, key: string, setActiveKey: (k: string) => void): void {
  if (key === state.activeKey) return;
  state.activeKey = key;
  setActiveKey(key);
  persistCursorPos(state.pos);
}

/** Pick the nearest node by geodesic distance, used as the demo's
 *  drift target. Returns null on an empty graph. */
function demoTarget(state: NavState, nodes: readonly NavigableNode[]): NavigableNode | null {
  if (nodes.length === 0) return null;
  const nearest = geodesicNearestNode(state.pos, nodes);
  if (!nearest) return null;
  return nodes.find((c) => c.key === nearest.key) ?? null;
}

/** Open the sky centered on a specific node — the work↔star jump. The
 *  cursor lands on the star (camera centered, trail seeded), the basin
 *  claims it (active → threads bloom), and the loop wakes to project
 *  the focused scene. Reduced motion projects once instead of running. */
function focusCursorOnNode(state: NavState, refs: RuntimeRefs, node: NavigableNode): void {
  applyRestoredCursor(state, node.unitPos);
  flipActive(state, node.key, refs.setActiveKey);
  if (prefersReducedMotion()) projectScene(state, refs);
  else ensureRunning(refs);
}

/** Initialize the cursor's session lifecycle. An explicit `focusKey`
 *  (a look-up jump from a work) wins: the sky opens centered on that
 *  star. Absent a focus, the default path restores or demonstrates.
 *  Returns a cleanup that persists the cursor and tears down listeners
 *  — composes inside the hook's mount effect. */
function setupCursorLifecycle(
  state: NavState,
  refs: RuntimeRefs,
  nodes: readonly NavigableNode[],
  focusKey?: string,
): () => void {
  const focusNode = focusKey ? (nodes.find((n) => n.key === focusKey) ?? null) : null;
  if (focusNode) {
    focusCursorOnNode(state, refs, focusNode);
  } else {
    setupDefaultCursor(state, refs, nodes);
  }
  const persistOnHide = () => persistCursorPos(state.pos);
  globalThis.addEventListener?.('pagehide', persistOnHide);
  globalThis.addEventListener?.('visibilitychange', persistOnHide);
  return () => {
    cancelPendingDemo(state);
    globalThis.removeEventListener?.('pagehide', persistOnHide);
    globalThis.removeEventListener?.('visibilitychange', persistOnHide);
    persistCursorPos(state.pos);
  };
}

/** The default cursor lifecycle, absent an explicit focus: restore the
 *  last settled position from sessionStorage, or (first visit) schedule
 *  the demonstration drift after the carpet roll. Reduced motion snaps
 *  without running the loop. */
function setupDefaultCursor(
  state: NavState,
  refs: RuntimeRefs,
  nodes: readonly NavigableNode[],
): void {
  const restored = readPersistedCursorPos();
  if (restored) {
    applyRestoredCursor(state, restored);
    if (prefersReducedMotion()) {
      // Reduced-motion: no integrator loop runs, so the DOM stars
      // would stay at their initial Phase-B static projection
      // while state.currentCamera reflects the restored
      // camera — pointer hit-testing would then resolve to wrong
      // nodes. Project once so the visual matches the restored
      // state. (Codex review on PR #37 flagged this.)
      projectScene(state, refs);
    } else {
      ensureRunning(refs);
    }
  } else if (prefersReducedMotion()) {
    const node = demoTarget(state, nodes);
    if (node) {
      state.pos.x = node.unitPos.x;
      state.pos.y = node.unitPos.y;
      state.pos.z = node.unitPos.z;
      state.cameraSurfacePos.x = node.unitPos.x;
      state.cameraSurfacePos.y = node.unitPos.y;
      state.cameraSurfacePos.z = node.unitPos.z;
      state.currentCamera = orbitalCamera(node.unitPos);
      state.currentBasis = cameraBasis(state.currentCamera);
      flipActive(state, node.key, refs.setActiveKey);
      // Same reason as the restored branch above — the integrator
      // doesn't run in reduced motion, so the DOM needs a single
      // explicit projection.
      projectScene(state, refs);
    }
  } else {
    const durationMs = hasVisitedBefore() ? DEMO_FAST_DURATION_MS : DEMO_FULL_DURATION_MS;
    state.demoTimeoutId = setTimeout(() => {
      state.demoTimeoutId = null;
      if (state.demoDrift !== null || state.mode !== 'free') return;
      const node = demoTarget(state, nodes);
      if (!node) return;
      startDemoDrift(state, node.unitPos, durationMs);
      ensureRunning(refs);
    }, DEMO_DELAY_MS);
  }
}

/** Begin a demonstration drift toward `target` over `durationMs`.
 *  Captures the current pos as the drift's startPos. Extracted from
 *  the schedule effect so the React-Compiler immutability rule
 *  doesn't flag inline state mutation in useEffect. */
function startDemoDrift(state: NavState, target: UnitVector3, durationMs: number): void {
  state.demoDrift = {
    startPos: unitVector(state.pos.x, state.pos.y, state.pos.z),
    target,
    startTime: globalThis.performance.now(),
    durationMs,
  };
}

/** Apply a restored cursor position to the state. Mutates pos,
 *  cameraSurfacePos, currentCamera, currentBasis, and seeds the
 *  trail history at the restored point so the first frame after
 *  wake-up doesn't render a streak. Extracted so the on-mount
 *  restore effect doesn't mutate state inline (which the
 *  React-Compiler lint rule flags). */
function applyRestoredCursor(state: NavState, restored: UnitVector3): void {
  state.pos.x = restored.x;
  state.pos.y = restored.y;
  state.pos.z = restored.z;
  state.cameraSurfacePos.x = restored.x;
  state.cameraSurfacePos.y = restored.y;
  state.cameraSurfacePos.z = restored.z;
  state.currentCamera = orbitalCamera(restored);
  state.currentBasis = cameraBasis(state.currentCamera);
  for (const entry of state.trailHistory) {
    entry.x = restored.x;
    entry.y = restored.y;
    entry.z = restored.z;
  }
}

function computeAccelerationInto(state: NavState, refs: RuntimeRefs): void {
  const pos: UnitVector3 = state.pos;
  const well = sphericalWellForce(pos, refs.nodesRef.current);
  const out = state.accelBuffer;
  out.x = well.x;
  out.y = well.y;
  out.z = well.z;
  if (state.mode === 'dragging' && state.dragTarget) {
    const tangent = tangentTowards(pos, state.dragTarget);
    const distance = geodesicDistance(pos, state.dragTarget);
    out.x += DRAG_SPRING * tangent.x * distance - DRAG_DAMPING * state.vel.x;
    out.y += DRAG_SPRING * tangent.y * distance - DRAG_DAMPING * state.vel.y;
    out.z += DRAG_SPRING * tangent.z * distance - DRAG_DAMPING * state.vel.z;
  } else {
    out.x -= FREE_DAMPING * state.vel.x;
    out.y -= FREE_DAMPING * state.vel.y;
    out.z -= FREE_DAMPING * state.vel.z;
    const hold = tangentHoldDirection(state.heldKeys, state.currentBasis, pos);
    out.x += HOLD_ACCEL * hold.x;
    out.y += HOLD_ACCEL * hold.y;
    out.z += HOLD_ACCEL * hold.z;
  }
}

/** Re-project every star, thread, the cursor's glyph, and the
 *  ghost trail through the state's live camera. Each sub-mutation
 *  lives in @/shared/dom/skyProjector; this helper composes them in
 *  the order the layers expect. */
function projectScene(state: NavState, refs: RuntimeRefs): void {
  const cameraGroup = refs.cameraRef.current;
  if (!cameraGroup) return;
  const { currentCamera: camera, currentBasis: basis } = state;
  const viewboxSize = refs.viewboxSize;
  projectStars(cameraGroup, refs.nodesRef.current, camera, basis, viewboxSize);
  projectThreads(cameraGroup, refs.edgesRef.current, camera, basis, viewboxSize);
  const cursorProj = projectGlyph(refs.glyphRef.current, state.pos, camera, basis, viewboxSize);
  projectTrail(cameraGroup, state.trailHistory, camera, basis, viewboxSize);
  broadcastCursorToFirmament(cursorProj, viewboxSize);
  broadcastCameraToFirmament(camera, basis);
}

/** Project velocity back onto the tangent plane at the current pos,
 *  shedding any radial drift. Mutates in place (no allocation) — the
 *  hot path runs this twice a tick. */
function retangentVelocity(state: NavState): void {
  const dot = state.vel.x * state.pos.x + state.vel.y * state.pos.y + state.vel.z * state.pos.z;
  state.vel.x -= dot * state.pos.x;
  state.vel.y -= dot * state.pos.y;
  state.vel.z -= dot * state.pos.z;
}

/** Integrate the navigation physics one tick: acceleration → tangent
 *  velocity → step on the sphere. Mutates state.vel and state.pos in
 *  place. The caller has already computed dt and decided physics
 *  (vs. demo drift) is the right path. */
function integratePhysics(state: NavState, refs: RuntimeRefs, dt: number): void {
  computeAccelerationInto(state, refs);
  state.vel.x += state.accelBuffer.x * dt;
  state.vel.y += state.accelBuffer.y * dt;
  state.vel.z += state.accelBuffer.z * dt;
  const speed2 = state.vel.x * state.vel.x + state.vel.y * state.vel.y + state.vel.z * state.vel.z;
  if (speed2 > MAX_ANGULAR_VELOCITY * MAX_ANGULAR_VELOCITY) {
    const scale = MAX_ANGULAR_VELOCITY / Math.sqrt(speed2);
    state.vel.x *= scale;
    state.vel.y *= scale;
    state.vel.z *= scale;
  }
  retangentVelocity(state); // shed radial drift before stepping
  const next = stepOnSphere(state.pos, state.vel, dt);
  state.pos.x = next.x;
  state.pos.y = next.y;
  state.pos.z = next.z;
}

/** Slide the trail history forward one step: index 0 receives the
 *  current pos; older entries shift down. Allocation-free. */
function shiftTrailHistory(state: NavState): void {
  const tr = state.trailHistory;
  for (let i = tr.length - 1; i >= 1; i--) {
    tr[i]!.x = tr[i - 1]!.x;
    tr[i]!.y = tr[i - 1]!.y;
    tr[i]!.z = tr[i - 1]!.z;
  }
  tr[0]!.x = state.pos.x;
  tr[0]!.y = state.pos.y;
  tr[0]!.z = state.pos.z;
}

function isAtRest(state: NavState, accel: Vec3): boolean {
  if (state.mode !== 'free' || state.heldKeys.size > 0) return false;
  if (state.demoDrift !== null) return false;
  const speed2 = state.vel.x * state.vel.x + state.vel.y * state.vel.y + state.vel.z * state.vel.z;
  if (speed2 > IDLE_VELOCITY_EPSILON * IDLE_VELOCITY_EPSILON) return false;
  const accel2 = accel.x * accel.x + accel.y * accel.y + accel.z * accel.z;
  return accel2 <= IDLE_ACCELERATION_EPSILON * IDLE_ACCELERATION_EPSILON;
}

/** Advance an in-flight demo drift by one tick. The cursor slerps
 *  along the great-circle arc from the drift's startPos to its
 *  target, eased by easeOutCubic on the parameter t. Velocity is
 *  zero throughout (no integration). When t reaches 1, the drift
 *  completes and demoDrift is cleared. The visitor's first lesson
 *  in *the cursor is mine, and it can travel.* */
function advanceDemoDrift(state: NavState, now: number): void {
  const drift = state.demoDrift;
  if (!drift) return;
  const t = Math.min(1, Math.max(0, (now - drift.startTime) / drift.durationMs));
  const eased = easeOutCubic(t);
  const next = slerp(drift.startPos, drift.target, eased);
  state.pos.x = next.x;
  state.pos.y = next.y;
  state.pos.z = next.z;
  state.vel.x = 0;
  state.vel.y = 0;
  state.vel.z = 0;
  if (t >= 1) state.demoDrift = null;
}

/** Settle assist: claimed, slow, and free → ease onto the node and
 *  bleed the residual velocity, so arrival is an ending rather than
 *  a long negotiation between neighboring wells. Returns whether
 *  the assist is active this tick (the rest check builds on it). */
function applySettleAssist(
  state: NavState,
  refs: RuntimeRefs,
  nearest: { key: string; distance: number } | null,
  speed2: number,
  dt: number,
): boolean {
  const settling =
    nearest !== null &&
    state.mode === 'free' &&
    state.heldKeys.size === 0 &&
    state.demoDrift === null &&
    speed2 < SETTLE_SPEED * SETTLE_SPEED;
  if (!settling) return false;
  const node = refs.nodesRef.current.find((n) => n.key === nearest.key);
  if (!node) return false;
  const eased = slerp(state.pos, node.unitPos, 1 - Math.exp(-SETTLE_RATE * dt));
  state.pos.x = eased.x;
  state.pos.y = eased.y;
  state.pos.z = eased.z;
  const damp = Math.exp(-SETTLE_RATE * dt);
  state.vel.x *= damp;
  state.vel.y *= damp;
  state.vel.z *= damp;
  return true;
}

/**
 * One RAF tick of the constellation's navigation: read input state,
 * advance physics or demo drift, shift the trail, settle the active
 * well, write style channels, slerp the camera, project the scene,
 * apply yaw, and either schedule the next frame or rest.
 *
 * @bigO Time per tick: O(N + E) — dominated by sphericalWellForce
 *       (N), geodesicNearestNode (N), projectStars (N),
 *       projectThreads (E), projectTrail (constant), and the
 *       constant-time camera/yaw work. Hot path: 60fps when
 *       interactive. Don't introduce per-tick allocations or
 *       per-tick non-bounded passes (e.g. an O(N²) similarity
 *       check, an O(E) edge precompute that rebuilds each tick).
 *       Space: O(1) per tick — every buffer is preallocated.
 */
function tick(now: number, refs: RuntimeRefs): void {
  const state = refs.stateRef.current;
  // Two clocks: the force integrator clamps its step (an unbounded
  // dt teleports the cursor after a hitch or hidden-tab return),
  // but the exponential eases — camera lag, settle assist — are
  // unconditionally stable and must use real time, or a low-fps
  // device plays the whole arrival in slow motion.
  const dtReal = state.lastTime === 0 ? 0 : (now - state.lastTime) / 1000;
  const dt = Math.min(dtReal, MAX_DT_SECONDS);
  state.lastTime = now;

  // Demonstration drift suspends the physics integrator and slerps
  // along its predetermined arc. Acceleration is still computed (so
  // isAtRest's accel check remains honest) but doesn't drive pos.
  if (state.demoDrift !== null) {
    advanceDemoDrift(state, now);
    computeAccelerationInto(state, refs);
  } else {
    integratePhysics(state, refs, dt);
  }
  const accel = state.accelBuffer;
  const speed2 = state.vel.x * state.vel.x + state.vel.y * state.vel.y + state.vel.z * state.vel.z;

  shiftTrailHistory(state);
  retangentVelocity(state); // re-tangent against the new position too

  const nearest = geodesicNearestNode(state.pos, refs.nodesRef.current, WELL_RADIUS_RAD);
  if (nearest) flipActive(state, nearest.key, refs.setActiveKey);

  const settling = applySettleAssist(state, refs, nearest, speed2, dtReal);

  const claim = nearest ? 1 - clamp(nearest.distance / WELL_RADIUS_RAD, 0, 1) : 0;
  writeGlyphChannels(refs.glyphRef.current, claim, Math.sqrt(speed2));

  // Slerp the camera's surface point toward the cursor with a
  // damped catch-up rate. The camera *trails* the cursor: when the
  // visitor flicks, the cursor leads, the camera takes a beat to
  // follow, and the projected scene visibly shifts toward where
  // the visitor is reaching. Settled state: glyph at center, world
  // centered on the active well's projection.
  const lagT = 1 - Math.exp(-CAMERA_LAG_RATE * dtReal);
  const slerped = slerp(state.cameraSurfacePos, state.pos, lagT);
  state.cameraSurfacePos.x = slerped.x;
  state.cameraSurfacePos.y = slerped.y;
  state.cameraSurfacePos.z = slerped.z;
  // Ease the passive look offset toward its cursor-driven target, then
  // peer the orbital camera by it. The eased camera carries the whole
  // scene — SVG stars, glyph, threads, and the WebGL dome (which reads
  // currentCamera) — so the parallax is one coherent depth, not a
  // layered fake.
  const lookT = 1 - Math.exp(-LOOK_EASE_RATE * dtReal);
  state.look.x += (state.lookTarget.x - state.look.x) * lookT;
  state.look.y += (state.lookTarget.y - state.look.y) * lookT;
  state.currentCamera = applyCameraLook(
    orbitalCamera(state.cameraSurfacePos),
    state.look.x * MAX_LOOK_RAD,
    state.look.y * MAX_LOOK_RAD,
  );
  state.currentBasis = cameraBasis(state.currentCamera);

  // Re-project the entire scene through the live camera and write
  // back to the DOM. Stars get a transform attribute on their
  // wrapper group; threads get x1/y1/x2/y2 on their line element;
  // the glyph rides the cursor's projected screen position.
  projectScene(state, refs);

  if (refs.cameraRef.current) {
    const screenVelX =
      state.vel.x * state.currentBasis.right.x +
      state.vel.y * state.currentBasis.right.y +
      state.vel.z * state.currentBasis.right.z;
    const yaw = clamp(screenVelX * YAW_VELOCITY_SCALE * 0.001, -MAX_YAW_DEG, MAX_YAW_DEG);
    applyCameraYaw(refs.cameraRef.current, yaw);
  }

  // Rest: either the classic full-stillness check, or — settled
  // inside a well and pinned to its node — rest there exactly. The
  // exact snap makes the persisted cursor idempotent (restore lands
  // on the node, not on the well's historical entry point) and lets
  // the camera, the projector, and the atmosphere's calm cadence
  // all actually stop.
  const pinned =
    settling &&
    nearest !== null &&
    nearest.distance < SETTLE_REST_RAD &&
    speed2 <= IDLE_VELOCITY_EPSILON * IDLE_VELOCITY_EPSILON;
  if (pinned) {
    const node = refs.nodesRef.current.find((n) => n.key === nearest.key);
    if (node) {
      state.pos.x = node.unitPos.x;
      state.pos.y = node.unitPos.y;
      state.pos.z = node.unitPos.z;
    }
  }
  // The camera must finish its catch-up before the loop sleeps, or
  // the world freezes mid-trail and wakes with a visible jump.
  const cameraSettled = geodesicDistance(state.cameraSurfacePos, state.pos) < 0.005;
  // The mouse-look peer must reach its target before the loop sleeps —
  // resting mid-ease would freeze the camera and wake with a jump. A
  // held peer (steady non-zero target) settles and rests fine.
  const lookSettled =
    Math.abs(state.look.x - state.lookTarget.x) < LOOK_REST_EPSILON &&
    Math.abs(state.look.y - state.lookTarget.y) < LOOK_REST_EPSILON;
  if (
    (pinned ||
      (speed2 <= IDLE_VELOCITY_EPSILON * IDLE_VELOCITY_EPSILON && isAtRest(state, accel))) &&
    cameraSettled &&
    lookSettled &&
    state.mode === 'free' &&
    state.heldKeys.size === 0
  ) {
    state.vel.x = 0;
    state.vel.y = 0;
    state.vel.z = 0;
    state.raf = null;
    persistCursorPos(state.pos);
    return;
  }
  state.raf = globalThis.requestAnimationFrame((t) => tick(t, refs));
}

function ensureRunning(refs: RuntimeRefs): void {
  const state = refs.stateRef.current;
  if (state.raf !== null) return;
  state.lastTime = 0;
  state.raf = globalThis.requestAnimationFrame((t) => tick(t, refs));
}

function focusNodeByKey(key: string): void {
  if (typeof document === 'undefined') return;
  const handle = document.querySelector<SVGElement | HTMLElement>(`[data-node-key="${key}"] a`);
  handle?.focus();
}

function handlePointerDown(refs: RuntimeRefs, e: PointerEvent<SVGSVGElement>): void {
  const state = refs.stateRef.current;
  // First real interaction. Cancel any in-flight demo drift AND
  // any pending demo-drift timeout so the visitor's input wins
  // immediately. Mark the visit so future sessions skip the full
  // demo.
  state.demoDrift = null;
  cancelPendingDemo(state);
  markVisited();
  // The press is provisional: no capture, no physics. A tap stays a
  // tap (the anchor's click fires natively); only movement past the
  // threshold promotes it into a drag — see handlePointerMove.
  state.press = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY };
  if (prefersReducedMotion()) {
    const pt = pointerToSphere(e, state.currentCamera, state.currentBasis);
    if (!pt) return;
    const nearest = geodesicNearestNode(pt, refs.nodesRef.current);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
  }
}

/** Promote a threshold-crossing press into a real drag: capture the
 *  pointer (clicks stop mattering from here), seed the spring's
 *  target and the flick sampler, and wake the integrator. */
function promoteToDrag(refs: RuntimeRefs, e: PointerEvent<SVGSVGElement>, pt: UnitVector3): void {
  const state = refs.stateRef.current;
  state.press = null;
  state.mode = 'dragging';
  // The peer stands down for the drag: the target eases to center so
  // the spring's ray-casting reads a settling camera, not a peered one.
  state.lookTarget.x = 0;
  state.lookTarget.y = 0;
  state.dragTarget = pt;
  state.pointerId = e.pointerId;
  state.pointerSamples = [{ time: globalThis.performance.now(), pos: pt }];
  e.currentTarget.setPointerCapture(e.pointerId);
  ensureRunning(refs);
}

function handlePointerMove(refs: RuntimeRefs, e: PointerEvent<SVGSVGElement>): void {
  const state = refs.stateRef.current;
  if (state.mode === 'dragging' && state.pointerId === e.pointerId) {
    const pt = pointerToSphere(e, state.currentCamera, state.currentBasis);
    if (!pt) return;
    state.dragTarget = pt;
    const now = globalThis.performance.now();
    state.pointerSamples.push({ time: now, pos: pt });
    pruneSamples(state.pointerSamples, now, VELOCITY_SAMPLE_WINDOW_MS);
    return;
  }
  // Free hover (no press pending, not dragging): drive the passive
  // mouse-look peer toward the cursor's position in the frame. Skipped
  // under reduced motion — the loop doesn't run, so there's nothing to
  // ease. A pending press stands the peer down (it may become a drag).
  if (state.mode === 'free' && state.press === null && !prefersReducedMotion()) {
    const bounds = e.currentTarget.getBoundingClientRect();
    if (bounds.width > 0 && bounds.height > 0) {
      // Inverted: moving the cursor toward an edge leans the camera the
      // *other* way, so the gesture reads as "head toward what I'm
      // reaching for" — the world swings to bring it forward — rather
      // than peering away from it. (Danny: the peer's impact on where
      // to head should be inverse.)
      state.lookTarget.x = -(((e.clientX - bounds.left) / bounds.width) * 2 - 1);
      state.lookTarget.y = ((e.clientY - bounds.top) / bounds.height) * 2 - 1;
      ensureRunning(refs);
    }
    return;
  }
  if (state.press?.pointerId !== e.pointerId) return;
  if (prefersReducedMotion()) {
    // Same destinations, different choreography: while pressed, the
    // claim follows the pointer by nearest-node snap.
    const pt = pointerToSphere(e, state.currentCamera, state.currentBasis);
    if (!pt) return;
    const nearest = geodesicNearestNode(pt, refs.nodesRef.current);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
    return;
  }
  const dx = e.clientX - state.press.clientX;
  const dy = e.clientY - state.press.clientY;
  if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
  const pt = pointerToSphere(e, state.currentCamera, state.currentBasis);
  if (!pt) {
    state.press = null;
    return;
  }
  promoteToDrag(refs, e, pt);
}

function handlePointerUp(refs: RuntimeRefs, e: PointerEvent<SVGSVGElement>): void {
  const state = refs.stateRef.current;
  if (state.press?.pointerId === e.pointerId) {
    // A tap: the press never promoted. Let the browser deliver the
    // click to the star's anchor — opening a work is the click's
    // job, traveling is the drag's.
    state.press = null;
    return;
  }
  if (state.pointerId !== e.pointerId) return;
  if (prefersReducedMotion()) {
    const target = state.dragTarget ?? unitVector(state.pos.x, state.pos.y, state.pos.z);
    const nearest = geodesicNearestNode(target, refs.nodesRef.current);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
  } else {
    const v = flickAngularVelocity(state.pointerSamples);
    state.vel.x += v.x * FLICK_SCALE;
    state.vel.y += v.y * FLICK_SCALE;
    state.vel.z += v.z * FLICK_SCALE;
    const speed2 =
      state.vel.x * state.vel.x + state.vel.y * state.vel.y + state.vel.z * state.vel.z;
    if (speed2 > MAX_ANGULAR_VELOCITY * MAX_ANGULAR_VELOCITY) {
      const scale = MAX_ANGULAR_VELOCITY / Math.sqrt(speed2);
      state.vel.x *= scale;
      state.vel.y *= scale;
      state.vel.z *= scale;
    }
  }
  state.mode = 'free';
  state.dragTarget = null;
  state.pointerId = null;
  state.pointerSamples = [];
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
  if (!prefersReducedMotion()) ensureRunning(refs);
}

/** Pointer left the sky: return the mouse-look peer to center so the
 *  camera relaxes when the visitor's attention leaves. A no-op mid-
 *  drag — the captured pointer keeps delivering moves, and the drag
 *  owns the camera until release. */
function handlePointerLeave(refs: RuntimeRefs): void {
  const state = refs.stateRef.current;
  if (state.mode === 'dragging') return;
  state.lookTarget.x = 0;
  state.lookTarget.y = 0;
  if (!prefersReducedMotion()) ensureRunning(refs);
}

function handleKeyDown(refs: RuntimeRefs, e: KeyboardEvent): void {
  if (!ARROW_KEYS.has(e.key)) return;
  e.preventDefault();
  const state = refs.stateRef.current;
  // Same as pointerdown: any visitor input wins over an in-flight
  // demo (and any pending demo-drift timeout), and the visit is
  // marked so future sessions skip the full demo.
  state.demoDrift = null;
  cancelPendingDemo(state);
  markVisited();
  if (!prefersReducedMotion()) {
    state.heldKeys.add(e.key);
    ensureRunning(refs);
    return;
  }
  const next = geodesicNeighborInDirection(
    state.activeKey,
    refs.nodesRef.current,
    e.key,
    state.currentBasis,
  );
  if (!next) return;
  state.pos.x = next.unitPos.x;
  state.pos.y = next.unitPos.y;
  state.pos.z = next.unitPos.z;
  state.vel.x = 0;
  state.vel.y = 0;
  state.vel.z = 0;
  flipActive(state, next.key, refs.setActiveKey);
  focusNodeByKey(next.key);
}

function handleKeyUp(refs: RuntimeRefs, e: KeyboardEvent): void {
  if (!ARROW_KEYS.has(e.key)) return;
  refs.stateRef.current.heldKeys.delete(e.key);
}

function buildInitialState(): NavState {
  // Cursor and camera both begin at the polestar — the still center
  // of the constellation, what the visitor finds when they first
  // look up. Live camera + basis are computed from the surface point
  // so first paint matches the rest of the scene before the loop
  // wakes up. The trail history is initialized to the polestar so
  // the first frame after wake-up doesn't render ghosts at random
  // positions before the shift cycle has filled them.
  const startPos: UnitVector3 = { ...NORTH_POLE };
  const initialCamera = orbitalCamera(startPos);
  const trailHistory: MutableVec3[] = Array.from({ length: TRAIL_LENGTH }, () => ({
    x: startPos.x,
    y: startPos.y,
    z: startPos.z,
  }));
  return {
    pos: { x: startPos.x, y: startPos.y, z: startPos.z },
    vel: { x: 0, y: 0, z: 0 },
    mode: 'free',
    dragTarget: null,
    press: null,
    pointerSamples: [],
    pointerId: null,
    heldKeys: new Set(),
    lastTime: 0,
    raf: null,
    activeKey: null,
    accelBuffer: { x: 0, y: 0, z: 0 },
    look: { x: 0, y: 0 },
    lookTarget: { x: 0, y: 0 },
    cameraSurfacePos: { x: startPos.x, y: startPos.y, z: startPos.z },
    currentCamera: initialCamera,
    currentBasis: cameraBasis(initialCamera),
    trailHistory,
    demoDrift: null,
    demoTimeoutId: null,
  };
}

/** Cancel a pending demo-drift timeout, if any. Called from the
 *  input handlers and from the lifecycle cleanup so the
 *  scheduled drift can't fire after the visitor has already
 *  interacted (the race the codex review flagged on PR #37). */
function cancelPendingDemo(state: NavState): void {
  if (state.demoTimeoutId !== null) {
    clearTimeout(state.demoTimeoutId);
    state.demoTimeoutId = null;
  }
}

export function useConstellationNavigation({
  nodes,
  edges,
  viewboxSize,
  setActiveKey,
  cameraRef,
  glyphRef,
  focusKey,
}: UseConstellationNavigationArgs) {
  const stateRef = useRef<NavState>(buildInitialState());
  const nodesRef = useRef<readonly NavigableNode[]>(nodes);
  const edgesRef = useRef<readonly NavigableEdge[]>(edges);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    const state = stateRef.current;
    return () => {
      if (state.raf !== null) globalThis.cancelAnimationFrame(state.raf);
      state.raf = null;
      state.heldKeys.clear();
    };
  }, []);

  const refs: RuntimeRefs = {
    stateRef,
    nodesRef,
    edgesRef,
    cameraRef,
    glyphRef,
    viewboxSize,
    setActiveKey,
  };

  // Cursor session persistence. On mount, restore the last sphere
  // position the visitor settled on (within this session) and kick
  // a tick so the scene re-projects through the restored camera.
  // On pagehide / visibilitychange, persist the current position so
  // a refresh or an overlay round-trip lands the cursor where the
  // visitor left it. flipActive also persists on every basin claim
  // so the saved value tracks live state.
  useEffect(() => {
    const state = stateRef.current;
    const lifecycleRefs: RuntimeRefs = {
      stateRef,
      nodesRef,
      edgesRef,
      cameraRef,
      glyphRef,
      viewboxSize,
      setActiveKey,
    };
    return setupCursorLifecycle(state, lifecycleRefs, nodesRef.current, focusKey);
  }, [cameraRef, glyphRef, viewboxSize, setActiveKey, focusKey]);

  return {
    dragHandlers: {
      onPointerDown: (e: PointerEvent<SVGSVGElement>) => handlePointerDown(refs, e),
      onPointerMove: (e: PointerEvent<SVGSVGElement>) => handlePointerMove(refs, e),
      onPointerUp: (e: PointerEvent<SVGSVGElement>) => handlePointerUp(refs, e),
      onPointerCancel: (e: PointerEvent<SVGSVGElement>) => handlePointerUp(refs, e),
      onPointerLeave: () => handlePointerLeave(refs),
    },
    onKeyDown: (e: KeyboardEvent) => handleKeyDown(refs, e),
    onKeyUp: (e: KeyboardEvent) => handleKeyUp(refs, e),
  };
}
