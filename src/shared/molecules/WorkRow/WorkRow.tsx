import { Link } from '@tanstack/react-router';
import type { Work } from '@/shared/content/schema';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import { ImgSlot } from '@/shared/atoms/ImgSlot/ImgSlot';
import { RoomGlyph } from '@/shared/atoms/RoomGlyph/RoomGlyph';

interface WorkRowProps {
  work: Work;
  /** Optional kicker — Salon's "listening · " / "looking · " register. */
  kicker?: string;
  /**
   * Honest stand-in label for an attached image, used only while the live
   * image isn't yet on the page. When omitted, the room's glyph fills in.
   * The preview never fakes art — see chats/chat1.md.
   */
  thumbLabel?: string;
}

// Image-left work row — the Salon's default landing rhythm. A 132px square
// glyph or labeled slot on the left, meta/title/summary stacked on the
// right. Hover is mega-tasteful: the square stays still, the hairline
// darkens, the title shifts to the warm accent. Facet chips sit
// underneath as their own /facet/{facet} links — they live outside the
// row's wrapping Link so anchor nesting stays valid HTML.
export function WorkRow({ work, kicker, thumbLabel }: WorkRowProps) {
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <article className="group flex flex-col gap-3 border-b border-border-lt py-6 transition-colors duration-300 first:border-t hover:border-border sm:py-7">
      <Link
        to="/$room/$slug"
        params={{ room: work.room, slug: work.slug }}
        className="grid gap-4 text-inherit no-underline sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-7"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-[2px] bg-bg-warm shadow-sm sm:aspect-square sm:h-[132px] sm:w-[132px]">
          {thumbLabel ? <ImgSlot label={thumbLabel} /> : <RoomGlyph room={work.room} />}
        </div>
        <div className="min-w-0 pt-1">
          <div className="mb-2 font-body text-meta italic tracking-[0.02em] text-text-3">
            {kicker && (
              <span className="mr-3 inline-block font-body text-micro not-italic tracking-[0.08em] text-accent-warm uppercase">
                {kicker}
              </span>
            )}
            {import.meta.env.DEV && work.draft && (
              <span className="mr-3 inline-block font-body text-micro not-italic tracking-[0.08em] text-accent-warm uppercase">
                draft
              </span>
            )}
            <span>{formattedDate}</span>
          </div>
          <div className="mb-2 font-heading text-heading leading-[1.25] text-text transition-colors duration-200 group-hover:text-accent">
            {work.title}
          </div>
          {work.summary && (
            <div className="font-body text-list leading-[1.7] text-text-2">{work.summary}</div>
          )}
        </div>
      </Link>
      {work.facets.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 sm:ml-40">
          {work.facets.map((facet) => (
            <FacetChip key={facet} facet={facet} />
          ))}
        </div>
      )}
    </article>
  );
}
