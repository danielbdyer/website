import { lazy, Suspense } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from '@/app/providers';
import { Nav } from '@/app/layout/Nav';
import { Footer } from '@/app/layout/Footer';
import { NotFound } from '@/app/layout/NotFound';
import { JsonLd, personSchema, websiteSchema } from '@/shared/seo';

// Router devtools are only imported in dev — lazy-loaded so the dev bundle
// doesn't block first paint, and so production never ships the code.
const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null;

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <JsonLd data={[websiteSchema(), personSchema()]} />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Nav />
        <main
          id="main-content"
          tabIndex={-1}
          className="max-w-[700px] mx-auto px-6 pt-8 pb-24 min-h-[calc(100vh-200px)] focus:outline-none"
        >
          <Outlet />
        </main>
        <Footer />
      </div>
      <Suspense fallback={null}>
        <RouterDevtools />
      </Suspense>
    </ThemeProvider>
  );
}
