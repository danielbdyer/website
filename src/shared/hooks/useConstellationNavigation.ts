import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';

// Force-field navigation across the constellation.
//
// A virtual cursor moves through a continuous physical field with
// position and velocity. Three input gestures inject motion:
//
//   - Pointer drag: a strong spring pulls the cursor toward the
//     finger / mouse. On release, the pointer's recent velocity
//     (sampled over the last ~120ms) is added to the cursor's
//     velocity — a flick imparts momentum, a slow drag does not.
//   - Held arrow keys: as long as keys are held, a constant
//     acceleration pushes the cursor in the summed unit direction.
//     A tap releases briefly and decays naturally.
//   - The basin field: every node radiates an attractor force that
//     falls off with distance. Always on. Between two nodes the
//     pulls compete (the saddle); inside a basin one wins (the
//     local minimum). Friction lets a coasting cursor settle into
//     whatever basin its momentum carries it into.
//
// The camera (an SVG group the consumer attaches `cameraRef` to)
// pans by a fraction of the cursor's offset from center and yaws
// by a small fraction of its velocity. Updates run inline in the
// RAF tick; the integrator is the source of smoothing, no CSS
// transition fights the loop.
//
// `prefers-reduced-motion: reduce` short-circuits the loop and
// pointer/keyboard fall back to direct snap-to-nearest. The graph
// is still navigable; it just stops moving on its own.

export interface NavigableNode {
  readonly key: string;
  readonly pos: { readonly x: number; readonly y: number };
}

interface UseConstellationNavigationArgs {
  readonly nodes: readonly NavigableNode[];
  readonly viewboxSize: number;
  readonly setActiveKey: (key: string) => void;
  readonly cameraRef: RefObject<SVGGElement | null>;
}

// Force-field constants. Units: distance in viewbox (VIEWBOX=1000),
// time in seconds, so accelerations are units/s².
const INFLUENCE_RADIUS = 280;
const BASIN_RADIUS = 95;
// Linear-displacement spring with finite range. Force = k * (node-pos)
// * max(0, 1 - d/R). Zero at the node center (cursor settles), peaks
// at d = R/2 with magnitude k*R/4, zero at d = R.
const BASIN_STIFFNESS = 22;
const DRAG_SPRING = 220;
const DRAG_DAMPING = 26;
// Damping ratio ≈ 0.7 for the basin spring (2 * sqrt(k) ≈ 9.4).
const FREE_DAMPING = 6.5;
const HOLD_ACCEL = 1900;
const FLICK_SCALE = 0.9;
const MAX_VELOCITY = 4500;
const MAX_DT_SECONDS = 0.033;
// When the cursor is at rest (free mode, no held keys, low velocity,
// near-zero net force), the RAF loop halts and waits for input.
// Each input handler calls ensureRunning to wake it up. The threshold
// is the smallest velocity worth integrating per frame.
const IDLE_VELOCITY_EPSILON = 0.5;
const IDLE_ACCELERATION_EPSILON = 1.5;
const VELOCITY_SAMPLE_WINDOW_MS = 120;
const POSITION_MARGIN = 200;
const PAN_FACTOR = 0.22;
const YAW_VELOCITY_SCALE = 0.0035;
const MAX_YAW_DEG = 5;

interface Vec2 {
  readonly x: number;
  readonly y: number;
}

const ZERO: Vec2 = { x: 0, y: 0 };

function distanceSquared(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function nearestNode(
  cursor: Vec2,
  nodes: readonly NavigableNode[],
  maxDistance = Number.POSITIVE_INFINITY,
): { key: string; distance: number } | null {
  let best: { key: string; distance: number } | null = null;
  const max2 = maxDistance * maxDistance;
  for (const node of nodes) {
    const d2 = distanceSquared(cursor, node.pos);
    if (d2 > max2) continue;
    if (!best || d2 < best.distance * best.distance) {
      best = { key: node.key, distance: Math.sqrt(d2) };
    }
  }
  return best;
}

// Sum of attractor forces from every node within INFLUENCE_RADIUS.
// Force = k * (node.pos - pos) * max(0, 1 - d/R). Force is zero at
// the node center (the cursor *settles*), grows linearly with
// displacement near it (spring-like), peaks at d = R/2, and
// vanishes at d = R (basins are local). Always-on so a coasting
// cursor falls into the dominant basin and a held cursor sits at
// the saddle when pulls balance.
export function basinFieldForce(
  pos: Vec2,
  nodes: readonly NavigableNode[],
  influenceRadius = INFLUENCE_RADIUS,
  stiffness = BASIN_STIFFNESS,
): Vec2 {
  let fx = 0;
  let fy = 0;
  const r2 = influenceRadius * influenceRadius;
  for (const node of nodes) {
    const dx = node.pos.x - pos.x;
    const dy = node.pos.y - pos.y;
    // Bounding-box reject before sqrt: cheaper than hypot for the
    // typical case where most nodes are out of range.
    if (dx > influenceRadius || dx < -influenceRadius) continue;
    if (dy > influenceRadius || dy < -influenceRadius) continue;
    const d2 = dx * dx + dy * dy;
    if (d2 >= r2) continue;
    const d = Math.sqrt(d2);
    const shape = 1 - d / influenceRadius;
    fx += stiffness * dx * shape;
    fy += stiffness * dy * shape;
  }
  return { x: fx, y: fy };
}

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function holdDirection(heldKeys: ReadonlySet<string>): Vec2 {
  let dx = 0;
  let dy = 0;
  if (heldKeys.has('ArrowUp')) dy -= 1;
  if (heldKeys.has('ArrowDown')) dy += 1;
  if (heldKeys.has('ArrowLeft')) dx -= 1;
  if (heldKeys.has('ArrowRight')) dx += 1;
  if (dx === 0 && dy === 0) return ZERO;
  const m = Math.hypot(dx, dy);
  return { x: dx / m, y: dy / m };
}

interface PointerSample {
  time: number;
  pos: Vec2;
}

// Compute the gesture's release velocity from samples within the
// last `windowMs` of motion. Older samples are dropped first by
// `pruneSamples`. Returns zero when there's not enough history.
export function flickVelocity(
  samples: readonly PointerSample[],
  windowMs = VELOCITY_SAMPLE_WINDOW_MS,
): Vec2 {
  if (samples.length < 2) return ZERO;
  const newest = samples.at(-1)!;
  const cutoff = newest.time - windowMs;
  const oldest = samples.find((s) => s.time >= cutoff) ?? samples[0]!;
  const dt = (newest.time - oldest.time) / 1000;
  if (dt <= 0) return ZERO;
  return {
    x: (newest.pos.x - oldest.pos.x) / dt,
    y: (newest.pos.y - oldest.pos.y) / dt,
  };
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
  pos: Vec2;
  vel: Vec2;
  mode: 'free' | 'dragging';
  dragTarget: Vec2 | null;
  pointerSamples: PointerSample[];
  pointerId: number | null;
  heldKeys: Set<string>;
  lastTime: number;
  raf: number | null;
  activeKey: string | null;
}

function applyCameraTransform(el: SVGGElement, pos: Vec2, vel: Vec2, viewboxSize: number): void {
  const center = viewboxSize / 2;
  const panX = -(pos.x - center) * PAN_FACTOR;
  const panY = -(pos.y - center) * PAN_FACTOR;
  const yaw = clamp(vel.x * YAW_VELOCITY_SCALE, -MAX_YAW_DEG, MAX_YAW_DEG);
  el.style.transform = `translate(${panX.toFixed(2)}px, ${panY.toFixed(2)}px) rotate(${yaw.toFixed(2)}deg)`;
}

function pointFromPointer(e: PointerEvent<SVGGElement>, viewboxSize: number): Vec2 | null {
  const svg = e.currentTarget.ownerSVGElement;
  if (!svg) return null;
  const bounds = svg.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return null;
  return {
    x: (e.clientX - bounds.left) * (viewboxSize / bounds.width),
    y: (e.clientY - bounds.top) * (viewboxSize / bounds.height),
  };
}

interface RuntimeRefs {
  readonly stateRef: RefObject<NavState>;
  readonly nodesRef: RefObject<readonly NavigableNode[]>;
  readonly cameraRef: RefObject<SVGGElement | null>;
  readonly viewboxSize: number;
  readonly setActiveKey: (key: string) => void;
}

function flipActive(state: NavState, key: string, setActiveKey: (k: string) => void): void {
  if (key === state.activeKey) return;
  state.activeKey = key;
  setActiveKey(key);
}

// Sum the field, drag, hold, and friction forces into a net
// acceleration for one tick.
function computeAcceleration(state: NavState, nodes: readonly NavigableNode[]): Vec2 {
  const basin = basinFieldForce(state.pos, nodes);
  let ax = basin.x;
  let ay = basin.y;
  if (state.mode === 'dragging' && state.dragTarget) {
    ax += DRAG_SPRING * (state.dragTarget.x - state.pos.x) - DRAG_DAMPING * state.vel.x;
    ay += DRAG_SPRING * (state.dragTarget.y - state.pos.y) - DRAG_DAMPING * state.vel.y;
  } else {
    ax -= FREE_DAMPING * state.vel.x;
    ay -= FREE_DAMPING * state.vel.y;
    const hold = holdDirection(state.heldKeys);
    ax += HOLD_ACCEL * hold.x;
    ay += HOLD_ACCEL * hold.y;
  }
  return { x: ax, y: ay };
}

function clampVelocity(vel: Vec2): Vec2 {
  const speed = Math.hypot(vel.x, vel.y);
  if (speed <= MAX_VELOCITY) return vel;
  const scale = MAX_VELOCITY / speed;
  return { x: vel.x * scale, y: vel.y * scale };
}

function clampPosition(pos: Vec2, viewboxSize: number): Vec2 {
  return {
    x: clamp(pos.x, -POSITION_MARGIN, viewboxSize + POSITION_MARGIN),
    y: clamp(pos.y, -POSITION_MARGIN, viewboxSize + POSITION_MARGIN),
  };
}

function isAtRest(state: NavState, accel: Vec2): boolean {
  if (state.mode !== 'free' || state.heldKeys.size > 0) return false;
  const speed2 = state.vel.x * state.vel.x + state.vel.y * state.vel.y;
  if (speed2 > IDLE_VELOCITY_EPSILON * IDLE_VELOCITY_EPSILON) return false;
  const accel2 = accel.x * accel.x + accel.y * accel.y;
  return accel2 <= IDLE_ACCELERATION_EPSILON * IDLE_ACCELERATION_EPSILON;
}

function tick(now: number, refs: RuntimeRefs): void {
  const state = refs.stateRef.current;
  const nodes = refs.nodesRef.current;
  const dt = state.lastTime === 0 ? 0 : Math.min((now - state.lastTime) / 1000, MAX_DT_SECONDS);
  state.lastTime = now;
  const accel = computeAcceleration(state, nodes);
  state.vel = clampVelocity({ x: state.vel.x + accel.x * dt, y: state.vel.y + accel.y * dt });
  state.pos = clampPosition(
    { x: state.pos.x + state.vel.x * dt, y: state.pos.y + state.vel.y * dt },
    refs.viewboxSize,
  );
  const nearest = nearestNode(state.pos, nodes, BASIN_RADIUS);
  if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
  if (refs.cameraRef.current) {
    applyCameraTransform(refs.cameraRef.current, state.pos, state.vel, refs.viewboxSize);
  }
  if (isAtRest(state, accel)) {
    state.vel = ZERO;
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
  const pt = pointFromPointer(e, refs.viewboxSize);
  if (!pt) return;
  const state = refs.stateRef.current;
  state.mode = 'dragging';
  state.dragTarget = pt;
  state.pointerId = e.pointerId;
  state.pointerSamples = [{ time: globalThis.performance.now(), pos: pt }];
  e.currentTarget.setPointerCapture(e.pointerId);
  if (prefersReducedMotion()) {
    const nearest = nearestNode(pt, refs.nodesRef.current, BASIN_RADIUS * 2);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
    return;
  }
  ensureRunning(refs);
}

function handlePointerMove(refs: RuntimeRefs, e: PointerEvent<SVGGElement>): void {
  const state = refs.stateRef.current;
  if (state.mode !== 'dragging' || state.pointerId !== e.pointerId) return;
  const pt = pointFromPointer(e, refs.viewboxSize);
  if (!pt) return;
  state.dragTarget = pt;
  const now = globalThis.performance.now();
  state.pointerSamples.push({ time: now, pos: pt });
  pruneSamples(state.pointerSamples, now, VELOCITY_SAMPLE_WINDOW_MS);
  if (prefersReducedMotion()) {
    const nearest = nearestNode(pt, refs.nodesRef.current, BASIN_RADIUS * 2);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
  }
}

function handlePointerUp(refs: RuntimeRefs, e: PointerEvent<SVGGElement>): void {
  const state = refs.stateRef.current;
  if (state.pointerId !== e.pointerId) return;
  if (prefersReducedMotion()) {
    const nearest = nearestNode(state.dragTarget ?? state.pos, refs.nodesRef.current);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
  } else {
    const v = flickVelocity(state.pointerSamples);
    state.vel = clampVelocity({
      x: state.vel.x + v.x * FLICK_SCALE,
      y: state.vel.y + v.y * FLICK_SCALE,
    });
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

// Reduced-motion fallback: tap an arrow → jump to the spatially
// nearest neighbor in that direction. Mirrors the discrete-step
// behavior keyboard users expect when motion is suppressed.
export function neighborInDirection(
  activeKey: string | null,
  nodes: readonly NavigableNode[],
  arrowKey: string,
): NavigableNode | null {
  const v = holdDirection(new Set([arrowKey]));
  if (v.x === 0 && v.y === 0) return null;
  const active = nodes.find((n) => n.key === activeKey);
  const origin = active?.pos ?? { x: 0, y: 0 };
  let best: { node: NavigableNode; cost: number } | null = null;
  for (const candidate of nodes) {
    if (candidate.key === active?.key) continue;
    const dx = candidate.pos.x - origin.x;
    const dy = candidate.pos.y - origin.y;
    const along = dx * v.x + dy * v.y;
    if (along <= 0) continue;
    const lateral = Math.abs(dx * v.y - dy * v.x);
    const cost = along + lateral * 2;
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
  const next = neighborInDirection(state.activeKey, refs.nodesRef.current, e.key);
  if (!next) return;
  state.pos = next.pos;
  state.vel = ZERO;
  flipActive(state, next.key, refs.setActiveKey);
  focusNodeByKey(next.key);
}

function handleKeyUp(refs: RuntimeRefs, e: KeyboardEvent): void {
  if (!ARROW_KEYS.has(e.key)) return;
  refs.stateRef.current.heldKeys.delete(e.key);
}

function buildInitialState(viewboxSize: number): NavState {
  const center = viewboxSize / 2;
  return {
    pos: { x: center, y: center },
    vel: ZERO,
    mode: 'free',
    dragTarget: null,
    pointerSamples: [],
    pointerId: null,
    heldKeys: new Set(),
    lastTime: 0,
    raf: null,
    activeKey: null,
  };
}

export function useConstellationNavigation({
  nodes,
  viewboxSize,
  setActiveKey,
  cameraRef,
}: UseConstellationNavigationArgs) {
  const stateRef = useRef<NavState>(buildInitialState(viewboxSize));
  const nodesRef = useRef<readonly NavigableNode[]>(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    // The RAF loop is demand-driven: it starts on input and stops
    // when the cursor settles. This effect just owns the cleanup
    // contract on unmount so a pending frame doesn't outlive the
    // component.
    const state = stateRef.current;
    return () => {
      if (state.raf !== null) globalThis.cancelAnimationFrame(state.raf);
      state.raf = null;
      state.heldKeys.clear();
    };
  }, []);

  const refs: RuntimeRefs = { stateRef, nodesRef, cameraRef, viewboxSize, setActiveKey };
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
