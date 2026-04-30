import { Link } from '@tanstack/react-router';
import type { DisplayWork } from '@/shared/content/preview';
import { isPreviewWork } from '@/shared/content/preview';
import { ImgSlot } from '@/shared/atoms/ImgSlot/ImgSlot';
import { RoomGlyph } from '@/shared/atoms/RoomGlyph/RoomGlyph';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import {
  workCardTransitionName,
  workHeroTransitionName,
  workMetaTransitionName,
  workTitleTransitionName,
} from '@/shared/utils/view-transition-names';
import { cn } from '@/shared/utils/cn';

const ROOM_LABELS = {
  foyer: 'the foyer',
  studio: 'the studio',
  garden: 'the garden',
  study: 'the study',
  salon: 'the salon',
} as const;

export type FacetCardSize = 'standard' | 'tall' | 'feature';

export interface FacetCardProps {
  work: DisplayWork;
  /** Size class — drives both visual weight and grid span. */
  size: FacetCardSize;
  /** Hide a facet chip (the page is already filtered to it). */
  hideFacets?: readonly string[];
}

// Image region — present on tall and feature; standard cards are
// text-led and skip it. The aspect adjusts per size so the card
// silhouette differs visibly across the grid. The image carries the
// canonical hero view-transition name so click → work page morphs the
// thumbnail into the hero.
function FacetCardImage({
  work,
  size,
  thumbLabel,
}: {
  work: DisplayWork;
  size: Exclude<FacetCardSize, 'standard'>;
  thumbLabel: string | undefined;
}) {
  return (
    <div
      className={cn(
        'bg-bg-warm relative overflow-hidden rounded-[2px]',
        size === 'feature' ? 'aspect-[16/10]' : 'aspect-[4/5]',
      )}
      style={{ viewTransitionName: workHeroTransitionName(work.room, work.slug) }}
    >
      {work.image ? (
        <ImgSlot kind="filled" image={work.image} />
      ) : thumbLabel ? (
        <ImgSlot kind="standin" label={thumbLabel} />
      ) : (
        <RoomGlyph room={work.room} />
      )}
    </div>
  );
}

// One card on the facet page masonry. Three sizes — `standard` (compact),
// `tall` (image-led, taller), `feature` (hero, larger and wider).
//
// The grid span lives on the wrapper element via `data-size`; the page's
// container reads it to set `grid-column` and `grid-row` spans. Keeping
// span concerns at the wrapper rather than inside the card keeps this
// component reusable in other contexts (a related-works rail, a search
// result list) where masonry isn't the layout.
export function FacetCard({ work, size, hideFacets = [] }: FacetCardProps) {
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const thumbLabel = isPreviewWork(work) ? work.preview.thumbLabel : undefined;
  const visibleFacets = work.facets.filter((f) => !hideFacets.includes(f));

  return (
    <article
      data-size={size}
      className="group bg-bg-card hover:shadow-default flex h-full flex-col gap-3 rounded-[2px] p-4 shadow-sm transition-shadow duration-300"
      style={{ viewTransitionName: workCardTransitionName(work.room, work.slug) }}
    >
      <Link
        to="/$room/$slug"
        params={{ room: work.room, slug: work.slug }}
        className="flex flex-1 flex-col gap-3 text-inherit no-underline"
      >
        {size !== 'standard' && <FacetCardImage work={work} size={size} thumbLabel={thumbLabel} />}
        <div className="font-body text-micro tracking-eyebrow text-accent-warm lowercase italic">
          {ROOM_LABELS[work.room]}
        </div>
        <h3
          className={cn(
            'font-heading leading-heading text-text group-hover:text-accent transition-colors duration-200',
            size === 'feature' ? 'text-deck' : 'text-heading',
          )}
          style={{ viewTransitionName: workTitleTransitionName(work.room, work.slug) }}
        >
          {work.title}
        </h3>
        {work.summary && (
          <p
            className={cn(
              'font-body leading-body text-text-2',
              size === 'feature' ? 'text-list' : 'text-meta',
            )}
          >
            {work.summary}
          </p>
        )}
        <div
          className="font-body text-meta text-text-3 mt-auto italic"
          style={{ viewTransitionName: workMetaTransitionName(work.room, work.slug) }}
        >
          {formattedDate}
        </div>
      </Link>
      {visibleFacets.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {visibleFacets.map((facet) => (
            <FacetChip key={facet} facet={facet} />
          ))}
        </div>
      )}
    </article>
  );
}
