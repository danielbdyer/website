import type {
  ConstellationEdge,
  ConstellationGraph,
  ConstellationHue,
  ConstellationNode,
} from '@/shared/content/constellation';
import type { Room } from '@/shared/types/common';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { cameraBasis, project } from '@/shared/geometry/camera';

// Layout primitives for the constellation. Pure functions — no React,
// no DOM — so the rendering layer reduces to "data → pixels" with
// every step testable in isolation.

export const VIEWBOX = 1000;
export const CENTER = VIEWBOX / 2;
export const SKY_RADIUS = 440;

// Phase B camera: positioned below the sphere, looking up at the
// upper hemisphere. The FOV and distance are tuned so the equator-
// rim sits just inside the frame (the polestar lands at image
// center, rim at ±0.97 in normalized screen). This is a small
// visible shift from the disk-azimuthal projection — stars in the
// mid-radii feel slightly more "domed" — and the first commitment
// to rendering through a real 3D camera. Phase C makes this
// camera state and gives it to the navigation hook.
export const STAGE_CAMERA: Camera = {
  position: { x: 0, y: 0, z: -2.5 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fovY: Math.PI / 4,
  near: 0.1,
  far: 10,
};

const STAGE_BASIS: CameraBasis = cameraBasis(STAGE_CAMERA);

export const ROOM_LABEL: Record<Exclude<Room, 'foyer'>, string> = {
  studio: 'The Studio',
  garden: 'The Garden',
  study: 'The Study',
  salon: 'The Salon',
};

export interface PositionedNode extends ConstellationNode {
  x: number;
  y: number;
  /** Normalized [0, 1]; 0 = nearest (closest to camera), 1 = farthest. */
  depth: number;
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

/** Project a 3D unit-sphere position through the stage camera into
 *  viewbox coords. Screen +Y maps to viewbox -y (SVG y grows down).
 *  Returns the depth alongside the (x, y) so consumers can sort
 *  back-to-front. */
export function projectToViewbox(
  p: UnitVector3,
  camera: Camera = STAGE_CAMERA,
  basis: CameraBasis = STAGE_BASIS,
): { x: number; y: number; depth: number; inFront: boolean } {
  const proj = project(p, camera, basis, 1);
  return {
    x: CENTER + proj.screenX * SKY_RADIUS,
    y: CENTER - proj.screenY * SKY_RADIUS,
    depth: proj.depth,
    inFront: proj.inFront,
  };
}

export function buildPositionedMap(graph: ConstellationGraph): Map<string, PositionedNode> {
  return new Map(
    graph.nodes.map((node) => {
      const projected = projectToViewbox(node.unitPosition);
      return [nodeKey(node), { ...node, x: projected.x, y: projected.y, depth: projected.depth }];
    }),
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

/** Renderable node — positioned, with its key, depth, and the
 *  hover-key attribute pre-derived. Keeps the render a pure mapping
 *  from data to elements. Depth is exposed so the renderer can
 *  paint farthest stars first; the closer ones overlap on top. */
export interface RenderableNode {
  node: ConstellationNode;
  pos: { x: number; y: number };
  depth: number;
  key: string;
}

// Order: presentation (room, date) first, then stable depth-sort —
// farthest depth painted first so closer stars overlap on top. The
// presentation sort keeps room-clusters together within each depth
// bucket; the depth pass turns it into back-to-front order.
export function buildRenderableNodes(
  nodes: readonly ConstellationNode[],
  positioned: ReadonlyMap<string, PositionedNode>,
): RenderableNode[] {
  const placed = presentationOrder(nodes).flatMap((node) => {
    const pos = positioned.get(nodeKey(node));
    if (!pos) return [];
    return [{ node, pos: { x: pos.x, y: pos.y }, depth: pos.depth, key: nodeKey(node) }];
  });
  return placed.toSorted((a, b) => b.depth - a.depth);
}

/** Avoid an unused-import lint warning by re-exporting the type that
 *  consumers building their own resolvedEdge tests may want. The
 *  graph type is re-exported here as a convenience for tests of the
 *  layout module without forcing them to depend on constellation.ts
 *  directly. */

export { type ConstellationGraph } from '@/shared/content/constellation';
