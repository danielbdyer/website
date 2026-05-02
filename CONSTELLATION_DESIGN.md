# Constellation Design

*Working document for visual and interaction design of the latent-sphere navigation surface. The companion to `CONSTELLATION.md` (the held experience) and `CONSTELLATION_HORIZON.md` (the technical envisioning). This file holds **the design read** — what a designer needs to produce hi-fi mockups, storyboard alternatives, and hand off to engineering.*

> **A place, not an interface.**

---

## How to use this document

This file enumerates the **surfaces** /sky can be in, the **components** that compose those surfaces, the **flows** that move the visitor between them, and the **design variants** worth exploring for each held question. The goal is that a designer can sit with this document and start sketching — knowing what states need mocking, what hierarchy each contains, what alternatives are open for proposal, and what's already settled.

The conventions:

- **Surfaces** are named states. Each surface is a single mockup. A flow is a sequence of surfaces.
- **Components** are reusable pieces that appear across surfaces. Each has anatomy (parts), states (variations), and constraints (what it must not become).
- **Variants** are *open design questions* with multiple proposed answers. A designer is welcome to add more.
- **Storyboards** are numbered frames for the canonical flows. Each frame names the surface and the changes from the previous frame.
- **Visual language** is specified at the design level (relative scale, hierarchy, register) — not at the implementation level (pixels, ms, easing curves). Implementation specifics live in `CONSTELLATION_HORIZON.md` and the source.

This document does not commit to a final design. It commits to the *surface area of design decisions* that must be made for the experience to be honest. When a designer makes a proposal against a variant, they're closing one of the held questions; the variant section gets pruned and the surface inventory updates.

---

## Foundation

Six principles that constrain every design decision in /sky. If a proposal violates one, the proposal is wrong (or the principle needs an explicit revision in this doc, not a silent override).

- **World-like navigation** — the visitor moves through space, not menus. Hierarchy is spatial, not categorical.
- **Quiet chrome** — controls retire when not invoked. The constellation is the surface; chrome is below.
- **Continuous reachability** — every state is reachable from any other in at most two gestures. No mode locks the visitor in.
- **Spatial reading** — content has place; place has content. The same star always sits in the same region of the sphere.
- **Second-voice microcopy** — the system speaks in italic, never in directives. "the constellation by name…" never "Search the constellation."
- **Serif-only language** — no sans-serif anywhere in /sky. The sky speaks in the same voice as the rest of the site.

---

## Brief

The visitor encounters a small spherical world holding every work the site has authored. They navigate it continuously by gesture, keyboard, or assistive technology. They can wander, filter, search, mark places to return to, view the constellation as it was at past dates, and open any star to read the work. All chrome retires when not invoked. Every state must be reachable from any other in at most two gestures. The experience must feel like visiting a place, not operating an interface.

---

## Aesthetic / Visual Tone

The genre is **library-of-the-cosmos**: a 19th-century star atlas printed on rag paper, kept in a study with good light. Astronomical romanticism — but quiet, scholarly, working. Not space-themed product UI. Not a gallery. Not a feed.

A designer producing mocks for /sky should feel like they're drafting in a folio kept on a working table — every mark made deliberately, no ornament that doesn't carry meaning, no marketing sheen. The reference is the printed page, not the screen.

**Genre coordinates:**

- **Star atlas, watercolor field guide, library notebook** — yes
- **App store screenshot, dashboard, gallery wall, dataviz** — no

**Materials the surface is made of:**

- Paper grain, visible across every background
- Watercolor halos with paper-bleed edges (never mathematically circular)
- Brushstroke threads (tapered, varied, hand-drawn quality)
- Gold linework on titles, ornamental rules, and active states
- Cloud-like watercolor washes in title regions and around the polestar
- Single-stroke iconography (no fills, no rounded software-icon corners)

**Compositional signature:**

- Twin-sphere headers (one daylight, one night) framing major surfaces
- Numbered sections marked with eight-point star numerals
- Asterism-like decorative dividers between sections
- Generous gutters; dense information through hierarchy, not crowding
- Tables and lists arranged for scannability; never for ornament

**Emotional register (in order of priority):**

1. **Reverent** — the work is treated as devotional. Headings carry weight.
2. **Functional** — this is working material; it must be usable, not just admired.
3. **Warm** — paper-and-umber palette; never cold tech.
4. **Quiet** — low contrast at rest; no element shouts unless invoked.
5. **Of-a-piece** — every mark belongs to the same hand. Nothing imported from outside this aesthetic.

**The discipline this demands of designers:** if a mock looks like it could ship today on a typical SaaS site, the mock is wrong. If it looks like a careful page from a printed journal of celestial observations — possibly hand-bound — the mock is on register.

---

## What /sky Is NOT

The negative space is as important as the positive. /sky is **none of the following**, and proposals that drift toward any of these need to be redirected.

- **Not a graph database visualizer.** Force-directed layouts, network diagrams, edge-bundling, expandable nodes — wrong genre. The constellation is authored, not algorithmic.
- **Not a gallery.** No grid of thumbnails, no card view, no masonry, no carousel. The constellation is a *world*; a gallery is a *collection*.
- **Not a feed.** No reverse-chronological list, no infinite scroll, no "more like this" recommendations. Time is dimensional, not sequential.
- **Not a dashboard.** No KPIs, no widgets, no panels of indicators. /sky doesn't measure; it inhabits.
- **Not a CMS interface.** No edit-in-place, no admin chrome, no content-management affordances. The author lives elsewhere; the visitor lives here.
- **Not a 3D product tour.** No camera-on-rails reveals, no narrated arrival, no "click to continue." The visitor's wandering is the experience, not a script through it.
- **Not a game.** No score, no quest, no objective, no progression. There is nothing to "unlock"; everything is reachable from any state.
- **Not a tutorial.** No tooltips chained to first-visit. The Demonstration state shows, doesn't tell.
- **Not a social surface.** No comments, no reactions, no other-visitor presence (held, but firmly held). The constellation is intimate.
- **Not minimalist.** The aesthetic is rich — paper grain, watercolor bleed, gold ink. "Quiet" is not "minimal"; the mockups have a lot of texture, just none of it shouting.

When a proposal pulls toward any of the above, the question isn't "how do we adapt this," it's "what does the constellation's *own* answer to this need look like?"

---

## Constellation Lexicon

Every constellation surface speaks in this small vocabulary. Designers should use these words in mocks, microcopy, and annotations; engineers should respect them in identifiers and comments. New terms enter the lexicon only when an existing one cannot carry the meaning.

- **Star** — a single work. Addressable. Always a real link.
- **Thread** — a relationship between two stars. Decorative in assistive output; meaningful visually. (Facet co-membership today; wikilinks once the resolver activates.)
- **Basin** — a collection of stars the cursor can settle into. A named gathering — the editorial equivalent of an asterism. *Note: the per-star gravitational well that draws the cursor is referenced in code as `BASIN_RADIUS_RAD`; for design conversation, "basin" means the named cluster.*
- **Facet** — a curatorial angle works share. Eight in the site's vocabulary.
- **Horizon** — the temporal edge. Where time lives in the chrome. The horizon strip's position is metaphor as much as layout.

## Visual Cues

The named motions that signal state changes. Designers should call these by name in mocks; engineers should match the visual language at the implementation level.

- **Halo claim** — a gentle ring affirms an owned or focused star. The room becoming attentive to you. Visible at `BasinSettled` (S6) and `Hover` (S3).
- **Radial action bloom** — choices branch outward from the cursor center when settled. The radial echo unfolding. Visible at `RadialEcho` (S7).
- **Strip thickening** — the horizon grows slightly to anchor time and place when filters or time-scrubbing are active. Visible at `FilterActive` (S9) and `TimeScrubbed` (S10).
- **Atmosphere dimming** — motion and luminance recede when the visitor goes quiet. The constellation continuing without you. Visible at `Contemplative` (S15).
- **Overlay veil** — content takes focus, the cosmos steps back. The work content sharpens; the constellation softens behind. Visible at `WorkOpen` (S13).

---

## Surface Inventory

Every named state /sky can be in, in roughly the order a visitor encounters them. Each is a single design surface to mock.

| ID | Surface | Trigger | Settles when |
|----|---------|---------|--------------|
| **S0** | `Arrival` | Visitor lands on /sky from anywhere | Carpet roll completes (~1.4 s) |
| **S1** | `Demonstration` | Arrival completes | Cursor finishes 600ms autonomous drift to nearest star |
| **S2** | `Idle` | Demonstration completes | No interaction for >0 s; cursor at a basin or at polestar |
| **S3** | `Hover` | Pointer enters a star's vicinity | Star reveals its label |
| **S4** | `Dragging` | Pointer down on the surface | Pointer up |
| **S5** | `Coasting` | Drag releases with momentum | Cursor settles into a basin |
| **S6** | `BasinSettled` | Cursor enters a basin's claim radius | Cursor leaves or another input fires |
| **S7** | `RadialEcho` | Cursor settled for >800ms or visitor long-presses a star | 1.5 s of no motion or any other gesture |
| **S8** | `SearchActive` | Visitor presses `/` or taps the search icon | Esc, blur, or selection |
| **S9** | `FilterActive` | Visitor taps a facet chip | Filters cleared |
| **S10** | `TimeScrubbed` | Visitor drags the timeline handle | Handle returned to "now" |
| **S11** | `PinPanelOpen` | Visitor presses Home or taps the polestar | Visitor taps outside the panel |
| **S12** | `WorkOpening` | Visitor activates a star | Overlay reaches its rest size |
| **S13** | `WorkOpen` | Overlay arrives | Visitor closes overlay |
| **S14** | `WorkClosing` | Visitor closes overlay | Cursor returns to star |
| **S15** | `Contemplative` | No interaction for ~80 s | Any visitor input |
| **S16** | `Filtered+Searched` | Both an active filter set AND search query | Any clear gesture |
| **S17** | `EmptySky` | Constellation has no nodes (dev preview, edge case) | A work is added |
| **S18** | `LoadingSky` | Sky chunk fetch in progress (rare; usually pre-rendered) | Hydration completes |
| **S19** | `OfflineSky` | Visitor offline, has cached /sky | Reconnection |

A designer producing the canonical hi-fi set should mock S0, S2, S3, S4, S6, S7, S8, S9, S10, S11, S13, S15 — the others are visual variants of these.

---

## Component Library

For each component: **anatomy** (named parts), **states** (variations), **does / must not become** (the framing for each component's purpose and its forbidden drifts), **variants** (open questions for the designer to propose against).

### C1. CompanionGlyph

*The visitor's body in the world.*

**Anatomy (named parts):**

- **Center mark** — identity anchor; the cursor's "this is me"
- **Halo** — soft presence around the center
- **Trail** — motion path during fast travel; fades behind the glyph
- **Active hue shift** — the glyph's color modulating from amber (rest) toward the active star's facet hue (settled)

**States:**

- `at-rest-no-active` — visitor hasn't settled into a basin yet
- `at-rest-on-active` — settled into a basin; glyph adopts that star's hue
- `dragging` — visitor's finger or pointer is down
- `coasting` — momentum-driven motion after a flick
- `traveling` — moving along a thread to another star
- `behind-camera` — hidden (theoretical: cursor on the far hemisphere)

**DOES:** Signals orientation and motion. Tells the visitor where they are on the surface. Leads them back toward the foyer or the polestar when they reach for home.

**MUST NOT BECOME:** A primary action button. A tooltip-following indicator. Static decoration without purpose. The glyph carries no text and offers no interactive affordance — the *star* is the affordance, not the cursor.

**Variants to explore:**

- **V1.A: Comet** — a small bright dot with a streaking trail. Reads as motion-through-space.
- **V1.B: Soft light** — a halo with no hard center. Reads as a presence rather than a pointer.
- **V1.C: Compass needle** — a tiny directional mark that orients toward the active star. More directional information; risks reading as chrome.
- **V1.D: Thread-spool** — leaves a faint persistent line behind it as it moves; the visitor's path becomes visible. Risks visual clutter.
- **V1.E: Breath** — a slow pulse at rest, intensifying when the basin claims. Most subtle; risks being missed.

### C2. Star

*A single work, addressable.*

**Anatomy (named parts):**

- **Halo** — outer glow with watercolor bleed; the soft outer disc
- **Body** — core light; the bright addressable point at the star's center
- **Hit target** — minimum 44 px invisible hit-circle around the visible body
- **Optional label** — context name appearing on settle or hover, italic, second-voice
- **Pin mark** — persistent ribbon when the visitor has held this star

**States:**

- `default` — at rest, no attention
- `hover` — pointer near
- `focused` — keyboard focus or screen-reader focus
- `active-basin` — cursor settled in this star's basin
- `dragged-toward` — drag target while pointer captured
- `opening` — work overlay rising from this star
- `dimmed-by-filter` — filter active, this star not matched
- `pinned` — visitor has marked this star
- `new-since-last-visit` — twinkling for ~10 s on first arrival of session
- `time-dimmed` — filtered out by current time-scrubber position

**DOES:** Represents a real link to a place, a work, an idea. The structural unit of meaning in the constellation. Always addressable; always a real `<a href>`.

**MUST NOT BECOME:** A tooltip-following button. A floating callout. A button styled as a star. The star *is* the link; the link is not separate from the star.

**Constraints:** Always a real link. Never a button. Never has a tooltip on hover that follows the pointer.

**Variants to explore:**

- **V2.A: Single-mark** — one solid dot, no halo. Cleanest; risks reading as flat.
- **V2.B: Halo-and-body** — current implementation; soft halo with brighter center.
- **V2.C: Particle cluster** — each star is multiple tiny dots forming a soft constellation-of-particles. More texture; harder to render performantly.
- **V2.D: Plate-and-pin** — a flat disc with a small raised mark; reads as held in space rather than glowing.

### C3. Thread

*A connection between two works.*

**Anatomy (named parts):**

- **Path line** — the navigable line between two stars (great-circle arc on the sphere; projected to a curve on screen)
- **Endpoint glow** — destination affordance on each end; brightens on hover/focus
- **Active brightening** — full-line emphasis on hover, focus, or while the cursor is traveling along it

**States:**

- `default` — barely visible wisp
- `endpoint-active` — one of its stars is the cursor's basin
- `both-endpoints-active` — rare: both stars are in a multi-select or comparison
- `traveling-along` — visitor is currently traversing this thread (cursor moving)
- `dimmed-by-filter` — filter excludes one or both endpoints
- `behind-camera` — hidden when one endpoint clips out of the visible hemisphere

**DOES:** Connects meaningful points; shows path and direction; communicates that two works share a facet, a reference, or an authored relationship. Honors the manifesto's commitment that *the graph stays one graph only if every edge is authored.*

**MUST NOT BECOME:** A decorative line with no navigation value. An algorithmic similarity edge. A connector drawn for visual balance. Every thread is an authored connection — never inferred.

**Variants to explore:**

- **V3.A: Wisp** — current implementation; faint pastel curve.
- **V3.B: Beaded** — dotted line; reads as steps rather than continuous flow.
- **V3.C: Braided** — when multiple connections share endpoints, the threads twist around each other. Beautiful; complex.
- **V3.D: Arc-only** — threads only render between focused star and its neighbors; field is otherwise empty. Cleaner; loses ambient connection visualization.

### C4. AtmospherePool

*The luminous region around the cursor.*

**Anatomy:** A soft radial gradient centered on the cursor's screen position, painted via WebGL (or SVG fallback).

**States:**

- `default` — present at moderate intensity, follows cursor
- `intensified` — when cursor is settled on an active basin (saturation + brightness boost)
- `dimmed` — `Contemplative` and `OfflineSky` states
- `offset` — when camera lags during a flick, pool sits where cursor is going (off image center)

**Behavior:** Always follows cursor's projected screen position. Intensity scales with cursor's velocity (reasoning: the more the visitor is reaching, the more the world responds).

**Constraints:** Never a hard-edged disc. Never reaches viewport edges (must respect vignette). Never blocks readability of any star or thread.

**Variants to explore:**

- **V4.A: Single pool** — current; one soft gradient.
- **V4.B: Twin pools** — one tracking the cursor, one tracking the camera target; the gap between them visualizes lag.
- **V4.C: No pool** — pure noise, no cursor-following gradient. Calmer; loses the "world responds to attention" cue.
- **V4.D: Polaroid** — pool bleaches a slight light-leak color toward the active basin's facet hue.

### C5. Polestar

*The fixed center.*

**Anatomy:** The geometric figure (the site's ornament) at world center. Subtle, always rotating slowly.

**States:**

- `default` — slow rotation
- `active` — visitor pressed Home or tapped the polestar; pulses briefly to acknowledge
- `pin-panel-anchor` — when PinPanelOpen, the polestar is the panel's anchor

**Behavior:** Rotates at one cycle per ~10 minutes, independent of all other motion. Tap or press of `Home` opens the PinPanel.

**Constraints:** Never moves position. Never receives camera transform — sits behind the orbital camera so it's the still center even when the camera orbits.

**Variants to explore:**

- **V5.A: Geometric figure** — current; the site's ornament.
- **V5.B: Tiny constellation-of-three** — three small dots forming a triangle, visible only on close inspection.
- **V5.C: Negative space** — a small darker region against the sky; the polestar is what's *not* there.

### C6. HorizonStrip

*Bottom-edge chrome. The edge where tools become available. See **The Horizon System** below for the full sub-spec.*

**Anatomy (named parts):**

- **Foyer glyph** — return home; orientation reset
- **Search area** — quick find; typing-aware
- **Facet chip row** — filter the sky; eight chips
- **Timeline zone** — temporal navigation; revealed on hover
- **Pin toggle** — show/hide pins (or open the polestar panel)

**States:**

- `at-rest` — strip is ~15–25% opaque, all controls minimal
- `pointer-near` — strip rises to ~70% opacity; controls become legible
- `actively-using` — full opacity for the controls being used; rest stays at 70%
- `filter-active` — strip thickens slightly (more vertical presence) when filters are active; visual indication that the constellation is "lensed"
- `time-active` — timeline handle prominent; date indicator visible
- `pin-panel-access` — pin panel revealed from the polestar
- `low-visibility-contemplative` — more transparent; restful presence after long idle
- `hidden` — never; the strip always exists at minimum opacity (held question — see V6)

**DOES:** Quiet edge chrome; supports search, filters, time-scrubbing, and pin access. Tools always within two gestures. Subordinate to the constellation by design.

**MUST NOT BECOME:** Primary navigation. A floating toolbar. A heavy app chrome. A sidebar takeover. A primary content surface. A modal-feeling control band. The constellation is the navigation; the strip is its quiet companion.

**Variants to explore:**

- **V6.A: Always-present strip at low opacity** — current proposal; ambient.
- **V6.B: Hidden until pointer at bottom-third** — emerges only when the visitor reaches for it. Cleaner; risks being undiscoverable.
- **V6.C: Top edge** — strip sits at the top instead of bottom. Easier reach on desktop; thumb-distant on mobile.
- **V6.D: Right edge (vertical)** — vertical orientation. Risks reading as a sidebar.
- **V6.E: Distributed** — search at top, facets at bottom, time at side. Spreads chrome around the edges; risks fragmenting attention.

### C7. SearchField

*The query input.*

**Anatomy:** A collapsed icon (magnifying glass) at rest; expanded into a thin text field with placeholder copy ("the constellation by name…") when invoked.

**States:**

- `collapsed` — icon only; in HorizonStrip
- `expanded-empty` — text field visible, no input yet, placeholder showing
- `expanded-typing` — visitor is entering text; matching stars across the constellation pre-glow
- `expanded-with-matches` — query produces matches; matches are highlighted with full opacity, non-matches dim
- `expanded-no-matches` — query produces no matches; field shows "no constellation matches" inline
- `dismissed` — Esc, blur, or selection collapses back to icon

**Behavior:** Search is **predicate over title + facets + room + body content**. Matches update on every keystroke. Pressing Enter on a single-match query travels the cursor to that star. Pressing Enter with multiple matches dims non-matches and lets the visitor traverse only the matched set.

**Constraints:** Never a modal. Never overlays the constellation. Always paired with the visible result (visitor sees what's matched, in place).

**Variants to explore:**

- **V7.A: In-strip text field** — current; field expands inline within HorizonStrip.
- **V7.B: Floating field** — field appears at top center, like a command palette.
- **V7.C: Type-anywhere** — no visible field; typing while focused on the constellation triggers search. Most invisible; risks being undiscoverable.
- **V7.D: Persistent field** — search field always visible (no collapsed state). Most discoverable; takes more chrome real estate.

### C8. FacetChip

*A toggleable filter.*

**Anatomy:** A small mark — either a colored dot, a labeled pill, or a glyph. Eight chips total (one per facet). Optional active-indicator (border, fill, ring).

**States:**

- `default` — at rest, ~30% opacity
- `hover` — ~70% opacity, label appears
- `active` — 100% opacity, border or fill indicates "filter on"
- `active-and-hovered` — slight scale-up to indicate "click to toggle off"

**Behavior:** Tap toggles the chip's filter. Multiple active chips intersect (AND). Clear-all gesture or `Esc` clears all.

**Constraints:** Never hides chips not currently relevant. The full eight chips are always shown — visitor's mental model is "all facets, choose which to lens by."

**Variants to explore:**

- **V8.A: Colored dots** — chip color matches facet hue. Compact; relies on color memory.
- **V8.B: Labeled pills** — chip shows facet name in italic. Most explicit; takes more space.
- **V8.C: Glyph-and-label-on-hover** — small icons at rest, label on hover. Compromise.
- **V8.D: Small constellation** — each chip is a tiny constellation-shape made of the works carrying that facet. Beautiful; complex.

### C9. TimeScrubber

*The temporal control.*

**Anatomy:** A horizontal line (the timeline) with a small handle and date markers. Centered along HorizonStrip when invoked.

**States:**

- `dormant` — invisible line; appears only when pointer hovers HorizonStrip's center
- `revealed` — line + handle visible at "now" position
- `dragging` — visitor is moving the handle; constellation is updating live
- `non-now` — handle is at a past date; small indicator shows "viewing constellation as of {date}"
- `pinned-non-now` — visitor has explicitly chosen to keep a past view; indicator persists; clear gesture available

**Behavior:** Dragging the handle continuously updates which stars are emphasized (works added before that date stay full; works added after dim). Atmospheric color may shift toward earlier palettes (held — see V12).

**Constraints:** Never affects URL until the visitor pins a non-now view. Never modifies content; only emphasis.

**Variants to explore:**

- **V9.A: Linear timeline** — current proposal; flat horizontal scrub.
- **V9.B: Logarithmic timeline** — recent dates take more space; old dates compress.
- **V9.C: Calendar wheel** — vertical wheel of months/years. More spatial; less continuous.
- **V9.D: No persistent control** — visitor presses `t` to toggle "show as of date X" prompt. Hidden; for power users.

### C10. RadialEcho

*Context actions at the cursor.*

**Anatomy (named parts):**

- **Center anchor** — the active star at the radial's heart
- **Action petals** — 3–5 secondary affordances arrayed around the center (open, pin, copy link, find related, time-of-this-work)
- **Bloom motion** — the choices branching outward from the cursor center as the radial appears
- **Dismissal halo** — the soft fade-edge as the radial retires

**States:**

- `dormant` — invisible
- `appearing` — fades in over ~200 ms after settle
- `present` — full visibility; visitor can hover/tap an action
- `dismissing` — fades out on motion or 1.5 s of no input

**DOES:** Reveals context around a star; invites exploration. Adapts its action set to the star's nature (a Salon work with audio gets "play referent"; a poem gets "read aloud" if synthesized voice is enabled).

**MUST NOT BECOME:** A modal takeover. An attention trap. A persistent overlay that competes with the star itself. The radial echoes the cursor's settled state — it does not assert itself.

**Variants to explore:**

- **V10.A: Ring of icons** — current proposal; icons arranged in a ~120° arc above the star.
- **V10.B: Dock** — actions arranged in a small horizontal dock just below the star.
- **V10.C: Pulled-out hand** — the active star itself "blooms" small action-petals around its perimeter.
- **V10.D: No radial; bottom-strip echo** — actions appear in HorizonStrip when a star is active, not at the cursor. Less spatial; less reach-required.

### C11. PolestarPanel

*The visitor's session console.*

**Anatomy:** A small panel rising from the polestar position when invoked. Contains: pinned stars (with title and remove), recently opened stars (last 5), constellation legend (count of stars / rooms / threads / facets), session controls (clear pins, reset cursor).

**States:**

- `closed` — invisible
- `opening` — rises from polestar over ~400 ms
- `open` — present; visitor can interact with contents
- `closing` — collapses back to polestar
- `with-pins` — content varies based on whether pins exist

**Behavior:** Opened by tapping polestar or pressing `Home`. Closes on outside tap, `Esc`, or activating any item within.

**Constraints:** Never a sidebar. Never wider than 1/3 of the viewport. Never blocks the polestar visually when closed.

**Variants to explore:**

- **V11.A: Bottom-anchored panel** — panel always rises from polestar, anchored at bottom edge.
- **V11.B: Centered modal** — opens in viewport center; classic.
- **V11.C: Drawer from left** — slides in from edge.
- **V11.D: Tooltip-style at polestar** — small label-strip emerging from the figure.

### C12. WorkOverlay

*The opened work surface. See **The Work Surface** below for the full sub-spec.*

**Anatomy (named parts):**

- **Title** — the work's name; primary heading
- **Deck** — a short summary or invitation (one or two lines, italic, second voice)
- **Body** — the primary reading column, generous measure
- **Facets** — topics and lenses for this work (chips at the side or top)
- **Thread references** — related works and continuations
- **Veil background** — the constellation visible behind a soft veil; focus isolation without disconnection
- **Close control** — visible, consistent escape (×, Esc, swipe-down)
- **Return-to-star behavior** — closing returns focus to the originating star and context

**States:**

- `opening` — rises from the activated star's screen position over ~600 ms
- `open` — content readable; constellation behind at ~30% opacity
- `scrolling` — visitor scrolls; constellation stays put behind
- `closing` — collapses back to the star's position
- `loading` — work content is being fetched (rare on this static site)
- `error` — work failed to load; inline error with retry

**DOES:** Elevates content without replacing the world. Preserves the return path to the originating star. Keeps the constellation visible behind a soft veil. Supports immersive, uninterrupted reading. Provides clear close control and escape. Adapts across layouts without breaking flow.

**MUST NOT BECOME:** A disconnected app page or separate site. An aggressive full takeover with no context. A modal trap with hidden or unclear exit. A chrome-heavy interface that distracts. A layout that sacrifices readability. A pattern that breaks the star-world relationship.

**Variants to explore:**

- **V12.A: Full-overlay with veiled constellation** — current proposal; overlay reads but constellation is felt behind.
- **V12.B: Half-screen panel** — overlay takes only half the viewport; constellation visible alongside.
- **V12.C: Sheet-from-bottom** — overlay rises from the bottom edge like a mobile sheet.
- **V12.D: Picture-in-picture** — constellation shrinks to a corner widget.

### C13. PinRibbon

*Mark on a pinned star.*

**Anatomy:** A small notch, ribbon, or color-shifted halo on a pinned star. Subtle.

**States:**

- `not-pinned` — invisible
- `pinned` — small mark visible at all zoom levels
- `pinned-and-active` — slightly emphasized when the basin is also the cursor's

**Behavior:** Appears immediately when visitor pins a star (long-press or radial echo). Removed when visitor unpins.

**Constraints:** Never a number or count. Never carries title.

**Variants to explore:**

- **V13.A: Notch** — a small cut on the star's halo at one edge.
- **V13.B: Underline** — a small horizontal mark below the star.
- **V13.C: Color shift** — pinned stars warm slightly toward gold (the leadership/relation hue).
- **V13.D: Tag-and-string** — a tiny tag with a string, visually quoting library cards.

### C14. NewStarBloom

*First-arrival pulse for unread works.*

**Anatomy:** A more pronounced halo on stars added since the visitor's last session. Twinkles at higher amplitude for ~10 s after first arrival of a session, then settles to baseline.

**Behavior:** Triggered only on /sky entry where one or more works' published-date is later than the highest stored in `localStorage`. After the bloom completes, the visitor's record updates.

**Variants to explore:**

- **V14.A: Heightened twinkle** — current proposal; same twinkle but louder.
- **V14.B: Soft pulse** — slow breathing rather than twinkle.
- **V14.C: Comet trail** — new stars draw a brief comet trail on first appearance.
- **V14.D: No special treatment** — discoverability is the visitor's job, not the system's.

---

## Component Relationships

The components compose into a single living surface. The relationship is not "components arranged on a page" — it is "components participating in a world."

The composition equation:

```
AtmospherePool
  + CompanionGlyph
    + Star
      + Thread
        + HorizonStrip
          + RadialEcho
            + WorkOverlay
              = Surface Composition
                (a living surface of meaning & navigation)
```

Each component contributes a specific role:

- **AtmospherePool** — background presence; the world's body
- **CompanionGlyph** — orientation and motion; the visitor's body
- **Star** — points of meaning; the destinations
- **Thread** — connections and paths; the relationships
- **HorizonStrip** — search, filter, and time; the tools
- **RadialEcho** — context expansion; the moment of arrival
- **WorkOverlay** — focused workspace; the deep reading

Components that are not in this composition equation (Polestar, FacetChip, SearchField, TimeScrubber, PolestarPanel, PinRibbon, NewStarBloom) are *parts of* one of the seven (Polestar is *of* the world; chips/field/scrubber/panel are *of* the HorizonStrip; pin and bloom are *of* a Star). The seven are the load-bearing nodes of the composition.

---

## Surface Layering / Z-Order

The order of layers from back to front. Designers must respect this stack; reordering is how /sky becomes visually incoherent.

```
[ back ]
  1. Sky background — paper grain texture, theme-toned
  2. Atmospheric noise — slow procedural drift (WebGL or fallback)
  3. Atmosphere pool — luminous region around the cursor
  4. Polestar — the still center; renders behind the rotates layer
  5. Threads — the connection wisps
  6. Stars — depth-sorted, farthest first
  7. Cursor glyph — the visitor's body; always above stars
  8. HorizonStrip — quiet edge chrome
  9. RadialEcho — context actions when invoked
  10. Polestar panel / Pin panel — when invoked, rises from polestar
  11. Work overlay — when invoked, the foreground reading surface
[ front ]
```

**Compositional rules:**

- **Atmosphere is always behind threads and stars.** The pool may *brighten through* threads (additive blend) but never paints over them.
- **Threads are always behind stars.** A thread crossing a star is occluded by the star's halo.
- **Stars are depth-sorted within their layer.** Far stars render before near stars; near stars overlap far stars naturally.
- **The cursor glyph is always above stars in the same region.** If the cursor sits exactly on a star, the glyph composites on top of the star's halo (with a slight blend so the star's hue still tints the glyph).
- **Chrome (HorizonStrip, panels) is always above the constellation.** Chrome never composites *into* the constellation's painted layers.
- **The work overlay is the topmost surface when invoked.** The veil between overlay and constellation is the only thing painted between them.

Layers below the cursor glyph are *the world*; layers from chrome onward are *the visitor's tools and focused content*. The boundary is the cursor glyph: it is simultaneously the highest-priority world element and the lowest-priority chrome.

---

## The Horizon System

*The edge where tools become available.*

This sub-spec elaborates on `C6. HorizonStrip`. A designer working on chrome should treat this section as authoritative; it overrides any general guidance elsewhere when there's a conflict.

### Anatomy of the Strip

Five regions arranged left-to-right along the bottom edge of the viewport:

| Region | Affordance | Action |
|---|---|---|
| **Foyer / return home** | Foyer glyph | Return to foyer; orientation reset |
| **Search / quick find** | Magnifying-glass icon (collapsed) or text field (expanded) | Open search; quick discovery |
| **Facets / lens the sky** | Eight chips in a row | Filter and explore through facets |
| **Timeline / temporal view** | Centered scrub line with handle | Scrub time or jump eras |
| **Pins / held places** | Star-glyph or polestar marker | Access pins and the polestar panel |

The order is intentional: leftmost is *backward* (return home); rightward is *forward in agency* (search, narrow, scrub, hold). The hand walks the strip from "where I came from" to "what I'm doing here."

### Chrome States

Eight states the strip moves through. Each is a distinct mockup-worthy moment.

| State | Behavior | Visual cue |
|---|---|---|
| **at-rest** | Ambient, quiet, subtle glow | Strip at ~15–25% opacity; controls minimal |
| **pointer-near** | Subtle lift; slightly brighter | Strip rises to ~70% opacity; controls become legible |
| **actively-using** | Focused element emphasized | Used control at full opacity; rest holds at 70% |
| **search-active** | Search expands inline | Field grows within the strip, not over the constellation |
| **filter-active** | Active facet chip clearly marked | Strip thickens slightly; chip glows with gold halo and subtle fill |
| **time-active** | Timeline handle prominent | Centered timeline visible; date indicator legible |
| **pin-panel-access** | Pin panel revealed | Polestar panel rises from the still center |
| **low-visibility-contemplative** | More transparent; restful presence | After long idle, strip softens to a calm, ambient state |

### Density and Expansion Behavior

How the strip grows and contracts as it's used.

- **Search expansion (inline):** Search grows *within* the strip, not over the constellation. The field expands rightward; chips compress or scroll briefly to make room, then return to rest when search closes.
- **Facet chips at rest:** All eight facets present, low emphasis, quiet by default. No chip is hidden.
- **Facet chip active:** The active chip glows with a gold halo and subtle fill. Multiple active chips → strip subtly thickens to indicate the lens is engaged.
- **Timeline revealed (center):** Timeline appears in the center zone when engaged (hover or tap on the handle position). Date markers fade in.
- **Filters active (thicker strip):** When filters are active, strip grows in height to house the active filter set without leaving the edge. Never floats; always stays bottom-anchored.
- **Return to rest (subdued):** After inactivity (~3 s of no interaction with strip), the strip softens back to a calm, ambient state.

### Placement Studies

The strip is an ambient companion. Bottom edge is recommended; alternates are explored only against the recommended baseline.

| Placement | Pros | Cons | Verdict |
|---|---|---|---|
| **Bottom edge / ambient** | Reachable on mobile; reads as horizon; doesn't compete with the constellation overhead | Can feel chrome-heavy if not quiet enough | **Recommended** |
| **Hidden until reach** | Cleanest canvas; emerges only on intent | Risks being undiscoverable; first-time visitor may miss it | Variant V6.B |
| **Top edge** | Easy mouse reach on desktop | Far from thumb on mobile; fights with site nav above | Variant V6.C |
| **Right edge (vertical)** | More vertical space for tall mobile screens | Reads as a sidebar; not "horizon" anymore | Variant V6.D |
| **Distributed chrome** | Spreads weight; no single locus | Fragments attention; visitor never knows where to look | Variant V6.E |

### Responsive Horizon

The strip adapts to viewport — but the world it lives at the edge of does not.

- **Phone portrait (compressed):** 6 facet chips + "more" expander; larger touch targets; search expands wider; timeline compact.
- **Tablet landscape (balanced):** Full facet set; balanced density; timeline at center; moderate height.
- **Desktop (full horizon):** All facets visible; centered timeline; minimal height; quiet by design.

### Do / Don't Chrome Examples

**DO:**

- Quiet, edge-bound, ambient
- Discoverable, not dominant
- Subordinate to the constellation

**DON'T:**

- A floating toolbar
- Heavy app chrome
- A sidebar takeover
- A primary navigation replacement
- A modal-feeling control band

### Design Principles for Chrome

Seven principles. Each is a litmus test for any chrome proposal.

1. **Utility appears at the edge.** Tools live where the visitor's hand reaches when they want them, not where they sit when they don't.
2. **Chrome retires when not invoked.** At rest, chrome is barely present.
3. **The constellation remains primary.** Chrome is always subordinate to the world it sits beside.
4. **Tools are always within two gestures.** No hidden chrome that requires a sequence of moves to reach.
5. **Discoverability without domination.** The strip's existence must be findable on first visit; its presence must not crowd the experience after.
6. **Expansion without takeover.** When chrome grows (search expanding, filters thickening the strip), it grows within itself — never over the constellation.
7. **Rest state should feel like atmosphere, not UI.** When the visitor isn't using it, the strip should read as part of the world's edge, not a control surface waiting for input.

### Variant Decisions / Open Questions for Chrome

| Question | Variant A | Variant B | Tradeoff |
|---|---|---|---|
| Strip presence | Always-present at low opacity | Hidden until reach | presence vs. clean canvas |
| Search behavior | Search inline (expands within strip) | Search floating (rises above strip) | continuity vs. prominence |
| Facet count | Full 8 chips | 6 chips + "more" | richness vs. simplicity |
| Timeline visibility | Timeline always visible | Reveal on hover | learned vs. minimal |
| Pin control location | Pin in strip directly | Pin via polestar panel only | access vs. minimal chrome |

### Horizon Lexicon

The chrome's own vocabulary. These terms describe surfaces *of* the strip, not the constellation as a whole.

- **Foyer** — return to home; orientation; reset view
- **Search** — find stars, places, events, and moments
- **Facet** — filter and explore the sky through facets
- **Timeline** — move through time; scrub, jump, and compare
- **Pin** — save a place, return later, build memory
- **Filter state** — indicates active filters and refinements
- **Focus ring** — visible focus for all input methods
- **Quiet chrome** — ambient presence that supports the experience

---

## The Work Surface

*How a star becomes readable.*

This sub-spec elaborates on `C12. WorkOverlay`. A designer working on the work-reading experience should treat this section as authoritative.

### Anatomy of the Overlay

The work overlay is composed of seven named parts. Each carries a specific role; none is decorative.

| Part | Role |
|---|---|
| **Title** | The work's name. Anchor of attention. Display register. |
| **Deck** | A short summary or invitation. One or two lines. Italic, second-voice. |
| **Body text column** | Primary reading area with generous measure (50–75 characters). |
| **Facets** | Chips listing the topics and lenses for this work. |
| **Thread references** | Related works and continuations; navigable links. |
| **Background veil** | The constellation visible behind a soft veil; never replaced. |
| **Close control** | Visible, consistent escape (×, Esc, swipe-down on mobile). |
| **Return-to-star behavior** | Closing returns focus to the originating star and its context. |

### Layout Variants

Four layouts to consider for different reading contexts. The recommended is the immersive overlay-with-veil.

| Variant | Use | Pros | Cons |
|---|---|---|---|
| **Full overlay + veil** *(recommended)* | Default desktop and tablet | Immersive reading with world context preserved | More chrome to dismiss |
| **Half-screen panel** | When more world-context is wanted | More world, lighter reading commitment | Less reading focus |
| **Sheet from bottom** | Mobile primary | Quick, focused reading; thumb-reachable close | Loses the "rises from the star" choreography |
| **Picture-in-picture** | Multitasking; comparing two works | Compact; allows side-by-side | Less reverent; reads as utility |

### Reading States

Six states the work surface moves through.

| State | Behavior |
|---|---|
| **opening** | Overlay expands from the activated star over ~600 ms |
| **open** | Content is ready for reading; constellation veiled at ~30% behind |
| **scrolling** | Smooth reading; progress preserved; constellation stays put behind |
| **closing** | Overlay collapses to the star |
| **loading** | Content loads with subtle feedback (rare on this static site) |
| **error** | Graceful error state with retry option |

### Content Density Studies

Works come in three rough density classes. The overlay must accommodate all three without changing layout.

- **Short fragment / poem:** Few lines. Generous whitespace. Title and deck dominate. The overlay feels almost empty — and that's the point. *(Sample: "Orion's Heart — A hush. A gather. A burning that remembers itself. — Lyra Bridge — 2 min read")*
- **Essay / longform prose:** A scrolling reading column at 50–75 chars/line. Drop-cap optional on the first paragraph. *(Sample: "When the nebula folds inward, it does not rush. It listens.")*
- **Media-rich work:** Includes images, video, audio, or charts. Media strips render alongside or between paragraphs; the reading column maintains its measure.

### Open / Read / Return Flow

Five-frame storyboard for the canonical reading interaction.

| Frame | Surface | Description |
|---|---|---|
| 1 | `S6` | A star is selected within the constellation (basin settled, label visible) |
| 2 | `S12` | Overlay grows from the star with soft motion |
| 3 | `S13` | Content is readable while the world remains visible |
| 4 | `S13 (scrolling)` | Reader scrolls at their own pace and depth; the constellation rotates slowly behind |
| 5 | `S14 → S6` | Closing returns to the star and its place in the sky |

### Typographic Reading System

Five registers for the work surface, with explicit hierarchy. (Implementation-level pixels live in `DESIGN_SYSTEM.md`; these are the relative commitments.)

| Register | Use | Sample | Spec |
|---|---|---|---|
| **Heading** | Work title (primary) | *"Orion's Heart"* | H1 / 46pt-ish / Regular weight |
| **Deck** | Summary register; invitation + context | *"A star is born not of flame, but memory and the push of gravity."* | H2 / 16pt-ish / Italic |
| **Body prose** | Primary reading text | *"When the nebula folds inward, it does not rush. It listens."* | Body / 15pt-ish / 1.7 line-height |
| **Metadata** | Second voice; contextual details | *"by Lyra Bridge • 9 min read • 2 days ago"* | Meta / 12pt-ish / Small caps |
| **Inline links** | Connections within text | *"gravity gathers the [almosts]…"* | Link / underline / Gold |

### Behavior + Constraints

**DOES:**

- Elevates content without replacing the world
- Preserves return path to the originating star
- Keeps constellation visible behind a soft veil
- Supports immersive, uninterrupted reading
- Provides clear close control and escape
- Adapts across layouts without breaking flow

**MUST NOT BECOME:**

- A disconnected app page or separate site
- An aggressive full takeover with no context
- A modal trap with hidden or unclear exit
- A chrome-heavy interface that distracts
- A layout that sacrifices readability
- A pattern that breaks the star-world relationship

### Responsive Reading

| Viewport | Pattern | Note |
|---|---|---|
| **Phone portrait** | Full-screen sheet; single-column immersive reading | Easy thumb-reach close; max readability |
| **Tablet landscape** | Balanced view; full reading context | Comfortable line length preserved |
| **Desktop** | Overlay + veil | More world, more context, richer navigation |

### Do / Don't Reading Examples

**DO:**

- Generous margins and whitespace
- Visible return: close is clear
- Comfortable width for long reading
- Subdued veil: world not competing

**DON'T:**

- Over-dense text (wall of words)
- Chrome-heavy: distracting UI
- Fully detached: no world context
- Tiny measure: hard to read

### Variant Decisions / Open Questions for the Work Surface

| Question | Variant A | Variant B | Tradeoff |
|---|---|---|---|
| Veil opacity | Higher (more focus) | Lower (more world prominence) | Balance focus vs. world prominence |
| Metadata placement | Top bar | Side rail | Which feels less distracting? |
| Thread references | Inline (in body) | Side panel | Keep context close or separate space? |
| Media strip position | Top of overlay | Bottom of overlay | Lead with media or end with enrichment? |
| Desktop overlay width | Narrow | Wide | Focus vs. breadth of reading |

### Accessibility + Reading Notes

- Visible close control on all layouts
- Keyboard return with `Esc` key
- Focus is preserved and returned to the star on close
- Readable contrast for text and UI; WCAG AA minimum
- Reduced-motion option for open/close (uses snap fallback)
- Comfortable line length (50–75 characters)
- Semantic heading structure for screen-reader navigation

### Work Surface Lexicon

The work overlay's own vocabulary. These terms describe surfaces *of* the work, not the constellation.

- **Title** — the name of the work; anchor of attention
- **Deck** — a brief invitation or summary
- **Body** — primary reading content column
- **Thread** — related works, continuations
- **Facet** — topics and lenses for the work
- **Media** — images, video, data, or charts
- **Veil** — soft background layer showing the world
- **Return** — path back to the star and its context

---

## Flows

The canonical interactions, frame by frame. Each flow is a sequence of surfaces (named by ID from the inventory above) with the changes between frames noted. A designer should be able to mock these as storyboards directly.

### F1. First arrival

The visitor lands on /sky from the Foyer for the first time.

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | (Foyer) | Visitor is at the Foyer top. They see the "look up" affordance. |
| 2 | S0 `Arrival` | Carpet rolls down. Sky is visible behind. Stars not yet emphasized. |
| 3 | S1 `Demonstration` | Cursor (companion glyph) drifts autonomously to the nearest non-polestar star. ~600 ms. |
| 4 | S6 `BasinSettled` | Cursor in basin; star and threads highlighted; faint label "{title}" appears below star. |
| 5 | S2 `Idle` | Visitor watches; cursor pulses gently; label fades after ~3 s of no interaction. |

**Key design moment:** The handoff in frame 5 — when the cursor "becomes the visitor's." The pulse signals "now you."

### F2. Wander and open

The visitor traverses to a star and opens its work.

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | S2 `Idle` | Cursor at a basin or polestar. |
| 2 | S4 `Dragging` | Visitor's pointer down; cursor follows by spring; camera trails. |
| 3 | S5 `Coasting` | Visitor releases; cursor coasts under momentum. |
| 4 | S6 `BasinSettled` | Cursor settles in a new basin; star highlights; label appears. |
| 5 | S7 `RadialEcho` | After 800 ms of stillness, radial actions appear around star. |
| 6 | S12 `WorkOpening` | Visitor taps "open" (or the star itself); overlay rises from star's position. |
| 7 | S13 `WorkOpen` | Work content readable; constellation visible at 30% opacity behind. |
| 8 | S14 `WorkClosing` | Visitor presses Esc; overlay collapses back to star. |
| 9 | S6 `BasinSettled` | Cursor still at the same star; visitor can wander again. |

### F3. Filter and traverse

The visitor narrows the constellation by facet, then explores.

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | S2 `Idle` | Eight facet chips visible at low opacity in HorizonStrip. |
| 2 | S2 → S9 | Visitor taps "becoming" chip; chip goes to 100%; matched stars stay full opacity, unmatched dim to ~15%. |
| 3 | S9 `FilterActive` | HorizonStrip thickens slightly to indicate active filter. Threads to dimmed stars also dim. |
| 4 | S4 → S6 | Visitor wanders within the filtered set; basin physics still claims any star (filtered or not), but emphasis follows the filter. |
| 5 | S9 + S7 | Settled basin; radial echo includes "find related" action, which would broaden the filter. |
| 6 | S2 `Idle` | Visitor taps `×` on the strip; filter clears; full constellation re-emphasizes over ~320 ms. |

**Variants to storyboard:**

- What if the visitor adds a second filter (Salon ∩ becoming)? Where does the AND signal live?
- What if the visitor filters during a drag? Does the cursor stay where it is, or jump to a matched star?

### F4. Search and arrive

The visitor finds a specific work by name.

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | S2 `Idle` | Cursor at polestar; HorizonStrip at rest. |
| 2 | S2 → S8 | Visitor presses `/`; SearchField expands; placeholder text "by name…" |
| 3 | S8 `SearchActive` | Visitor types "spanda"; matching star pre-glows; non-matches dim slightly. |
| 4 | S8 → S6 | Visitor presses Enter; cursor travels along a great-circle path to the matched star over ~1200 ms; camera follows. |
| 5 | S6 `BasinSettled` | Cursor arrives; SearchField collapses back to icon. |

### F5. Pin and trace

The visitor marks several works for a custom reading path.

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | S6 `BasinSettled` | Cursor on a star. |
| 2 | S7 `RadialEcho` | Visitor invokes radial; taps "pin" (or long-presses). |
| 3 | S6 + PinRibbon | Star now shows pin ribbon. Echo dismisses. |
| 4 | (repeat F5.1–3 for two more stars) | Three stars pinned. |
| 5 | S2 → S11 | Visitor taps polestar; PolestarPanel rises with three pins listed in pin-order. |
| 6 | S11 `PinPanelOpen` | Visitor sees pinned list; can tap a pin to travel cursor to it, OR tap "trace" to begin a guided sequence. |
| 7 | S12 `WorkOpening` | "Trace" opens the first pinned work; on close, suggests the next; etc. |

### F6. Time scrub

The visitor views the constellation at a past moment.

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | S2 `Idle` | HorizonStrip's center is empty; pointer-hover reveals a thin line. |
| 2 | (hover) | Line resolves into draggable handle at "now." |
| 3 | S10 `TimeScrubbed` | Visitor drags handle left; stars added after that date dim toward invisibility; atmospheric color shifts subtly toward an earlier palette. Indicator shows date. |
| 4 | S10 + traversal | Visitor wanders the past constellation with the same gestures as the present. |
| 5 | S2 `Idle` | Visitor releases handle to "now"; constellation re-emerges. Or the visitor pins a non-now view and the indicator persists. |

### F7. Thread traversal

The visitor follows a connection between two works.

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | S6 `BasinSettled` | Cursor on a star; threads from this star bloom in their facet hues. |
| 2 | (focus) | Visitor Tab-cycles to a thread (Tab order: star, then radial echo actions, then connected threads). |
| 3 | (Enter) | Cursor begins traveling along the great-circle path of the thread to the other endpoint over ~1200 ms. A small bright bead may move along the thread for visual continuity. |
| 4 | S6 `BasinSettled` | Cursor arrives at the other endpoint; threads from that star bloom. |

### F8. Idle to contemplative

The visitor sits without interacting.

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | S2 `Idle` | Cursor at a basin or polestar. |
| 2 | (no input ~20 s) | Cursor's pulse softens. AtmospherePool dims by ~50%. HorizonStrip recedes to ~15%. |
| 3 | S15 `Contemplative` | Visitor still hasn't moved. After another ~60 s, cursor begins slow autonomous drift toward "gravitational center" (the star with the most threads). |
| 4 | S15 (continued) | Cursor settles at gravitational center; that star's basin highlights softly; cursor pauses ~5 s. |
| 5 | S2 `Idle` | Cursor returns to polestar. Cycle may repeat. Any visitor input interrupts. |

**Key design moment:** Frame 3-4 — the constellation living without you. The drift must read as natural, not robotic.

### F9. Reduced motion

Same destinations, no animation.

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | S0 → S2 | Sky appears (no carpet roll); cursor at polestar; no demonstration drift. |
| 2 | (drag) | Cursor jumps to nearest star (no spring physics). |
| 3 | S6 `BasinSettled` | Star highlights with no animation; label appears with 100ms fade. |
| 4 | (open) | Work overlay appears with no rise animation; 100ms fade. |
| 5 | (close) | Overlay disappears with 100ms fade. |

All gestures remain available; only the kinetic vocabulary changes.

### F10. Empty state

Constellation has no nodes (early development, edge case).

| Frame | Surface | Changes |
|------|---------|---------|
| 1 | S17 `EmptySky` | Sky is rendered (firmament, polestar). No stars. |
| 2 | (centered) | A second-voice italic line: "the constellation is gathering." |
| 3 | (cursor) | Cursor present at polestar; can drift but has nothing to claim. |

---

## Visual Language

The character of the design at the working level. Implementation-level specifics (tokens, exact pixels) live in `DESIGN_SYSTEM.md`.

### Type

Five registers carry every word /sky speaks. The work surface uses all five; chrome and microcopy use the second-voice and system-voice registers only.

| Register | Use | Sample | Spec |
|---|---|---|---|
| **Heading** — serif display | Work titles; major surface labels | *"Orion's Heart"* | H1 / 46pt-ish / Regular weight |
| **Deck** — serif italic | Work decks; invitations; section ledes | *"A star is born not of flame, but memory and the push of gravity."* | H2 / 16pt-ish / Italic |
| **Body** — serif body | Primary reading text | *"When the nebula folds inward, it does not rush. It listens. Dust remembers collisions that happened long before light had a name."* | Body / 15pt-ish / 1.7 line-height |
| **Metadata / second voice** — italic serif at meta size | Author lines, dates, contextual details, system whispers | *"by Lyra Bridge • 9 min read • 2 days ago"* / *"places you've held"* | Meta / 12pt-ish / Small caps for credit lines, italic for narration |
| **System voice** — italic serif at chip size | Chip labels, placeholders, button labels | *"the constellation by name…"* | Chip / 12pt-ish / Italic |

**Inline links** within body prose: gold-underlined, never the colored facet hue. The link color is *the constellation's voice marking a connection*, distinct from a facet's color which marks a category.

*No sans-serif, anywhere in /sky.*

### Color

The named palette /sky paints with. Each token has a meaning, not just a hex.

**Light theme (daylight):**

- **Paper umber** — the sky background; paper warmth as ground.
- **Horizon warmth** — the strip where sky meets horizon-strip; the meeting place of theme and chrome.
- **Quiet chrome** — the strip's resting tone; --text-3 quietness; barely-there.
- **Rose facet, violet facet, gold facet, warm facet** — the four facet hues, paired across eight facets per `DESIGN_SYSTEM.md`.
- **Amber cursor** — the companion glyph's resting hue. Warm in both themes; never theme-conditional.

**Dark theme (night):**

- **Deep night-blue** — the sky background; trending toward black at the upper register, with horizon warmth at the bottom edge.
- **Horizon warmth** — same role as light; the bottom-edge umber bleed.
- **Cool silver atmosphere** — the WebGL pool's tone in dark.
- **Rose, violet, gold, warm facets** — same hues, desaturated toward starlight.
- **Amber cursor** — unchanged; the visitor's body keeps its color across themes.

### Materials

The substrates /sky is made of. Each material is a way of being rendered, not just a texture.

- **Paper grain** — the sky's substrate. Visible noise, paper-bleed, never photographic.
- **Watercolor halo** — stars' outer disc. Soft edge, organic bleed via the existing `cn-watercolor-halo` filter.
- **Brushstroke thread** — connections between stars. Tapered, slightly varied, not laser-thin.
- **Atmosphere pool** — WebGL light around the cursor. Soft-light blend, rotund profile, never a hard disc.
- **Geometric polestar** — the site's ornament. Slow, structural-warm, the still center.
- **Quiet chrome** — controls. Barely-rendered at rest; gentle at full opacity.

### Motion Register

Six speeds, each with its purposes named. A motion that doesn't fit one of the six is probably wrong for this surface.

| Register | Vocabulary | Used for |
|---|---|---|
| **Slow** | 10 s+ | Background rotation, polestar |
| **Held** | 1–2 s | Thread travel, opening/closing overlay, autonomous demonstration drift |
| **Reach** | 300–600 ms | Filter dimming, theme crossfade, panel reveal, label fade-in |
| **Spring** | continuous | Cursor follow during drag |
| **Settle** | 200–400 ms | Basin claim acknowledgment, halo crescendo |
| **Snap** | ≤100 ms | Reduced-motion fallback for any animation; focus ring |

### Iconography

A small icon set, used only in chrome. Each icon is single-stroke, italic-aware, and respects the serif voice rather than fighting it.

- **search** — magnifying glass; expands the search field
- **filter** — funnel; opens facet chip set (or marks active filter)
- **pin** — bookmark mark; pins a star to the session
- **sparkle** — small star with rays; signals "new" or "from the constellation"
- **grid** — small grid of dots; alternative view (held)
- **layers** — stacked planes; depth/time controls
- **book** — opens reading view (work overlay)
- **share** — copy link / share affordance
- **more** — three dots; secondary actions

Icons live exclusively in `HorizonStrip` and `RadialEcho`. They never appear on stars, threads, the polestar, or the glyph — those carry their meaning through form, not symbol.

### Light as Medium

In /sky, **light is the substance of nearly everything**. Stars are points of light. Threads are wisps of light. The cursor glyph is a small held light. The atmosphere pool is a luminous region. The polestar is a structural-warm geometric light. Even the chrome glows — the strip's resting tone is barely-there warmth, and active states glow with a gold halo.

A coherent system about how light behaves:

- **Light concentrates around attention.** Where the visitor looks, the world brightens. The atmosphere pool, the active basin's halo crescendo, the active facet chip's gold halo — all are forms of "the world responds to where you are looking."
- **Light bleeds, never edges.** Halos have watercolor edges; threads taper rather than terminate; the atmosphere pool falls off via squared smoothstep. Hard edges appear only on chrome (the strip outline, the close-control glyph) and even those are softened by the strip's overall opacity.
- **Light is theme-aware but consistent in role.** Warm in light theme, cool-silver in dark theme — but the *role* of light is the same: presence, attention, life. The amber cursor is the only light that doesn't theme-shift; the visitor's body keeps its color.
- **Light recedes when not invoked.** At rest, light is dim. Chrome dims. Atmosphere dims. The world goes quiet. This is the contemplative state's signature — the world continuing without you, lights softening.
- **Gold is the language of the active.** Gold halos, gold linework, gold-underlined links. Other facet colors mark *categories*; gold marks *attention*. A star at rest in its facet hue, gaining a gold halo when active, telegraphs the difference between "what this is" and "where you are."
- **Saturation is information.** A star or chip at full saturation is alive (active, focused, hovered). A desaturated state is dimmed (filter mismatch, time-scrubbed, behind-camera). The visitor reads aliveness through saturation without needing chrome to indicate it.

### Ornamental Vocabulary

The small marks used decoratively across the surface and its documentation. Every ornamental mark carries meaning — none is gratuitous.

| Mark | Use |
|---|---|
| **Eight-point star** | The site's signature ornament. Section numbering in documentation; the polestar's geometric form; small flourishes between major regions. Never as a generic bullet; only where stars belong. |
| **Asterism dividers** *(three small marks in a triangle)* | Major section breaks within long documents. Replaces horizontal rules where the rule would feel mechanical. |
| **Single-stroke linework** | All chrome icons; thin gold rules; the polestar's structural form. No filled icons; no rounded software-icon corners. |
| **Twin-sphere title pairings** | When showing both themes side by side. The mockups use this for poster headers; the design doc could use it for component-state pairs (light + dark). |
| **Gold linework** | Active states, the link underline, ornamental rules. The color of attention; never used as a primary fill. |
| **Watercolor washes** | Title regions, around the polestar, on first-arrival surfaces. The medium that signals "this is composition, not a screen." |

When ornamentation is added, ask: *does this mark carry meaning, or is it filling space?* If the latter, retire it.

---

## Density and Pacing

The constellation's compositional ethos: *not crowded; not empty; just-enough.*

A surface mocked at 12–25 stars should feel **moderately populated** — enough to feel like a place, not so many that any individual star competes for attention. Specific commitments:

- **Minimum visual separation:** Stars should appear no closer than ~5° angular separation when projected to screen. Closer pairs imply a deliberate cluster (an asterism).
- **Maximum visible density per quadrant:** Roughly 8 stars per cardinal quadrant before the surface starts to feel busy. Beyond that, the constellation should *cluster* (multiple stars within an asterism) rather than scatter further.
- **Breathing room around the polestar:** No stars within 0.45 of the angular hemisphere from the polestar — the still center should always feel held in space.
- **Threads at default opacity:** ~25% so the field of connections feels woven rather than wired. Hover or focus brings selected threads to ~95%.
- **Atmosphere pool size:** ~45% of the viewport's short edge. Big enough to read as "the world responds to my attention"; small enough to leave most of the constellation in its default light.

When the corpus exceeds ~50 stars, the design must reckon with one of these strategies (a held question — see Open Design Questions):

- Smaller stars, denser packing, more reliance on filtering
- Constellation patterns (named asterisms) that visually group related works
- Camera zoom that brings clusters into focus while compressing the rest

---

## Empty and Origin States

The constellation evolves with the corpus. Designers must mock not just the populated middle but the sparse beginning and dense future.

- **Empty (zero stars).** `S17 EmptySky` — sky is fully rendered (firmament, polestar, atmosphere); no stars; no threads. Centered second-voice copy: *"the constellation gathers."* The polestar is the only light; the visitor sees the world *waiting*. This is rare (dev preview, edge case) but it must look intentional, not broken.
- **One star.** A single point of light somewhere on the upper hemisphere. The polestar is more prominent than usual. No threads (a single work has no co-membership). Cursor-on-star feels intimate. Sample state: *small weather*, the site's first work, alone in the sky.
- **Few stars (2–6).** Threads begin to appear as facet co-memberships emerge. The constellation starts to feel like a place, but barely. Each star has more visual weight per the density commitment.
- **Moderate (8–25).** The intended-state for design proposals. Most mockups should sit here. Threads are visible at default opacity; clusters begin to suggest themselves; filtering becomes useful.
- **Dense (50+).** Future-state. Requires the strategy decisions above. Designers should mock at least one dense-state to surface the held tension.

The transition between states is also a design surface. A new work's `NewStarBloom` should feel like *the sky has just acquired one more star*, not *a UI element animated in*.

---

## First-Visit Choreography

The visitor's first 60 seconds on /sky. Beyond `S0 Arrival` and `S1 Demonstration`, the deeper choreography of *becoming oriented* is its own design concern.

Frame-by-frame for the canonical first visit:

| Time | What happens | What the visitor learns |
|---|---|---|
| 0:00 | Visitor arrives via "look up" gesture from the Foyer; carpet rolls down (~1.4 s) | The sky exists above the Foyer |
| 0:01.4 | Demonstration drift begins; cursor glyph drifts autonomously to the nearest non-polestar star (~600 ms) | The cursor has presence; it can move |
| 0:02 | Drift completes; cursor settles; basin claims; halo crescendo on the demo star; faint label appears | Stars are addressable; settling is a moment |
| 0:03–0:05 | Label fades to italic at half-opacity; strip rises from at-rest to pointer-near as the visitor's pointer approaches the bottom | The strip exists at the edge |
| 0:05–0:30 | Visitor experiments. Drag, tap, hover, key. The constellation responds proportionally. | Wandering is the mode |
| 0:30+ | Visitor either opens a star (commits to reading) or continues wandering. | Both are valid; neither is forced |

What the visitor must understand within the first 5 seconds, by demonstration alone:

1. There's a constellation in front of them
2. They can move through it (the cursor's drift shows this)
3. Stars are openable destinations (the basin claim implies the affordance)

What they must *not* be told within the first 5 seconds:

- "Click here to begin"
- "Welcome to /sky"
- "Drag to navigate"

Every onboarding hint must come from the system's behavior, not its words. The Demonstration drift is the canonical onboarding move; everything else is the visitor learning by doing.

For returning visitors, the demonstration is suppressed (their cursor lands at its last position from `sessionStorage`). The first-visit choreography is *first-visit only* — repeat performances would feel like the system performing.

---

## Theme Crossfade

The day↔night transition is a meaningful event, not an instant toggle. Specifically:

- **The room is dimmed, not changed.** Stars stay where they are. Threads stay where they are. The cursor stays where it is. The polestar stays where it is. Only the *atmosphere* — sky color, atmosphere pool tone, halo saturation — crossfades over 500 ms.
- **The cursor's amber holds.** The visitor's body keeps its color. This is the visual signal that *you are unchanged; the room around you has shifted.*
- **The slow rotation does not pause or reset.** Rotation continues across the crossfade. Disruption of the rotation would betray the metaphor that the room is the same room.
- **Active states crossfade independently.** A focused star's gold halo crossfades to its dark-theme variant; a hovered chip's hue shifts; the atmosphere pool's tone slides from warm to cool-silver.
- **Reduced motion collapses the crossfade to ~80 ms.** The shift still happens; the duration just contracts.

Visually, the twin-sphere imagery in the mockup posters captures the relationship: light theme and dark theme are two photographs of the same world at different hours, not two different worlds.

---

## Living-Document Behavior

The constellation has a relationship with its visitors over time. The site grows; the visitor returns; the surface acknowledges both.

- **The slow rotation is the world's heartbeat.** It runs always — even when the visitor isn't looking, even when the constellation is in `Contemplative` state, even when the visitor is reading inside a `WorkOverlay` (visible at 30% behind the veil). The rotation persists across sessions: it has a stable phase tied to time, not to visit.
- **The polestar is constant.** Every visit, every theme, every state — the polestar is at the same world-position. It is the still center *across time as well as space.*
- **New works arrive visibly.** A returning visitor on a session where the corpus has grown sees `NewStarBloom` for ~10 s on first arrival, then the new stars settle to baseline. No badge, no banner — just the perceptual fact that there's *more sky to look at.*
- **Pinned places persist within a session, dissolve between sessions.** This is a deliberate commitment: the visitor's marks are intimate and ephemeral, not permanent. Returning starts fresh except for the highest-perceived-work-mtime (which drives the new-bloom).
- **The cursor's last position survives within a session, returns to polestar between sessions.** Mid-session: continuity of attention. Cross-session: *begin again.*
- **The contemplative drift is the world living without the visitor.** After ~80 s of no input, the cursor drifts toward the gravitational center (the most-connected star) and pauses there. The visitor returning notices that things have moved on — gently — without them.
- **The constellation's shape *is* the corpus.** Adding a work physically grows the cairn (per Pass 2's geometric commitment). The site's shape is what the writing has made; the constellation makes that visible.

These are not features. They are the design's commitment that the constellation is *alive* — quietly, continuously, with or without observation.

---

## Sample Content Convention

When designers produce mocks, they should use canonical sample content rather than inventing new copy. Consistency across mocks lets reviewers compare proposals without being distracted by varying placeholder text.

The convention is **astronomical poetry** — placeholder names sound like they could plausibly be Salon works, written in the site's voice.

### Canonical sample work

For all mocks of the work overlay, use:

- **Title:** *Orion's Heart*
- **Author:** *Lyra Bridge*
- **Date:** *2 days ago*
- **Read time:** *9 min read*
- **Deck:** *"A star is born not of flame, but memory and the push of gravity."*
- **Body opening:** *"When the nebula folds inward, it does not rush. It listens. Dust remembers collisions that happened long before light had a name. In that slow listening, gravity gathers the almosts — the hints, the maybes, the unformed."*
- **Facets:** Birth, Gravity, Memory, Light
- **Threads to:** *Star Birth Cycle*, *Nebular Memory*, *Return to Orion*

### Canonical sample pinned items

For PolestarPanel mocks:

- *Orion's Heart*
- *Draco's Gate*
- *Lyra Bridge* (author surface)
- *Recent: Vela Forge*

### Canonical sample search queries

For SearchActive mocks:

- *spanda* — single-match (one star pre-glows, others dim)
- *light* — multi-match (multiple stars at full opacity, others dim)
- *xerophile* — no-match (all dimmed; second-voice line: *"no stars match. clear filters."*)

### Naming conventions for new sample content

If a designer needs additional placeholder content beyond the canonical:

- **Star names** evoke single celestial objects or constellations: *Cassiopeia's Veil*, *Triangulum Glow*, *The Coalsack*.
- **Thread names** describe relationships poetically: *Birth Cycle*, *Inheritance Patterns*, *Return Phrasings*.
- **Author names** are stellar in style: *Lyra Bridge*, *Vela Forge*, *Andromeda Wells*.
- **Deck copy** is one or two short sentences, italic, second-voice, often with a colon and a turn. It invites without summarizing.

The convention is loose — designers can extend it — but the *register* (astronomical, poetic, italic, low-key reverent) must hold. Avoid lorem ipsum entirely; placeholders carry the site's voice or they lie about what we're building.

---

## Responsive Notes

> **Phone, tablet, and desktop preserve the same world. Chrome adapts, content scales, meaning holds.**

The constellation must work from 320 px (small phone, portrait) to 4K wide. The constellation as a *world* does not change between breakpoints — only chrome and FOV adjust.

### Five Breakpoints

A five-tier responsive system. Most design proposals only need to mock the middle three; the smallest and largest are edge-case studies.

| Tier | Range | Layout signature |
|---|---|---|
| **Phone** | ≥ 320 px | Single column; comfortable spacing; thumb-reachable controls |
| **Tablet** | ≥ 768 px | Two columns; balanced breathing; chrome at moderate density |
| **Desktop** | ≥ 1280 px | Three columns; expanded context; full chrome |
| **Wide** | ≥ 1600 px | Four columns; roomy navigation; constellation at large scale |
| **Ultra Wide** | ≥ 1920 px | Max columns; immersion mode; the constellation can fully fill the viewport |

### Adaptation Per Tier

| Property | Phone | Tablet | Desktop | Wide | Ultra Wide |
|---|---|---|---|---|---|
| Camera FOV | 55° vertical | 50° | 45° | 42° | 40° (narrower; more cinematic) |
| Camera distance | 1.9 × radius | 2.2 × | 2.5 × | 2.7 × | 2.9 × |
| Star halo size | ~1.6× body | ~1.4× | ~1.3× | ~1.2× | ~1.1× |
| HorizonStrip height | 12% viewport | 9% | 7% | 6% | 5% |
| Facet chips | 6 + "more" | 8 visible | 8 visible | 8 visible | 8 visible |
| Search field width (expanded) | 70% viewport | 50% | 35% | 30% | 25% |
| Radial echo ring radius | larger (touch) | medium | smaller | smaller | smaller |
| WorkOverlay layout | Full-screen sheet | Overlay + veil | Overlay + veil | Overlay + veil with side rail | Overlay + veil with side rail + breadcrumbs |
| Density target | 12 stars feel sparse | Balanced | Expanded | Roomy | Immersive |

### Phones in Landscape

Phone landscape is a real-but-rare orientation. Design proposals need not produce dedicated mocks; default behavior:

- Camera FOV widens slightly (~60° vertical) to compensate for shortened vertical space.
- HorizonStrip can move to the right edge if the phone is wide-enough (or stay bottom by default).
- WorkOverlay drops the bottom-sheet pattern and uses overlay + veil.

### Print

Print is a real viewport for the site's poetry and essays. /sky in print is a single static rendering: the constellation at the moment of print, with stars labeled, threads visible, no chrome. The polestar is centered. The result is a page that could be a folio plate from a star atlas — exactly the genre the aesthetic commits to.

---

## Accessibility Annotations

For designers marking up Figma files or other deliverables:

- **Every star is a link.** Mark its `aria-label` in the spec: `"{title} — in {room}"`.
- **The cursor glyph is decorative.** `aria-hidden="true"` in any annotation.
- **Threads are decorative.** No labels in screen-reader output.
- **Active basin must be perceivable without color.** A scale change, halo, or label is required (current spec uses scale + halo + label).
- **Focus rings must be visible at AA contrast** against any sky background.
- **Touch targets ≥ 24 × 24 px** for stars (invisible hit-circle expands beyond visible halo).
- **Reduced-motion mockups should also exist** for every state — design pairs.
- **Color contrast for facet chips and HorizonStrip** must clear AA against both light and dark sky backgrounds.

---

## Copy Patterns

The system speaks in **second voice** — italic, low-prominence, never declarative. Sample patterns, organized by surface:

**Stars and traversal:**

- Star label on settle: *"{title}"* (italic, no period)
- Star label hover (longer dwell): *"{title} — {room}, on {facets}"*
- Empty constellation: *"the constellation gathers"* (the heading-register copy when the sky is being populated)

**Search:**

- Placeholder: *"the constellation by name…"*
- Empty result: *"no stars match. clear filters."*

**Filtering and time:**

- TimeScrubbed indicator: *"as of {date} — {n} works"*
- Active filter pill (multiple): *"filtered by {facet1}, {facet2}"*

**Pin panel:**

- Header: *"places you've held"*
- Empty state: *"nothing held yet — long-press a star"*
- Legend: *"{N} works in {M} rooms, threaded by {P} facets"*

**Tracing:**

- Trace prompt on overlay close: *"continue with {next-title}"*

**Authoring trace:**

- New-since-last-visit (only when polestar panel is open): *"{n} new in the constellation"*

**System states:**

- LoadingSky: *"gathering"* (with orbiting loader)
- OfflineSky: *"you're offline. explore cached stars."*

**Voice rules:**

- Lower-case after periods unless proper noun
- Italic everywhere
- Never directives ("click here", "tap to open")
- Never confirmations ("filter applied", "saved")
- Always second-voice, never first-person system ("I noticed you…")
- Numbers spelled in copy when ≤ ten *unless* part of a count or date

---

## Reduced Motion

> **Same destinations. Different choreography.**

All the surfaces in the inventory remain reachable; the kinetic vocabulary changes. Specifically:

- All `Spring` and `Held` motions become `Snap` (≤ 100 ms fade).
- Parallax, streaks, and radial action blooms are removed entirely.
- Timing accelerates — settle becomes instant; halo claim becomes a static state, not a crescendo.
- The autonomous demonstration drift on first visit doesn't happen; cursor sits at the polestar.
- The contemplative drift doesn't happen; idle is just idle.
- WebGL atmosphere stops the noise drift; the pool stays static at the cursor's position.
- Theme crossfade collapses from 500 ms to 80 ms.

State hierarchy, meaning, and outcomes remain identical. A reduced-motion visitor can still wander, filter, search, pin, and open every star. They just don't feel the kinetic vocabulary that carries the world's life. **Designers must produce reduced-motion pairs for every animated state in the canonical set.**

---

## System Voice in /sky

The constellation has two voices, and they must never be confused.

- **Danny's voice** is the work content — poems, essays, case studies, decks. It is whatever Danny wrote. The system reproduces it faithfully.
- **The system's voice** is everything else: labels, placeholders, status messages, microcopy. It speaks in *italic, second voice, never directives.*

The system speaks in roughly five registers, in descending volume:

| Register | When | Sample |
|---|---|---|
| **Whispered narration** | Star labels on settle, focused star labels | *"{title}"* |
| **Contextual hint** | Star hover with longer dwell | *"{title} — {room}, on {facets}"* |
| **System status** | Filter active, time-scrubbed, search results | *"as of {date} — {n} works"* |
| **Empty / loading / offline** | When the system has nothing to show or is reaching for it | *"the constellation gathers"* / *"gathering"* / *"you're offline. explore cached stars."* |
| **Authoring trace** | Quiet acknowledgment of new content | *"{n} new in the constellation"* (only inside polestar panel) |

**Forbidden registers:**

- **Imperative** — *"click here"*, *"tap to begin"*, *"swipe to filter"*. Never. The system shows; it does not instruct.
- **Confirmatory** — *"filter applied"*, *"saved"*, *"opening…"*. Never. State is visible; it does not need narration.
- **First-person system** — *"I noticed you…"*, *"Welcome back!"*. Never. The system is not a character; it is a place.
- **Marketing** — *"Discover the constellation"*, *"Explore your library"*. Never. The work is the work; the experience is the experience.

If a designer or developer is tempted to add system copy that doesn't fit these registers, the right move is usually to *remove the copy entirely* and let the visual state carry the meaning.

---

## Audio Considerations (Held)

Audio is held — no Salon work currently requires it — but when it arrives, the design must already know what audio in /sky means. Naming the placeholder now prevents surprise later.

**Coordinates of audio in /sky:**

- **Ambient layer** — a low drone or held chord underneath the constellation. Subtle, almost-silent, only in dark theme, only when the visitor's tab is foregrounded. Honors `prefers-reduced-data` and `prefers-reduced-motion`. Off by default; opt-in via a quiet glyph somewhere in chrome (held question — likely in PolestarPanel).
- **Cursor settle into a basin** — soft attack, hue-mapped pitch (warm hues = lower pitch, gold = higher pitch). Almost inaudible at default volume; carries information for visitors who choose to listen.
- **Drag** — continuous filtered noise scaled by tangent velocity. Reads as the world responding to motion. Off by default; opt-in.
- **Work overlay open** — a held breath, a gentle reverb tail. Marks the moment of arrival into a work.
- **Salon work referent** — when a Salon work has an audio referent (Bach, Pärt, Spiegel), the work overlay can play it as ambient context while the visitor reads. Opt-in per-work.

**Forbidden audio:**

- Notification chimes, success sounds, error beeps, jingles
- Voice narration that isn't part of a work's content
- Audio that plays without explicit visitor opt-in
- Audio that auto-plays on arrival
- Looping music

**The principle:** audio in /sky behaves the same way light does. Concentrated around attention, recedes when not invoked, theme-aware, honors reduced-data and reduced-motion. Never asserts itself.

When audio lands, designers should add an `Audio Cues` subsection here that mirrors the Visual Cues vocabulary — naming the canonical sounds and what they signal.

---

## Asset Deliverables

A designer producing the canonical hi-fi set should deliver:

1. **All 12 canonical surfaces** (S0, S2, S3, S4, S6, S7, S8, S9, S10, S11, S13, S15) in light and dark theme = 24 mockups.
2. **All 14 components** with all states laid out as a component sheet.
3. **All 10 flows** as storyboard sequences (frame-by-frame).
4. **Variant explorations** for at least V1 (cursor), V6 (HorizonStrip placement), V8 (chip style), V12 (overlay layout) — these are the highest-leverage held questions.
5. **Three responsive variants** (phone, tablet, desktop) of S2 and S7.
6. **Reduced-motion versions** of S0 (arrival), S4 (drag), S12 (open) showing the snap-fallback.
7. **First-arrival demo motion** as an animated prototype.
8. **Empty state, loading state, error state** mockups (S17, S18, plus error inside S13).

---

## Open Design Questions

Surfaced for proposal. Each is a held tension; closing one means picking a variant, naming the rationale, and updating this document.

| ID | Question | Variants | Closes when |
|----|----------|----------|-------------|
| Q1 | What is the cursor's visual identity? | V1.A–E in C1 | A designer makes a felt-sense pick after seeing motion in real device |
| Q2 | Where does HorizonStrip live? | V6.A–E in C6 | After a usability touch-test on real mobile |
| Q3 | What is the WorkOverlay layout? | V12.A–D in C12 | After a content-density mock with a real essay |
| Q4 | Search field placement | V7.A–D in C7 | After observing what visitors reach for first |
| Q5 | Time scrubber form | V9.A–D in C9 | After a paper prototype with the corpus's date distribution |
| Q6 | Should threads be tappable as travel paths? | (yes / no / only-when-mode-invoked) | Decide after thread-traverse flow gets first-form mock |
| Q7 | Should the cursor persist across page reloads? | (sessionStorage only / localStorage / never) | After thinking through privacy + the "begin again" felt sense |
| Q8 | Multi-select for comparison | (held; no design needed yet) | When a use case appears |
| Q9 | Audio | (held; no design needed yet) | When a Salon work requires it |
| Q10 | Constellation patterns (named clusters) | (editorial decision, not design) | Danny names the first pattern |
| Q11 | First-visit demo motion's path | (drift to nearest / drift to most-connected / drift to most-recent) | After a/b paper prototype |
| Q12 | What does "leaving /sky" feel like? | (fade / zoom-out / carpet-furl-up) | After defining the inverse arrival |

---

## What This Document Is Not

This is a designer's working document. It is not:

- A product requirements document. Those decisions live in `INFORMATION_ARCHITECTURE.md` and `CONSTELLATION.md`.
- A visual identity guide. That lives in `DESIGN_SYSTEM.md`.
- A motion specification. Easings and durations live in `INTERACTION_DESIGN.md` and the source.
- A technical implementation spec. That lives in `CONSTELLATION_HORIZON.md` and the source.

This document is the bridge between the *experience* the constellation must deliver and the *artifacts* (Figma files, Lottie files, prototypes) a designer produces. Read it before sketching; update it after deciding.

---

## Cue Legend / Master Glossary

A one-page reference. Designers and engineers should be able to find any term they encounter elsewhere in the doc here, with a short definition and a pointer to where it's defined in full.

### Constellation Lexicon (the world)

| Term | Definition | Defined in |
|---|---|---|
| **Star** | A single work; addressable; always a real link | C2 |
| **Thread** | A relationship between two stars; visual, not announced to assistive tech | C3 |
| **Basin** | A collection of stars the cursor can settle into (the editorial cluster) | Lexicon |
| **Facet** | A curatorial angle works share; eight in the site's vocabulary | Lexicon |
| **Horizon** | The temporal edge; where time lives in the chrome | Lexicon |
| **Polestar** | The still center; the geometric figure at world center | C5 |

### Visual Cues (the named motions)

| Cue | What it signals | Where |
|---|---|---|
| **Halo claim** | Owned/focused star | S6, S3 |
| **Radial action bloom** | Choices branching from cursor | S7 |
| **Strip thickening** | Filter/time engaged | S9, S10 |
| **Atmosphere dimming** | Visitor went quiet | S15 |
| **Overlay veil** | Content takes focus, world steps back | S13 |

### Components (the reusable matter)

| Component | One-line | Defined in |
|---|---|---|
| **CompanionGlyph** | The visitor's body | C1 |
| **Star** | A work, addressable | C2 |
| **Thread** | An authored connection | C3 |
| **AtmospherePool** | Light around the cursor | C4 |
| **Polestar** | The still center | C5 |
| **HorizonStrip** | Edge chrome | C6, Horizon System |
| **SearchField** | Predicate input | C7 |
| **FacetChip** | Filter toggle | C8 |
| **TimeScrubber** | Temporal control | C9 |
| **RadialEcho** | Context actions at cursor | C10 |
| **PolestarPanel** | Session console | C11 |
| **WorkOverlay** | Reading surface | C12, Work Surface |
| **PinRibbon** | Mark on a pinned star | C13 |
| **NewStarBloom** | First-arrival pulse for unread works | C14 |

### Surface States (the inventory)

Twenty named states (S0–S19) the constellation can be in. See **Surface Inventory** for the full table. The canonical 12 — `Arrival`, `Idle`, `Hover`, `Dragging`, `BasinSettled`, `RadialEcho`, `SearchActive`, `FilterActive`, `TimeScrubbed`, `PinPanelOpen`, `WorkOpen`, `Contemplative` — are the ones every design proposal should cover (light + dark = 24 mocks).

### Motion Register

| Vocabulary | Tempo | Used for |
|---|---|---|
| **Slow** | 10 s+ | Background rotation, polestar |
| **Held** | 1–2 s | Thread travel, opening/closing overlay, demo drift |
| **Reach** | 300–600 ms | Filter dimming, theme crossfade, panel reveal, label fade-in |
| **Spring** | continuous | Cursor follow during drag |
| **Settle** | 200–400 ms | Basin claim acknowledgment, halo crescendo |
| **Snap** | ≤ 100 ms | Reduced-motion fallback; focus ring |

### Color Tokens (named palette)

**Light theme:** paper umber · horizon warmth · quiet chrome · rose facet · violet facet · gold facet · warm facet · amber cursor.

**Dark theme:** deep night-blue · horizon warmth · cool silver atmosphere · rose facet · violet facet · gold facet · warm facet · amber cursor.

*Amber cursor is theme-invariant by design.*

### Material Tokens

paper grain · watercolor halo · brushstroke thread · atmosphere pool · geometric polestar · quiet chrome.

### Typography Registers

heading · deck · body · metadata/second voice · system voice. *No sans-serif.*

### Surface Layering (back to front)

sky background → atmospheric noise → atmosphere pool → polestar → threads → stars → cursor glyph → horizon strip → radial echo → polestar panel / pin panel → work overlay.

### Negative Space

/sky is **not** a graph database visualizer, gallery, feed, dashboard, CMS, 3D product tour, game, tutorial, social surface, or minimalist composition.

### Foundation (Six Principles)

world-like navigation · quiet chrome · continuous reachability · spatial reading · second-voice microcopy · serif-only language.

### Sample Content

Canonical sample work: ***Orion's Heart*** by *Lyra Bridge*. Sample threads: *Star Birth Cycle*, *Nebular Memory*, *Return to Orion*. Sample pinned items: *Draco's Gate*, *Lyra Bridge*, *Vela Forge*.

---

*This document is held vision. The state inventory and component list are commitments — these are the things that must exist for the experience to be real. The variants are open — they need design proposals, not engineering decisions. When a variant closes, this document updates and the closed alternatives retire from the list.*
