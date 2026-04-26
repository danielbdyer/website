import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { WorkEntry } from '@/shared/molecules/WorkEntry/WorkEntry';
import { getDisplayWorksByRoom, isPreviewWork } from '@/shared/content';

export const Route = createFileRoute('/studio')({
  loader: async () => {
    const works = await getDisplayWorksByRoom('studio');
    return { works };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: 'The Studio — Danny Dyer' },
      {
        name: 'description',
        content:
          'Engineering, leadership, and the architecture of teams. Craft as devotion, rendered legibly.',
      },
      ...(loaderData?.works.some(isPreviewWork)
        ? [{ name: 'robots', content: 'noindex, nofollow' as const }]
        : []),
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const { works } = Route.useLoaderData();
  const previewNote = works.find(isPreviewWork)?.preview.roomNote;
  return (
    <Reveal>
      <h1 className="mt-6 mb-4 font-heading text-[2.15rem] leading-[1.05] font-normal tracking-[-0.01em] text-text sm:text-[42px]">
        The Studio
      </h1>
      <p className="mb-10 max-w-[540px] font-body text-[15.5px] leading-[1.7] italic text-text-2 sm:mb-14 sm:text-[16.5px]">
        Engineering, leadership, and the architecture of teams. Craft as devotion, rendered legibly.
      </p>
      {previewNote && (
        <p className="-mt-4 mb-8 max-w-[620px] font-body text-[13px] leading-[1.65] italic text-text-3 sm:-mt-6 sm:text-[13.5px]">
          {previewNote}
        </p>
      )}
      {works.length > 0 && (
        <div className="flex flex-col gap-11">
          {works.map((work) => (
            <WorkEntry key={work.slug} work={work} />
          ))}
        </div>
      )}
    </Reveal>
  );
}
