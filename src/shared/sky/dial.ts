import type { ConstellationGraph } from '@/shared/content/constellation';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { project } from '@/shared/geometry/camera';
import { cameraAt } from './motion';

// ─── The dial ──────────────────────────────────────────────────────
//
// Nothing about the sky's size is fixed. What stays constant is what a
// person can hold at once: a few dozen stars in view, each with room
// for its name. The camera's distance from the sphere's center is the
// one dial that keeps it so. Far out, the whole ball fits the oculus —
// the palantír, held in the hands. At the center, the dome overhead
// fills the frame — the vault, stood inside. Standing at a star, the
// sky rests at whatever distance puts about VIEW_TARGET stars in view;
// the pole rests at the overview. For a sky of sixteen works that
// distance is the overview itself, so a small sky does not change; for
// a vault of hundreds of claims the visitor stands near the center.
// The number is found on the graph, not tuned per corpus.
// CONSTELLATION_WALK.md §"The Dial"; CATHEDRALS.md §"Held".

/** How many stars a view comfortably holds: the presence cap, and a
 *  little room around it for the faint context. */
export const VIEW_TARGET = 32;

/** The frame's half-extent in NDC along its shorter side: the viewbox
 *  spans ±500 where the sky's radius is 440 (layout.ts, VIEWBOX and
 *  SKY_RADIUS). */
const FRAME_NDC = 500 / 440;

/** The most stars sampled when measuring a sky, so the search stays
 *  cheap on a corpus of hundreds. */
const SAMPLE_CAP = 48;
const SEARCH_STEPS = 16;

export interface Frame {
  readonly width: number;
  readonly height: number;
}

/** How many of `points` are in the frame for a visitor standing at
 *  `at` with the sky at `rest`. Cover-fit: the shorter side spans the
 *  viewbox; the longer side shows more, by the frame's aspect. */
export function starsInView(
  points: readonly UnitVector3[],
  at: UnitVector3,
  rest: number,
  frame: Frame,
): number {
  const { camera, basis } = cameraAt(at, rest);
  const aspect = frame.width > 0 && frame.height > 0 ? frame.width / frame.height : 1;
  const halfX = FRAME_NDC * Math.max(1, aspect);
  const halfY = FRAME_NDC * Math.max(1, 1 / aspect);
  return points.filter((point) => {
    const p = project(point, camera, basis, 1);
    return p.inFront && Math.abs(p.screenX) <= halfX && Math.abs(p.screenY) <= halfY;
  }).length;
}

const sampleOf = <T>(items: readonly T[], cap: number): readonly T[] => {
  if (items.length <= cap) return items;
  const stride = items.length / cap;
  return Array.from({ length: cap }, (_, i) => items[Math.floor(i * stride)]!);
};

/** The mean number of stars in view, standing at each of a sample of
 *  the graph's stars, with the sky at `rest`. */
export function meanInView(graph: ConstellationGraph, rest: number, frame: Frame): number {
  const points = graph.nodes.map((node) => node.unitPosition);
  const sample = sampleOf(points, SAMPLE_CAP);
  if (sample.length === 0) return 0;
  const total = sample.reduce((sum, at) => sum + starsInView(points, at, rest, frame), 0);
  return total / sample.length;
}

/** The rest distance for standing at a star: the farthest distance,
 *  up to the overview, at which about `target` stars are in view. The
 *  overview itself when the whole sky is that small; the center when
 *  even the center is crowded. Found by bisection — the view grows
 *  with the distance. */
export function walkDistanceFor(
  graph: ConstellationGraph,
  overview: number,
  frame: Frame,
  target: number = VIEW_TARGET,
): number {
  if (meanInView(graph, overview, frame) <= target) return overview;
  if (meanInView(graph, 0, frame) > target) return 0;
  const found = Array.from({ length: SEARCH_STEPS }).reduce<{ lo: number; hi: number }>(
    ({ lo, hi }) => {
      const mid = (lo + hi) / 2;
      return meanInView(graph, mid, frame) <= target ? { lo: mid, hi } : { lo, hi: mid };
    },
    { lo: 0, hi: overview },
  );
  return found.lo;
}
