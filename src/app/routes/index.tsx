import { useLayoutEffect } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { GeometricFigure } from '@/shared/atoms/GeometricFigure/GeometricFigure';
import { useThresholdReveal } from '@/shared/hooks/useThresholdReveal';
import { warmDaystarMagic } from '@/shared/hooks/useDaystarMagic';
import { useSkyReadiness } from '@/shared/hooks/useSkyReadiness';
import { warmAtmosphere } from '@/shared/webgl/warmAtmosphere';
import {
  LIFT,
  LIFT_MS,
  SETTLE_MS,
  SIGNATURE_EASE,
  pitchBackdrop,
  readReveal,
  tween,
} from '@/shared/dom/lookUp';

export const Route = createFileRoute('/')({
  component: FoyerPage,
});

// The boundary for looking up: the visitor is at the page's top.
const atPageTop = () => globalThis.scrollY <= 1;

// The lift is the pull continued. One number, --reveal on the root,
// drives everything (tokens.css §"The look-up"): 0 → 1 is the pull,
// hand-driven and spring-held; 1 → LIFT is the commit, carried on the
// signature curve frame by frame (dom/lookUp.ts), and with each frame
// the heavens behind the room turn by the same pitch — so the room
// keeps falling away beneath the eye, live, its depth its own, while
// the sky above it is the sky the eye is turning into. The route
// changes only once the lift has landed: the room is below the frame
// by then, the heavens stand at the sky's rest, and the view
// transition has nothing to cross but itself. html.ascending marks
// the whole arc and closes once it has played. Reduced motion never
// lifts: the look-up simply goes.
const ASCENT_MS = LIFT_MS + 800;
let ascentTimer: ReturnType<typeof setTimeout> | null = null;
let liftCancel: (() => void) | null = null;

function reducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** One turn of the eye: the room's --reveal and the heavens' pitch,
 *  written together. */
function turn(root: HTMLElement, reveal: number): void {
  root.style.setProperty('--reveal', reveal.toFixed(4));
  pitchBackdrop(reveal);
}

function lift(go: () => void): void {
  if (reducedMotion()) {
    go();
    return;
  }
  if (liftCancel !== null) return;
  const root = document.documentElement;
  root.classList.add('ascending', 'pulling');
  liftCancel = tween(
    readReveal(),
    LIFT,
    LIFT_MS,
    SIGNATURE_EASE,
    (reveal) => turn(root, reveal),
    () => {
      liftCancel = null;
      go();
    },
  );
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

/** Arriving from the sky (html.descending), the room settles back in
 *  beneath the gaze: it starts where the lift left it and turns back
 *  to rest over the same arc — the live room with its depth, not an
 *  image of it. Before the first paint, so there is no flat frame. */
function useSettleIn(): void {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('descending') || reducedMotion()) return;
    root.classList.add('pulling');
    turn(root, LIFT);
    const cancel = tween(
      LIFT,
      0,
      SETTLE_MS,
      SIGNATURE_EASE,
      (reveal) => turn(root, reveal),
      () => root.classList.remove('pulling'),
    );
    return () => {
      cancel();
      root.classList.remove('pulling');
      root.style.setProperty('--reveal', '0');
    };
  }, []);
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
    onReveal: pitchBackdrop,
    onCommit: () => {
      lift(() => void navigate({ to: '/sky' }));
    },
  });
  useSettleIn();
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
            onClick={(event) => {
              // The link lifts first and goes partway through the lift,
              // the same way the pull does.
              event.preventDefault();
              lift(() => void navigate({ to: '/sky' }));
            }}
          >
            ↑ Look up
          </Link>
        </p>
      </Reveal>
    </>
  );
}
