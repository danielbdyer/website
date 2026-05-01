import type { Room } from '@/shared/types/common';

// Canonical view-transition names. The same name applied to two
// elements across two pages tells the browser they are conceptually
// the same element — and the View Transitions API morphs between them
// when navigation happens. Keep names stable and globally unique;
// changing a generator here is a real visual change everywhere it
// participates.
//
// Each work has *several* participating elements so the navigation
// from listing → work-page reads as the card lifting into prominence:
// the image grows into the hero, the title slides into the H1 with a
// font-size change, the meta band slides into the meta band on the
// page. The browser orchestrates them in parallel.
//
// The card-wrapper name (`workCardTransitionName`) is for *Rearrange*
// — when a listing surface filters and surviving cards morph to new
// positions. The wrapper holds; image/title/meta also morph as
// nested named groups (the View Transitions API tracks nested names
// independently). See INTERACTION_DESIGN.md §"Page and Route
// Transitions" for the kind-table.

/** Hero image of a work — matched between thumbnails (FacetCard,
 * WorkRow, future hero-bearing surfaces) and the WorkView hero
 * figure. Serves the **Open** and **Close** gestures. */
export function workHeroTransitionName(room: Room, slug: string): string {
  return `work-hero-${room}-${slug}`;
}

/** Title of a work — matched between listing card titles and the
 * WorkView H1. The browser handles the font-size change as part of
 * the morph; the title shape changes, the position changes, but it
 * reads as the same element traveling between locations. Serves
 * **Open** and **Close**. */
export function workTitleTransitionName(room: Room, slug: string): string {
  return `work-title-${room}-${slug}`;
}

/** Meta band — date, posture, draft indicator. Matched between
 * listing cards and the WorkView meta line. Serves **Open** and
 * **Close**. */
export function workMetaTransitionName(room: Room, slug: string): string {
  return `work-meta-${room}-${slug}`;
}

/** Card wrapper — the article element on every listing surface that
 * shows a work as a card (FacetCard, WorkRow, WorkEntry). Used for
 * **Rearrange** when a listing filters: surviving cards carry this
 * stable name and the browser morphs them to their new grid
 * positions while removed cards fade out and added cards fade in.
 * The WorkView's `<article>` does *not* carry this name — its
 * layout is the body, not a card; pairing them would morph the
 * full body into a card on Close, which is wrong. Open/Close are
 * served by the inner image/title/meta names instead. */
export function workCardTransitionName(room: Room, slug: string): string {
  return `work-card-${room}-${slug}`;
}

/** Daystar — paired between the nav's theme-toggle icon (on every
 * route except /sky) and the constellation's celestial body (on
 * /sky). When the visitor navigates from any room into the sky, the
 * View Transitions API morphs the small corner icon into the large
 * upper-mid daystar — the toggle ascends into the firmament. On
 * return, the daystar descends back to the corner. The name is
 * unique per snapshot because /sky has no Nav (so no toggle), and
 * non-/sky routes have no firmament. CONSTELLATION.md §"The Sun and
 * the Moon" describes the felt sense; this is the canonical name. */
export const DAYSTAR_TRANSITION_NAME = 'daystar';
