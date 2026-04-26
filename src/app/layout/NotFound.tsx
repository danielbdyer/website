import { Link } from '@tanstack/react-router';
import { Ornament } from '@/shared/molecules/Ornament/Ornament';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';

export function NotFound() {
  return (
    <Reveal>
      <div className="py-16">
        <div className="font-heading text-deck font-light italic text-text-2 leading-relaxed">
          <p>This door doesn&rsquo;t open.</p>
          <p>The rest of the house is still here.</p>
        </div>
        <Ornament />
        <Link
          to="/"
          className="inline-block border-b border-transparent text-list italic text-text-2 no-underline transition-colors duration-200 hover:border-text-3 hover:text-text"
        >
          Back home →
        </Link>
      </div>
    </Reveal>
  );
}
