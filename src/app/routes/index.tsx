import { createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

export const Route = createFileRoute('/')({
  component: FoyerPage,
});

function FoyerPage() {
  return (
    <div className="pt-8">
      <Reveal>
        <div className="flex items-center gap-10 py-10">
          <div className="shrink-0 w-20 h-20">
            <svg viewBox="0 0 120 120" className="w-full h-full animate-[geo-spin_60s_linear_infinite]">
              <rect x="10" y="10" width="100" height="100" rx="2" fill="none" strokeWidth="0.5" stroke="var(--geo-color)" />
              <rect x="25" y="25" width="70" height="70" rx="1" fill="none" strokeWidth="0.3" stroke="var(--geo-color)" />
              <line x1="10" y1="10" x2="25" y2="25" strokeWidth="0.3" stroke="var(--geo-color)" />
              <line x1="110" y1="10" x2="95" y2="25" strokeWidth="0.3" stroke="var(--geo-color)" />
              <line x1="10" y1="110" x2="25" y2="95" strokeWidth="0.3" stroke="var(--geo-color)" />
              <line x1="110" y1="110" x2="95" y2="95" strokeWidth="0.3" stroke="var(--geo-color)" />
              <circle cx="60" cy="60" r="20" fill="none" strokeWidth="0.3" stroke="var(--geo-accent)" />
            </svg>
          </div>
          <div className="font-heading text-[1.15rem] font-light italic text-[var(--text-2)] leading-relaxed">
            <p>The door is open.</p>
            <p>The rooms are waiting.</p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
