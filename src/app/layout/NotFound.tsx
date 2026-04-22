import { Link } from '@tanstack/react-router';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

export function NotFound() {
  return (
    <Reveal>
      <div className="py-16">
        <div className="font-heading text-[1.15rem] font-light italic text-[var(--text-2)] leading-relaxed">
          <p>This door doesn't open.</p>
          <p>The rest of the house is still here.</p>
        </div>
        <Ornament />
        <Link
          to="/"
          className="text-[0.9rem] text-[var(--text-2)] italic no-underline transition-colors duration-200 hover:text-[var(--accent)]"
        >
          Back home →
        </Link>
      </div>
    </Reveal>
  );
}
