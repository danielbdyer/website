import { Link } from '@tanstack/react-router';
import type { DisplayWork } from '@/shared/content/preview';
import { isPreviewWork } from '@/shared/content/preview';
import type { Room } from '@/shared/types/common';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import { WorkReferent } from '@/shared/atoms/WorkReferent/WorkReferent';
import { WorkHero } from '@/shared/molecules/WorkHero/WorkHero';
import { WorkOutwardInvitation } from '@/shared/molecules/WorkOutwardInvitation/WorkOutwardInvitation';
import {
  workMetaTransitionName,
  workTitleTransitionName,
} from '@/shared/utils/view-transition-names';
import { cn } from '@/shared/utils/cn';

const ROOM_LABELS: Readonly<Record<Room, string>> = {
  foyer: 'The Foyer',
  studio: 'The Studio',
  garden: 'The Garden',
  study: 'The Study',
  salon: 'The Salon',
};

const ROOM_TO: Readonly<Record<Room, '/' | `/${Exclude<Room, 'foyer'>}`>> = {
  foyer: '/',
  studio: '/studio',
  garden: '/garden',
  study: '/study',
  salon: '/salon',
};

interface WorkViewProps {
  work: DisplayWork;
}

// Single work, alone. The page's job is to be read; the chrome's job is
// to get out of the way. The work page does NOT carry the summary — that
// lives in the room listing (per INFORMATION_ARCHITECTURE.md §"Anatomy"
// and §"What work pages do not carry"). The page begins with kicker →
// hero → title → meta → facets, then the body, then the outward
// invitation. No work ends at its own last line.
export function WorkView({ work }: WorkViewProps) {
  const roomLabel = ROOM_LABELS[work.room];
  const roomPath = ROOM_TO[work.room];
  const formattedDate = work.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const thumbLabel = isPreviewWork(work) ? work.preview.thumbLabel : undefined;

  return (
    <article>
      <Link
        to={roomPath}
        className="mt-4 mb-10 inline-block font-body text-kicker italic text-text-2 no-underline transition-colors duration-200 hover:text-text"
      >
        ← {roomLabel}
      </Link>

      <WorkHero work={work} image={work.image} thumbLabel={thumbLabel} />

      <h1
        className="mb-3.5 font-heading text-title leading-title font-normal tracking-display text-text"
        style={{ viewTransitionName: workTitleTransitionName(work.room, work.slug) }}
      >
        {work.title}
      </h1>

      <div
        className="mb-2 font-body text-meta italic text-text-3"
        style={{ viewTransitionName: workMetaTransitionName(work.room, work.slug) }}
      >
        {work.posture && (
          <span className="mr-3 inline-block font-body text-micro not-italic tracking-eyebrow text-accent-warm uppercase">
            {work.posture}
          </span>
        )}
        {import.meta.env.DEV && work.draft && (
          <span className="mr-3 inline-block font-body text-micro not-italic tracking-eyebrow text-accent-warm uppercase">
            draft
          </span>
        )}
        {formattedDate}
      </div>

      {work.referent && <WorkReferent referent={work.referent} />}

      {isPreviewWork(work) && (
        <p className="mb-6 max-w-preview font-body text-meta leading-meta italic text-text-3">
          {work.preview.workNote}
        </p>
      )}

      {work.facets.length > 0 && (
        <div
          className="mb-work-break flex flex-wrap items-center gap-x-2.5 gap-y-2"
          aria-label="Facets"
        >
          {work.facets.map((facet) => (
            <FacetChip key={facet} facet={facet} />
          ))}
        </div>
      )}

      <div
        className={cn('prose', work.type === 'poem' && 'prose-poem')}
        dangerouslySetInnerHTML={{ __html: work.html }}
      />

      <WorkOutwardInvitation
        room={work.room}
        roomPath={roomPath}
        roomLabel={roomLabel}
        facets={work.facets}
        backlinks={work.backlinks}
      />
    </article>
  );
}
