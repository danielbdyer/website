import type { DisplayWork } from '@/shared/content/preview';
import type { Facet } from '@/shared/types/common';
import { FacetCard, type FacetCardSize } from '@/shared/molecules/FacetCard/FacetCard';

interface FacetMasonryProps {
  works: readonly DisplayWork[];
  /** Facets the page is already scoped to — hide them on the cards to
   * avoid the redundant chip ("you are filtering by beauty; here is a
   * card with a beauty chip"). */
  scopedFacets: readonly Facet[];
}

// Asymmetric magazine layout for the facet page.
//
// The grid is `grid-auto-flow: dense` so cards pack to fill gaps, but
// the source order is *strictly* date-descending — newest first. The
// dense flow only affects spatial arrangement, not the reading order
// for screen readers, which respects DOM order.
//
// Three card sizes:
// - `feature`: `feature: true` works. Two columns wide × two rows tall
//   on the desktop grid. The hero interjection that breaks the
//   descending rhythm with a held image and a longer summary.
// - `tall`:    works carrying an `image` (or a preview `thumbLabel`).
//   One column wide × two rows tall. Image-led card.
// - `standard`: text-only works. One column wide × one row tall. The
//   workhorse cell.
//
// Mobile collapses to a single column where every card reads top-to-
// bottom in date order; tablet uses two columns with the same span
// rules; desktop uses four. The grid track height is fixed so spans
// land predictably; an `auto-rows` value keeps tall cards visually
// taller than standard ones without depending on content height.
export function FacetMasonry({ works, scopedFacets }: FacetMasonryProps) {
  return (
    <div className="grid [grid-auto-flow:dense] [grid-auto-rows:minmax(120px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
      {works.map((work) => {
        const size = sizeFor(work);
        return (
          <div key={`${work.room}-${work.slug}`} data-size={size} className={spanClassFor(size)}>
            <FacetCard work={work} size={size} hideFacets={scopedFacets} />
          </div>
        );
      })}
    </div>
  );
}

function sizeFor(work: DisplayWork): FacetCardSize {
  if (work.feature) return 'feature';
  if (work.image || hasThumbLabel(work)) return 'tall';
  return 'standard';
}

function hasThumbLabel(work: DisplayWork): boolean {
  return 'preview' in work && work.preview?.thumbLabel !== undefined;
}

// Spans are grid-cell counts. Mobile is always single-column; the
// span rules only kick in at sm: (2-col) and lg: (4-col).
function spanClassFor(size: FacetCardSize): string {
  switch (size) {
    case 'feature': {
      // Wider AND taller than the rest — the hero interjection.
      return 'sm:col-span-2 sm:row-span-3 lg:col-span-2 lg:row-span-3';
    }
    case 'tall': {
      // Image-led — takes a single column but reads taller.
      return 'sm:row-span-2 lg:row-span-2';
    }
    case 'standard': {
      // Text-only workhorse cell.
      return '';
    }
  }
}
