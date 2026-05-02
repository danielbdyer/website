import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { cameraBasis, unproject } from '@/shared/geometry/camera';
import {
  TRAIL_LENGTH,
  applyCameraYaw,
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
}

// Hook-local physics tuning. The well-field constants
// (INFLUENCE_RADIUS_RAD, WELL_RADIUS_RAD, WELL_STIFFNESS,
// MAX_ANGULAR_VELOCITY, VELOCITY_SAMPLE_WINDOW_MS) live in
// @/shared/geometry/wellPhysics — this file imports the ones it
// needs. The constants below tune the visitor's input gestures
// against the well field and only matter at the hook boundary.
const DRAG_SPRING = 60;
const DRAG_DAMPING = 14;
const FREE_DAMPING = 4;
const HOLD_ACCEL = 5.5;
const FLICK_SCALE = 1;
const MAX_DT_SECONDS = 0.033;
const IDLE_VELOCITY_EPSILON = 0.005;
const IDLE_ACCELERATION_EPSILON = 0.04;

// Camera orbit constants. The camera sits at -ORBIT_DISTANCE *
// cameraSurfacePos and looks at origin — so the surface point lands
// near image center. cameraSurfacePos slerps toward state.pos with
// a damped catch-up rate, which means the camera *trails* the
// cursor: when the visitor flicks, the cursor leads, the glyph
// drifts off-center, the world re-projects toward where the visitor
// is reaching. Settled state: glyph at center, world centered on
// the active well.
const ORBIT_DISTANCE = 2.5;
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

interface MutableVec3 {
  x: number;
  y: number;
  z: number;
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
  pointerSamples: PointerSample[];
  pointerId: number | null;
  heldKeys: Set<string>;
  lastTime: number;
  raf: number | null;
  activeKey: string | null;
  accelBuffer: MutableVec3;
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
  e: PointerEvent<SVGGElement>,
  camera: Camera,
  basis: CameraBasis,
): UnitVector3 | null {
  const svg = e.currentTarget.ownerSVGElement;
  if (!svg) return null;
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

/** Initialize the cursor's session lifecycle: restore from
 *  sessionStorage if present, otherwise schedule a demonstration
 *  drift after the carpet roll. Returns a cleanup that persists
 *  the cursor and tears down listeners — composes inside the
 *  hook's mount effect. */
function setupCursorLifecycle(
  state: NavState,
  refs: RuntimeRefs,
  nodes: readonly NavigableNode[],
): () => void {
  const restored = readPersistedCursorPos();
  let demoTimeout: ReturnType<typeof setTimeout> | null = null;
  if (restored) {
    applyRestoredCursor(state, restored);
    if (!prefersReducedMotion()) ensureRunning(refs);
  } else if (prefersReducedMotion()) {
    const node = demoTarget(state, nodes);
    if (node) {
      state.pos.x = node.unitPos.x;
      state.pos.y = node.unitPos.y;
      state.pos.z = node.unitPos.z;
      state.cameraSurfacePos.x = node.unitPos.x;
      state.cameraSurfacePos.y = node.unitPos.y;
      state.cameraSurfacePos.z = node.unitPos.z;
      flipActive(state, node.key, refs.setActiveKey);
    }
  } else {
    const durationMs = hasVisitedBefore() ? DEMO_FAST_DURATION_MS : DEMO_FULL_DURATION_MS;
    demoTimeout = setTimeout(() => {
      if (state.demoDrift !== null || state.mode !== 'free') return;
      const node = demoTarget(state, nodes);
      if (!node) return;
      startDemoDrift(state, node.unitPos, durationMs);
      ensureRunning(refs);
    }, DEMO_DELAY_MS);
  }
  const persistOnHide = () => persistCursorPos(state.pos);
  globalThis.addEventListener?.('pagehide', persistOnHide);
  globalThis.addEventListener?.('visibilitychange', persistOnHide);
  return () => {
    if (demoTimeout !== null) clearTimeout(demoTimeout);
    globalThis.removeEventListener?.('pagehide', persistOnHide);
    globalThis.removeEventListener?.('visibilitychange', persistOnHide);
    persistCursorPos(state.pos);
  };
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
  // Re-tangent against radial drift before stepping.
  const dotVP = state.vel.x * state.pos.x + state.vel.y * state.pos.y + state.vel.z * state.pos.z;
  state.vel.x -= dotVP * state.pos.x;
  state.vel.y -= dotVP * state.pos.y;
  state.vel.z -= dotVP * state.pos.z;
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
  const dt = state.lastTime === 0 ? 0 : Math.min((now - state.lastTime) / 1000, MAX_DT_SECONDS);
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

  // Re-tangent velocity to the new position too.
  const dotVP2 = state.vel.x * state.pos.x + state.vel.y * state.pos.y + state.vel.z * state.pos.z;
  state.vel.x -= dotVP2 * state.pos.x;
  state.vel.y -= dotVP2 * state.pos.y;
  state.vel.z -= dotVP2 * state.pos.z;

  const nearest = geodesicNearestNode(state.pos, refs.nodesRef.current, WELL_RADIUS_RAD);
  if (nearest) flipActive(state, nearest.key, refs.setActiveKey);

  const claim = nearest ? 1 - clamp(nearest.distance / WELL_RADIUS_RAD, 0, 1) : 0;
  writeGlyphChannels(refs.glyphRef.current, claim, Math.sqrt(speed2));

  // Slerp the camera's surface point toward the cursor with a
  // damped catch-up rate. The camera *trails* the cursor: when the
  // visitor flicks, the cursor leads, the camera takes a beat to
  // follow, and the projected scene visibly shifts toward where
  // the visitor is reaching. Settled state: glyph at center, world
  // centered on the active well's projection.
  const lagT = 1 - Math.exp(-CAMERA_LAG_RATE * dt);
  const slerped = slerp(state.cameraSurfacePos, state.pos, lagT);
  state.cameraSurfacePos.x = slerped.x;
  state.cameraSurfacePos.y = slerped.y;
  state.cameraSurfacePos.z = slerped.z;
  state.currentCamera = orbitalCamera(state.cameraSurfacePos);
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

  // speed2 above is the post-step magnitude; vel hasn't been mutated
  // since, so it's the right value to gate the rest check on.
  if (
    state.mode === 'free' &&
    state.heldKeys.size === 0 &&
    speed2 <= IDLE_VELOCITY_EPSILON * IDLE_VELOCITY_EPSILON &&
    isAtRest(state, accel)
  ) {
    state.vel.x = 0;
    state.vel.y = 0;
    state.vel.z = 0;
    state.raf = null;
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

function handlePointerDown(refs: RuntimeRefs, e: PointerEvent<SVGGElement>): void {
  const state = refs.stateRef.current;
  const pt = pointerToSphere(e, state.currentCamera, state.currentBasis);
  if (!pt) return;
  // First real interaction. Cancel any in-flight demo drift so the
  // visitor's input wins immediately, and mark the visit so future
  // sessions skip the full demo.
  state.demoDrift = null;
  markVisited();
  state.mode = 'dragging';
  state.dragTarget = pt;
  state.pointerId = e.pointerId;
  state.pointerSamples = [{ time: globalThis.performance.now(), pos: pt }];
  e.currentTarget.setPointerCapture(e.pointerId);
  if (prefersReducedMotion()) {
    const nearest = geodesicNearestNode(pt, refs.nodesRef.current);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
    return;
  }
  ensureRunning(refs);
}

function handlePointerMove(refs: RuntimeRefs, e: PointerEvent<SVGGElement>): void {
  const state = refs.stateRef.current;
  if (state.mode !== 'dragging' || state.pointerId !== e.pointerId) return;
  const pt = pointerToSphere(e, state.currentCamera, state.currentBasis);
  if (!pt) return;
  state.dragTarget = pt;
  const now = globalThis.performance.now();
  state.pointerSamples.push({ time: now, pos: pt });
  pruneSamples(state.pointerSamples, now, VELOCITY_SAMPLE_WINDOW_MS);
  if (prefersReducedMotion()) {
    const nearest = geodesicNearestNode(pt, refs.nodesRef.current);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
  }
}

function handlePointerUp(refs: RuntimeRefs, e: PointerEvent<SVGGElement>): void {
  const state = refs.stateRef.current;
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

function handleKeyDown(refs: RuntimeRefs, e: KeyboardEvent): void {
  if (!ARROW_KEYS.has(e.key)) return;
  e.preventDefault();
  const state = refs.stateRef.current;
  // Same as pointerdown: any visitor input wins over an in-flight
  // demo, and the visit is marked so future sessions skip the
  // full demo.
  state.demoDrift = null;
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
    pointerSamples: [],
    pointerId: null,
    heldKeys: new Set(),
    lastTime: 0,
    raf: null,
    activeKey: null,
    accelBuffer: { x: 0, y: 0, z: 0 },
    cameraSurfacePos: { x: startPos.x, y: startPos.y, z: startPos.z },
    currentCamera: initialCamera,
    currentBasis: cameraBasis(initialCamera),
    trailHistory,
    demoDrift: null,
  };
}

export function useConstellationNavigation({
  nodes,
  edges,
  viewboxSize,
  setActiveKey,
  cameraRef,
  glyphRef,
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
    return setupCursorLifecycle(state, lifecycleRefs, nodesRef.current);
  }, [cameraRef, glyphRef, viewboxSize, setActiveKey]);

  return {
    dragHandlers: {
      onPointerDown: (e: PointerEvent<SVGGElement>) => handlePointerDown(refs, e),
      onPointerMove: (e: PointerEvent<SVGGElement>) => handlePointerMove(refs, e),
      onPointerUp: (e: PointerEvent<SVGGElement>) => handlePointerUp(refs, e),
      onPointerCancel: (e: PointerEvent<SVGGElement>) => handlePointerUp(refs, e),
    },
    onKeyDown: (e: KeyboardEvent) => handleKeyDown(refs, e),
    onKeyUp: (e: KeyboardEvent) => handleKeyUp(refs, e),
  };
}
