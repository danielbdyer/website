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

// Each room occupies a 90° sector of a polar layout, centered around
// the firmament's center. Angles follow SVG-direct convention
// (0° = east, 90° = south, 180° = west, 270° = north — Y grows
// downward, so sin(angle) maps to vertical-down). The four rooms sit
// at the four diagonals so each occupies one quadrant of the sky:
//
//   Studio (NW) ─── ★ ─── Salon (NE)
//                        ─
//   Garden (SW) ─── ★ ─── Study (SE)
//
// Studio sits upper-left because it is the daylight-discipline room
// (dawn-direction). Salon sits upper-right — music high in the sky,
// the cellist's son's room. Study sits lower-right, the evening side
// where reflection happens. Garden sits lower-left, the earth-and-
// growth quadrant. The arrangement is editorial; the data layer
// commits to it so positions are stable across builds.
const ROOM_SECTOR_DEG: Record<Exclude<Room, 'foyer'>, number> = {
  studio: 225, // NW — upper-left of the sky
  salon: 315, // NE — upper-right
  study: 45, // SE — lower-right
  garden: 135, // SW — lower-left
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
  /** Per-star scale magnitude in [0.75, 1.45]. Some stars read as
   *  bright "named" lights, most as quieter dots, mirroring the
   *  Hevelius reference plates' visible-magnitude hierarchy.
   *  Deterministic per slug. */
  magnitude: number;
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

// Within a 90° room sector, stars cluster in a narrower band so the
// constellation reads as a constellation (legible groupings) rather
// than a scattered disk. The previous spread (±35°) felt too entropic
// against the per-room sector geometry; ±20° clusters tighter while
// still leaving room to walk through the per-room directions.
const SECTOR_HALF_SPREAD = 20;
const RADIUS_MIN = 0.55;
const RADIUS_MAX = 0.87;

// ─── Halton-stratified placement ──────────────────────────────────
//
// Hash-uniform placement (the first form) gave each star a random-
// looking position within the sector. Visually that read as
// "scattered points" — entropic, in the user's word. A Halton
// low-discrepancy sequence gives the equidistant-with-organic-
// variance feel the Hevelius reference plates carry: stars look
// methodically placed without the rigidity of a grid.
//
// The stability commitment ("adding a new work never moves the
// existing stars" — CONSTELLATION.md §"What Shipped (First Form)")
// is honored by precomputing a fixed pool of slot positions and
// hashing each work to an index in that pool. New works pick
// previously-unused slots; existing works keep their slots; no
// motion across builds. A small per-star jitter on top adds the
// organic variance.

const SLOTS_PER_SECTOR = 32;

/** Halton low-discrepancy sequence at a given index and prime base.
 *  Halton(N, 2) and Halton(N, 3) together give a 2D point in [0, 1]²
 *  whose distribution against neighboring N-values is more uniform
 *  than uniform random — the canonical "equidistant without grid
 *  artifacts" pattern. Used here once at module load to precompute
 *  the per-sector slot positions. */
function halton(index: number, base: number, fraction = 1 / base, acc = 0): number {
  if (index <= 0) return acc;
  return halton(Math.floor(index / base), base, fraction / base, acc + fraction * (index % base));
}

interface SectorSlot {
  readonly angleOffsetDeg: number;
  readonly radius: number;
}

const SECTOR_SLOTS: readonly SectorSlot[] = Array.from({ length: SLOTS_PER_SECTOR }, (_, i) => {
  const angleT = halton(i + 1, 2);
  const radiusT = halton(i + 1, 3);
  return {
    angleOffsetDeg: (angleT - 0.5) * 2 * SECTOR_HALF_SPREAD,
    radius: RADIUS_MIN + radiusT * (RADIUS_MAX - RADIUS_MIN),
  };
});

interface NodePlacement {
  readonly angleDeg: number;
  readonly radius: number;
  readonly unitPosition: UnitVector3;
}

/** Place a node by hashing its (room, slug) into one of the
 *  precomputed Halton slots within the room's sector, plus a
 *  small per-star jitter for organic variance. Stable per slug
 *  across builds. Two works in the same room with hash collisions
 *  on the slot index would visually read as a close pair — the
 *  jitter offsets them slightly so the overlap is never exact;
 *  with 4 stars per sector and 32 slots, collisions are rare
 *  (~6%) and aesthetically acceptable when they happen. */
function placeNode(room: Exclude<Room, 'foyer'>, slug: string): NodePlacement {
  const sectorCenter = ROOM_SECTOR_DEG[room];
  const slotIndex = hash(`${room}/${slug}/slot`) % SLOTS_PER_SECTOR;
  const slot = SECTOR_SLOTS[slotIndex];
  const baseAngleOffset = slot ? slot.angleOffsetDeg : 0;
  const baseRadius = slot ? slot.radius : (RADIUS_MIN + RADIUS_MAX) / 2;
  const angleJitter = (unitOffset(`${room}/${slug}/angleJ`) - 0.5) * 4;
  const radiusJitter = (unitOffset(`${room}/${slug}/radiusJ`) - 0.5) * 0.04;
  const angleDeg = (sectorCenter + baseAngleOffset + angleJitter + 360) % 360;
  const radius = Math.min(0.92, Math.max(0.5, baseRadius + radiusJitter));
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
      magnitude: 0.75 + unitOffset(`${room}/${work.slug}/magnitude`) * 0.7,
      ...placeNode(room, work.slug),
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
