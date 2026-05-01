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

**State:** Implemented in `__root.tsx`. `RootComponent` subscribes to `useRouterState({ select: (s) => s.location.pathname })` and focuses `<main id="main-content">` on each pathname change after the initial mount.

### Investigate the room-landing accessibility 0.95

**Why:** Lighthouse scores the four room landings (`/studio`, `/garden`, `/study`, `/salon`) at a11y 0.95 — one violation each — while the foyer hits 1.0. The blocker for graduating the room floor back to 1.0 is identifying and fixing whatever the violation is. Most likely candidates: contrast on `text-text-3` preview-note copy, the `noindex, nofollow` meta surfacing as an a11y signal in some audits, or a heading-order finding from the preview content.
**Trigger:** Next time the audit skill runs, or when a contributor opens the rooms in Lighthouse and reads the actual finding.

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

### Multi-facet prerender combinatorics

**Why:** The facet route supports multi-select via comma-separated paths (`/facet/beauty,body`). The toggle bar emits links to every reachable selection, so `crawlLinks: true` walks the full power set of 8 facets — 255 prerendered pages, most of which are empty-intersection states. Today the cost is small (each page is tiny, build finishes in seconds), but the count grows superlinearly with the facet vocabulary. A ninth facet doubles it to 511.
**Trigger:** Either the build time crosses a felt cost (≥30s), the deploy bundle approaches the Cloudflare Pages limit, or a ninth facet is proposed. Any of those graduates this to a real decision: cap depth (prerender only 1- and 2-facet combinations), `noindex` empty intersections, or shift multi-facet routes to client-side via a `_redirects` SPA fallback.

### Route-level code splitting

**Why:** Every route currently loads in the initial bundle. A visitor arriving at `/garden` downloads the code for `/salon` too.
**Trigger:** When the bundle has enough per-route weight to justify the cost of lazy loading (new components, per-route data, etc.). Today, each route is <50 lines; splitting is not worth it.

### Image optimization pipeline

**Why:** When images arrive (in works and possibly the Salon), they need responsive sources, modern formats (AVIF, WebP), and lazy loading. None of this exists yet.
**Trigger:** The first image in any work. Owned by `MEDIA_STRATEGY.md` when that file is written.

### Move `marked` and `gray-matter` back off the client bundle

**Why:** The two markdown parsers ship in the client chunk (≈30KB gzipped) so that route loaders can resolve content during client-side navigation without a server. A previous experiment with `createServerFn` removed them at the cost of breaking client-side nav under SSG (see `RENDERING_STRATEGY.md` §"The createServerFn archaeology"); the savings were paid for in fragility. The async barrel in `src/shared/content/index.ts` is the seam through which a future migration can land — most likely a build step that emits per-room and per-work JSON manifests under `dist/client/data/`, with the loader switching to `fetch()` calls behind the same async signatures. No route file would change.
**Trigger:** When the bundle weight becomes a felt cost — a Lighthouse regression, a measurable TTI hit on a real device, or the addition of a parser-heavy feature that pushes total weight over the budget in `PERFORMANCE_BUDGET.md`. Today it's noise against more meaningful concerns.

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

**State:** Partially graduated as of the constellation's first form. The four held accents pair editorially with the eight facets in `FACET_HUE` (`src/shared/content/constellation.ts`); the held discipline still holds for the rest of the site (chips, toggles, outward invitation remain neutral). A future surface that needs a different pairing names its own pairing in its own file.

### Visible graph surface

**State:** Substantially shipped at `/sky`. The structural future state in pure SVG/CSS is real (layered firmament with paper-grain noise, watercolor-filtered halos, vespers thread bloom, slow rotation, per-star twinkle, cursor parallax, the daystar, the polestar, the carpet rolling out on first paint), and a focused first WebGL move has shipped on top — `useWebGLFirmament` paints a continuous procedural-noise / cursor-pool layer additively via `mix-blend-mode: soft-light`. `CONSTELLATION.md` §"What Shipped (First Form)" and `CONSTELLATION_HORIZON.md` Phases 0–4, 7 enumerate every shipped element. *What remains held*: the full-viewport reframe (no chrome, lift-and-pitch perspective camera, stars-as-overlay at addressable URLs), shader-based per-star halos, drifting motes, the strata layer, the time slider integration, audio in the Salon's region, per-room sub-skies.
**Trigger for the next moves:** Danny's pull on the full-viewport reframe; the SVG/WebGL hybrid hitting a visible ceiling on the per-star halo behavior; a Salon work that asks for sound. Each named with its own trigger in `CONSTELLATION_HORIZON.md`.

### Time-slider drawer

**Why:** `TRANSPARENCY.md` holds the time slider; `INFORMATION_ARCHITECTURE.md` holds its location (nav top-right, native drawer).
**Trigger:** When the site has enough temporal depth (years of specification changes, a meaningful content history) to make movement through time feel like something rather than a sparse slider with few stops.

### Negative-pull spacing token (`--spacing-pull`)

**Why:** Room landings use `-mt-4 sm:-mt-6` to pull preview notes up under the deck — a deliberate overlap gesture. Today the pattern appears once, so a token would be over-naming. The pattern is real, but premature.
**Trigger:** A second use of the gesture (e.g. a deck-with-attribution, a kicker-pulled-under-title, a salon work-page meta tucked under the title). At that point name `--spacing-pull` and `--spacing-pull-md`.

### Single-use leading graduation (`leading-[1.4]`, `[1.55]`, `[1.6]`)

**Why:** Three leading values currently live inline because each has only one site (image-slot caption, Foyer welcome lines, Salon postures). Tokenizing now is anticipation; the leading palette should grow only when use repeats.
**Trigger:** A second use of any of these values in a different surface graduates that value into a named `--leading-*` token.

### Empty-state spacing (`--spacing-empty-breathe`)

**Why:** `INFORMATION_ARCHITECTURE.md` commits that empty rooms acknowledge their emptiness "by their quiet, not papered over with chrome." Today empty rooms are simply the absence of a works list — there is no named vertical breathing room around the silence.
**Trigger:** The first empty surface that visibly needs vertical breathing — likely a facet page with zero matching works once authored content fills the rooms enough to make the empty state read as deliberate. Likely value 80–96px (ladder rungs `20`/`24`).

### Fluid `--spacing-edge` with safe-area composition

**Why:** Edge padding currently steps from 32px to 40px at the `sm` breakpoint, with `max(…, env(safe-area-inset-*))` wrapping. The step pair works for mobile and tablet. A foldable or rotating-class device might benefit from a clamp-based smooth transition.
**Trigger:** A foldable-class viewport (or three+ visitor reports) that produces a visible mid-orbit step as the device moves between viewport classes.

### Print-mode space overrides

**Why:** Print is a backlog item per `RESPONSIVE_STRATEGY.md:64–82`. When the print stylesheet is written, every spacing token may want a `@media print` override — paper has different breath rules than screen.
**Trigger:** Coupled to the print stylesheet item above. Adopted as part of that pass.

### Page-transition spatial token (`--spacing-transition-rise`)

**Why:** Page transitions are deferred per `INTERACTION_DESIGN.md:117–123`. When implemented, the new page may want a small vertical offset (e.g. 14px, matching the Reveal token) for entering from below.
**Trigger:** Page transitions implemented. Adopted as part of that pass.

---

## Infrastructure

### Print stylesheet

**Why:** A site about poetry and essays with a "paper on the walls" aesthetic should print beautifully. Current print output includes nav and footer chrome.
**Trigger:** When a visitor asks to print a work, or when the first work that invites printing (a long essay, a sequence of poems) exists.

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

**Why:** The root route now sets a site-wide title and description in each prerendered page (via the TanStack Start `head` config), so every route has valid meta. Each route should also emit its own specific `<title>` and `<meta name="description">` — the Studio's title is currently "Danny Dyer" like every other page, and descriptions don't yet distinguish rooms or works.
**Trigger:** Before the first deploy for the rooms. Per-work titles land with the first work (the `$room/$slug` route's loader already surfaces the work's title).

### Open Graph image generation

**Why:** Each work wants a 1200×630 OG image rendered from its title, date, and facets over the umber ground. Specified in `SEO_AND_META.md`.
**Trigger:** Before the first deploy, once a shared aesthetic for the card is decided.

### RSS / Atom feeds

**Why:** Per-room feeds and a site-wide feed, full-content not summaries. Specified in `SEO_AND_META.md`.
**Trigger:** With the first work that a reader might want to follow.

### Web Vitals production analytics

**State:** `web-vitals` library is wired (`src/shared/seo/web-vitals.ts`) and logs to the console in dev. Production forwarding is deferred.
**Trigger:** When a deployment and analytics provider are chosen (`DEPLOYMENT.md`).

---

## Code Quality

### Frontmatter validation in the pre-commit hook

**Why:** `CONTENT_SCHEMA.md` specifies Zod-validated frontmatter, and `src/shared/content/schema.ts` already holds the schema. When a `.md` under `src/content/{room}/` is staged, the pre-commit hook should parse its frontmatter and run the schema against it — catching a malformed `type`, a missing `title`, or an unknown facet at the moment of commit rather than at build time.
**Trigger:** The first work. Until then, there is no content directory to validate.

### Wikilink resolvability in the pre-commit hook

**Why:** `GRAPH_AND_LINKING.md` commits that unresolved wikilinks fail the build. The pre-commit hook can surface that failure earlier — parse `[[slug]]` and `[[room/slug]]` in any staged `.md` under `src/content/`, fail if any target isn't in the resolved set.
**Trigger:** Pairs with the wikilink-resolution loader item under Content. Both ship together.
