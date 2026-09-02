import type { Facet } from '@/shared/types/common';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { NORTH_POLE, geodesicDistance, spherical, sphericalToUnit } from '@/shared/geometry/sphere';
import {
  COMPASS,
  FACET_AZIMUTH_DEG,
  RADIUS_MAX,
  nodeKey,
  type ConstellationEdge,
  type ConstellationGraph,
  type ConstellationHue,
  type ConstellationNode,
} from './constellation';

// ─── The walk ──────────────────────────────────────────────────────
//
// Pure answers to the two questions the sky asks on the visitor's
// behalf: where am I, and what leads away? *Here* is a star or the
// pole. Its neighborhood is the set of stars one stroke away along the
// figures; its bearings are its facets, each leading along that facet's
// figure to the nearest star that carries it. Nothing here touches the
// DOM or the camera — the organism reads these to draw names and the
// whisper, and the travel hook reads them to know where a bearing goes.
// CONSTELLATION_WALK.md §"The Compass", §"The Whisper".

/** Where the visitor stands before any star: the still center. */
export const POLE_KEY = 'pole';

/** The resting camera's distance from the sphere's center, in radii,
 *  for a landscape frame. Far enough back that the whole populated
 *  cap is in view with the dome's limb near the frame's edge. The
 *  prerendered stage camera (layout.ts), the camera signal, and the
 *  travel hook share it so first paint and hydration agree; the hook
 *  then adapts it to the live frame (restDistanceFor).
 *  CONSTELLATION_WALK.md §"Travel". */
export const REST_DISTANCE = 2.9;
const REST_MIN = 2.6;
const REST_MAX = 4.8;
/** The populated cap's colatitude: RADIUS_MAX of the disk. */
const POPULATED_THETA = (RADIUS_MAX * Math.PI) / 2;
const HALF_FOV = Math.PI / 8;
/** The viewbox's half-extent (500) over the sky radius (440): the NDC
 *  the frame's shorter side spans when the sky covers it. */
const NDC_PER_HALF_FRAME = 500 / 440;
const POPULATED_NDC_AT_REST =
  Math.atan(Math.sin(POPULATED_THETA) / (Math.cos(POPULATED_THETA) + REST_DISTANCE)) / HALF_FOV;

/** The camera distance at which the whole populated cap fits the
 *  frame's shorter side with a margin, under the given fit. A
 *  landscape frame rests near REST_DISTANCE; a portrait phone stands
 *  farther back so no star is cropped. The sky must work for every
 *  viewport it is given, not one. */
export function restDistanceFor(
  frameWidth: number,
  frameHeight: number,
  fit: 'cover' | 'contain' = 'cover',
): number {
  if (!(frameWidth > 0) || !(frameHeight > 0)) return REST_DISTANCE;
  const ratio =
    fit === 'cover' ? Math.min(frameWidth, frameHeight) / Math.max(frameWidth, frameHeight) : 1;
  const visibleNdc = NDC_PER_HALF_FRAME * ratio;
  const targetNdc = Math.min(0.86 * visibleNdc, POPULATED_NDC_AT_REST);
  const distance =
    Math.sin(POPULATED_THETA) / Math.tan(targetNdc * HALF_FOV) - Math.cos(POPULATED_THETA);
  return Math.min(Math.max(distance, REST_MIN), REST_MAX);
}

/** Where each facet's name is lettered: on its bearing, just outside
 *  the populated cap, so the compass reads around the sky's edge. */
export const COMPASS_RIM_THETA = 1.152;
export const COMPASS_RIM: Readonly<Record<Facet, UnitVector3>> = Object.fromEntries(
  COMPASS.map((facet) => [
    facet,
    sphericalToUnit(spherical(COMPASS_RIM_THETA, (FACET_AZIMUTH_DEG[facet] * Math.PI) / 180)),
  ]),
) as Record<Facet, UnitVector3>;

/** A place the visitor can stand: a node key (`room/slug`) or the pole. */
export type Place = string;

export interface Bearing {
  readonly facet: Facet;
  readonly hue: ConstellationHue;
  /** The star this bearing leads to from here, or null when the facet
   *  has no other member yet — a bearing that reads dim and goes
   *  nowhere: *nothing yet points that way*. */
  readonly to: string | null;
  /** The thread the bearing travels along, when here is a star (the
   *  pole joins nothing). Recorded as walked on arrival. */
  readonly edgeId: string | null;
}

export interface Neighbor {
  readonly key: string;
  readonly facet: Facet;
  /** Matches layout.ts's resolved edge id: `source|target|facet`. */
  readonly edgeId: string;
}

export function edgeId(edge: ConstellationEdge): string {
  return `${nodeKey(edge.source)}|${nodeKey(edge.target)}|${edge.facet}`;
}

export function findNode(graph: ConstellationGraph, key: Place): ConstellationNode | null {
  return graph.nodes.find((n) => nodeKey(n) === key) ?? null;
}

/** The position of a place on the sphere — a star's, or the pole. */
export function placePosition(graph: ConstellationGraph, place: Place): UnitVector3 {
  return findNode(graph, place)?.unitPosition ?? NORTH_POLE;
}

/** The stars one stroke away from `here` along the figures, with the
 *  facet and edge that join them. Empty at the pole (the pole joins
 *  nothing; it offers bearings instead). */
export function neighborsOf(graph: ConstellationGraph, here: Place): readonly Neighbor[] {
  return graph.edges.flatMap((edge) => {
    const source = nodeKey(edge.source);
    const target = nodeKey(edge.target);
    if (source === here) return [{ key: target, facet: edge.facet, edgeId: edgeId(edge) }];
    if (target === here) return [{ key: source, facet: edge.facet, edgeId: edgeId(edge) }];
    return [];
  });
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

/** What leads away from `here`. At a star: its own facets, in compass
 *  order, each leading to its nearest figure-neighbor along that facet.
 *  At the pole: all eight bearings, each leading to the nearest star
 *  that carries the facet. */
export function bearingsOf(graph: ConstellationGraph, here: Place): readonly Bearing[] {
  const node = findNode(graph, here);
  const from = node?.unitPosition ?? NORTH_POLE;
  const facets = node ? COMPASS.filter((f) => node.facets.includes(f)) : COMPASS;
  const neighbors = node ? neighborsOf(graph, here) : [];
  return facets.map((facet) => {
    const candidates = node
      ? neighbors
          .filter((n) => n.facet === facet)
          .flatMap((n) => {
            const found = findNode(graph, n.key);
            return found ? [found] : [];
          })
      : graph.nodes.filter((n) => n.facets.includes(facet));
    const to = nearestTo(from, candidates);
    const toKey = to ? nodeKey(to) : null;
    const along = neighbors.find((n) => n.facet === facet && n.key === toKey)?.edgeId ?? null;
    return { facet, hue: graph.facetHues[facet], to: toKey, edgeId: along };
  });
}

/** The keys that carry a label at rest: here, its neighbors, and the
 *  stars its bearings lead to. Context reaches exactly one stroke. */
export function namedFrom(graph: ConstellationGraph, here: Place): ReadonlySet<string> {
  const names = [
    ...(findNode(graph, here) ? [here] : []),
    ...neighborsOf(graph, here).map((n) => n.key),
    ...bearingsOf(graph, here).flatMap((b) => (b.to ? [b.to] : [])),
  ];
  return new Set(names);
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
    return { key: nodeKey(node), along };
  });
  const best = scored.filter((s) => s.along > 0.05).toSorted((a, b) => b.along - a.along)[0];
  return best?.key ?? null;
}
