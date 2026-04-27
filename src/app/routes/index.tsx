import { Link, createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { GeometricFigure } from '@/shared/atoms/GeometricFigure/GeometricFigure';

export const Route = createFileRoute('/')({
  component: FoyerPage,
});

function FoyerPage() {
  return (
    <Reveal>
      <div className="flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:gap-10 sm:py-14">
        <div className="h-24 w-24 shrink-0 sm:h-[110px] sm:w-[110px]">
          <GeometricFigure />
        </div>
        <div className="font-heading text-deck leading-[1.55] font-light italic text-text-2">
          <p>The door is open.</p>
          <p>The rooms are waiting.</p>
        </div>
      </div>
      {/* The first form of the look-up affordance. The held scroll-up
          gesture and the theme toggle's ascent into the sky live in
          CONSTELLATION.md; until they pull, this small italic line is
          the door from the Foyer to the firmament above it. */}
      <p className="mt-4 max-w-deck font-body text-list leading-body italic text-text-3">
        <Link
          to="/sky"
          className="no-underline transition-colors duration-200 hover:text-text-2"
          viewTransition={false}
        >
          ↑ Look up
        </Link>
      </p>
    </Reveal>
  );
}
