import { Link } from '@tanstack/react-router';
import type { Work } from '@/shared/content/schema';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';

interface WorkEntryProps {
  work: Work;
}

// Text-led work entry — the default rendering for a work in a room list.
// Studio essays carry summaries; Garden poems do not (the parent <ul>
// gets the .poem-list class and the .work-summary collapses). The DRAFT
// indicator is dev-only — see CONTENT_AUTHORING.md on the draft lifecycle.
export function WorkEntry({ work }: WorkEntryProps) {
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <Link to="/$room/$slug" params={{ room: work.room, slug: work.slug }} className="work-entry">
      <div className="work-meta">
        {import.meta.env.DEV && work.draft && <span className="draft-mark">draft </span>}
        {formattedDate}
      </div>
      <div className="work-title">{work.title}</div>
      {work.summary && <div className="work-summary">{work.summary}</div>}
      {work.facets.length > 0 && (
        <div className="facets">
          {work.facets.map((facet) => (
            <FacetChip key={facet} facet={facet} />
          ))}
        </div>
      )}
    </Link>
  );
}
