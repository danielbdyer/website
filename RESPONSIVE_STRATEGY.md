# Responsive Strategy

`MEDIUM.md` names responsiveness as the medium's native capacity for meeting each person where they are. A webpage does not have a fixed size; it exists at every viewport simultaneously, not as degraded versions of an ideal but as the same content expressing itself through different spatial constraints. A poem in a narrow viewport is not a compromised poem.

This file specifies how the site meets each viewport — what breakpoints it uses (few), what it scales, what it declines to adapt, and how print is honored as a first-class surface for a site built around works that want to feel like paper.

---

## The One Column

The site is a single 700px-max column centered on any viewport. This is the layout. There is no second pattern.

On a phone (320–480px), the column fills the viewport minus 24px of horizontal padding. The type sizes stay the same; the column just gets narrower, and the narrow serif body still reads comfortably because `1.8` line height and Literata were chosen with exactly this in mind.

On a tablet (768–1024px), the column is still 700px, centered with generous whitespace on either side. The whitespace is not wasted — it is the room around the text.

On desktop (1280px+), same 700px column, more whitespace. The figure-and-text composition on the Foyer (the geometric figure next to the welcome lines) uses a flex row with `gap-10` that collapses gracefully as needed; on very narrow widths it can stack vertically without special breakpoints firing.

The architectural commitment: **the column does not widen with the viewport.** A 1920px monitor is not a wider book; it is more room around a book of the same width. This is a deliberate design choice that honors the typographic measure — Literata at 16px wants roughly 50–75 characters per line, which 700px delivers.

---

## Breakpoints

The site has **zero explicit breakpoints** today. Tailwind offers `sm / md / lg / xl / 2xl`; the site uses none of them.

This is not the absence of responsive design. It is responsive design done by type and spacing alone, without layout-flipping. The column is the column. The nav is the nav. The visitor's viewport changes what surrounds the content, not the content itself.

**When breakpoints arrive** (and they will, for the Salon's media layouts or a future gallery in the Studio), they follow a small ladder:

- `sm` / 640px — phones in landscape, very small tablets
- `md` / 768px — tablets in portrait
- `lg` / 1024px — tablets in landscape, small laptops
- (desktop sizes beyond `lg` rarely earn a breakpoint — the column is the column)

Each breakpoint used is a real design decision. Adding one because a pattern "should probably respond" is insufficient — the breakpoint is added only when the content at the two sides of the breakpoint is *genuinely different* in shape.

---

## Touch Targets

Any interactive element (link, button) must be at least **44×44 CSS pixels** to meet Apple's and WCAG 2.1 AAA guidance for touch targets. This covers the nav links, the theme toggle, the wordmark, future facet chips, and future work-list links.

Touch targets can overlap invisibly — a small visible pill can carry a larger tap region by extending padding beyond the visible background. This is preferred over inflating visible chrome for the sake of touch. The theme toggle uses this pattern: the outer `<button>` is `min-w-[44px] min-h-[44px]`; the inner `<span>` holds the visible hover chrome at icon scale.

---

## Viewport Meta

`index.html` sets `<meta name="viewport" content="width=device-width, initial-scale=1.0">` — the minimum a modern page requires. No `maximum-scale` cap; a visitor who needs to pinch-zoom to read small text must always be allowed to.

---

## Hover States and Touch Devices

Hover states exist on the site (nav link hover, Diamond rotate on wordmark hover, link tint shifts). These use `:hover` in CSS, which fires on touch-enabled devices via tap-and-hold — usually a bad pattern, because a tap may leave the hover state "stuck" until the user taps elsewhere.

The mitigation is simple: **every hover state has a non-hover fallback that still communicates interactivity.** The nav link always has its underlined or tinted state available via cursor, without hover. The wordmark's Diamond is recognizable as a mark at rest; the 45° rotate on hover is an embellishment, not a signal.

When a site element earns a hover interaction that genuinely cannot be replicated without hover (tooltip-style disclosure, for example), it uses `@media (hover: hover)` to restrict the behavior to pointer-hover capable devices. No such element exists today; the pattern is held for when one does.

---

## Print Styles

A site about poetry and essays with a "paper on the walls" aesthetic honors print as a first-class viewport. A visitor who prints a poem or essay should receive a page that looks like what it is.

**Currently: no custom print styles.** The default browser print output is minimal: the nav, footer, and chrome print along with the work body. This is **a known gap**; print styles are held in the backlog as part of a broader content-rendering pass.

**When implemented**, the print stylesheet should:

- Hide the nav, footer, theme toggle, and any UI chrome.
- Render the work body at comfortable print sizes (11–12pt), with proper margins.
- Preserve the typography hierarchy — Newsreader for the title, Literata for the body.
- Show the work's title, date, and facets once at the top; not repeated per page.
- Hide scroll-reveal transitions (they are nonsensical in print).
- Print the URL of the work somewhere unobtrusive (footer) so a reader of a printed page can find the web version.
- Honor page breaks around major sections.

Poems printed from the Garden should look like poems printed from any serif body — because the body they use is a serif, not a web-specific family.

---

## Browser Support

**Tier 1 (fully supported):** the last two versions of Chrome, Safari, Firefox, and Edge, on desktop and mobile. Every feature works; every layout is correct; every animation plays.

**Tier 2 (graceful degradation):** older browsers (one–two major versions back of each). Layouts hold; core content is reachable; non-critical animations may not render. JavaScript features that depend on `useSyncExternalStore` (React 18+) or modern CSS (`@theme`, `:focus-visible`, `color-mix()` if adopted) fall back where possible.

**Tier 3 (bare minimum):** text-based browsers, older mobile browsers, e-reader browsers. The content is readable as HTML; the site's semantic structure carries the reading experience even without CSS or JS. This is honored by: semantic HTML, no content gated behind JS, sensible default typography from Georgia fallback when Literata doesn't load.

The site does not polyfill or transpile aggressively for very old browsers. The bundle stays small; the visitor with a five-year-old browser may get a flat but readable site. That is an acceptable outcome for a content site.

---

## High-DPI and Retina

SVGs (Diamond, Ornament, GeometricFigure, icons) scale perfectly. Raster images, when they arrive (in `MEDIA_STRATEGY.md` territory), must be authored at 2x resolution and served via `<img srcset>` or `<picture>` to deliver the appropriate size for the visitor's display. Serving a low-DPI image to a retina screen is a visible quality failure; serving a high-DPI image to a low-DPI screen wastes bandwidth. `MEDIA_STRATEGY.md` owns the authoring convention; this file names the commitment.

---

## What This File Does Not Govern

- **Accessibility.** The visitor's body and preferences are `ACCESSIBILITY.md`'s concern; this file governs the viewport's size.
- **Performance.** The cost of meeting every viewport is `PERFORMANCE_BUDGET.md`'s concern.
- **Motion under reduced motion.** `INTERACTION_DESIGN.md` and `ACCESSIBILITY.md` share that concern.
- **Internationalization.** Right-to-left layouts, language-specific typography, and locale-aware formatting are not yet a concern. Deferred.

---

## Enforced in Code

Implemented today:
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">` in `index.html`
- 700px max column with 24px horizontal padding in `src/app/routes/__root.tsx`
- Flex-based layouts that collapse naturally without breakpoints
- No hover-only content signals
- SVG ornaments and icons

Known gaps (held in backlog):
- Print stylesheet
- `@media (hover: hover)` guard for future hover-only interactions
