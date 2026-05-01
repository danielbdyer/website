import type { PointerEvent } from 'react';
import { useRef } from 'react';

interface RenderableNodeLike {
  key: string;
  pos: { x: number; y: number };
}

interface DragNodeCandidate {
  key: string;
  distanceSquared: number;
}

interface UseConstellationDragSelectArgs {
  nodes: readonly RenderableNodeLike[];
  adjacency: ReadonlyMap<string, ReadonlySet<string>>;
  activeKey: string | null;
  setActiveKey: (key: string) => void;
  viewboxSize: number;
}

const SOFT_CAPTURE_RADIUS = 84;
const STICKY_CAPTURE_BONUS = 0.75;
const SPRING_TENSION = 0.18;
const SPRING_FRICTION = 0.72;

export function chooseNearestNode({
  nodes,
  adjacency,
  activeKey,
  x,
  y,
}: {
  nodes: readonly RenderableNodeLike[];
  adjacency: ReadonlyMap<string, ReadonlySet<string>>;
  activeKey: string | null;
  x: number;
  y: number;
}): DragNodeCandidate | null {
  let nearest: DragNodeCandidate | null = null;

  for (const node of nodes) {
    const dx = node.pos.x - x;
    const dy = node.pos.y - y;
    const distanceSquared = dx * dx + dy * dy;

    const isCurrent = activeKey === node.key;
    const isNeighbor = activeKey ? adjacency.get(activeKey)?.has(node.key) : false;
    let weight = 1;
    if (isCurrent) weight = STICKY_CAPTURE_BONUS;
    else if (isNeighbor) weight = 0.9;
    const weightedDistance = distanceSquared * weight;

    if (!nearest || weightedDistance < nearest.distanceSquared) {
      nearest = { key: node.key, distanceSquared: weightedDistance };
    }
  }

  return nearest;
}

// eslint-disable-next-line max-lines-per-function
export function useConstellationDragSelect({
  nodes,
  adjacency,
  activeKey,
  setActiveKey,
  viewboxSize,
}: UseConstellationDragSelectArgs) {
  const dragStateRef = useRef<{
    pointerId: number;
    rawX: number;
    rawY: number;
    springX: number;
    springY: number;
    vx: number;
    vy: number;
    raf: number | null;
  } | null>(null);

  const tick = () => {
    const state = dragStateRef.current;
    if (!state) return;

    state.vx = state.vx * SPRING_FRICTION + (state.rawX - state.springX) * SPRING_TENSION;
    state.vy = state.vy * SPRING_FRICTION + (state.rawY - state.springY) * SPRING_TENSION;
    state.springX += state.vx;
    state.springY += state.vy;

    const nearest = chooseNearestNode({
      nodes,
      adjacency,
      activeKey,
      x: state.springX,
      y: state.springY,
    });

    if (nearest && nearest.distanceSquared <= SOFT_CAPTURE_RADIUS * SOFT_CAPTURE_RADIUS) {
      setActiveKey(nearest.key);
    }

    state.raf = globalThis.requestAnimationFrame(tick);
  };

  const toViewboxCoordinates = (event: PointerEvent<SVGGElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return null;
    const bounds = svg.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (viewboxSize / bounds.width),
      y: (event.clientY - bounds.top) * (viewboxSize / bounds.height),
    };
  };

  return {
    onPointerDown: (event: PointerEvent<SVGGElement>) => {
      const point = toViewboxCoordinates(event);
      if (!point) return;
      dragStateRef.current = {
        pointerId: event.pointerId,
        rawX: point.x,
        rawY: point.y,
        springX: point.x,
        springY: point.y,
        vx: 0,
        vy: 0,
        raf: null,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      tick();
    },
    onPointerMove: (event: PointerEvent<SVGGElement>) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) return;
      const point = toViewboxCoordinates(event);
      if (!point) return;
      dragStateRef.current.rawX = point.x;
      dragStateRef.current.rawY = point.y;
    },
    onPointerCancel: (event: PointerEvent<SVGGElement>) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) return;
      if (dragStateRef.current.raf) globalThis.cancelAnimationFrame(dragStateRef.current.raf);
      dragStateRef.current = null;
    },
    onPointerUp: (event: PointerEvent<SVGGElement>) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) return;
      if (dragStateRef.current.raf) globalThis.cancelAnimationFrame(dragStateRef.current.raf);
      dragStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
  };
}
