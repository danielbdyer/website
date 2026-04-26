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

/** Hero image of a work — matched between thumbnails (FacetCard,
 * SalonCard hero-morph treatment) and the WorkView hero figure. */
export function workHeroTransitionName(room: Room, slug: string): string {
  return `work-hero-${room}-${slug}`;
}

/** Title of a work — matched between listing card titles and the
 * WorkView H1. The browser handles the font-size change as part of
 * the morph; the title shape changes, the position changes, but it
 * reads as the same element traveling between locations. */
export function workTitleTransitionName(room: Room, slug: string): string {
  return `work-title-${room}-${slug}`;
}

/** Meta band — date, posture, draft indicator. Matched between
 * listing cards and the WorkView meta line. */
export function workMetaTransitionName(room: Room, slug: string): string {
  return `work-meta-${room}-${slug}`;
}
