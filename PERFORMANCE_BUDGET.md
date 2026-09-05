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

*As of 2026-09-05 (the sky's third pass): the main entry is ~148 KB gzipped, the eager set — main plus every route chunk and the sky's structural chunk — ~219 KB, and the sky's two lazy layers ~38 KB together; `.size-limit.cjs` holds the floors (175 / 225 / 64 KB) and §"The Sky's Lazy Layers" below says why the last is counted apart.*

*As of 2026-09-05, later the same day (the eleventh pass): the main entry ~106 KB gzipped, the eager set ~226 KB, and the sky's lazy layers ~43 KB; the eager floor moved from 225 to 227 KB for the look-up as a space and the daystar's seat, named in `.size-limit.cjs`.*

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

**Constellation perf harness:** `pnpm harness:sky` boots a standalone Vite app under `packages/sky/harness/` that mounts `<Constellation />` against synthetic graphs (small / production / heavy / extreme — number-keys swap them live). A perf overlay reads `requestAnimationFrame` intervals and `PerformanceObserver` long-tasks. `pnpm perf:sky` drives the harness headlessly via Chromium and fails the run if frame avg / p95 / long-task counts breach the thresholds in `scripts/check-sky-perf.mjs`. The harness exists so the constellation surface — the most paint-heavy thing on the site — has its own perf regression guard, separate from page-load Lighthouse.

**The atmosphere's frame discipline:** the WebGL layer holds the budget structurally, not aspirationally. The render loop performs no per-frame `getComputedStyle` (the SVG's transform stack is replayed numerically from inline variables — a computed-style read inside an animating subtree forces a synchronous recalc every frame — and the heavens' 600s turn is a roll in the shared camera, so there is no animation clock to read back; the navigation loop re-projects at a ten-frames-a-second idle cadence to carry the turn while the sky rests, and the atmosphere's calm cadence keys on the camera's pose rather than its version so the roll alone doesn't wake it), allocates nothing at steady state (one reused frame object, preallocated buffers, palette uniforms written only while a theme fade is live), and the structural projector caches its element lookups (the navigation tick once spent its budget on ~100 `querySelector` walks per frame). The loop halves its cadence when the sky is calm — no camera writes, pool and claim settled — and a budget watcher drops render resolution once if 60fps doesn't hold; shader compiles are staggered one-per-frame at mount so the arrival never blocks. The headless gate pins `?atmosphere=off` because SwiftShader's software rasterizer says nothing about visitors' GPUs (its cost model inverts: transcendentals that are single-cycle on hardware are libm calls in software); the atmosphere's JS hot path is guarded instead by deterministic floors in `src/shared/webgl/atmosphereFrame.perf.test.ts`, alongside the navigation floors in `wellPhysics.perf.test.tsx`.

**On deploy:** a Lighthouse CI step should run against the production build and fail the build if any hard-limit target regresses. `DEPLOYMENT.md` (gap) will wire this.

**After deploy:** Real User Monitoring (RUM) via a privacy-respecting provider (Plausible or similar) to track Web Vitals in the wild. No per-user tracking; aggregate metrics only.

---

## The Sky's Lazy Layers

*Added 2026-09-05, with Danny.* The sky carries two layers that are fetched only after the page has loaded and the browser has gone idle, and never block a paint: the WebGL atmosphere (`hooks/useWebGLFirmament.ts` → `webgl/atmosphereRenderer.ts`) and the daystar's magic (`hooks/useDaystarMagic.ts` → `dom/daystarMagic.ts`, which carries GSAP). They are weight the visitor chooses by lingering, not weight the page costs on arrival, and the budget counts them apart from the eager path.

The rule for a lazy layer:

- **After load, after idle.** The import is scheduled from `load` through `requestIdleCallback` (a 4 s ceiling; a 200 ms pause where idle callbacks are missing). The structural sky — the SVG, the walk, the face — is complete and interactive before the fetch begins. `e2e/sky-interactions.spec.ts` §"the magic" pins the chunk's fetch to after the navigation's `loadEventStart`.
- **Gated by the visitor.** `prefers-reduced-motion: reduce` and `Save-Data` refuse the layer outright (`sky/magicGate.ts`); `?magic=off` and `?atmosphere=off` switch each off so a probe can measure the sky without it.
- **Its own chunk, its own budget.** Vite splits each behind its dynamic import; `.size-limit.cjs` counts the lazy chunks together (64 KB gzipped) and excludes them from the eager entry (227 KB). A lazy layer growing never fails the eager budget; a lazy layer leaking onto the eager path — a static import from a route — fails it at once.
- **Disposable.** Each mounts with a handle and disposes on unmount — the atmosphere's loop, the magic's ticker and tweens, the daystar's painter and its context — so a visitor who looks up and back down pays once.
- **Warmed by intent, or by the Foyer's rest — never by arrival.** A lazy layer may be fetched ahead when the visitor reaches for the surface it belongs to — the atmosphere on the Foyer's look-up pull's first input, or the "Look up" link under the pointer (`webgl/warmAtmosphere.ts`) — so the surface arrives whole. And the Foyer, whose ceiling is the sky and whose primary gesture is the look-up, readies the whole sky while it rests: after load, once the browser is idle, the sky route's code and graph, the atmosphere's module and then its context and compiled programs on a canvas not yet on the page (adopted whole at mount), and the magic (`hooks/useSkyReadiness.ts`, `webgl/readySky.ts`). Danny's ask — *pre-mounted, so there's no jank* — and the budget's answer: paid at idle, never on arrival, never on any other room's page, and under the same gates. A warm-up is never scheduled by a page's own arrival. While a pull or a lift plays, that readied canvas is repainted once per frame at the eye's pitch — the sky's own per-frame cost, paid only while the eye moves; at rest the backdrop is a still frame. And on the way down the sky's atmosphere is handed back to the backdrop rather than disposed and remade: one context for the round trip. The glyph's seat (`dom/daystarSeat.ts`) is the one place the sky's own daystar molecule is mounted outside the sky: fetched at the Foyer's rest with the rest of the readiness, mounted unseen at a pull's first input — intent — with its small paint context, and let go if the pull comes back to rest; never on arrival, never on any other room's page.

The sizes today (gzipped): the atmosphere ~10 KB; the magic ~31 KB, of which GSAP's core is the greater part and the daystar's painter (`webgl/daystarPaint.ts`, one program on one small context of the daystar's own) a few. GSAP is admitted — the refusal of third-party animation libraries in `CONSTELLATION_HORIZON.md` is amended to name it — because a scarf of silk that swoops in three dimensions wants a real tween engine's easing, overwrite discipline, and ticker, and hand-rolling those is the abstraction tax paid in the other direction. `motion`, which nothing imported, left the same day. Danny's ask was explicit: *lazy load or non-blocking eager fetch post-network-idle the payload for the library; we don't have to not make the right decision out of a desire to stay under the size budget.* The budget's answer is this section: the right decision, and a shape that keeps it off the first paint.

This is the site's one exception to hand-rolled motion, and its shape is the rule for any other: lazy, gated, budgeted apart, disposable, and never in the path of the first paint.

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
- Route chunks and the sky's lazy layers split behind dynamic imports (Vite); `.size-limit.cjs` holds three gzipped floors in CI — the main entry (175 KB), the eager client JS (227 KB), and the sky's lazy layers counted apart (64 KB) — and blocks a merge that crosses one.

Enforcement gaps (all held in backlog):

- Lighthouse CI gate
- RUM
- Moving the content loader to `createServerFn` to drop `marked` and `gray-matter` from the client bundle (see `RENDERING_STRATEGY.md`)
- Self-hosted, subset fonts
- Image optimization pipeline
