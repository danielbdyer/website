import { Link } from '@tanstack/react-router';
import type { Work } from '@/shared/content/schema';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';

const ROOM_LABELS = {
  foyer: 'The Foyer',
  studio: 'The Studio',
  garden: 'The Garden',
  study: 'The Study',
  salon: 'The Salon',
} as const;

const ROOM_TO = {
  foyer: '/',
  studio: '/studio',
  garden: '/garden',
  study: '/study',
  salon: '/salon',
} as const;

interface WorkViewProps {
  work: Work;
}

// Single work, alone. The page's job is to be read; the chrome's job is
// to get out of the way. Per the design (chats/chat1.md), the work page
// does NOT carry the summary — that lives in the room listing. The page
// begins with kicker → title → meta → facets, then the body, then the
// three-line outward invitation: more facets, mentioned-in (when there
// are backlinks), and a return-to-room. No work ends at its own last line.
export function WorkView({ work }: WorkViewProps) {
  const roomLabel = ROOM_LABELS[work.room];
  const roomPath = ROOM_TO[work.room];
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article>
      <Link to={roomPath} className="kicker">
        ← {roomLabel}
      </Link>

      <h1 className="work-page-title">{work.title}</h1>

      <div className="work-page-meta">
        {import.meta.env.DEV && work.draft && <span className="draft-mark">draft </span>}
        {formattedDate}
      </div>

      {work.facets.length > 0 && (
        <div className="work-page-facets">
          <div className="facets">
            {work.facets.map((facet) => (
              <FacetChip key={facet} facet={facet} />
            ))}
          </div>
        </div>
      )}

      <div className="prose" dangerouslySetInnerHTML={{ __html: work.html }} />

      <Ornament />

      <div className="outward">
        <p>
          Keep wandering in <Link to={roomPath}>{roomLabel}</Link> →
        </p>
      </div>
    </article>
  );
}
