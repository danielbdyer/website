import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { WorkEntry } from '@/shared/molecules/WorkEntry/WorkEntry';
import { getWorksByRoom } from '@/shared/content';

export const Route = createFileRoute('/study')({
  loader: async () => {
    const works = await getWorksByRoom({ data: { room: 'study' } });
    return { works };
  },
  head: () => ({
    meta: [
      { title: 'The Study — Danny Dyer' },
      {
        name: 'description',
        content:
          'Essays and philosophy — the quiet room with good light. On attention, on inheritance, on the body deciding before the mind.',
      },
    ],
  }),
  component: StudyPage,
});

function StudyPage() {
  const { works } = Route.useLoaderData();
  return (
    <Reveal>
      <h1 className="room-title">The Study</h1>
      <p className="room-desc">
        Essays and philosophy — the quiet room with good light. On attention, on inheritance, on the
        body deciding before the mind.
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
