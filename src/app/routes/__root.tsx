import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { ThemeProvider, useTheme } from '@/app/providers';
import { Diamond } from '@/shared/atoms/Diamond/Diamond';
import { Ornament } from '@/shared/atoms/Ornament/Ornament';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-[700px] mx-auto px-6 pt-8 pb-24 min-h-[calc(100vh-200px)]">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

function Nav() {
  const { dark, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between max-w-[700px] mx-auto px-6 py-5 bg-[var(--bg)] transition-[background] duration-500">
      <Link
        to="/"
        className="flex items-center gap-1.5 font-heading text-base font-medium italic text-[var(--text)] no-underline transition-colors duration-200 hover:text-[var(--accent)] group"
      >
        <Diamond
          size={7}
          className="transition-transform duration-300 group-hover:rotate-45"
        />
        <span>Danny Dyer</span>
      </Link>

      <div className="flex items-center gap-4">
        {ROOMS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="text-[0.8rem] text-[var(--text-2)] no-underline tracking-wide transition-colors duration-200 hover:text-[var(--text)] [&.active]:text-[var(--text)]"
            activeProps={{ className: 'active' }}
          >
            {label}
          </Link>
        ))}

        <button
          onClick={toggle}
          className="bg-transparent border-none text-[var(--text-3)] cursor-pointer p-[5px] flex items-center transition-colors duration-200 rounded hover:text-[var(--text)] hover:bg-[var(--tag-bg)]"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="max-w-[700px] mx-auto px-6 pb-8">
      <Ornament />
      <div className="flex justify-between items-center text-[0.72rem] text-[var(--text-3)]">
        <span>Danny Dyer</span>
        <span>danielbdyer.com</span>
      </div>
    </footer>
  );
}

const ROOMS = [
  { to: '/' as const, label: 'Foyer' },
  { to: '/studio' as const, label: 'Studio' },
  { to: '/garden' as const, label: 'Garden' },
  { to: '/study' as const, label: 'Study' },
  { to: '/salon' as const, label: 'Salon' },
] as const;

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
