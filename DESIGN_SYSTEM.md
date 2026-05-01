# The Design System

This file names the visual language of the site and the reasons behind it. The token values themselves live in `src/styles/tokens.css` — that file is the machine-readable source of truth. This file is the human-readable companion: *why* umber, *why* serif, *why* paper grain, *why* these five accents and not others. When the two disagree, the tokens describe what the site currently looks like; this file describes what the site is trying to be.

The design system is the outside trunk's root in `SPECIFICATION_MAP.md`. It is the atmosphere the rooms are built in. `INTERACTION_DESIGN.md` (gap) will extend it into time; `VOICE_AND_COPY.md` (gap) will extend it into language; `INFORMATION_ARCHITECTURE.md` (gap) will extend it into wayfinding. This file holds the surface — color, type, space, material — and gestures at the others only enough to keep the seams honest.

---

## Warmth Over Polish

The single phrase that holds the aesthetic is *warmth over polish*. It is the design principle inherited from the project's early foundation and the one line that best predicts any visual decision: if a choice makes the site more polished at the cost of warmth, the choice is wrong.

Polish is the look of having optimized. Warmth is the feel of having chosen. A polished site is legible at a glance and forgettable by the evening. A warm site is a room you'd want to sit in. This site is trying to be the second thing. The decisions below — paper ground, serif typography, umber palette, slow transitions, a grain you can almost feel — are all downstream of this one phrase.

Professional legibility is still a constraint. The site is readable, accessible, performant, and navigable. But between two equally legible options, the warmer one wins. Between a polished option and a warmer option that costs a little polish, the warmer one wins. The site is not performing competence for a judge; it is opening a door for a visitor.

---

## Materiality

`MEDIUM.md` names materiality as one of the seven dimensions of the webpage as medium — the quality that "users perceive bodily, the way you feel a room's acoustics before you think about them." `CLAUDE.md` names the material the site is trying to feel like: *paper grain, umber palette, serif typography, slow transitions.* The design system's job is to keep those four material qualities coherent across every surface, so that the site's body stays continuous from one room to the next.

**Paper is the ground.** The base surface — `--bg`, `--bg-warm`, `--bg-card` — reads as paper, not as screen. A fractal-noise grain overlay at low opacity (`--grain: 0.025` in light, `0.035` in dark) sits as a fixed, non-interactive layer above the background. It is the single most important material decision in the system: without it, the site is an off-white webpage; with it, the site is a page. The grain is present on every surface, which is why it lives on the body, not on components. Components compose over paper; they do not need to carry paper themselves.

**Shadows are weight, not depth.** The shadow tokens (`--shadow-sm`, `--shadow`, `--shadow-lg`, `--shadow-lift`) describe a surface's presence on the paper, not its distance from the screen. A card sits; it doesn't float. Shadow values are tuned to be felt, not seen — if a visitor notices the shadow, it's probably too much.

**Borders are quiet.** `--border` and `--border-lt` are soft, close in value to the paper ground. They exist to separate, not to frame. A visible hairline is already a lot.

**Dark mode is the same room, dimmed.** The palette shifts, but the materials stay: paper, grain, shadow, border. Dark mode is not an inversion, not a different space — it is the room you enter after the lamp goes off. The umber doesn't become blue; it becomes the color umber is when there is less light in the room. This continuity is an invariant: if a future palette change would make dark mode feel like a different place rather than the same place dimmed, it is wrong.

---

## Palette

### The umber ground

The base palette is umber — warm, paper-adjacent, earth-toned. Not brown, not beige: umber. The name matters; it sets the expectation that the ground is not neutral. Every surface, every text color, every border belongs to the umber family. A color that doesn't belong to the umber family does not belong on this site.

Three ground tones hold the surface:

- `--bg` — the paper ground, the room's light
- `--bg-warm` — a shade darker, for contrasting regions and muted tags
- `--bg-card` — a shade brighter than `--bg`, for raised paper

Three text tones hold the voice:

- `--text` — the deepest readable value, for running prose
- `--text-2` — muted, for italic voice and secondary lines
- `--text-3` — barely-there, for the footer, the ornament, the quiet metadata

The dark palette holds the same six roles at lower luminance. `--bg` in dark is what `--bg` in light *is* when the room has less light.

### The accents — one primary, four held

One accent does nearly all the work: `--accent`, a muted green (`#4a7c6a` in light, `#6aae92` in dark). This is the site's voice in the palette — the link color, the hover state, the Diamond atom, the nav's active state. Every interactive surface earns its tint from this single accent. `--accent-hover` is the same hue slightly deepened, used on pointer hover and focus.

Four additional accent hues are defined in `tokens.css` and currently unused in code:

- `--accent-warm` — terracotta
- `--accent-rose` — muted rose
- `--accent-violet` — dusk violet
- `--accent-gold` — candlelight gold

**These four were held, not assigned, until the constellation arrived.** They were vocabulary, not semantics. No code branched on them, and the design system did not assign them to rooms, facets, or any other domain concept — the assignment waited for spanda. The first surface where they speak aloud is **the constellation** (`CONSTELLATION.md`). There, and there only, the eight facets pair with the four hues editorially:

| Hue | Facets |
|---|---|
| `--accent-warm` | `craft`, `body` |
| `--accent-rose` | `beauty`, `language` |
| `--accent-violet` | `consciousness`, `becoming` |
| `--accent-gold` | `leadership`, `relation` |

The pairing lives in TypeScript at `src/shared/content/constellation.ts` (`FACET_HUE`). Two facets share each hue by design — eight facets across four colors, with the difference legible in the *position* a star occupies in the sky and the *label* the thread surfaces on hover, not in an exhaustive eight-color palette.

**The held discipline still holds for the rest of the site.** Facet chips on work pages, in the toggle bar, and in the outward invitation remain neutral (`--tag-bg` / `--tag-text`). The held accents do not leak out of the constellation. A future surface that earns its own use of one of the four (a graph view inside a work page, a color-aware facet badge somewhere) would be a separate decision named in writing — not an automatic extension of the constellation's vocabulary.

**What each evokes** (first-pass character, not a binding):

- `--accent-warm` — the hand, the workshop, clay
- `--accent-rose` — living growth, seasonal, bloom
- `--accent-violet` — the quiet hour, contemplation, evening study
- `--accent-gold` — music, warmth seen rather than felt, candlelight

**Not mapped to rooms.** The most obvious use of five accents on a five-room site would be to give each room a color. This is declined. Rooms are atmospheres and rhythms, not hues; the umber ground is continuous across rooms because the site is one house, not five themed sections. Mapping accent-to-room would collapse the rooms into colored tabs and fight the continuity the site is trying to hold.

**When an accent earns an assignment, the assignment lives in the surface that uses it, not in the global palette.** The vocabulary tokens (`--accent-warm`, etc.) stay general; the *editorial pairing* — which facet wears which hue — lives in TypeScript at the surface that consumes it (in the constellation's case, `FACET_HUE` in `src/shared/content/constellation.ts`). The CSS palette doesn't gain a `--facet-craft` token, because two facets share each hue and a one-to-one CSS rename would clutter the palette without adding meaning. The decoupling the design system wants — palette free to evolve without pulling on semantics, and vice versa — is preserved by keeping the pairing in code and the values in tokens. A future surface that needs a *different* pairing (a Studio-only highlight, a seasonal accent) would name its own pairing in its own file. The held vocabulary stays vocabulary; each surface speaks it editorially.

### Derived surfaces

`--hl-bg` (the highlight tint behind selection or emphasis) and `--tag-bg` / `--tag-text` (the lozenge for small metadata) are tuned surfaces, not accents. They live alongside the accents in `tokens.css` but serve a different role: they are *backgrounds for type*, not *voices of type*. Treating them as accents would over-saturate the page.

---

## Typography

The site reads as paper. The typography is how that reading happens. Two serif families carry the whole system.

**Body type is Literata.** A serif designed for long reading, with generous x-height and quiet contrast. It is the voice of the site's prose — essays, poems, the body of every work. It is set at 16px / 1.8 leading on body, tuned for breath rather than density. Italic Literata carries the muted secondary voice (`--text-2`) — room descriptions, asides, the italic line the site uses when it wants to sit back.

**Heading type is Newsreader.** A serif with more optical size variation and a more declarative gesture. It carries titles, nav identity, and the few moments of the site that want to stand slightly apart from the running prose. The nav's "Danny Dyer" wordmark is set in italic Newsreader; room titles (`The Garden`, `The Studio`) are set in Newsreader at a gentle weight.

**Two serifs, not one.** The most common serif-site choice is a single family doing everything. Two serifs is a deliberate decision: Literata and Newsreader hold slightly different registers, and the interplay between them is part of the site's material. When a heading meets running prose, the eye should register a shift — not a jolt, a turning of the page. A single serif across both roles would flatten that shift.

**Italic carries voice.** Italic is used for a specific register: the site speaking about itself, the quiet metadata voice, room descriptions that want to invite rather than announce. Italic is not decorative emphasis and not a replacement for `<em>`; when the body calls for emphasis in prose, that's `<em>` in roman Literata. The italic treatment belongs to the *frame* around the works — nav, room headings, ornament captions — not to the works themselves.

**Line height is generous.** `1.8` body leading is looser than a product site's default (typically `1.4`–`1.6`) and is part of the "slow on purpose" choice. A visitor's eye moves down the page at a slower rate; the page breathes. This is a deliberate fight against the compressed typographic rhythm of feeds and dashboards.

**No sans-serif fallback layer.** Both serifs are self-hosted via `@fontsource-variable/literata` and `@fontsource-variable/newsreader`, loaded from `src/styles/tokens.css` with `font-display: swap`. If a font fails to load, the browser uses the generic serif fallback (Georgia). There is no system sans-serif in the hierarchy. A sans-serif surface would read as a different medium — and the site is not trying to be two media. `PERFORMANCE_BUDGET.md` owns the tradeoff between font weight and load time; this file owns the commitment that the fallback stays serif.

### The type scale

The site's surfaces speak at distinct typographic registers. Each register has a name and a fluid size, so a redesign of the scale is a single edit to `tokens.css` and component code reads as intent (`text-display`, `text-meta`) rather than magic numbers. Sizes use `clamp()` so the page scales smoothly between phone and tablet without a discrete breakpoint jump — the column is the column, but the type inside it can flex within a small range.

| Token | Range | Surface |
|---|---|---|
| `text-display` | ~34 → 42px | Room landing titles (`The Studio`, `The Garden`). The room announcing itself. |
| `text-title` | ~35 → 38px | Work page titles. Slightly smaller than display because a single work is held inside a room, not above it. |
| `text-heading` | 22 → 23px | Work-entry titles inside a room's list. Headings that compose, not headings that announce. |
| `text-deck` | 18 → 19px | Italic heading-voice for short evocative lines — the Foyer welcome, the 404 message, the ErrorBoundary fallback. |
| `text-body` | 15.5 → 16.5px | Italic room descriptions on landings — the room's secondary voice. |
| `text-prose` | 16px (1rem) | Paragraph base size for `.prose`-rendered work bodies. Pinned to the `html` root so 1em math holds. |
| `text-list` | 15 → 15.5px | Summaries in work lists, the outward invitation, the skip link. |
| `text-kicker` | 14px | Directional navigational chrome (`← The Garden`). Quieter than body, deliberately. |
| `text-meta` | 13 → 13.5px | Dates, preview notes, salon postures — the metadata register. |
| `text-nav` | 12.8px (0.8rem) | Top-nav labels. |
| `text-chip` | 12px | Facet chips. |
| `text-footer` | ~11.5px (0.72rem) | Footer identity. |
| `text-micro` | 10.5 → 11px | Uppercase eyebrow labels (`DRAFT`), image-slot captions. |

Line-heights are not bound to size tokens. The same `text-prose` paragraph at 16px wants `leading-1.8`; an italic deck at 18px wants `leading-1.55`; a heading at 22px wants `leading-1.25`. Components apply leading via `leading-*` utilities at the use site. This separation is deliberate — leading is a function of register, not size, and a one-to-one binding would over-couple the system.

**Inline `text-[…]` sizing is a smell.** If a component reaches for an arbitrary value, the scale is incomplete. The fix is to name the new register, add it to `tokens.css`, and document it in this section — not to ship a magic number.

---

## Space and Rhythm

**The column is narrow.** The main content column is capped at 700px (the `--container-column` token) and centered. Horizontal padding starts at 40px on phones and steps to 48px from the `sm` breakpoint up — the `--spacing-edge` and `--spacing-edge-md` tokens, both wrapped in `max(…, env(safe-area-inset-*))` so notched and home-indicator devices get more when they need it. This is the width of a short-story page, not a website. A wider column would demand a different line height and a different type size; the narrow column is what allows `1.8` leading at 16px to feel like a page rather than a wall.

**The gutter is generous on purpose.** A naked left edge — text starting at the screen border — reads as content dropped onto the screen rather than content placed in a room. The page-edge values are sized so that even on a 430px viewport, the column feels held. The principle: every block of content has square space around it that distances it from a local border. Apple-flavored, not Apple-literal.

**Vertical rhythm is unhurried.** The main's top padding is 24px on mobile and 32px from `sm` up; its bottom padding is 80px on mobile and 96px from `sm` up. The footer breathes at the end with 32px below (plus iOS safe-area inset where present). The mobile/`sm` step is intentional — the header is proportionally heavier on a small viewport, and 96px of bottom margin against a 700px-tall mobile screen would over-weight the foot of the page. Nothing in the rhythm announces itself. The page should read as if there's more room below than the visitor needs.

**The ornament marks the edges of concern.** The `Ornament` molecule — a hairline with a Diamond centered between two line segments — is the site's section break. It appears at the top of the footer and should appear wherever a concern ends. It is the typographic equivalent of a space between poems: the reader rests, then reads on.

**No dense grids.** The site does not use a grid system of columns. The layout is a single narrow column with a header above and a footer below. When two things want to sit side by side (the geometric figure and the foyer text, on the index page), they do so via an ad-hoc flex with generous gap. The decision to introduce a repeated grid pattern belongs to a future design-system moment, not now.

### The spacing ladder

The site uses Tailwind's 4px base as substrate, but commits to a curated subset — eleven rungs, each with a felt purpose. Anything off the ladder is a smell that earns a defense in writing.

| Rung (4px units) | Pixels | Where it lives |
|---:|---:|---|
| `2` | 8 | Within-card seams (meta→title, title→summary), chip↔chip vertical when wrapped. |
| `2.5` | 10 | Chip↔chip horizontal. |
| `3` | 12 | Inline label gaps (kicker↔date, DRAFT↔date, content→chips). |
| `4` | 16 | The room-title→deck `mb-4` half. |
| `6` | 24 | Page top on mobile, room-title `mt-6`. |
| `8` | 32 | Page top from `sm` up. |
| `10` | 40 | Room deck→list (`mb-10`), the canonical room-list rhythm, the WorkView closing line. |
| `12` | 48 | Within-work major break (chips→body, body→Ornament on mobile). |
| `14` | 56 | Room deck→list at `sm` and up. |
| `16` | 64 | Within-work major break at `sm` and up; facet-page room-group gap. |
| `24` | 96 | Main bottom from `sm` up — the "more room than you need." |

**Inline arbitrary spacing (`pl-[…]`, `mb-[…]`) is a smell** outside two specific cases: the negative-pull pattern (`-mt-4`, `sm:-mt-6`) used once on room-landing preview notes, and the three single-use leadings called out below. Both are held as backlog items with triggers; if either pattern repeats, it earns a token.

### Chrome tokens

Some values aren't ladder positions — they're *places*. Each earns a `@theme` token because it's load-bearing and site-specific.

| Token | Value | Where it lives |
|---|---|---|
| `--spacing-edge` | `max(2rem, env(safe-area-inset-left))` | Layout-shell horizontal padding (mobile). The page edge. |
| `--spacing-edge-md` | `max(2.5rem, env(safe-area-inset-left))` | Layout-shell horizontal padding (`sm`+). |
| `--spacing-edge-bottom` | `max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))` | Footer bottom — honors iOS home-indicator. |
| `--spacing-page-top` / `-md` | `1.5rem` / `2rem` | Main top padding (24/32). |
| `--spacing-page-bottom` / `-md` | `5rem` / `6rem` | Main bottom padding (80/96). |
| `--spacing-touch` | `44px` | WCAG 2.1 AAA touch-target floor. |
| `--container-column` | `700px` | The reading column — a typographic measure, not a layout one. |
| `--container-deck` | `540px` | The italic deck on landings, narrower so its measure matches its register. |
| `--container-preview` | `620px` | Preview-note paragraphs. Mid-width. |

### Semantic aliases (capped at three)

Three names for site-specific *gestures* the ladder cannot encode and that multiple components reference. The cap is deliberate — semantic aliases proliferate easily, and "section" is too vague to carry the difference between a room landing's deck-end and a work view's chip-end. A new alias earns its place only when a gesture is named in the spec and used by 2+ components.

| Token | Value | Gesture |
|---|---|---|
| `--spacing-room-rhythm` | `2.5rem` (40px) | Between work entries in a room list; the WorkView closing-line gap. |
| `--spacing-work-break` | `3rem` (48px) | Within a work, between major beats (chips→body, body→Ornament on mobile). |
| `--spacing-work-break-md` | `4rem` (64px) | Same gesture from `sm` up (Ornament arrival, facet-page between-room-group gap). |

The tokens are named for what the eye does (`rhythm`, `break`) rather than the CSS property (`gap`, `spacing`). The site's whole register is rhythmic; the names align with the voice.

### Leading palette

Line-heights are named by register, not by number, so a future tuning ("prose-breath 1.8 → 1.85") is one edit and not a refactor of every `leading-[1.8]`.

| Token | Value | Surface |
|---|---|---|
| `leading-display` | 1.05 | Room-landing h1. |
| `leading-title` | 1.12 | Work-page h1. |
| `leading-heading` | 1.25 | Work-entry titles in lists. |
| `leading-meta` | 1.65 | Preview notes, italic meta paragraphs. |
| `leading-body` | 1.7 | Summaries, italic decks, the running register. |
| `leading-prose` | 1.8 | `.prose` paragraphs (body element default). |
| `leading-closing` | 1.9 | The outward-invitation exhale — the slowest reading register. |

Three single-use leadings (`leading-[1.4]` on image-slot captions, `leading-[1.55]` on the Foyer welcome lines, `leading-[1.6]` on Salon postures) stay inline by design. Tokenizing now is anticipation; a second use of any of them graduates the value into the palette.

### Tracking palette

| Token | Value | Surface |
|---|---|---|
| `tracking-display` | -0.01em | Display + title h1. Tightens wide headings. |
| `tracking-meta` | 0.02em | Dates, secondary metadata, facet chips. |
| `tracking-posture` | 0.04em | Salon postures inline list. |
| `tracking-nav` | 0.05em | Nav labels. |
| `tracking-eyebrow` | 0.08em | DRAFT, kicker uppercase eyebrows. The loudest tracking on the site. |

The body default (0) is not named — it's Tailwind's default and naming it would over-disambiguate.

### The discipline

Spacing stays fixed; type stays fluid (`clamp()`). Five paired `sm:` values for spacing exist (`pt-page-top sm:pt-page-top-md`, etc.) and stay paired by design — a register change between phone and tablet is a design event, not a smooth curve. The `clamp()` discipline belongs to typography, where the column wants to flex inside one width.

---

## Motion as Material

Motion in this site is a dimension of the medium, not a decoration. `MEDIUM.md` names temporality as one of the seven dimensions of the webpage; `INTERACTION_DESIGN.md` (gap) will own the full choreographic vocabulary — easing curves, duration philosophy, scroll pacing, the dark-mode transition as a room dimming, and the geometric figure that rotates over a full minute. This file gestures only: the tokens encode a cubic-bezier `0.23 1 0.32 1` for reveal motion, a 500ms cross-fade for theme changes, and a 60s linear spin for the geometric ornament (`--animate-geo-spin`). Those values are not incidental; they are material choices that belong to the design system and whose philosophy lives downstream.

---

## Ornamental Vocabulary

The site has two ornaments so far, both small and deliberate.

**`Diamond`** — a 10×10 viewBox SVG rotated square filled with `currentColor`. It appears at three scales: 5px (inside the Ornament, as a tone-on-tone divider mark), 6px (default, for inline use), and 7px (inside the nav, paired with the wordmark). The Diamond is the site's smallest typographic voice — it says "a small marker of presence" without saying more than that. On hover in the nav, it rotates 45°; this is the one playful gesture the atom permits.

**`Ornament`** — a horizontal rule, composed as a hairline / Diamond / hairline. It marks the end of a concern. It lives in `shared/atoms/` today but behaves more like a molecule (composed from Diamond + two line segments); this is a small structural inconsistency that will resolve when the atom/molecule boundary is re-examined.

Future ornamental additions — a seasonal mark, a facet glyph, a room-specific device — will compose from these primitives rather than invent new ones, until the vocabulary earns new words.

---

## Tokens

The machine-readable source of truth is `src/styles/tokens.css`. Every decision in this document corresponds to a token or a small set of tokens there, exposed to Tailwind through the `@theme` block so components can write `bg-bg`, `text-text-2`, `border-border` rather than `bg-[var(--bg)]`.

If a component introduces a color, a shadow, a font family, or a duration that is not already a token, the design system grows — and this file and `tokens.css` grow together. Inline hex colors in components are a signal that the system is incomplete; the fix is to name the value here, add it to tokens, and reference it by name.

The tokens file is the design system's body. This document is what the body knows about itself.
