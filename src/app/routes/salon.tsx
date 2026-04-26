import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { SalonCard } from '@/shared/molecules/SalonCard/SalonCard';
import { TREATMENTS } from '@/shared/molecules/SalonCard/treatment-list';
import { getDisplayWorksByRoom, isPreviewWork } from '@/shared/content';
import type { Posture } from '@/shared/types/common';

const SALON_POSTURES = ['listening', 'looking', 'reading'] as const satisfies readonly Posture[];

export const Route = createFileRoute('/salon')({
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
// Once a treatment is chosen, this route collapses back to a single
// shared SalonCard treatment and the prototype labels disappear.
function SalonPage() {
  const { works } = Route.useLoaderData();
  const previewNote = works.find(isPreviewWork)?.preview.roomNote;
  const previewPostures = SALON_POSTURES.filter((posture) =>
    works.some((work) => work.posture === posture),
  );

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
      {previewPostures.length > 0 && (
        <div
          className="mb-8 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-body text-meta leading-[1.6] italic tracking-posture text-text-3"
          aria-label="Salon preview registers"
        >
          {previewPostures.map((posture, index) => (
            <span key={posture}>
              {index > 0 && (
                <span className="text-text-3" aria-hidden="true">
                  ·
                </span>
              )}{' '}
              <span className="text-accent-warm">{posture}</span>
            </span>
          ))}
        </div>
      )}
      {works.length > 0 && (
        <div className="flex flex-col">
          {works.map((work, i) => {
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
