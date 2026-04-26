import { Link } from '@tanstack/react-router';
import type { DisplayWork } from '@/shared/content/preview';
import { isPreviewWork } from '@/shared/content/preview';
import type { Work, WorkImage } from '@/shared/content/schema';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import { ImgSlot } from '@/shared/atoms/ImgSlot/ImgSlot';
import {
  workHeroTransitionName,
  workMetaTransitionName,
  workTitleTransitionName,
} from '@/shared/utils/view-transition-names';

// The hero figure at the top of a work page. Three states, mirroring
// ImgSlot's contract:
// - **filled**: a real authored image. Renders the photo full-width
//   with a caption + credit beneath.
// - **standin**: the work has no authored image but the preview is
//   naming what would arrive (e.g., "hopper · cape cod morning"). The
//   labeled gray field gives the morph from a FacetCard thumbnail a
//   destination — without this, clicking a card on the facet page
//   would flash to a hero-less work page and the View Transition would
//   have nothing to morph into.
// - **absent**: the work neither has an image nor names one. The hero
//   slot is omitted entirely; the work begins with its title.
//
// Every visible state carries the canonical view-transition name so
// FacetCard / SalonCard thumbnails morph into this element on click.
function WorkHero({
  work,
  image,
  thumbLabel,
}: {
  work: Work;
  image: WorkImage | undefined;
  thumbLabel: string | undefined;
}) {
  if (!image && !thumbLabel) return null;
  return (
    <figure
      className="mb-8 overflow-hidden rounded-[2px] bg-bg-warm shadow-sm"
      style={{ viewTransitionName: workHeroTransitionName(work.room, work.slug) }}
    >
      {image ? (
        <>
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
        </>
      ) : (
        // Stand-in state: the labeled gray field. The aspect mirrors
        // the hi-fi (16:10) so the slot reads as "hero-shaped" even
        // when empty. Naming the slot — "image slot · labeled
        // (preview's honest stand-in)" — sits above the figure as a
        // small italic eyebrow; that lives in the route, not here, so
        // a future authored work doesn't carry the eyebrow.
        <div className="relative aspect-[16/10]">
          <ImgSlot kind="standin" label={thumbLabel ?? ''} />
        </div>
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

      <WorkHero
        work={work}
        image={work.image}
        thumbLabel={isPreviewWork(work) ? work.preview.thumbLabel : undefined}
      />

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
