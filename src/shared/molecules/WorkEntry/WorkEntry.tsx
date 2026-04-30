import { Link } from '@tanstack/react-router';
import type { Work } from '@/shared/content/schema';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import {
  workCardTransitionName,
  workMetaTransitionName,
  workTitleTransitionName,
} from '@/shared/utils/view-transition-names';

interface WorkEntryProps {
  work: Work;
  variant?: 'default' | 'poem';
}

// Text-led work entry. The title block (date, title, summary) is one
// link to the work; facet chips sit underneath as their own links to
// /facet/{facet}. The chips live outside the title link rather than
// inside it because nesting <a> in <a> is invalid HTML — and because
// a chip is its own thread, not a hint about the work it sits beneath.
// Studio essays carry summaries; Garden poems do not. The DRAFT
// indicator is dev-only — see CONTENT_AUTHORING.md.
//
// View-transition names: the article wrapper carries the card name (so
// future filtering on text-led rooms can use **Rearrange**); title and
// meta carry their canonical names so click → work page morphs the
// title and meta in place. There's no image in WorkEntry, so no hero
// name. The morph degrades correctly — the WorkView's Open gesture
// just runs without a hero participant for these rooms; the title and
// meta still travel.
export function WorkEntry({ work, variant = 'default' }: WorkEntryProps) {
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <article style={{ viewTransitionName: workCardTransitionName(work.room, work.slug) }}>
      <Link
        to="/$room/$slug"
        params={{ room: work.room, slug: work.slug }}
        className="group block text-inherit no-underline"
      >
        <div
          className="font-body text-meta tracking-meta text-text-3 mb-2 italic"
          style={{ viewTransitionName: workMetaTransitionName(work.room, work.slug) }}
        >
          {import.meta.env.DEV && work.draft && (
            <span className="font-body text-micro tracking-eyebrow text-accent-warm mr-3 inline-block uppercase not-italic">
              draft
            </span>
          )}
          {formattedDate}
        </div>
        <div
          className="font-heading text-heading leading-heading text-text group-hover:text-accent mb-2 transition-colors duration-200"
          style={{ viewTransitionName: workTitleTransitionName(work.room, work.slug) }}
        >
          {work.title}
        </div>
        {variant !== 'poem' && work.summary && (
          <div className="font-body text-list leading-body text-text-2">{work.summary}</div>
        )}
      </Link>
      {work.facets.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2">
          {work.facets.map((facet) => (
            <FacetChip key={facet} facet={facet} />
          ))}
        </div>
      )}
    </article>
  );
}
