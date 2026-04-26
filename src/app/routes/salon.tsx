import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { WorkRow } from '@/shared/molecules/WorkRow/WorkRow';
import { getDisplayWorksByRoom, isPreviewWork } from '@/shared/content';

const SALON_POSTURES = ['listening', 'looking'] as const;

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

// The Salon defaults to image-rows — a 132px square per row, with the room
// glyph filling in when a work has no attached image. The two-posture
// reading/looking line is held back until there are enough works to make
// both registers honest. Empty room state: title + description + silence.
function SalonPage() {
  const { works } = Route.useLoaderData();
  const previewNote = works.find(isPreviewWork)?.preview.roomNote;
  const previewPostures = SALON_POSTURES.filter((posture) =>
    works.some((work) => isPreviewWork(work) && work.preview.kicker === posture),
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
          {works.map((work) => (
            <WorkRow
              key={work.slug}
              work={work}
              kicker={isPreviewWork(work) ? work.preview.kicker : undefined}
              thumbLabel={isPreviewWork(work) ? work.preview.thumbLabel : undefined}
            />
          ))}
        </div>
      )}
    </Reveal>
  );
}
