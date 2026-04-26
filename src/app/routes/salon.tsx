import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { SalonCard } from '@/shared/molecules/SalonCard/SalonCard';
import { TREATMENTS } from '@/shared/molecules/SalonCard/treatment-list';
import { withTransition } from '@/shared/hooks/useTransitionNavigate';
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

// Salon — currently a prototype gallery for thumbnail treatments. Each
// card uses a different gesture so the six can be felt side-by-side.
// The posture row is a single-select filter (listening | looking |
// reading); clicking a posture filters the list, clicking the active
// posture clears the filter. Filter changes route through the View
// Transitions wrapper so surviving cards morph to their new positions
// while removed cards fade out and restored cards fade in.
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
      <h1 className="mt-6 mb-4 font-heading text-display leading-display font-normal tracking-display text-text">
        The Salon
      </h1>
      <p className="mb-10 max-w-deck font-body text-body leading-body italic text-text-2 sm:mb-14">
        Music, aesthetics, beauty circulating between people. The cellist&rsquo;s son&rsquo;s room.
      </p>
      {previewNote && (
        <p className="-mt-4 mb-8 max-w-preview font-body text-meta leading-meta italic text-text-3 sm:-mt-6">
          {previewNote}
        </p>
      )}
      {availablePostures.length > 0 && (
        <PostureFilterBar postures={availablePostures} active={activePosture} />
      )}
      {visibleWorks.length > 0 && (
        <div className="flex flex-col">
          {visibleWorks.map((work, i) => {
            const treatment = TREATMENTS[i % TREATMENTS.length]!;
            return (
              <SalonCard
                key={work.slug}
                work={work}
                thumbLabel={isPreviewWork(work) ? work.preview.thumbLabel : undefined}
                treatmentLabel={`treatment ${(i % TREATMENTS.length) + 1} · ${treatment.name}`}
                treatment={treatment.component}
              />
            );
          })}
        </div>
      )}
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
// posture combination as a distinct route. The View Transition still
// fires; the URL is updated via useNavigate so the back button works
// and a copy/paste of the current URL preserves the filter.
function PostureFilterBar({ postures, active }: PostureFilterBarProps) {
  const navigate = withTransition(Route.useNavigate());
  return (
    <nav
      aria-label="Salon posture filter"
      className="mb-8 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-body text-meta leading-[1.6] italic tracking-posture text-text-3"
    >
      {postures.map((posture, index) => {
        const isActive = posture === active;
        return (
          <span key={posture} className="inline-flex items-baseline">
            {index > 0 && (
              <span className="mr-2 text-text-3" aria-hidden="true">
                ·
              </span>
            )}
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                const next: Posture | undefined = isActive ? undefined : posture;
                navigate({ search: { posture: next } });
              }}
              className={cn(
                'cursor-pointer rounded-[2px] bg-transparent px-1 font-body text-meta italic tracking-posture transition-colors duration-200',
                isActive
                  ? 'text-accent-warm underline decoration-accent-warm/40 underline-offset-4'
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
