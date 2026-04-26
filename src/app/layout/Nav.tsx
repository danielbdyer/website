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
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-bg/95 leading-tight backdrop-blur-sm transition-[background] duration-500 supports-[backdrop-filter]:bg-bg/88">
      <div className="mx-auto flex w-full max-w-column flex-wrap items-center gap-3 py-4 pl-edge pr-edge sm:flex-nowrap sm:py-5 sm:pl-edge-md sm:pr-edge-md">
        <Link
          to="/"
          viewTransition={false}
          className="order-1 group inline-flex min-h-touch items-center gap-1.5 font-heading text-base font-medium italic text-text no-underline transition-colors duration-200 hover:text-accent"
        >
          <Diamond size={7} className="transition-transform duration-300 group-hover:rotate-45" />
          <span>Danny Dyer</span>
        </Link>

        <div className="order-3 flex basis-full flex-wrap items-center gap-x-4 gap-y-2 sm:order-2 sm:basis-auto sm:flex-1 sm:justify-end">
          {ROOMS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              viewTransition={false}
              className="flex min-h-touch items-center text-nav tracking-nav text-text-2 no-underline transition-colors duration-200 hover:text-text [&.active]:text-text"
              activeProps={{ className: 'active' }}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="order-2 ml-auto sm:order-3 sm:ml-0">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
