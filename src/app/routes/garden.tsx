import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { WorkEntry } from '@/shared/molecules/WorkEntry/WorkEntry';
import { getWorksByRoom } from '@/shared/content';

export const Route = createFileRoute('/garden')({
  loader: async () => {
    const works = await getWorksByRoom({ data: { room: 'garden' } });
    return { works };
  },
  head: () => ({
    meta: [
      { title: 'The Garden — Danny Dyer' },
      {
        name: 'description',
        content: 'Poetry. Work that breathes. Some seasonal, some perennial, none in a hurry.',
      },
    ],
  }),
  component: GardenPage,
});

function GardenPage() {
  const { works } = Route.useLoaderData();
  return (
    <Reveal>
      <h1 className="room-title">The Garden</h1>
      <p className="room-desc">
        Poetry. Work that breathes. Some seasonal, some perennial, none in a hurry.
      </p>
      {works.length > 0 && (
        <div className="work-list poem-list">
          {works.map((work) => (
            <WorkEntry key={work.slug} work={work} />
          ))}
        </div>
      )}
    </Reveal>
  );
}
