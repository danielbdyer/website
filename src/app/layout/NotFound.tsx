import { Link } from '@tanstack/react-router';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

export function NotFound() {
  return (
    <Reveal>
      <div className="py-16">
        <div className="font-heading text-deck text-text-2 leading-relaxed font-light italic">
          <p>This door doesn&rsquo;t open.</p>
          <p>The rest of the house is still here.</p>
        </div>
        <Ornament />
        <Link
          to="/"
          viewTransition={false}
          className="text-list text-text-2 hover:border-text-3 hover:text-text inline-block border-b border-transparent italic no-underline transition-colors duration-200"
        >
          Back home →
        </Link>
      </div>
    </Reveal>
  );
}
