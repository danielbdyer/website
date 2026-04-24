# Rendering Strategy

How HTML reaches a visitor's browser is a first-class concern. The choice — single-page app, server-rendered, static-generated, some blend — shapes bundle weight, first-paint, SEO legibility, and what a reader sees before JavaScript arrives. This file names the current model, the nearest pivot, and the fuller horizon, so that each step has a reason and the steps compose.

Rendering lives in the grounds. It is the delivery mechanism for everything the other specs name — the rooms, the works, the voice, the motion. When rendering changes, the site's experience changes before any content does, which is why the strategy is held explicitly rather than derived implicitly from framework defaults.

---

## What the Site Does Today

The site is prerendered to static HTML per route at build time, using TanStack Start. After arrival, it hydrates into a TanStack Router app for client-side navigation.

- **Build:** Vite with the `@tanstack/react-start/plugin/vite` plugin. The plugin subsumes what `@tanstack/router-vite-plugin` used to do (route-tree generation) and adds SSR plus prerender. A single `pnpm build` produces `dist/client/` (the deployable static files) and `dist/server/` (used during prerender, not deployed).
- **Output shape:** `dist/client/index.html` is the prerendered foyer. `dist/client/{room}/index.html` is each room landing. Per-work pages will prerender as `dist/client/{room}/{slug}/index.html` once content exists (crawled via `crawlLinks` from each room landing). A static host serves `dist/client/` as the document root.
- **Entry:** No `index.html` source file and no `src/main.tsx`. Start owns the HTML shell and the client entry. The site defines `src/router.tsx` (a `getRouter()` factory) and a root route (`src/app/routes/__root.tsx`) that emits the full document — `<html>` with `<HeadContent />` in head and `<Scripts />` at the end of body.
- **Head:** Per-route meta, title, and link tags are declared in each route's `head` config. The root route sets charset, viewport, site title, description, favicon, theme-color, and the Google Fonts stylesheet — all of which are now present in every prerendered HTML file.
- **Content:** Markdown is loaded via `import.meta.glob('/src/content/**/*.md', { eager: true, query: '?raw' })` and parsed by `marked` and `gray-matter` in `src/shared/content/loader.ts`. The loader is server-only by convention; the public API (`getAllWorks`, `getWorksByRoom`, `getWork`) lives in `src/shared/content/server-fns.ts` as `createServerFn` wrappers. Start's plugin strips the handler bodies from client chunks, so neither parser ships to the browser. The content barrel (`index.ts`) deliberately does not re-export from `loader.ts` — a re-export is enough to pull the module back into the client chunk.
- **Theme:** `useSyncExternalStore` with `getServerSnapshot()` still handles the React side. The module-level DOM access in `theme-store.ts` is now guarded with `typeof document !== 'undefined'` so the module can be imported during prerender without a `ReferenceError`. The client-side runs the guard body before React hydrates, so the class on `<html>` corrects from the server's light default to the visitor's actual preference with no visible flash.
- **State:** Still no server state, no data fetching, no mutations.

### What the pivot delivered

- **Static HTML per route.** Every known path arrives pre-rendered. Crawlers, link unfurlers, and reduced-JS browsers see the full content before any JavaScript runs.
- **Per-page head content.** `<title>`, `<meta description>`, theme-color, preconnects, and stylesheet links are in the HTML, not injected after hydration.
- **SPA fallback at `dist/index.html`.** Routes not prerendered (not applicable yet but possible for future dynamic paths) can fall back to the shell.

### What the pivot did not (yet) deliver

- **`marked` and `gray-matter` off the client bundle.** The loader was subsequently moved to `createServerFn` wrappers in `src/shared/content/server-fns.ts`; Start's plugin strips the handler bodies from client chunks, and the barrel no longer re-exports from `loader.ts`. The client bundle dropped from ~188KB gzipped to ~118KB gzipped (≈37% reduction) as a result.

---

## The Pivot: What the Migration Did

The SPA became an SSG site that behaves like an SPA after hydration. Nothing about the component architecture, the design system, or the content model changed. Only the delivery mechanism changed.

### Why TanStack Start

The existing stack chose TanStack Router deliberately. TanStack Start is the same team's rendering layer for that router — it adds SSG / SSR / streaming / server functions without asking the app to abandon file-based routing, loaders, type-safe links, or the route-tree generator. Alternatives (Astro, Next.js, Remix, custom prerender) would all have required re-expressing decisions already made. Start was the smallest disturbance that delivered the largest benefit.

### What changed

**Replaced**

- `@tanstack/router-vite-plugin` removed; `@tanstack/react-start/plugin/vite` added. The Start plugin subsumes the route-tree generator — the old plugin is no longer published at Router's current version, which is the upstream signal that the absorption is complete.
- `src/main.tsx` deleted. A new `src/router.tsx` exposes a `getRouter()` factory; Start's default-entry server and client scripts consume it. The type augmentation that used to live in `main.tsx` (`declare module '@tanstack/react-router' { interface Register … }`) now lives next to the factory.
- `src/app/routes/__root.tsx` rewritten. The root component returned a React fragment; under Start it emits a full HTML document — `<html>` with `<HeadContent />` in head and `<Scripts />` at the end of body, with the existing layout (theme, skip-link, nav, main, footer) rendered between.
- `index.html` deleted. Its head tags — charset, viewport, title, description, theme-color (light + dark), favicon, apple-touch-icon, Google Fonts preconnect, and stylesheet — now live in the root route's `head` config and appear on every prerendered page.
- `@tanstack/router-devtools` swapped for `@tanstack/react-router-devtools` (the namespace that pairs with Router 1.168).

**Configured**

- `tanstackStart({ router: { routesDirectory, generatedRouteTree }, pages: [...], prerender: { enabled, crawlLinks, failOnError } })`. Paths in `router` are relative to `srcDirectory` (default `src`) — setting `./src/…` yields `src/src/…`, a subtle trap.
- Prerender enumerates `/`, `/studio`, `/garden`, `/study`, `/salon` statically; `crawlLinks` follows links out of those pages, which will discover per-work paths (`/$room/$slug`) once content exists.
- `@tanstack/react-router` bumped from `^1.168.3` to `^1.168.23` to pair with Start 1.167.x.

**Guarded**

- `src/app/providers/theme-store.ts` had three module-level side effects that accessed `document` or `window` directly (a `applyToDOM(isDark())` call and two `addEventListener` subscribers). The SPA build never ran this module on Node; prerender does. The side effects are now wrapped in a single `if (typeof document !== 'undefined')` block. On the server the theme defaults to light (via `getServerSnapshot()`); on the client the guard body runs before React hydrates and corrects the class before paint — no flash.
- `reportWebVitals()` moved from the old `main.tsx` into `RootComponent`'s sole `useEffect`. The effect is the "subscribe to PerformanceObserver" exception the coding skill names as legitimate.

**Kept as-is**

- All five rooms' route files, the `$room.$slug.tsx` dynamic route, the `WorkView` component, the navigation and footer, the `ThemeProvider`, the `ErrorBoundary`, every feature folder. The architectural grammar of `REACT_NORTH_STAR.md` is preserved.
- The design system, motion vocabulary, tokens, voice.
- The vitest suite — 79 tests still pass against the post-migration code. Prerender adds a Node render path that may eventually want its own tests; the existing ones remain valid.

### Risks still held

- **API churn.** TanStack Start is pre-1.0 in spirit if not in versioning. Plugin signatures, the root-route shape, and the prerender config have all moved during the package's first year. Pin exact minor versions; plan for a refresh at each Router major bump.
- **Hydration mismatches.** Any render path that reads `window`, `document`, or `localStorage` synchronously during render will differ between server and client. The theme-store is the known case and is now guarded; the next time a similar pattern is introduced it needs the same guard.
- **No browser verified this yet.** The migration was executed from a sandbox with no real browser. CI will render the built HTML; a human browser loop — build, serve `dist/client/`, click through the rooms, toggle the theme, watch the reveal animation — should happen before the first content publish, and definitely before first deploy.
- **Dev-server behavior.** `vite dev` under Start behaves differently from `vite dev` under the SPA plugin; devtools, HMR scope, and the lazy router-devtools import may need attention in authoring sessions.

---

## The Fuller Horizon: What Start Unlocks Beyond SSG

The SSG pivot uses the smallest part of Start. These are the capabilities Start carries that the site does not need today but will want to reach for as it grows. Each is a held concern, not a plan. Each names the trigger that would make it real.

### Server functions (`createServerFn`)

Typed, isomorphic RPC endpoints defined alongside the components that call them. `createServerFn({ method: 'POST' }).inputValidator(...).handler(...)`, called from React via `useServerFn`. The route's loader and any component event can invoke them with full type inference.

**What it unlocks**

- **Contact / guestbook / mailing-list surfaces** — if Danny ever opens one. A typed server function with Zod validation replaces the full backend framework that would otherwise be required.
- **Search-as-you-type** across works once the corpus grows. The index stays server-side, the client gets ranked results, no bundle cost.
- **Salon audio metadata.** When media arrives, server functions can read file headers, extract waveform data, or proxy to a CDN without exposing credentials.

**Trigger:** The first interactive surface the site needs that a static build can't serve. Today there is none.

### API routes

Colocated HTTP endpoints (`src/app/routes/api/*.ts`) that respond to fetch requests. Used for webhooks, form submissions from external services, RSS/Atom feed rendering, OG image generation as a service.

**What it unlocks**

- **Dynamic OG images** if the static ones prove insufficient.
- **Webhooks from a publishing workflow.** If Danny's writing tool (Obsidian, a custom editor) ever wants to push content, an API route receives it.
- **Feed formats on demand.** RSS, Atom, JSON-Feed can all be rendered from the Graph at request time rather than at build time, which matters only when the build cadence is too slow for feed consumers.

**Trigger:** When a feature wants a request/response shape that isn't a page.

### Streaming SSR (per-surface)

Not every route needs to be prerendered. Some might stream — render the shell quickly, defer the slow parts. Start supports per-route opt-in.

**What it unlocks**

- **Reading-history surfaces** (if the site ever has them). A dashboard that reads from a KV store renders the shell instantly and streams the data.
- **Live state in the Salon.** "What I'm listening to right now" — if it exists — could stream without blocking the rest of the page.

**Trigger:** When a surface has a slow data dependency and blocking the shell on it is worse than streaming it in.

### Isomorphic loaders

TanStack Router's `loader` already runs isomorphically under Start. A loader that today reads a local file will, under Start, run at build time during prerender and at request time when a route is visited dynamically. Writing the loader once is enough; the runtime chooses where to execute it.

**What it unlocks**

- **A loader that reads a database** without a separate "SSR data" pattern. For this site, the Graph is the database and it is built into the bundle — but if external data ever arrives, the loader is ready.

**Trigger:** When the site has a data source that isn't the repository itself.

### Middleware (`createMiddleware`)

Request-level concerns — logging, auth, rate limiting, cache headers — layered declaratively before or after any route or server function.

**What it unlocks**

- **Request logging in production** without a separate observability layer.
- **Rate limiting** on API routes, when the site has any.
- **Cache-control policy** expressed in code rather than as deploy-time configuration.

**Trigger:** The first non-trivial operational concern that wants request-level visibility.

### Global Start configuration (`createStart`)

A `src/start.ts` where global middleware, default response headers, and framework-level toggles live. Analogous to the root route but for server concerns rather than render concerns.

**Trigger:** When more than one cross-cutting server concern exists and naming them together clarifies more than repeating them everywhere.

---

## What's Held Deliberately

- **React Server Components.** Start supports RSC; this site doesn't need it. RSC earns its keep when component-level data fetching benefits from the server/client split. A content site whose data is a folder of markdown files does not benefit.
- **A Node server in production.** The SSG output is static files. Serving them needs no runtime — a CDN, GitHub Pages, or any static host works. A Node server becomes relevant only if API routes, middleware, or streaming SSR are adopted. `DEPLOYMENT.md` will decide this when it exists.
- **Client-side data fetching.** The site has no client-side data fetching today and doesn't need TanStack Query. If it ever does, Query is already in the stack table of `REACT_NORTH_STAR.md` as the "Yes" choice; adopting it is straightforward.

---

## Dependencies

**This spec depends on:** `REACT_NORTH_STAR.md` (the architectural grammar that survives the pivot), `PERFORMANCE_BUDGET.md` (the targets the pivot serves), `CONTENT_SCHEMA.md` (what gets prerendered).

**This spec is depended on by:** `DEPLOYMENT.md` (gap; the host choice follows from whether the build is static or mixed), `SEO_AND_META.md` (per-page meta becomes natural once rendering is server-side at build time), `SECURITY.md` (gap; the runtime surface differs between pure-static and mixed).

**Concerns this spec touches without owning:**

- Bundle size targets live in `PERFORMANCE_BUDGET.md`.
- Accessibility of prerendered output — no different in principle from SPA output, but the post-hydration behavior must preserve `:focus-visible`, skip-link, and landmark roles; see `ACCESSIBILITY.md`.
- The build pipeline that produces `dist/` lives under the grounds with this file.

---

## How this spec evolves

"What the Site Does Today" is the running description of the rendering model as it stands. "The Pivot" is archaeology — the record of what changed and why. "The Fuller Horizon" grows and shrinks as items move from held → adopted → written into their own specs. When the next rendering pivot happens (and it will, eventually), "The Pivot" will become a numbered archaeology section and a new one will take its place.

The practice: if a change in rendering strategy is contemplated, this spec is the place to name the reason before the code changes. The commit that lands the change updates this file in the same commit.
