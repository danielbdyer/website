import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import { cameraBasis, project } from '@/shared/geometry/camera';
import {
  buildElementCache,
  projectStars,
  projectThreads,
  type ElementCache,
  type NavigableEdge,
} from '@/shared/dom/skyProjector';
import {
  hasVisitedBefore,
  markVisited,
  persistCursorPos,
  readPersistedCursorPos,
} from '@/shared/state/cursorStorage';
import { setConstellationCursor } from '@/shared/state/constellationCursor';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { type NavigableNode } from '@/shared/geometry/wellPhysics';

// Trackball navigation across the constellation's latent sphere.
//
// The model is direct manipulation: the finger moves the globe.
// Drag horizontally → yaw. Drag vertically → pitch. The pitch is
// clamped to ±(π/2 - ε) so the camera never flips through the pole.
// On release, the recent angular delta becomes momentum that decays
// via friction. No per-star wells, no basin claims, no spring-toward-
// target — the visitor's gesture IS the rotation.
//
// CONSTELLATION_DESIGN.md §"Foundation — World-like navigation"
// names the principle. The first form (the basin/well system) chose
// a means that read as snappy and reactive — pretty stars, but the
// gesture didn't carry. This rewrite chooses a different means that
// keeps the principle: the visitor inhabits the surface by moving
// the world directly.
//
// `prefers-reduced-motion: reduce` short-circuits the animation
// loop; pointer drag still rotates 1:1, keyboard arrows step the
// view by a fixed angle. The graph is still navigable — it just
// doesn't carry momentum.
//
// What's held forward:
//   - First-visit demonstration drift (the visitor's first lesson).
//     The old basin-physics version doesn't translate; a trackball
//     equivalent (a quiet auto-orbit until first input) waits until
//     the new interaction has settled.
//   - The companion glyph + trail (the visitor's "body on the
//     sphere"). The body in the trackball model is the camera
//     itself; the screen center is the focal zone, indicated by
//     the polestar wash. No DOM marker needed.

// NavigableNode lives in @/shared/geometry/wellPhysics so the pure
// physics functions can stand alone. Re-exported here so existing
// consumers (Constellation organism, layout module) keep their
// import path stable.
export type { NavigableNode } from '@/shared/geometry/wellPhysics';

// NavigableEdge lives in @/shared/dom/skyProjector — it's a render-
// layer concern (x1/y1/x2/y2 written per tick), not a physics one.
// Re-exported here for the same import-path-stability reason.
export type { NavigableEdge } from '@/shared/dom/skyProjector';

interface UseConstellationNavigationArgs {
  readonly nodes: readonly NavigableNode[];
  readonly edges: readonly NavigableEdge[];
  readonly viewboxSize: number;
  readonly setActiveKey: (key: string) => void;
  readonly cameraRef: RefObject<SVGGElement | null>;
}

// Camera constants. The camera sits on a sphere of radius
// ORBIT_DISTANCE around the world origin and looks at origin. yaw
// rotates around world-up; pitch rotates around the camera's local
// right axis (clamped to avoid flipping through the pole).
const ORBIT_DISTANCE = 2.5;
const CAMERA_FOV_Y = Math.PI / 4;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 10;
const WORLD_UP: UnitVector3 = { x: 0, y: 1, z: 0 };

// Trackball tuning. Sensitivity maps screen pixels to angular
// motion; damping and the velocity cap shape the post-release
// momentum; the keyboard step is what one arrow press rotates the
// view by under reduced-motion.
const DRAG_SENSITIVITY_RAD_PER_PX = 0.005;
const ANGULAR_DAMPING_PER_SEC = 4.5;
const FLICK_SCALE = 1;
const MAX_ANGULAR_VEL = 8;
const KEYBOARD_ACCEL_RAD_PER_SEC2 = 6;
const KEYBOARD_STEP_RAD = Math.PI / 12; // 15° under reduced-motion
const PITCH_LIMIT = Math.PI / 2 - 0.05;
const MAX_DT_SECONDS = 0.033;
const IDLE_VELOCITY_EPSILON = 0.005;
const VELOCITY_SAMPLE_WINDOW_MS = 100;
// Screen-distance threshold (normalized [-1, 1]) within which a
// settled camera claims a star as "active" for thread-bloom and
// keyboard focus. ~0.25 = roughly the central quarter of the frame.
const ACTIVE_STAR_SCREEN_RADIUS = 0.25;

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function prefersReducedMotion(): boolean {
  return (
    globalThis.window !== undefined &&
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

/** A unit-vector → (yaw, pitch) inversion. Used to seed the camera
 *  from a persisted "looking at" point on the sphere. Convention:
 *  yaw = 0 looks down -Z; +yaw rotates clockwise when viewed from
 *  above; pitch = 0 looks at the equator. */
function vectorToAngles(v: UnitVector3): { yaw: number; pitch: number } {
  return {
    yaw: Math.atan2(v.x, v.z),
    pitch: Math.asin(clamp(v.y, -1, 1)),
  };
}

/** (yaw, pitch) → the unit vector the camera looks AT (the point on
 *  the sphere directly under the screen's center). The camera's
 *  position is at -direction * ORBIT_DISTANCE — opposite the look
 *  point, on the far side of the world. */
function anglesToDirection(yaw: number, pitch: number): UnitVector3 {
  const cp = Math.cos(pitch);
  return {
    x: cp * Math.sin(yaw),
    y: Math.sin(pitch),
    z: cp * Math.cos(yaw),
  };
}

function cameraFromAngles(yaw: number, pitch: number): Camera {
  const dir = anglesToDirection(yaw, pitch);
  return {
    position: {
      x: -dir.x * ORBIT_DISTANCE,
      y: -dir.y * ORBIT_DISTANCE,
      z: -dir.z * ORBIT_DISTANCE,
    },
    target: { x: 0, y: 0, z: 0 },
    up: WORLD_UP,
    fovY: CAMERA_FOV_Y,
    near: CAMERA_NEAR,
    far: CAMERA_FAR,
  };
}

interface AngleSample {
  readonly time: number;
  readonly yaw: number;
  readonly pitch: number;
}

interface NavState {
  yaw: number;
  pitch: number;
  angularVel: { yaw: number; pitch: number };
  mode: 'free' | 'dragging';
  pointerId: number | null;
  lastPointer: { x: number; y: number } | null;
  /** Recent (yaw, pitch) snapshots during a drag. The release uses
   *  the head-to-tail delta over a small window to compute flick
   *  momentum, so the visitor's last gesture carries through release. */
  dragSamples: AngleSample[];
  heldKeys: Set<string>;
  lastTime: number;
  raf: number | null;
  activeKey: string | null;
  currentCamera: Camera;
  currentBasis: CameraBasis;
}

function buildInitialState(): NavState {
  const camera = cameraFromAngles(0, 0);
  return {
    yaw: 0,
    pitch: 0,
    angularVel: { yaw: 0, pitch: 0 },
    mode: 'free',
    pointerId: null,
    lastPointer: null,
    dragSamples: [],
    heldKeys: new Set(),
    lastTime: 0,
    raf: null,
    activeKey: null,
    currentCamera: camera,
    currentBasis: cameraBasis(camera),
  };
}

interface RuntimeRefs {
  readonly stateRef: RefObject<NavState>;
  readonly nodesRef: RefObject<readonly NavigableNode[]>;
  readonly edgesRef: RefObject<readonly NavigableEdge[]>;
  readonly starsCacheRef: RefObject<ElementCache>;
  readonly threadsCacheRef: RefObject<ElementCache>;
  readonly cameraRef: RefObject<SVGGElement | null>;
  readonly viewboxSize: number;
  readonly setActiveKey: (key: string) => void;
}

function rebuildCamera(state: NavState): void {
  state.currentCamera = cameraFromAngles(state.yaw, state.pitch);
  state.currentBasis = cameraBasis(state.currentCamera);
}

/** Re-project every star and thread through the live camera. The
 *  surface cursor signal is broadcast as inactive — the trackball
 *  model has no surface cursor; the WebGL firmament's pool fades
 *  when uActive=0, which leaves the polestar wash to indicate the
 *  focal zone at screen center. */
function projectScene(state: NavState, refs: RuntimeRefs): void {
  const cameraGroup = refs.cameraRef.current;
  if (!cameraGroup) return;
  const { currentCamera: camera, currentBasis: basis } = state;
  const viewboxSize = refs.viewboxSize;
  projectStars(
    cameraGroup,
    refs.nodesRef.current,
    refs.starsCacheRef.current,
    camera,
    basis,
    viewboxSize,
  );
  projectThreads(
    cameraGroup,
    refs.edgesRef.current,
    refs.threadsCacheRef.current,
    camera,
    basis,
    viewboxSize,
  );
  setConstellationCursor(0, 0, false);
}

interface NearestCenterStar {
  readonly key: string;
  readonly distance: number;
}

function nearestStarToCenter(
  nodes: readonly NavigableNode[],
  camera: Camera,
  basis: CameraBasis,
): NearestCenterStar | null {
  let best: NearestCenterStar | null = null;
  for (const node of nodes) {
    const proj = project(node.unitPos, camera, basis, 1);
    if (!proj.inFront) continue;
    const dist = Math.hypot(proj.screenX, proj.screenY);
    if (!best || dist < best.distance) best = { key: node.key, distance: dist };
  }
  return best;
}

/** When the camera has settled (no drag, low velocity), claim the
 *  star nearest screen-center as active. This drives the thread
 *  bloom and keyboard-Enter target. During motion the active key
 *  is left alone — the visitor isn't choosing yet. */
function updateActiveKey(state: NavState, refs: RuntimeRefs): void {
  if (state.mode === 'dragging') return;
  const speed = Math.hypot(state.angularVel.yaw, state.angularVel.pitch);
  if (speed > IDLE_VELOCITY_EPSILON * 5) return;
  const nearest = nearestStarToCenter(
    refs.nodesRef.current,
    state.currentCamera,
    state.currentBasis,
  );
  if (!nearest || nearest.distance > ACTIVE_STAR_SCREEN_RADIUS) return;
  if (nearest.key === state.activeKey) return;
  state.activeKey = nearest.key;
  refs.setActiveKey(nearest.key);
  persistCursorPos(anglesToDirection(state.yaw, state.pitch));
}

function applyHeldKeys(state: NavState, dt: number): void {
  if (state.heldKeys.has('ArrowLeft')) state.angularVel.yaw -= KEYBOARD_ACCEL_RAD_PER_SEC2 * dt;
  if (state.heldKeys.has('ArrowRight')) state.angularVel.yaw += KEYBOARD_ACCEL_RAD_PER_SEC2 * dt;
  if (state.heldKeys.has('ArrowUp')) state.angularVel.pitch += KEYBOARD_ACCEL_RAD_PER_SEC2 * dt;
  if (state.heldKeys.has('ArrowDown')) state.angularVel.pitch -= KEYBOARD_ACCEL_RAD_PER_SEC2 * dt;
}

function applyDamping(state: NavState, dt: number): void {
  if (state.mode === 'dragging' || state.heldKeys.size > 0) return;
  const decay = Math.exp(-ANGULAR_DAMPING_PER_SEC * dt);
  state.angularVel.yaw *= decay;
  state.angularVel.pitch *= decay;
}

function capVelocity(state: NavState): void {
  const speed = Math.hypot(state.angularVel.yaw, state.angularVel.pitch);
  if (speed <= MAX_ANGULAR_VEL) return;
  const scale = MAX_ANGULAR_VEL / speed;
  state.angularVel.yaw *= scale;
  state.angularVel.pitch *= scale;
}

function integrateAngles(state: NavState, dt: number): void {
  state.yaw += state.angularVel.yaw * dt;
  const nextPitch = clamp(state.pitch + state.angularVel.pitch * dt, -PITCH_LIMIT, PITCH_LIMIT);
  // If pitch hit the limit, zero its velocity so momentum doesn't
  // accumulate against an immovable boundary.
  if (nextPitch === PITCH_LIMIT || nextPitch === -PITCH_LIMIT) state.angularVel.pitch = 0;
  state.pitch = nextPitch;
}

/**
 * One RAF tick of the trackball: integrate angular velocity into
 * yaw/pitch, rebuild the camera, project the scene, claim the
 * nearest star to center if we've settled, decide whether to keep
 * looping. Allocation-free; the angular-velocity object and the
 * camera are mutated in place.
 *
 * @bigO Time per tick: O(N + E) — projectStars + projectThreads
 *       dominate. Hot path: 60fps when interactive. Don't
 *       reintroduce per-tick allocations or per-tick non-bounded
 *       passes (e.g. an O(N²) similarity check, or rebuilding the
 *       element cache).
 *       Space: O(1) per tick.
 */
function tick(now: number, refs: RuntimeRefs): void {
  const state = refs.stateRef.current;
  const dt = state.lastTime === 0 ? 0 : Math.min((now - state.lastTime) / 1000, MAX_DT_SECONDS);
  state.lastTime = now;

  applyHeldKeys(state, dt);
  applyDamping(state, dt);
  capVelocity(state);
  integrateAngles(state, dt);
  rebuildCamera(state);
  projectScene(state, refs);
  updateActiveKey(state, refs);

  const speed = Math.hypot(state.angularVel.yaw, state.angularVel.pitch);
  if (state.mode === 'free' && state.heldKeys.size === 0 && speed < IDLE_VELOCITY_EPSILON) {
    state.angularVel.yaw = 0;
    state.angularVel.pitch = 0;
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

function pruneSamples(samples: AngleSample[], now: number, windowMs: number): void {
  const cutoff = now - windowMs * 2;
  while (samples.length > 0 && samples[0]!.time < cutoff) samples.shift();
}

function handlePointerDown(refs: RuntimeRefs, e: PointerEvent<SVGElement>): void {
  const state = refs.stateRef.current;
  state.mode = 'dragging';
  state.pointerId = e.pointerId;
  state.lastPointer = { x: e.clientX, y: e.clientY };
  state.dragSamples = [{ time: globalThis.performance.now(), yaw: state.yaw, pitch: state.pitch }];
  // Touching the globe stops any momentum — visitor took the wheel.
  state.angularVel.yaw = 0;
  state.angularVel.pitch = 0;
  e.currentTarget.setPointerCapture(e.pointerId);
  markVisited();
  if (!prefersReducedMotion()) ensureRunning(refs);
}

function handlePointerMove(refs: RuntimeRefs, e: PointerEvent<SVGElement>): void {
  const state = refs.stateRef.current;
  if (state.mode !== 'dragging' || state.pointerId !== e.pointerId || !state.lastPointer) return;
  const dx = e.clientX - state.lastPointer.x;
  const dy = e.clientY - state.lastPointer.y;
  state.lastPointer = { x: e.clientX, y: e.clientY };
  // Drag right → globe rotates such that what was on its right edge
  // moves further off-screen; from the camera's POV, it moves to
  // the camera's left → yaw decreases.
  state.yaw -= dx * DRAG_SENSITIVITY_RAD_PER_PX;
  state.pitch = clamp(state.pitch + dy * DRAG_SENSITIVITY_RAD_PER_PX, -PITCH_LIMIT, PITCH_LIMIT);
  const now = globalThis.performance.now();
  state.dragSamples.push({ time: now, yaw: state.yaw, pitch: state.pitch });
  pruneSamples(state.dragSamples, now, VELOCITY_SAMPLE_WINDOW_MS);
  if (prefersReducedMotion()) {
    rebuildCamera(state);
    projectScene(state, refs);
    updateActiveKey(state, refs);
  }
}

function computeFlickVelocity(samples: readonly AngleSample[]): { yaw: number; pitch: number } {
  if (samples.length < 2) return { yaw: 0, pitch: 0 };
  const last = samples.at(-1);
  const oldest = samples[0];
  if (!last || !oldest) return { yaw: 0, pitch: 0 };
  const dt = Math.max(0.001, (last.time - oldest.time) / 1000);
  return {
    yaw: ((last.yaw - oldest.yaw) / dt) * FLICK_SCALE,
    pitch: ((last.pitch - oldest.pitch) / dt) * FLICK_SCALE,
  };
}

function handlePointerUp(refs: RuntimeRefs, e: PointerEvent<SVGElement>): void {
  const state = refs.stateRef.current;
  if (state.pointerId !== e.pointerId) return;
  if (!prefersReducedMotion()) {
    const v = computeFlickVelocity(state.dragSamples);
    state.angularVel.yaw = clamp(v.yaw, -MAX_ANGULAR_VEL, MAX_ANGULAR_VEL);
    state.angularVel.pitch = clamp(v.pitch, -MAX_ANGULAR_VEL, MAX_ANGULAR_VEL);
  }
  state.mode = 'free';
  state.lastPointer = null;
  state.dragSamples = [];
  state.pointerId = null;
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
  if (!prefersReducedMotion()) ensureRunning(refs);
}

function stepReducedMotion(state: NavState, key: string): void {
  if (key === 'ArrowLeft') state.yaw -= KEYBOARD_STEP_RAD;
  if (key === 'ArrowRight') state.yaw += KEYBOARD_STEP_RAD;
  if (key === 'ArrowUp')
    state.pitch = clamp(state.pitch + KEYBOARD_STEP_RAD, -PITCH_LIMIT, PITCH_LIMIT);
  if (key === 'ArrowDown')
    state.pitch = clamp(state.pitch - KEYBOARD_STEP_RAD, -PITCH_LIMIT, PITCH_LIMIT);
}

function handleKeyDown(refs: RuntimeRefs, e: KeyboardEvent): void {
  if (!ARROW_KEYS.has(e.key)) return;
  e.preventDefault();
  const state = refs.stateRef.current;
  markVisited();
  if (prefersReducedMotion()) {
    stepReducedMotion(state, e.key);
    rebuildCamera(state);
    projectScene(state, refs);
    updateActiveKey(state, refs);
    if (state.activeKey) focusNodeByKey(state.activeKey);
    return;
  }
  state.heldKeys.add(e.key);
  ensureRunning(refs);
}

function handleKeyUp(refs: RuntimeRefs, e: KeyboardEvent): void {
  if (!ARROW_KEYS.has(e.key)) return;
  refs.stateRef.current.heldKeys.delete(e.key);
}

function applyRestoredAngles(state: NavState, restored: UnitVector3): void {
  const { yaw, pitch } = vectorToAngles(restored);
  state.yaw = yaw;
  state.pitch = pitch;
  rebuildCamera(state);
}

function setupCursorLifecycle(state: NavState, refs: RuntimeRefs): () => void {
  const restored = readPersistedCursorPos();
  if (restored) {
    applyRestoredAngles(state, restored);
    if (prefersReducedMotion()) {
      // Reduced-motion: the integrator loop doesn't run, so a
      // single explicit projection paints the restored view.
      projectScene(state, refs);
      updateActiveKey(state, refs);
    } else {
      ensureRunning(refs);
    }
  }
  // First-visit demonstration drift held — see file header. The
  // visitor's first action under the new interaction is exploring
  // by gesture; the demo's role (teaching the system by motion) is
  // fundamentally different in a direct-manipulation world and
  // wants its own design pass before re-entering.
  void hasVisitedBefore;
  const persistOnHide = () => persistCursorPos(anglesToDirection(state.yaw, state.pitch));
  globalThis.addEventListener?.('pagehide', persistOnHide);
  globalThis.addEventListener?.('visibilitychange', persistOnHide);
  return () => {
    globalThis.removeEventListener?.('pagehide', persistOnHide);
    globalThis.removeEventListener?.('visibilitychange', persistOnHide);
    persistCursorPos(anglesToDirection(state.yaw, state.pitch));
  };
}

export function useConstellationNavigation({
  nodes,
  edges,
  viewboxSize,
  setActiveKey,
  cameraRef,
}: UseConstellationNavigationArgs) {
  const stateRef = useRef<NavState>(buildInitialState());
  const nodesRef = useRef<readonly NavigableNode[]>(nodes);
  const edgesRef = useRef<readonly NavigableEdge[]>(edges);
  const starsCacheRef = useRef<ElementCache>(new Map());
  const threadsCacheRef = useRef<ElementCache>(new Map());

  useEffect(() => {
    nodesRef.current = nodes;
    if (cameraRef.current) {
      starsCacheRef.current = buildElementCache(
        cameraRef.current,
        'data-node-key',
        nodes.map((n) => n.key),
      );
    }
  }, [nodes, cameraRef]);

  useEffect(() => {
    edgesRef.current = edges;
    if (cameraRef.current) {
      threadsCacheRef.current = buildElementCache(
        cameraRef.current,
        'data-thread-id',
        edges.map((e) => e.id),
      );
    }
  }, [edges, cameraRef]);

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
    starsCacheRef,
    threadsCacheRef,
    cameraRef,
    viewboxSize,
    setActiveKey,
  };

  useEffect(() => {
    const state = stateRef.current;
    const lifecycleRefs: RuntimeRefs = {
      stateRef,
      nodesRef,
      edgesRef,
      starsCacheRef,
      threadsCacheRef,
      cameraRef,
      viewboxSize,
      setActiveKey,
    };
    return setupCursorLifecycle(state, lifecycleRefs);
  }, [cameraRef, viewboxSize, setActiveKey]);

  return {
    dragHandlers: {
      onPointerDown: (e: PointerEvent<SVGElement>) => handlePointerDown(refs, e),
      onPointerMove: (e: PointerEvent<SVGElement>) => handlePointerMove(refs, e),
      onPointerUp: (e: PointerEvent<SVGElement>) => handlePointerUp(refs, e),
      onPointerCancel: (e: PointerEvent<SVGElement>) => handlePointerUp(refs, e),
    },
    onKeyDown: (e: KeyboardEvent) => handleKeyDown(refs, e),
    onKeyUp: (e: KeyboardEvent) => handleKeyUp(refs, e),
  };
}
