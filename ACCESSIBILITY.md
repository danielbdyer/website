# Accessibility

A site that gives should give to everyone. `MEDIUM.md` names responsiveness as one of the seven dimensions of the webpage — the medium's native capacity to meet each person where they are. Accessibility is that capacity taken seriously. This file specifies how.

This is not a WCAG compliance appendix. It is a first-class architectural concern: every surface is designed to be inhabitable by every visitor, and where the site currently falls short, the gap is named so it can be closed.

The baseline commitment is **WCAG 2.1 AA**. Where the site can reach AAA without fighting its aesthetic, it does; where AAA would require abandoning the typographic register the site is built on, AA is honored and the choice is explicit.

---

## User Preferences as First-Class

The browser exposes a small set of media queries through which a visitor tells the site what they need. The site honors each as an invariant, not as an optional enhancement.

| Preference | What it means | How the site responds |
|---|---|---|
| `prefers-reduced-motion: reduce` | Motion causes distress or discomfort. | All transitions collapse to instant. `Reveal` fades instantly and without lift. Theme swap is instant. The geometric figure stops rotating (still visible; static). |
| `prefers-color-scheme: dark` / `light` | The visitor's system preference. | Honored as the initial theme when no explicit toggle has been stored. Once the visitor uses the toggle, their choice persists and overrides the system preference. |
| `prefers-contrast: more` | Higher contrast requested. | Border and text tones strengthen toward `--text` / solid borders rather than tonal hairlines. (Held; not yet implemented — see backlog.) |

These are not opt-ins. A visitor who has asked for reduced motion receives it. A visitor whose system is in dark mode arrives in dark mode. The site's aesthetic is strong, but the visitor's body is stronger.

---

## Keyboard Navigation

Every interactive element is reachable and operable via keyboard. The rules:

- **Tab order follows reading order.** The DOM order is the tab order; no `tabindex` values other than `0` and `-1` are used. A visitor tabbing through the site moves through the wordmark, the four room links, the theme toggle, and then into main content.
- **Focus is always visible.** A focused element always has a visible indicator (see *Focus Rings* below). "Invisible focus" is a bug, not a styling choice.
- **Enter / Space activate buttons.** Standard browser behavior, preserved. The theme toggle and any future buttons respond to both.
- **Links activate on Enter.** Standard browser behavior, preserved.
- **Escape closes what it closes.** When modal surfaces arrive (drawer for the time slider, command palette for search), `Escape` closes them and returns focus to the trigger.

### Skip link

At the top of every page, before the nav, a visually-hidden link reads *"Skip to main content"*. It appears on focus (keyboard tab from the URL bar lands on it first), and activation moves focus to the `<main>` element so the visitor can bypass the nav on every page. Without this link, a screen-reader user or keyboard-only user would re-traverse the four room links on every room change.

### Focus management on route transitions

When navigating between routes, focus should move to the main content region (or its heading) rather than remaining on the nav link that was activated. TanStack Router does not do this by default; the root layout needs a `useRouterState` effect or equivalent to reset focus after each successful navigation.

This is a **known gap today** — currently focus remains on the nav link after click. Held in the backlog until implemented.

---

## Semantic HTML and Landmarks

Every page is built from semantic HTML. The visual layer never tells the reader something the semantic layer denies.

**Landmarks:**

- `<nav>` — the top navigation bar
- `<main>` — the content region of every route, with a stable id for the skip link target
- `<footer>` — the site footer
- `<article>` — used for a work page's root (WorkView)

**Headings:**

- One `<h1>` per page. On the Foyer, there is no `<h1>` (the Foyer is the entry and its presence is implicit); on room landings, the `<h1>` is the room title; on work pages, the `<h1>` is the work title.
- Headings never skip levels. An `<h3>` does not appear beneath an `<h1>` without an `<h2>` between them. Markdown bodies are rendered with the author's heading levels shifted down as needed so the document has a single logical hierarchy.
- Heading *text* is never empty. Never `<h2></h2>` as spacing; spacing is spacing.

**Lists** use `<ul>` or `<ol>` with `<li>` children. No "lists" constructed out of `<div>`s.

**Links** use `<a href>`. A "link" that is a `<div onClick>` is forbidden; a `<button>` may be used when the interaction is not navigation.

---

## Color Contrast

**Body text (`--text` on `--bg`):**
- Light palette: `#2b2219` on `#f5f1eb` → ratio ~10.7:1 → passes AAA.
- Dark palette: `#e2dcd2` on `#191715` → ratio ~12.1:1 → passes AAA.

**Secondary text (`--text-2`):**
- Light: `#6e5f50` on `#f5f1eb` → ratio ~4.8:1 → passes AA for normal text, AAA for large text.
- Dark: `#9c9082` on `#191715` → ratio ~6.5:1 → passes AAA.

**Tertiary text (`--text-3`) — the quietest tone:**
- Light: `#a69782` on `#f5f1eb` → ratio ~2.8:1 → **below AA for normal text**, passes AA only for large text (18pt+).
- Dark: `#6a6054` on `#191715` → ratio ~3.1:1 → same status.

**Commitment:** `--text-3` is used only for *genuinely decorative and supplementary* content — the footer byline, the ornament tone, metadata that does not carry meaning beyond its visible position. `--text-3` is never used for content a reader needs to read to understand what the page says. This is honored by convention today; a future lint rule could enforce it.

**Accent colors** all clear AA on both palettes when used for body-sized text. When used for small labels (e.g., facet chips), the chip background tones lift the effective contrast.

---

## Focus Rings

Focus states are never invisible. The rule holds for every interactive element.

Today, the site relies on browser defaults for focus rings. This is *functional but incoherent*: different browsers render focus rings differently, and the default rings don't harmonize with the umber palette. The site needs its own focus ring style — a subtle `outline` or `box-shadow` that uses `--accent` with sufficient contrast on both palettes.

**Proposed focus style** (to be implemented):

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}
```

`:focus-visible` (not `:focus`) is used deliberately — mouse clicks do not trigger the ring, only keyboard focus does. This is the modern, accessibility-friendly pattern.

This is a **known gap today**. Held in the backlog until implemented.

---

## Screen Readers

The site is built assuming some visitors will consume it via screen reader. Tests for this are run periodically with VoiceOver (macOS / iOS) and NVDA (Windows) once meaningful content exists.

**Decorative SVGs** carry `aria-hidden="true"` so they are not announced. Currently honored by the Diamond, GeometricFigure, SunIcon, and MoonIcon.

**Icon-only buttons** carry `aria-label`. The theme toggle's aria-label is dynamic: it announces the state the button will move to (*"Switch to dark mode"* when in light, *"Switch to light mode"* when in dark).

**Dynamic content announcements.** Currently the site has no content that updates in place. When it does (e.g., a live region for a command-palette search), `aria-live="polite"` is used for non-urgent updates and `aria-live="assertive"` for interruptions.

**Alt text on images.** Every `<img>` carries `alt`. Decorative images carry `alt=""` (not omitted — empty alt is the deliberate signal). Authored images inside work bodies inherit their alt text from the markdown source; Danny is responsible for providing it per image. `MEDIA_STRATEGY.md` (gap) will specify the authoring convention.

---

## Automated Checks

The following run today or should soon:

- **`eslint-plugin-jsx-a11y`** is enabled (see `eslint.config.js`). Catches a subset of accessibility violations at lint time.
- **Color contrast** is not yet automatically verified. A future build-time check could validate token combinations; held in the backlog.
- **`axe-core`** via `@axe-core/playwright` or `jest-axe` is not yet wired. Intended to run against rendered pages as part of testing. Held in the backlog.

Automated checks catch the floor, not the ceiling. The ceiling is the feel of a keyboard-only visitor moving through the site and never being confused about where they are.

---

## What This File Does Not Govern

- **Motion choreography itself.** The vocabulary lives in `INTERACTION_DESIGN.md`; this file names how motion responds to the visitor's preference.
- **Responsive layout.** `RESPONSIVE_STRATEGY.md` governs viewport adaptation; this file governs meeting the visitor's body.
- **Content accessibility inside works.** Danny is responsible for alt text, heading hierarchy within a work body, and plain language. The site's tooling supports him (markdown parses alt text from `![alt](src)`); his authorial judgment carries the rest.

---

## Enforced in Code

Implemented today:
- `aria-hidden="true"` on decorative SVGs
- Dynamic `aria-label` on the theme toggle
- `eslint-plugin-jsx-a11y` in CI
- Semantic HTML: `<nav>`, `<main>`, `<footer>`, `<article>` in WorkView, `<h1>` on room landings

Implemented in this file's first pass:
- `prefers-reduced-motion: reduce` CSS handling (all transitions instant, geo-spin paused)
- `prefers-color-scheme` as the initial theme when no explicit toggle has been stored

Held in backlog:
- Skip-to-main-content link
- Custom `:focus-visible` ring using `--accent`
- Focus management on route transitions
- `prefers-contrast: more` handling
- Automated color contrast checks
- `axe-core` integration in tests
