import type { ReactNode } from 'react';
import { lazy, Suspense, useEffect } from 'react';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { ThemeProvider } from '@/app/providers';
import { ErrorBoundary } from '@/app/layout/ErrorBoundary';
import { Nav } from '@/app/layout/Nav';
import { Footer } from '@/app/layout/Footer';
import { NotFound } from '@/app/layout/NotFound';
import { JsonLd, personSchema, websiteSchema } from '@/shared/seo';
import { reportWebVitals } from '@/shared/seo/web-vitals';
import '@/styles/tokens.css';

// Router devtools are only imported in dev — lazy-loaded so the dev bundle
// doesn't block first paint, and so production never ships the code.
const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null;

const DESCRIPTION =
  "Danny Dyer — essays, poetry, case studies, and notes from an engineering leader, poet, and cellist's son.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { title: 'Danny Dyer' },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#f5f1eb', media: '(prefers-color-scheme: light)' },
      { name: 'theme-color', content: '#191715', media: '(prefers-color-scheme: dark)' },
    ],
    // Fonts are self-hosted via @fontsource-variable; imported in
    // src/styles/tokens.css. No Google Fonts preconnect or stylesheet.
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.svg' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  // web-vitals subscribes to PerformanceObserver; legitimate effect per the
  // coding skill's decision table. Runs once after hydration on the client
  // (useEffect is skipped during SSR prerender), never during server render.
  useEffect(() => {
    reportWebVitals();
  }, []);
  return (
    <RootDocument>
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
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
        <Suspense fallback={null}>
          <RouterDevtools />
        </Suspense>
      </ThemeProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
