import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { WorkRow } from '@/shared/molecules/WorkRow/WorkRow';
import { RoomOutwardInvitation } from '@/shared/molecules/RoomOutwardInvitation/RoomOutwardInvitation';
import { getDisplayWorksByRoom, isPreviewWork, postureSchema } from '@/shared/content';
import type { Posture } from '@/shared/types/common';
import { cn } from '@/shared/utils/cn';

const SALON_POSTURES = ['listening', 'looking', 'reading'] as const satisfies readonly Posture[];

const salonSearchSchema = z.object({
  posture: postureSchema.optional(),
});

export const Route = createFileRoute('/salon')({
  validateSearch: salonSearchSchema,
  loaderDeps: ({ search }) => ({ posture: search.posture }),
  loader: async () => {
    const works = await getDisplayWorksByRoom('salon');
    return { works };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: 'The Salon — Danny Dyer' },
      {
        name: 'description',
        content: "Music, aesthetics, beauty circulating between people. The cellist's son's room.",
      },
      ...(loaderData?.works.some(isPreviewWork)
        ? [{ name: 'robots', content: 'noindex, nofollow' as const }]
        : []),
    ],
  }),
  component: SalonPage,
});

// The Salon defaults to image-rows — a 132px square per row, with the
// room glyph filling in when a work has no attached image. The posture
// row above the list is a single-select filter (listening | looking |
// reading); clicking the active posture clears it. Empty room state:
// title + description + silence.
function SalonPage() {
  const { works } = Route.useLoaderData();
  const { posture: activePosture } = Route.useSearch();
  const previewNote = works.find(isPreviewWork)?.preview.roomNote;
  const availablePostures = SALON_POSTURES.filter((posture) =>
    works.some((work) => work.posture === posture),
  );
  const visibleWorks = activePosture
    ? works.filter((work) => work.posture === activePosture)
    : works;

  return (
    <Reveal>
      <h1 className="font-heading text-display leading-display tracking-display text-text mt-6 mb-4 font-normal">
        The Salon
      </h1>
      <p className="max-w-deck font-body text-body leading-body text-text-2 mb-10 italic sm:mb-14">
        Music, aesthetics, beauty circulating between people. The cellist&rsquo;s son&rsquo;s room.
      </p>
      {previewNote && (
        <p className="max-w-preview font-body text-meta leading-meta text-text-3 -mt-4 mb-8 italic sm:-mt-6">
          {previewNote}
        </p>
      )}
      {availablePostures.length > 0 && (
        <PostureFilterBar postures={availablePostures} active={activePosture} />
      )}
      {visibleWorks.length > 0 && (
        <div className="flex flex-col">
          {visibleWorks.map((work) => (
            <WorkRow
              key={work.slug}
              work={work}
              thumbLabel={isPreviewWork(work) ? work.preview.thumbLabel : undefined}
            />
          ))}
        </div>
      )}
      <RoomOutwardInvitation
        threads={['beauty', 'consciousness']}
        toward={{ path: '/garden', label: 'The Garden' }}
      />
    </Reveal>
  );
}

interface PostureFilterBarProps {
  postures: readonly Posture[];
  active: Posture | undefined;
}

// Single-select posture toggle. Clicking the active posture clears the
// filter; clicking another switches to it. Renders as buttons rather
// than anchors because the search-param URL form ("?posture=looking")
// is a client-side filter, not a separately prerendered page — emitting
// real anchors would invite the prerender crawler to walk every
// posture variant as a distinct route.
function PostureFilterBar({ postures, active }: PostureFilterBarProps) {
  const navigate = Route.useNavigate();
  return (
    <nav
      aria-label="Salon posture filter"
      className="font-body text-meta tracking-posture text-text-3 mb-8 flex flex-wrap items-baseline gap-x-2 gap-y-1 leading-[1.6] italic"
    >
      {postures.map((posture, index) => {
        const isActive = posture === active;
        return (
          <span key={posture} className="inline-flex items-baseline">
            {index > 0 && (
              <span className="text-text-3 mr-2" aria-hidden="true">
                ·
              </span>
            )}
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                const next: Posture | undefined = isActive ? undefined : posture;
                void navigate({ search: { posture: next } });
              }}
              className={cn(
                'font-body text-meta tracking-posture cursor-pointer rounded-[2px] bg-transparent px-1 italic transition-colors duration-200',
                isActive
                  ? 'text-accent-warm decoration-accent-warm/40 underline underline-offset-4'
                  : 'text-accent-warm/70 hover:text-accent-warm',
              )}
            >
              {posture}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
