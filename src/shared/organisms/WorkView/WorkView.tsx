import { Link } from '@tanstack/react-router';
import type { DisplayWork } from '@/shared/content/preview';
import { isPreviewWork } from '@/shared/content/preview';
import type { Room } from '@/shared/types/common';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import { WorkReferent } from '@/shared/atoms/WorkReferent/WorkReferent';
import { useInternalLinkDelegation } from '@/shared/hooks/useInternalLinkDelegation';
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
  // Wikilinks render via dangerouslySetInnerHTML as raw `<a>` elements;
  // without delegation, a click triggers a full document reload (the
  // router only intercepts clicks on its own <Link>). The hook routes
  // internal hrefs through the router so wikilinks share the SPA's
  // view-transition + scroll-restoration lifecycle.
  const onProseClick = useInternalLinkDelegation();

  return (
    <article>
      <Link
        to={roomPath}
        className="font-body text-kicker text-text-2 hover:text-text mt-4 mb-10 inline-block italic no-underline transition-colors duration-200"
      >
        ← {roomLabel}
      </Link>

      <WorkHero work={work} image={work.image} thumbLabel={thumbLabel} />

      <h1
        className="font-heading text-title leading-title tracking-display text-text mb-3.5 font-normal"
        style={{ viewTransitionName: workTitleTransitionName(work.room, work.slug) }}
      >
        {work.title}
      </h1>

      <div
        className="font-body text-meta text-text-3 mb-2 italic"
        style={{ viewTransitionName: workMetaTransitionName(work.room, work.slug) }}
      >
        {work.posture && (
          <Link
            to="/salon"
            search={{ posture: work.posture }}
            className="font-body text-micro tracking-eyebrow text-accent-warm hover:border-accent-warm/40 mr-3 inline-block border-b border-transparent uppercase not-italic no-underline transition-colors duration-200"
          >
            {work.posture}
          </Link>
        )}
        {import.meta.env.DEV && work.draft && (
          <span className="font-body text-micro tracking-eyebrow text-accent-warm mr-3 inline-block uppercase not-italic">
            draft
          </span>
        )}
        {formattedDate}
      </div>

      {work.referent && <WorkReferent referent={work.referent} />}

      {isPreviewWork(work) && (
        <p className="max-w-preview font-body text-meta leading-meta text-text-3 mb-6 italic">
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

      {/* The onClick handler is event-delegation only — the
          interactive elements are the `<a>` anchors inside the prose.
          Keyboard activation of an anchor (Enter on focus) fires a
          click event that bubbles to this handler, so keyboard access
          is preserved without a separate keyDown listener. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={cn('prose', work.type === 'poem' && 'prose-poem')}
        onClick={onProseClick}
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
