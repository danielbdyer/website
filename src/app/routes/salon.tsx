import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { WorkRow } from '@/shared/molecules/WorkRow/WorkRow';
import { getWorksByRoom } from '@/shared/content';

export const Route = createFileRoute('/salon')({
  loader: async () => {
    const works = await getWorksByRoom({ data: { room: 'salon' } });
    return { works };
  },
  head: () => ({
    meta: [
      { title: 'The Salon — Danny Dyer' },
      {
        name: 'description',
        content: "Music, aesthetics, beauty circulating between people. The cellist's son's room.",
      },
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
  return (
    <Reveal>
      <h1 className="room-title">The Salon</h1>
      <p className="room-desc">
        Music, aesthetics, beauty circulating between people. The cellist&rsquo;s son&rsquo;s room.
      </p>
      {works.length > 0 && (
        <div className="work-rows">
          {works.map((work) => (
            <WorkRow key={work.slug} work={work} />
          ))}
        </div>
      )}
    </Reveal>
  );
}
