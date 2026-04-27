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
    <nav className="border-border/70 bg-bg/95 supports-[backdrop-filter]:bg-bg/88 sticky top-0 z-50 border-b leading-tight backdrop-blur-sm transition-[background] duration-500">
      <div className="max-w-column pl-edge pr-edge sm:pl-edge-md sm:pr-edge-md mx-auto flex w-full flex-wrap items-center gap-3 py-4 sm:flex-nowrap sm:py-5">
        <Link
          to="/"
          viewTransition={false}
          className="group min-h-touch font-heading text-text hover:text-accent order-1 inline-flex items-center gap-1.5 text-base font-medium italic no-underline transition-colors duration-200"
        >
          <Diamond size={7} className="transition-transform duration-300 group-hover:rotate-45" />
          <span>Danny Dyer</span>
        </Link>

        <div className="order-3 flex basis-full flex-wrap items-center gap-x-4 gap-y-2 sm:order-2 sm:flex-1 sm:basis-auto sm:justify-end">
          {ROOMS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              viewTransition={false}
              className="min-h-touch text-nav tracking-nav text-text-2 hover:text-text [&.active]:text-text flex items-center no-underline transition-colors duration-200"
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
