import { Link } from '@tanstack/react-router';
import type { DisplayWork } from '@/shared/content/preview';
import { isPreviewWork } from '@/shared/content/preview';
import type { Work, WorkImage } from '@/shared/content/schema';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import { workHeroTransitionName } from '@/shared/utils/view-transition-names';

function WorkHero({ work, image }: { work: Work; image: WorkImage }) {
  return (
    <figure
      className="mb-8 -mx-4 overflow-hidden rounded-[2px] bg-bg-warm shadow-sm sm:-mx-0"
      style={{ viewTransitionName: workHeroTransitionName(work.room, work.slug) }}
    >
      <img
        src={image.src}
        alt={image.alt}
        className="block h-auto w-full"
        loading="eager"
        decoding="async"
      />
      {(image.caption || image.credit) && (
        <figcaption className="px-4 py-3 font-body text-meta italic tracking-meta text-text-3">
          {image.caption}
          {image.caption && image.credit ? ' · ' : ''}
          {image.credit && <span className="not-italic text-text-3">{image.credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}

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
  work: DisplayWork;
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
      <Link
        to={roomPath}
        className="mt-4 mb-10 inline-block font-body text-kicker italic text-text-2 no-underline transition-colors duration-200 hover:text-text"
      >
        ← {roomLabel}
      </Link>

      {work.image && <WorkHero work={work} image={work.image} />}

      <h1 className="mb-3.5 font-heading text-title leading-title font-normal tracking-display text-text">
        {work.title}
      </h1>

      <div className="mb-2 font-body text-meta italic text-text-3">
        {import.meta.env.DEV && work.draft && (
          <span className="mr-3 inline-block font-body text-micro not-italic tracking-eyebrow text-accent-warm uppercase">
            draft
          </span>
        )}
        {formattedDate}
      </div>

      {isPreviewWork(work) && (
        <p className="mb-6 max-w-preview font-body text-meta leading-meta italic text-text-3">
          {work.preview.workNote}
        </p>
      )}

      {work.facets.length > 0 && (
        <div className="mb-work-break" aria-label="Facets">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            {work.facets.map((facet) => (
              <FacetChip key={facet} facet={facet} />
            ))}
          </div>
        </div>
      )}

      <div className="prose" dangerouslySetInnerHTML={{ __html: work.html }} />

      {/* Generous gap before the Ornament so the work's last line gets a
          full breath before the section break arrives. The closing line
          then sits at a moderate distance below — the gesture feels
          anchored, not abandoned. */}
      <Ornament className="mt-work-break sm:mt-work-break-md" />

      <div className="mt-room-rhythm font-body text-list leading-closing italic text-text-2">
        <p>
          Keep wandering in{' '}
          <Link
            to={roomPath}
            className="border-b border-transparent text-text-2 no-underline transition-colors duration-200 hover:border-text-3 hover:text-text"
          >
            {roomLabel}
          </Link>{' '}
          →
        </p>
      </div>
    </article>
  );
}
