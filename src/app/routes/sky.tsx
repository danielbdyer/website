import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Constellation } from '@/shared/organisms/Constellation/Constellation';
import { useReturnGesture } from '@/shared/hooks/useReturnGesture';
import { getConstellationGraph } from '@/shared/content/constellation';

// The constellation route. The visitor enters by looking up; the page
// occupies the entire viewport — no nav, no footer, no column. The
// chrome belongs to the rooms below, not to the firmament. The carpet
// rolls out on first paint via .sky-arrival; the visitor leaves via
// any of three gestures (ArrowDown / Escape, sustained scroll-down,
// touch swipe-down) wired through useReturnGesture.
//
// CONSTELLATION.md §"Reframe 1" committed to this layout opt-out;
// __root.tsx hides Nav/Footer and drops column constraints when the
// pathname matches /sky.

export const Route = createFileRoute('/sky')({
  loader: async () => {
    const graph = await getConstellationGraph();
    return { graph };
  },
  head: () => ({
    meta: [
      { title: 'The constellation — Danny Dyer' },
      {
        name: 'description',
        content:
          'The site as a sky: each work a star, each shared facet a faint thread between two stars.',
      },
    ],
  }),
  component: SkyPage,
});

function SkyPage() {
  const { graph } = Route.useLoaderData();
  const navigate = useNavigate();
  useReturnGesture(() => {
    void navigate({ to: '/' });
  });

  return (
    <div className="sky-arrival relative h-dvh w-full overflow-hidden">
      <Constellation graph={graph} fullViewport className="h-full w-full" />
      {/* The return affordance — small, italic, low contrast, fixed at
          the bottom-center of the viewport. The gesture-based returns
          (down arrow, scroll-down, swipe-down) are the canonical paths;
          this link is the visible fallback for visitors who don't
          discover them. The aria-label is verbose so screen readers
          announce what the small ↓ glyph means. */}
      <Link
        to="/"
        aria-label="Return to the Foyer"
        className="font-body text-list text-text-3 hover:text-text-2 absolute bottom-8 left-1/2 z-10 -translate-x-1/2 italic no-underline transition-colors duration-200"
      >
        ↓ Return to the Foyer
      </Link>
    </div>
  );
}
