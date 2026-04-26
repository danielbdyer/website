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
- **Content:** Markdown is loaded via `import.meta.glob('/src/content/**/*.md', { eager: true, query: '?raw' })` and parsed by `marked` and `gray-matter` in `src/shared/content/loader.ts` at module init. The public API in `src/shared/content/index.ts` exposes async wrappers — `getAllWorks`, `getWorksByRoom`, `getWork`, `getDisplayWorksByRoom`, `getDisplayWork` — each returning a Promise even though today's implementation resolves synchronously. Route loaders `await` them. Both parsers ship in the client chunk (≈30KB gzipped); see "SSG Stance and the Isomorphic Data Contract" below for why that's the right trade today and where the seam is for changing it. The barrel deliberately does not re-export `parseWork` — tests import it from `./loader` directly.
- **Theme:** `useSyncExternalStore` with `getServerSnapshot()` still handles the React side. The module-level DOM access in `theme-store.ts` is now guarded with `typeof document !== 'undefined'` so the module can be imported during prerender without a `ReferenceError`. The client-side runs the guard body before React hydrates, so the class on `<html>` corrects from the server's light default to the visitor's actual preference with no visible flash.
- **State:** Still no server state, no data fetching, no mutations.

### What the pivot delivered

- **Static HTML per route.** Every known path arrives pre-rendered. Crawlers, link unfurlers, and reduced-JS browsers see the full content before any JavaScript runs.
- **Per-page head content.** `<title>`, `<meta description>`, theme-color, preconnects, and stylesheet links are in the HTML, not injected after hydration.
- **SPA fallback at `dist/index.html`.** Routes not prerendered (not applicable yet but possible for future dynamic paths) can fall back to the shell.

### What the pivot did not (yet) deliver

- **`marked` and `gray-matter` off the client bundle.** A subsequent experiment moved the loader behind `createServerFn` wrappers, and the client bundle dropped from ~188KB gzipped to ~118KB gzipped. The wrappers were removed when client-side navigation re-exposed their cost (see the SSG Stance below); the parsers ship to the browser again. Bringing them back off without breaking client-side nav is a held concern — the seam in `index.ts` makes the change contained when it lands.

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

Typed RPC endpoints defined alongside the components that call them. `createServerFn({ method: 'POST' }).inputValidator(...).handler(...)`, called from React via `useServerFn`. The handler runs in-process during prerender / SSR, and as an HTTP fetch from the client.

**Important boundary** (see "SSG Stance and the Isomorphic Data Contract" above): server functions are appropriate for work that *must* run with a runtime — mutations, secret-bearing operations, request-context access. They are **not** appropriate for static content reads in this site's deploy model: the client-side stub is an HTTP fetch, and a static-only deploy has no handler to receive it. Adding the first server function therefore also adds the first runtime in front of it, scoped to that one URL.

**What it unlocks**

- **Contact / guestbook / mailing-list surfaces** — if Danny ever opens one. A typed server function with Zod validation replaces the full backend framework that would otherwise be required.
- **Search-as-you-type** across works once the corpus grows. The index stays server-side, the client gets ranked results, no bundle cost.
- **Salon audio metadata.** When media arrives, server functions can read file headers, extract waveform data, or proxy to a CDN without exposing credentials.

**Trigger:** The first surface the site needs that a static build truly cannot serve, paired with the willingness to provision a runtime for it. Today there is none.

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

## SSG Stance and the Isomorphic Data Contract

The site is **pure SSG with no production server runtime.** The Cloudflare Workers deploy serves `dist/client/` as static assets; there is no Worker handler, no Node process, no edge function in the request path. Every URL the site can serve is enumerable at build time, every byte the site needs is in the build output, and the runtime cost of a page view is a CDN fetch and the browser's parse-and-paint.

This is the right stance because nothing the site does today is dynamic at request time. Markdown is git-tracked. Theme is `localStorage`. Web Vitals are RUM. There are no accounts, no comments, no per-visitor data. Every dynamic capability the framework offers — server functions, API routes, streaming SSR, middleware — is for problems this site does not have. Adopting any of them prematurely adds: cold starts, deploy complexity, an attack surface, a billing surface, and a class of bugs where the same code behaves differently in build, dev, and prod (the `createServerFn` archaeology below is exactly this).

### The createServerFn archaeology

For a stretch of the project, the content loader was wrapped in `createServerFn` to keep `marked` and `gray-matter` out of the client chunk — a real ≈70KB gzipped saving. The wrappers worked during prerender (the handler ran in-process) and at the initial visit (the data was streamed into the SSR matches cache). They broke the moment a visitor navigated client-side: the wrapper's client stub fetches the handler over HTTP, and there is no HTTP handler to receive it. Every navigation lit up the `ErrorBoundary`. The site only appeared to work because every `<Link>` carried `reloadDocument`, forcing a full document load that bypassed the broken stub.

The lesson is not "server functions are bad." The lesson is **`createServerFn` is for code that must run on the server.** Static content reads must not. When there is no server in production, anything that pretends there is one becomes a runtime trapdoor. Use server functions only for the work named in "The Fuller Horizon" below — mutations, secrets, cross-request side effects — and only when a server actually exists at request time.

### The isomorphic data contract

All content reads on the site are exposed through `src/shared/content/index.ts` with **async signatures**, even though today's implementation resolves synchronously. The barrel's contract is:

```ts
export async function getDisplayWorksByRoom(room: Room): Promise<DisplayWork[]>;
export async function getDisplayWork(room: Room, slug: string): Promise<DisplayWork | undefined>;
// (and the rest)
```

The internal `display.ts` and `loader.ts` modules expose `*Sync` variants that the barrel wraps. The split is deliberate: **the public boundary holds the architectural seam**, and the internal modules implement whatever is fastest today. This means a future migration — to JSON manifests fetched from `/data/{room}.json`, to a selectively hybrid setup where one route reads from a CMS at request time, to anything that earns its complexity — does not change a single route file. Routes already `await`.

**The rule, for any agent or contributor authoring data-layer code:**

- Public content APIs in the barrel are async. Always.
- Never expose a sync content function on the barrel, even if it would technically work today. The async signature is the seam.
- Never reach for `createServerFn` for static content reads. If a future feature needs `createServerFn` (a contact form, an OG-image endpoint), introduce it for *that feature only*, behind its own URL, and accept the dependency on a runtime in front of that one path.
- The deploy target (Workers static-assets, today) reflects the SSG stance. Changing the stance is a spec change first, a code change second.

### When this stance flips

Two conditions would push the site toward hybrid:

1. **Content that changes between deploys.** A CMS, a draft preview that doesn't want a rebuild, a third-party feed embedded as part of the page. Today, content moves through git, so this isn't real.
2. **Per-visitor or per-request behavior in the page.** Auth, personalized rooms, comments. Today, every visitor reads the same site.

When one of these arrives, the migration path is well-defined: keep most routes static, lift the dynamic ones into `loader`s that genuinely run at request time, and provision a Worker (or other runtime) that can host them. The async data contract makes that lift mechanical at the route layer; the work is in the runtime, not the shape.

---

## What's Held Deliberately

- **React Server Components.** Start supports RSC; this site doesn't need it. RSC earns its keep when component-level data fetching benefits from the server/client split. A content site whose data is a folder of markdown files does not benefit.
- **A Node server in production.** The SSG output is static files. Serving them needs no runtime — a CDN, GitHub Pages, or Cloudflare's static-assets binding works. A Node server becomes relevant only if API routes, middleware, or streaming SSR are adopted. See "When this stance flips" above.
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
