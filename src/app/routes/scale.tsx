import { Link, createFileRoute } from '@tanstack/react-router';
import { Bestiary } from '@/shared/organisms/Bestiary/Bestiary';
import { RECORDS } from '@/shared/scale/records';
import { PASSAGE } from '@/shared/content/passage';

// Objects of Scale — off the chart. Not a room of the house: a place
// the sky keeps, reached through the passage the whisper offers at
// one star (CONSTELLATION_WALK.md §"The Whisper", the fourth line)
// and by its address. It has its own light — a pale matte stage, one
// saturated color a page — and none of the house's chrome; the root
// treats it as the sky is treated. It is not in the sitemap: a secret
// is not indexed. The way back is the star the passage left from.
// OBJECTS_OF_SCALE.md.

export const Route = createFileRoute('/scale')({
  head: () => ({
    meta: [
      { title: 'Objects of Scale — a bestiary of speed' },
      {
        name: 'description',
        content:
          'Every speed record moves past its object of scale at the true rate, so you feel the number instead of reading it.',
      },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ScalePage,
});

function ScalePage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <Bestiary records={RECORDS} className="h-full" />
      <Link
        to="/sky"
        search={{ focus: PASSAGE.from }}
        aria-label="Return to the sky"
        className="bestiary__return"
      >
        ← the sky
      </Link>
    </div>
  );
}
