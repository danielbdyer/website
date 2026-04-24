import { Link } from '@tanstack/react-router';
import { Diamond } from '@/shared/atoms/Diamond/Diamond';
import { ThemeToggle } from '@/app/layout/ThemeToggle';

const ROOMS = [
  { to: '/studio' as const, label: 'Studio' },
  { to: '/garden' as const, label: 'Garden' },
  { to: '/study' as const, label: 'Study' },
  { to: '/salon' as const, label: 'Salon' },
] as const;

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between max-w-[700px] mx-auto px-6 py-5 bg-bg transition-[background] duration-500">
      <Link
        to="/"
        className="flex items-center gap-1.5 font-heading text-base font-medium italic text-text no-underline transition-colors duration-200 hover:text-accent group"
      >
        <Diamond size={7} className="transition-transform duration-300 group-hover:rotate-45" />
        <span>Danny Dyer</span>
      </Link>

      <div className="flex items-center gap-4">
        {ROOMS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="text-[0.8rem] text-text-2 no-underline tracking-wide transition-colors duration-200 hover:text-text [&.active]:text-text"
            activeProps={{ className: 'active' }}
          >
            {label}
          </Link>
        ))}
        <ThemeToggle />
      </div>
    </nav>
  );
}
