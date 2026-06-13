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
// it. The data layer is pure — it derives the constellation from the
// existing display works without knowing anything about rendering.
//
// Deterministic per corpus: a given set of works produces the same graph,
// the stars spread evenly across the dome by a Fibonacci spiral over a
// stable order (see placeNode). Adding a work re-spaces the spiral — the
// sky reorganizes as it grows rather than holding old positions fixed.
// CONSTELLATION.md §"What the Constellation Shows" describes the visible
// result; this file is the data the renderer consumes.
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

// Placement is even, not clustered — the stars are spread equidistantly
// across the dome (a Fibonacci spiral; see placeNode below), so the
// content is *omnipresent*: in any direction the next star is a short,
// predictable hop away, never a long empty stretch. Earlier passes tried
// a room-quadrant layout and then a facet-relational one; both left empty
// gaps that read as "where did the content go?" at this corpus size, so
// the sky now favors even spacing. A work's room is still its identity,
// its link, and its atmosphere; its hue still reads its facet (FACET_HUE
// below). CONSTELLATION.md §"What the Constellation Shows."

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
   *  the horizon. Position is deterministic per corpus (the work's
   *  index on the even Fibonacci spiral — see placeNode). */
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

// Twinkle phase ceiling — the upper bound on each star's halo
// animation-delay. Matches the CSS `star-twinkle` keyframe duration
// in tokens.css so a phase value in [0, ceiling) puts each star at a
// random point in the cycle. If the CSS duration changes, this
// changes too — the value is paired, not free.
const TWINKLE_DURATION_SECONDS = 4.5;

// The dome cap the stars fill, in degrees from the polestar (+z), and
// the golden angle that spaces the Fibonacci spiral. The inner bound
// keeps the polestar's center clear; the outer bound stays within the
// camera's enveloped view. The cap is generous enough that the stars
// read as a sky spread overhead, and (with the even spiral) dense enough
// that there are no empty gaps to get lost in. radius × 90° = degrees
// from the pole, so unitPosition is the exact un-projection of
// (radius, angle) and the 2D and 3D layouts agree.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DOME_INNER_DEG = 14;
const DOME_OUTER_DEG = 48;

interface NodePlacement {
  readonly angleDeg: number;
  readonly radius: number;
  readonly unitPosition: UnitVector3;
}

// Pure pipeline: a work's `index` in the stable-ordered corpus maps to a
// point on a Fibonacci spiral over the dome — area-uniform colatitude
// (its cosine linear in index, so the areal density is even) and golden-angle
// azimuth (so successive points never line up). The result is an
// equidistant scatter; the next star is always a short hop away.
// Deterministic per corpus; adding a work re-spaces the spiral (the sky
// reorganizes as it grows, per CLAUDE.md's garden). unitPosition is the
// exact un-projection of (radius, angleDeg).
function placeNode(index: number, total: number): NodePlacement {
  const cosInner = Math.cos((DOME_INNER_DEG * Math.PI) / 180);
  const cosOuter = Math.cos((DOME_OUTER_DEG * Math.PI) / 180);
  const u = total <= 1 ? 0.5 : (index + 0.5) / total;
  const theta = Math.acos(cosOuter + u * (cosInner - cosOuter));
  const angleRad = (index * GOLDEN_ANGLE) % (2 * Math.PI);
  const radius = theta / (Math.PI / 2);
  const angleDeg = ((((angleRad * 180) / Math.PI) % 360) + 360) % 360;
  const unitPosition = diskToHemisphere(radius, angleRad);
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
  // Stable order (room/slug) so the spiral is deterministic per corpus;
  // the index into this order is the star's place on the Fibonacci
  // spiral (placeNode).
  const allWorks = CONSTELLATION_ROOMS.flatMap((room) =>
    getDisplayWorksByRoomSync(room).map((work) => ({ room, work })),
  ).toSorted((a, b) => `${a.room}/${a.work.slug}`.localeCompare(`${b.room}/${b.work.slug}`));
  const total = allWorks.length;
  const nodes: ConstellationNode[] = allWorks.map(({ room, work }, index) => {
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
      ...placeNode(index, total),
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
