import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

export const Route = createFileRoute('/study')({
  component: StudyPage,
});

function StudyPage() {
  return (
    <Reveal>
      <h1 className="font-heading text-[1.65rem] font-normal tracking-tight mb-7">
        The Study
      </h1>
      <p className="text-[0.9rem] text-[var(--text-2)] italic leading-relaxed">
        Personal essays and philosophy. The quiet room with good light.
      </p>
    </Reveal>
  );
}
