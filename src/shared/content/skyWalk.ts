import type { UnitVector3 } from '@/shared/geometry/sphere';
import { NORTH_POLE, geodesicDistance } from '@/shared/geometry/sphere';
import {
  capFor,
  DEFAULT_CAP,
  edgeId,
  type Axis,
  type ConstellationGraph,
  type ConstellationHue,
  type ConstellationNode,
} from './constellation';

export { COMPASS_RIM_THETA, edgeId } from './constellation';

// ─── The walk ──────────────────────────────────────────────────────
//
// Pure answers to the two questions the sky asks on the visitor's
// behalf: where am I, and what leads away? *Here* is a star or the
// pole. Its neighborhood is the set of stars one thread away — along
// the figures, or along a relation the slice carries; its bearings are
// its axes, each leading along that axis's figure to the nearest star
// that carries it. Nothing here touches the DOM or the camera — the
// organism reads these to draw names and the whisper, and the travel
// hook reads them to know where a bearing goes.
// CONSTELLATION_WALK.md §"The Compass", §"The Whisper".

/** Where the visitor stands before any star: the still center. */
export const POLE_KEY = 'pole';

/** The resting camera's distance from the sphere's center, in radii,
 *  for a landscape frame: the distance at which the whole sphere — the
 *  oculus, the round opening through which the room sees the sky —
 *  fits the frame's shorter side with a margin. The prerendered stage
 *  camera (layout.ts), the camera signal, and the travel hook share it
 *  so first paint and hydration agree; the hook then adapts it to the
 *  live frame (restDistanceFor). CONSTELLATION_WALK.md §"The Oculus". */
export const REST_DISTANCE = 3.85;
const REST_MIN = 3.2;
const REST_MAX = 5.6;
const HALF_FOV = Math.PI / 8;
/** The viewbox's half-extent (500) over the sky radius (440): the NDC
 *  the frame's shorter side spans when the sky covers it. */
const NDC_PER_HALF_FRAME = 500 / 440;
/** How much of the frame's shorter side the oculus spans. */
const OCULUS_FILL = 0.92;

/** The sphere's limb as NDC from a camera at `distance` radii. */
export function limbNdcAt(distance: number): number {
  return Math.tan(Math.asin(1 / distance)) / Math.tan(HALF_FOV);
}

/** The camera distance at which the whole sphere fits the frame's
 *  shorter side with a margin, under the given fit. A landscape frame
 *  rests near REST_DISTANCE; a portrait phone stands farther back so
 *  the oculus fits its width. The sky must work for every viewport it
 *  is given, not one. */
export function restDistanceFor(
  frameWidth: number,
  frameHeight: number,
  fit: 'cover' | 'contain' = 'cover',
): number {
  if (!(frameWidth > 0) || !(frameHeight > 0)) return REST_DISTANCE;
  const ratio =
    fit === 'cover' ? Math.min(frameWidth, frameHeight) / Math.max(frameWidth, frameHeight) : 1;
  const limbNdc = OCULUS_FILL * NDC_PER_HALF_FRAME * ratio;
  const distance = 1 / Math.sin(Math.atan(limbNdc * Math.tan(HALF_FOV)));
  return Math.min(Math.max(distance, REST_MIN), REST_MAX);
}

/** Where the daystar sits: not in the sky but on the page, as the
 *  plate's corner emblem — the sun or moon an atlas keeps in the margin
 *  — in the frame's upper right, clear of the oculus at every aspect.
 *  Viewbox units, for a frame of the given size under the given fit. */
export function daystarViewboxPoint(
  frameWidth: number,
  frameHeight: number,
  viewboxSize: number,
  fit: 'cover' | 'contain' = 'cover',
): { x: number; y: number } {
  const sx = frameWidth / viewboxSize;
  const sy = frameHeight / viewboxSize;
  const scale = fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
  if (!(scale > 0)) return { x: viewboxSize * 0.885, y: viewboxSize * 0.288 };
  const offsetX = (frameWidth - viewboxSize * scale) / 2;
  const offsetY = (frameHeight - viewboxSize * scale) / 2;
  const right = (frameWidth - offsetX) / scale;
  const top = -offsetY / scale;
  return { x: right - viewboxSize * 0.115, y: top + viewboxSize * 0.1 };
}

/** The frame the prerender assumes — a landscape screen — so first paint
 *  seats the emblem where hydration will find it. */
export const DAYSTAR_REST_FRAME = { width: 1440, height: 900 } as const;

/** A place the visitor can stand: a node key or the pole. */
export type Place = string;

export interface Bearing {
  readonly axis: string;
  readonly name: string;
  readonly hue: ConstellationHue;
  /** The star this bearing leads to from here, or null when the axis
   *  has no other member yet — a bearing that reads dim and goes
   *  nowhere: *nothing yet points that way*. */
  readonly to: string | null;
  /** The thread the bearing travels along, when here is a star (the
   *  pole joins nothing). Recorded as walked on arrival. */
  readonly edgeId: string | null;
}

export interface Neighbor {
  readonly key: string;
  /** The axis whose figure joins them, or null along a relation. */
  readonly axis: string | null;
  /** Matches layout.ts's resolved edge id (constellation.ts, edgeId). */
  readonly edgeId: string;
}

export function findNode(graph: ConstellationGraph, key: Place): ConstellationNode | null {
  return graph.nodes.find((n) => n.key === key) ?? null;
}

/** The position of a place on the sphere — a star's, or the pole. */
export function placePosition(graph: ConstellationGraph, place: Place): UnitVector3 {
  return findNode(graph, place)?.unitPosition ?? NORTH_POLE;
}

/** The stars one thread away from `here`, with the axis (if any) and
 *  edge that join them. Empty at the pole (the pole joins nothing; it
 *  offers bearings instead). */
export function neighborsOf(graph: ConstellationGraph, here: Place): readonly Neighbor[] {
  return graph.edges.flatMap((edge) => {
    if (edge.source === here) return [{ key: edge.target, axis: edge.axis, edgeId: edgeId(edge) }];
    if (edge.target === here) return [{ key: edge.source, axis: edge.axis, edgeId: edgeId(edge) }];
    return [];
  });
}

/** The axes a place offers as bearings: a star's own, in compass
 *  order; at the pole, every axis. */
export function axesAt(graph: ConstellationGraph, here: Place): readonly Axis[] {
  const node = findNode(graph, here);
  return node ? graph.axes.filter((axis) => node.axes.includes(axis.id)) : graph.axes;
}

function nearestTo(
  from: UnitVector3,
  candidates: readonly ConstellationNode[],
): ConstellationNode | null {
  return candidates.reduce<{ node: ConstellationNode | null; d: number }>(
    (best, node) => {
      const d = geodesicDistance(from, node.unitPosition);
      return d < best.d ? { node, d } : best;
    },
    { node: null, d: Number.POSITIVE_INFINITY },
  ).node;
}

/** What leads away from `here`. At a star: its own axes, in compass
 *  order, each leading to its nearest figure-neighbor along that axis.
 *  At the pole: every bearing, each leading to the nearest star that
 *  carries the axis. */
export function bearingsOf(graph: ConstellationGraph, here: Place): readonly Bearing[] {
  const node = findNode(graph, here);
  const from = node?.unitPosition ?? NORTH_POLE;
  const neighbors = node ? neighborsOf(graph, here) : [];
  return axesAt(graph, here).map((axis) => {
    const candidates = node
      ? neighbors
          .filter((n) => n.axis === axis.id)
          .flatMap((n) => {
            const found = findNode(graph, n.key);
            return found ? [found] : [];
          })
      : graph.nodes.filter((n) => n.axes.includes(axis.id));
    const to = nearestTo(from, candidates);
    const toKey = to ? to.key : null;
    const along = neighbors.find((n) => n.axis === axis.id && n.key === toKey)?.edgeId ?? null;
    return { axis: axis.id, name: axis.name, hue: axis.hue, to: toKey, edgeId: along };
  });
}

/** Whether any star is named from a place. At the pole of a crowded
 *  sky — one whose cap has grown past the default dome — none is: the
 *  compass's names carry the labels until the visitor enters
 *  (CONSTELLATION_WALK.md §"The Dial"). */
export function namesAt(graph: ConstellationGraph, here: Place): boolean {
  return here !== POLE_KEY || capFor(graph.nodes.length) === DEFAULT_CAP;
}

/** The keys that carry a label at rest: here, its neighbors, and the
 *  stars its bearings lead to. Context reaches exactly one thread. */
export function namedFrom(graph: ConstellationGraph, here: Place): ReadonlySet<string> {
  if (!namesAt(graph, here)) return new Set();
  const names = [
    ...(findNode(graph, here) ? [here] : []),
    ...neighborsOf(graph, here).map((n) => n.key),
    ...bearingsOf(graph, here).flatMap((b) => (b.to ? [b.to] : [])),
  ];
  return new Set(names);
}

/** How a label visible at rest ranks: the star you stand at, a
 *  neighbor one thread along, or the end of a bearing. The names speak
 *  at three volumes. */
export type NamedRank = 'here' | 'near' | 'far';

export function namedRanks(graph: ConstellationGraph, here: Place): ReadonlyMap<string, NamedRank> {
  if (!namesAt(graph, here)) return new Map();
  const far = bearingsOf(graph, here).flatMap((b): [string, NamedRank][] =>
    b.to ? [[b.to, 'far']] : [],
  );
  const near = neighborsOf(graph, here).map((n): [string, NamedRank] => [n.key, 'near']);
  const self: [string, NamedRank][] = findNode(graph, here) ? [[here, 'here']] : [];
  return new Map([...far, ...near, ...self]);
}

/** Every place one step from here: the neighbors along the threads,
 *  each with its thread, and the ends of the bearings — the tracks a
 *  drag can follow. Deduplicated; neighbors first. */
export interface Step {
  readonly key: string;
  readonly edgeId: string | null;
}

export function stepsFrom(graph: ConstellationGraph, here: Place): readonly Step[] {
  const neighbors = neighborsOf(graph, here).map((n) => ({ key: n.key, edgeId: n.edgeId }));
  const seen = new Set(neighbors.map((n) => n.key));
  const ends = bearingsOf(graph, here).flatMap((b) =>
    b.to && !seen.has(b.to) ? [{ key: b.to, edgeId: b.edgeId }] : [],
  );
  return [...neighbors, ...ends];
}

/** The star nearest to a screen direction from `here`, for the arrow
 *  keys: among the neighbors and the stars the bearings lead to (so
 *  the pole, which has no neighbors, still answers), the one whose
 *  direction from here best matches `direction` (a unit tangent at
 *  here in world space). Null when nothing lies that way. */
export function neighborToward(
  graph: ConstellationGraph,
  here: Place,
  direction: UnitVector3,
): string | null {
  const from = placePosition(graph, here);
  const keys = new Set([
    ...neighborsOf(graph, here).map((n) => n.key),
    ...bearingsOf(graph, here).flatMap((b) => (b.to ? [b.to] : [])),
  ]);
  const candidates = [...keys].flatMap((key) => {
    const node = findNode(graph, key);
    return node ? [node] : [];
  });
  const scored = candidates.map((node) => {
    const p = node.unitPosition;
    const dot = from.x * p.x + from.y * p.y + from.z * p.z;
    const tx = p.x - dot * from.x;
    const ty = p.y - dot * from.y;
    const tz = p.z - dot * from.z;
    const m = Math.hypot(tx, ty, tz) || 1;
    const along = (tx * direction.x + ty * direction.y + tz * direction.z) / m;
    return { key: node.key, along };
  });
  const best = scored.filter((s) => s.along > 0.05).toSorted((a, b) => b.along - a.along)[0];
  return best?.key ?? null;
}
