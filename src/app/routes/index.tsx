import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { GeometricFigure } from '@/shared/atoms/GeometricFigure/GeometricFigure';
import { useThresholdReveal } from '@/shared/hooks/useThresholdReveal';

export const Route = createFileRoute('/')({
  component: FoyerPage,
});

// The boundary for looking up: the visitor is at the page's top.
const atPageTop = () => globalThis.scrollY <= 1;

function FoyerPage() {
  const navigate = useNavigate();
  // The held reveal gesture, first form: scrolling up against the
  // Foyer's top leans the firmament in from above, spring-held;
  // past the threshold the look-up commits and the sky unfurls the
  // rest of the way. Release early and the ceiling breathes back.
  // CONSTELLATION.md §"The Reveal Mechanism".
  const curtainRef = useThresholdReveal<HTMLDivElement>({
    direction: 'up',
    atBoundary: atPageTop,
    withTouch: true,
    onCommit: () => {
      void navigate({ to: '/sky' });
    },
  });
  return (
    <>
      {/* The firmament leaning in — the threshold preview above the
          page's ceiling. Fixed-positioned, so it lives outside the
          Reveal molecule (whose entry transform would otherwise
          become its containing block and trap it in the column).
          Decorative; the commit navigates. */}
      <div ref={curtainRef} aria-hidden="true" className="threshold-preview-sky" />
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
            viewTransition={false}
          >
            ↑ Look up
          </Link>
        </p>
      </Reveal>
    </>
  );
}
