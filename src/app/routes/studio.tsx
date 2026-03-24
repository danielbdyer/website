import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

export const Route = createFileRoute('/studio')({
  component: StudioPage,
});

function StudioPage() {
  return (
    <Reveal>
      <h1 className="font-heading text-[1.65rem] font-normal tracking-tight mb-7">
        The Studio
      </h1>
      <p className="text-[0.9rem] text-[var(--text-2)] italic leading-relaxed">
        Professional and technical work. Craft-as-devotion rendered in a way
        that's professionally legible but not corporate.
      </p>
    </Reveal>
  );
}
