import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { WorkEntry } from '@/shared/molecules/WorkEntry/WorkEntry';
import { RoomOutwardInvitation } from '@/shared/molecules/RoomOutwardInvitation/RoomOutwardInvitation';
import { getDisplayWorksByRoom, isPreviewWork } from '@/shared/content';

export const Route = createFileRoute('/garden')({
  loader: async () => {
    const works = await getDisplayWorksByRoom('garden');
    return { works };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: 'The Garden — Danny Dyer' },
      {
        name: 'description',
        content: 'Poetry. Work that breathes. Some seasonal, some perennial, none in a hurry.',
      },
      ...(loaderData?.works.some(isPreviewWork)
        ? [{ name: 'robots', content: 'noindex, nofollow' as const }]
        : []),
    ],
  }),
  component: GardenPage,
});

function GardenPage() {
  const { works } = Route.useLoaderData();
  const previewNote = works.find(isPreviewWork)?.preview.roomNote;
  return (
    <Reveal>
      <h1 className="mt-6 mb-4 font-heading text-display leading-display font-normal tracking-display text-text">
        The Garden
      </h1>
      <p className="mb-10 max-w-deck font-body text-body leading-body italic text-text-2 sm:mb-14">
        Poetry. Work that breathes. Some seasonal, some perennial, none in a hurry.
      </p>
      {previewNote && (
        <p className="-mt-4 mb-8 max-w-preview font-body text-meta leading-meta italic text-text-3 sm:-mt-6">
          {previewNote}
        </p>
      )}
      {works.length > 0 && (
        <div className="flex flex-col gap-room-rhythm">
          {works.map((work) => (
            <WorkEntry key={work.slug} work={work} variant="poem" />
          ))}
        </div>
      )}
      <RoomOutwardInvitation
        threads={['language', 'becoming']}
        toward={{ path: '/study', label: 'The Study' }}
      />
    </Reveal>
  );
}
