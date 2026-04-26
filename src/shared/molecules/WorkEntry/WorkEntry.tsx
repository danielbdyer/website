import { Link } from '@tanstack/react-router';
import type { Work } from '@/shared/content/schema';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';

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
export function WorkEntry({ work, variant = 'default' }: WorkEntryProps) {
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <article>
      <Link
        to="/$room/$slug"
        params={{ room: work.room, slug: work.slug }}
        className="group block text-inherit no-underline"
      >
        <div className="mb-2 font-body text-meta italic tracking-[0.02em] text-text-3">
          {import.meta.env.DEV && work.draft && (
            <span className="mr-3 inline-block font-body text-micro not-italic tracking-[0.08em] text-accent-warm uppercase">
              draft
            </span>
          )}
          {formattedDate}
        </div>
        <div className="mb-2 font-heading text-heading leading-[1.25] text-text transition-colors duration-200 group-hover:text-accent">
          {work.title}
        </div>
        {variant !== 'poem' && work.summary && (
          <div className="font-body text-list leading-[1.7] text-text-2">{work.summary}</div>
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
