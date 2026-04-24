import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

export const Route = createFileRoute('/garden')({
  head: () => ({
    meta: [
      { title: 'The Garden — Danny Dyer' },
      { name: 'description', content: 'Poetry by Danny Dyer.' },
    ],
  }),
  component: GardenPage,
});

function GardenPage() {
  return (
    <Reveal>
      <h1 className="font-heading text-[1.65rem] font-normal tracking-tight mb-7">The Garden</h1>
      <p className="text-[0.9rem] text-text-3 italic leading-relaxed">
        [Poetry. Living, growing, seasonal. Work that breathes.]
      </p>
    </Reveal>
  );
}
