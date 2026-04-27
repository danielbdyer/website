import { createFileRoute } from '@tanstack/react-router';
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
        <div className="font-heading text-deck text-text-2 leading-[1.55] font-light italic">
          <p>The door is open.</p>
          <p>The rooms are waiting.</p>
        </div>
      </div>
    </Reveal>
  );
}
