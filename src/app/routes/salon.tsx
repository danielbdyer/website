import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

export const Route = createFileRoute('/salon')({
  component: SalonPage,
});

function SalonPage() {
  return (
    <Reveal>
      <h1 className="font-heading text-[1.65rem] font-normal tracking-tight mb-7">The Salon</h1>
      <p className="text-[0.9rem] text-text-3 italic leading-relaxed">
        [Music, aesthetics, art. Where beauty circulates between people. The cellist's son's room.]
      </p>
    </Reveal>
  );
}
