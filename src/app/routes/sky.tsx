import { Link, Outlet, createFileRoute, useMatch, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { Constellation } from '@dbd/sky';
import { useTheme } from '@/app/providers';
import { useReturnGesture } from '@/shared/hooks/useReturnGesture';
import { useThresholdReveal } from '@/shared/hooks/useThresholdReveal';
import { getConstellationGraph } from '@/shared/content/constellation';

// `focus` names a work's star (`{room}/{slug}`) the sky opens centered
// on — the look-up jump from a work page. Optional: bare /sky opens at
// the polestar. CONSTELLATION_PARALLEL.md §"The Orientation Contract."
const skySearchSchema = z.object({ focus: z.string().optional() });

// The constellation route. The visitor enters by looking up; the page
// occupies the entire viewport — no nav, no footer, no column. The
// chrome belongs to the rooms below, not to the firmament. The carpet
// rolls out on first paint via .sky-arrival.
//
// Leaving is the inverse gesture, threshold-held: scrolling down
// leans the Foyer's ground into the frame from below (spring-backed
// preview); past the threshold the return commits. ArrowDown and
// Escape stay instant for keyboards; the small "↓ Return" link is
// the always-visible path. While a work overlay is open, all of it
// stands down — scroll belongs to the reading, and the way back is
// the overlay's own close (Esc, ×, click-off).
//
// CONSTELLATION.md §"Reframe 1" committed to this layout opt-out;
// __root.tsx hides Nav/Footer and drops column constraints when the
// pathname matches /sky.

export const Route = createFileRoute('/sky')({
  validateSearch: skySearchSchema,
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

// The descent's choreography lives in CSS on html.descending
// (tokens.css §"The ascent and the descent") and in the Foyer's
// settle-in: the room comes back beneath a daystar that stays where
// it is, and then the face flies down into the nav's corner and
// resolves into the glyph, exactly where it rests (dom/daystarSeat.ts).
// The class opens with the return and closes once that has played.
const DESCENT_MS = 1500;
let descentTimer: ReturnType<typeof setTimeout> | null = null;
function markDescent(): void {
  const root = document.documentElement;
  root.classList.add('descending');
  if (descentTimer !== null) clearTimeout(descentTimer);
  descentTimer = setTimeout(() => {
    root.classList.remove('descending');
    descentTimer = null;
  }, DESCENT_MS);
}

const RETURN_LINK_CLASS =
  'sky-return-link font-body text-list text-text-3 hover:text-text-2 absolute bottom-8 left-1/2 z-10 -translate-x-1/2 italic no-underline transition-colors duration-200';

function SkyPage() {
  const { graph } = Route.useLoaderData();
  const { focus } = Route.useSearch();
  const navigate = useNavigate();
  // The hour the sky keeps, and the way to turn it: the daystar in the
  // sky is the nav's toggle, ascended (CONSTELLATION.md §"The Sun and
  // the Moon"). The route owns the theme; the constellation only
  // receives the hour.
  const { dark, toggle } = useTheme();
  const hour = { current: dark ? ('night' as const) : ('day' as const), turn: toggle };
  // While the work overlay is open, the sky's leave-gestures stand
  // down entirely: scrolling reads the work, Escape closes the
  // overlay (its own handler), and only the overlay's close paths
  // return here.
  const overlayOpen = Boolean(useMatch({ from: '/sky/$room/$slug', shouldThrow: false }));
  // If the visitor looked up from a work, `focus` names its star;
  // looking back down returns to the piece, not the Foyer — the
  // crossing is reversible. Otherwise the sky returns to the Foyer.
  const [focusRoom, focusSlug] = focus?.split('/') ?? [];
  const returnHome = () => {
    markDescent();
    if (focusRoom && focusSlug) {
      void navigate({ to: '/$room/$slug', params: { room: focusRoom, slug: focusSlug } });
    } else {
      void navigate({ to: '/' });
    }
  };
  useReturnGesture(returnHome, !overlayOpen);
  const groundRef = useThresholdReveal<HTMLDivElement>({
    direction: 'down',
    enabled: !overlayOpen,
    onCommit: returnHome,
  });

  return (
    <div className="sky-arrival relative h-dvh w-full overflow-hidden">
      <Constellation
        graph={graph}
        fullViewport
        focusKey={focus}
        hour={hour}
        className="h-full w-full"
      />
      {/* The Outlet renders nested overlay routes (sky.$room.$slug)
          when the URL points at a specific work; otherwise it's
          empty and the constellation alone fills the surface. */}
      <Outlet />
      {/* The ground leaning in from below as the visitor scrolls toward
          leaving — the threshold preview. Purely decorative; the commit
          navigates. */}
      <div ref={groundRef} aria-hidden="true" className="threshold-preview-ground" />
      {/* The return affordance — small, italic, low contrast, fixed at
          the bottom-center of the viewport. The gesture-based returns
          (down arrow, sustained scroll-down past the threshold) are the
          canonical paths; this link is the visible fallback. It returns
          to the piece when the visitor looked up from one, else to the
          Foyer. The aria-label spells out what the small ↓ glyph means. */}
      {focusRoom && focusSlug ? (
        <Link
          to="/$room/$slug"
          params={{ room: focusRoom, slug: focusSlug }}
          aria-label="Return to the work"
          className={RETURN_LINK_CLASS}
          onClick={markDescent}
        >
          ↓ Return to the piece
        </Link>
      ) : (
        <Link
          to="/"
          aria-label="Return to the Foyer"
          className={RETURN_LINK_CLASS}
          onClick={markDescent}
        >
          ↓ Return to the Foyer
        </Link>
      )}
    </div>
  );
}
