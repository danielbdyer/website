import { geodesicDistance } from '@/shared/geometry/sphere';
import { concordanceBetween } from './concordance';
import type { ConstellationGraph } from './constellation';
import { POLE_KEY, bearingsOf, findNode, neighborsOf, placePosition, type Place } from './skyWalk';

// ─── Presence ──────────────────────────────────────────────────────
//
// The sky does not show everything at once. From where the visitor
// stands, a capped number of stars are *present* — near in context —
// and the rest recede to faint lights until the walk brings them
// close. Context is measured four ways and summed: threads between
// them, axes shared, words in concordance, and distance on the
// sphere. The cap always keeps here, its neighbors, and the stars its
// bearings lead to, so every offered step is visible.
//
// And the delicious edge: a couple of the *least* relevant stars are
// present too, chosen deterministically for each place, so the sky
// keeps offering what is not closely related — the thing you would
// not have thought to look for. CONSTELLATION_WALK.md §"Presence".
// The same function the engine's aperture names as focus levels
// (CATHEDRALS.md §"What Is Blended").

/** The most stars present at once from a star. At the pole, the
 *  overview, everything is present. */
export const PRESENT_CAP = 24;
/** Of the cap, how many are strangers — the delicious edge. */
export const STRANGER_COUNT = 2;

const STROKE_WEIGHT: readonly number[] = [1, 0.9, 0.55, 0.3];
const STROKE_FLOOR = 0.1;
const AXIS_WEIGHT = 0.25;
const CONCORDANCE_WEIGHT = 0.45;
const SPATIAL_WEIGHT = 0.2;

function hash(input: string): number {
  return (
    [...input].reduce(
      (h, ch) => Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16_777_619),
      2_166_136_261,
    ) >>> 0
  );
}

/** Threads from `here` to every reachable star, up to STROKE_WEIGHT's
 *  reach. Breadth-first, functional. */
function strokesFrom(graph: ConstellationGraph, here: Place): ReadonlyMap<string, number> {
  const start = new Map(findNode(graph, here) ? [[here, 0]] : []);
  return STROKE_WEIGHT.slice(1).reduce<ReadonlyMap<string, number>>((reached, _w, i) => {
    const depth = i + 1;
    const frontier = [...reached].flatMap(([k, d]) => (d === depth - 1 ? [k] : []));
    const next = frontier.flatMap((k) => neighborsOf(graph, k).map((n) => n.key));
    return next.reduce((acc, k) => (acc.has(k) ? acc : new Map([...acc, [k, depth]])), reached);
  }, start);
}

/** How near each star is to `here`, in the walk's sense. 1 for here
 *  itself; the others in (0, 1). */
export function relevanceFrom(graph: ConstellationGraph, here: Place): ReadonlyMap<string, number> {
  const hereNode = findNode(graph, here);
  const from = placePosition(graph, here);
  const strokes = strokesFrom(graph, here);
  return new Map(
    graph.nodes.map((node) => {
      const key = node.key;
      if (key === here) return [key, 1];
      const depth = strokes.get(key);
      const byStroke = depth === undefined ? STROKE_FLOOR : (STROKE_WEIGHT[depth] ?? STROKE_FLOOR);
      const shared = hereNode
        ? node.axes.filter((a) => hereNode.axes.includes(a)).length /
          Math.max(hereNode.axes.length, 1)
        : 0;
      const byWords = concordanceBetween(graph.concordance, here, key);
      const bySky = 1 - geodesicDistance(from, node.unitPosition) / Math.PI;
      return [
        key,
        Math.min(
          0.999,
          byStroke * (1 - AXIS_WEIGHT - CONCORDANCE_WEIGHT - SPATIAL_WEIGHT) +
            shared * AXIS_WEIGHT +
            byWords * CONCORDANCE_WEIGHT +
            bySky * SPATIAL_WEIGHT,
        ),
      ];
    }),
  );
}

/** The stars present from `here`: at most `cap`, always including here,
 *  its neighbors, and its bearings' ends; the rest by relevance, save
 *  `strangers` of the least relevant, chosen deterministically. At the
 *  pole, or when the sky is small enough, everything. */
export function presentFrom(
  graph: ConstellationGraph,
  here: Place,
  cap: number = PRESENT_CAP,
  strangers: number = STRANGER_COUNT,
): ReadonlySet<string> {
  const keys = graph.nodes.map((node) => node.key);
  if (here === POLE_KEY || keys.length <= cap) return new Set(keys);
  const must = new Set([
    ...(findNode(graph, here) ? [here] : []),
    ...neighborsOf(graph, here).map((n) => n.key),
    ...bearingsOf(graph, here).flatMap((b) => (b.to ? [b.to] : [])),
  ]);
  const relevance = relevanceFrom(graph, here);
  const ranked = keys
    .filter((k) => !must.has(k))
    .toSorted((a, b) => (relevance.get(b) ?? 0) - (relevance.get(a) ?? 0) || a.localeCompare(b));
  const room = Math.max(cap - must.size, 0);
  const keepCount = Math.max(room - strangers, 0);
  const kept = ranked.slice(0, keepCount);
  const edge = ranked
    .slice(keepCount)
    .toSorted((a, b) => hash(`${here}|${a}`) - hash(`${here}|${b}`))
    .slice(0, room - kept.length);
  return new Set([...must, ...kept, ...edge]);
}

/** The node most in concordance with `here` that no thread already
 *  joins to it — the whisper's third line. Null at the pole or when
 *  the words are too faint to name. */
export function concordantFrom(
  graph: ConstellationGraph,
  here: Place,
  minimum = 0.08,
): { key: string; weight: number } | null {
  const neighbors = new Set(neighborsOf(graph, here).map((n) => n.key));
  const best = (graph.concordance?.[here] ?? []).find(
    (c) => !neighbors.has(c.key) && c.key !== here && findNode(graph, c.key) !== null,
  );
  return best && best.weight >= minimum ? { key: best.key, weight: best.weight } : null;
}
