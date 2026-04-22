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

**Proposal: these four stay held, not assigned.** They are vocabulary, not semantics. No code currently branches on them, and the design system does not assign them to rooms, facets, or any other domain concept today. This mirrors the move in `DOMAIN_MODEL.md` with Modes: the concept is named so its arrival has a place to land; the assignment waits for spanda.

**What each evokes** (first-pass character, not a binding):

- `--accent-warm` — the hand, the workshop, clay
- `--accent-rose` — living growth, seasonal, bloom
- `--accent-violet` — the quiet hour, contemplation, evening study
- `--accent-gold` — music, warmth seen rather than felt, candlelight

**Not mapped to rooms.** The most obvious use of five accents on a five-room site would be to give each room a color. This is declined. Rooms are atmospheres and rhythms, not hues; the umber ground is continuous across rooms because the site is one house, not five themed sections. Mapping accent-to-room would collapse the rooms into colored tabs and fight the continuity the site is trying to hold.

**When an accent earns its assignment**, the design system gains a new named token (e.g., `--facet-craft` or `--highlight-seasonal`) that *references* the hue but has its own name. The four vocabulary tokens stay general; the meaning-bearing tokens stay specific. This keeps the palette's character and the site's semantics each free to evolve without pulling on the other.

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

**No sans-serif fallback layer.** The system loads both serifs from Google Fonts via `index.html` with a `swap` strategy. If a font fails to load, the browser uses the generic serif fallback (Georgia). There is no system sans-serif in the hierarchy. A sans-serif surface would read as a different medium — and the site is not trying to be two media. `PERFORMANCE_BUDGET.md` (gap) will own the tradeoff between font weight and load time; this file owns the commitment that the fallback stays serif.

---

## Space and Rhythm

**The column is narrow.** The main content column is capped at 700px and centered, with 24px horizontal padding on smaller viewports. This is the width of a short-story page, not a website. It is the width the typography wants. A wider column would demand a different line height and a different type size; the narrow column is what allows `1.8` leading at 16px to feel like a page rather than a wall.

**Vertical rhythm is unhurried.** The header is 20px tall; the main's top padding is 32px; its bottom padding is 96px. The footer breathes at the end with 32px below. Nothing in the rhythm announces itself. The page should read as if there's more room below than the visitor needs.

**The ornament marks the edges of concern.** The `Ornament` molecule — a hairline with a Diamond centered between two line segments — is the site's section break. It appears at the top of the footer and should appear wherever a concern ends. It is the typographic equivalent of a space between poems: the reader rests, then reads on.

**No dense grids.** The site does not use a grid system of columns. The layout is a single narrow column with a header above and a footer below. When two things want to sit side by side (the geometric figure and the foyer text, on the index page), they do so via an ad-hoc flex with generous gap. The decision to introduce a repeated grid pattern belongs to a future design-system moment, not now.

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
