# Constellation Design

*Working document for visual and interaction design of the latent-sphere navigation surface. The companion to `CONSTELLATION.md` (the held experience) and `CONSTELLATION_HORIZON.md` (the technical envisioning). This file holds **the design read** — what a designer needs to produce hi-fi mockups, storyboard alternatives, and hand off to engineering.*

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

## Brief

The visitor encounters a small spherical world holding every work the site has authored. They navigate it continuously by gesture, keyboard, or assistive technology. They can wander, filter, search, mark places to return to, view the constellation as it was at past dates, and open any star to read the work. All chrome retires when not invoked. Every state must be reachable from any other in at most two gestures. The experience must feel like visiting a place, not operating an interface.

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

For each component: **anatomy** (parts), **states** (variations), **behavior** (what it does), **constraints** (what it must not become), **variants** (open questions for the designer to propose against).

### C1. CompanionGlyph

*The visitor's body in the world.*

**Anatomy:** A small mark on the sphere's surface. Optionally a halo, a trail, or a label.

**States:**

- `at-rest-no-active` — visitor hasn't settled into a basin yet
- `at-rest-on-active` — settled into a basin; glyph adopts that star's hue
- `dragging` — visitor's finger or pointer is down
- `coasting` — momentum-driven motion after a flick
- `traveling` — moving along a thread to another star
- `behind-camera` — hidden (theoretical: cursor on the far hemisphere)

**Behavior:** Always at the visitor's current sphere position projected to screen. In motion, leaves a brief trailing fade. When at rest on an active basin, hue-shifts to that star's facet color.

**Constraints:** Never tooltip-like. Never carries text. Never has interactive affordance (the *star* is the affordance, not the glyph).

**Variants to explore:**

- **V1.A: Comet** — a small bright dot with a streaking trail. Reads as motion-through-space.
- **V1.B: Soft light** — a halo with no hard center. Reads as a presence rather than a pointer.
- **V1.C: Compass needle** — a tiny directional mark that orients toward the active star. More directional information; risks reading as chrome.
- **V1.D: Thread-spool** — leaves a faint persistent line behind it as it moves; the visitor's path becomes visible. Risks visual clutter.
- **V1.E: Breath** — a slow pulse at rest, intensifying when the basin claims. Most subtle; risks being missed.

### C2. Star

*A single work, addressable.*

**Anatomy:** A halo (soft outer disc), a body (the addressable point), an invisible hit-target. Optional: label, ribbon-mark for pinning, depth-scale, depth-opacity.

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

**Behavior:** Visual emphasis composes additively from depth (closer = larger), focus state (focused = brighter halo), filter (matched = full opacity), and basin claim (active = labeled).

**Constraints:** Always a real link. Never a button. Never has a tooltip on hover that follows the pointer.

**Variants to explore:**

- **V2.A: Single-mark** — one solid dot, no halo. Cleanest; risks reading as flat.
- **V2.B: Halo-and-body** — current implementation; soft halo with brighter center.
- **V2.C: Particle cluster** — each star is multiple tiny dots forming a soft constellation-of-particles. More texture; harder to render performantly.
- **V2.D: Plate-and-pin** — a flat disc with a small raised mark; reads as held in space rather than glowing.

### C3. Thread

*A connection between two works.*

**Anatomy:** A line between two star positions. Optional midpoint label, optional tapered thickness, optional braided pair (when two threads share endpoints).

**States:**

- `default` — barely visible wisp
- `endpoint-active` — one of its stars is the cursor's basin
- `both-endpoints-active` — rare: both stars are in a multi-select or comparison
- `traveling-along` — visitor is currently traversing this thread (cursor moving)
- `dimmed-by-filter` — filter excludes one or both endpoints
- `behind-camera` — hidden when one endpoint clips out of the visible hemisphere

**Behavior:** Renders at low opacity by default. On endpoint focus, threads from that endpoint bloom in their facet hues. When traveling, the active thread brightens and may show motion (a small bright bead moving along it) for the duration.

**Constraints:** Never captures pointer events directly *unless* the visitor has explicitly invoked thread-traversal mode (a held question — see V11). Never decorative; every thread is an authored connection.

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

*Bottom-edge chrome.*

**Anatomy:** A thin horizontal band along the bottom 6–10% of the viewport. Contains, from left to right: foyer-glyph (back), search icon (or expanded field), facet chips (8 small marks), timeline scrubber (centered, hidden until invoked), pin-panel toggle.

**States:**

- `at-rest` — strip is ~15–25% opaque, all controls minimal
- `pointer-near` — strip rises to ~70% opacity; controls become legible
- `actively-using` — full opacity for the controls being used; rest stays at 70%
- `filter-active` — strip thickens slightly (more vertical presence) when filters are active; visual indication that the constellation is "lensed"
- `hidden` — never; the strip always exists at minimum opacity (held question — see V6)

**Behavior:** Controls within the strip animate independently. Hover/focus reveals labels. The strip itself is a parent surface.

**Constraints:** Never floats above the constellation as overlay. Never wider than the viewport. Never carries primary navigation (the constellation IS the navigation).

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

**Anatomy:** A small ring of 3–5 secondary actions (open, pin, copy-link, find-related, time-of-this-work) appearing around the cursor's screen position when a basin is settled.

**States:**

- `dormant` — invisible
- `appearing` — fades in over ~200 ms after settle
- `present` — full visibility; visitor can hover/tap an action
- `dismissing` — fades out on motion or 1.5 s of no input

**Behavior:** Appears at cursor position, not at a fixed corner. Actions are buttons; Tab cycles through them (after the star itself in tab order).

**Constraints:** Never blocks the active star. Never persists beyond a clear gesture or motion. Never the same set on every star (e.g., a Salon work might offer "play referent" if it has audio).

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

*The opened work surface.*

**Anatomy:** Full content of a work (heading, deck, body, facets, thread to parents/children). Background: the constellation, partially visible behind a soft veil.

**States:**

- `opening` — rises from the activated star's screen position over ~600 ms
- `open` — content readable; constellation behind at ~30% opacity
- `scrolling` — visitor scrolls; constellation stays put behind
- `closing` — collapses back to the star's position
- `loading` — work content is being fetched (rare on this static site)
- `error` — work failed to load; inline error with retry

**Behavior:** The View Transitions API morphs the star into the overlay. Closing reverses. Browser back returns to /sky with cursor at that star.

**Constraints:** Never replaces the constellation. The constellation remains rendered behind, slowly rotating, atmosphere muted. Visitor can dismiss to see it again with one gesture.

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

- **Heading register** (S13 work overlay heading, polestar panel section labels): serif display, generous leading.
- **Body register** (work content): serif body, prose leading.
- **Second voice** (labels, microcopy, the system's whispered narration): italic serif at meta size.
- **System voice** (chip labels, search placeholder, button labels): italic serif at meta or chip size.
- *No sans-serif, anywhere in /sky.* The sky speaks in the same voice as the rest of the site.

### Color

- **Background**: paper umber (light) / deep night-blue with horizon warmth (dark).
- **Stars**: facet-hued (warm, rose, violet, gold per facet pair).
- **Threads**: facet-hued at low opacity, brightening on focus.
- **Cursor glyph**: warm (amber) by default, hue-shifting toward active basin's color.
- **Atmosphere pool**: theme-toned (warm in light, cool-silver in dark) with saturation boost in the pool zone.
- **HorizonStrip and chrome**: --text-3 (the quietest tone), barely-there.
- **Active filter chip**: full facet color.
- **Pin ribbon**: --accent-warm regardless of star's hue (consistent visual signal).

### Motion register

| Vocabulary | Use |
|---|---|
| **Slow** (10s+) | Background rotation, polestar |
| **Held** (1–2 s) | Travel along a thread, autonomous demonstration drift, work overlay open/close |
| **Reach** (300–600 ms) | Filter dimming, theme crossfade, panel open, label fade-in |
| **Spring** (continuous) | Cursor follow during drag |
| **Settle** (200–400 ms) | Basin claim acknowledgment, halo crescendo |
| **Snap** (≤100 ms) | Reduced-motion fallback for any animation, focus ring |

### Materials

- **Sky**: paper-grain texture (visible noise, not photographic).
- **Stars**: watercolor halos (soft edges, paper-bleed look).
- **Threads**: brushstroke-like, not laser-thin.
- **Atmosphere pool**: soft-light blend, never a hard disc.
- **Polestar**: geometric figure (existing site ornament).
- **Chrome**: barely-rendered when at rest; gentle when active.

---

## Responsive Notes

The constellation must work from 320 px (small phone, portrait) to 4K wide. Key responsive shifts:

| Property | Phone (≤640 px) | Tablet (641–1024) | Desktop (>1024) |
|---|---|---|---|
| Camera FOV | 55° vertical | 50° vertical | 45° vertical |
| Camera distance | 1.9 × radius | 2.2 × radius | 2.5 × radius |
| Star halo size | ~1.6× of body | ~1.4× of body | ~1.3× of body |
| HorizonStrip height | 12% of viewport | 9% of viewport | 7% of viewport |
| Facet chips | 6 + "more" expander on small | 8 visible | 8 visible |
| Search field width when expanded | 70% of viewport | 50% | 35% |
| Radial echo ring radius | larger (touch reach) | medium | smaller |
| WorkOverlay layout | full-screen sheet | full-screen with veil | overlay with veil |

The constellation as a *world* does not change between breakpoints. Only chrome and FOV adjust.

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

The system speaks in second voice — italic, low-prominence, never declarative. Sample patterns:

- Star label on settle: *"{title}"* (italic, no period)
- Star label hover (longer dwell): *"{title} — {room}, on {facets}"*
- Search placeholder: *"the constellation by name…"*
- Empty filter result: *"the constellation has no works on those threads"*
- TimeScrubbed indicator: *"as of {date} — {n} works"*
- Pin panel header: *"places you've held"*
- Pin panel empty: *"nothing held yet — long-press a star"*
- Polestar panel legend: *"{N} works in {M} rooms, threaded by {P} facets"*
- Trace prompt on overlay close: *"continue with {next-title}"*
- Authoring trace (new since last visit): *"{n} new in the constellation"* — only if the visitor explicitly opens the polestar panel; otherwise no copy, just the bloom

Voice rules:

- Lower-case after periods unless proper noun
- Italic everywhere
- Never directives ("click here")
- Never confirmations ("filter applied")
- Always second-voice, never first-person system

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

*This file is held vision. The state inventory and component list are commitments — these are the things that must exist for the experience to be real. The variants are open — they need design proposals, not engineering decisions. When a variant closes, this document updates and the closed alternatives retire from the list.*
