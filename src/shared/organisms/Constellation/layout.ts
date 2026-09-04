import type { Origin } from '@dbd/slice';
import {
  edgeId,
  type ConstellationEdge,
  type ConstellationGraph,
  type ConstellationHue,
  type ConstellationNode,
} from '@/shared/content/constellation';
import type { Camera, CameraBasis } from '@/shared/geometry/camera';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { cameraBasis, project } from '@/shared/geometry/camera';
import { DAYSTAR_REST_FRAME, REST_DISTANCE, daystarViewboxPoint } from '@/shared/content/skyWalk';
import type { CompassPoint } from '@/shared/atoms/Compass/Compass';

// Layout primitives for the constellation. Pure functions — no React,
// no DOM — so the rendering layer reduces to "data → pixels" with
// every step testable in isolation.

export const VIEWBOX = 1000;
export const CENTER = VIEWBOX / 2;
export const SKY_RADIUS = 440;
/** Where the daystar is seated on the page for the prerender's assumed
 *  landscape frame; the travel hook re-seats it for the live frame. */
export const DAYSTAR_REST = daystarViewboxPoint(
  DAYSTAR_REST_FRAME.width,
  DAYSTAR_REST_FRAME.height,
  VIEWBOX,
);
export const DAYSTAR_REST_TRANSFORM = `translate(${DAYSTAR_REST.x.toFixed(2)} ${DAYSTAR_REST.y.toFixed(2)})`;

// The resting camera: beneath the firmament, looking up through the
// sphere's center at the far hemisphere — the dome. REST_DISTANCE
// (skyWalk.ts) is shared with the travel hook so the prerendered first
// paint and the hydrated camera agree (no jump on hydration). At this
// distance the whole populated dome is in view at once, its limb at
// the frame's edge. The FOV stays narrow on purpose: a wider lens lets
// the void back in around the dome; the narrow lens is what envelops.
export const STAGE_CAMERA: Camera = {
  position: { x: 0, y: 0, z: -REST_DISTANCE },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fovY: Math.PI / 4,
  near: 0.1,
  far: 10,
};

const STAGE_BASIS: CameraBasis = cameraBasis(STAGE_CAMERA);

/** The house's names for the groups its works come home to. A slice
 *  from another source names its groups as it likes; the sky shows
 *  them as given. */
export const GROUP_LABEL: Readonly<Record<string, string>> = {
  studio: 'The Studio',
  garden: 'The Garden',
  study: 'The Study',
  salon: 'The Salon',
};

export function groupLabelOf(group: string | null): string | null {
  return group === null ? null : (GROUP_LABEL[group] ?? group);
}

export interface PositionedNode extends ConstellationNode {
  x: number;
  y: number;
  /** Normalized [0, 1]; 0 = nearest (closest to camera), 1 = farthest. */
  depth: number;
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
      return [node.key, { ...node, x: projected.x, y: projected.y, depth: projected.depth }];
    }),
  );
}

// Stable presentation order so the SVG paints the same way on every
// render. Group by the source's groups (so a room's stars paint
// together; ungrouped last), then newest-first within a group.
export function presentationOrder(nodes: readonly ConstellationNode[]): ConstellationNode[] {
  return nodes.toSorted((a, b) => {
    const ga = a.group ?? '￿';
    const gb = b.group ?? '￿';
    if (ga !== gb) return ga.localeCompare(gb);
    return b.date.getTime() - a.date.getTime();
  });
}

export function skyTitle(nodeCount: number): string {
  return `The constellation: ${nodeCount} ${nodeCount === 1 ? 'star' : 'stars'} placed in the sky`;
}

/** Resolved edge — the source/target's positions already looked up,
 *  and the stroke decided (the axis's hue and dotting for a figure;
 *  the page's ink for a relation), so the renderer doesn't repeat the
 *  lookups per render. Edges whose endpoints aren't present are
 *  filtered out at this stage so the renderer's map is purely a
 *  render. */
export interface ResolvedEdge {
  id: string;
  hue: ConstellationHue | null;
  axis: string | null;
  origin: Origin;
  dotted: boolean;
  sourceKey: string;
  targetKey: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function resolveEdges(
  graph: ConstellationGraph,
  positioned: ReadonlyMap<string, PositionedNode>,
): ResolvedEdge[] {
  const dottedAxes = new Set(graph.axes.flatMap((axis) => (axis.dotted ? [axis.id] : [])));
  return graph.edges.flatMap((edge: ConstellationEdge) => {
    const source = positioned.get(edge.source);
    const target = positioned.get(edge.target);
    if (!source || !target) return [];
    return [
      {
        id: edgeId(edge),
        hue: edge.hue,
        axis: edge.axis,
        origin: edge.origin,
        dotted: edge.axis !== null && dottedAxes.has(edge.axis),
        sourceKey: source.key,
        targetKey: target.key,
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

// Order: presentation (group, date) first, then stable depth-sort —
// farthest depth painted first so closer stars overlap on top. The
// presentation sort keeps a group's stars together within each depth
// bucket; the depth pass turns it into back-to-front order.
export function buildRenderableNodes(
  nodes: readonly ConstellationNode[],
  positioned: ReadonlyMap<string, PositionedNode>,
): RenderableNode[] {
  const placed = presentationOrder(nodes).flatMap((node) => {
    const pos = positioned.get(node.key);
    if (!pos) return [];
    return [{ node, pos: { x: pos.x, y: pos.y }, depth: pos.depth, key: node.key }];
  });
  return placed.toSorted((a, b) => b.depth - a.depth);
}

/** The active star's hue, or null when no well is claimed. The
 *  companion glyph mixes its amber toward this hue by the per-tick
 *  --companion-claim the navigation hook writes. */
export function activeHueOf(
  nodes: readonly RenderableNode[],
  activeKey: string | null,
): ConstellationHue | null {
  if (activeKey === null) return null;
  return nodes.find(({ key }) => key === activeKey)?.node.hue ?? null;
}

/** The compass's names at the resting camera's projection of their
 *  rim points — the prerendered positions the projector then carries
 *  each tick (skyProjector.projectCompass). */
export function compassPoints(graph: ConstellationGraph): CompassPoint[] {
  return graph.axes.map((axis) => {
    const projected = projectToViewbox(axis.rim);
    return { axis: axis.id, name: axis.name, hue: axis.hue, x: projected.x, y: projected.y };
  });
}

/** The threads that meet each star, by node key — what a hover lights
 *  beside the star itself (dom/skyAttention). */
export function adjacencyOf(
  edges: readonly ResolvedEdge[],
): ReadonlyMap<string, readonly string[]> {
  return edges.reduce<Map<string, readonly string[]>>((acc, edge) => {
    acc.set(edge.sourceKey, [...(acc.get(edge.sourceKey) ?? []), edge.id]);
    acc.set(edge.targetKey, [...(acc.get(edge.targetKey) ?? []), edge.id]);
    return acc;
  }, new Map());
}

/** Whether a thread is present from where the visitor stands. A
 *  figure's stroke is present when both its stars are; a relation the
 *  slice carried only when, besides, one of its ends is named — here, a
 *  neighbor, or a bearing's end — so the overview shows the figures and
 *  a hint of the relations around the bearings, and a dense vault's
 *  mesh waits until the visitor stands near it. */
export function threadPresent(
  present: ReadonlySet<string>,
  named: ReadonlyMap<string, unknown>,
  edge: ResolvedEdge,
): boolean {
  const ends = present.has(edge.sourceKey) && present.has(edge.targetKey);
  if (edge.origin === 'emergent') return ends;
  return ends && (named.has(edge.sourceKey) || named.has(edge.targetKey));
}

export { type ConstellationGraph } from '@/shared/content/constellation';
