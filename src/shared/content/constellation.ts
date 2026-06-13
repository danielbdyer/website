import type { DisplayWork } from './preview';
import type { Facet, Room } from '@/shared/types/common';
import type { UnitVector3 } from '@/shared/geometry/sphere';
import { diskToHemisphere } from '@/shared/geometry/sphere';
import { isPreviewWork } from './preview';
import { getDisplayWorksByRoomSync } from './display';

// ─── The Constellation Graph ───────────────────────────────────────
//
// A projection of the site's content as a sky. Each work becomes a star;
// each shared facet becomes a faint thread between the works that carry
// it. Rooms occupy regions of the firmament. The data layer is pure —
// it derives the constellation from the existing display works without
// knowing anything about rendering.
//
// Stable across builds: a given set of works produces the same graph,
// and adding a new work never moves the existing stars. The positioning
// is a deterministic hash of (slug, date) within a per-room polar
// sector. CONSTELLATION.md §"What the Constellation Shows" describes
// the visible result; this file is the data the renderer consumes.
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

// Semantic placement — the constellation arranges by *relation*, not by
// room. Each facet is an anchor direction on the dome; a work sits at
// the centroid of its facets' anchors, so works that share facets
// gather into the same neighborhood (they constellate) and works whose
// facets are disjoint drift to different arcs (they separate). The
// eight anchors are spaced evenly around the azimuth and ordered so the
// two facets of each hue sit adjacent — the dome reads as four
// chromatic arcs (warm, rose, violet, gold), echoing FACET_HUE below.
//
// A work's place depends only on its own facets, so placement is
// deterministic and a returning visitor finds the sky as they left it;
// the pattern grows as works accrue without reshuffling what is already
// there. This supersedes the earlier room-quadrant layout: a work's
// *room* is still its identity, its link, and its atmosphere, but its
// *place* in the sky is now its meaning. CONSTELLATION.md §"What the
// Constellation Shows."
const FACET_AZIMUTH_DEG: Record<Facet, number> = {
  craft: 0,
  body: 45,
  beauty: 90,
  language: 135,
  consciousness: 180,
  becoming: 225,
  leadership: 270,
  relation: 315,
};

// Editorial assignment of the held accent vocabulary to the eight
// facets. DESIGN_SYSTEM.md §"Held accents" reserved the four hues as
// vocabulary; the constellation is the first surface where they speak.
// Some facets share a hue by design — the difference is carried by
// position and label, not by an exhaustive eight-hue palette.
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
   *  the horizon. Position is deterministic in (room, slug). */
  angleDeg: number;
  radius: number;
  /** Position on the latent unit sphere — the topology Pass 2's
   *  navigation orbits. The 2D `(angleDeg, radius)` is the
   *  azimuthal-equidistant projection of this 3D position onto the
   *  upper hemisphere: the disk's center is the north pole, the rim
   *  is the equator. Adding this field is un-projecting — restoring
   *  the z component the disk dropped. The 2D renderer ignores it;
   *  the held cairn rendering will consume it. */
  unitPosition: UnitVector3;
  /** Hue of the work's first-listed facet, or 'gold' as a quiet
   *  default for facetless works. The renderer paints the star in
   *  this hue; thread blooms toward this star adopt their own
   *  facet's hue, not the star's. */
  hue: ConstellationHue;
  /** Twinkle phase offset in seconds, deterministic per slug, used
   *  as the halo's animation-delay so adjacent stars don't pulse in
   *  sync. The phase is bounded by the twinkle duration in CSS
   *  (`star-twinkle` keyframes); any value in [0, duration) yields a
   *  stable, lightly-randomized starfield. */
  twinklePhase: number;
}

export interface ConstellationEdge {
  /** The facet that joins these two works. */
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
  /** Facet → hue mapping, exposed so the renderer can color thread
   *  blooms without re-deriving the assignment. */
  facetHues: Readonly<Record<Facet, ConstellationHue>>;
}

// ─── Deterministic positioning ────────────────────────────────────
//
// A small string-hash producing a stable 32-bit integer. Used to pick
// each work's offset within its room's sector. Crypto-strength is not
// needed; the only requirement is that the same input produces the
// same output across builds and platforms.

function hash(input: string): number {
  // FNV-1a (32-bit). Functional fold over the input's code points;
  // identical bit-for-bit to the imperative form. Spread allocates
  // an intermediate per call, but `hash` runs once per work-id at
  // build time, not on the hot path.
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
// then trips unicorn/number-literal-case. The constant form is
// stable across the formatters.
const UINT32_MAX = 2 ** 32 - 1;

function unitOffset(seed: string): number {
  // Maps a hash to [0, 1) deterministically.
  return hash(seed) / UINT32_MAX;
}

// Facet-anchor placement. Each facet's anchor sits at this disk radius
// (≈38° from the zenith); a single-facet work lands on it, a multi-
// facet work at the centroid of its anchors (pulled inward, toward the
// polestar, the more threads it carries). A small deterministic jitter
// separates works that share the same facet set so they cluster without
// landing on top of one another.
const FACET_ANCHOR_RADIUS = 0.42;
const JITTER_RADIUS = 0.05;
const JITTER_AZIMUTH_DEG = 11;

// Twinkle phase ceiling — the upper bound on each star's halo
// animation-delay. Matches the CSS `star-twinkle` keyframe duration
// in tokens.css so a phase value in [0, ceiling) puts each star at a
// random point in the cycle. If the CSS duration changes, this
// changes too — the value is paired, not free.
const TWINKLE_DURATION_SECONDS = 4.5;

// Radius is the dome cap — the polar spread of the stars from the
// zenith (the polestar at +z), measured as a fraction of the disk
// (radius × 90° = degrees from the pole). Contained near the pole
// ([0.18, 0.47] ≈ 16°–42°) so the sky reads as a *convex ceiling
// overhead* rather than a full sphere to wander: with a small corpus
// the stars gather close to the polestar, and there isn't enough yet
// to justify navigating a whole sphere. Never at the polestar itself
// (center reserved for the geometric figure's ascension), never near
// the rim (the horizon stays a clean edge). As the corpus grows the
// cap is meant to widen — more travel, stars constellating and
// separating by relation — held as the organic-growth direction, which
// deliberately relaxes the "adding a work never moves a star"
// invariant. unitPosition stays the exact un-projection of (radius,
// angle), so the 2D and 3D layouts agree.
const RADIUS_MIN = 0.18;
const RADIUS_MAX = 0.47;

interface NodePlacement {
  readonly angleDeg: number;
  readonly radius: number;
  readonly unitPosition: UnitVector3;
}

// Pure pipeline: a work's facet set determines a 2D disk position — the
// centroid of its facets' anchors, jittered per slug to break ties —
// and the disk position determines the 3D unit-sphere position via the
// upper-hemisphere projection. unitPosition is the exact un-projection
// of (radius, angleDeg), so the 2D and 3D layouts agree.
function placeNode(slug: string, facets: readonly Facet[]): NodePlacement {
  // Centroid of the facets' anchor points on the disk (functional fold —
  // no mutation). A single facet → its anchor; many facets → pulled
  // inward toward the polestar.
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
  const jitterR = (unitOffset(`${slug}/jitter-r`) - 0.5) * 2 * JITTER_RADIUS;
  const jitterA = (unitOffset(`${slug}/jitter-a`) - 0.5) * 2 * JITTER_AZIMUTH_DEG;
  // Facetless works rest near the polestar — the still center.
  const baseRadius = facets.length === 0 ? RADIUS_MIN : Math.hypot(centroid.x, centroid.y);
  const baseAngleDeg =
    facets.length === 0
      ? unitOffset(`${slug}/angle`) * 360
      : (Math.atan2(centroid.y, centroid.x) * 180) / Math.PI;
  const radius = Math.min(Math.max(baseRadius + jitterR, RADIUS_MIN), RADIUS_MAX);
  const angleDeg = (((baseAngleDeg + jitterA) % 360) + 360) % 360;
  const unitPosition = diskToHemisphere(radius, (angleDeg * Math.PI) / 180);
  return { angleDeg, radius, unitPosition };
}

// ─── Edge derivation ───────────────────────────────────────────────
//
// Today: facet co-membership only. For each facet, the works carrying
// it form a thread cluster — one edge per pair. Wikilink-derived edges
// will arrive in a future pass once the wikilink resolver is activated
// by the second authored work (see BACKLOG.md §Content / "Wikilink
// resolution in the loader").
//
// Edges are deduplicated within a (sourceKey, targetKey, facet)
// triple, and the source/target ordering is stable (lexicographic on
// the room+slug key) so the same graph produces the same edge list
// every time.

function nodeKey(n: { room: Exclude<Room, 'foyer'>; slug: string }): string {
  return `${n.room}/${n.slug}`;
}

/**
 * Pure pipeline that derives facet co-membership edges:
 *   1. flatMap each node into one (facet, node) pair per facet
 *   2. group those pairs by facet via Map.groupBy (ES2024)
 *   3. sort each facet group by node key
 *   4. flatMap the sorted group to one edge per unordered pair
 *
 * @bigO Time: O(F·N + Σ k_f² + Σ k_f log k_f) where F = facets/node,
 *       N = nodes, k_f = nodes carrying facet f. The Σ k_f² (pair
 *       emission) dominates once any facet attracts many works.
 *       Don't reintroduce per-element clone-and-set or O(N) lookup
 *       inside the inner flatMap.
 *       Space: O(P) for the (facet, node) pair list, where P = Σ k_f.
 */
function deriveFacetEdges(nodes: readonly ConstellationNode[]): ConstellationEdge[] {
  const facetPairs = nodes.flatMap((node) => node.facets.map((facet) => [facet, node] as const));
  const facetGroups = Map.groupBy(facetPairs, ([facet]) => facet);
  return [...facetGroups].flatMap(([facet, entries]) => {
    const sorted = entries
      .map(([, node]) => node)
      .toSorted((a, b) => nodeKey(a).localeCompare(nodeKey(b)));
    return sorted.flatMap((a, i) =>
      sorted.slice(i + 1).map((b) => ({
        facet,
        hue: FACET_HUE[facet],
        source: { room: a.room, slug: a.slug },
        target: { room: b.room, slug: b.slug },
      })),
    );
  });
}

// ─── Public API ────────────────────────────────────────────────────

export function getConstellationGraphSync(): ConstellationGraph {
  const allWorks = CONSTELLATION_ROOMS.flatMap((room) =>
    getDisplayWorksByRoomSync(room).map((work) => ({ room, work })),
  );
  const nodes: ConstellationNode[] = allWorks.map(({ room, work }) => {
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
      ...placeNode(work.slug, work.facets),
    };
  });
  const edges = deriveFacetEdges(nodes);
  return { nodes, edges, facetHues: FACET_HUE };
}

// Async barrel signature, mirroring the rest of the content API
// (see src/shared/content/index.ts §"Isomorphic content API"). Route
// loaders await this; if the implementation ever moves behind a
// fetched JSON manifest, the route surface does not change.
export function getConstellationGraph(): Promise<ConstellationGraph> {
  return Promise.resolve(getConstellationGraphSync());
}
