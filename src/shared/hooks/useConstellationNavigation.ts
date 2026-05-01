import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { cameraBasis, project, unproject } from '@/shared/geometry/camera';
import type { UnitVector3, Vec3 } from '@/shared/geometry/sphere';
import {
  NORTH_POLE,
  geodesicDistance,
  projectOntoTangentPlane,
  raySphereIntersect,
  slerp,
  stepOnSphere,
  tangentTowards,
  unitVector,
} from '@/shared/geometry/sphere';

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
//   - The basin field: every node radiates a tangent attractor
//     force that falls off with geodesic distance. Always on.
//     Between two nodes the pulls compete (the saddle); inside a
//     basin one wins (the local minimum). Friction lets a coasting
//     cursor settle into whatever basin its momentum carries it
//     into.
//
// `prefers-reduced-motion: reduce` short-circuits the loop and
// pointer/keyboard fall back to direct snap-to-nearest by geodesic
// distance. The graph is still navigable; it just stops moving.

export interface NavigableNode {
  readonly key: string;
  readonly unitPos: UnitVector3;
}

/** An edge in the navigable scene. The hook re-projects each
 *  endpoint per frame and writes the line element's x1/y1/x2/y2
 *  attributes. The id matches the rendered Thread's data-thread-id. */
export interface NavigableEdge {
  readonly id: string;
  readonly sourcePos: UnitVector3;
  readonly targetPos: UnitVector3;
}

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

// Force-field constants, in spherical units. Position is a unit
// vector on the sphere; "distance" is geodesic (radians along great
// circle). Velocity is angular (rad/s).
const INFLUENCE_RADIUS_RAD = 0.7;
const BASIN_RADIUS_RAD = 0.3;
const BASIN_STIFFNESS = 9;
const DRAG_SPRING = 60;
const DRAG_DAMPING = 14;
const FREE_DAMPING = 4;
const HOLD_ACCEL = 5.5;
const FLICK_SCALE = 1;
const MAX_ANGULAR_VELOCITY = 8;
const MAX_DT_SECONDS = 0.033;
const IDLE_VELOCITY_EPSILON = 0.005;
const IDLE_ACCELERATION_EPSILON = 0.04;
const VELOCITY_SAMPLE_WINDOW_MS = 120;

// Camera orbit constants. The camera sits at -ORBIT_DISTANCE *
// cameraSurfacePos and looks at origin — so the surface point lands
// near image center. cameraSurfacePos slerps toward state.pos with
// a damped catch-up rate, which means the camera *trails* the
// cursor: when the visitor flicks, the cursor leads, the glyph
// drifts off-center, the world re-projects toward where the visitor
// is reaching. Settled state: glyph at center, world centered on
// the active basin.
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

/** The closest node by geodesic distance, or null when nothing is
 *  within `maxRadians`. O(N) over the node list. Filters by dot
 *  product (cheap) before computing the geodesic (acos), since the
 *  two are monotonically related on the unit sphere. */
export function geodesicNearestNode(
  cursor: UnitVector3,
  nodes: readonly NavigableNode[],
  maxRadians = Math.PI,
): { key: string; distance: number } | null {
  // d ≤ maxRadians ⇔ cos(d) ≥ cos(maxRadians) ⇔ dot ≥ minDot.
  const minDot = maxRadians >= Math.PI ? -1 : Math.cos(maxRadians);
  let bestKey: string | null = null;
  let bestDot = -2; // strictly below any real dot value
  for (const node of nodes) {
    const dot = cursor.x * node.unitPos.x + cursor.y * node.unitPos.y + cursor.z * node.unitPos.z;
    if (dot < minDot) continue;
    if (dot <= bestDot) continue;
    bestDot = dot;
    bestKey = node.key;
  }
  if (bestKey === null) return null;
  return { key: bestKey, distance: Math.acos(clamp(bestDot, -1, 1)) };
}

/** Sum of tangent attractor forces at `pos` from every node within
 *  `influenceRadius` (radians). Each contribution is a unit tangent
 *  pointing toward the node, scaled by stiffness * shape(d) where
 *  shape is linear in geodesic distance and zero at the influence
 *  rim. The result is a tangent vector at `pos` — perpendicular to
 *  it by construction. */
export function sphericalBasinForce(
  pos: UnitVector3,
  nodes: readonly NavigableNode[],
  influenceRadius = INFLUENCE_RADIUS_RAD,
  stiffness = BASIN_STIFFNESS,
): Vec3 {
  // dot ≥ minDot ⇔ geodesic ≤ influenceRadius. The dot test is a
  // single multiply-add per node; full geodesicDistance only fires
  // for nodes inside the basin's reach.
  const minDot = influenceRadius >= Math.PI ? -1 : Math.cos(influenceRadius);
  let fx = 0;
  let fy = 0;
  let fz = 0;
  for (const node of nodes) {
    const dot = pos.x * node.unitPos.x + pos.y * node.unitPos.y + pos.z * node.unitPos.z;
    if (dot < minDot) continue;
    const d = geodesicDistance(pos, node.unitPos);
    if (d <= 1e-12) continue;
    const tangent = tangentTowards(pos, node.unitPos);
    const shape = 1 - d / influenceRadius;
    const magnitude = stiffness * d * shape;
    fx += tangent.x * magnitude;
    fy += tangent.y * magnitude;
    fz += tangent.z * magnitude;
  }
  return { x: fx, y: fy, z: fz };
}

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/** Tangent direction at `pos` synthesized from held arrow keys.
 *  Up/down map to ±camera-up projected onto the tangent plane;
 *  left/right map to ±camera-right. The result is normalized so
 *  pressing two keys diagonally produces unit-magnitude direction. */
export function tangentHoldDirection(
  heldKeys: ReadonlySet<string>,
  basis: CameraBasis,
  pos: UnitVector3,
): Vec3 {
  let upWeight = 0;
  let rightWeight = 0;
  if (heldKeys.has('ArrowUp')) upWeight += 1;
  if (heldKeys.has('ArrowDown')) upWeight -= 1;
  if (heldKeys.has('ArrowRight')) rightWeight += 1;
  if (heldKeys.has('ArrowLeft')) rightWeight -= 1;
  if (upWeight === 0 && rightWeight === 0) return { x: 0, y: 0, z: 0 };
  // Compose then re-tangent (project off the radial component) and
  // normalize so the magnitude is 1 regardless of how the basis
  // happens to align with the tangent plane.
  const wx = basis.up.x * upWeight + basis.right.x * rightWeight;
  const wy = basis.up.y * upWeight + basis.right.y * rightWeight;
  const wz = basis.up.z * upWeight + basis.right.z * rightWeight;
  const tangent = projectOntoTangentPlane({ x: wx, y: wy, z: wz }, pos);
  const m = Math.hypot(tangent.x, tangent.y, tangent.z);
  if (m < 1e-9) return { x: 0, y: 0, z: 0 };
  return { x: tangent.x / m, y: tangent.y / m, z: tangent.z / m };
}

interface PointerSample {
  time: number;
  pos: UnitVector3;
}

/** The gesture's release angular velocity, computed from pointer
 *  samples within the last `windowMs`. The result is a tangent
 *  vector at the most-recent sample's position. */
export function flickAngularVelocity(
  samples: readonly PointerSample[],
  windowMs = VELOCITY_SAMPLE_WINDOW_MS,
): Vec3 {
  if (samples.length < 2) return { x: 0, y: 0, z: 0 };
  const newest = samples.at(-1)!;
  const cutoff = newest.time - windowMs;
  const oldest = samples.find((s) => s.time >= cutoff) ?? samples[0]!;
  const dt = (newest.time - oldest.time) / 1000;
  if (dt <= 0) return { x: 0, y: 0, z: 0 };
  const v3 = {
    x: (newest.pos.x - oldest.pos.x) / dt,
    y: (newest.pos.y - oldest.pos.y) / dt,
    z: (newest.pos.z - oldest.pos.z) / dt,
  };
  return projectOntoTangentPlane(v3, newest.pos);
}

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

// Phase D2 retired the screen-space pan: the orbital camera handles
// where things move on screen by re-projecting through the live
// camera each frame. Yaw remains as a small flourish driven by the
// cursor's screen-space x velocity, written through --cam-yaw.
function applyCameraYaw(el: SVGGElement, yaw: number): void {
  el.style.setProperty('--cam-yaw', yaw.toFixed(2));
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
}

function computeAccelerationInto(state: NavState, refs: RuntimeRefs): void {
  const pos: UnitVector3 = state.pos;
  const basin = sphericalBasinForce(pos, refs.nodesRef.current);
  const out = state.accelBuffer;
  out.x = basin.x;
  out.y = basin.y;
  out.z = basin.z;
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

/** Project a 3D unit-sphere position into viewbox coords. Helper
 *  shared by the per-frame DOM mutation path. SVG +Y grows down,
 *  screen +Y grows up — the negation handles the convention shift. */
function projectToViewbox(
  point: UnitVector3,
  camera: Camera,
  basis: CameraBasis,
  viewboxSize: number,
): { x: number; y: number; inFront: boolean } {
  const proj = project(point, camera, basis, 1);
  const center = viewboxSize / 2;
  const radius = viewboxSize * 0.44;
  return {
    x: center + proj.screenX * radius,
    y: center - proj.screenY * radius,
    inFront: proj.inFront,
  };
}

/** Re-project every star, thread, and the cursor's glyph through
 *  the state's live camera and mutate the DOM accordingly. Stars
 *  get a transform="translate(x y)" attribute on their data-node-key
 *  wrapper group; threads get x1/y1/x2/y2 on their data-thread-id
 *  line; the glyph gets cx/cy. Behind-camera points (theoretically
 *  possible if a node sits on the far side of the sphere from the
 *  current camera target) are hidden by a translate-far-offscreen
 *  trick rather than added complexity in the DOM. */
function projectScene(state: NavState, refs: RuntimeRefs): void {
  const cameraGroup = refs.cameraRef.current;
  if (!cameraGroup) return;
  const camera = state.currentCamera;
  const basis = state.currentBasis;
  const viewboxSize = refs.viewboxSize;
  // Stars: outer transform attribute on the data-node-key wrapper.
  for (const node of refs.nodesRef.current) {
    const el = cameraGroup.querySelector(`[data-node-key="${node.key}"]`);
    if (!el) continue;
    const proj = projectToViewbox(node.unitPos, camera, basis, viewboxSize);
    el.setAttribute(
      'transform',
      proj.inFront
        ? `translate(${proj.x.toFixed(2)} ${proj.y.toFixed(2)})`
        : 'translate(-9999 -9999)',
    );
  }
  // Threads: x1/y1/x2/y2 on the data-thread-id line element.
  for (const edge of refs.edgesRef.current) {
    const el = cameraGroup.querySelector(`[data-thread-id="${edge.id}"]`);
    if (!el) continue;
    const ps = projectToViewbox(edge.sourcePos, camera, basis, viewboxSize);
    const pt = projectToViewbox(edge.targetPos, camera, basis, viewboxSize);
    el.setAttribute('x1', ps.x.toFixed(2));
    el.setAttribute('y1', ps.y.toFixed(2));
    el.setAttribute('x2', pt.x.toFixed(2));
    el.setAttribute('y2', pt.y.toFixed(2));
  }
  // Glyph rides the cursor's screen position — leads when the
  // camera lags, settles back to the active basin's projection
  // when the camera catches up.
  if (refs.glyphRef.current) {
    const proj = projectToViewbox(state.pos, camera, basis, viewboxSize);
    if (proj.inFront) {
      refs.glyphRef.current.setAttribute('cx', proj.x.toFixed(2));
      refs.glyphRef.current.setAttribute('cy', proj.y.toFixed(2));
    }
  }
}

function isAtRest(state: NavState, accel: Vec3): boolean {
  if (state.mode !== 'free' || state.heldKeys.size > 0) return false;
  const speed2 = state.vel.x * state.vel.x + state.vel.y * state.vel.y + state.vel.z * state.vel.z;
  if (speed2 > IDLE_VELOCITY_EPSILON * IDLE_VELOCITY_EPSILON) return false;
  const accel2 = accel.x * accel.x + accel.y * accel.y + accel.z * accel.z;
  return accel2 <= IDLE_ACCELERATION_EPSILON * IDLE_ACCELERATION_EPSILON;
}

function tick(now: number, refs: RuntimeRefs): void {
  const state = refs.stateRef.current;
  const dt = state.lastTime === 0 ? 0 : Math.min((now - state.lastTime) / 1000, MAX_DT_SECONDS);
  state.lastTime = now;

  computeAccelerationInto(state, refs);
  const accel = state.accelBuffer;

  // Integrate tangent velocity; clamp magnitude.
  state.vel.x += accel.x * dt;
  state.vel.y += accel.y * dt;
  state.vel.z += accel.z * dt;
  let speed2 = state.vel.x * state.vel.x + state.vel.y * state.vel.y + state.vel.z * state.vel.z;
  if (speed2 > MAX_ANGULAR_VELOCITY * MAX_ANGULAR_VELOCITY) {
    const scale = MAX_ANGULAR_VELOCITY / Math.sqrt(speed2);
    state.vel.x *= scale;
    state.vel.y *= scale;
    state.vel.z *= scale;
  }

  // Re-tangent: numerical drift accumulates a tiny radial component.
  // Project velocity back onto the tangent plane at the current pos.
  const dotVP = state.vel.x * state.pos.x + state.vel.y * state.pos.y + state.vel.z * state.pos.z;
  state.vel.x -= dotVP * state.pos.x;
  state.vel.y -= dotVP * state.pos.y;
  state.vel.z -= dotVP * state.pos.z;

  // Step on the sphere: small tangent step + re-normalize.
  const next = stepOnSphere(state.pos, state.vel, dt);
  state.pos.x = next.x;
  state.pos.y = next.y;
  state.pos.z = next.z;

  // Re-tangent velocity to the new position too.
  const dotVP2 = state.vel.x * state.pos.x + state.vel.y * state.pos.y + state.vel.z * state.pos.z;
  state.vel.x -= dotVP2 * state.pos.x;
  state.vel.y -= dotVP2 * state.pos.y;
  state.vel.z -= dotVP2 * state.pos.z;

  const nearest = geodesicNearestNode(state.pos, refs.nodesRef.current, BASIN_RADIUS_RAD);
  if (nearest) flipActive(state, nearest.key, refs.setActiveKey);

  // Slerp the camera's surface point toward the cursor with a
  // damped catch-up rate. The camera *trails* the cursor: when the
  // visitor flicks, the cursor leads, the camera takes a beat to
  // follow, and the projected scene visibly shifts toward where
  // the visitor is reaching.
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

  speed2 = state.vel.x * state.vel.x + state.vel.y * state.vel.y + state.vel.z * state.vel.z;
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

/** Reduced-motion fallback: a tap → jump to the nearest neighbor in
 *  the requested direction. Direction is decomposed against the
 *  camera basis at the active node's position so "right" feels like
 *  "right on the visitor's screen." */
export function geodesicNeighborInDirection(
  activeKey: string | null,
  nodes: readonly NavigableNode[],
  arrowKey: string,
  basis: CameraBasis,
): NavigableNode | null {
  const direction = tangentHoldDirection(new Set([arrowKey]), basis, NORTH_POLE);
  if (direction.x === 0 && direction.y === 0 && direction.z === 0) return null;
  const active = nodes.find((n) => n.key === activeKey);
  const origin = active?.unitPos ?? NORTH_POLE;
  let best: { node: NavigableNode; cost: number } | null = null;
  for (const candidate of nodes) {
    if (candidate.key === active?.key) continue;
    const tangent = tangentTowards(origin, candidate.unitPos);
    const along = tangent.x * direction.x + tangent.y * direction.y + tangent.z * direction.z;
    if (along <= 0) continue;
    const distance = geodesicDistance(origin, candidate.unitPos);
    const cost = distance / Math.max(along, 0.05);
    if (!best || cost < best.cost) best = { node: candidate, cost };
  }
  if (best) return best.node;
  return active ? null : (nodes[0] ?? null);
}

function handleKeyDown(refs: RuntimeRefs, e: KeyboardEvent): void {
  if (!ARROW_KEYS.has(e.key)) return;
  e.preventDefault();
  const state = refs.stateRef.current;
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
  // wakes up.
  const startPos: UnitVector3 = { ...NORTH_POLE };
  const initialCamera = orbitalCamera(startPos);
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
