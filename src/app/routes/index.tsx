import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { GeometricFigure } from '@/shared/atoms/GeometricFigure/GeometricFigure';

export const Route = createFileRoute('/')({
  component: FoyerPage,
});

function FoyerPage() {
  return (
    <div className="pt-8">
      <Reveal>
        <div className="flex items-center gap-10 py-10">
          <div className="shrink-0 w-20 h-20">
            <GeometricFigure />
          </div>
          <div className="font-heading text-[1.15rem] font-light italic text-text-2 leading-relaxed">
            <p>The door is open.</p>
            <p>The rooms are waiting.</p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
