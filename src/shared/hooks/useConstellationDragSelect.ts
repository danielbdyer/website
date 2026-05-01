import type { PointerEvent } from 'react';
import { useRef } from 'react';

interface RenderableNodeLike {
  key: string;
  pos: { x: number; y: number };
}

interface UseConstellationDragSelectArgs {
  nodes: readonly RenderableNodeLike[];
  setActiveKey: (key: string) => void;
  viewboxSize: number;
}

export function useConstellationDragSelect({
  nodes,
  setActiveKey,
  viewboxSize,
}: UseConstellationDragSelectArgs) {
  const dragStateRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    raf: number | null;
  } | null>(null);

  const updateNearestNode = () => {
    const state = dragStateRef.current;
    if (!state) return;

    let nearest: { key: string; distanceSquared: number } | null = null;
    for (const node of nodes) {
      const dx = node.pos.x - state.x;
      const dy = node.pos.y - state.y;
      const distanceSquared = dx * dx + dy * dy;
      if (!nearest || distanceSquared < nearest.distanceSquared) {
        nearest = { key: node.key, distanceSquared };
      }
    }

    if (nearest && nearest.distanceSquared < 60 * 60) setActiveKey(nearest.key);
    state.raf = globalThis.requestAnimationFrame(updateNearestNode);
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
      dragStateRef.current = { pointerId: event.pointerId, x: point.x, y: point.y, raf: null };
      event.currentTarget.setPointerCapture(event.pointerId);
      updateNearestNode();
    },
    onPointerMove: (event: PointerEvent<SVGGElement>) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) return;
      const point = toViewboxCoordinates(event);
      if (!point) return;
      dragStateRef.current.x = point.x;
      dragStateRef.current.y = point.y;
    },
    onPointerUp: (event: PointerEvent<SVGGElement>) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) return;
      if (dragStateRef.current.raf) globalThis.cancelAnimationFrame(dragStateRef.current.raf);
      dragStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
  };
}
