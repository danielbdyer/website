# Constellation Implementation Audit

*A prerequisite diagnostic. What `CONSTELLATION_DESIGN.md` commits to, what the codebase currently implements, and the gap between the two. Companion to the design document; not a plan.*

---

## What this document is

This is an **audit**, not a plan.

- An **audit** names what exists, what's committed, and the delta between the two. It is structural and inventory-shaped. Its job is to make the gap legible so any subsequent decision is made knowingly.
- A **plan** chooses a path through the gap, sequences moves, and assigns priorities. Plans are downstream of audits. This document does not contain a plan.

If a downstream agent or human reads this and feels the impulse to start coding, that impulse is misdirected — the next document needed is a plan, and the plan should be authored deliberately, against a chosen pull (per `architecting`'s discipline of *spanda*: don't move until the tremor is there).

The audit's discipline: when in doubt, describe rather than recommend. Mark every recommendation that slips in (there will be a few) as a *note* so the audit's structural integrity is preserved.

---

## How to read this

Each audited item carries a status marker:

- **present** — committed and implemented; matches the design's intent
- **partial** — some of it exists; meaningful elements remain unbuilt
- **absent** — committed but no implementation exists
- **drift** — implementation exists but disagrees with the current commitments (older code, evolving spec, or contradictory ground)
- **held** — design names it as a held question; no implementation expected

Markers are coarse-grained. They are not effort estimates. A row marked **absent** may be small to address (a missing copy line) or large (a missing component). The audit does not care; it cares that the gap exists and is named.

**A distinction the markers do not encode but a reader should hold:**

- **absent** is structural — the codebase doesn't carry the thing, and the design has named that it should.
- **held** is intentional — the design has named that the thing waits for a tremor before being built. *Absent* and *held* are sometimes adjacent rows in the same row of the audit; the difference is whether the design wants the thing soon, or wants it eventually.

Per the architecting practice (see `architecting` skill, the spanda commitment), many things in this audit are **legitimately absent because they have not yet been pulled into being.** A design commitment that is *named* is not the same as a design commitment that is *due*. Treating *every absent row as a backlog item* would violate the practice — the audit's job is to make legibility, not pressure. The plan that closes the gap (when it pulls) chooses what to bring into being and what to keep held.

The audit is structured by surface area, not by task:

- **Surface inventory** — the named states of /sky
- **Component library** — the reusable parts
- **Behavioral commitments** — the cross-cutting behaviors not tied to a single component
- **Foundation principles** — the six commitments at the top of the design doc
- **Aesthetic, semiotic, epistemic, stylistic** — the meaning-layer adherence
- **Architectural readiness** — the platform underneath
- **Specs and tests in drift**

---

## Ground state

What Pass 2 shipped (in chronological commit order on `claude/3d-graph-navigation-Vmj5Z`):

- **Phase A** — latent sphere positions in `ConstellationNode.unitPosition`; `src/shared/geometry/sphere.ts` with smart constructors and law-tested conversions.
- **Phase B** — `src/shared/geometry/camera.ts` with right-handed look-at + perspective projection; `STAGE_CAMERA` and `projectToViewbox` in `layout.ts`; renderer routes through camera.
- **Phase C** — geodesic basin physics in `useConstellationNavigation.ts`; cursor as `UnitVector3` on the sphere; tangent velocity; ray-cast pointer events through `unproject` + `raySphereIntersect`.
- **Phase D** — companion glyph (`<circle data-companion>`) at the cursor's projected screen position; updates per RAF tick.
- **Phase D2** — orbital camera (`cameraSurfacePos` slerping toward cursor), per-frame DOM re-projection of all stars and threads, `cameraBasis` rebuilt each tick.
- **Phase E** — WebGL firmament reads cursor from `src/shared/state/constellationCursor.ts` shared signal; shader gains squared-falloff "rotund" pool + saturation boost.

Surrounding infrastructure:

- `/sky` route prerendered (SSG); `/sky/{room}/{slug}` overlay route exists (TanStack file-based routes).
- `WorkOverlay` molecule renders work content over the firmament with a backdrop link to `/sky`.
- `useConstellationParallax` adds cursor-driven parallax via CSS variables.
- `useStarHoverState` manages active-key state with event-delegated focus/hover handlers.
- Sky-arrival animation (lift-and-pitch perspective reveal, ~1350 ms) on /sky mount.
- Theme store at `src/app/providers/theme-store.ts` with localStorage persistence and cross-tab sync.
- Reduced-motion fallback in `useConstellationNavigation` (snap to nearest, no RAF).
- 276 vitest tests covering geometry, navigation, layout, atoms, organisms, hooks.
- Playwright performance gate (long-task delta) for /sky interaction.

This is the foundation against which the design doc's commitments are audited below.

---

## Surface inventory audit

For each `Sx` from `CONSTELLATION_DESIGN.md` §"Surface Inventory":

| ID | Surface | Status | Note |
|----|---------|--------|------|
| S0 | `Arrival` | **present** | Sky-arrival animation in `tokens.css` (`sky-look-up` keyframes, 1350 ms perspective reveal). Carpet roll is conceptually implemented; the design's hi-fi mock register may differ. |
| S1 | `Demonstration` | **absent** | No autonomous cursor drift on first arrival. Cursor sits at polestar until the visitor moves. |
| S2 | `Idle` | **present** | The default state of /sky after arrival. |
| S3 | `Hover` | **partial** | Pointer hover triggers `setActiveKey` via `useStarHoverState`, which causes thread bloom. The design's named *halo claim* visual cue is partial; star scale-up and label reveal are not fully implemented. |
| S4 | `Dragging` | **present** | Pointer drag → `state.dragTarget` set; spring physics pulls cursor; flick velocity captured. |
| S5 | `Coasting` | **present** | Post-flick coasting via `state.vel` and `FREE_DAMPING`. |
| S6 | `BasinSettled` | **partial** | Cursor settles into a basin; `flipActive` updates `setActiveKey`. Visual *halo claim* (scale-up, label, halo crescendo) is partial — the active-state visual is currently the existing thread bloom, not the richer mock. |
| S7 | `RadialEcho` | **absent** | No radial action menu exists. |
| S8 | `SearchActive` | **absent** | No search field or matching system in /sky. |
| S9 | `FilterActive` | **absent** | No facet-chip filter UI in /sky. (FacetChip atom exists but for `/facet/{facet}` route pages.) |
| S10 | `TimeScrubbed` | **absent** | No timeline scrubber. |
| S11 | `PinPanelOpen` | **absent** | No polestar panel. No pin model. |
| S12 | `WorkOpening` | **partial** | `WorkOverlay` molecule mounts on `/sky/{room}/{slug}` with a fade-in. View-Transitions API morph (star → overlay) is **absent**. |
| S13 | `WorkOpen` | **partial** | Overlay shows work content. Background veil with the constellation visible behind: **partial** (constellation continues to render but veil opacity / blend behavior may not match committed design). |
| S14 | `WorkClosing` | **partial** | Backdrop click / `Esc` close via `closeHref`. Reverse-Open animation (collapse-to-star) is **absent**. |
| S15 | `Contemplative` | **absent** | No long-idle detection; no autonomous drift to gravitational center; no atmosphere-dimming on prolonged inactivity. |
| S16 | `Filtered+Searched` | **absent** | Composite state; depends on S8 + S9 first. |
| S17 | `EmptySky` | **partial** | Renderer handles zero nodes (graceful render); committed second-voice copy *"the constellation gathers"* is **absent**. |
| S18 | `LoadingSky` | **absent** | /sky is prerendered SSG; loading state largely doesn't apply at runtime. Edge case (slow hydration) is unhandled visually. |
| S19 | `OfflineSky` | **absent** | No offline detection; no committed *"you're offline. explore cached stars."* surface. |

**Summary:** core traversal surfaces (Arrival, Idle, Dragging, Coasting, BasinSettled) are present. Chrome-mediated surfaces (Search, Filter, Time, Pin, Radial) are absent. The work surface is partial — the route works but the morph and reverse-open are not.

---

## Component library audit

For each `Cx` from `CONSTELLATION_DESIGN.md` §"Component Library". Anatomy parts noted where partial/absent.

### C1. CompanionGlyph — **partial**

- Center mark, halo: **present** (basic circle with watercolor halo filter).
- Trail: **absent**.
- Active hue shift: **absent** (glyph stays at amber regardless of active basin).
- Reduced-motion equivalent: **partial** (glyph doesn't drift but pulse / breath cue is absent).

### C2. Star — **partial**

- Halo, body, hit target: **present** (24px hit circle, watercolor-haloed body).
- Optional label: **absent** (no label rendered on settle or hover currently in /sky).
- Pin mark: **absent**.
- States: `default`, `hover`, `focused`, `active-basin`, `dragged-toward`, `opening` are partially handled by CSS/data attributes; `dimmed-by-filter`, `pinned`, `new-since-last-visit`, `time-dimmed` are **absent**.

### C3. Thread — **partial**

- Path line: **present**.
- Endpoint glow: **partial** (active state highlights endpoints visually; `endpoint-active` data attribute drives stroke width).
- Active brightening on hover/travel: **partial** (stroke width and filter change on `active`; full bloom and travel-along visualization absent).
- States: `default`, `endpoint-active` present; `both-endpoints-active`, `traveling-along`, `dimmed-by-filter`, `behind-camera` **absent**.

### C4. AtmospherePool — **present** (extended)

- WebGL pool follows constellation cursor signal (Phase E).
- Squared-falloff rotund profile: **present**.
- Saturation boost in pool zone: **present**.
- Per-star halos with breathing twinkle (per-star phase): **present**.
- Polestar wash with slow tidal swell (~14s breath): **present**.
- Drifting motes (four, on slow Lissajous paths): **present**.
- Aspect-corrected falloff so circular halos render as circles: **present**.
- Theme-aware tone via `uTheme` mix; palette re-resolved on theme toggle: **present**.
- Cross-loop coordination: skyProjector writes post-rotation positions to a shared `atmosphericScene` signal each RAF tick; the shader reads them on its own RAF without coupling lifetimes — same pattern as `constellationCursor`.
- *Twin pools* / *no pool* / *polaroid* variants: **held**.
- Cursor-responsive twinkle modulation (twinkle intensity reading cursor proximity): **held**.
- Depth-aware shader parallax (multiple atmospheric layers at different depths): **held**.

### C5. Polestar — **present**

- Geometric figure at world center: **present** (`Polestar` atom).
- Slow rotation: **present** as part of `constellation-rotates` group.
- Tap-to-open-panel behavior: **absent** (depends on PolestarPanel, which is absent).

### C6. HorizonStrip — **absent**

- The entire strip is unbuilt. None of the five named regions (foyer glyph, search area, facet chips, timeline zone, pin toggle) exists in /sky chrome.
- `bottom-edge / ambient` placement: **absent**.
- States `at-rest`, `pointer-near`, `actively-using`, `search-active`, `filter-active`, `time-active`, `pin-panel-access`, `low-visibility-contemplative`: **absent**.

### C7. SearchField — **absent**

- Search-by-title-or-content predicate: **absent**.
- Inline expansion within strip: **absent**.

### C8. FacetChip — **drift**

- A `FacetChip` atom exists (`src/shared/atoms/FacetChip/FacetChip.tsx`) and is used by `WorkEntry`, `WorkView`, `FacetCard`, `WorkRow`, `WorkOverlay` as a *display-only chip* showing a work's facets.
- The committed in-/sky FacetChip is a *toggleable filter* with active/dimmed states. The current atom does not toggle and does not filter the constellation.
- **Drift** rather than **absent** because the name is taken; reusing the name for the new role would conflict.

### C9. TimeScrubber — **absent**

- No timeline control of any kind. Time-scrub state in the constellation: **absent**.

### C10. RadialEcho — **absent**

- No radial menu around the active star.

### C11. PolestarPanel — **absent**

- No panel rises from the polestar. No pinned-list display. No session console.

### C12. WorkOverlay — **partial**

- The molecule (`src/shared/molecules/WorkOverlay/WorkOverlay.tsx`) renders work content with title, deck, body, facets, an outward invitation, a close link, and Esc-handling.
- Anatomy parts:
  - Title, deck, body, facets, thread references: **present** (note: facets render via the existing FacetChip atom in display-only mode).
  - Background veil with constellation visible behind: **partial** (constellation continues to render at /sky/{room}/{slug} but the named *overlay veil* with specific blend/opacity is approximate).
  - Close control: **present**.
  - Return-to-star behavior: **partial** (closing returns to /sky; the cursor's last position persisting through the round-trip is **absent**).
- View-transition morph from star: **absent**.

### C13. PinRibbon — **absent**

- No pinning mechanism. No persistent star marker.

### C14. NewStarBloom — **absent**

- No "new since last visit" detection. No localStorage manifest of highest perceived work-mtime. No pulse on first arrival of a session with newer works.

---

## Behavioral commitments audit

Cross-cutting behaviors not tied to a single component.

| Behavior | Status | Note |
|---|--------|------|
| Latent sphere positions for every star | **present** | `unitPosition: UnitVector3` derived in `placeNode`. |
| Perspectival projection through camera | **present** | `STAGE_CAMERA`, `projectToViewbox`, `cameraBasis`. |
| Geodesic basin physics on sphere surface | **present** | `sphericalBasinForce`, `tangentTowards`, `geodesicNearestNode`. |
| Cursor lives on the sphere as `UnitVector3` | **present** | `state.pos` is mutable Vec3 normalized to sphere. |
| Tangent velocity (perpendicular to position) | **present** | `state.vel` re-projected onto tangent plane each tick. |
| Pointer ray-cast through camera onto sphere | **present** | `pointerToSphere` → `unproject` + `raySphereIntersect`. |
| Spring-tension drag toward target | **present** | `DRAG_SPRING`, `DRAG_DAMPING` in tangent space. |
| Flick velocity injection on release | **present** | `flickAngularVelocity` + `FLICK_SCALE`. |
| Held-arrow-key directional acceleration | **present** | `tangentHoldDirection` against camera basis. |
| Reduced-motion: snap-to-nearest fallback | **present** | `prefersReducedMotion()` short-circuits the RAF loop and snaps. |
| Camera orbits sphere (cursor leads, camera trails) | **present** | `cameraSurfacePos` slerps toward `state.pos` with `CAMERA_LAG_RATE`. |
| Per-frame DOM re-projection of stars + threads | **present** | `projectScene` mutates transform / x1y1x2y2 attrs each tick. |
| Companion glyph at cursor's projected position | **present** | DOM mutation of `<circle data-companion>` cx/cy each tick. |
| WebGL atmosphere following cursor signal | **present** | `constellationCursor` shared signal; firmament reads each frame. |
| Per-star halos with breathing twinkle in WebGL | **present** | `atmosphericScene` shared signal; skyProjector writes post-rotation positions per RAF tick; shader paints additive halos with sin(uTime + phase) twinkle. |
| Polestar wash with slow tidal breath | **present** | Shader paints a vUv=center radial wash on a ~14s sin cycle. |
| Drifting motes (four, slow Lissajous) | **present** | Shader-resident; cheap. |
| Camera yaw flourish from velocity | **present** | `applyCameraYaw` writes `--cam-yaw` CSS variable. |
| Slow background rotation (600s/cycle) | **present** | `constellation-rotates` CSS animation. |
| First-visit Demonstration drift | **absent** | No autonomous cursor motion on arrival. |
| Contemplative idle drift toward gravitational center | **absent** | No long-idle detection. |
| Cursor position survives within session | **absent** | No `sessionStorage` persistence of cursor sphere position. |
| Filter state (active facets reduce emphasis) | **absent** | No filter mechanism. |
| Search predicate over corpus | **absent** | No search. |
| Time-scrub changes constellation emphasis | **absent** | No timeline. |
| Pin state (per-session held places) | **absent** | No pinning. |
| New-since-last-visit detection | **absent** | No localStorage manifest. |
| Thread traversal (cursor travels along thread) | **absent** | Threads are not currently traversable; only their endpoints (stars) are. |
| Theme crossfade preserves spatial state | **present** | Theme toggle works site-wide without disrupting /sky's rotation or cursor. The "room dimmed not changed" commitment is honored by virtue of CSS-variable-driven theming. |
| Star opens overlay via View-Transitions API morph | **absent** | Overlay fades in; no shared-element transition from star. |
| WorkOverlay's reverse-Open closes back to star | **absent** | Close returns to /sky; no animated collapse to star. |
| Browser back returns to /sky with cursor at star | **partial** | Browser back to /sky works; cursor returning to that star is **absent** (depends on cursor persistence). |

---

## Foundation principles audit

Each of the six principles from `CONSTELLATION_DESIGN.md` §"Foundation":

| Principle | Status | Note |
|---|---|---|
| **World-like navigation** | **present** | The constellation is the navigation surface; rooms and works are reached through it. The /sky route's hierarchy is spatial, not menu-based. |
| **Quiet chrome** | **partial** | Chrome doesn't currently exist in /sky (no HorizonStrip), so chrome-quietness is moot rather than violated. The /sky surface is properly chrome-free at present, which matches the rest-state of the principle but not its full active commitment. |
| **Continuous reachability** | **partial** | Within /sky's traversal, every star is reachable in one drag/keyboard motion (✓). However, several committed states (Search, Filter, Pin, Time) are absent, so the "two-gesture rule" can't yet be tested across them. |
| **Spatial reading** | **present** | Stars sit deterministically at the same positions across builds (`unitOffset` hash). Visitor's spatial expectations are honored. |
| **Second-voice microcopy** | **partial** | What microcopy exists in WorkOverlay and elsewhere mostly honors the second-voice register. Committed copy ("the constellation gathers", "no stars match. clear filters.", "you're offline. explore cached stars.") is **absent** — the strings literally don't exist in code yet. |
| **Serif-only language** | **present** | Newsreader and Literata are the site's typefaces; no sans-serif appears in /sky. |

**Summary:** principles are honored in spirit by what's built, but several principles can't be fully observed yet because the surfaces they govern (chrome, microcopy) aren't implemented.

### Two-gesture reachability — sampling

The "continuous reachability" principle promises every state is reachable from any other in at most two gestures. A spot-check of state pairs against the current implementation:

| From → To | Gestures needed (current) | Gestures needed (committed) | Status |
|---|---|---|---|
| `Idle` → `BasinSettled` | 1 (drag, key, or tap) | 1 | ✓ |
| `Idle` → `WorkOpen` | 1 (click any star) | 1 | ✓ |
| `BasinSettled` → `WorkOpen` | 1 (click active star or Enter) | 1 | ✓ |
| `WorkOpen` → `Idle` | 1 (Esc, swipe-down, or close button) | 1 | ✓ |
| `Idle` → `SearchActive` | n/a (absent) | 1 (`/` key) | absent path |
| `Idle` → `FilterActive` | n/a (absent) | 1 (chip tap) | absent path |
| `Idle` → `TimeScrubbed` | n/a (absent) | 1 (handle drag) | absent path |
| `Idle` → `PinPanelOpen` | n/a (absent) | 1 (polestar tap or `Home`) | absent path |
| `WorkOpen` → `BasinSettled (different star)` | 2 (close + drag) | 2 | ✓ |
| `WorkOpen` → `FilterActive` | n/a (chrome absent) | 2 (close + chip tap) | absent path |
| `FilterActive` → `Idle (cleared)` | n/a (absent) | 1 (× tap or clear) | absent path |
| `Filtered+Searched` → `WorkOpen (matched star)` | n/a (absent) | 1 (click) | absent path |
| `Contemplative` → `Idle` | n/a (absent) | 1 (any input) | absent path |
| `BasinSettled` → `RadialEcho` | n/a (absent) | 1 (long-press or 800ms idle) | absent path |
| `Foyer` → `Idle (on /sky)` | 1 (link click) | 1 (overscroll-up gesture committed) | ✓ in count, drift in form |

**Reading:** the two-gesture rule **is honored across what's built**, by what's built. It cannot yet be honored across pairs that include unbuilt states. The rule will become observable surface-by-surface as chrome lands.

The single drift-in-form: `Foyer → Idle` works in one gesture (clicking the *"↑ Look up"* link), matching the count, but the *form* committed to is overscroll-from-the-top — a richer first-form that hasn't shipped.

---

## Aesthetic audit

How the current implementation matches the named aesthetic register.

- **Genre — library-of-the-cosmos.** Partial. The constellation surface paints with paper grain, watercolor halos, and slow rotation, all of which sit in the right neighborhood. The astronomical-romantic register is felt. What's missing: the *folio plate* density (chrome and ornamental marks haven't yet had their pass), and the working-page rhythm (numbered sections with eight-point star numerals, asterism dividers) which only exists in design references, not the implementation.
- **Materials.**
  - Paper grain: **present** (continuous WebGL simplex noise that drifts slowly + SVG `feTurbulence` firmament beneath).
  - Watercolor halo: **present** (`cn-watercolor-halo` filter).
  - Brushstroke thread: **partial** (threads are tapered SVG lines, not brushstroke-textured; the *hand-drawn* register is approximate).
  - Atmosphere pool: **present**.
  - Geometric polestar: **present**.
  - Quiet chrome: **n/a until chrome lands**.
- **Color tokens.** All facet hues, paper umber, deep night-blue, horizon warmth, cool silver, amber cursor — present in `tokens.css` for use by /sky. The amber cursor is currently the glyph's resting hue and does not theme-shift, matching the commitment.
- **Type registers.** The five committed registers (heading, deck, body, metadata/second voice, system voice) exist in design tokens but only the work-overlay registers have concrete uses. Chrome-register copy doesn't exist because chrome doesn't exist.
- **Motion register.** Six speeds (Slow / Held / Reach / Spring / Settle / Snap) are honored by what's implemented: 600s rotation = Slow; 1350ms arrival = Held; theme transitions = Reach; cursor follow = Spring; basin settle = Settle; reduced-motion = Snap. **Present in spirit; specific durations may differ from the design's stated targets.**
- **Iconography.** **Absent.** The committed nine-icon set does not exist; chrome is not built, so its icons aren't either.
- **Light as Medium.** The principle that "light is the substance of nearly everything" — partial. Stars are lit; the cursor pool lights the active region; gold accents are present in some surfaces. What's absent: gold-as-active-state-color in /sky specifically (active basin currently changes opacity and stroke, not hue toward gold); inline-link gold underline in work overlay (link styling is the site default, may not match the design's gold commitment).
- **Ornamental Vocabulary.** Eight-point star, asterism dividers, twin-sphere pairings, gold linework, watercolor washes. Present partially in the existing `Polestar` ornament; the *signature use* of these marks across the surface (numbered sections, etc.) is design-doc-only.

---

## Semiotic audit

How well the current implementation respects the *loads* named in `CONSTELLATION_DESIGN.md` §"Semiotic Layer".

- **Eight-point star.** The Polestar atom uses the geometric figure consistent with the site's ornament. **Present.** No drift toward four-point or other variant in /sky.
- **Gold (active states, illumination).** **Drift.** Active states currently use facet hue + opacity changes, not gold-halo. The design's commitment that *gold is the language of attention given* is not yet honored in /sky's active visuals.
- **Italic serif (system voice).** **Partial.** Where second-voice copy exists in WorkOverlay, it's italic-serif. Where new committed system copy is missing, it's missing.
- **Watercolor halo (paper-not-screen).** **Present.** The `cn-watercolor-halo` filter is applied to stars and the cursor glyph.
- **Brushstroke thread (hand-authored).** **Drift.** Threads are vector lines with stroke variation; they don't currently read as *hand-drawn* in the way the semiotic load demands.
- **Paper grain (substrate).** **Present.** Both SVG and WebGL backgrounds carry paper-grain texture.
- **Polestar (still center).** **Present.** Renders at viewbox (500, 500), persists across themes, stays through camera orbit.
- **Companion glyph (trace).** **Partial.** The glyph is present and follows cursor. Its *trail* — the trace it leaves during fast travel — is **absent**, weakening its load as a *trace*.
- **Atmosphere pool (world responding to attention).** **Present.** Phase E.
- **Horizon (where ground meets sky / time meets space).** **N/A.** Horizon strip absent; semiotic load undeclared in current implementation.
- **Twin-sphere title pairing.** **N/A.** Documentation-poster specific; not a /sky surface element.
- **Asterism dividers.** **N/A in /sky** (used only in documentation rendering, which is downstream of MDX).
- **Slow rotation as world's heartbeat.** **Present.** 600s/cycle, independent of interaction.
- **Negative space around stars.** **Present** (deterministic placement enforces minimum spacing implicitly via `SECTOR_HALF_SPREAD`).

---

## Epistemic audit

Against `CONSTELLATION_DESIGN.md` §"Epistemic Posture".

**What the constellation enables the visitor to know:**

- Spatial recognition: **present**.
- Relational understanding: **partial** — threads exist; their meaning surfaces only on hover/focus; no facet legend explains what each color means without external knowledge.
- Compositional awareness: **partial** — the cairn's shape is visible; *gravitational center* awareness depends on the absent demonstration drift and contemplative drift.
- Temporal trace: **absent** — no time-scrubber means the visitor cannot perceive the corpus's growth.
- Authorial trace: **partial** — the constellation is authored, but the *new-since-last-visit* signal that makes ongoing authorship felt is **absent**.

**What it explicitly refuses to enable:**

- Surveillance / others' reading: **honored** (no telemetry shaping the visitor's view; no read counts).
- Trending: **honored** (no popularity surfacing).
- Algorithmic recommendation: **honored** (no "you might also like" anywhere).
- Performance metrics: **honored** (no metrics surfaced).
- Comparison against others: **honored**.
- Recommendation beyond authorial curation: **honored**.

**Visitor as guest, not user:**

- No sign-up, no credentials: **honored**.
- No nudges, directives, tutorials: **honored** (the absence of system-voice copy is currently a side effect of unfinished chrome, not deliberate honoring; the principle holds either way).
- No surveillance-sourced surprise: **honored**.

**Note:** the epistemic posture is honored largely by what *isn't* present. As surfaces (Search, Filter, Pin) are built, the discipline of refusing to leak into surveillance / recommendation / metrics becomes an active concern, not a passive one.

---

## Stylistic audit

Against `CONSTELLATION_DESIGN.md` §"Stylistic Asceticism and Generosity".

**Where /sky should be ascetic:**

- Chrome: **n/a (not built)**; will need active discipline once it lands.
- System voice: **honored by absence** of committed missing copy; the right register exists in WorkOverlay's existing strings.
- Iconography: **n/a (not built)**; will need discipline.
- Negative space around stars: **honored**.
- Ornamental marks: **n/a in /sky**.

**Where /sky should be generous:**

- Work overlay body type: **partial** — body uses serif body register but specific commitments (50–75 char measure, 1.7+ leading, drop-cap on first paragraph) need verification against the actual implementation.
- Work overlay whitespace: **present**.
- Watercolor halos: **present**.
- Atmosphere pool size: **present** (~45% short edge in the current shader).
- Gold (when used): **drift** — gold is reserved for the future active-state pass; current active states do not invoke gold's full saturation.
- Slow durations: **present** — 600s rotation, ~1350ms arrival, etc.

**Risk noted:** the absence of chrome means the "ascetic where ascetic, generous where generous" balance can't be tested. When chrome lands, it must enter as **ascetic**, not generous.

---

## Architectural readiness audit

The platform underneath, evaluated against what the committed design will demand of it.

- **Async data barrel** (`src/shared/content/index.ts`). **Ready.** The barrel signature is async; sync internals can be replaced with fetched JSON / CMS without route changes per `RENDERING_STRATEGY.md`.
- **Pure-SSG commitment.** **Ready.** All constellation rendering is client-side from prerendered HTML; no server runtime needed for the design's committed surfaces.
- **Geometry math foundation** (`src/shared/geometry/sphere.ts`, `camera.ts`). **Ready.** Pure, total, well-tested. Extensions (slerp on the camera surface, ray-sphere intersection, geodesic distance) are already present.
- **Navigation hook** (`useConstellationNavigation`). **Mostly ready, will need extension.** Adding filter state, pin state, search state, time-scrub state will require either (a) extending `NavState` with these fields and routing them through the existing tick, or (b) introducing a separate state container at the `Constellation` organism level. The hook's current shape is single-concern (cursor physics); broadening it could be a smell. *Note: this is an architectural decision to be made when the next phase is planned.*
- **WebGL infrastructure** (`useWebGLFirmament`, `constellationCursor` signal). **Ready.** The signal pattern can carry additional shared state (filter state, time state) the shader might consume; the firmament loop reads cleanly.
- **Theme infrastructure.** **Ready.** Cross-tab sync, localStorage persistence, MutationObserver-driven uniform updates in WebGL.
- **Routing infrastructure.** **Ready, but no slot for chrome.** TanStack file-based routing handles /sky and /sky/{room}/{slug}; chrome lives at the layout level (currently in `__root.tsx` for global nav). HorizonStrip will need a place to mount; whether that's at the layout level or scoped to /sky is a design decision.
- **Performance budget.** **Tight.** Current bundle: 202.14 KB / 215 KB limit. New chrome + state + persistence + animations will push toward the ceiling. The design's commitment to a small icon set, lightweight chrome, and CSS-driven animations is partly a performance hedge. *Note: a dedicated route-split for /sky may become necessary if all committed surfaces ship together.*
- **Accessibility patterns.** **Established.** Focus rings, aria-labels, keyboard parity, reduced-motion detection, semantic landmarks. New surfaces must adhere; the patterns are there to follow.
- **Test infrastructure.** **Ready.** Vitest + jest-axe + Playwright. New surfaces should land with co-located component tests, axe checks, and (where relevant) Playwright integration tests.
- **State persistence.** **Partial.** localStorage exists for theme; `sessionStorage` is unused. The committed cursor-position-survives-session and pin-state-survives-session needs a small persistence module.
- **View Transitions API.** **Used elsewhere on the site** (`tokens.css` has `::view-transition-*` rules). For /sky's star→overlay morph, the API can be invoked, but the star and overlay need shared `viewTransitionName` markings — currently not set.
- **Performance observability.** **Ready.** `e2e/sky-performance.spec.ts` measures long-task delta during interaction. New animations should be tested against this gate.
- **No server runtime.** **Honored, will remain so.** All proposed surfaces (Filter, Search, Time-scrub, Pin) are client-side; no `createServerFn` calls would be appropriate per `RENDERING_STRATEGY.md`.
- **Knip / unused exports.** Unmeasured for the current pass — adding many components could leave orphaned exports if not carefully wired.

### The shared chrome substrate that doesn't exist yet

Six absent components share a substrate of common needs that is itself absent:

- **HorizonStrip** — opens, focuses, dismisses
- **SearchField** — opens, focuses, dismisses
- **FacetChip-as-filter** — toggles, manages active set, broadcasts to scene
- **TimeScrubber** — engages, dismisses, broadcasts position to scene
- **RadialEcho** — opens, focuses, dismisses on motion / timeout
- **PolestarPanel** — opens, focuses, dismisses on outside click

Each needs:

1. **Open/close state.** Likely a small state machine or set of `useState` hooks at the `Constellation` organism level.
2. **Focus management.** When opened, focus enters the surface; when closed, focus returns to wherever it came from. Each surface needs a focus-trap-like shape.
3. **Dismissal logic.** Esc, click-outside, a clear gesture, motion away. Not all surfaces dismiss the same way; the matrix needs naming.
4. **Coordination with the navigation hook.** When chrome is open, does the constellation's drag-to-traverse still work? Does the basin-claim still flip activeKey? Different chrome surfaces probably have different answers.
5. **Z-stack management.** All chrome layers above the constellation; specific orderings between them when multiple are open (e.g., RadialEcho over PolestarPanel?).
6. **Broadcasting state to the scene.** Filter active → stars dim. Time scrubbed → atmosphere shifts. Search active → matches glow. The chrome surfaces need a way to talk back to the world they sit beside.

**The audit's observation:** the right architecture for this substrate is **a design decision the codebase hasn't yet been forced to make.** Possible shapes include: extending `useConstellationNavigation`'s state machine, introducing a separate `useConstellationChrome` hook, lifting state to a context/provider at the `Constellation` organism level, or building an event bus between chrome surfaces and the world.

Each shape has implications for testability, performance, and the React Compiler's ability to memoize. **None has been chosen.** Choosing would itself be an architectural decision worth documenting in `REACT_NORTH_STAR.md` and `CONSTELLATION_HORIZON.md`.

This is the **substrate gap**: not a single component, but the missing common ground six absent components would all need.

### Site navigation, theme toggle, daystar — and the proposed HorizonStrip

A geographic question the audit must surface: **where does the existing site chrome live when /sky's HorizonStrip lands?**

The current state on /sky:

- Site `Nav` component renders at the top of every route, including /sky.
- `ThemeToggle` (sun/moon icon) lives in the nav's top-right corner.
- `Daystar` atom renders inside the constellation SVG at fixed position `cy=240` — visually, the same sun/moon icon ascended into the firmament.
- No bottom-edge chrome exists.

The committed state in `CONSTELLATION_DESIGN.md`:

- HorizonStrip sits at the bottom of the viewport, carrying foyer-glyph, search, facet chips, timeline scrubber, and pin/polestar access.
- The Foyer-glyph in the strip duplicates the *return home* function the site Nav already serves.
- The design doc's epistemic posture says chrome should retire when not invoked — implying any persistent top-nav on /sky is a violation of "quiet chrome."
- The "daystar's ascent into the orbiting frame" is held in `CONSTELLATION.md`; design doc gestures at it without committing.

**Three reconcilable conflicts the audit names:**

1. **Foyer access duplication.** Site Nav has a wordmark linking home; HorizonStrip has a foyer-glyph for the same purpose. *Both is too much; neither is too little.* The right answer is a design decision — likely *site Nav retires on /sky and the strip carries home-return* — but it needs to be named.

2. **Theme toggle location.** Currently in site Nav. If site Nav retires on /sky, the theme toggle migrates to either (a) the daystar (the design's poetic answer — toggle the sun/moon icon that already lives in the sky), (b) the HorizonStrip's right side, or (c) the PolestarPanel. The design doc is silent on this; the audit names it as an open decision.

3. **Daystar's role and movement.** Currently fixed at `cy=240`. Design implies it could ride the orbiting camera (so day/night is felt as part of the world's atmosphere, not a corner UI element). This is held in `CONSTELLATION.md`; the audit notes it as `partial / drift`.

**Status:** the relationship between site nav and /sky chrome is **a design decision yet to be made**, blocking on the question *what does /sky's chrome look like, and what does the rest of the site's chrome do when the visitor is in /sky?*

---

## Specs in drift

Where existing specifications disagree with the new commitments in `CONSTELLATION_DESIGN.md`.

- **`CONSTELLATION.md`** describes the static dome / first-form ceiling as the primary register. The latent-sphere model and orbital camera are described in `CONSTELLATION_HORIZON.md` as held; with Pass 2 shipped, /sky has moved past `CONSTELLATION.md`'s described state. **Drift.**
- **`CONSTELLATION_HORIZON.md`** describes the technical endpoint with held phases. Phases A–E are now shipped; the doc still describes them as held. **Drift in tense.**
- **`INFORMATION_ARCHITECTURE.md`** describes /sky's URL grammar and arrival; the addition of chrome (HorizonStrip) and overlay routes is partially accounted for but not in the new design's terms (horizon, pins, time-scrub).
- **`INTERACTION_DESIGN.md`** has a motion vocabulary that overlaps with but doesn't exactly mirror the design doc's six-register motion table. Reconciliation needed if the design doc's register names are to be canonical.
- **`DESIGN_SYSTEM.md`** holds named tokens; the design doc's color and material tokens (paper umber, horizon warmth, etc.) need explicit residence here.
- **`BACKLOG.md`** holds many of the design-doc-committed items (filters, time slider, search, etc.) as held. Those backlog entries need to be reconciled with the design doc's commitments — they should remain held until pulled, but their *form* now exists in `CONSTELLATION_DESIGN.md`, which the backlog should reference.
- **`SPECIFICATION_MAP.md`** has `CONSTELLATION_DESIGN.md` mapped; this audit document, when committed, will need its own entry.
- **`VOICE_AND_COPY.md`** has microcopy patterns; the design doc's copy-pattern table should be cross-referenced or unified with what lives here.

---

## Code–design vocabulary drift

A category of drift the *Specs in drift* section above does not capture: the source code itself uses vocabulary that disagrees with the design doc's lexicon.

This drift is small but real, and it matters because future agents reading the code without the design doc will absorb the code's vocabulary as canonical.

| Code surface | What it calls a thing | What the design lexicon calls it | Note |
|---|---|---|---|
| `useConstellationNavigation.ts` | `BASIN_RADIUS_RAD`, "the basin's gravitational well", "basin pull" | The per-star *gravity well* in code; the design's **basin** is the editorial cluster | The design doc flags this conflict explicitly. The naming is load-bearing in the physics; renaming to *well* or *attractor* in code would clarify. *Note: this is a refactor, not a feature.* |
| `useConstellationNavigation.ts` | "the cursor's drag target" | *the visitor's reach* (would suit the design doc's voice) | Cosmetic; current naming is technically correct. |
| `Constellation.tsx`, `Stage.tsx` | "the active key" | *the basin's claim* / *the focused star* | The "active key" name is generic React-state vocabulary; the design's metaphor is richer. |
| `useWebGLFirmament.ts` | "uCursor", "uActive" — pool driven by uniforms | Honored at the boundary (the cursor signal); shader-internal vocabulary fine to remain technical |  |
| Various atoms/molecules | "constellation-rotates", "constellation-camera", "sky-arrival" | *the world's heartbeat*, *orbital camera*, *carpet roll* in the design doc | CSS class names are functionally clear; the metaphor lives in the doc, not the class. *No drift here in practice.* |
| `Star.tsx` | `cx`, `cy`, `r` (SVG-native attributes) | *body*, *halo*, *hit target* in the design doc's anatomy | The design doc names anatomy parts; the atom uses SVG primitives. *Tolerable; SVG conventions win in atoms.* |

**The pattern:** code-internal vocabulary tends toward physics + framework conventions; the design lexicon tends toward metaphor + visitor experience. *They are not enemies.* The discipline is naming where the layers meet (component props, public exports, cross-cutting state) and letting each layer keep its own vocabulary internally.

The largest legitimate concern is `BASIN_RADIUS_RAD`'s collision with the design's "basin." When chrome is built and the design vocabulary spreads into more code, this collision will produce confusion. Renaming the constant (and adjacent identifiers) to *well* or *attractor* in a small refactor would close the gap.

---

## Tests in drift

Where the test surface doesn't yet match the committed design.

- **Surface-state coverage.** Vitest tests cover individual components (Star, Thread, Polestar, etc.) and the Constellation organism's basic rendering. State-by-state mocks of the committed 12 canonical surfaces are **absent** as test fixtures.
- **Reduced-motion equivalence.** Tested for `useConstellationNavigation` in isolation; not yet tested for the full /sky surface (no Playwright run with `prefers-reduced-motion: reduce` user preference set).
- **A11y for unbuilt surfaces.** No axe coverage exists for HorizonStrip, SearchField, FacetChip-as-filter, TimeScrubber, RadialEcho, PolestarPanel, PinRibbon — because they don't exist.
- **View-transition morph.** No test coverage for star→overlay shared-element transition — because the morph isn't implemented.
- **Performance for committed loaded states.** The existing perf test measures long-task delta during basic drag and flick; loaded states (filter active, search active, time-scrubbed, all stars dimmed) aren't measured because they don't exist.
- **Cross-session cursor persistence.** No test; not implemented.
- **Living-document behaviors.** No tests for Demonstration drift, Contemplative drift, or NewStarBloom.

---

## What's locked, what's open

A read on the codebase's flexibility for what's committed but unbuilt.

**Locked (architectural commitments that constrain future work):**

- Pure SSG / no production runtime. `RENDERING_STRATEGY.md`. Any committed surface that needs server runtime is the wrong tool for /sky.
- TanStack Start / TanStack Router. Routing patterns are file-based; chrome scope follows.
- React Compiler with no manual memoization. Components must remain compiler-friendly.
- 80-line per-function ceiling, 7-prop max, etc. (`REACT_NORTH_STAR.md`).
- Async data contract on the content barrel.
- Existing geometry/camera math; the basis for any new spatial concept.
- The amber cursor's theme-invariance; the polestar's spatial fixedness; the slow rotation's persistence.

**Open (design decisions still to be made):**

- HorizonStrip placement (variants V6.A–E).
- WorkOverlay layout (variants V12.A–D).
- Cursor identity (variants V1.A–E).
- FacetChip style (variants V8.A–D).
- Search field placement (variants V7.A–D).
- Time scrubber form (variants V9.A–D).
- Whether threads are tappable as travel paths (Q6).
- Whether cursor persists across page reloads (Q7).
- The horizon strip's behavior on phone landscape.
- Pin model: session-only vs. localStorage; named vs. unnamed.
- The "leaving /sky" gesture (Q12).
- The first-visit demonstration drift's path (Q11).

**Held (no design needed yet):**

- Multi-select / comparison surface (Q8).
- Audio (Q9).
- Constellation patterns / named asterisms (Q10).
- The lower hemisphere's eventual use.

---

## Common drift modes when closing the gap

Patterns the audit predicts will surface when implementation begins, named so they can be recognized and refused. These are not bugs — they are the *gravitational pulls* that exist when building UI in the contemporary web environment, and they need active resistance for /sky to stay /sky.

**Drift toward dashboard.** Filter chips, time scrubbers, and search fields are common dashboard elements. The pull is to render them with dashboard conventions: counters, indicators, "showing 3 of 12 results", success-state confirmations. The constellation refuses these. *Counter-anchor: every chrome element should look like it could be in a Bayer star atlas, not a Looker dashboard.*

**Drift toward gallery.** When filtered, the constellation might be tempted to "tile" the matched stars into a grid layout for clarity. The constellation refuses this. *Counter-anchor: filtered = dimmed-not-removed; the world stays the world; the lens just shifts emphasis.*

**Drift toward feed.** The pin panel and recent-items list are easy to render as scrolling lists with avatars, timestamps, and hierarchy. The constellation refuses this. *Counter-anchor: the pin panel is a small console, not a feed; entries are spare and italic; the visitor's recent places are quietly noted, never narrated.*

**Drift toward modal.** RadialEcho, PolestarPanel, WorkOverlay are easy to slip toward modal-with-backdrop conventions: dark overlay covering the world, focus-trap, "x" in the corner. The constellation half-refuses this. The work overlay does have backdrop and focus management — but the *constellation continues rendering behind a soft veil*, not behind a black scrim. *Counter-anchor: the world never disappears; it is veiled.*

**Drift toward tooltip-following chrome.** Hover labels, tooltips that follow the cursor, popovers attached to the pointer. The constellation refuses these. *Counter-anchor: labels appear at fixed positions (below the star, at viewbox center, etc.); the cursor never carries text.*

**Drift toward saturated branding.** The amber cursor is gold-warm. Facet hues are dusty rose, greyed violet, honey gold, paper warm. A pull exists to "punch up" these for visibility — saturated rose, electric violet. The constellation refuses this. *Counter-anchor: the palette is paper-and-watercolor; saturation is an active state, not a default.*

**Drift toward instructive copy.** "Drag to navigate." "Click any star to read." "Use arrow keys to move." The constellation refuses these. *Counter-anchor: the Demonstration drift teaches by motion; every directive copy is the system performing.*

**Drift toward analytics.** "Most-read works." "Trending facets." "Updated frequently." Metric-driven highlights. The constellation refuses these. *Counter-anchor: the visitor reads what they reach; the system does not narrate consumption.*

**Drift toward third-party chrome.** Importing a UI library (Radix, Headless UI, MUI) for the chrome layer would solve focus management and accessibility "for free" — but at the cost of the visual register. Components from these libraries carry their own aesthetic load (default weights, default radii, default focus rings) that fight the watercolor + paper register. The constellation half-refuses this — it's reasonable to take *primitives* from such libraries (headless behaviors), but not *visuals*. *Counter-anchor: every visible element of chrome must be authored against the design doc, not styled atop a pre-existing pattern.*

**Drift toward speed-as-virtue.** Modern UI conventions reward responsiveness in milliseconds. The constellation's slow durations (600s rotation, 1350ms arrival, 600ms reveal) are not failures of optimization — they are *commitments*. A pull exists to "make it snappier" by collapsing durations. *Counter-anchor: durations come from the motion register; speed below the register is a violation, not an improvement.*

**Drift toward accessibility-as-checkbox.** Adding aria-labels and focus rings is necessary but not sufficient. The constellation's accessibility commitment is *parity* (everything reachable by every input channel produces the same outcome). A pull exists to ship a feature visually-first and "add accessibility later." This violates the foundation. *Counter-anchor: every committed gesture must have a keyboard equivalent and a screen-reader announcement before the gesture ships.*

**Drift toward feature-completeness as virtue.** The audit's gap is large; the pull is to close it quickly. The architecting practice (spanda) refuses this. *Counter-anchor: build what pulls. A surface built before its tremor is more violation than progress.*

These eleven drifts are **the audit's prediction of how the gap could be closed badly.** When a design proposal or implementation pull request seems to be drifting toward any of them, the question is the same as for "What /sky Is NOT": *what does the constellation's own answer to this need look like?*

---

## Closing observations

The shape of the gap, briefly.

- **Pass 2 is largely complete at the world level.** The latent sphere, the orbital camera, the cursor on the sphere, the WebGL atmosphere following the cursor — all present. What's not present is the *visitor's relationship to the world over time*: chrome that lets them filter, search, scrub time, hold places; living-document behaviors that make the world feel alive across visits; the demonstration drift that teaches; the contemplative state that lets the world live without them.
- **The largest gap is chrome.** Six to seven entirely-absent components (HorizonStrip, SearchField, FacetChip-as-filter, TimeScrubber, RadialEcho, PolestarPanel, PinRibbon) — each with its own state machine, each with its own design variants still to choose, each with its own performance and a11y implications.
- **The semiotic and stylistic gaps are primarily a function of chrome's absence.** Many of the unhonored signs (gold-as-attention, second-voice microcopy, ornamental rhythm) only manifest in chrome surfaces. When chrome lands, these layers either get honored or get violated; the audit will sharpen at that point.
- **The architectural foundation is sound.** The platform doesn't constrain what the design commits to; the gap is mostly the work of building chrome and the surfaces it supports, against a stable substrate.
- **The Spec/Code drift is small but real.** Three constellation specs (`CONSTELLATION.md`, `CONSTELLATION_HORIZON.md`, `CONSTELLATION_DESIGN.md`) now describe the surface from three angles. Reconciling them — without losing each one's voice — is its own piece of work, downstream of the next code phase or running alongside it.

The next document needed (when the tremor pulls toward it): **a plan**. The plan should choose a slice of this gap to close, sequence the moves through it, and commit to a delivery shape. The plan does not exist yet; this audit is its prerequisite.

---

## What this audit does not cover

The audit's scope is structural: surface-by-surface, component-by-component, principle-by-principle. Several things a downstream plan or design proposal will need to consider are **deliberately out of scope** here. Naming them prevents the audit from being misread as comprehensive.

- **Effort estimation.** The status markers (present, partial, absent, drift, held) are not sized. A row marked **absent** could be hours of work or weeks; the audit refuses to estimate. Estimation is a planning concern.
- **Bundle-size impact per surface.** The current 202.14 KB / 215 KB ceiling is named in the architectural section as *tight*. The audit does not estimate what each unbuilt surface (HorizonStrip, SearchField, RadialEcho, etc.) might add to that number. Production-ready estimates require building the surfaces or careful prototyping; this audit does neither.
- **Per-surface color-contrast verification.** The committed palette is named; whether each pairing clears WCAG AA against each theme has not been audited surface-by-surface. The site's existing contrast guard (`scripts/check-color-contrast.mjs`) covers global tokens, not per-surface compositions.
- **Per-device verification.** The five-breakpoint responsive table names target behaviors; the audit has not verified actual rendering on phone landscape, tablet portrait, or large-display widths. *Real-device testing is a separate practice.*
- **Internationalization / localization.** The committed copy is English-only; the design doc does not name an i18n strategy. The audit does not surface this as drift because *no commitment exists to drift from*. If multilingual support enters scope, that's a new design surface entirely.
- **SEO / search-engine discoverability of /sky's surfaces.** Filtered states, pinned states, time-scrubbed states are not currently URL-addressable; whether they should be (for shareability, deep-linking, search indexing) is a held design question. The audit names this as *open*, not *gap*.
- **Analytics / observability surfaces for the author.** The epistemic posture refuses metrics shaping the visitor's view; whether *Danny-as-author* gets quiet observability about traffic, errors, and Core Web Vitals is held in `PRIVACY.md` and `PERFORMANCE_BUDGET.md`. Out of scope here.
- **Print stylesheet for /sky.** The design doc names print as a real viewport with a static rendering. The audit notes its absence in passing but does not enumerate print-specific behaviors (page breaks, pagination of stars, what the polestar prints as). *Held until print becomes an active concern.*
- **Audio implementation specifics.** The design doc names audio as held; the audit honors that. No audio architecture is sketched.
- **Multi-visitor presence.** Held in the design doc; the audit does not engage.
- **The relationship between `/sky` and the existing `/facet/{facet}` pages.** The site has facet pages elsewhere; the constellation's filter affordance overlaps in role. Whether they coexist, share data, or one supersedes the other is **a design decision yet to be made**, surfaced briefly in *Specs in drift* but not enumerated here.
- **Performance under high node-count.** The design doc names ~50+ stars as the threshold where strategies must be chosen. The codebase's current performance under 50, 100, 500 nodes has not been measured; *the audit does not load-test*.
- **The work overlay's full content-density study.** The design doc names three classes (short fragment, essay, media-rich); the audit notes WorkOverlay is partial without testing each class against real content.
- **Visual regression testing.** No golden screenshots exist for /sky surfaces; the audit does not measure pixel drift across changes.
- **The plan that closes the gap.** Out of scope by definition. *The audit names; the plan chooses.*

If a downstream consumer of this audit needs any of the above, the right answer is: produce that artifact separately, alongside the audit. The audit is one document among several; it does not pretend to carry the others' work.

---

*This document is a snapshot. As implementation closes the gap, the audit changes. When a row marked **absent** becomes **present**, this document updates with the same care `CONSTELLATION_DESIGN.md` updates when a variant closes.*
