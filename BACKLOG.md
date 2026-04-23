# Backlog

Held concerns — work that has been named, understood, and deliberately deferred. Not a kanban. Not a roadmap. A list of things the site knows it owes itself, with the reason each is waiting.

The practice: every backlog item has a *trigger* — the condition under which it should be taken up. Items without triggers tend to stay on the list forever. Items with triggers surface themselves when their moment arrives.

When a backlog item is taken up, it is removed from this file. Git history preserves the record.

---

## Accessibility

### Skip-to-main-content link
**State:** Implemented as of the accessibility pass. Present in `__root.tsx`.

### Custom `:focus-visible` ring
**State:** Implemented as of the accessibility pass. Defined in `tokens.css`.

### Focus management on route transitions
**Why:** When a visitor clicks a nav link, focus should move to the new page's main content heading rather than remaining on the clicked link. Screen-reader and keyboard users currently have to re-traverse the nav on every navigation.
**Trigger:** When work pages exist and a visitor's path across the site is long enough for this to matter, or sooner if a user reports it.
**Note:** Likely a small `useRouterState` effect in `RootLayout` that focuses `#main-content` on path changes that are not the initial load.

### `prefers-contrast: more` handling
**Why:** `ACCESSIBILITY.md` commits to honoring this preference. Border and text tones should strengthen toward `--text` and solid borders when requested.
**Trigger:** When the design system's secondary tones stabilize enough that high-contrast variants are meaningful to define.

### Automated color contrast checks
**Why:** Ensure that token combinations never regress below AA for body text.
**Trigger:** When design tokens change often enough that manual verification stops being reliable.

### `axe-core` integration in tests
**State:** Implemented as of the canary-baseline pass. `jest-axe` is wired into vitest via `src/test/axe.ts`; NotFound and WorkView tests assert zero violations. `color-contrast` and `region` checks are disabled in the vitest suite because they need a real browser — those are covered by Lighthouse CI against the built site.

### Expand axe coverage to more components
**Why:** Today, axe runs on NotFound, WorkView, Nav, and Footer. ThemeToggle and the Foyer page still have no a11y assertion.
**Trigger:** When any of those components gain interactive complexity, or when a regression is caught in Lighthouse but not in component tests.

---

## Performance

### SSG pivot to TanStack Start
**Why:** The site is static content with a tiny interactive surface. Current SPA delivers HTML only after React hydrates, which costs first-paint, SEO legibility, and requires shipping `marked` + `gray-matter` to the client (~310KB added to the bundle). A build-time prerender would render every route to static HTML, move markdown parsing off the client, and preserve interactivity via hydration where needed.
**Why TanStack Start and not Astro:** We've invested in TanStack Router, the house URL grammar, and the React component architecture. Start is from the TanStack team, uses Router underneath, and adds SSG/SSR without abandoning the existing mental model. Astro would be faster-at-launch but a bigger rewrite. Start is the cleanest pivot.
**Trigger:** Before Danny writes the third work. A pivot is cheaper with no content; it gets harder as content accumulates. Also: when bundle size, SEO, or first-paint becomes actually painful in use.
**Scope:** Convert the Vite+Router setup to Vite+Start, enable SSG prerendering for all routes, move markdown parsing to build-time, verify all existing tests still pass.

### Build-time markdown parsing (if SSG pivot is deferred)
**Why:** Even without a full framework pivot, `marked` and `gray-matter` could be moved off the client bundle via a custom Vite plugin that transforms content files into pre-rendered HTML at build time. A lighter alternative to the Start pivot.
**Trigger:** If the SSG pivot is delayed beyond the third-work threshold.

### Route-level code splitting
**Why:** Every route currently loads in the initial bundle. A visitor arriving at `/garden` downloads the code for `/salon` too.
**Trigger:** When the bundle has enough per-route weight to justify the cost of lazy loading (new components, per-route data, etc.). Today, each route is <50 lines; splitting is not worth it.

### Image optimization pipeline
**Why:** When images arrive (in works and possibly the Salon), they need responsive sources, modern formats (AVIF, WebP), and lazy loading. None of this exists yet.
**Trigger:** The first image in any work. Owned by `MEDIA_STRATEGY.md` when that file is written.

### Font subsetting / self-hosting
**Why:** Literata and Newsreader are currently loaded from Google Fonts, which is a third-party dependency and a non-trivial latency hit. Self-hosting with subsetting (only the glyphs used) reduces weight and eliminates the third-party call.
**Trigger:** When page weight or privacy posture matters more than the convenience of Google Fonts.

### Minimum 44×44px touch targets
**Why:** The theme toggle button is ~34×34 effective, below the WCAG AAA touch-target recommendation.
**Trigger:** Immediate — noted in `RESPONSIVE_STRATEGY.md`. Small fix: add padding to the button so its interactive region is ≥44px.

---

## Content

### Wikilink resolution in the loader
**Why:** `GRAPH_AND_LINKING.md` specifies `[[slug]]` and `[[room/slug]]` syntax with build-time resolution, but the loader currently passes markdown bodies through `marked` without parsing wikilinks. The code is structured to accept a wikilink plugin; one has not been written.
**Trigger:** When the first work links to another work (i.e., the second published work, if it references the first). Until then, there is nothing to resolve and nothing to break.

### Backlinks computation
**Why:** `GRAPH_AND_LINKING.md` specifies that backlinks are computed at build time by inverting the outbound-link set and surfaced in each work's outward invitation. The loader does not yet build this index.
**Trigger:** Same as wikilink resolution. The two ship together — backlinks require resolved wikilinks.

### Outward-invitation composition
**Why:** `GRAPH_AND_LINKING.md` specifies the bottom-of-work invitation as facet threads + backlinks + return-to-room. `WorkView` today renders only the return-to-room link. Facet threads and backlinks are gaps.
**Trigger:** When facets exist on works (add facet-thread composition) and when wikilinks resolve (add backlink composition).

### Room-landing works list
**Why:** `INFORMATION_ARCHITECTURE.md` specifies that each room landing lists its works. Currently each room renders only its title and bracketed description.
**Trigger:** The first work in any room. The list component is small and can be built that day.

### Facet chip atom + facet pages
**Why:** Specified in IA and GRAPH_AND_LINKING; rendering is not yet built. No `/facet/{facet}` route, no chip atom.
**Trigger:** When a work carries facets and the chip becomes visible absence on the work page.

### Per-content-type prose rendering
**Why:** The current `.prose` styles in `tokens.css` are generic — paragraphs, headings, lists, code. `CONTENT_SCHEMA.md` names four types (poem, essay, case-study, note), each of which may render differently (poems preserving line breaks, case studies handling figures, etc.).
**Trigger:** When a work exists whose type does not read comfortably in the generic `.prose` treatment.

### MDX support per-file
**Why:** `CONTENT_SCHEMA.md` names MDX as a held option for works that need embedded components (audio in the Salon, interactive figures in the Studio). The loader currently handles `.md` only.
**Trigger:** The first work that wants a component embed. Likely in the Salon or a Studio case-study.

### Draft graduation of bracketed copy
**Why:** 404 lines, the 404 link label, and the four room descriptions are bracketed per `VOICE_AND_COPY.md`'s draft convention. They await voice settlement.
**Trigger:** Whenever Danny has a settled phrasing for any of these surfaces. Graduation is per-surface — the Garden's description can graduate without waiting on the 404.

---

## Design

### Empty-room outward invitation
**Why:** `INFORMATION_ARCHITECTURE.md` commits that room landings carry an outward invitation even when empty. Today the four room landings have title + bracketed description and no outward gesture.
**Trigger:** Coupled to draft graduation — when the room's voice settles, the invitation is added in the same pass.

### Accent color semantic assignment
**Why:** `DESIGN_SYSTEM.md` holds `--accent-warm`, `--accent-rose`, `--accent-violet`, `--accent-gold` as vocabulary with evocations but no semantic role. `GRAPH_AND_LINKING.md` notes these could become facet tints in a future visible graph surface.
**Trigger:** When a surface (facet chips, a graph view, per-facet identifying mark) earns a colored distinction.

### Visible graph surface
**Why:** `INFORMATION_ARCHITECTURE.md` and `GRAPH_AND_LINKING.md` hold this as a future possibility. The build pipeline will already produce the `Graph` object it needs.
**Trigger:** When the content graph has enough nodes and edges to be meaningful. Probably 30+ works with enough interlinks.

### Time-slider drawer
**Why:** `TRANSPARENCY.md` holds the time slider; `INFORMATION_ARCHITECTURE.md` holds its location (nav top-right, native drawer).
**Trigger:** When the site has enough temporal depth (years of specification changes, a meaningful content history) to make movement through time feel like something rather than a sparse slider with few stops.

---

## Infrastructure

### Print stylesheet
**Why:** A site about poetry and essays with a "paper on the walls" aesthetic should print beautifully. Current print output includes nav and footer chrome.
**Trigger:** When a visitor asks to print a work, or when the first work that invites printing (a long essay, a sequence of poems) exists.

### Deployment pipeline specification
**Why:** `DEPLOYMENT.md` is a gap. The site currently has no specified hosting, CI/CD, DNS, or SSL commitment.
**Trigger:** Before the first deploy. (Implementation: pick a host, wire a build step, point DNS.)

### Dependency policy
**Why:** `DEPENDENCY_POLICY.md` is partially covered in the north star's technology stack table. A full policy would name evaluation criteria, update cadence, and the philosophical stance on third-party code.
**Trigger:** When a new dependency needs adding and the existing table doesn't give enough guidance.

### Testing strategy
**Why:** `TESTING_STRATEGY.md` is partially covered in the north star. Explicit testing policy — what to test, coverage philosophy, integration vs. unit balance — may want its own file.
**Trigger:** When the test suite grows beyond a handful of files and seams become harder to navigate.

### Media strategy
**Why:** `MEDIA_STRATEGY.md` is a gap. Owns image optimization, audio handling (Salon), responsive images, alt text philosophy, CDN delivery.
**Trigger:** The first media-bearing work, likely in the Salon.

### Evolution protocol
**Why:** `EVOLUTION_PROTOCOL.md` is a gap. How the codebase grows — refactor triggers, migration patterns, what "living over finished" means operationally.
**Trigger:** When the codebase has enough shape that evolution decisions start to benefit from a named practice.

### Security posture
**Why:** `SECURITY.md` is a gap. For a static content site the posture is light (no user input, no auth), but it should still be declared.
**Trigger:** Before the site ships to production. The absence of data collection is itself a security decision worth declaring.

### SEO and meta
**State:** Specification exists (`SEO_AND_META.md`). Schema.org JSON-LD is implemented for `WebSite`, `Person`, the `CreativeWork` subtypes for works, and `BreadcrumbList` for work pages. Remaining items below are sub-tasks of the spec.

### Per-page title and meta description
**Why:** Each route should emit its own `<title>` and `<meta name="description">`. Today the `<title>` is "Danny Dyer" globally from `index.html`; the description is not set.
**Trigger:** Before the first deploy, or alongside the SSG pivot — with static HTML, per-page meta becomes straightforward.

### Open Graph image generation
**Why:** Each work wants a 1200×630 OG image rendered from its title, date, and facets over the umber ground. Specified in `SEO_AND_META.md`.
**Trigger:** Before the first deploy, once a shared aesthetic for the card is decided.

### Sitemap generation
**Why:** `sitemap.xml` listing every published work, room, and facet page. Generated from the `Graph` object at build time.
**Trigger:** With the first work.

### RSS / Atom feeds
**Why:** Per-room feeds and a site-wide feed, full-content not summaries. Specified in `SEO_AND_META.md`.
**Trigger:** With the first work that a reader might want to follow.

### `robots.txt`
**Why:** Minimal `Allow: /` + sitemap pointer.
**Trigger:** Before the first deploy.

### Web Vitals production analytics
**State:** `web-vitals` library is wired (`src/shared/seo/web-vitals.ts`) and logs to the console in dev. Production forwarding is deferred.
**Trigger:** When a deployment and analytics provider are chosen (`DEPLOYMENT.md`).

---

## Code Quality

### Visible draft indicator in dev
**Why:** When `pnpm dev` is running and a visitor views a draft work, no visual cue shows the work is unpublished. A subtle `[draft]` badge on `WorkView` under `import.meta.env.DEV && work.draft` prevents accidental inference.
**Trigger:** Immediate — small UI addition gated on dev mode.

### Router devtools wired
**Why:** `@tanstack/router-devtools` is installed but not rendered. Adding it conditionally in `main.tsx` under `import.meta.env.DEV` gives route-state visibility during authoring.
**Trigger:** Immediate — small dev-DX win.

### Root error boundary
**Why:** If any component throws at runtime, the whole page becomes a white screen. An `<ErrorBoundary>` in `__root.tsx` with a quiet recovery surface (stylistically matching `NotFound`) keeps failures inside the house.
**Trigger:** Immediate — small robustness addition.

### Theme store reacts to system preference changes
**Why:** `prefers-color-scheme` is read once at module load. If a visitor with no stored preference has their system switch from light to dark mid-session (sunset mode), the site doesn't follow. A `matchMedia` change listener in `theme-store.ts` closes this.
**Trigger:** Immediate — small ACCESSIBILITY extension.

### Theme sync across tabs
**Why:** Two tabs open, toggle in one, the other stays out of sync until refresh. A `storage` event listener in `theme-store.ts` emits the change.
**Trigger:** Immediate — pairs with the system-listener change.

### Bundle visualizer
**Why:** `rollup-plugin-visualizer` would make the ~623KB bundle's composition legible. Useful while the SSG pivot is pending — tells us exactly what is costing what.
**Trigger:** Immediate — dev-DX win that informs future decisions.

### Favicon and site icons
**Why:** `index.html` references no favicon; the browser tab shows the default. Even a simple SVG favicon (Diamond-based) identifies the site. Also needs `apple-touch-icon` for iOS bookmarks and `theme-color` meta for mobile browser chrome.
**Trigger:** Immediate — small identity addition.

---

## Privacy

### Web Vitals consent gating
**Why:** `reportWebVitals()` fires unconditionally in `main.tsx`. Today it only logs to console in dev and has no production forwarding, so this is latent. When `DEPLOYMENT.md` wires a provider, the consent question becomes real. Name the stance before carelessly bolting analytics on.
**Trigger:** Immediate for the stance declaration (in `SEO_AND_META.md` or a new `PRIVACY.md`). Implementation waits for the analytics provider decision.

---

## Operational

### CI workflow (GitHub Actions)
**Why:** No automated gate exists today. A contributor could commit broken code and push. A GitHub Actions workflow at `.github/workflows/ci.yml` running `pnpm install`, `pnpm exec tsc -b`, `pnpm exec eslint src/`, `pnpm test --run`, and `pnpm build` on every push and PR closes the loop.
**Trigger:** Immediate — before first collaborator merge or first deploy.

### Pre-commit hooks (husky + lint-staged)
**Why:** Lint + typecheck + test can be skipped if the committer forgets. Hooks catch regressions at the earliest possible moment.
**Trigger:** Immediate — pairs with CI workflow for defense-in-depth.

### Lighthouse CI in workflow
**Why:** `lighthouserc.js` exists but never runs automatically. Adding a step to the CI workflow that runs `pnpm audit` and publishes the report means perf / a11y / SEO regressions are caught per-PR.
**Trigger:** Immediate — extension of the CI workflow.
