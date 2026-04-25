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
// glyph or labeled slot on the left, meta/title/summary/facets stacked on
// the right. Hover is mega-tasteful: the square stays still, the hairline
// darkens, the title shifts to the warm accent. The work doesn't flinch
// toward you. Looking is a posture of stillness, not browsing.
export function WorkRow({ work, kicker, thumbLabel }: WorkRowProps) {
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <Link
      to="/$room/$slug"
      params={{ room: work.room, slug: work.slug }}
      reloadDocument
      className="group grid gap-4 border-b border-border-lt py-6 text-inherit no-underline transition-colors duration-300 first:border-t hover:border-border sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-7 sm:py-7"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[2px] bg-bg-warm shadow-sm sm:h-[132px] sm:w-[132px] sm:aspect-square">
        {thumbLabel ? <ImgSlot label={thumbLabel} /> : <RoomGlyph room={work.room} />}
      </div>
      <div className="min-w-0 pt-1">
        <div className="mb-1.5 font-body text-[13px] italic tracking-[0.02em] text-text-3">
          {kicker && (
            <span className="mr-2.5 inline-block font-body text-[11px] not-italic tracking-[0.08em] text-accent-warm uppercase">
              {kicker}
            </span>
          )}
          {import.meta.env.DEV && work.draft && (
            <span className="mr-2 inline-block font-body text-[11px] not-italic tracking-[0.08em] text-accent-warm uppercase">
              draft
            </span>
          )}
          <span>{formattedDate}</span>
        </div>
        <div className="mb-2 font-heading text-[22px] leading-[1.25] text-text transition-colors duration-200 group-hover:text-accent">
          {work.title}
        </div>
        {work.summary && (
          <div className="mb-3 font-body text-[15px] leading-[1.7] text-text-2">{work.summary}</div>
        )}
        {work.facets.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {work.facets.map((facet) => (
              <FacetChip key={facet} facet={facet} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
