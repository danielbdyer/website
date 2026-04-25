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
    <Link to="/$room/$slug" params={{ room: work.room, slug: work.slug }} className="work-row">
      <div className="row-image">
        {thumbLabel ? <ImgSlot label={thumbLabel} /> : <RoomGlyph room={work.room} />}
      </div>
      <div className="row-body">
        <div className="row-meta">
          {kicker && <span className="kicker-tag">{kicker}</span>}
          {import.meta.env.DEV && work.draft && <span className="draft-mark">draft </span>}
          <span>{formattedDate}</span>
        </div>
        <div className="row-title">{work.title}</div>
        {work.summary && <div className="row-summary">{work.summary}</div>}
        {work.facets.length > 0 && (
          <div className="row-facets">
            {work.facets.map((facet) => (
              <FacetChip key={facet} facet={facet} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
