import { Link } from '@tanstack/react-router';
import { marked } from 'marked';
import type { Work } from '@/shared/content/schema';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';

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

export function WorkView({ work }: WorkViewProps) {
  const roomLabel = ROOM_LABELS[work.room];
  const roomPath = ROOM_TO[work.room];
  const html = marked.parse(work.body, { async: false });
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article>
      <Link
        to={roomPath}
        className="text-[0.85rem] text-text-2 italic no-underline transition-colors duration-200 hover:text-accent"
      >
        ← {roomLabel}
      </Link>

      <h1 className="font-heading text-[1.85rem] font-normal tracking-tight mt-4 mb-3 text-text">
        {work.title}
      </h1>

      <div className="text-[0.85rem] text-text-2 italic mb-2">{formattedDate}</div>

      {work.facets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {work.facets.map((facet) => (
            <span
              key={facet}
              className="text-[0.72rem] px-2 py-0.5 rounded bg-tag-bg text-tag-text"
            >
              {facet}
            </span>
          ))}
        </div>
      )}

      {work.summary && (
        <p className="text-[0.95rem] text-text-2 italic leading-relaxed mb-8">{work.summary}</p>
      )}

      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

      <Ornament />

      <Link
        to={roomPath}
        className="text-[0.9rem] text-text-2 italic no-underline transition-colors duration-200 hover:text-accent"
      >
        Keep wandering in {roomLabel} →
      </Link>
    </article>
  );
}
