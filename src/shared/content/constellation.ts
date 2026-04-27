import type { DisplayWork } from './preview';
import type { Facet, Room } from '@/shared/types/common';
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
// the firmament's center. The order matches the nav rhythm (Studio →
// Garden → Study → Salon = professional → poetic → reflective →
// aesthetic) walked clockwise from the upper-left.
const ROOM_SECTOR_DEG: Record<Exclude<Room, 'foyer'>, number> = {
  studio: 315, // upper-left of the sky
  salon: 45, // upper-right
  study: 135, // lower-right
  garden: 225, // lower-left
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
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function unitOffset(seed: string): number {
  // Maps a hash to [0, 1) deterministically.
  return hash(seed) / 0xffffffff;
}

// Within a 90° sector the work spreads across [-35°, +35°] from the
// sector center, leaving a small gap to neighboring sectors so the
// rooms read as adjacent rather than seamless.
const SECTOR_HALF_SPREAD = 35;

// Radius lives in [0.45, 0.92] — never at the polestar (the center is
// reserved for the geometric figure's eventual ascension) and never at
// the rim (the horizon stays a clean edge).
const RADIUS_MIN = 0.45;
const RADIUS_MAX = 0.92;

function placeNode(
  room: Exclude<Room, 'foyer'>,
  slug: string,
): { angleDeg: number; radius: number } {
  const sectorCenter = ROOM_SECTOR_DEG[room];
  const angleOffset = (unitOffset(`${room}/${slug}/angle`) - 0.5) * 2 * SECTOR_HALF_SPREAD;
  const radiusT = unitOffset(`${room}/${slug}/radius`);
  const radius = RADIUS_MIN + radiusT * (RADIUS_MAX - RADIUS_MIN);
  const angleDeg = (sectorCenter + angleOffset + 360) % 360;
  return { angleDeg, radius };
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

function deriveFacetEdges(nodes: readonly ConstellationNode[]): ConstellationEdge[] {
  const edges: ConstellationEdge[] = [];
  const facetGroups = new Map<Facet, ConstellationNode[]>();
  for (const node of nodes) {
    for (const facet of node.facets) {
      const group = facetGroups.get(facet) ?? [];
      group.push(node);
      facetGroups.set(facet, group);
    }
  }
  for (const [facet, group] of facetGroups) {
    const sorted = [...group].sort((a, b) => nodeKey(a).localeCompare(nodeKey(b)));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]!;
        const b = sorted[j]!;
        edges.push({
          facet,
          hue: FACET_HUE[facet],
          source: { room: a.room, slug: a.slug },
          target: { room: b.room, slug: b.slug },
        });
      }
    }
  }
  return edges;
}

// ─── Public API ────────────────────────────────────────────────────

export function getConstellationGraphSync(): ConstellationGraph {
  const allWorks = CONSTELLATION_ROOMS.flatMap((room) =>
    getDisplayWorksByRoomSync(room).map((work) => ({ room, work })),
  );
  const nodes: ConstellationNode[] = allWorks.map(({ room, work }) => ({
    room,
    slug: work.slug,
    title: work.title,
    date: work.date,
    facets: work.facets,
    posture: work.posture,
    isPreview: isPreviewWork(work),
    ...placeNode(room, work.slug),
  }));
  const edges = deriveFacetEdges(nodes);
  return { nodes, edges, facetHues: FACET_HUE };
}

// Async barrel signature, mirroring the rest of the content API
// (see src/shared/content/index.ts §"Isomorphic content API"). Route
// loaders await this; if the implementation ever moves behind a
// fetched JSON manifest, the route surface does not change.
export async function getConstellationGraph(): Promise<ConstellationGraph> {
  return getConstellationGraphSync();
}
