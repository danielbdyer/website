import type { Room } from '@/shared/types/common';

// Canonical view-transition names. The same name applied to two
// elements across two pages tells the browser they are conceptually
// the same element — and the View Transitions API morphs between them
// when navigation happens. Keep names stable and globally unique;
// changing a generator here is a real visual change everywhere it
// participates.

/** Hero image of a work — matched between thumbnails (FacetCard,
 * SalonCard hero-morph treatment) and the WorkView hero element. */
export function workHeroTransitionName(room: Room, slug: string): string {
  return `work-hero-${room}-${slug}`;
}
