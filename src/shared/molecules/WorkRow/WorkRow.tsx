import { Link } from '@tanstack/react-router';
import type { Work } from '@/shared/content/schema';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import { ImgSlot } from '@/shared/atoms/ImgSlot/ImgSlot';
import { RoomGlyph } from '@/shared/atoms/RoomGlyph/RoomGlyph';
import {
  workCardTransitionName,
  workHeroTransitionName,
  workMetaTransitionName,
  workTitleTransitionName,
} from '@/shared/utils/view-transition-names';

interface WorkRowProps {
  work: Work;
  /**
   * Honest stand-in label for an attached image, used only while the live
   * image isn't yet on the page. When the work has a real `image` we
   * render that instead. When neither is present, the room's glyph fills
   * in. The preview never fakes art — TRANSPARENCY.md commits the site
   * to publishing its own making, and a faked image would be the loudest
   * possible violation.
   */
  thumbLabel?: string | undefined;
}

// Image-left work row — the Salon's default landing rhythm. A 132px square
// image, labeled stand-in, or room glyph on the left; meta/title/summary
// stacked on the right. The kicker is the work's `posture`
// (listening/looking/reading) when present. Hover is mega-tasteful: the
// square stays still, the hairline darkens, the title shifts to the warm
// accent. Facet chips sit underneath as their own /facet/{facet} links —
// they live outside the row's wrapping Link so anchor nesting stays valid.
//
// View-transition names: the article wrapper carries the card name (for
// **Rearrange** when the Salon's posture filter rearranges rows); the
// inner image/title/meta carry their canonical names (for **Open** when
// the visitor clicks into a work and the row morphs into the work
// page's hero/title/meta). See INTERACTION_DESIGN.md §"Page and Route
// Transitions" for the kind-table.
export function WorkRow({ work, thumbLabel }: WorkRowProps) {
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <article
      className="group border-border-lt hover:border-border flex flex-col gap-3 border-b py-6 transition-colors duration-300 first:border-t sm:py-7"
      style={{ viewTransitionName: workCardTransitionName(work.room, work.slug) }}
    >
      <Link
        to="/$room/$slug"
        params={{ room: work.room, slug: work.slug }}
        className="grid gap-4 text-inherit no-underline sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-7"
      >
        <div
          className="bg-bg-warm relative aspect-[16/10] overflow-hidden rounded-[2px] shadow-sm sm:aspect-square sm:h-[132px] sm:w-[132px]"
          style={{ viewTransitionName: workHeroTransitionName(work.room, work.slug) }}
        >
          {work.image ? (
            <ImgSlot kind="filled" image={work.image} />
          ) : (thumbLabel ? (
            <ImgSlot kind="standin" label={thumbLabel} />
          ) : (
            <RoomGlyph room={work.room} />
          ))}
        </div>
        <div className="min-w-0 pt-1">
          <div
            className="font-body text-meta tracking-meta text-text-3 mb-2 italic"
            style={{ viewTransitionName: workMetaTransitionName(work.room, work.slug) }}
          >
            {work.posture && (
              <span className="font-body text-micro tracking-eyebrow text-accent-warm mr-3 inline-block uppercase not-italic">
                {work.posture}
              </span>
            )}
            {import.meta.env.DEV && work.draft && (
              <span className="font-body text-micro tracking-eyebrow text-accent-warm mr-3 inline-block uppercase not-italic">
                draft
              </span>
            )}
            <span>{formattedDate}</span>
          </div>
          <div
            className="font-heading text-heading leading-heading text-text group-hover:text-accent mb-2 transition-colors duration-200"
            style={{ viewTransitionName: workTitleTransitionName(work.room, work.slug) }}
          >
            {work.title}
          </div>
          {work.summary && (
            <div className="font-body text-list leading-body text-text-2">{work.summary}</div>
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
