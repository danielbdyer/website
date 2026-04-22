# Interaction Design

Time is a material on this site. Motion is not decoration applied after the design — it is the design unfolding in time. `MEDIUM.md` names temporality as one of the seven dimensions of the webpage; `DESIGN_SYSTEM.md` gestures at motion in a single paragraph and defers the choreography to this file. This file specifies the choreography: what easing curves the site uses, how long things take, what dark mode is structurally, what motion serves, and what motion declines.

The site uses time the way a slow room uses light — to mark the passage of attention, not to perform delight. Every motion decision is downstream of one phrase: *the page wants to feel like a place, not a feed.*

---

## Time as Material

A web app spends time hiding latency. This site spends time *as* latency — slow on purpose, in the few places where slowness deepens the encounter. The slowness is not unintentional; it is the felt experience of a room admitting a visitor.

This is a real architectural commitment because it lives in tension with `PERFORMANCE_BUDGET.md` (gap). When that file arrives it must hold the line: page loads, asset delivery, and interactive responsiveness should be fast. *Animation* duration may be deliberately slow. The two never confuse: a slow load is a failure; a slow transition is a choice.

A working test for any motion: **does this duration teach the visitor something about the register of the surface?** The 60-second geometric rotation in the Foyer teaches that this is a room you can sit in. The 500-millisecond theme transition teaches that the lighting changes the way lighting changes. A 200-millisecond hover state teaches nothing in particular — and that is fine, because hovers are a small, frequent gesture. Slow where slowness deepens; quick where quickness is honest.

---

## The Choreographic Vocabulary

Three durations carry most of the site's motion today. Each is a token in `tokens.css`.

| Duration | Token / value | What it serves |
|---|---|---|
| **200ms** | inline `duration-200` | Hover and focus state changes — link tint, button highlight, the Diamond's 45° rotate. The site's quickest gesture. |
| **500ms** | inline `duration-500` | Theme transition — the room dimming. Slow enough to feel like a choice, fast enough not to feel broken. |
| **600ms** | hardcoded in `.reveal` CSS | Scroll-reveal — content fading in and lifting 14px as it enters the viewport. The reading rhythm. |
| **60s** | `--animate-geo-spin` | The Foyer's geometric figure rotation. The ambient pulse of the site's body. |

These are the only durations the site uses today. New motion that does not fit these durations earns a new token in `tokens.css` and a paragraph in this file. Inline arbitrary durations (`duration-[437ms]`) are forbidden — durations are vocabulary, not preference.

### The site's easing curve

The reveal motion uses `cubic-bezier(0.23, 1, 0.32, 1)` — a soft-out curve sometimes called *easeOutExpo* or close to it. Content arrives quickly and settles into place rather than approaching slowly. This is the site's signature curve; it appears everywhere reveal-style motion is used.

Hover transitions use the default browser easing (effectively `ease`). Theme transitions use linear `ease`. The reveal curve is reserved for *arrival* motions; hover and theme are about *change*, which is a different feeling and earns a different curve. This distinction is small but real — using the reveal curve for a hover would feel like the hover was making an entrance, which it is not.

### Stagger

When multiple `Reveal` components share a viewport, each can carry a `delay` prop. The pattern is to stagger by 80–150ms — enough to feel like a wave rather than a chord. Stagger is used sparingly; most surfaces don't need it. Where used, the delay should follow a single rhythm (e.g., 0, 100, 200) rather than varied increments.

---

## Reveal as the Reading Rhythm

The `Reveal` molecule wraps content that should fade in as it enters the viewport. It uses the IntersectionObserver pattern via the `useReveal` hook (one of the two legitimate `useEffect` uses named in `REACT_NORTH_STAR.md`).

**What Reveal does:**

- Pre-reveal state: `opacity: 0` and `translateY(14px)`. The element is in the document but not yet *present*.
- On intersection (default threshold 0.08, just barely entering the viewport): the `revealed` class applies, opacity transitions to 1 and transform to 0 over 600ms with the signature easing.
- The transition fires once. Once revealed, the element stays revealed; no re-hide on scroll-out.

**When to use Reveal:**

- Around major content blocks on a page — the Foyer's figure-and-text composition, room titles, work bodies.
- Around any composition that benefits from arriving rather than appearing.

**When not to use Reveal:**

- Around inline elements within prose. Reveal wraps blocks; it does not wrap words or sentences inside a paragraph.
- Around interactive elements that need to be immediately responsive. Reveal delays first paint; that delay is appropriate for content but wrong for a button that must be ready to click.
- Above the fold for content that should be present on first paint. Reveal is a scroll-arrival pattern; on-load content should not be hidden waiting for an intersection that has already happened.

In practice, Reveal works above the fold *because* the IntersectionObserver fires immediately for elements already in view — but the 600ms fade is part of the experience even on first paint. This is intentional: the page should always feel like it is *arriving*, not like it has already arrived and is waiting.

---

## Dark Mode as Room Dimming

`DESIGN_SYSTEM.md` commits to dark mode as *the same room, dimmed* — not an inversion, not a different space. The interaction design enforces that commitment temporally.

**The transition is 500ms, linear ease, on `background` and `color`.** It is applied to the `body` element via CSS:

```css
body {
  transition:
    background 0.5s ease,
    color 0.5s ease;
}
```

The header has its own 500ms transition on `background` to stay continuous with the body. Other surfaces inherit color through `var(--text)` and shift naturally as the variables update.

**Why 500ms.** Anything under ~300ms feels like a flicker; anything over ~800ms feels like the page is broken. 500ms is long enough that the visitor registers the change as a deliberate event and short enough to feel like a single gesture. It is the duration of a sigh.

**No icon animation on the toggle.** When the visitor clicks the theme button, the icon swaps (sun → moon or vice versa) instantly. The room around the icon does the dimming; the icon itself just changes its hand. Animating the icon would compete with the room's transition for attention; the toggle should be the smallest motion, the room the largest.

**No flash of wrong theme.** The theme store applies the DOM class at module load (`applyToDOM(isDark())` in `src/app/providers/theme-store.ts`), before React renders. The first paint is already in the visitor's preferred theme. This is honored as an invariant: any future change that introduces a flash of wrong theme is a regression, not a tradeoff.

---

## The Geometric Figure

The Foyer's `GeometricFigure` rotates 360° over 60 seconds, linearly, infinitely. This is the slowest motion on the site by an order of magnitude.

**Why 60 seconds.** Faster — say, 30 or 20 seconds — and the rotation reads as decoration, something the visitor watches. At 60 seconds, the rotation is barely perceptible at any given moment; the visitor notices only if they sit. The figure becomes the room's heartbeat, the ambient pulse that proves the page is alive without performing it.

**Where the figure can appear.** Today, only on the Foyer. The figure is the site's body made literal — the architectural metaphor's most concrete moment. A future surface (a graph view, the time-slider drawer) might earn a second appearance, but each appearance dilutes the figure's weight. The default is that the figure stays in one room.

**Reduced motion.** When the visitor has `prefers-reduced-motion: reduce` set, the rotation should pause. This is not yet implemented in code; it is a `ACCESSIBILITY.md` concern noted here so the gap is visible. The figure should remain visible — it is structural — but it should not move.

---

## Hover and Focus

The site uses hover and focus to indicate interactivity, never to attract attention. Hover states are quiet ink shifts, never scaling, lifting, or color shifts to a different hue family.

**Standard interactive hover:** `--text-2` → `--text` over 200ms. The link gets darker; that's the entire affordance. The same pattern applies to nav labels, room links, and the theme toggle button.

**The wordmark Diamond:** on hover of the wordmark group, the Diamond rotates 45° over 300ms. This is the one playful gesture in the chrome — `DESIGN_SYSTEM.md` names it as "the one playful gesture the atom permits." It earns its keep because the Diamond is otherwise a static mark; the rotation suggests that the mark is alive.

**Focus styles.** Currently focus relies on browser defaults; visible focus rings appear on keyboard navigation. The design system has not yet defined a custom focus ring. This is a held question for `ACCESSIBILITY.md`; the architectural commitment is that focus is *never* invisible.

---

## Page and Route Transitions

Today, navigation between routes is instant — TanStack Router renders the new route immediately, and the new page's `Reveal` components run their own fade-in. There is no page-level transition.

**This is intentional for now.** A custom page transition is an opportunity for the site to perform a movement-through-the-house — but it is also an opportunity to over-perform. The site's restraint is the reason a future room-transition can feel like something. Adding it now would prematurely consume the surprise.

When a page transition arrives, it likely lives as a fade-of-the-old plus a Reveal-of-the-new, with a slight overlap. The duration would be in the same family as the existing motion (likely the 500ms theme-transition rhythm). The decision is held; the architectural ground is reserved.

---

## Scroll

The site does not customize scroll behavior beyond the default. Scroll is the visitor's pace; the site does not interfere.

- **No scroll hijacking.** No "scroll to next section" forcing, no scroll-snap on long pages, no programmatic scroll smoothing on link clicks beyond what the browser does naturally.
- **Anchor scrolls** (clicking `#section-id` links) use the browser's native smooth scrolling if `scroll-behavior: smooth` is set on `html` (currently it is not — the default jump is honest and fast).
- **Sticky elements** are limited to the nav. Nothing else sticks to the viewport. A site that wants to be a place should not have many things following the visitor down the page.
- **Scroll restoration** on back/forward navigation is the browser's default. TanStack Router preserves scroll position appropriately for the navigation type.

---

## Reduced Motion

The site honors `prefers-reduced-motion: reduce` as an explicit responsiveness commitment from `MEDIUM.md`'s responsiveness dimension. When the visitor signals reduced motion:

- The Reveal molecule should still reveal content (it is structural — content arriving is information) but instantly, without the 600ms fade or the 14px lift.
- The theme transition should be instant rather than 500ms.
- The geometric figure should pause (still visible, not rotating).
- Hover and focus transitions remain at their current durations — they are too short to constitute "motion" in the WCAG sense.

This is not yet implemented in code. The CSS `@media (prefers-reduced-motion: reduce)` queries that would honor it are a known gap, named here so it does not get lost. `ACCESSIBILITY.md` will own the implementation when it is written.

---

## What This File Does Not Govern

- **Performance budgets.** What is fast enough lives in `PERFORMANCE_BUDGET.md` (gap). This file says only that intentional slowness is distinct from unintentional slowness.
- **Accessibility specifics for motion** beyond reduced-motion behavior. WCAG 2.1 motion guidance, animation-pause controls, vestibular safety — held in `ACCESSIBILITY.md`.
- **Specific component animations** beyond the ones implemented today (Reveal, Diamond rotate, theme transition, geometric spin). Future components add motion under the conventions named here; the conventions are the spec, not the inventory.

---

## Enforced in Code

Today, the choreographic vocabulary lives in:

- `src/styles/tokens.css` — the `geo-spin 60s` animation, the `.reveal` and `.revealed` classes with their cubic-bezier curve.
- `src/app/providers/theme-store.ts` — module-level DOM class application that prevents theme flash.
- `src/shared/molecules/Reveal/Reveal.tsx` — the IntersectionObserver-driven reveal.
- `src/shared/atoms/GeometricFigure/GeometricFigure.tsx` — the 60s linear rotation.
- `src/shared/atoms/Diamond/Diamond.tsx` — the rotate-on-group-hover behavior.

Not yet implemented:

- Reduced-motion alternatives (`@media (prefers-reduced-motion: reduce)`).
- Custom focus ring styles.
- Page-to-page route transitions.

The order of arrival follows need: reduced-motion alternatives are the next implementation here because they are an accessibility gap. Page transitions and focus ring earn their place when the next design moment for them arises.

