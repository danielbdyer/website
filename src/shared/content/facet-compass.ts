import type { Axis } from '@dbd/slice';
import type { Facet } from '@/shared/types/common';
import type { ConstellationHue } from './hue';

// ─── The site's compass ────────────────────────────────────────────
//
// The eight facets take the eight points of the polestar: each is a
// bearing, an azimuth on the dome. Adjacent bearings share a hue, so
// the dome reads as four chromatic arcs (warm, rose, violet, gold). A
// work sits where its facets pull it: at the centroid of its facets'
// anchors, which places a single-facet work on its bearing and pulls a
// many-faceted work inward toward the pole, the still center.
// CONSTELLATION_WALK.md §"The Compass".
//
// This is the house's knowledge of its own facets. The sky itself no
// longer knows them: it draws whatever axes a slice carries
// (constellation.ts), and the works adapter (slice.ts) hands it these.
// CATHEDRALS.md §"What Is Blended" — a facet is one kind of axis.

export const FACET_AZIMUTH_DEG: Readonly<Record<Facet, number>> = {
  craft: 0,
  body: 45,
  beauty: 90,
  language: 135,
  consciousness: 180,
  becoming: 225,
  leadership: 270,
  relation: 315,
};

/** The compass in bearing order. */
export const COMPASS: readonly Facet[] = (Object.keys(FACET_AZIMUTH_DEG) as Facet[]).toSorted(
  (a, b) => FACET_AZIMUTH_DEG[a] - FACET_AZIMUTH_DEG[b],
);

// Editorial assignment of the held accent vocabulary to the eight
// facets. DESIGN_SYSTEM.md §"Held accents" reserved the four hues as
// vocabulary; the constellation is the first surface where they speak.
// Some facets share a hue by design — the difference is carried by
// bearing, by label, and by the dotted stroke of the second of each
// pair (constellation.ts assigns the dotting from the order).
//
// The facet chips elsewhere on the site do *not* adopt these hues —
// the held discipline still holds. Only the constellation.
export const FACET_HUE: Readonly<Record<Facet, ConstellationHue>> = {
  craft: 'warm',
  body: 'warm',
  beauty: 'rose',
  language: 'rose',
  consciousness: 'violet',
  becoming: 'violet',
  leadership: 'gold',
  relation: 'gold',
};

/** The eight facets as the slice's axes, in bearing order, with the
 *  sky's azimuths and hues. */
export function facetAxes(): readonly Axis[] {
  return COMPASS.map((facet) => ({
    id: facet,
    name: facet,
    azimuthDeg: FACET_AZIMUTH_DEG[facet],
    hue: FACET_HUE[facet],
  }));
}
