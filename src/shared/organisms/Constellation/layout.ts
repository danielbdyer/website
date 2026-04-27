import type { ConstellationGraph, ConstellationNode } from '@/shared/content/constellation';
import type { Room } from '@/shared/types/common';

// Layout primitives for the constellation. Pure functions — no React,
// no DOM — so the rendering layer reduces to "data → pixels" with
// every step testable in isolation.

export const VIEWBOX = 1000;
export const CENTER = VIEWBOX / 2;
export const SKY_RADIUS = 440;

export const ROOM_LABEL: Record<Exclude<Room, 'foyer'>, string> = {
  studio: 'The Studio',
  garden: 'The Garden',
  study: 'The Study',
  salon: 'The Salon',
};

export interface PositionedNode extends ConstellationNode {
  x: number;
  y: number;
}

export function nodeKey(n: { room: Exclude<Room, 'foyer'>; slug: string }): string {
  return `${n.room}/${n.slug}`;
}

export function polarToCartesian(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * SKY_RADIUS * Math.cos(rad),
    y: CENTER + radius * SKY_RADIUS * Math.sin(rad),
  };
}

export function buildPositionedMap(graph: ConstellationGraph): Map<string, PositionedNode> {
  return new Map(
    graph.nodes.map((node) => [
      nodeKey(node),
      { ...node, ...polarToCartesian(node.angleDeg, node.radius) },
    ]),
  );
}

// Stable presentation order so the SVG paints the same way on every
// render. Group by room (so room-clusters paint together), then
// newest-first within a room.
export function presentationOrder(nodes: readonly ConstellationNode[]): ConstellationNode[] {
  return [...nodes].sort((a, b) => {
    if (a.room !== b.room) return a.room.localeCompare(b.room);
    return b.date.getTime() - a.date.getTime();
  });
}

export function skyTitle(nodeCount: number): string {
  return `The constellation: ${nodeCount} ${nodeCount === 1 ? 'work' : 'works'} placed in the sky`;
}
