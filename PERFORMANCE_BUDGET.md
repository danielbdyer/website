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

As of the content-loader skeleton:

| Asset | Uncompressed | Estimated gzipped | Against target |
|---|---|---|---|
| JS bundle | ~623KB | ~200KB | **exceeds the 100KB target, within the 150KB hard limit** |
| CSS bundle | ~17KB | ~4.3KB | within target |
| Initial HTML | ~0.8KB | ~0.4KB | within target |

The JS bundle weight is driven primarily by three runtime dependencies loaded on the client:

- `react` + `react-dom` + `@tanstack/react-router` — unavoidable given the stack
- `gray-matter` — frontmatter parser, ~200KB unminified, shipped to the client because content is loaded at module evaluation time
- `marked` — markdown parser, ~50KB unminified, shipped to the client for the same reason

The last two are the lever to pull. They are on the client not because the *output* needs to be computed client-side, but because the current architecture (SPA with Vite bundling everything) puts them there by default.

---

## The SSG Pivot

The site's correct performance architecture is **static generation**, not single-page application. Every route's HTML should be rendered at build time and served as a static file. The browser receives pre-rendered HTML on first paint; JavaScript hydrates interactive behavior (theme toggle, scroll reveal) but is not required to see any content.

This has four concrete wins:

1. **LCP drops dramatically.** The visible content paints in the first HTML response rather than waiting for React to hydrate.
2. **SEO becomes real.** Search engines see rendered content, not an empty `#root` div.
3. **Markdown parsing leaves the client bundle.** `marked` and `gray-matter` run at build time only. The client bundle shrinks by ~250KB unminified.
4. **Interactive behavior is unchanged.** Theme toggle, scroll reveal, nav — all continue to work; hydration picks them up after the static HTML paints.

The chosen vehicle is **TanStack Start**. Reasoning:

- It uses TanStack Router underneath, which the site already uses. The URL grammar, route structure, and nav code continue to work.
- It supports SSG (prerendering at build) alongside SSR. For this site, only SSG is used.
- It is from the TanStack team, integrated with the router, and does not introduce a second routing mental model.
- It is a smaller pivot than Astro. Astro would be faster-at-launch by virtue of its island architecture but would mean moving off React components where possible and rewriting the routing. Given our investment, Start is the cleaner path.

The pivot is held in the backlog (`BACKLOG.md`) with the trigger: **before Danny writes the third work.** Rationale: pivoting is cheapest with no content (today) and gets harder as content accumulates. But no content yet means we can't yet *verify* the pivot's benefit with real pages. The third-work threshold gives us a tangible moment when the pivot is both still feasible and concretely beneficial.

Until the pivot, the current bundle cost is the cost of building now. The 200KB gzipped initial bundle is larger than the target but well within the hard limit; no page is unreadable because of it.

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

`Literata` and `Newsreader` are loaded from Google Fonts with a `swap` strategy. This means the first paint uses the fallback (Georgia); a moment later, the custom fonts swap in. This is a visible flash of fallback text (FOFT), and it is acceptable: the fallback is also a serif, the column width is the same, and text reflows minimally.

**Not acceptable:** blocking render on font load (FOIT — Flash of Invisible Text). The `font-display: swap` in the Google Fonts URL prevents this.

**Room for improvement:** self-hosting the fonts with subsetting (only the glyphs used) would eliminate the third-party request, reduce weight, and improve consistency. Held in the backlog.

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
- Build-time markdown parsing (via SSG pivot or a lighter plugin)
- Self-hosted, subset fonts
- Image optimization pipeline
