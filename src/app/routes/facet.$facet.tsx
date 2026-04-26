import { createFileRoute, notFound } from '@tanstack/react-router';
import {
  FACET_META,
  facetSchema,
  getDisplayWorksByFacetGrouped,
  isPreviewWork,
} from '@/shared/content';
import type { Room } from '@/shared/types/common';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { WorkEntry } from '@/shared/molecules/WorkEntry/WorkEntry';

const ROOM_LABELS: Readonly<Record<Room, string>> = {
  foyer: 'The Foyer',
  studio: 'The Studio',
  garden: 'The Garden',
  study: 'The Study',
  salon: 'The Salon',
};

export const Route = createFileRoute('/facet/$facet')({
  loader: async ({ params }) => {
    const result = facetSchema.safeParse(params.facet);
    if (!result.success) throw notFound();
    const groups = await getDisplayWorksByFacetGrouped(result.data);
    return { facet: result.data, groups };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { facet, groups } = loaderData;
    const meta = FACET_META[facet];
    const hasPreview = groups.some((group) => group.works.some(isPreviewWork));
    return {
      meta: [
        { title: `${meta.label} — Danny Dyer` },
        { name: 'description', content: meta.description },
        ...(hasPreview ? [{ name: 'robots', content: 'noindex, nofollow' as const }] : []),
      ],
    };
  },
  component: FacetPage,
});

function FacetPage() {
  const { facet, groups } = Route.useLoaderData();
  const meta = FACET_META[facet];
  return (
    <Reveal>
      <h1 className="mt-6 mb-4 font-heading text-display leading-[1.05] font-normal tracking-[-0.01em] text-text">
        {meta.label}
      </h1>
      <p className="mb-12 max-w-[540px] font-body text-body leading-[1.7] italic text-text-2 sm:mb-14">
        {meta.description}
      </p>
      {groups.length === 0 ? (
        // Per VOICE_AND_COPY.md §"Empty facet pages" — name the absence
        // quietly. The thread exists; no work currently carries it.
        <p className="font-body text-list italic text-text-3">
          No works currently carry this thread.
        </p>
      ) : (
        <div className="flex flex-col gap-12 sm:gap-16">
          {groups.map(({ room, works }) => (
            <section key={room} aria-labelledby={`facet-room-${room}`}>
              <h2
                id={`facet-room-${room}`}
                className="mb-6 font-heading text-heading font-normal italic text-text-2"
              >
                {ROOM_LABELS[room]}
              </h2>
              <div className="flex flex-col gap-9">
                {works.map((work) => (
                  <WorkEntry
                    key={`${work.room}-${work.slug}`}
                    work={work}
                    variant={work.room === 'garden' ? 'poem' : 'default'}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Reveal>
  );
}
