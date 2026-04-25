import { Link } from '@tanstack/react-router';
import type { Work } from '@/shared/content/schema';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';

interface WorkEntryProps {
  work: Work;
  variant?: 'default' | 'poem';
}

// Text-led work entry — the default rendering for a work in a room list.
// Studio essays carry summaries; Garden poems do not. The DRAFT indicator
// is dev-only — see CONTENT_AUTHORING.md on the draft lifecycle.
export function WorkEntry({ work, variant = 'default' }: WorkEntryProps) {
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <Link
      to="/$room/$slug"
      params={{ room: work.room, slug: work.slug }}
      className="group block text-inherit no-underline"
    >
      <div className="mb-1.5 font-body text-[13px] italic tracking-[0.02em] text-text-3">
        {import.meta.env.DEV && work.draft && (
          <span className="mr-2 inline-block font-body text-[11px] not-italic tracking-[0.08em] text-accent-warm uppercase">
            draft
          </span>
        )}
        {formattedDate}
      </div>
      <div
        className={[
          'mb-2 font-heading leading-[1.25] text-text transition-colors duration-200 group-hover:text-accent',
          variant === 'poem' ? 'text-[22px]' : 'text-[22px] sm:text-[23px]',
        ].join(' ')}
      >
        {work.title}
      </div>
      {variant !== 'poem' && work.summary && (
        <div className="mb-2.5 font-body text-[15px] leading-[1.7] text-text-2 sm:text-[15.5px]">
          {work.summary}
        </div>
      )}
      {work.facets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {work.facets.map((facet) => (
            <FacetChip key={facet} facet={facet} />
          ))}
        </div>
      )}
    </Link>
  );
}
