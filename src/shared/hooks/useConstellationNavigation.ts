import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';

// Soft, flowy, topological navigation across the constellation.
//
// A virtual cursor lives in viewbox coordinates and follows a
// critically-damped-ish spring toward a target the gestures set:
// a pointer drag, an arrow key, an initial anchor. Around each
// node sits an influence well — the cursor's target gets pulled
// toward the nearest node as it approaches, and *claims* the node
// as the active local minimum once inside the basin radius. Between
// two nodes the pulls compete; you feel the saddle, then fall in.
//
// The camera (an SVG group the consumer attaches `cameraRef` to)
// pans by a fraction of the cursor's offset from center and yaws
// by a small fraction of its velocity — a hint of traveling-on-a-
// surface motion without committing to 3D yet. Both updated by
// inline `style.transform` writes per RAF tick, so the spring's
// numerical integration is the source of smoothing (no CSS
// transition fighting the loop).
//
// `prefers-reduced-motion: reduce` is the honest fallback: the RAF
// loop never starts, the camera stays still, and pointer/keyboard
// gestures snap to the nearest node directly.

export interface NavigableNode {
  readonly key: string;
  readonly pos: { readonly x: number; readonly y: number };
}

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

interface UseConstellationNavigationArgs {
  readonly nodes: readonly NavigableNode[];
  readonly viewboxSize: number;
  readonly setActiveKey: (key: string) => void;
  readonly cameraRef: RefObject<SVGGElement | null>;
}

const SPRING_STIFFNESS = 90;
const SPRING_DAMPING = 16;
const INFLUENCE_RADIUS = 220;
const BASIN_RADIUS = 90;
const BASIN_PULL_FACTOR = 0.6;
const PAN_FACTOR = 0.22;
const YAW_VELOCITY_SCALE = 0.05;
const MAX_YAW_DEG = 4;
const MAX_DT_SECONDS = 0.033;

interface Vec2 {
  readonly x: number;
  readonly y: number;
}

function distanceSquared(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
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

export function applyBasinPull(
  target: Vec2,
  nodes: readonly NavigableNode[],
  influenceRadius = INFLUENCE_RADIUS,
  pullFactor = BASIN_PULL_FACTOR,
): Vec2 {
  let { x, y } = target;
  for (const node of nodes) {
    const d = Math.sqrt(distanceSquared(target, node.pos));
    if (d >= influenceRadius) continue;
    const t = 1 - d / influenceRadius;
    const pull = t * t * pullFactor;
    x = x + (node.pos.x - x) * pull;
    y = y + (node.pos.y - y) * pull;
  }
  return { x, y };
}

export function springStep(
  pos: Vec2,
  vel: Vec2,
  target: Vec2,
  dt: number,
  stiffness = SPRING_STIFFNESS,
  damping = SPRING_DAMPING,
): { pos: Vec2; vel: Vec2 } {
  const ax = -stiffness * (pos.x - target.x) - damping * vel.x;
  const ay = -stiffness * (pos.y - target.y) - damping * vel.y;
  const vx = vel.x + ax * dt;
  const vy = vel.y + ay * dt;
  return { pos: { x: pos.x + vx * dt, y: pos.y + vy * dt }, vel: { x: vx, y: vy } };
}

const ARROW_VECTOR: Record<ArrowDirection, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function directionalNeighbor(
  activeKey: string | null,
  nodes: readonly NavigableNode[],
  direction: ArrowDirection,
): NavigableNode | null {
  const active = nodes.find((n) => n.key === activeKey);
  if (!active) return nodes[0] ?? null;
  const v = ARROW_VECTOR[direction];
  let best: { node: NavigableNode; cost: number } | null = null;
  for (const candidate of nodes) {
    if (candidate.key === active.key) continue;
    const dx = candidate.pos.x - active.pos.x;
    const dy = candidate.pos.y - active.pos.y;
    const along = dx * v.x + dy * v.y;
    if (along <= 0) continue;
    const lateral = Math.abs(dx * v.y - dy * v.x);
    const cost = along + lateral * 2;
    if (!best || cost < best.cost) best = { node: candidate, cost };
  }
  return best?.node ?? null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
  target: Vec2;
  dragging: boolean;
  pointerId: number | null;
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

const ARROW_KEYS: Record<string, ArrowDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

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

function tick(now: number, refs: RuntimeRefs): void {
  const state = refs.stateRef.current;
  const nodes = refs.nodesRef.current;
  const dt = state.lastTime === 0 ? 0 : Math.min((now - state.lastTime) / 1000, MAX_DT_SECONDS);
  state.lastTime = now;
  const pulled = applyBasinPull(state.target, nodes);
  const next = springStep(state.pos, state.vel, pulled, dt);
  state.pos = next.pos;
  state.vel = next.vel;
  const nearest = nearestNode(state.pos, nodes, BASIN_RADIUS);
  if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
  if (refs.cameraRef.current) {
    applyCameraTransform(refs.cameraRef.current, state.pos, state.vel, refs.viewboxSize);
  }
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
  state.dragging = true;
  state.pointerId = e.pointerId;
  state.target = pt;
  e.currentTarget.setPointerCapture(e.pointerId);
  if (prefersReducedMotion()) {
    const nearest = nearestNode(pt, refs.nodesRef.current, BASIN_RADIUS * 2);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
  }
}

function handlePointerMove(refs: RuntimeRefs, e: PointerEvent<SVGGElement>): void {
  const state = refs.stateRef.current;
  if (!state.dragging || state.pointerId !== e.pointerId) return;
  const pt = pointFromPointer(e, refs.viewboxSize);
  if (!pt) return;
  state.target = pt;
  if (prefersReducedMotion()) {
    const nearest = nearestNode(pt, refs.nodesRef.current, BASIN_RADIUS * 2);
    if (nearest) flipActive(state, nearest.key, refs.setActiveKey);
  }
}

function handlePointerUp(refs: RuntimeRefs, e: PointerEvent<SVGGElement>): void {
  const state = refs.stateRef.current;
  if (state.pointerId !== e.pointerId) return;
  const nearest = nearestNode(state.pos, refs.nodesRef.current, INFLUENCE_RADIUS);
  if (nearest) {
    const node = refs.nodesRef.current.find((n) => n.key === nearest.key);
    if (node) state.target = node.pos;
  }
  state.dragging = false;
  state.pointerId = null;
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
}

function handleKeyDown(refs: RuntimeRefs, e: KeyboardEvent): void {
  const direction = ARROW_KEYS[e.key];
  if (!direction) return;
  const state = refs.stateRef.current;
  const next = directionalNeighbor(state.activeKey, refs.nodesRef.current, direction);
  if (!next) return;
  e.preventDefault();
  state.target = next.pos;
  flipActive(state, next.key, refs.setActiveKey);
  if (prefersReducedMotion()) {
    state.pos = next.pos;
    state.vel = { x: 0, y: 0 };
  }
  focusNodeByKey(next.key);
}

export function useConstellationNavigation({
  nodes,
  viewboxSize,
  setActiveKey,
  cameraRef,
}: UseConstellationNavigationArgs) {
  const center = viewboxSize / 2;
  const stateRef = useRef<NavState>({
    pos: { x: center, y: center },
    vel: { x: 0, y: 0 },
    target: { x: center, y: center },
    dragging: false,
    pointerId: null,
    lastTime: 0,
    raf: null,
    activeKey: null,
  });
  const nodesRef = useRef<readonly NavigableNode[]>(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const refs: RuntimeRefs = { stateRef, nodesRef, cameraRef, viewboxSize, setActiveKey };
    const state = stateRef.current;
    state.lastTime = 0;
    state.raf = globalThis.requestAnimationFrame((t) => tick(t, refs));
    return () => {
      if (state.raf !== null) globalThis.cancelAnimationFrame(state.raf);
      state.raf = null;
    };
  }, [cameraRef, viewboxSize, setActiveKey]);

  const refs: RuntimeRefs = { stateRef, nodesRef, cameraRef, viewboxSize, setActiveKey };
  return {
    dragHandlers: {
      onPointerDown: (e: PointerEvent<SVGGElement>) => handlePointerDown(refs, e),
      onPointerMove: (e: PointerEvent<SVGGElement>) => handlePointerMove(refs, e),
      onPointerUp: (e: PointerEvent<SVGGElement>) => handlePointerUp(refs, e),
      onPointerCancel: (e: PointerEvent<SVGGElement>) => handlePointerUp(refs, e),
    },
    onKeyDown: (e: KeyboardEvent) => handleKeyDown(refs, e),
  };
}
