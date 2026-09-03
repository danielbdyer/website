import type { DisplayWork } from './preview';
import type { Facet, Room } from '@/shared/types/common';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { diskToHemisphere, geodesicDistance } from '@/shared/geometry/sphere';
import { isPreviewWork } from './preview';
import { getDisplayWorksByRoomSync } from './display';
import { buildConcordance, type Concordance } from './concordance';

// ─── The Constellation Graph ───────────────────────────────────────
//
// A projection of the site's content as a sky. Each work becomes a star;
// each facet's stars are joined into a figure. The data layer is pure —
// it derives the constellation from the existing display works without
// knowing anything about rendering.
//
// Deterministic per work: a star's place depends only on its own facets
// (and a jitter hashed from its slug), so adding a work never moves
// another. CONSTELLATION_WALK.md §"The Compass" and §"What the Sky Draws
// at Rest" describe the visible result; this file is the data the
// renderer consumes.
//
// The Foyer is excluded. The Foyer is the ground we look up from, not
// a region of the sky. (DOMAIN_MODEL.md §"Invariants" — the Foyer is a
// real room with a real empty set, treated honestly here as elsewhere.)

const CONSTELLATION_ROOMS: readonly Exclude<Room, 'foyer'>[] = [
  'studio',
  'garden',
  'study',
  'salon',
];

// ─── The compass ───────────────────────────────────────────────────
//
// The eight facets take the eight points of the polestar: each is a
// bearing, an azimuth on the dome. Adjacent bearings share a hue, so the
// dome reads as four chromatic arcs (warm, rose, violet, gold — see
// FACET_HUE). A work sits where its facets pull it: at the centroid of
// its facets' anchors, which places a single-facet work on its bearing
// and pulls a many-faceted work inward toward the pole, the still center.
// CONSTELLATION_WALK.md §"The Compass".
export const FACET_AZIMUTH_DEG: Record<Facet, number> = {
  craft: 0,
  body: 45,
  beauty: 90,
  language: 135,
  consciousness: 180,
  becoming: 225,
  leadership: 270,
  relation: 315,
};

/** The compass in bearing order, for surfaces that offer every
 *  bearing (the whisper at the pole). */
export const COMPASS: readonly Facet[] = (Object.keys(FACET_AZIMUTH_DEG) as Facet[]).toSorted(
  (a, b) => FACET_AZIMUTH_DEG[a] - FACET_AZIMUTH_DEG[b],
);

// Editorial assignment of the held accent vocabulary to the eight
// facets. DESIGN_SYSTEM.md §"Held accents" reserved the four hues as
// vocabulary; the constellation is the first surface where they speak.
// Some facets share a hue by design — the difference is carried by
// bearing and label, not by an exhaustive eight-hue palette.
//
// The mapping is editorial, named here so a future revision is one
// edit. The facet chips elsewhere on the site do *not* adopt these
// hues — the held discipline still holds. Only the constellation.
const FACET_HUE: Record<Facet, ConstellationHue> = {
  craft: 'warm',
  body: 'warm',
  beauty: 'rose',
  language: 'rose',
  consciousness: 'violet',
  becoming: 'violet',
  leadership: 'gold',
  relation: 'gold',
};

export type ConstellationHue = 'warm' | 'rose' | 'violet' | 'gold';

export interface ConstellationNode {
  room: Exclude<Room, 'foyer'>;
  slug: string;
  title: string;
  date: Date;
  facets: readonly Facet[];
  /** Salon works only; undefined elsewhere. */
  posture: DisplayWork['posture'];
  /** True if the work is a preview/draft surfaced in dev only. */
  isPreview: boolean;
  /** Polar coordinates within a unit circle: angleDeg ∈ [0, 360),
   *  radius ∈ [0, 1]. Center is the firmament's polestar; rim is
   *  the horizon. Deterministic in the work's own facets and slug. */
  angleDeg: number;
  radius: number;
  /** Position on the latent unit sphere — the topology the camera
   *  travels. The 2D `(angleDeg, radius)` is the azimuthal-equidistant
   *  projection of this 3D position onto the upper hemisphere: the
   *  disk's center is the north pole, the rim is the equator. */
  unitPosition: UnitVector3;
  /** Hue of the work's first-listed facet, or 'gold' as a quiet
   *  default for facetless works. The renderer paints the star in
   *  this hue; a figure's strokes carry their own facet's hue. */
  hue: ConstellationHue;
  /** Twinkle phase offset in seconds, deterministic per slug, used
   *  as the halo's animation-delay so adjacent stars don't pulse in
   *  sync. Bounded by the twinkle duration in CSS (`star-twinkle`
   *  keyframes); any value in [0, duration) yields a stable, lightly
   *  randomized starfield. */
  twinklePhase: number;
}

/** One stroke of a facet's figure — the two stars it joins and the
 *  facet it belongs to. A figure is the spanning tree of its facet's
 *  members (CONSTELLATION_WALK.md §"What the Sky Draws at Rest"). */
export interface ConstellationEdge {
  /** The facet whose figure this stroke belongs to. */
  facet: Facet;
  /** Hue derived from the facet via FACET_HUE. */
  hue: ConstellationHue;
  /** Slugs are addressable identifiers; node lookup happens by
   *  matching `room` + `slug` against the nodes array. */
  source: { room: Exclude<Room, 'foyer'>; slug: string };
  target: { room: Exclude<Room, 'foyer'>; slug: string };
}

export interface ConstellationGraph {
  nodes: readonly ConstellationNode[];
  edges: readonly ConstellationEdge[];
  /** Facet → hue mapping, exposed so the renderer can color a
   *  figure without re-deriving the assignment. */
  facetHues: Readonly<Record<Facet, ConstellationHue>>;
  /** How near works are in their words (concordance.ts); feeds the
   *  sky's presence. Absent when a graph was built without texts. */
  concordance?: Concordance;
}

// ─── Deterministic positioning ────────────────────────────────────
//
// A small string-hash producing a stable 32-bit integer. Used for the
// per-slug jitter and twinkle phase. Crypto-strength is not needed; the
// only requirement is that the same input produces the same output
// across builds and platforms.

function hash(input: string): number {
  // FNV-1a (32-bit). Functional fold over the input's code points;
  // identical bit-for-bit to the imperative form.
  return (
    [...input].reduce(
      (h, ch) => Math.imul(h ^ (ch.codePointAt(0) ?? 0), 16_777_619),
      2_166_136_261,
    ) >>> 0
  );
}

// 2^32 - 1, the maximum value `hash()` can return. Inlined as a
// computed constant rather than the hex literal `0xFFFFFFFF` because
// stylistic-prettier normalizes hex casing to lowercase, which
// then trips unicorn/number-literal-case.
const UINT32_MAX = 2 ** 32 - 1;

function unitOffset(seed: string): number {
  // Maps a hash to [0, 1) deterministically.
  return hash(seed) / UINT32_MAX;
}

// Twinkle phase ceiling — the upper bound on each star's halo
// animation-delay. Matches the CSS `star-twinkle` keyframe duration
// in tokens.css so a phase value in [0, ceiling) puts each star at a
// random point in the cycle. If the CSS duration changes, this
// changes too — the value is paired, not free.
const TWINKLE_DURATION_SECONDS = 4.5;

// Each facet's anchor sits this far from the pole (as a fraction of the
// disk; radius × 90° = degrees from the pole, so ≈47°). A single-facet
// work lands on its anchor; a many-faceted work at the centroid of its
// anchors, pulled inward. The bounds keep the polestar's center clear
// and hold the populated dome within the camera's resting view. A small
// deterministic jitter separates works that share a facet set exactly.
const FACET_ANCHOR_RADIUS = 0.62;
// Nothing sits inside the polestar figure: the still center stays empty.
const RADIUS_MIN = 0.18;
export const RADIUS_MAX = 0.78;
const JITTER_RADIUS = 0.04;
const JITTER_AZIMUTH_DEG = 9;

export interface NodePlacement {
  readonly angleDeg: number;
  readonly radius: number;
  readonly unitPosition: UnitVector3;
}

/** Where a work sits: the centroid of its facets' anchors on the disk,
 *  jittered per slug, un-projected onto the upper hemisphere.
 *  Facetless works, and works whose facets pull in every direction
 *  and cancel, rest near the pole with a hashed bearing — a true thing
 *  to say about them. Exported so the placement rule is testable
 *  without the corpus. */
export function placeWork(slug: string, facets: readonly Facet[]): NodePlacement {
  const centroid = facets.reduce(
    (acc, facet) => {
      const az = (FACET_AZIMUTH_DEG[facet] * Math.PI) / 180;
      return {
        x: acc.x + (FACET_ANCHOR_RADIUS * Math.cos(az)) / facets.length,
        y: acc.y + (FACET_ANCHOR_RADIUS * Math.sin(az)) / facets.length,
      };
    },
    { x: 0, y: 0 },
  );
  const pull = Math.hypot(centroid.x, centroid.y);
  const jitterR = (unitOffset(`${slug}/jitter-r`) - 0.5) * 2 * JITTER_RADIUS;
  const jitterA = (unitOffset(`${slug}/jitter-a`) - 0.5) * 2 * JITTER_AZIMUTH_DEG;
  const baseAngleDeg =
    pull < 1e-9
      ? unitOffset(`${slug}/angle`) * 360
      : (Math.atan2(centroid.y, centroid.x) * 180) / Math.PI;
  const radius = Math.min(Math.max(pull + jitterR, RADIUS_MIN), RADIUS_MAX);
  const angleDeg = (((baseAngleDeg + jitterA) % 360) + 360) % 360;
  const unitPosition = diskToHemisphere(radius, (angleDeg * Math.PI) / 180);
  return { angleDeg, radius, unitPosition };
}

// Two works with the same facets land on the same centroid, and works
// whose facets face each other across the compass all pull toward the
// center. The spread keeps every star at least MIN_SEPARATION apart in
// the disk (about a label's height at rest) by nudging close pairs
// away from each other a few times — deterministic, so the sky is the
// same on every build. Placement stays honest: a star moves only as
// far as it must to be seen.
const MIN_SEPARATION = 0.095;
const SPREAD_ITERATIONS = 12;
// Coincident points have no direction between them; they part along a
// golden-angle fan keyed by index so the split is stable and even.
const GOLDEN_ANGLE_RAD = 2.399_963;

interface DiskPoint {
  readonly x: number;
  readonly y: number;
}

const toDisk = (p: NodePlacement): DiskPoint => ({
  x: p.radius * Math.cos((p.angleDeg * Math.PI) / 180),
  y: p.radius * Math.sin((p.angleDeg * Math.PI) / 180),
});

const clampDisk = (p: DiskPoint): DiskPoint => {
  const r = Math.hypot(p.x, p.y);
  const clamped = Math.min(Math.max(r, RADIUS_MIN), RADIUS_MAX);
  if (r < 1e-9) return { x: clamped, y: 0 };
  return { x: (p.x / r) * clamped, y: (p.y / r) * clamped };
};

function pushApart(points: readonly DiskPoint[]): DiskPoint[] {
  return points.map((p, i) =>
    clampDisk(
      points.reduce((acc, q, j) => {
        if (i === j) return acc;
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d >= MIN_SEPARATION) return acc;
        const step = (MIN_SEPARATION - d) / 2;
        const ux = d > 1e-9 ? dx / d : Math.cos(i * GOLDEN_ANGLE_RAD);
        const uy = d > 1e-9 ? dy / d : Math.sin(i * GOLDEN_ANGLE_RAD);
        return { x: acc.x + ux * step, y: acc.y + uy * step };
      }, p),
    ),
  );
}

/** Separate placements that would sit on top of each other. Pure;
 *  order-preserving; idempotent once settled. */
export function spreadPlacements(placements: readonly NodePlacement[]): NodePlacement[] {
  const settled = Array.from({ length: SPREAD_ITERATIONS }).reduce<DiskPoint[]>(
    (pts) => pushApart(pts),
    placements.map(toDisk),
  );
  return settled.map((p) => {
    const radius = Math.hypot(p.x, p.y);
    const angleDeg = ((((Math.atan2(p.y, p.x) * 180) / Math.PI) % 360) + 360) % 360;
    return { angleDeg, radius, unitPosition: diskToHemisphere(radius, (angleDeg * Math.PI) / 180) };
  });
}

// ─── Figures ───────────────────────────────────────────────────────
//
// Each facet's member stars are joined by the fewest strokes that
// connect them — a spanning tree over geodesic distance (Prim's method,
// grown from the first member in stable key order). The tree is the
// facet's figure: a few lines a visitor can recognize and remember, in
// place of the complete co-membership graph, which drew a line between
// every pair and said nothing. Derived relation shows as attention (the
// lit figure), never as a resting mesh. CONSTELLATION_WALK.md §"What the
// Sky Draws at Rest".

export function nodeKey(n: { room: Exclude<Room, 'foyer'>; slug: string }): string {
  return `${n.room}/${n.slug}`;
}

type Stroke = readonly [ConstellationNode, ConstellationNode];

interface Growing {
  readonly inTree: readonly ConstellationNode[];
  readonly outside: readonly ConstellationNode[];
  readonly strokes: readonly Stroke[];
}

/** The nearest (tree node, outside node) pair by geodesic distance —
 *  the next stroke Prim's method adds. Ties resolve to the earlier
 *  outside node in stable order, so the figure is deterministic. */
function nearestStroke(acc: Growing): { from: ConstellationNode; to: ConstellationNode } {
  return acc.outside.reduce(
    (best, candidate) => {
      const nearest = acc.inTree.reduce(
        (bt, t) => {
          const d = geodesicDistance(t.unitPosition, candidate.unitPosition);
          return d < bt.d ? { node: t, d } : bt;
        },
        { node: acc.inTree[0]!, d: Number.POSITIVE_INFINITY },
      );
      return nearest.d < best.d ? { from: nearest.node, to: candidate, d: nearest.d } : best;
    },
    { from: acc.inTree[0]!, to: acc.outside[0]!, d: Number.POSITIVE_INFINITY },
  );
}

/**
 * The spanning strokes of a figure over `members` (stable key order).
 *
 * @bigO Time: O(n³) in the facet's member count — n rounds, each
 *       scanning outside × tree. Runs once per facet at build time on
 *       a corpus of tens, never on the hot path.
 */
function spanningStrokes(members: readonly ConstellationNode[]): readonly Stroke[] {
  if (members.length < 2) return [];
  const [first, ...rest] = members;
  const grown = rest.reduce<Growing>(
    (acc) => {
      const next = nearestStroke(acc);
      return {
        inTree: [...acc.inTree, next.to],
        outside: acc.outside.filter((n) => n !== next.to),
        strokes: [...acc.strokes, [next.from, next.to]],
      };
    },
    { inTree: [first!], outside: rest, strokes: [] },
  );
  return grown.strokes;
}

/** Every facet's figure as edges. Source/target are ordered by key so
 *  the same graph yields the same edge list every time. */
function deriveFacetFigures(nodes: readonly ConstellationNode[]): ConstellationEdge[] {
  const facetPairs = nodes.flatMap((node) => node.facets.map((facet) => [facet, node] as const));
  const facetGroups = Map.groupBy(facetPairs, ([facet]) => facet);
  return [...facetGroups].flatMap(([facet, entries]) => {
    const members = entries
      .map(([, node]) => node)
      .toSorted((a, b) => nodeKey(a).localeCompare(nodeKey(b)));
    return spanningStrokes(members).map(([a, b]) => {
      const [source, target] = nodeKey(a) <= nodeKey(b) ? [a, b] : [b, a];
      return {
        facet,
        hue: FACET_HUE[facet],
        source: { room: source.room, slug: source.slug },
        target: { room: target.room, slug: target.slug },
      };
    });
  });
}

// ─── Public API ────────────────────────────────────────────────────

export function getConstellationGraphSync(): ConstellationGraph {
  const allWorks = CONSTELLATION_ROOMS.flatMap((room) =>
    getDisplayWorksByRoomSync(room).map((work) => ({ room, work })),
  ).toSorted((a, b) => `${a.room}/${a.work.slug}`.localeCompare(`${b.room}/${b.work.slug}`));
  const placements = spreadPlacements(
    allWorks.map(({ work }) => placeWork(work.slug, work.facets)),
  );
  const nodes: ConstellationNode[] = allWorks.map(({ room, work }, i) => {
    const primaryFacet = work.facets[0];
    return {
      room,
      slug: work.slug,
      title: work.title,
      date: work.date,
      facets: work.facets,
      posture: work.posture,
      isPreview: isPreviewWork(work),
      hue: primaryFacet ? FACET_HUE[primaryFacet] : 'gold',
      twinklePhase: unitOffset(`${room}/${work.slug}/twinkle`) * TWINKLE_DURATION_SECONDS,
      ...(placements[i] ?? placeWork(work.slug, work.facets)),
    };
  });
  const edges = deriveFacetFigures(nodes);
  const concordance = buildConcordance(
    allWorks.map(({ room, work }) => ({
      key: `${room}/${work.slug}`,
      text: `${work.title} ${work.summary ?? ''} ${work.body}`,
    })),
  );
  return { nodes, edges, facetHues: FACET_HUE, concordance };
}

// Async barrel signature, mirroring the rest of the content API
// (see src/shared/content/index.ts §"Isomorphic content API"). Route
// loaders await this; if the implementation ever moves behind a
// fetched JSON manifest, the route surface does not change.
export function getConstellationGraph(): Promise<ConstellationGraph> {
  return Promise.resolve(getConstellationGraphSync());
}
