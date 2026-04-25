import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { GeometricFigure } from '@/shared/atoms/GeometricFigure/GeometricFigure';

export const Route = createFileRoute('/')({
  component: FoyerPage,
});

function FoyerPage() {
  return (
    <Reveal>
      <div className="foyer">
        <div className="foyer-figure">
          <GeometricFigure />
        </div>
        <div className="foyer-text">
          <p>The door is open.</p>
          <p>The rooms are waiting.</p>
        </div>
      </div>
    </Reveal>
  );
}
