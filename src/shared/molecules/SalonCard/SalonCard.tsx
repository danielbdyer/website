import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import type { Work } from '@/shared/content/schema';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import { cn } from '@/shared/utils/cn';
import { useCardPlayback } from './useCardPlayback';

export interface ThumbnailTreatmentProps {
  work: Work;
  /**
   * Honest stand-in label for the labeled-gray-field state — used only
   * while the live image isn't yet on the page. Treatments render this
   * as a fallback when `work.image` is unset.
   */
  thumbLabel?: string;
}

export interface SalonCardProps {
  work: Work;
  thumbLabel?: string;
  /** A small label rendered above the card naming the prototype treatment.
   * Only used in the prototype gallery; remove once a treatment is chosen. */
  treatmentLabel?: string;
  /** The treatment component to render in the thumbnail region. */
  treatment: (props: ThumbnailTreatmentProps & { playKey: number }) => ReactNode;
}

// One Salon card with the asymmetric click-target model.
//
// **Click target:**
// - Desktop (`hover: hover`): the whole card is a link via an absolutely
//   positioned overlay anchor. Clicks on the thumbnail navigate.
// - Mobile (`hover: none`): the overlay link is `pointer-events: none`,
//   so taps fall through. Only the text region (the inner Link) is a
//   real tap target. Tapping the thumbnail does not navigate — it only
//   replays the animation.
//
// **Replay trigger:**
// - Desktop: hovering anywhere on the card replays.
// - Mobile: tapping anywhere on the card replays. (Tapping the text also
//   navigates — that's fine; the link click happens after the touchstart.)
//
// **Initial reveal:** every card plays its treatment once when it enters
// the viewport. Above-the-fold cards animate on first paint.
//
// The card itself is silent — it does not render its own image. The
// `treatment` prop renders the thumbnail. Each treatment receives the
// shared `playKey` and re-runs its animation when the key changes by
// keying on it (React mounts a fresh DOM subtree).
function CardTextRegion({ work }: { work: Work }) {
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <Link
      to="/$room/$slug"
      params={{ room: work.room, slug: work.slug }}
      className="relative z-10 block min-w-0 pt-1 text-inherit no-underline"
    >
      <div className="mb-2 font-body text-meta italic tracking-meta text-text-3">
        {work.posture && (
          <span className="mr-3 inline-block font-body text-micro not-italic tracking-eyebrow text-accent-warm uppercase">
            {work.posture}
          </span>
        )}
        {import.meta.env.DEV && work.draft && (
          <span className="mr-3 inline-block font-body text-micro not-italic tracking-eyebrow text-accent-warm uppercase">
            draft
          </span>
        )}
        <span>{formattedDate}</span>
      </div>
      <div className="mb-2 font-heading text-heading leading-heading text-text transition-colors duration-200 group-hover:text-accent">
        {work.title}
      </div>
      {work.summary && (
        <div className="font-body text-list leading-body text-text-2">{work.summary}</div>
      )}
    </Link>
  );
}

export function SalonCard({
  work,
  thumbLabel,
  treatmentLabel,
  treatment: Treatment,
}: SalonCardProps) {
  const { playKey, cardRef, replay } = useCardPlayback();

  return (
    <div className="flex flex-col gap-2">
      {treatmentLabel && (
        <div className="font-body text-micro tracking-eyebrow text-text-3 italic lowercase">
          {treatmentLabel}
        </div>
      )}
      <article
        ref={cardRef as React.RefObject<HTMLElement>}
        className="group relative flex flex-col gap-3 border-b border-border-lt py-6 transition-colors duration-300 first:border-t hover:border-border sm:py-7"
        onMouseEnter={replay}
        onTouchStart={replay}
      >
        {/* Desktop overlay link — covers the whole card. Disabled on
            touch devices via pointer-events so taps fall through to
            the inner text link only. */}
        <Link
          to="/$room/$slug"
          params={{ room: work.room, slug: work.slug }}
          aria-hidden="true"
          tabIndex={-1}
          className={cn(
            'absolute inset-0 z-0 rounded-[2px]',
            // touch devices: the overlay is silent; only the text link receives taps
            '[@media(hover:none)]:pointer-events-none',
            // keyboard focus belongs to the inner text link, not this overlay
            'focus:outline-none',
          )}
        >
          <span className="sr-only">{work.title}</span>
        </Link>
        <div className="grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-7">
          {/* Thumbnail region — visual only. Pointer-events disabled so
              the desktop overlay link receives clicks; on mobile the
              region is silent (taps replay via onTouchStart on the
              article, but do not navigate). */}
          <div className="pointer-events-none relative aspect-[16/10] overflow-hidden rounded-[2px] bg-bg-warm shadow-sm sm:aspect-square sm:h-[132px] sm:w-[132px]">
            <Treatment work={work} thumbLabel={thumbLabel} playKey={playKey} />
          </div>
          {/* Text region — the only navigation surface on mobile. Sits
              above the overlay link in the stacking order so it receives
              clicks rather than the overlay. */}
          <CardTextRegion work={work} />
        </div>
        {work.facets.length > 0 && (
          <div className="relative z-10 flex flex-wrap items-center gap-x-2.5 gap-y-2 sm:ml-40">
            {work.facets.map((facet) => (
              <FacetChip key={facet} facet={facet} />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
