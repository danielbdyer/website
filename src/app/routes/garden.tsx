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
      <h1 className="font-heading text-display leading-display tracking-display text-text mt-6 mb-4 font-normal">
        The Garden
      </h1>
      <p className="max-w-deck font-body text-body leading-body text-text-2 mb-10 italic sm:mb-14">
        Poetry. Work that breathes. Some seasonal, some perennial, none in a hurry.
      </p>
      {previewNote && (
        <p className="max-w-preview font-body text-meta leading-meta text-text-3 -mt-4 mb-8 italic sm:-mt-6">
          {previewNote}
        </p>
      )}
      {works.length > 0 && (
        <div className="gap-room-rhythm flex flex-col">
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
