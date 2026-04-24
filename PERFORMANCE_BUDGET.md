# Performance Budget

Slow on purpose is not slow to load.

`INTERACTION_DESIGN.md` commits the site to intentional slowness in motion — a 60-second geometric rotation, a 500ms theme fade, a 600ms scroll-reveal. None of that is a performance concession. Page loads, asset delivery, script execution, and interactive responsiveness are still expected to be fast. This file holds that line.

The difference between the two kinds of "slow" is the difference between *a room lit softly* and *a room that takes a long time to walk into*. The first is atmosphere; the second is a broken door.

---

## The Commitment

The site targets **WCAG-adjacent user-experience floors**, translated into engineering targets:

| Metric | Target | Hard limit |
|---|---|---|
| Largest Contentful Paint (LCP) | ≤ 1.5s | ≤ 2.5s |
| Interaction to Next Paint (INP) | ≤ 100ms | ≤ 200ms |
| Cumulative Layout Shift (CLS) | ≤ 0.05 | ≤ 0.1 |
| Total blocking time | ≤ 150ms | ≤ 300ms |
| JS bundle (gzipped, initial route) | ≤ 100KB | ≤ 150KB |
| CSS bundle (gzipped) | ≤ 15KB | ≤ 25KB |
| Full page weight, initial load | ≤ 400KB | ≤ 700KB |
| Time to Interactive on a mid-tier phone | ≤ 3s on 4G | ≤ 5s |

These are aspirational and will be verified by Lighthouse / Real User Monitoring once deployed. They are not guesses — they correspond to the "Good" and "Needs Improvement" thresholds in the Web Vitals spec, adjusted for a content site's typical patterns.

---

## Current State

As of the post-SSG state with the content loader moved to `createServerFn`:

| Asset | Uncompressed | Gzipped | Against target |
|---|---|---|---|
| Main JS chunk (`index-*.js`) | ~386KB | ~118KB | **within the 150KB hard limit; still above the 100KB target** |
| Reveal chunk | ~35KB | ~11.6KB | room to absorb small additions |
| Per-route chunks | <2KB each | <0.8KB each | within target |
| CSS bundle | ~21KB | ~4.3KB | within target |
| Prerendered HTML (per route) | ~7KB | — | static; included in first paint |

`marked` and `gray-matter` are no longer in the client bundle. The loader module is server-only (only reached via `createServerFn` handler bodies, which Start's plugin strips from client chunks). The 70KB-gzipped drop from the pre-refactor bundle reflects that extraction.

The remaining JS weight is primarily:

- `react` + `react-dom` + `@tanstack/react-router` — unavoidable given the stack
- TanStack Start's client runtime (hydration, serialization adapters, server-fn client)
- Zod (used by the content schema, currently bundled; a future simplification could swap to lightweight validators if Zod's schema weight becomes the binding constraint)

---

## The SSG Pivot

The site's delivery is **static generation**: every route's HTML is rendered at build time and served as a static file. The browser receives pre-rendered HTML on first paint; JavaScript hydrates interactive behavior (theme toggle, scroll reveal) but is not required to see any content. The architecture and archaeology live in `RENDERING_STRATEGY.md`; this section records what the pivot delivered against the budget and what remains.

**Delivered**

- **LCP landed on the HTML response.** Every prerendered route paints the Nav, the room content, the Foyer's greeting, and the footer without executing JavaScript. React hydrates afterward without changing what's visible.
- **SEO became real.** Crawlers now see rendered content, not an empty `#root` div. Per-page meta, title, theme-color, and preconnects are in each HTML file.
- **Interactive behavior unchanged.** Theme toggle, scroll reveal, nav — all continue to work; hydration picks them up after the static HTML paints.

**Delivered subsequently (the loader-to-server-fn pass)**

- **Markdown parsing off the client.** `src/shared/content/server-fns.ts` wraps the loader's public functions in `createServerFn`. Start's plugin strips the handler bodies from client chunks; `loader.ts` (with its `marked` + `gray-matter` imports) is only reachable through those handlers. The client chunk dropped ~70KB gzipped as a result — from 188KB to 118KB. A key subtlety: the barrel (`src/shared/content/index.ts`) must not re-export anything from `loader.ts`. Re-exporting `parseWork` for test convenience pulled the whole loader module back into the client chunk. Tests now import `parseWork` from `./loader` directly.
- **100KB JS target is in range.** The main chunk is 118KB gzipped — above target but close enough that the remaining distance is room-absorbable rather than architectural. Further reductions likely come from Zod (content schema), Start runtime simplification, or Motion's footprint.

---

## What Counts as "Slow on Purpose"

Motion durations that are part of the site's language are not in the performance budget. Specifically:

- The **60-second geometric rotation** does not affect any metric; it's a CSS animation on a single SVG.
- The **500ms theme fade** is a CSS transition; it begins when the visitor clicks the toggle and is part of the experience, not the page load.
- The **600ms scroll reveal** is a CSS transition fired by IntersectionObserver; it runs on already-painted content.

What is in the performance budget:

- The time from request to first HTML byte (TTFB).
- The time from first HTML byte to first visible content (FCP).
- The time from FCP to the largest meaningful content painted (LCP).
- The time from a user interaction to the next paint (INP).
- The total weight of the initial page load (HTML + critical CSS + critical JS + fonts).

The site chooses slowness where slowness deepens the encounter; it declines slowness where slowness is a cost.

---

## Font Loading

`Literata` and `Newsreader` are self-hosted via `@fontsource-variable/*` packages, imported from `src/styles/tokens.css`. The CSS emits per-subset `@font-face` rules with `unicode-range`; browsers only download the latin (and if needed latin-ext) woff2 files for English-only pages. `font-display: swap` is preserved from the fontsource defaults — the first paint uses Georgia, then the custom serifs swap in. That is a visible flash of fallback text (FOFT); it is acceptable because the fallback is also a serif at the same column width, and text reflows minimally.

**Not acceptable:** blocking render on font load (FOIT — Flash of Invisible Text). The `font-display: swap` in the fontsource CSS prevents this.

---

## Images

No images exist today. When they arrive (in works and possibly the Salon), the budget constrains them:

- All images must be served in modern formats (AVIF or WebP), with a JPEG/PNG fallback via `<picture>`.
- All images must carry intrinsic width/height to prevent CLS.
- All images must be lazy-loaded below the fold (`loading="lazy"`).
- No image larger than necessary for its display size at the visitor's DPR.

`MEDIA_STRATEGY.md` (gap) will specify the pipeline. This file holds the budget.

---

## Monitoring

**Today:** Lighthouse runs locally on request. No deployed monitoring.

**On deploy:** a Lighthouse CI step should run against the production build and fail the build if any hard-limit target regresses. `DEPLOYMENT.md` (gap) will wire this.

**After deploy:** Real User Monitoring (RUM) via a privacy-respecting provider (Plausible or similar) to track Web Vitals in the wild. No per-user tracking; aggregate metrics only.

---

## What This File Does Not Govern

- **Motion philosophy.** That is `INTERACTION_DESIGN.md`. This file holds the line between intentional motion and unintentional slowness.
- **Accessibility performance.** `ACCESSIBILITY.md` governs reduced-motion behavior and other user-preference responses; this file governs page speed.
- **Deployment and hosting.** `DEPLOYMENT.md` (gap) governs how the site is served; this file defines what it should be served *within*.

---

## Enforced in Code

Today:
- Vite's default build optimizations (tree-shaking, minification).
- `font-display: swap` via the Google Fonts URL.
- No per-route code splitting (bundle weight currently small enough not to matter; held in backlog).

Enforcement gaps (all held in backlog):
- Lighthouse CI gate
- RUM
- Moving the content loader to `createServerFn` to drop `marked` and `gray-matter` from the client bundle (see `RENDERING_STRATEGY.md`)
- Self-hosted, subset fonts
- Image optimization pipeline
