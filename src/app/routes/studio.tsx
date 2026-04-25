import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { WorkEntry } from '@/shared/molecules/WorkEntry/WorkEntry';
import { getWorksByRoom } from '@/shared/content';

export const Route = createFileRoute('/studio')({
  loader: async () => {
    const works = await getWorksByRoom({ data: { room: 'studio' } });
    return { works };
  },
  head: () => ({
    meta: [
      { title: 'The Studio — Danny Dyer' },
      {
        name: 'description',
        content:
          'Engineering, leadership, and the architecture of teams. Craft as devotion, rendered legibly.',
      },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  const { works } = Route.useLoaderData();
  return (
    <Reveal>
      <h1 className="room-title">The Studio</h1>
      <p className="room-desc">
        Engineering, leadership, and the architecture of teams. Craft as devotion, rendered legibly.
      </p>
      {works.length > 0 && (
        <div className="work-list">
          {works.map((work) => (
            <WorkEntry key={work.slug} work={work} />
          ))}
        </div>
      )}
    </Reveal>
  );
}
