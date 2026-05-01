import type {
  ConstellationEdge,
  ConstellationGraph,
  ConstellationHue,
  ConstellationNode,
} from '@/shared/content/constellation';
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
  return nodes.toSorted((a, b) => {
    if (a.room !== b.room) return a.room.localeCompare(b.room);
    return b.date.getTime() - a.date.getTime();
  });
}

export function skyTitle(nodeCount: number): string {
  return `The constellation: ${nodeCount} ${nodeCount === 1 ? 'work' : 'works'} placed in the sky`;
}

/** Resolved edge — the source/target's positions already looked up,
 *  so the renderer doesn't repeat the lookup per render. The edges
 *  whose endpoints aren't present (a stale edge after a node was
 *  removed, e.g.) are filtered out at this stage so the renderer's
 *  map is purely a render. */
export interface ResolvedEdge {
  id: string;
  hue: ConstellationHue;
  sourceKey: string;
  targetKey: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function resolveEdges(
  edges: readonly ConstellationEdge[],
  positioned: ReadonlyMap<string, PositionedNode>,
): ResolvedEdge[] {
  return edges.flatMap((edge) => {
    const source = positioned.get(`${edge.source.room}/${edge.source.slug}`);
    const target = positioned.get(`${edge.target.room}/${edge.target.slug}`);
    if (!source || !target) return [];
    return [
      {
        id: `${nodeKey(source)}|${nodeKey(target)}|${edge.facet}`,
        hue: edge.hue,
        sourceKey: nodeKey(source),
        targetKey: nodeKey(target),
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y,
      },
    ];
  });
}

/** Renderable node — positioned, with its key and hover-key
 *  attribute pre-derived. Keeps the render a pure mapping. */
export interface RenderableNode {
  node: ConstellationNode;
  pos: { x: number; y: number };
  key: string;
}

export function buildRenderableNodes(
  nodes: readonly ConstellationNode[],
  positioned: ReadonlyMap<string, PositionedNode>,
): RenderableNode[] {
  return presentationOrder(nodes).flatMap((node) => {
    const pos = positioned.get(nodeKey(node));
    if (!pos) return [];
    return [{ node, pos, key: nodeKey(node) }];
  });
}

/** Avoid an unused-import lint warning by re-exporting the type that
 *  consumers building their own resolvedEdge tests may want. The
 *  graph type is re-exported here as a convenience for tests of the
 *  layout module without forcing them to depend on constellation.ts
 *  directly. */

export { type ConstellationGraph } from '@/shared/content/constellation';
