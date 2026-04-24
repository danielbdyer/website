import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

export const Route = createFileRoute('/study')({
  head: () => ({
    meta: [
      { title: 'The Study — Danny Dyer' },
      { name: 'description', content: 'Essays and notes by Danny Dyer.' },
    ],
  }),
  component: StudyPage,
});

function StudyPage() {
  return (
    <Reveal>
      <h1 className="font-heading text-[1.65rem] font-normal tracking-tight mb-7">The Study</h1>
      <p className="text-[0.9rem] text-text-3 italic leading-relaxed">
        [Personal essays and philosophy. The quiet room with good light.]
      </p>
    </Reveal>
  );
}
