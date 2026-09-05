import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { GeometricFigure } from '@/shared/atoms/GeometricFigure/GeometricFigure';
import { useThresholdReveal } from '@/shared/hooks/useThresholdReveal';
import { warmDaystarMagic } from '@/shared/hooks/useDaystarMagic';
import { useSkyReadiness } from '@/shared/hooks/useSkyReadiness';
import { warmAtmosphere } from '@/shared/webgl/warmAtmosphere';

export const Route = createFileRoute('/')({
  component: FoyerPage,
});

// The boundary for looking up: the visitor is at the page's top.
const atPageTop = () => globalThis.scrollY <= 1;

// The ascent's choreography lives in CSS on html.ascending (tokens.css
// §"The ascent"): the room drops away and tilts as the sky comes down
// to meet the gaze. The class opens with the look-up and closes after
// the transition has played.
const ASCENT_MS = 1400;
let ascentTimer: ReturnType<typeof setTimeout> | null = null;
function markAscent(): void {
  const root = document.documentElement;
  root.classList.add('ascending');
  if (ascentTimer !== null) clearTimeout(ascentTimer);
  ascentTimer = setTimeout(() => {
    root.classList.remove('ascending');
    ascentTimer = null;
  }, ASCENT_MS);
}

/** The sky's lazy layers, fetched as the visitor reaches for it. */
function warmSky(): void {
  warmAtmosphere();
  warmDaystarMagic();
}

function FoyerPage() {
  const navigate = useNavigate();
  // The held reveal gesture: scrolling up against the Foyer's top
  // tilts the room away beneath the gaze, spring-held, the heavens
  // already behind it; past the threshold the look-up commits and the
  // lift carries the rest of the way. Release early and the room
  // settles back. CONSTELLATION.md §"The Reveal Mechanism", §"The Sun
  // and the Moon" (*The lift*).
  // The sky's atmosphere is warmed as the visitor reaches for it — the
  // first input of a pull, or the pointer resting on the link — so a
  // committed look-up arrives already lit, in one substrate, rather
  // than the chart first and the weather a breath later.
  // The pull writes --reveal on the root; the backdrop it reveals
  // lives in the root layout, under the room, so no preview element
  // is needed here.
  useThresholdReveal<HTMLDivElement>({
    direction: 'up',
    atBoundary: atPageTop,
    withTouch: true,
    onGather: warmSky,
    onCommit: () => {
      markAscent();
      void navigate({ to: '/sky' });
    },
  });
  // The sky is readied while the Foyer rests — its route, its graph,
  // its atmosphere's context and programs, its magic — so the look-up
  // finds everything already there and nothing mounts under the eye
  // (hooks/useSkyReadiness.ts).
  useSkyReadiness();
  return (
    <>
      <Reveal>
        <div className="flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:gap-10 sm:py-14">
          <div className="h-24 w-24 shrink-0 sm:h-[110px] sm:w-[110px]">
            <GeometricFigure />
          </div>
          <div className="font-heading text-deck text-text-2 leading-[1.55] font-light italic">
            <p>The door is open.</p>
            <p>The rooms are waiting.</p>
          </div>
        </div>
        {/* The first form of the look-up affordance. The held scroll-up
          gesture and the theme toggle's ascent into the sky live in
          CONSTELLATION.md; until they pull, this small italic line is
          the door from the Foyer to the firmament above it. */}
        <p className="max-w-deck font-body text-list leading-body text-text-3 mt-4 italic">
          <Link
            to="/sky"
            className="hover:text-text-2 no-underline transition-colors duration-200"
            onPointerEnter={warmSky}
            onFocus={warmSky}
            onClick={markAscent}
          >
            ↑ Look up
          </Link>
        </p>
      </Reveal>
    </>
  );
}
