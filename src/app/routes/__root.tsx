import type { ReactNode } from 'react';
import { lazy, Suspense, useEffect, useRef } from 'react';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router';
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
      // theme-color tags are emitted directly in <RootDocument> so that
      // both light and dark variants survive — TanStack Router's
      // useTags() dedupes meta entries by `name`/`property` and would
      // keep only one of them.
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
  const mainRef = useRef<HTMLElement>(null);
  // Now that nav happens client-side, the browser doesn't reset focus
  // between routes. Without this, screen-reader users stay anchored on
  // the last-clicked link in the persistent nav while the page content
  // changes underneath them. Focusing <main> on each pathname change
  // restores the orienting jump that a full document load gave for free.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [pathname]);

  // web-vitals subscribes to PerformanceObserver; legitimate effect per the
  // coding skill's decision table. Runs once after hydration on the client
  // (useEffect is skipped during SSR prerender), never during server render.
  useEffect(() => {
    reportWebVitals();
  }, []);
  return (
    <RootDocument>
      <ThemeProvider>
        <div className="relative z-10 flex min-h-dvh flex-col">
          <JsonLd data={[websiteSchema(), personSchema()]} />
          <a
            href="#main-content"
            className="font-body absolute top-0 left-0 z-[100] -translate-y-[200%] rounded-[3px] border border-border bg-bg-card px-3 py-2 text-[0.9rem] text-text no-underline transition-transform duration-200 focus:translate-x-2 focus:translate-y-2"
          >
            Skip to main content
          </a>
          <Nav />
          <main
            ref={mainRef}
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-[700px] flex-1 px-5 pt-6 pb-20 focus:outline-none sm:px-6 sm:pt-8 sm:pb-24"
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

// Synchronous, pre-paint theme application. Module scripts hydrate after
// first paint, so without this the prerendered HTML always renders with
// the `:root` (light) defaults until React mounts — a visible flash for
// every dark-mode visitor and on every full document load. This script
// runs during head parsing, before the body's CSS resolves, so the
// correct class is on <html> at first paint.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.add(d?'dk':'lt')}catch(e){document.documentElement.classList.add('lt')}})()`;

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <meta name="theme-color" content="#f5f1eb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#191715" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
