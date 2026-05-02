# Constellation Implementation Plan

*The chosen sequence through the gap named by `CONSTELLATION_IMPLEMENTATION_AUDIT.md`. A working plan, not a calendar; a commitment to **shape** more than to **schedule**. This document picks up where the audit left off.*

---

## What this document is

This is a **plan** — distinct from the four documents that precede it.

- `CONSTELLATION.md` holds the experience the surface must produce.
- `CONSTELLATION_HORIZON.md` holds the technical envisioning of the endpoint.
- `CONSTELLATION_DESIGN.md` holds the design read — surfaces, components, flows, and the meaning-layers (aesthetic, semiotic, epistemic, stylistic, metaphorical) that anchor the work.
- `CONSTELLATION_IMPLEMENTATION_AUDIT.md` holds the diagnostic — what's built, what isn't, where the drift lives.
- *This document* holds the **sequence** — the order in which the gap could be closed, the dependencies between phases, the parallel tracks that can run alongside, and the trigger conditions for each pull to begin.

A plan, in this codebase's voice, is **not a roadmap with dates**. There are no hours, no story points, no quarters, no committed launch windows. The architecting practice (the *spanda* commitment) refuses calendar-driven building. What a plan *is*:

- A **chosen sequence** that says: *if and when work pulls in this direction, this is the order that respects the dependencies and honors the foundation.*
- A **shape commitment** that says: *each phase is a discrete architectural commitment, sized to be reviewable, releasable, and reversible.*
- A **trigger map** that says: *here is what would have to be true (in the corpus, in the lived experience of the site, in the team's attention) for this phase to be ready to begin.*
- A **held register** that says: *here is what stays held — explicitly, on purpose — even as everything around it lands.*

The plan is also the document most likely to become stale. As phases ship, the plan updates. As pulls arrive that this plan didn't anticipate, the plan inserts new phases or reorders existing ones. The plan is a snapshot of *intent under current understanding*, not a contract.

If a downstream agent reads this plan and feels the impulse to start coding the first phase immediately, that impulse is misdirected. The plan describes what *would* be done if/when each pull arrived; it does not announce that the pulls are present. *The first move is to ask whether the tremor is here.* If it is, begin. If it isn't, the plan waits.

---

## How to read this

The plan is structured as **phases** (numbered `P0` through `P15`), with **cross-cutting concerns** spanning all phases.

### Phase anatomy

Each phase carries the following sections:

- **Pull condition** — what would have to be true for this phase to be ready to begin. The condition is qualitative (a felt-sense observation, a corpus state, an architectural moment of clarity) rather than quantitative.
- **Scope** — what lands in this phase. A bounded list of architectural commitments, components, or behaviors.
- **Exit condition** — what makes this phase done. Usually expressed as: tests pass, design commitments observable, no regressions in adjacent surfaces, reduced-motion equivalents present, accessibility coverage in place, specs reconciled where the phase obligated.
- **Architectural decisions within this phase** — design choices that the phase forces but the design doc has not yet closed. Each is a decision the phase's author must make consciously, with rationale.
- **Parallel tracks** — what other work can proceed alongside this phase without conflict.
- **What stays held within this phase** — explicit register of what this phase does *not* try to land, even when adjacent.
- **Specs to reconcile** — which specification documents this phase obligates updates to (if any).
- **Tests to land** — the test coverage this phase produces.

### Status markers

Each phase carries a status:

- **pending** — the phase has not started; the pull condition has not been met (or has not been recognized).
- **in-progress** — work has begun on this phase; not all scope has landed.
- **shipped** — the phase's exit condition has been satisfied.
- **held-by-design** — the phase is named here for completeness but is not expected to begin under the current commitments. (Used for items the design doc explicitly holds.)
- **abandoned** — the phase was begun and then deliberately released without completion. The reason is named.

The plan begins with all phases except those held-by-design at **pending**. As phases ship, this document updates.

### Dependencies

Each phase names what it strictly **blocks on** (cannot begin without) and what it **prepares ground for** (the phases downstream that depend on it). The plan's overall topology — what blocks what — is summarized in the **Phase tree** section below.

### Reading order

A reader who has not yet read the audit should read it first; the plan assumes the audit's diagnoses as ground truth. Within the plan itself:

- The **thesis** and **sequencing principles** sections are the conceptual frame; read these before any phase.
- The **phase tree** gives a one-glance view of the dependency graph; reference it while reading any individual phase.
- The phases themselves can be read in numerical order or by jumping to the phase relevant to the work being considered.
- The **cross-cutting concerns** section applies to every phase; consult it during planning.
- The **what this plan does not contain** section bounds the plan's scope; consult it when looking for something the plan does not address.
- The **living the plan** section names how the plan itself updates over time.

---

## The thesis

The audit produced a clear shape:

- Pass 2 (Phases A–E) closed the *world* layer of the gap. The latent sphere, the orbital camera, the cursor on the sphere, the WebGL atmosphere following the cursor — all present.
- The remaining gap is mostly **chrome** and **the visitor's relationship to the world over time**. Six unbuilt chrome components (HorizonStrip, SearchField, FacetChip-as-filter, TimeScrubber, RadialEcho, PolestarPanel, plus PinRibbon as a star-attached chrome marker). Several living-document behaviors (Demonstration drift, Contemplative drift, NewStarBloom, cursor persistence). Several Pass-2 visual polish items that were honored in spirit but not in letter (halo claim, gold-as-active, glyph trail).
- The chrome components share a substrate that itself does not exist — a state machine for open/close/focus/dismissal/z-stack/scene-broadcasting that any single chrome surface needs but no single chrome surface deserves alone.
- The architectural foundation is sound. The gap is mostly the work of building chrome and the surfaces it supports, not of restructuring what underlies them.

From this shape, the plan's thesis follows:

> **First, refine and reconcile what's built. Then build the chrome substrate. Then land the chrome surfaces in pulled order. Polish living-document behaviors continuously. Reconcile specs alongside the implementation that obligates them.**

Translated into a sequencing principle: **substrate before consumers**, **polish alongside infrastructure**, **specs catch up, not lead**.

The plan's structure mirrors this thesis. P0 is foundation refinement (vocabulary, spec sync, test fixtures). P1–P3 are Pass-2 polish (the visible commitments that landed in spirit but need explicit form). P4 is the chrome substrate. P5–P10 are the chrome surfaces in pulled order. P11–P12 are the living-document behaviors. P13 is the spec full reconciliation. P14–P15 are the held register and beyond-the-plan.

The plan does **not** claim that all sixteen phases will be executed. The plan claims that *if* the pulls arrive, *this* is the sequence that respects the dependencies. Several phases may stay pending indefinitely — and that staying-pending may itself be the right answer for years. The plan's job is to make the sequence legible so any subsequent decision (to begin, to defer, to skip) is made knowingly.

---

## Sequencing principles

Seven principles that constrain the order. Each is a litmus test for any proposed reordering.

1. **Substrate before consumers.** A foundation that multiple consumers depend on must land before any of its consumers. The chrome substrate (P4) blocks all chrome surfaces (P5–P10). The persistence module (within P8) blocks the new-bloom system (P11) and the contemplative state's memory of the gravitational center.

2. **Polish alongside infrastructure, not after it.** Pass-2 polish phases (P1, P2, P3) interleave with substrate and chrome work. The risk of holding all polish to the end is that the lived experience of /sky drifts further from the design's letter than is comfortable. Polish should ride alongside major work, not queue behind it.

3. **Specs catch up, not lead.** Spec reconciliation (P13) lands late, *after* the surfaces it describes have shipped. Updating specs to describe a target the code has not yet hit is how specs become aspirational fiction. The plan keeps specs honest by reconciling them last.

4. **Reduced-motion equivalents land with their visible phase.** Each visible phase (P1–P12) ships with its reduced-motion equivalent in the same commit. A phase that ships visual motion without its reduced-motion counterpart is incomplete by the foundation's accessibility commitment.

5. **Tests land with their phase.** Vitest unit/component tests, axe coverage, Playwright integration tests where relevant. A phase without its tests is not a shipped phase. Performance tests against the long-task delta gate apply to any phase that adds runtime work.

6. **Architectural decisions are made in the phase that forces them.** Many phases carry open design choices (variants V1.A–V14.D from the design doc; Q1–Q12 open questions). The plan does not pre-decide; it names the decisions as they will arise. The phase's author chooses, with rationale, when the phase begins.

7. **Spanda governs all of the above.** The plan is the chosen sequence *under the assumption that the pulls arrive*. If a phase's pull condition is not met, the phase waits. The plan does not override the practice; it operates within it.

A reader proposing a reordering should answer: *which of these seven principles does my reordering preserve, and which does it violate?* If a reordering preserves all seven, it is a legitimate alternative. If it violates one or more, the violation is the conversation.

---

## Phase tree

A one-glance view of the dependency graph. Arrows mean *blocks on*; phases without arrows have no upstream blockers within the plan.

```
P0   Foundation refinement and reconciliation
     │ (no upstream blockers; can begin any time)
     │
     ├──→ P1   Active basin acknowledgment ──────────┐
     │                                               │
     ├──→ P2   Demonstration choreography ───────────┤
     │         (depends on P1's persistence)         │
     │                                               │
     ├──→ P3   Work overlay morph ────────────────---│
     │                                               │
     ├──→ P3.5 Aesthetic refinement ─────────────────│
     │                                               │
     ├──→ P3.6 Empty / loading / offline states ─────│
     │                                               │
     ├──→ P3.7 Foyer "look up" gesture ──────────────│
     │                                               │
     ├──→ P3.8 Leaving /sky gesture ─────────────────│
     │         (depends on P3.7 + P5's foyer-glyph)  │
     │                                               │
     ├──→ P4   Chrome substrate                      │
     │         │                                     │
     │         ├──→ P5   HorizonStrip skeleton ───┐  │
     │         │         │                        │  │
     │         │         ├──→ P6  Facet filtering │  │
     │         │         ├──→ P7  Search          │  │
     │         │         └──→ P9  Time scrubber   │  │
     │         │                                  │  │
     │         ├──→ P8   Pinning and persistence ─┤  │
     │         │         (also blocks P11)        │  │
     │         │                                  │  │
     │         └──→ P10  Radial echo              │  │
     │                   (also depends on P1)─────┘  │
     │                                               │
     ├──→ P10.5 Thread traversal as navigation       │
     │         (depends on P0's geometry; loosely    │
     │          P10 for radial-echo cue)             │
     │                                               │
     ├──→ P11  NewStarBloom and living-document      │
     │         (depends on P8's persistence)         │
     │                                               │
     ├──→ P12  Contemplative state                   │
     │         (depends on P10 for the drift cue)    │
     │                                               │
     ├──→ P12.5 Daystar's ascent                     │
     │         (depends on P5 for theme-toggle       │
     │          location decision)                   │
     │                                               │
     ├──→ P12.6 /sky and /facet reconciliation       │
     │         (depends on P6 shipping)              │
     │                                               │
     ├──→ P12.7 High node-count strategy             │
     │         (no strict blockers; corpus-pulled)   │
     │                                               │
     ├──→ P13  Spec full reconciliation ←────────────┘
     │         (downstream of all visible phases)
     │
     ├── P14  Held but visible (no implementation; doc-only)
     │
     └── P15  Beyond the plan (held register; no work expected)
```

**Reading the tree:**

- **Foundation phases (P0).** Unblocked and could begin first. No visible behavior; benefits everything downstream.
- **World-layer polish phases (P1–P3, P3.5, P3.6).** Don't block downstream phases; enrich the lived experience that downstream phases sit beside. Polish, edge-state copy, and aesthetic refinement run alongside infrastructure.
- **Arrival/departure phases (P3.7, P3.8).** Mostly independent; P3.8 depends on P3.7 (the symmetry expectation) and softly on P5 (the foyer-glyph button).
- **Chrome substrate gateway (P4).** P5–P10 all block on it.
- **In-strip chrome (P5 → P6, P7, P9).** P5 is itself a gateway for the in-strip controls.
- **Standalone chrome surfaces (P8 PinPanel, P10 RadialEcho).** Don't strictly need P5 but benefit from a coherent chrome substrate (P4).
- **Thread traversal (P10.5).** Depends on Pass 2's geometry already in place; loosely on P10 for an alternate radial-echo activation surface.
- **Living-document (P11, P12).** P11 needs P8's persistence; P12 needs P10's drift cue (or its own equivalent).
- **Late-stage refinements (P12.5, P12.6, P12.7).** Daystar ascent depends on P5's theme-toggle decision; /sky-/facet reconciliation depends on P6 shipping; high-node-count strategy is corpus-pulled rather than dependency-blocked.
- **Reconciliation (P13).** Downstream of all visible phases; reconciling specs to a moving target is how drift compounds.
- **Held register (P14, P15).** Documentation-only; no implementation expected.

A pull may legitimately arrive for a phase whose blockers are unmet. When that happens, the right answer is *honor the pull by completing the blockers first* — not by skipping them. The dependency tree exists because the dependencies are real.

---

## P0 — Foundation refinement and reconciliation

*Status:* **pending**.
*Pull condition:* the next moment of architectural attention to /sky's foundations, before the next visible phase begins. P0 is also legitimately a side-track that runs in the background without ever being "actively" the next phase.

### Scope

P0 is the *quiet* phase. No new visible behavior; no new components. What lands:

- **Code-design vocabulary refactor.** Rename `BASIN_RADIUS_RAD` and adjacent identifiers (`sphericalBasinForce`, comments referencing "the basin's gravitational well") to use *well* or *attractor* terminology. The design lexicon's "basin" remains free for the editorial-cluster meaning chrome surfaces will need.
- **Sky-arrival animation tuning.** The current 1350 ms `sky-look-up` animation may not exactly match the design's first-form choreography. Verify against the design doc's First-Visit Choreography; adjust durations, easings, opacity stages as needed. No new animation; refinement of the existing one.
- **Active hue shift in the cursor glyph.** The companion glyph currently stays at amber regardless of basin. Implement the design doc's commitment: glyph hue modulates from amber (rest) toward the active star's facet hue (settled), reverting on basin leave.
- **Companion glyph trail.** Add the brief trailing fade (last 4 frames at 0.4, 0.3, 0.2, 0.1 opacity) during fast travel. Currently absent.
- **Sky/Constellation spec partial reconciliation.** Update `CONSTELLATION.md` to describe Pass 2's ground state, not the static dome. Update `CONSTELLATION_HORIZON.md` to mark Phases A–E as shipped, not held. Full reconciliation lives in P13; this is the *tense correction* that prevents the specs from being misread by future agents in the meantime.
- **Test fixtures for the canonical surface inventory.** Stub out testing utilities (component fixtures, mock data) that render each of S0–S19 in its committed visual state. This is testing infrastructure, not the tests themselves; subsequent phases ship their own assertions against these fixtures.

### Exit condition

P0 is done when:

- The vocabulary refactor compiles, all tests pass, lint clean, no behavior change.
- The cursor glyph's active hue shift is observable on /sky (verifiable manually + via a Playwright test that asserts the glyph's `fill` shifts on basin claim).
- The glyph trail is observable during fast drag (verifiable by a Playwright trace; no automated assertion needed).
- The arrival animation matches the design's First-Visit Choreography frame durations or the deviations are documented in `INTERACTION_DESIGN.md`.
- `CONSTELLATION.md` and `CONSTELLATION_HORIZON.md` no longer describe shipped Pass-2 phases as held.
- A `tests/fixtures/sky-surfaces.tsx` (or equivalent) module exports rendering helpers for each canonical surface (S0–S19), used by subsequent phases' integration tests.

### Architectural decisions within this phase

- **Renaming target for `BASIN_RADIUS_RAD`.** Candidates: `WELL_RADIUS_RAD`, `ATTRACTOR_RADIUS_RAD`, `BASIN_CLAIM_RADIUS_RAD` (preserves "basin" with disambiguation), `SETTLE_RADIUS_RAD`. The author chooses; the rationale is documented in the commit and in the navigation hook's header comment.
- **Whether the cursor glyph's hue-shift is binary (amber ↔ active) or continuous (amber → blend → active).** Continuous is the design's intent (a smooth modulation); binary is simpler and may suffice for the first form.
- **Whether the glyph trail uses persistent SVG `<polyline>` history (heavyweight) or a per-frame opacity-decaying ghost (lightweight).** The design doc names neither.
- **The fixture module's API shape.** Whether each surface fixture is a React component (`<S0Arrival />`), a factory function (`renderS0()`), or a configuration object passed to a single helper.

### Parallel tracks

P0 can run concurrently with any other phase. It produces no visible behavior change beyond the polish items, and its infrastructure (fixtures, vocabulary) benefits everything downstream.

### What stays held within P0

- Full spec reconciliation (P13).
- Any behavior beyond the four polish items named (e.g., halo claim is *not* in P0; that's P1).
- Any new component (the substrate is P4).

### Specs to reconcile

- `CONSTELLATION.md` (tense correction; not full reconciliation).
- `CONSTELLATION_HORIZON.md` (mark shipped phases as shipped).
- The navigation hook's source comments (vocabulary alignment).

### Tests to land

- A Playwright assertion that the cursor glyph's `fill` color shifts on basin settle.
- A vitest unit test (or extension of an existing one) covering the renamed identifiers.
- The `tests/fixtures/sky-surfaces.tsx` module as a testing utility.
- No regression in existing 276 tests.

---

## P1 — Active basin acknowledgment

*Status:* **pending**.
*Pull condition:* the lived experience of /sky's basin claim feeling thin — when the visitor settles into a basin and the response is only thread bloom + active-key, not the *"the room becoming attentive to you"* the design doc commits to.

### Scope

The visible commitments around an active basin that landed in spirit but not in letter:

- **Halo claim.** The active star's halo crescendos over ~400 ms on settle: scale up by 5–8%, halo opacity rises, soft outer glow breathes. This is the design doc's named *halo claim* visual cue.
- **Star labels on settle and hover.** When a basin claims the cursor, a faint italic label appears below the star: *"{title}"* on settle; *"{title} — {room}, on {facets}"* after a longer hover. The label fades on cursor leave.
- **Gold as the active-state color.** Replace facet-hue-as-only-active-cue with a gold halo overlay on active stars. The facet hue stays as the star's *category color*; gold rises *over it* when the star is the cursor's basin. This is the design doc's commitment: *"gold marks attention; facet hues mark category."*
- **Thread bloom refinement.** The active basin's threads currently brighten via stroke-width and a vespers-bloom filter. Refine to match the design's named *vesper* register: quiet pastel persistence, ~600 ms fade-tail on the threads after cursor leaves the basin.
- **Cursor persistence within session.** When the visitor opens a work overlay or navigates away from /sky and returns, the cursor lands at its last sphere position rather than the polestar. Use `sessionStorage` per the design doc's commitment.

### Exit condition

P1 is done when:

- All five commitments above are visible on /sky for an interactive session.
- A Playwright test verifies the cursor glyph's hue shifts and the active star's halo scale changes on basin settle.
- A Playwright test verifies cursor persistence: open a work, close, cursor is at the same sphere position.
- Reduced-motion equivalents are present: in reduced-motion mode, settle is a snap (no scale crescendo, no halo breathing); the label appears in a 100 ms fade rather than the 400 ms held duration.
- The thread bloom's vespers fade is observable but does not introduce a long task that pushes the perf gate.
- `INTERACTION_DESIGN.md` is updated with the *halo claim* and *thread vesper* duration commitments if they don't already live there.

### Architectural decisions within this phase

- **Where the gold overlay renders.** Options: an additional `<circle>` inside the Star atom, conditionally added; a CSS pseudo-element on the active star; a new sibling element in the camera group. Each has trade-offs around the existing depth-sort and the View-Transitions API morph (P3).
- **Label rendering.** SVG `<text>` inside the camera group vs. HTML `<span>` overlaid via DOM measurement. SVG is depth-sortable with the constellation; HTML is more flexible for typography (drop-shadows, italic rendering). The design doc names italic serif at meta size; both can deliver.
- **Thread vesper persistence.** Whether the fade-tail uses CSS transition on `opacity` (cheap) or a per-thread state machine in the navigation hook (more controlled, more code). CSS is the right first form; the hook can take over if the cue needs more nuance.
- **Cursor persistence schema.** What exactly is stored in `sessionStorage`. Options: just `{x, y, z}`; the position plus the active-key at last settle; a richer state (cursor velocity, dragTarget, etc.). The simplest answer that survives a refresh is the position alone.
- **Whether persistence survives across `/sky/{room}/{slug}` overlay navigation.** Currently the overlay is its own route; the cursor's tick stops when the route changes. Decide whether the overlay-open state preserves cursor across the route boundary, or whether the overlay's close-handler explicitly restores cursor from sessionStorage.

### Parallel tracks

P1 can run alongside P0 (it depends on P0's vocabulary refactor for clean co-existence but does not strictly block on it). P1 can also run alongside P4's substrate work, since the active-basin commitments don't touch chrome.

### What stays held within P1

- The radial echo around the active star is *not* in P1 (that's P10).
- The pin ribbon on a held star is *not* in P1 (that's P8).
- The new-star bloom on returning visit is *not* in P1 (that's P11).

### Specs to reconcile

- `INTERACTION_DESIGN.md` (named cue durations).
- The navigation hook's source comments (active-state semantics).

### Tests to land

- Playwright: cursor glyph hue shift on settle.
- Playwright: active star halo scale change on settle.
- Playwright: cursor persistence across page refresh within a session.
- Playwright: cursor restoration after work-overlay close.
- Vitest: extended hook tests for the active-state semantics.
- Vitest: the existing 276 tests remain green.

---

## P2 — Demonstration choreography

*Status:* **pending**.
*Pull condition:* the lived experience of first arrival on /sky lacking a teaching moment. New visitors arriving cold do not currently understand they can move; the cursor sits at the polestar and the visitor is left to discover the gesture vocabulary by trial.

### Scope

The first-visit teaching-by-motion the design doc commits to:

- **First-visit demo drift.** ~600 ms after the sky-arrival animation completes, the cursor autonomously drifts from the polestar to the nearest non-polestar star (or the gravitational-center star — open decision below). The visitor watches the cursor move; the basin claims; the halo crescendos; the visitor learns *the cursor is mine, and it can travel.*
- **Returning-visitor short-circuit.** If `sessionStorage` carries a cursor position from a prior visit (P1's persistence), the demo drift is suppressed. Returning visitors land at their last position.
- **First-time vs. session-fresh detection.** A first-time visitor (no localStorage manifest of any prior visit) gets the demo drift even if `sessionStorage` is empty. A session-fresh visitor (returning across sessions but no in-session cursor) gets a shorter version (drift to active-basin only, ~300 ms).
- **Reduced-motion equivalent.** In reduced-motion mode, the cursor snaps directly to the demo target without animation; the basin claim is instant; the label appears with a 100 ms fade.
- **Skip gesture.** Any visitor input (pointer, touch, key) during the drift cancels the drift and snaps the cursor to the input's intended destination. The visitor is never *forced* to watch the demo; they can interrupt at any moment.

### Exit condition

P2 is done when:

- A first-time visitor (no localStorage) arriving on /sky sees the cursor drift autonomously and settle on a star within ~600 ms after the carpet roll.
- A returning visitor (sessionStorage cursor) does not see the demo drift; their cursor lands where they left it.
- A returning visitor (localStorage of prior visit, but sessionStorage empty) sees a short demo drift (~300 ms).
- Any input during the drift cancels it and yields control to the visitor.
- The reduced-motion equivalent is observable.
- A Playwright test mocks first-visit, returning-visit, and reduced-motion cases and verifies the expected drift behavior.
- The localStorage manifest (just a flag, or a richer schema — see decision below) is in place. If P11 lands later, this manifest is the foundation it builds on.

### Architectural decisions within this phase

- **The drift target.** Options: nearest-non-polestar star (closest by geodesic); gravitational-center star (most-connected, the "Cathedral" of the corpus); most-recent star; a star randomly chosen from the populated cairn; the same star every time (deterministic by date or session). The design doc names this as held question Q11. The author chooses; the rationale is documented.
- **The drift's path shape.** Options: great-circle along the sphere (most natural to the geometry); spline curve in screen space (more visually pleasing but less spatially honest); straight line in screen space (simplest). Great-circle aligns with the geometry P2 wants to teach.
- **localStorage manifest schema.** Minimum: a boolean *has-visited*. Maximum: full session history. The design doc names a *highest-perceived-work-mtime* manifest as the foundation for NewStarBloom (P11). Decide whether P2 lays this manifest down or just a simpler flag, with P11 expanding it.
- **Whether the demo drift writes to sessionStorage on completion.** If it does, a refresh during the drift would short-circuit the next visit. The cleanest answer is: write only after the visitor has interacted, not after the demo completes.
- **What the active basin's label says during demo drift.** The basin claims at the end of drift; should the label appear normally, or does the demo's demonstration-character call for a slightly emphasized first-show?

### Parallel tracks

P2 depends on P1's cursor-persistence module being in place to know whether to suppress the demo. P2 cannot land before P1 ships, but the rest of P2's logic is independent.

### What stays held within P2

- The contemplative drift toward gravitational center (P12) is *not* in P2 — that's a different drift in a different state.
- The new-star bloom on returning visit (P11) is *not* in P2 — that depends on the localStorage manifest's mtime field, which P2 may or may not lay down depending on the architectural decision above.

### Specs to reconcile

- `INTERACTION_DESIGN.md` (the named demo-drift duration and target).
- `CONSTELLATION_DESIGN.md` First-Visit Choreography section may refine based on the chosen drift-target rationale.

### Tests to land

- Playwright: first-time visitor sees the demo drift.
- Playwright: returning visitor (in-session) does not see the demo drift.
- Playwright: returning visitor (cross-session, no sessionStorage cursor) sees the short demo.
- Playwright: any input during the drift cancels it.
- Playwright: reduced-motion mode snaps without animation.
- Vitest: the navigation hook's drift-injection logic tested in isolation.

---

## P3 — Work overlay morph and reverse

*Status:* **pending**.
*Pull condition:* the lived experience of opening a work feeling discontinuous — the visitor clicks a star, and the overlay fades in from somewhere unrelated to the star's screen position. The committed *star expands toward the visitor* choreography is missing, and the committed *overlay collapses back to the star* is missing too.

### Scope

The View Transitions API morph between star and overlay, plus the cursor's continuity across the round-trip:

- **Forward morph: star → overlay.** When a star is activated (click, Enter, RadialEcho's open action), the View Transitions API creates a shared-element transition. The star's halo expands and morphs into the overlay's frame; the overlay's content fades into the expanded shape over ~600 ms with the site's signature easing.
- **Reverse morph: overlay → star.** When the overlay is dismissed (Esc, close button, swipe-down on mobile, browser back), the morph reverses. The overlay's frame collapses back to the star's screen position; the constellation behind the veil regains full opacity.
- **Cursor continuity across the round-trip.** The cursor's sphere position before opening the overlay is preserved. On close, the cursor is at the same sphere position as before the opening (which is the activated star's sphere position by definition). The visitor does not lose place.
- **Reduced-motion equivalent.** In reduced-motion mode, the morph collapses to a 100 ms fade. Forward: overlay appears with a fade. Reverse: overlay fades out. No spatial morph.
- **Behind-the-veil constellation.** While the overlay is open, the constellation continues rendering at ~30% opacity, with the slow rotation continuing, the atmosphere muted to ~50%, and the cursor glyph hidden (the visitor's body is now in the work, not on the surface). Per the design doc's *overlay veil* visual cue.
- **Browser back behavior.** Pressing browser back from `/sky/{room}/{slug}` returns to `/sky` with the cursor at the opened-from star. This is partially honored already (route-level back works); P3 ensures the cursor's sphere position is restored *to the activated star*, not to wherever it was before activation.

### Exit condition

P3 is done when:

- Clicking a star produces a visible morph from the star's screen position into the overlay frame over ~600 ms.
- Dismissing the overlay produces a visible reverse morph back to the star.
- The cursor's sphere position is the activated star's position when returning to /sky.
- The constellation continues rendering at ~30% behind the overlay; rotation persists; atmosphere is muted; cursor glyph is hidden.
- Reduced-motion mode collapses both morphs to 100 ms fades.
- A Playwright test verifies the visual outcome (frame screenshot at peak morph; cursor position assertion on close).
- No regression in the 276 existing tests.

### Architectural decisions within this phase

- **`viewTransitionName` assignment strategy.** Each star needs a unique `viewTransitionName` to be the morph target; the overlay's outer frame needs a matching name. Possibilities: name based on `/sky/{room}/{slug}` URL slug (URL-stable but requires the star to know its own slug at render time, which it does); a generated UUID per star (always unique but loses meaning); a content-addressed name derived from the work's title or id. The URL-stable approach is cleanest.
- **Whether all stars carry `viewTransitionName` always, or only the activated star carries it transiently.** Always-on is simpler (no JavaScript state to manage) but creates many named view-transition groups; transient is more ceremonious but adds a render coordination beat. The design doc and the View Transitions API's behavior favor *transient on activation*.
- **The veil's specific visual.** Options: a `<div>` with `backdrop-filter: blur` over the constellation (standard modal pattern); a CSS mask with watercolor texture (more in-register); an SVG `<rect>` inside the constellation with the sky's noise overlaid at reduced opacity (most-of-a-piece). The design doc commits to *soft veil*; the choice between approaches is the phase's.
- **What "muted" atmosphere means in numbers.** The design doc says ~50%. In implementation: WebGL pool's brightness multiplier; SVG firmament's fade overlay; the noise drift continuing or pausing. Decide the reduced atmosphere's specific contribution.
- **Mobile swipe-down close.** A new gesture not currently honored. Decide whether it lives in P3 (since it's overlay-specific) or in a separate gesture-vocabulary phase.
- **Whether the active-basin label persists into the overlay's title region.** If the visitor settles on a star and the label says *"Orion's Heart"*, does the overlay's title smoothly continue from that label, or does the overlay's title appear independently?

### Parallel tracks

P3 depends on P1's cursor persistence (the activated-star position must be recoverable). It can run alongside P0, P2, or P4. P3 is independent of all chrome surfaces — chrome and work-overlay-morph are separate concerns.

### What stays held within P3

- The work overlay's content layout (title, deck, body, facets, threads) is *not* the focus of P3 — the morph is. Layout polish is its own concern, deferred or split into a sub-phase.
- The reading-state choreography (scroll progress, error/loading states) is partially in place via the existing molecule; P3 doesn't refactor it.
- The mobile sheet-from-bottom variant (V12.C) is a held design alternative; if it's chosen, P3's morph adapts but the variant decision is upstream.

### Specs to reconcile

- `INTERACTION_DESIGN.md` (View Transitions API usage in /sky).
- `CONSTELLATION.md` (the *open / read / return* flow as committed).
- The work-overlay molecule's source comments (the held richer form is now shipped).

### Tests to land

- Playwright: forward morph timing and final frame.
- Playwright: reverse morph timing and final frame.
- Playwright: cursor returns to activated star on close.
- Playwright: reduced-motion fallback.
- Playwright: browser back behavior.
- Vitest: any logic moved out of the molecule.

---

## P3.5 — Aesthetic refinement

*Status:* **pending**.
*Pull condition:* the lived experience of /sky feeling materially close-but-not-yet to the design doc's *library-of-the-cosmos* register. The audit named brushstroke threads as drift, gold-as-active as drift, ornamental vocabulary as absent. P3.5 is the phase that brings the implementation visually into register with the design's aesthetic commitments — not a single new component, but a coordinated polish across many.

### Scope

The visible commitments to the design's aesthetic register that landed in spirit but not in letter. P3.5 ships:

- **Brushstroke threads.** The current Thread atom uses tapered SVG lines with a vespers-bloom filter. The design's *brushstroke thread* commitment is more painted: irregular thickness along the line; subtle texture; the hand-drawn quality. Either a new SVG filter (a brush-like noise modulation), an SVG `<feTurbulence>` displacement, or a small set of pre-painted stroke patterns referenced via `<pattern>`. The line still serves as the navigable connection; it now reads as a brushstroke.
- **Watercolor washes in title regions.** The carpet-roll arrival currently animates from above; the design doc commits to *watercolor washes* in title regions and around the polestar. Add a soft watercolor wash behind the polestar (bleeds outward at low opacity) and during arrival. This complements existing materials without replacing them.
- **Gold as the language of attention given.** P1 established gold-as-active for stars; P3.5 extends this everywhere active-state language appears: the cursor glyph's pulse intensity (gold tint when settled on a basin); the active facet chip's halo (in P6); the search-field's expanded-and-active border; the radial echo's center-mark; pinned-star ribbon (whatever variant ships). The discipline: gold is one specific color (`--accent-gold`); active states across the constellation share it.
- **Ornamental vocabulary instances.** Eight-point stars beyond the polestar: as visual flourishes between major regions in the WorkOverlay (between deck and body); as numerical decoration in section labels of the polestar panel; as a quiet flourish on the arrival surface. Asterism dividers replacing horizontal rules in the WorkOverlay's section breaks. These are small and infrequent; they are the design's *every ornamental mark carries meaning* commitment made concrete.
- **Inline link gold underline.** Currently inline links in WorkOverlay use the site's default link styling. The design commits to gold-underlined for links *within the constellation*. P3.5 implements this scoped to /sky's reading surfaces (overlay, panel) without affecting site-wide link styling.
- **Star halo's saturation profile.** The current `cn-watercolor-halo` filter is good; the design's commitment is *halos bleed beyond the geometric circle*, which is partially honored. P3.5 verifies the bleed is reading as watercolor-paper and not as digital glow. May involve filter-parameter tuning, opacity ramps, or paper-grain compositing into the halo's outer edge.
- **Atmosphere pool's saturated tone in the active basin.** P1 introduced the saturation boost in the pool zone (P1's gold-as-active commitment); P3.5 verifies it composes with the surrounding atmosphere (P5 firmament continues; the pool is not a hard disc). This is a felt-sense check more than a new feature.
- **Type-system uses across surfaces.** Verify all five type registers (heading, deck, body, metadata/second voice, system voice) are observable on the surfaces where they should appear. Where the design specifies sample copy (`"the constellation gathers"`, `"places you've held"`, etc.) and the implementation has not yet adopted, P3.5 ships the missing copy.

### Exit condition

P3.5 is done when:

- A side-by-side comparison of `/sky` (in both themes) against the canonical design mockups feels of-a-piece. The "library-of-the-cosmos" register lands in lived experience.
- Brushstroke threads are observable; they read as painted, not as vector lines with extra thickness.
- Watercolor washes are present in arrival and around the polestar.
- Gold is the consistent active-state color across all surfaces that have shipped (work overlay, cursor glyph, threads' active brightening; not yet chrome since chrome is later).
- Ornamental vocabulary appears in at least three places: polestar's geometric figure (already present); a decorative element in WorkOverlay's section structure; an asterism divider somewhere in the rolling content.
- Inline links in `/sky/{room}/{slug}` work overlay are gold-underlined.
- Where canonical sample copy is committed, it has shipped.
- A Playwright visual-regression test (or a manual review captured as a screenshot diff) confirms no regression in the existing visual surface.
- Existing tests remain green.

### Architectural decisions within this phase

- **Brushstroke implementation.** Three options: a new SVG filter (`<feTurbulence>` + `<feDisplacementMap>`); an SVG `<pattern>` of pre-painted strokes used as the stroke fill; a Canvas-rendered overlay sampled per-thread. The first is most in-register; the second is the lightest; the third is the heaviest. Author chooses; bundle weight verified.
- **Watercolor wash technique.** Inline SVG `<filter>`-driven blur with paper-noise compositing; CSS `backdrop-filter: blur` with theme-tinted gradient; a pre-rendered raster image referenced as a CSS background. The author chooses; the choice should preserve the *materials are how things are rendered* commitment.
- **Gold token's exact value.** `--accent-gold` exists in `tokens.css`; verify its current value reads as gold-illumination across themes. May need an *active-gold* variant (slightly more saturated) for the active-state-specific use, distinct from the *facet-gold* used as a category marker. The design's lexicon distinguishes; the tokens may need to follow.
- **Ornamental placement.** The design names that ornamental marks should not be gratuitous. P3.5's instances must each justify their meaning. The author surfaces each placement decision in commit messages.
- **Inline link styling scope.** Whether the gold-underline applies only to links within `.work-overlay`, or to all links inside `/sky/{room}/{slug}` routes, or only to links matching certain patterns. Decide.

### Parallel tracks

P3.5 can run alongside P0, P1, P2, P3, P4. It depends on P1's gold-as-active foundation but not strictly — P3.5 could ship before P1 if the active-state work is willing to absorb the gold-token decisions.

### What stays held within P3.5

- The full ornamental vocabulary (twin-sphere title pairings used in posters; numbered-section eight-point stars in long-form documentation) — held; those live in design-system documentation, not in /sky's runtime.
- New aesthetic registers introduced by held items (audio's visual representation; the gold of audio-drone surfaces) — held until those land.
- Rich animation across material surfaces (e.g., the watercolor washes drifting slowly) — held; first form is static washes.

### Specs to reconcile

- `DESIGN_SYSTEM.md` (active-gold token if introduced; ornamental-vocabulary documentation).
- `INTERACTION_DESIGN.md` (any new motion patterns introduced by ornament).
- `CONSTELLATION_DESIGN.md` (closing of variants where P3.5 implementation chose; e.g., V3.A wisp vs. V3.C braided for threads).

### Tests to land

- Playwright (visual): screenshot of a populated /sky surface in light theme matches a captured-baseline (or manual review).
- Playwright (visual): same for dark theme.
- Playwright: gold appears on active stars (extends P1's test to verify color value).
- Vitest: any new SVG filters or patterns tested for valid SVG output.
- Manual: aesthetic touchstone review against the design doc's *Aesthetic References* section. *"Does this read like Cotman's Greta Bridge?"* is a felt-sense question; the review captures the answer in the commit.

---

## P3.6 — Empty, loading, and offline states

*Status:* **pending**.
*Pull condition:* the moment a visitor encounters /sky in an edge state (empty corpus during dev preview; first-paint hydration on a slow connection; an offline session) and the surface produces a default-rendered void instead of the design's committed copy. The audit named these as **partial** (empty), **absent** (loading, offline). P3.6 brings them into being.

### Scope

The three living-edge surfaces the design committed to. P3.6 ships:

- **`S17 EmptySky` first-form.** When the constellation has zero nodes (a development preview; a deeper edge case), /sky renders the firmament, polestar, and atmosphere — exactly as it does for a populated constellation. Centered second-voice copy reads: *"the constellation gathers"* (italic, low opacity, fading in over ~1 s with the sky-arrival). The polestar is the only light; the visitor sees a world *waiting*. The cursor is present at the polestar but has nothing to claim.
- **`S18 LoadingSky` first-form.** /sky is prerendered SSG, so loading-state largely doesn't apply at runtime. *But* the edge case is real: a slow connection where hydration is delayed; a code-split chunk fetch that hasn't resolved. First-form: a faint *"gathering"* second-voice line appears centered if hydration takes longer than ~1.5 s. Hidden when hydration completes. The orbiting-loader visual the design doc gestures at can be a small breath / fade-in animation at the polestar's edge — quiet, not insistent.
- **`S19 OfflineSky` first-form.** When the visitor is offline (`navigator.onLine === false` at /sky entry), the surface still works (everything is prerendered + cached). The state's only difference: a second-voice line at the bottom of the strip's center reads *"you're offline. explore cached stars."* When the visitor reconnects, the line fades. No banner; no toast; no warning. The constellation continues working.
- **Composition with other surfaces.** Each edge state must compose with active filters, time-scrub, etc. An offline visitor with active filters sees the offline-state line *plus* the filter dimming. An empty constellation that is also being filtered shows the *gathering* line; no filter has anything to act on.
- **Reduced-motion equivalents.** All edge-state copy fades in at 80 ms rather than ~1 s. The constellation's sky-arrival proceeds normally if reduced-motion permits.

### Exit condition

P3.6 is done when:

- A development preview with empty content shows `S17 EmptySky` correctly, with copy centered and fading in.
- A slow-network simulation (Playwright + throttling) produces the loading state; quick networks don't show it.
- An offline session (Playwright with `context.setOffline(true)`) shows `S19 OfflineSky`'s copy.
- All three states compose correctly with active filters / time-scrub when those phases have shipped.
- Reduced-motion equivalents work.
- Playwright tests cover each edge state.
- The first-time visitor who unfortunately encounters an edge state has a comprehensible experience.

### Architectural decisions within this phase

- **What "empty" means for triggers.** Truly zero `ConstellationNode` entries (which only happens in dev preview / a content-removal mistake) vs. zero *visible* stars (which can happen with all stars dimmed by filter). The design's *"the constellation gathers"* copy is for the former; the latter is `FilterActive` with all-dimmed (no committed copy). Decide whether the distinction is honored here or in P6's filter scope.
- **Loading detection.** Options: a delayed-render trick (start with blank, render after 50 ms); a Suspense boundary (React 19 supports this); a manual `useEffect` with a setTimeout; a presence flag set by the route loader. The simplest answer is the delayed-render trick; the cleanest may be Suspense.
- **Offline detection technique.** `navigator.onLine` is unreliable; service-worker-mediated detection is more accurate but adds complexity. First form: rely on `navigator.onLine`; document the unreliability; accept that occasionally the line shows when online and vice versa.
- **Where the offline line lives.** In the strip (a center-spanning faint line); above the polestar; centered at viewport. Decide.
- **Whether the empty-state copy ever shows in production.** If the corpus is never empty in production (post-launch), `S17 EmptySky` is dev-only. Decide whether the test surface includes production-only copy or only development copy.

### Parallel tracks

P3.6 is mostly independent. It can run alongside P0 through P3 and beyond. P3.6 has small dependencies on each chrome phase (offline-state-with-filter-active needs P6's filter to exist) but the *primary* surface can ship before chrome.

### What stays held within P3.6

- A full service-worker-mediated offline experience (with custom cached-content prompts; with offline-only affordances) — held; first form is detection + copy only.
- A "you appear to be on a slow connection" loading-state escalation — held; first form is the simple delay.
- Empty-state CTAs ("be the first to read") — forbidden by epistemic posture; not in scope.

### Specs to reconcile

- `INFORMATION_ARCHITECTURE.md` (the edge-state behaviors documented).
- `VOICE_AND_COPY.md` (the second-voice copy patterns confirmed).
- `INTERACTION_DESIGN.md` (the loading-state's small breath animation register).

### Tests to land

- Playwright: empty-corpus rendering with copy.
- Playwright: simulated slow network shows loading state.
- Playwright: offline detection with `setOffline(true)`.
- Playwright: composition with filter (when P6 has shipped).
- Playwright: reduced-motion equivalents.
- Vitest: edge-detection logic in isolation.

---

## P3.7 — Foyer "look up" gesture

*Status:* **pending**.
*Pull condition:* the lived experience of the visitor reaching /sky as a *click on a link* rather than a *gesture* — the felt-sense difference between *navigating to a route* and *looking up at a ceiling*. The current `↑ Look up` link in the Foyer is honest but functionally identical to any other link; the design committed to overscroll-from-Foyer-top as the canonical first-form.

### Scope

The committed arrival gesture from `CONSTELLATION.md` and `CONSTELLATION_DESIGN.md`. P3.7 ships:

- **Overscroll detection at Foyer top.** When the visitor is at the top of the Foyer (scroll position ≤ 0) and continues scrolling up (touch swipe down on body, mouse wheel up, trackpad scroll up), an overscroll threshold accumulates. Crossing the threshold (~80–120 px of overscroll) triggers the arrival.
- **Tipping-the-scales resistance.** Before the threshold, the page resists gently. The Foyer doesn't move; a faint visual cue at the top edge (a chevron, a pulled-thread of motion, a quietly pulsing dot — held question — see decision) shows that *something is above*.
- **Carpet roll commit.** Once the threshold is crossed, the carpet roll commits — completing regardless of further scroll input. No half-state, no flicker, no "you scrolled too little, try again."
- **Keyboard alternative.** Pressing `↑↑` (two up arrows in quick succession) at the Foyer top triggers the arrival without overscroll. The existing labeled "Look up" link remains as the most-discoverable fallback for visitors who don't find the gesture.
- **Visitor's first-time affordance.** A subtle visual cue on first visit (a chevron, a faint pulse) invites the gesture. After first use within a session, the affordance fades — the visitor doesn't need re-prompting.
- **Reduced-motion equivalent.** Overscroll is disabled (or short-circuits to immediate transition); the keyboard alternative remains; the link remains. The visitor reaches /sky with a 100 ms fade rather than a carpet roll.
- **Mobile considerations.** iOS rubber-banding interferes with overscroll detection; some scroll containers consume touch events. Decide whether the gesture is mobile-first (swipe-down at Foyer top) or desktop-first (mouse-wheel up).

### Exit condition

P3.7 is done when:

- A desktop visitor at the Foyer top who scrolls up past the threshold sees the carpet roll arrival.
- A mobile visitor at the Foyer top who swipes down past the threshold sees the same.
- The keyboard alternative (`↑↑`) works.
- The labeled link continues to work.
- A first-visit visitor sees the affordance cue.
- The cue fades after first use within the session.
- Reduced-motion equivalent works.
- Playwright tests cover desktop overscroll, mobile swipe, keyboard alternative, link.
- The gesture does not interfere with normal Foyer scrolling (a visitor scrolling normally within the Foyer never accidentally triggers the arrival).

### Architectural decisions within this phase

- **Overscroll detection technique.** Three options: a `wheel` event listener with cumulative deltaY tracking; a scroll-position check with a custom offset accumulator; using the `:has(:hover)` and `overscroll-behavior` CSS-level controls. The first is most reliable cross-browser; the second is lightest; the third is most modern.
- **First-visit affordance form.** Per design's gestures-at-it: a chevron-up icon at the Foyer's top edge; a faint horizontal line pulsing slowly; a quietly pulsing dot; a pulled-thread of motion. Each carries different aesthetic weight. Author chooses.
- **Threshold value.** 80 px is the design's lower bound; 120 px is the upper. Decide; consider that mobile thresholds may need to be larger to avoid false positives during normal scroll inertia.
- **Whether the Foyer's existing scroll position resets when the visitor returns from /sky.** If yes, the visitor lands back at the Foyer top — ready to repeat the gesture. If no, they land where they left, and the gesture requires scroll-up first.
- **Mobile swipe interpretation.** A touch swipe-down at Foyer top is the natural gesture; but iOS already uses overscroll for refresh hints. Decide if there's interference; if so, an alternative gesture (two-finger swipe; long-press at top) may be needed. *Note: this is a place where the gesture may not feel right on every device; held-as-decision is acceptable until real-device testing.*

### Parallel tracks

P3.7 is mostly independent. It touches the Foyer route (which exists outside the constellation organism) and the /sky route's arrival animation (which already lives in `tokens.css`). P3.7 can run alongside P0, P1, P2, P3, P3.5, P3.6.

### What stays held within P3.7

- The Foyer's other affordances (the geometric figure rotating; the welcome lines; the wordmark) — unchanged.
- The carpet roll's content (already shipped in `sky-look-up` keyframes; P3.5 may refine but P3.7 doesn't redo).
- A horizontal swipe-from-top gesture for tablet — held; first form is overscroll only.

### Specs to reconcile

- `INFORMATION_ARCHITECTURE.md` (the arrival gesture documented; the existing link may retire from primary, may stay as fallback).
- `INTERACTION_DESIGN.md` (the overscroll threshold; the resistance feel).
- `CONSTELLATION.md` (the arrival ritual described).

### Tests to land

- Playwright (desktop): overscroll triggers arrival.
- Playwright (mobile): swipe-down triggers arrival.
- Playwright: keyboard alternative.
- Playwright: link still works.
- Playwright: first-visit affordance fades after first use.
- Playwright: normal Foyer scrolling unaffected.
- Playwright: reduced-motion equivalent.
- Vitest: overscroll-detection logic in isolation.

---

## P3.8 — Leaving /sky gesture

*Status:* **pending**.
*Pull condition:* the lived experience of departing /sky feeling discontinuous with the arrival. The visitor came in with a carpet roll; they leave by clicking a link or pressing browser-back, which is functional but not symmetric. The design's open question Q12 names the leaving gesture as held; P3.8 closes the symmetry.

### Scope

The departure-from-/sky surface, paired with P3.7's arrival. P3.8 ships:

- **The carpet furl.** When the visitor invokes the departure gesture (see below), the constellation recedes — camera pulls back, atmosphere fades, the carpet rolls *back up* over ~800 ms (mirroring the arrival's ~1350 ms but compressed; the leaving feels lighter than the arriving). The Foyer reasserts beneath.
- **Departure gestures.** Multiple paths to leave:
  - Foyer-glyph in the HorizonStrip (P5): the formal departure.
  - Browser back (already works; the carpet furl now plays before the route changes).
  - Keyboard `Esc` from /sky (currently does nothing; P3.8 binds it to the departure).
  - Mobile swipe-down past a threshold from the constellation surface (mirrors P3.7's swipe-up arrival).
- **Foyer scroll-position restoration.** The visitor returns to the same scroll position they were at when they triggered the arrival. If they came from a midway scroll, they land back midway; if they came from the top, they land at top.
- **Reduced-motion equivalent.** Departure collapses to a 100 ms fade. The Foyer reasserts immediately.
- **State preservation.** Leaving /sky preserves the cursor's sphere position, active filters, time-scrub state, search query in the URL — so a return via `↑↑` or overscroll re-establishes the visitor's place.

### Exit condition

P3.8 is done when:

- All four departure gestures (Foyer glyph, browser back, Esc, mobile swipe) trigger the carpet furl.
- The animation feels symmetric to the arrival but ~half its duration.
- Foyer scroll position is restored.
- /sky state (cursor, filters, time, search) is preserved in URL/sessionStorage so return is continuous.
- Reduced-motion equivalent works.
- Playwright tests cover all four gesture paths.
- A round-trip (Foyer → /sky → Foyer → /sky) preserves both surfaces' state.

### Architectural decisions within this phase

- **Whether `Esc` leaves /sky or only dismisses chrome.** The chrome substrate (P4) already binds `Esc` to dismiss the deepest open chrome surface. Decide whether `Esc` with no chrome open leaves /sky entirely (consistent and simple) or does nothing (avoids accidental departure during quiet exploration). The author chooses; the design doc favors *consistent* behavior.
- **Whether the carpet furl plays before browser-back navigates.** Browser-back is supposed to be instant; intercepting it with an animation may feel unresponsive. Three options: (a) play the furl, then navigate; (b) navigate immediately, no furl on browser-back specifically; (c) play a shortened furl (~300 ms) compatible with back's expected speed. Author chooses.
- **Whether /sky's URL state is preserved through the departure.** If a visitor leaves with `?facets=consciousness&q=spanda` active, does the URL remember those for the next visit? `sessionStorage` is the cleaner answer; URL-as-truth is more shareable.
- **Mobile swipe threshold.** Symmetric to P3.7's arrival threshold; or different (departure is more deliberate and may want a higher threshold to avoid false-trigger).

### Parallel tracks

P3.8 depends on P3.7 (the arrival establishes the symmetric expectation) and P5 (the foyer-glyph button lives in the HorizonStrip). It can run alongside other phases after those.

### What stays held within P3.8

- A "return to where you were on /sky" prompt on Foyer landing — held; that's a re-entry affordance, distinct from the leaving gesture.
- Stay-on-/sky-permanently option (a "make /sky my homepage" feature) — held; never proposed.

### Specs to reconcile

- `INFORMATION_ARCHITECTURE.md` (the departure gesture documented; URL state preservation).
- `INTERACTION_DESIGN.md` (the carpet furl's motion register).
- `CONSTELLATION.md` (the leaving ritual described, paired with the arrival).

### Tests to land

- Playwright: each of the four departure gestures triggers the furl.
- Playwright: Foyer scroll position restored.
- Playwright: /sky state preserved across round-trip.
- Playwright: reduced-motion equivalent.
- Playwright: round-trip integrity.

---

## P4 — Chrome substrate

*Status:* **pending**.
*Pull condition:* the moment a chrome surface is genuinely pulled forward (filter, search, time, pin, radial, polestar panel) and the architectural cost of adding it ad-hoc becomes higher than the cost of authoring the substrate first. P4 is a foundation phase; it ships no visible behavior on its own.

### Scope

The shared infrastructure that all chrome surfaces depend on. P4 produces:

- **A chrome state hook** (working name: `useConstellationChrome`). Owns: which chrome surfaces are open, which has focus, the dismissal stack (Esc unwinds the deepest open surface first).
- **Focus management primitives.** A `useFocusReturn` helper that captures the focused element on open and returns focus to it on close. A `useFocusTrap` helper for surfaces that should keep keyboard focus inside while open.
- **Dismissal coordination.** Esc, click-outside, motion-away, timeout-based dismissal — composed into a `useDismissal` helper that surfaces accept and configure.
- **Z-stack manager.** A small module that knows the layering rules from the design doc (chrome above constellation; work overlay above all chrome; specific orderings between simultaneously-open chrome). Exposes z-index tokens or CSS classes that components apply.
- **Scene broadcast channel.** A second shared signal (parallel to `constellationCursor`) that lets chrome surfaces broadcast state to the world layer: filter active set, time-scrub position, search query state. The world layer (Constellation organism) reads from this signal each render or each tick.
- **Reduced-motion equivalents.** Chrome opens/closes with a fade in reduced-motion mode rather than the normal motion register. The substrate honors this; individual surfaces inherit.
- **Test substrate.** A test helper that mounts a Constellation organism with a chrome state mocked into specific configurations (one filter active, search expanded, pin panel open, etc.) so individual chrome surfaces can be unit-tested in isolation.

### Exit condition

P4 is done when:

- The hook, helpers, and signal exist; their public APIs are documented in source comments and have unit tests.
- A trivial example consumer (a single fake chrome surface, perhaps just a labelled div that opens on a key press and dismisses on Esc) demonstrates the substrate works end-to-end.
- The substrate's test fixtures can mount the Constellation in arbitrary chrome states.
- No regression in the 276 existing tests.
- No new visible chrome on /sky (P4 is foundation only).

### Architectural decisions within this phase

This is the largest set of architectural decisions in any phase. The choices made here constrain every subsequent chrome phase.

- **Where chrome state lives.** Options:
  - Inside `useConstellationNavigation`'s state machine (single hook owns everything; tightly coupled).
  - In a new `useConstellationChrome` hook composed alongside `useConstellationNavigation` (loose coupling; coordination via shared refs).
  - In a React context at the Constellation organism level (declarative; integrates well with focus-trap libraries; risks re-render storms if not memoized carefully).
  - In a module-level signal-pattern (matches `constellationCursor`'s shape; outside React's reactivity; lowest overhead but couples test mocking).
  - The author chooses; the rationale is the phase's most important commit.
- **Whether to adopt a headless library** (Radix UI, Headless UI, ARIA-Practices implementations) for focus management and dismissal, or build from scratch.
  - Adopting brings rigor (axe-tested patterns, RTL/LTR handling) at the cost of bundle size and aesthetic conflict (the libraries' default behaviors may not match the design doc's *quiet chrome* commitment).
  - Building from scratch is small (a few hundred lines) and stays in-aesthetic at the cost of accessibility patterns that an established library would already encode.
  - The author chooses; if a library is adopted, only its *headless* layer enters the bundle (not its visuals).
- **Z-index strategy.** Options:
  - A small ladder of z-index tokens in `tokens.css` (`--z-chrome`, `--z-overlay`, `--z-radial`, etc.).
  - A `z-stack` utility that components call (`useZStack('chrome')` returns the right z value).
  - Using the natural DOM order with `transform: translateZ(0)` to create stacking contexts (no z-index management needed).
  - The decision shapes how new chrome surfaces declare their layer.
- **Scene broadcast schema.** What exactly gets broadcast. Filter active set is a `Set<Facet>`. Time-scrub position is a `Date | null`. Search state is a `{ query: string; matches: Set<starKey> }`. Decide whether the broadcast is a single typed object or a set of named signals.
- **Whether `useConstellationNavigation` reads from the broadcast or remains fully insulated.** The navigation hook may need to know whether a filter is active (to dim non-matching basin claims, e.g., per the design's "filter narrows attention, not topology"). Decide the boundary.

### Parallel tracks

P4 cannot run alongside the chrome phases that depend on it (P5–P10), but it can run alongside the visible phases that don't (P1, P2, P3) and any spec work.

### What stays held within P4

- No visible chrome surfaces. P4 is substrate; surfaces are P5+.
- No icon set yet; that lands with P5.
- No specific copy patterns; those land with the surfaces using them.

### Specs to reconcile

- `REACT_NORTH_STAR.md` (the substrate's architectural shape — context vs. signal vs. extended hook — is a structural choice worth documenting).
- `INTERACTION_DESIGN.md` (the dismissal vocabulary; focus-return commitment).
- A new section in `CONSTELLATION_HORIZON.md` describing the chrome substrate's technical shape may be warranted.

### Tests to land

- Vitest: each helper (`useFocusReturn`, `useFocusTrap`, `useDismissal`) tested in isolation with @testing-library/react.
- Vitest: the chrome state hook tested with the trivial example consumer.
- Vitest: the scene broadcast signal tested for read/write/reset (parallel to `constellationCursor`'s tests).
- Vitest: the z-stack module tested if it's non-trivial.
- No Playwright (no visible behavior).

---

## P5 — HorizonStrip skeleton

*Status:* **pending**.
*Pull condition:* the chrome substrate (P4) has shipped, and the corpus has reached a state where the visitor would benefit from a search/filter/time/pin affordance. P5 brings the strip into existence; subsequent phases populate it.

### Scope

The HorizonStrip's bottom-edge presence and its at-rest / pointer-near / actively-using states. P5 ships:

- **The strip itself.** A `<nav>` (or `<aside>` — see decision) at the bottom of the viewport on /sky. Honors the responsive breakpoints from the design doc (height varies 5–12% by tier).
- **The strip's at-rest state.** Quiet, ~15–25% opacity. Visible on first paint of /sky after Demonstration; visible at all times thereafter unless explicit `low-visibility-contemplative` (P12).
- **The strip's pointer-near state.** Strip rises to ~70% opacity when pointer enters the bottom third of the viewport. Honors the design's *quiet chrome* principle.
- **The strip's actively-using state.** Strip rises to full opacity for the control being used; rest stays at 70%.
- **The foyer glyph.** Leftmost element. The eight-point star ornament (or the site's wordmark — see decision). Click/Enter returns to the Foyer.
- **Empty placeholders for the future regions** (search, facet chips, timeline, pin) — visible regions that future phases populate.
- **Site nav reconciliation on /sky.** A decision is made: site nav retires on /sky entirely, OR stays at minimum opacity, OR is replaced by the HorizonStrip's foyer glyph as the only home-return affordance. The phase commits to one and documents.
- **Theme toggle relocation.** The current theme toggle (top-right of site nav) either: stays where it is (and site nav stays at minimum); migrates to the strip's right side; or migrates to the daystar (with the daystar interactive — a held vision becoming concrete). P5 chooses.
- **Reduced-motion equivalent.** In reduced-motion mode, the strip's opacity transitions are 80 ms fades; the strip is otherwise identical.

### Exit condition

P5 is done when:

- The strip is present at the bottom edge of /sky in light and dark themes.
- The three states (`at-rest`, `pointer-near`, `actively-using`) are observable.
- The foyer glyph is interactive and returns the visitor to the Foyer.
- The placeholder regions are visible (perhaps as faint outlined boxes; visible on hover with future-feature labels in second voice).
- Site nav and theme toggle behavior is decided and consistent across light/dark, mobile/desktop.
- Reduced-motion equivalent is observable.
- A Playwright test verifies the three states transition on cursor position.
- A Playwright test verifies foyer glyph navigation.
- An axe test verifies the strip has correct landmark roles, focus rings, AA contrast.
- The strip's bundle weight is documented (within the 215 KB ceiling).

### Architectural decisions within this phase

- **Element semantic.** `<nav aria-label="Constellation tools">` vs. `<aside>` vs. an undecorated `<div>` with role assignment. The strip carries navigation (foyer return, eventually search-as-navigation) — `<nav>` is the strongest claim.
- **Mounting location.** Inside the Constellation organism's render (so /sky's HorizonStrip is /sky-only) or in the route layout (so the strip can theoretically appear elsewhere, but practically only /sky configures it). Inside the organism is the more contained choice.
- **Foyer glyph form.** The eight-point star (matches the polestar; risks visual collision); a chevron-down (suggests the down-direction return); the site's wordmark in miniature; a custom umber-arrow ornament. The design doc gestures at *foyer glyph* without specifying.
- **Site nav fate on /sky.** Three honest options:
  - Site nav retires entirely on /sky; the strip's foyer glyph is the only return path. Cleanest; risks visitor confusion if they're used to top-nav.
  - Site nav minimizes (theme toggle only, no wordmark or other links) on /sky; foyer glyph is the primary path; theme toggle stays at top-right.
  - Site nav stays as-is; foyer glyph is redundant. Worst for *quiet chrome*; safest for visitor habit.
- **Theme toggle's destination.**
  - In the strip's right end: lives where chrome lives.
  - On the daystar in the constellation: poetic; honors the held *daystar's ascent*; the daystar becomes interactive and toggles theme on click.
  - In a future polestar panel (P8): more discoverable than daystar; less spatial.
  - The author chooses; the rationale is the phase's poetic-stakes commit.
- **Strip's z-stack position.** Above constellation (per layering rules) but below RadialEcho (so a radial echo over the cursor can be in the strip's vertical space without conflict). P4's z-stack module enforces.

### Parallel tracks

P5 blocks on P4. It can run alongside P1, P2, P3, P0. After P5 ships, P6, P7, P8, P9, P10 unblock.

### What stays held within P5

- All in-strip controls (search, facet chips, timeline scrubber) are *not* in P5. They populate the placeholders in subsequent phases.
- The strip's `low-visibility-contemplative` state (used in P12) is named but not ridden in P5.
- Pin panel access via the strip's right side is *not* in P5; that's P8.

### Specs to reconcile

- `INFORMATION_ARCHITECTURE.md` (the foyer-return path on /sky).
- `INTERACTION_DESIGN.md` (the strip's state transitions and durations).
- `DESIGN_SYSTEM.md` (any new tokens introduced for the strip's regions).

### Tests to land

- Playwright: strip state transitions on pointer position.
- Playwright: foyer glyph navigation.
- Playwright: theme toggle behavior at its chosen location.
- Playwright: reduced-motion equivalent.
- Vitest: HorizonStrip component tests with @testing-library/react.
- Axe: strip has correct landmark, focus rings, contrast.

---

## P6 — Facet filtering

*Status:* **pending**.
*Pull condition:* the corpus has reached a size (~12 works or more) where the visitor benefits from a lensing affordance. Without filtering, /sky shows every work always; with the corpus growing, the value of *narrowing* through a facet rises.

### Scope

The visitor's first lensing tool. P6 ships:

- **Eight FacetChip-as-filter atoms** in HorizonStrip's facet-row region. Each chip carries one of the eight facets (craft, body, beauty, language, consciousness, becoming, leadership, relation). Each chip has rest, hover, active, and active-hovered states.
- **Filter-active scene state.** When one or more chips are active, the constellation visibly *lenses*: matched stars stay at full opacity; non-matched stars dim to ~15% opacity; threads with one or both endpoints non-matched dim correspondingly.
- **Compositional filtering.** Multiple active chips intersect (AND). A visitor activating *consciousness* and *becoming* sees the works carrying both, with everything else dimmed.
- **Strip thickening on filter-active.** Per the design's named *strip thickening* visual cue: strip grows in vertical presence to indicate the lens is engaged.
- **Clear-all gesture.** A small `×` appears on the strip when filters are active; tapping or `Esc` clears all filters in one move.
- **Cursor and basin physics during filter.** The cursor's basin claim continues to work on dimmed stars; filtering narrows *attention*, not *topology*. (A filtered visitor can still settle on a dimmed star; the filter's role is emphasis, not gating.)
- **URL state for filter set.** When a filter is active, `/sky?facets=consciousness,becoming` represents the state; reload restores it. This is the design doc's *shareable filtered view* commitment, partly addressed.
- **Reduced-motion equivalent.** No transition; star opacity changes happen in <80 ms fade.

### Exit condition

P6 is done when:

- All eight chips render in the HorizonStrip; rest/hover/active/active-hovered states are observable.
- A single active chip dims non-matching stars and threads.
- Multiple active chips intersect (AND).
- Strip thickens visibly when ≥1 filter active.
- Clear-all (`×` tap or `Esc`) clears all filters in one gesture.
- Cursor traversal continues across dimmed stars.
- URL reflects the active filter set; reload restores.
- Reduced-motion equivalent collapses transitions to instant fades.
- A Playwright test verifies the filter visual states.
- A Playwright test verifies cursor traversal across a filtered constellation.
- A Playwright test verifies URL state and reload restoration.
- An axe test verifies chip accessibility (focus, contrast, AA).
- The first-visit visitor gracefully encounters chips at low opacity without confusion (no test for "graceful" but design-reviewed).

### Architectural decisions within this phase

- **Chip visual variant.** From design doc V8.A–D: colored dot, labeled pill, glyph-and-label-on-hover, small-constellation. The phase chooses; the rationale documented.
- **The new FacetChip vs. the existing FacetChip atom.** The current atom is for `/facet/{facet}` display; P6's chip is a toggle. Three options:
  - Reuse the existing atom by adding a `mode: 'display' | 'toggle'` prop (couples two roles in one component).
  - Author a new atom `FacetFilterChip` distinct from `FacetChip` (clean separation; codebase carries two similar atoms).
  - Promote the existing atom to a molecule that wraps the display use, leaving the atom as the chip primitive (the atomic-design migration named in the audit).
  - The author chooses; the audit's *atomic-design boundary* note stands.
- **Filter state ownership.** P4's chrome substrate exposes a scene broadcast signal. P6 writes the active-set there; the Constellation organism reads it. Decide whether the URL state is the source of truth (and the signal mirrors it) or vice versa.
- **What "matched" means for compositional filters.** AND across all active chips means a star matches if it carries *all* active facets. OR (a star matches if it carries *any*) is the alternative. The design doc commits to AND ("multiple filters intersect").
- **Whether the cursor's basin claim respects the filter.** Two options: (a) basin claim is purely physics, dimmed stars still claim (current commitment per the design doc); (b) filtered-out stars do not claim (stronger filtering). The design's *narrows attention, not topology* favors (a).
- **Mobile chip layout.** The design doc's responsive table says 6 chips + "more" expander on phone. Decide which 6 are most-prominent and how the "more" affordance reveals the remaining 2.

### Parallel tracks

P6 blocks on P5 (HorizonStrip skeleton) and P4 (chrome substrate). It can run alongside P7 (search) since the two surfaces are independent within the substrate.

### What stays held within P6

- The filter UI for time-scrubbed-and-filtered combined state (S16 `Filtered+Searched` extends to S16's variant *with time*) — that's P9's concern.
- The "find related" radial-echo action that broadens a filter — that's P10.
- Cluster-naming editorially (Q10 *named asterisms*) — held; not in P6.

### Specs to reconcile

- `INFORMATION_ARCHITECTURE.md` (URL grammar for filter state; relationship to existing `/facet/{facet}` pages).
- `INTERACTION_DESIGN.md` (strip thickening; chip state transitions).
- `VOICE_AND_COPY.md` (clear-all microcopy: *"clear filters"* in second voice).
- `BACKLOG.md` (the filter held item graduates).

### Tests to land

- Playwright: each chip's rest/hover/active state.
- Playwright: filter dimming on the constellation.
- Playwright: AND composition with multiple chips.
- Playwright: clear-all clears all in one gesture.
- Playwright: cursor traversal across dimmed stars.
- Playwright: URL state and reload.
- Vitest: filter logic in isolation.
- Axe: chip accessibility.

---

## P7 — Search

*Status:* **pending**.
*Pull condition:* the corpus has reached a size where finding a specific work by title benefits from a query interface. Without search, the visitor finds works by spatial recognition (their location in the constellation); with corpus growth, search complements without replacing.

### Scope

The visitor's predicate-by-name surface. P7 ships:

- **SearchField in HorizonStrip.** Collapsed at rest (icon only); expands inline on tap or `/` key.
- **Search predicate.** A query matches against work title, author surface, facet names, and (held question — see decision) optionally body content. Match is fuzzy; matching is per-keystroke.
- **Pre-glow on matches.** As the visitor types, matched stars rise to full opacity; non-matched stars dim to ~15%. Per design doc: *"matched stars stay full; non-matches dim."*
- **Single-match jump.** Pressing Enter on a query that produces exactly one match travels the cursor to that star (great-circle path over ~1200 ms; cursor follows; basin claims).
- **Multi-match traversal.** Pressing Enter on a query with multiple matches narrows the constellation to the matched set (like a filter). The visitor wanders the matched set via existing physics.
- **No-match state.** Display second-voice: *"no stars match. clear filters."* below the search field, with a clear gesture.
- **Composability with filtering.** Search and filter compose (S16 `Filtered+Searched`). A visitor with `consciousness` + `becoming` filters active and a search for "spanda" sees works matching all three predicates highlighted.
- **Reduced-motion equivalent.** No travel animation; cursor snaps to single-match star. Matches highlight without fade.
- **URL state.** Active search query represented in the URL as `?q=spanda`. Combined with filters: `?facets=consciousness,becoming&q=spanda`.

### Exit condition

P7 is done when:

- SearchField is in HorizonStrip; collapses/expands as designed.
- `/` key focuses and expands the field from anywhere on /sky.
- Typing produces per-keystroke pre-glow on matches and dimming on non-matches.
- Single-match Enter jumps cursor via great-circle path (P1's cursor persistence is the foundation; the jump is a single tangent acceleration plus snap).
- Multi-match Enter narrows the constellation to matched set.
- No-match state renders the second-voice copy.
- Search composes with filters.
- URL state reflects search and reloads correctly.
- Reduced-motion fallback works.
- Playwright tests cover all the above.
- Axe coverage of SearchField.

### Architectural decisions within this phase

- **Search predicate scope.** Title-only, title-and-facets, title-and-facets-and-body. Body search requires loading body content (already loaded for prerendered SSG), but indexing it adds bundle weight. Decide.
- **Index strategy.** A pre-built index (e.g., FlexSearch, MiniSearch) at build-time, served as JSON; or a runtime predicate over the existing display works. For ~12–50 works, runtime is fine; at 100+, an index helps.
- **Field placement variant.** Per design's V7.A–D: in-strip text field; floating field at top center; type-anywhere (no visible field); persistent field. The author chooses.
- **Travel motion for single-match.** A great-circle slerp from current cursor to target over ~1200 ms with the design's signature easing; the cursor's velocity at arrival should be near-zero so basin claim is clean.
- **Multi-match interaction.** Whether "narrowing to matched set" hides non-matches or just dims more aggressively. The design's *filter narrows attention, not topology* applies.
- **Search-and-filter URL composition.** Whether `?q=` and `?facets=` are composed in URL order, sorted alphabetically, or grouped. Trivial but worth a deliberate choice.

### Parallel tracks

P7 blocks on P5 and P4. It can run alongside P6 (filter) and P8 (pin) since the surfaces are independent. After P7 and P6 ship, S16 Filtered+Searched is observable.

### What stays held within P7

- Search history within or across sessions — held; not committed by the design doc.
- Search suggestions / autocomplete — held; out of scope for first form.
- Voice search — held in design's interaction vocabulary.

### Specs to reconcile

- `INFORMATION_ARCHITECTURE.md` (URL grammar for search state).
- `INTERACTION_DESIGN.md` (the great-circle travel motion).
- `BACKLOG.md` (search held item graduates).

### Tests to land

- Playwright: search field collapse/expand.
- Playwright: per-keystroke matching.
- Playwright: single-match jump.
- Playwright: multi-match narrowing.
- Playwright: no-match state.
- Playwright: composition with filters.
- Playwright: URL state.
- Playwright: reduced-motion fallback.
- Vitest: search predicate logic.
- Axe: SearchField accessibility.

---

## P8 — Pinning and persistence

*Status:* **pending**.
*Pull condition:* the visitor's session begins to feel longer than a single sitting — they leave to do other things and return later, and want to come back to specific stars they were thinking about. P8 gives them a way to *hold places* across the session.

### Scope

The visitor's session-state console. P8 ships:

- **PinRibbon atom.** A small mark on a pinned star (notch, underline, gold-shift, or tag-and-string per design's V13.A–D). Visible at all times; only on pinned stars.
- **Pin/unpin gesture.** Long-press on a star (touch); right-click + "Pin" (mouse, via RadialEcho once P10 ships, or via a one-off pin keyboard shortcut for now).
- **Pin state in the chrome substrate.** A `Set<starKey>` in P4's scene broadcast.
- **Persistence module.** A small wrapper around `sessionStorage` (and optionally `localStorage` — see decision) that the chrome substrate uses to read/write pin state.
- **PolestarPanel organism.** Rises from the polestar position when invoked. Contains: pinned stars list (with title and remove); recently opened stars (last 5; auto-tracked); legend (*"{N} works in {M} rooms, threaded by {P} facets"*).
- **Panel invocation.** Tap on the polestar; press `Home`; or via the strip's pin-icon (right side).
- **Cursor persistence within session (in P1) extends here.** Cursor sphere position survives refresh within session; pins survive the same.
- **Empty-state copy.** *"nothing held yet — long-press a star"* per design doc.
- **Trace gesture (held within P8).** The design doc commits to a *"continue with {next-title}"* trace prompt on overlay close when pins exist. This is named in the design but its implementation can be partial here (the prompt) or full (the auto-suggest sequence).
- **Reduced-motion equivalents.** Pin panel opens with 80 ms fade; pin/unpin happens instantly without animation.

### Exit condition

P8 is done when:

- PinRibbon renders on pinned stars in its chosen variant.
- Long-press triggers pin (mobile); equivalent gesture for keyboard exists.
- Pin state persists across page refresh within session.
- PolestarPanel opens on polestar tap or `Home` key.
- Panel shows pinned, recent, and legend sections.
- Empty-state copy renders correctly.
- Reduced-motion equivalents work.
- A Playwright test verifies the full pin / open-panel / unpin cycle.
- A Playwright test verifies session persistence.
- An axe test verifies panel accessibility (modal landmarks, focus management, dismissal).

### Architectural decisions within this phase

- **Pin storage.** `sessionStorage` only (cleared on tab close; design's "begin again" felt sense) vs. `localStorage` (cross-session; needs an explicit "clear pins" affordance). The design doc commits to session-only as the safer default; P8 honors but the decision can be revisited.
- **Pin ribbon visual variant.** V13.A–D from design doc. The author chooses.
- **Panel variant.** V11.A–D from design doc. The author chooses.
- **Long-press duration.** 350 ms is the design doc's default; on touch devices, 500 ms is more forgiving. Decide and document.
- **The keyboard pin shortcut.** A modifier-key + Enter (e.g., `p` while focused on a star)? Or only available via RadialEcho once P10 ships? The latter is more discoverable but blocks on P10.
- **Trace gesture scope.** First form: just the *"continue with {next-title}"* prompt on overlay close. Full form: a "trace" toggle in the panel that opens pinned works in sequence. Scope to the first form within P8; full form is a sub-phase or P11+.
- **What "recent" means.** Last 5 stars opened? Last 5 stars settled-on (basin claimed)? Last 5 stars focused (keyboard)? The design doc commits to *recently opened*; P8 implements that.

### Parallel tracks

P8 blocks on P4 (chrome substrate) and depends on P1's cursor persistence module (which P8 generalizes for pins). P8 can run alongside P6 and P7. P8 prepares ground for P10 (RadialEcho's pin action) and P11 (NewStarBloom's localStorage manifest).

### What stays held within P8

- Multi-select / comparison surfaces (Q8) — held by design.
- Constellation patterns (named clusters, Q10) — held.
- Cross-session pin persistence — held by default unless the decision flips above.

### Specs to reconcile

- `PRIVACY.md` (pin storage in localStorage if chosen; the privacy posture must accommodate).
- `INTERACTION_DESIGN.md` (long-press duration; panel open transitions).
- `BACKLOG.md` (pin held item graduates).
- `VOICE_AND_COPY.md` (pin panel copy patterns).

### Tests to land

- Playwright: long-press pin.
- Playwright: panel open from polestar tap.
- Playwright: panel open from `Home` key.
- Playwright: pin persistence across refresh.
- Playwright: empty-state copy.
- Playwright: reduced-motion equivalents.
- Vitest: persistence module in isolation.
- Vitest: pin state machine.
- Axe: panel accessibility.

---

## P9 — Time scrubber

*Status:* **pending**.
*Pull condition:* the corpus has accumulated enough history that *seeing the constellation as it was* becomes meaningful. With ~12 works, time-scrubbing reveals only a handful of difference-states; with ~50, the temporal trace becomes a real way to perceive how the corpus has grown.

### Scope

The visitor's temporal control. P9 ships:

- **TimeScrubber in HorizonStrip's center.** Dormant at rest (a faint horizontal line); revealed on hover (handle appears at "now"); draggable.
- **Time-scrubbed scene state.** When the handle is at a past date, stars added after that date dim toward invisibility; threads from those stars retract; the atmospheric color shifts subtly toward an earlier palette.
- **Continuous scrub.** Dragging the handle is per-frame; the constellation re-emphasizes live as the date moves.
- **Date indicator.** A small italic label appears: *"as of {date} — {n} works"* (per design doc copy patterns).
- **Pinned vs. live state.** Releasing the handle near "now" returns to live state; releasing it away from now keeps the past view active until the visitor explicitly clears or returns.
- **Composability with filter and search.** All three states compose. A visitor can view *consciousness + becoming as of 2025-06-01 matching "spanda"*. The constellation lenses through all three predicates.
- **URL state.** Time-scrubbed view is in the URL: `?at=2025-06-01`. Combined with filter/search.
- **Reduced-motion equivalent.** No live re-emphasis during drag; handle moves but stars don't dim until release. On release, instant fade rather than transition.
- **Keyboard time navigation.** When focus is on the handle, arrow keys step by week / month / year (with modifiers). Decide the granularity.

### Exit condition

P9 is done when:

- The scrubber is dormant at rest and revealed on hover.
- Dragging the handle re-emphasizes the constellation per-frame.
- Pinned non-now state persists until cleared.
- Date indicator shows the current scrub position.
- Atmospheric color shifts subtly with the date (the design's *atmosphere palette earlier-in-time* commitment).
- Composes with filter and search.
- URL state and reload restoration work.
- Reduced-motion equivalent works.
- Keyboard navigation is accessible.
- Playwright tests cover the above.
- Axe coverage of the scrubber.

### Architectural decisions within this phase

- **Scrubber form variant.** V9.A–D from design doc: linear timeline, logarithmic, calendar wheel, no-persistent-control. Linear is the default first form; the others are alternatives the author may pick.
- **Date range bounds.** The earliest-published work is the natural start; "now" is the natural end. Decide whether the bounds extend into the past (showing the *empty* state for dates before any works existed) or only span the corpus's lifetime.
- **Atmospheric color shift.** Subtle; the design doc names it but doesn't specify. Options: a per-decade palette (warm → warmer for earlier years); a continuous interpolation from "current palette" to "earlier palette"; no atmospheric shift, only star dimming. The author chooses.
- **Live re-emphasis cost.** Dragging the handle triggers per-frame star dimming changes. Verify against the long-task perf gate; if it pushes, debounce or animate via CSS variable rather than per-frame DOM mutation.
- **Pinned non-now state.** When the visitor pins a non-now view, does the URL change immediately, or only when they navigate away/share? The design doc names this as a held question; the author decides.

### Parallel tracks

P9 blocks on P5 (HorizonStrip skeleton) and P4 (chrome substrate). It can run alongside P6 (filter), P7 (search), P8 (pin). P9 has no downstream dependents within the plan.

### What stays held within P9

- Time-scrubbed view as a permalink to past constellation states (whether `?at=` URLs are first-class shareable or session-only) — held.
- The temporal manifest infrastructure (which P11 also depends on). Decide whether P9 lays this down or P11 does.

### Specs to reconcile

- `INFORMATION_ARCHITECTURE.md` (URL grammar for time state).
- `INTERACTION_DESIGN.md` (scrubber transitions).
- `BACKLOG.md` (time slider held item graduates).

### Tests to land

- Playwright: scrubber reveals on hover.
- Playwright: drag re-emphasizes per-frame.
- Playwright: date indicator updates.
- Playwright: composes with filter and search.
- Playwright: URL state.
- Playwright: reduced-motion fallback.
- Playwright: keyboard navigation.
- Vitest: time predicate logic.
- Axe: scrubber accessibility.

---

## P10 — Radial echo

*Status:* **pending**.
*Pull condition:* the lived experience of basin settle feeling complete-but-static. The visitor settles, the halo claims, the label appears — and there's nowhere to go from there *except open the work or move on*. The radial echo gives the visitor a small set of next moves that respect the basin's stillness.

### Scope

The contextual action surface around an active basin. P10 ships:

- **RadialEcho organism.** Appears around the cursor (not at a fixed corner) when the basin has been settled for ≥ 800 ms or on long-press of the active star.
- **Action set per star.** A small ring of 3–5 actions: open (already implicit via click), pin (P8 dependency), copy link (the star's `/sky/{room}/{slug}` URL), find related (broadens to a filter on shared facets), time-of-this-work (jumps the time-scrubber to the work's date — composes with P9).
- **Star-type-specific actions.** A Salon work with audio gets *"play referent"* (held until audio lands); a poem gets *"read aloud"* (held; speech synthesis); etc. The action set adapts to the star's nature.
- **Bloom motion.** The choices branch outward from the cursor center over ~200 ms (the design's *radial action bloom* visual cue).
- **Dismissal.** On any motion, on `Esc`, on activating an action, or on 1.5 s of no input.
- **Tab order.** When present, Tab cycles through actions after the active star itself in the natural focus order.
- **Reduced-motion equivalent.** The ring appears with an 80 ms fade rather than the bloom; actions are arrayed as a small list rather than a ring.
- **Keyboard equivalent.** When focus is on the active star, a key (e.g., `r` or the menu key) brings up the radial echo as a focused list.

### Exit condition

P10 is done when:

- The radial echo appears around the cursor on settle (≥ 800 ms) or long-press.
- The action set is per-star (different actions for different works' natures).
- The bloom motion is observable.
- Dismissal honors all four triggers.
- Tab and keyboard equivalents work.
- Reduced-motion equivalent is observable.
- Pin action (depending on P8) integrates correctly.
- Find-related action (broadening to filter; depending on P6) integrates correctly.
- Time-of-this-work action (depending on P9) integrates correctly.
- Playwright tests cover the action set, bloom, dismissal.
- Axe coverage of the radial echo's accessibility (focus management, dismissal patterns).

### Architectural decisions within this phase

- **Variant.** V10.A–D from design doc: ring of icons, dock, pulled-out hand (action-petals from the star itself), bottom-strip echo. The author chooses.
- **Where the radial echo mounts in the DOM.** Options: as a child of the active star's group (positioned with the star); as a sibling at viewport position computed from the cursor; in a portal at the document root. Each has different trade-offs around z-stack and event handling.
- **Action set discovery.** How the radial echo knows what actions to offer. Options: action set is a property of the work's data (each work declares its actions); a global registry keyed by work-type (Salon → audio, etc.); a context-derived set computed from the work's facets. Author decides.
- **Whether activating an action keeps focus on the radial echo or returns to the star.** Pin-and-stay vs. pin-and-dismiss. The design doc favors *invoke an action means dismiss the echo* (pin sets the ribbon, dismisses the radial); the visitor sees the world unchanged except for the new ribbon.
- **Long-press duration on touch.** P8's choice (350 ms vs. 500 ms) propagates here; or P10 makes its own choice.

### Parallel tracks

P10 blocks on P4 (chrome substrate). It depends on P1 (active basin's settle-time threshold), P8 (pin action), P6 (find-related broadens to filter), P9 (time-of-this-work). P10 prepares ground for P12 (contemplative state's drift target uses the gravitational center, which P10's "find related" might surface).

### What stays held within P10

- Audio-related actions (held until audio lands).
- "Read aloud" speech-synthesis action (held until accessibility-as-feature is named).
- Multi-select actions ("pin all related") — held; not in P10.

### Specs to reconcile

- `INTERACTION_DESIGN.md` (radial bloom motion).
- `VOICE_AND_COPY.md` (action labels in second voice).
- `INFORMATION_ARCHITECTURE.md` (the action set's relationship to URL state — copy-link, find-related, time-of-this-work all change URL or filter state).

### Tests to land

- Playwright: settle-time triggered radial.
- Playwright: long-press triggered radial.
- Playwright: action set adapts to star type.
- Playwright: dismissal triggers (motion, Esc, action, timeout).
- Playwright: keyboard equivalent.
- Playwright: reduced-motion equivalent.
- Axe: radial accessibility (focus management, ARIA roles).

---

## P10.5 — Thread traversal as navigation

*Status:* **pending**.
*Pull condition:* the lived experience of threads feeling decorative-rather-than-navigable. The visitor settles on a star, sees its threads, and has no way to *follow* them — they have to drag/key to the connected star, treating the thread as visual sugar rather than as a path. The design's F7 flow commits to threads as travel paths; the audit named this absent.

### Scope

The committed F7 flow from `CONSTELLATION_DESIGN.md`. P10.5 ships:

- **Thread focus.** When the cursor is settled in a basin, the threads from that basin's star are focusable via keyboard (Tab order: star, then radial echo actions, then connected threads in some stable order — by facet, by date, by alphabet of the connected star's title).
- **Thread activation.** Pressing Enter on a focused thread, or — held question — long-pressing on a thread visually, triggers traversal: the cursor begins moving along the thread to the other endpoint over ~1200 ms with the design's signature easing (`cubic-bezier(0.23, 1, 0.32, 1)`).
- **Travel motion.** The cursor follows the *great-circle* arc between the two stars on the sphere's surface (the geometry is already in place from Pass 2). The thread itself brightens and may show a small bright bead moving along it for visual continuity (the design doc's *traveling-along* state).
- **Camera follows.** The orbital camera (P-Pass-2-D2) lags as it always does; for thread-traversal, the camera's catch-up rate may need a temporary boost so the visitor doesn't lose the destination behind the lag.
- **Active basin transitions.** On arrival at the other endpoint, the cursor settles; the basin claims; the new star's threads bloom; the cycle is repeatable (the visitor can immediately Tab to a new thread and traverse again).
- **Bidirectional.** A thread between A and B can be traversed A→B (when settled at A) or B→A (when settled at B). The thread is a relationship, not a directed edge.
- **Reduced-motion equivalent.** No travel animation; cursor snaps to the other endpoint; the thread brightens momentarily; basin claims at the new star.
- **Mobile gesture (held question).** Whether tapping a thread on mobile triggers traversal, or whether mobile traversal is keyboard-only via on-screen keyboard. Decide.

### Exit condition

P10.5 is done when:

- Tab from a settled-basin star reaches connected threads in a stable order.
- Enter on a focused thread initiates traversal.
- The cursor follows the great-circle arc; visible motion lasts ~1200 ms.
- The thread visibly brightens during traversal (a moving bead, or a brightening pulse).
- The camera's lag is compensated so the destination doesn't disappear.
- Arrival settles cleanly; basin claims; threads bloom from the new endpoint.
- Bidirectional traversal works.
- Reduced-motion equivalent works.
- Mobile gesture (whatever the decision) works.
- Playwright tests cover the flow.
- Axe coverage: thread focusability with screen-reader announcements (per design's *threads as decorative in assistive output* commitment, the announcement names the destination, not the thread itself: *"travel to {target-title}"*).

### Architectural decisions within this phase

- **Thread Tab order.** Multiple threads from one star; what order? Options:
  - By facet (alphabetically by facet name — *body* threads before *consciousness* threads).
  - By target's date (most-recent target first).
  - By target's title (alphabetical).
  - By spatial order on screen (leftmost to rightmost from current viewport perspective).
  - The design doc doesn't specify; the author chooses.
- **Thread activation gesture on touch.** A direct tap on a thread (technically possible if the thread's hit-target is wide enough); a long-press on a thread; a thread-traversal action *in the radial echo* (P10) replacing direct gesture; or no touch traversal (keyboard-only on mobile).
- **Visual cue during traversal.** A bright bead moving along the thread (most explicit); the entire thread brightening uniformly (subtler); the source-end fading and target-end brightening as the cursor approaches (most "the thread is being walked"). Author chooses.
- **Camera lag during traversal.** Override `CAMERA_LAG_RATE` to a higher value temporarily so the camera tracks more closely; or let lag continue and accept that the visitor may see the destination drift in. The first feels more controlled; the second is more honest to the lag-as-felt-physics commitment.
- **Concurrent-thread blocking.** If the visitor presses Enter on a thread while another traversal is active, what happens? Cancel the in-flight; queue the new one; ignore until current completes. The cleanest answer is *cancel and start the new* — visitor's most-recent input wins.

### Parallel tracks

P10.5 strictly depends on P0 (geometry helpers; specifically `tangentTowards` and `slerp` which are already in place from Pass 2). It loosely depends on P10 (RadialEcho) for an alternate activation surface; if mobile traversal goes via radial-echo only, P10.5 actually blocks on P10. P10.5 can run alongside P11, P12.

### What stays held within P10.5

- Multi-step thread traversal (visitor follows several threads in sequence to reach a far star). Held — it emerges naturally from repeated traversals; no special tooling needed.
- "Find related" via thread-traversal as filter affordance — that's P6's *find-related* concept, distinct.
- Audio cue during thread-traversal (a slow rising tone matching the journey's duration) — held until audio lands.

### Specs to reconcile

- `INTERACTION_DESIGN.md` (the great-circle traversal motion register).
- `INFORMATION_ARCHITECTURE.md` (does thread-traversal change URL? Probably no — the URL only changes on `WorkOpen`.)
- `CONSTELLATION_DESIGN.md` F7 flow committed-form refines based on chosen variants.

### Tests to land

- Playwright: Tab from settled star reaches threads in stable order.
- Playwright: Enter activates traversal.
- Playwright: cursor arrives at correct endpoint.
- Playwright: bidirectional traversal works.
- Playwright: reduced-motion fallback.
- Playwright: cancel-and-replace concurrent traversal.
- Vitest: traversal logic in the navigation hook.
- Axe: thread focus with screen-reader announcement.

---

## P11 — NewStarBloom and the living-document layer

*Status:* **pending**.
*Pull condition:* a moment in the corpus's life when *new works arriving since last visit* becomes a noticeable pattern. With infrequent updates, the bloom is rare; with regular updates, the bloom rewards return visits with a felt sense of *"more sky."*

### Scope

The constellation's relationship-with-visitors-over-time, made visible. P11 ships:

- **localStorage manifest of perceived-mtime.** The highest published-date of any work the visitor has seen on /sky. Updated when the visitor opens a star or completes a session of /sky interaction.
- **NewStarBloom on first arrival of a session with newer works.** Stars whose published-date is later than the manifest's perceived-mtime twinkle at heightened amplitude for ~10 s, then settle to baseline. After the bloom completes, the manifest updates.
- **Polestar panel new-count indicator.** When the visitor opens the PolestarPanel (P8), if there are stars newer than the manifest, a small italic line shows: *"{n} new in the constellation"* (per design doc's copy pattern). The panel doesn't otherwise notify; the bloom is the primary signal.
- **First-visit handling.** A first-time visitor (no manifest) doesn't get a NewStarBloom — every star is "new" to them, but the bloom would feel like noise. The manifest is laid down on session completion; first NewStarBloom arrives on the second session if the corpus has grown.
- **Reduced-motion equivalent.** The bloom is replaced by a static slight halo emphasis on new stars (no twinkle); the polestar panel's *"{n} new"* line is the primary signal.
- **Privacy.** All manifest data is per-device, in `localStorage`, never transmitted. Honors `PRIVACY.md`'s commitment.

### Exit condition

P11 is done when:

- A returning visitor with new works since their last session sees NewStarBloom for ~10 s.
- The polestar panel shows the *"{n} new"* line when applicable.
- After the bloom, the manifest updates.
- A first-time visitor sees no bloom; their manifest is laid down on session-end.
- Reduced-motion equivalent works.
- A Playwright test mocks localStorage states (no manifest; old manifest with new corpus; current manifest) and verifies the right behavior in each.

### Architectural decisions within this phase

- **Manifest schema.** Options: just `perceivedMtime: ISODate`; a richer object with reading history; counts of opens per star. The simplest answer is the highest-perceived-mtime alone; the privacy commitment favors minimum.
- **When the manifest updates.** On every star open? On every basin claim? On session-end (visibility-change)? On Demonstration completion? The design doc names *"after the bloom completes"*; the author may extend.
- **What counts as "new."** Stars with `published-date > manifest.perceivedMtime`. But work content can be edited; do edits count as new? The design's first form: only newly *added* works (their first publication date). Edited works stay at their original mtime.
- **The bloom's specific form.** Per design doc's V14.A–D: heightened twinkle (current proposal); soft pulse; comet trail; no special treatment. Author chooses.
- **First-arrival detection.** "First arrival of a session" means: page-load on /sky with a localStorage manifest that's older than the corpus's max published-date. Verify the detection runs once per session, not per re-render.

### Parallel tracks

P11 depends on P8's persistence module foundations (the manifest is a localStorage extension of the same kind of storage). P11 blocks on no other phase. P11 can run alongside P12 (contemplative state).

### What stays held within P11

- Reading history exposed back to the visitor — held by epistemic-posture commitment.
- Cross-device manifest synchronization — held; would require server runtime.
- "You haven't visited in N days" microcopy — held by quiet-chrome principle.

### Specs to reconcile

- `PRIVACY.md` (the manifest commitment in localStorage; privacy honored).
- `INTERACTION_DESIGN.md` (bloom motion register).
- `BACKLOG.md` (NewStarBloom held item graduates).

### Tests to land

- Playwright: first-time visitor (empty localStorage) sees no bloom.
- Playwright: returning visitor with old manifest sees bloom.
- Playwright: returning visitor with current manifest sees no bloom.
- Playwright: manifest updates after bloom completes.
- Playwright: polestar panel shows new-count line.
- Playwright: reduced-motion equivalent.
- Vitest: manifest module in isolation.

---

## P12 — Contemplative state

*Status:* **pending**.
*Pull condition:* the lived experience of /sky feeling static when nobody is interacting. The world has a heartbeat (slow rotation), but no other gesture. A visitor who sits and watches sees the rotation and nothing else. The contemplative state gives the world a gentler rhythm — *the constellation living without you.*

### Scope

The autonomous behaviors that emerge during prolonged inactivity. P12 ships:

- **Long-idle detection.** ~80 s of no input (no pointer move, no key press, no touch) on /sky transitions the surface to `Contemplative` state.
- **Atmosphere dimming.** The atmosphere pool dims by ~50%; the strip recedes to ~15% opacity (low-visibility-contemplative state from P5); the cursor's pulse softens and slows. The world is *quieter*.
- **Cursor's contemplative drift.** After another ~60 s of continued idle (~140 s total), the cursor begins a slow autonomous drift toward the *gravitational center* of the constellation (the star with the most threads — the Cathedral, in the design's metaphor). The drift takes ~10 s; the cursor settles there for ~5 s; the basin claims softly; the label appears at low opacity.
- **Return to polestar.** After the contemplative drift's settle, the cursor drifts back to the polestar (~10 s), and the cycle may repeat.
- **Interruption.** Any visitor input (pointer, key, touch) immediately returns the surface to `Idle` state. The contemplative state is gentle; the visitor's return is welcomed without ceremony.
- **Reduced-motion equivalent.** No drift; the surface still dims after long idle, but the cursor stays at its last position. The dimming itself is an instant fade.
- **Visibility detection.** When the tab is in the background (Page Visibility API), the contemplative cycle pauses (no point doing autonomous motion the visitor can't see). On foregrounding, idle timer resumes from where it was.

### Exit condition

P12 is done when:

- The contemplative state is observable after ~80 s of no input.
- Atmosphere dimming, cursor pulse softening, strip recession all happen.
- The contemplative drift toward gravitational center begins after additional ~60 s of idle.
- The cursor returns to polestar after the drift's settle.
- Any input returns to Idle.
- Tab visibility pauses and resumes the cycle.
- Reduced-motion equivalent works.
- Playwright tests cover the timing transitions (with mocked timers to avoid 80-s test runs).
- The performance impact of long-idle drift is verified against the long-task gate.

### Architectural decisions within this phase

- **Idle detection mechanism.** Options: a single `setTimeout` reset on each input event; an `IdleDetector` Web API (limited browser support); a custom hook that listens to multiple input events. The first option is sufficient.
- **Drift target choice.** "Gravitational center" needs a definition: the star with the most thread connections; the most-recently-read star; a deterministic-but-rotating choice; the polestar (no drift away). The design doc names *most-connected* as the primary; alternates can be variants.
- **Whether the drift's basin-claim updates `setActiveKey`.** It probably should, so threads bloom and the lived feeling is *the world is paying attention to that star*. But the visitor returning sees the active state and may misread it as their own. Decide.
- **Visibility-pause's resume behavior.** On foregrounding, does the cycle resume from where it paused, or restart from `Idle`? The design's commitment to *the world living without you* favors *resume from where it was*.
- **Background-tab energy use.** Even with visibility-pause, the slow rotation continues. Verify the rotation alone doesn't cost battery; if it does, pause the rotation too on visibility hidden.

### Parallel tracks

P12 has no strict blockers among the chrome surfaces but benefits from:

- P10 (RadialEcho) — the gravitational-center calculation could surface through a "find related" affordance, though not strictly needed.
- P5 (HorizonStrip) — the `low-visibility-contemplative` strip state lives here, designed in P5.

P12 can run alongside any phase after P5.

### What stays held within P12

- The contemplative state having any side-effect on the localStorage manifest (P11) — held; idle is not engagement.
- Audio dimming during contemplative state — held until audio lands.
- Per-visitor contemplative-state preferences — held; this is the world's behavior, not the visitor's.

### Specs to reconcile

- `INTERACTION_DESIGN.md` (the contemplative drift's motion vocabulary).
- `CONSTELLATION.md` (the world's autonomous behavior named).
- `BACKLOG.md` (contemplative state held item graduates).

### Tests to land

- Playwright with mocked timers: contemplative state after 80 s idle.
- Playwright: drift to gravitational center after 140 s.
- Playwright: cursor returns to polestar.
- Playwright: any input returns to Idle.
- Playwright: visibility-pause behavior.
- Playwright: reduced-motion equivalent.
- Performance: long-task gate during contemplative drift.

---

## P12.5 — Daystar's ascent

*Status:* **pending**.
*Pull condition:* the moment the daystar feels like a fixed corner UI element rather than a sun in the sky. Currently the daystar (sun/moon SVG, also the theme toggle) sits at `cy=240` regardless of camera state. The design holds that the daystar should *ascend* into the orbiting frame, becoming part of the sky rather than chrome over it.

### Scope

The held vision of the daystar becoming concrete. P12.5 ships:

- **Daystar in the camera frame.** The daystar moves from its fixed `cy=240` position into the camera-rotates layer, so it inherits the constellation's slow rotation and orbital camera motion. It is now *in* the sky, not *over* it.
- **Daystar as theme toggle.** The daystar remains interactive — clicking it (or pressing a keyboard equivalent) toggles theme. The current `ThemeToggle` in site nav may retire on /sky (per P5's decision) or stay as a fallback.
- **Daystar's hue and form per theme.** Light theme: a warm sun at high opacity. Dark theme: a cool moon at high opacity. Both ride the camera. The geometric form of each (sun has rays; moon has crescent or full circle with subtle craters) is the design's signature ornament.
- **Daystar's morph during theme transition.** The 500 ms theme crossfade includes the daystar morphing — sun rotates and fades into moon (or vice versa). The morph is *single-element* (View Transitions API or a careful CSS animation) so the daystar feels like *one body changing register*, not two icons crossfading.
- **Daystar's relationship to the polestar.** Both are still references in the constellation. The daystar moves with the camera; the polestar is fixed at world center. The visitor sees: a still center (polestar) and an orbiting hour-marker (daystar). The metaphor strengthens.
- **Reduced-motion equivalent.** The daystar's morph is an 80 ms fade; its position-in-the-rotates-layer is preserved (the rotation continues per its own commitments); no theme-transition animation beyond fade.

### Exit condition

P12.5 is done when:

- The daystar renders inside the camera/rotates layer; its position shifts subtly with camera orbit and slow rotation.
- Clicking the daystar toggles theme.
- Theme transition shows a daystar morph (sun↔moon).
- The morph is single-element-feel.
- Light/dark hue and form are correct per theme.
- Reduced-motion equivalent works.
- Site nav's theme toggle behavior is consistent with P5's decision.
- Playwright tests cover the daystar's interactivity and the morph.
- An axe test verifies the daystar's accessibility (it's a button; aria-label states the current theme; focus ring visible).

### Architectural decisions within this phase

- **Where in the camera tree the daystar mounts.** Inside `constellation-camera` (orbits with the camera, rotates with the camera) vs. inside `constellation-rotates` (rotates only with the slow background rotation, doesn't orbit). The design favors inside-the-camera; the rotation-only option is a fallback if camera-orbiting reads too disorienting.
- **The single-element morph technique.** View Transitions API named morph (cleanest); a single SVG with both sun and moon paths and per-state visibility (no morph but no crossfade either); a CSS animation interpolating between two SVGs (most fragile). View Transitions is the right answer.
- **Click target size.** The daystar's visible body is small (~30 px diameter); the design's accessibility commitment requires ≥ 44 px hit target. An invisible hit-circle expands the click area without changing the visual.
- **Whether site nav's theme toggle hides on /sky.** P5 decided this; P12.5 verifies the consequence. If site nav's toggle stayed (P5 chose the second option in its decision), it now duplicates daystar functionality — decide whether to hide or to keep both.
- **The daystar's rotation behavior.** Does it always face the visitor (always upright on screen), rotate with the world (so a 600s rotation cycle includes the daystar appearing to "rise and set")? The latter is more poetic; the former is more chrome-like. Author chooses.

### Parallel tracks

P12.5 has soft dependencies on P5 (which decided theme-toggle location) and P3.5 (which addresses ornamental vocabulary; daystar is part of that). It can run alongside any phase after those.

### What stays held within P12.5

- Daystar audio (a soft chime on theme toggle) — held until audio lands.
- Multi-daystar (additional celestial bodies — Venus, Sirius — for additional theme moods) — held; the design has not committed to multiple daystars.
- Daystar as a navigation surface (clicking the daystar opens a panel; double-click resets the theme to system preference) — held; the daystar is a toggle and a celestial body, not a control surface.

### Specs to reconcile

- `INTERACTION_DESIGN.md` (the daystar's morph; theme transition specifics).
- `CONSTELLATION.md` (the daystar's role in the held vision now concrete).
- `DESIGN_SYSTEM.md` (sun and moon SVG details if they evolve).

### Tests to land

- Playwright: daystar click toggles theme.
- Playwright: theme transition shows morph.
- Playwright: daystar position respects camera and rotation.
- Playwright: reduced-motion equivalent.
- Axe: daystar accessibility.

---

## P12.6 — `/sky` and `/facet/{facet}` reconciliation

*Status:* **pending**.
*Pull condition:* the moment a visitor confused by encountering the same facet (e.g., *consciousness*) in two different surfaces — once as a chip in /sky's HorizonStrip, once as a route at `/facet/consciousness` — surfaces the question of *what is the relationship between these two filter-affordances?* The audit named the gap; the design doc doesn't fully reconcile.

### Scope

The architectural and experiential reconciliation of /sky's filter and the existing facet-pages. P12.6 ships:

- **A clear relationship articulated.** Three options:
  - `/facet/{facet}` retires; /sky's filter is the only facet-by-facet affordance. The facet-page route becomes a redirect to `/sky?facets={facet}`.
  - `/facet/{facet}` and /sky's filter coexist; each serves a different reading register. Facet pages are *list-based, curated* surfaces; /sky's filter is *spatial, exploratory*. Both exist; both are linked.
  - `/facet/{facet}` is a *deep-link into a filtered /sky*. The facet-page URL renders /sky with that filter active and (perhaps) the camera positioned to show the matched cluster.
  - The author chooses; the rationale is the phase's most important commit.
- **Cross-linking.** Wherever a facet-name appears (a star's chip in WorkOverlay; a search result's metadata), tapping it goes to *the chosen target* per the option above.
- **URL stability.** Whatever option is chosen, no existing URL breaks. `/facet/consciousness` continues to resolve (via redirect or render).
- **The facet-page's existing list view.** If facet pages stay (option 2), they continue rendering the existing list of works. If they retire (option 1), the list view either retires entirely or is preserved as part of the SEO surface (the static page for crawlers; visitors land on /sky via redirect).
- **Reduced-motion / no-JS resilience.** Facet pages must continue to work without JavaScript (per the no-JS commitment in `RENDERING_STRATEGY.md`). Whatever option is chosen, the no-JS visitor reaches the works.

### Exit condition

P12.6 is done when:

- The chosen relationship is visible: visitors clicking a facet-name everywhere on the site reach the same destination.
- No existing URL breaks.
- The facet-page route is either a coherent surface (option 2) or a redirect (option 1) or a deep-link target (option 3).
- No-JS visitors continue to reach works via facet pages.
- Test coverage verifies the round-trip from a star's chip to the facet's destination and back.
- The decision is documented in `INFORMATION_ARCHITECTURE.md`.

### Architectural decisions within this phase

- **The relationship choice itself.** Three options as above; this is the phase's load-bearing decision.
- **SEO consequences.** Each option has different SEO surface. Option 1 (retire) loses dedicated indexable facet pages; option 2 (coexist) keeps them; option 3 (deep-link) keeps the URL but the rendered content depends on JS. Decide the SEO trade-off knowingly.
- **Visitor-mental-model consequences.** Option 1 is simplest (one place per concern). Option 2 is most flexible (different reading registers) but risks confusion. Option 3 is unifying but requires the visitor to understand the relationship.
- **Whether the existing FacetChip atom unifies.** The audit named this as drift (`FacetChip` atom serves display use; in-/sky use is filter use). Reconciling here may include the atom's promotion to a molecule, or splitting into two atoms, or adding a `mode` prop. P12.6's scope includes the atomic-design migration if it's necessary for the chosen option.

### Parallel tracks

P12.6 depends on P6 (the in-/sky filter) shipping. It can run alongside other late phases (P12, P12.5).

### What stays held within P12.6

- Facet-pair URLs (`/facet/consciousness%2Cbecoming`) — currently exist; their fate depends on the chosen option. Held question.
- Composite filter pages (e.g., `/facet/consciousness+/garden`) — held; not committed.

### Specs to reconcile

- `INFORMATION_ARCHITECTURE.md` (the URL grammar and route resolution).
- `SEO_AND_META.md` (the SEO consequences of the chosen option).

### Tests to land

- Playwright: facet-name clicks everywhere reach the chosen destination.
- Playwright: existing `/facet/{facet}` URLs continue to work.
- Playwright: no-JS resilience.
- Vitest: route logic.

---

## P12.7 — High node-count strategy

*Status:* **pending**.
*Pull condition:* the corpus crosses ~50 stars and the constellation visibly *crowds*. The design names ~50 as the threshold where strategies must be chosen; below that, the world feels right at moderate density; above, individual stars start competing for attention.

### Scope

The strategies for keeping the constellation legible as it grows. P12.7 ships *one of* the following — the choice is itself the phase's main decision:

- **Strategy A: smaller stars, denser packing.** Star halo size shrinks proportionally; minimum visual separation tightens; threads at default opacity drop further (~15%). The constellation accepts more stars by making each star quieter. Risk: stars become diagnostic-marks rather than presences.
- **Strategy B: constellation patterns / named asterisms (Q10).** Stars are grouped editorially into named clusters (the *Cathedral*, the *Ground*, etc.). Patterns visible as faint background washes; pattern names appear on hover or in a chrome surface. The visitor learns to recognize patterns; navigation works at both star-level and pattern-level. Risk: requires Danny's editorial naming, which is upstream.
- **Strategy C: camera zoom on focus.** When the visitor focuses on a region (active basin or a cluster), the camera zooms in; surrounding stars compress. The whole constellation is still there; but the visitor's attention is enlarged. Risk: introduces a new gesture-vocabulary moment (zoom is a fourth thing the camera does).
- **Some combination.** The strategies aren't mutually exclusive; P12.7 may ship Strategy A as the baseline and reserve B + C as later refinements.

Whichever option(s), P12.7 also ships:

- **Density verification.** Tests that verify the constellation respects the design's density commitments (minimum separation, breathing room around polestar) at high node counts.
- **Performance verification at N=100, 200, 500.** The Playwright perf gate runs against synthetic high-node-count fixtures to verify per-frame work stays within budget.
- **Reduced-motion equivalent.** Strategy-specific. Strategy A: smaller stars, no animation cost. Strategy B: pattern-washes static rather than gently shifting. Strategy C: zoom is instant rather than smoothed.

### Exit condition

P12.7 is done when:

- The chosen strategy (or combination) is implemented and observable on the live constellation.
- The constellation at ~100 stars feels legible (visitor review; aesthetic-touchstone check).
- Density commitments are verified at ≥ 50, 100, 200 nodes via test fixtures.
- Performance at high node-count is within the long-task gate.
- The strategy's reduced-motion equivalent works.
- The audit's *high node-count* row updates from absent to present.

### Architectural decisions within this phase

- **The strategy choice.** Three options + combinations. Author decides; rationale documented.
- **Naming convention for patterns (if Strategy B).** Editorial decision (Q10's *constellation patterns* held question). Likely upstream of P12.7's implementation; Danny names patterns; P12.7 implements the visual representation.
- **Zoom mechanic (if Strategy C).** The mechanic for zoom: pinch (touch); scroll (mouse, but conflicts with overscroll-up arrival); double-tap (less precise); a chrome control. Author decides.
- **Star-size scaling formula (if Strategy A).** A simple inverse-proportionality (more stars = smaller stars), or a logarithmic decay (size shrinks slowly at first, faster at higher counts), or a step function (size A below 50, size B 50–100, etc.). Author decides.
- **Whether high-node-count behavior is automatic or manual.** Automatic: above N stars, Strategy A kicks in by itself. Manual: visitor toggles a chrome control to reveal patterns or shrink stars. The design favors *automatic and felt* over *manual and instructed*.

### Parallel tracks

P12.7 has no strict blockers — it can ship at any time. Its *pull* is corpus-driven; until ~50 stars exist, the phase has no real work to honor. Can run alongside P11, P12, P12.5, P12.6.

### What stays held within P12.7

- Constellation pattern *naming* (Q10) — held; that's editorial.
- Per-cluster atmosphere wash (each named pattern gets its own color tone) — held; first form is uniform atmosphere.
- Pattern-level navigation as a separate chrome surface — held; first form integrates patterns into existing navigation rather than adding new chrome.

### Specs to reconcile

- `CONSTELLATION_DESIGN.md` (Density and Pacing section refines based on chosen strategy).
- `INTERACTION_DESIGN.md` (zoom mechanic if Strategy C is chosen).
- `BACKLOG.md` (the named asterisms held item refines).

### Tests to land

- Playwright: constellation rendering at 50, 100, 200 nodes (synthetic fixtures).
- Playwright: density commitments observable at each count.
- Performance: long-task gate at high node count.
- Vitest: strategy-specific logic.
- Manual: aesthetic touchstone review at high node count.

---

## P13 — Spec full reconciliation

*Status:* **pending**.
*Pull condition:* enough surfaces have shipped (P5 onwards) that the constellation specs can be honestly updated from "describing held vision" to "describing shipped reality." P13 is the catch-up phase that brings every related spec into alignment with the implementation.

### Scope

Comprehensive reconciliation across all constellation-related specs:

- **`CONSTELLATION.md`.** Update from "first-form ceiling shipped, atmospheric layer held" to a more current state. Describe Pass 2's world layer, the chrome that has shipped (subset of P5–P10), the held items in their current shape. Preserve the document's voice (site-speaking-to-itself); update the tense.
- **`CONSTELLATION_HORIZON.md`.** Update from "ten-phase migration path from current state to finished surface" with all phases held to the post-shipping state. Mark each phase's status; describe what shipped in what shape; note any deviations from the original plan.
- **`CONSTELLATION_DESIGN.md`.** The variant decisions made during P5–P10 close those questions. The closed alternatives retire from the variant lists. The doc's *Open Design Questions* section shrinks accordingly.
- **`CONSTELLATION_IMPLEMENTATION_AUDIT.md`.** Status markers update across the board: `absent` → `present` for the surfaces that shipped, with notes on which phase shipped each. The audit becomes mostly *what's still pending* rather than *the full inventory*.
- **`CONSTELLATION_IMPLEMENTATION_PLAN.md`.** This document. Phases that have shipped get marked `shipped`; their architectural-decision-section moves to past tense; new pulls that arose during implementation get inserted as new phases.
- **`INFORMATION_ARCHITECTURE.md`.** The chrome's URL grammar (filter, search, time, work-overlay states) is documented authoritatively.
- **`INTERACTION_DESIGN.md`.** The motion register from `CONSTELLATION_DESIGN.md` propagates here. The named cues (halo claim, radial action bloom, strip thickening, atmosphere dimming, overlay veil) are in the canonical motion vocabulary.
- **`DESIGN_SYSTEM.md`.** The named tokens (paper umber, horizon warmth, etc.) live here as canonical token definitions. `CONSTELLATION_DESIGN.md` references rather than defines.
- **`BACKLOG.md`.** Items graduated to shipped phases retire from the backlog. Items still held remain with their trigger conditions intact.
- **`VOICE_AND_COPY.md`.** The constellation's copy patterns unify with the site-wide voice doc. Conflicts (if any) are resolved.
- **`SPECIFICATION_MAP.md`.** Every constellation-related document's status is current. New documents are mapped.

### Exit condition

P13 is done when:

- Every spec listed above accurately describes the shipped state of /sky.
- No spec describes a held vision as if it were shipped, or a shipped state as if it were held.
- The audit document accurately reflects the post-implementation gap.
- The plan document's status markers are current.
- A "specs in drift" check (manual review or scripted) finds no remaining drift.
- A test or script confirms wikilinks across the constellation specs all resolve.

### Architectural decisions within this phase

P13 makes few architectural decisions; it documents decisions made earlier. The major decisions:

- **The voice in updated `CONSTELLATION.md`.** The site speaks for itself; the new state is described with the same voice the original used. Avoid the temptation to flatten the voice into engineer-spec.
- **Whether `CONSTELLATION_HORIZON.md` is retired.** Once all of its phases have shipped (or been retired), the document may have served its purpose. Decide: archive it (preserve in git history; retire from active spec map) or keep it as historical record. The site's *temporal archaeology* commitment favors keeping; the *minimal active spec set* favors archival.
- **How held items are described.** Held items (Q8 multi-select, Q9 audio, Q10 patterns, lower hemisphere) need updated commitment-language. They were held in design; have they remained held, or have new pulls emerged that move them to "active held vision"?

### Parallel tracks

P13 cannot run alongside the visible phases that obligate spec updates — it depends on them. P13 can run alongside P14 (held register documentation) since both are doc-only.

### What stays held within P13

- Writing entirely new specs for surfaces not yet shipped.
- Removing any spec the site is committed to keeping (per `TRANSPARENCY.md`'s archaeological commitment).

### Specs to reconcile

P13 *is* the spec reconciliation. Its scope is the spec-system itself.

### Tests to land

- A wikilink-resolution check across all constellation specs (extended `scripts/check-spec-wikilinks.mjs` if needed).
- Markdown linting clean.
- Spell check clean.
- No broken cross-references.

---

## P14 — Held but visible (no implementation; doc-only)

*Status:* **held-by-design**.
*Pull condition:* not expected to begin. P14 is a register, not a phase to execute.

### Scope

P14 names the design's held items in a register that subsequent agents can find. The register includes:

- **Audio considerations.** When a Salon work requires audio, the audio surface lands. Until then, P14 holds the design's named coordinates: ambient drone, basin-settle pitch, drag noise, work-overlay hush. No implementation.
- **Multi-visitor presence.** Could two visitors share a constellation in real time? Held. Not expected within Pass 2's commitments. Documented to ensure future proposals know the held state.
- **Constellation patterns.** Editorially-named clusters (the Cathedral; the Ground; the Body of Water). Held until Danny names a pattern.
- **The lower hemisphere.** Currently empty in the data layer. Held for: (a) audio-bearing works that want a different metaphorical neighborhood; (b) older works archived to the underworld; (c) intentionally empty as a felt-sense "the world has a back you don't visit."
- **Multi-select / comparison surface.** Held; no use case has emerged.
- **Voice / gaze input.** Held until interaction technology and visitor expectations are ready.
- **The constellation in print.** A static print rendering for a folio. Held; the editorial moment to capture has not occurred.
- **Cross-device session sync.** Held; would require server runtime which the deploy refuses.

### Exit condition

P14 has no exit condition. It is a register that updates as held items either move to active phases (becoming P-something) or remain held.

### Architectural decisions within this phase

None. P14 makes no decisions; it preserves the design's held register.

### Parallel tracks

P14 is documentation-only and does not interact with implementation tracks. It can update at any time when held items shift status (from held to active, or from active to held).

### What stays held within P14

By definition, everything in P14's scope stays held. The phase's job is to keep the held register legible.

### Specs to reconcile

- `BACKLOG.md` (held items in P14's register should be present in BACKLOG with trigger conditions).
- `CONSTELLATION.md`'s held-questions section (cross-referenced).

### Tests to land

None. P14 has no implementation.

---

## P15 — Beyond the plan

*Status:* **held-by-design**.
*Pull condition:* not expected. P15 names what is *outside the plan's reach* — futures the current plan does not even gesture at.

### Scope

P15 is the explicit horizon of *the plan does not know what comes next.* It names:

- **The next plan.** When P0–P13 have shipped, the next plan addresses what the audit at that future time names. The plan is honest about its own time-bounded scope.
- **A second medium.** The constellation could one day extend to other media (gallery installation; printed atlas; spoken word archive). P15 does not plan these; it names them as outside.
- **Visitor authorship.** Could the constellation eventually let visitors leave marks? Quiet annotations? Held; not in P15's scope to plan.
- **Cross-corpus constellations.** Could /sky federate with other authorial sites? Held; the design's *intimate place* commitment refuses this for now, but a future shift could revisit.
- **AI co-authorship surfaces.** Could the agentic surface that built /sky (this plan was authored alongside Claude Code) become a visible thread the visitor can pull on? Held; the *transparency* commitment names the strata, but visible-strata-as-feature is not planned.
- **The end of the plan.** When the plan completes (every active phase shipped, held register intact), the plan retires. Its replacement is whatever the next pull asks for.

### Exit condition

P15 has no exit condition. It is the horizon.

### Architectural decisions within this phase

None. P15 names futures that the current plan refuses to anticipate.

### Parallel tracks

P15 does not run; it is named.

### What stays held within P15

Everything. P15's job is to acknowledge that the plan is bounded, that the future exceeds the plan, and that this is correct.

### Specs to reconcile

None. P15 is acknowledgment, not commitment.

### Tests to land

None.

---

## Cross-cutting concerns

Concerns that span every phase and must be honored at each. A phase's exit condition implicitly includes these.

### Accessibility discipline

Every phase ships with its accessibility commitments — not "accessibility added later." Specifically:

- **Keyboard parity.** Every gesture available via touch or pointer is available via keyboard. No keyboard-impossible features.
- **Screen-reader announcements.** Every state change observable to sighted visitors is announceable to screen-reader visitors via aria-live regions, aria-labels, or semantic landmarks.
- **Focus management.** Focus rings visible at AA contrast against any sky background. Focus returns to its origin after dismissal of any chrome surface.
- **Reduced-motion equivalents.** Each visible phase ships its reduced-motion equivalent in the same commit. The constellation must remain navigable, comprehensible, and beautiful to a reduced-motion visitor.
- **Reduced-data equivalents.** Each phase that adds runtime work must verify it respects `Save-Data` / `prefers-reduced-data`. WebGL content does not initialize when reduced-data is signaled.
- **Touch targets.** All interactive elements ≥ 24 × 24 px (some phases require 44 × 44 px per WCAG AAA). Invisible hit-areas are acceptable.
- **Color-only meaning is forbidden.** Active states must be perceivable without color (shape, halo, scale, label).
- **Axe coverage.** Every phase that adds a visible component runs an axe assertion against it. Zero violations is the bar.

The discipline is not a checklist applied to every phase; it is the foundation that every phase already lives within. A phase that violates it is incomplete by definition.

### Performance budget

Every phase that adds runtime work must respect the existing performance gates:

- **Bundle ceiling.** All-pages JS at ≤ 215 KB gzipped (current floor; may rise with Pass 2 additions if justified). Each phase verifies its bundle delta against this ceiling. A phase that pushes past 215 KB must either: (a) raise the ceiling explicitly with a documented commit, (b) introduce a route-split for /sky-only code, or (c) defer.
- **Long-task delta.** No long task ≥ 50 ms during interaction. The Playwright perf gate (`e2e/sky-performance.spec.ts`) runs against any phase that adds runtime work.
- **Frame budget.** Per-frame DOM mutation work in the navigation hook stays under ~0.5 ms (P0–P3 contribute; chrome phases add their own work which must respect the same budget when chrome is open).
- **Memory.** /sky's heap retention stays under ~25 MB after 30 s of interaction. Long-running sessions (P12 contemplative state) verify this.
- **Lighthouse scores.** /sky's Lighthouse mobile score stays at the current floor. New animations or chrome must not regress LCP, CLS, or TBT past the budget.

Performance work is **continuous**, not a final phase. A phase that would degrade performance must include the optimization work to stay within budget — or the phase is incomplete.

### Spec reconciliation as continuous work

P13 is the *catch-up* phase, but spec drift is *prevented* phase by phase. Each phase's *specs to reconcile* section names the upstream specs that the phase obligates updates to. Those updates ship with the phase, not after it.

P13 catches the system-wide reconciliation; per-phase obligations catch the per-phase drift. Both are real; both have homes.

### Test substrate growing alongside

Pass 2 left a solid test foundation (276 vitest tests + Playwright perf gate). Each new phase contributes tests in the kind of coverage relevant to its scope:

- Component tests for new atoms / molecules / organisms.
- Integration tests via Playwright for end-to-end behaviors.
- Axe assertions for accessibility.
- Performance assertions for runtime additions.
- Property tests where geometry / math is involved.

The test count grows by ~20–80 tests per phase (rough estimate based on Pass 2's ratio). After P12, the constellation surface should have ~400–500 tests. The substrate stays manageable through co-location (tests next to the components they test) and clear naming.

### Vocabulary alignment

The audit named code-design vocabulary drift. Each phase honors the lexicon as it adds code: variables and functions named in the lexicon's vocabulary where possible; physics / framework terms reserved for code-internal layers. New components carry the design lexicon's names (HorizonStrip, RadialEcho, PolestarPanel); their internal state may use code-internal vocabulary.

The vocabulary refactor itself (BASIN_RADIUS_RAD → well/attractor) is in P0; subsequent phases respect the refactored naming.

### Site-wide impact awareness

/sky exists alongside the rest of the site. Each phase considers its impact:

- **Site nav.** P5 decides; subsequent phases honor.
- **Theme toggle.** P5 decides; subsequent phases honor.
- **Daystar.** P5 decides; subsequent phases honor.
- **Other rooms (Foyer, Studio, Garden, Study, Salon).** Should not change because of /sky's evolution. If a phase requires changes outside /sky (e.g., the Foyer's "↑ Look up" affordance evolution), the impact is documented in the phase's scope.
- **Existing routes.** No phase removes existing routes (URL stability commitment per `INFORMATION_ARCHITECTURE.md`).

### Voice consistency

Every phase that adds copy ships copy in the system voice (italic, second-voice, never directives). The copy patterns from `CONSTELLATION_DESIGN.md` are the canonical reference; new copy proposed in a phase is checked against those patterns.

A phase that needs new copy not covered by existing patterns adds the pattern to the design doc as part of its commit.

### Drift-mode resistance

The audit's eleven *common drift modes* (drift toward dashboard, gallery, feed, modal, tooltip-following chrome, saturated branding, instructive copy, analytics, third-party chrome, speed-as-virtue, accessibility-as-checkbox, feature-completeness-as-virtue) are active concerns during every phase. A phase's exit condition implicitly includes *no drift toward any of the eleven*; a self-review against the list is part of phase completion.

The discipline: when a phase nears exit, the author runs through the eleven and asks for each: *did this phase introduce or strengthen any of these patterns?* The answer is recorded — usually *no, none*; occasionally a near-miss is named with the rationale for why the chosen approach avoided it. A phase that ships with one or more drift-mode pulls unaddressed is incomplete by the cross-cutting commitment.

### Aesthetic touchstone verification

Every phase that adds or modifies visible surface ships with an aesthetic touchstone review. The discipline:

- The phase's author looks at the resulting visible state in both light and dark themes.
- They compare it against at least one of the design doc's named *Aesthetic References* (Bayer's *Uranometria*; Doves Press; late Turner; Cotman's *Greta Bridge*; Pärt's tintinnabuli; *Outer Wilds*; etc.).
- They ask: *does this read as kin to that reference, or as a contemporary-tech artifact dressed in serif?*
- The answer is captured in the phase's commit message — not as marketing copy but as honest self-review.
- A phase whose surface reads as alien to the reference set has the author *name what specifically pulls it away* and decide whether to refine or accept.

This is not a design-review process; it's a *felt-sense check at commit time* that prevents aesthetic drift from accumulating phase by phase. The references are the constellation's neighborhood; the discipline is staying in it.

### Epistemic posture preservation

Each phase that adds visitor-facing affordances must self-review against the design doc's epistemic-posture commitments:

- *Does this addition treat the visitor as a guest, an explorer, a reader, a person — not as a user, target, consumer, or metric?*
- *Does it enable any of the refused kinds of knowledge (others' reading, trending, recommendation, performance metrics, comparison)?*
- *Does it leak surveillance posture even subtly (a "you've read 3 of 12 works" indicator; a "people who read this also read"; a "your reading streak: 4 days")?*
- *Does it ask the visitor for credentials, preferences, or sign-ups — even optionally?*
- *Does it interrupt with notifications the visitor didn't initiate?*

A phase that introduces any of these is reshaping /sky's epistemic posture. The author either revises the addition to refuse the leak, or names the change explicitly as a deliberate redesign of the posture (which would itself need design-doc-level revision before shipping). Silent leaks are forbidden.

### Semiotic load preservation

Each phase that introduces new visuals respects the design doc's named semiotic loads:

- *Gold* is the language of attention given. New gold uses honor this; new active-state colors are not introduced at gold's expense.
- *Italic serif* is the system's voice. Microcopy stays italic; bold and uppercase are not introduced.
- *Eight-point star* is the navigation rose. Different decorative marks (four-pointed; six-pointed; abstract) are not introduced for stars.
- *Watercolor halo* is the *paper-not-screen* signifier. New halos honor watercolor; sharp-edged glows are not introduced.
- *Brushstroke thread* is the authored-not-algorithmic signifier. New connection visuals honor brushstroke; mathematical-curve-perfect lines are not introduced.

When a phase needs a new sign (e.g., a marker that a star has audio), the author proposes the sign with its load articulated, and verifies the load is compatible with the existing system. A new sign whose load conflicts with the existing semiotic system is refused or revised.

### Density and pacing verification

Each phase that adds or modifies the constellation's visible surface verifies the design doc's density commitments:

- Minimum visual separation between stars (~5° angular) is preserved.
- Maximum visible density per cardinal quadrant (~8 stars) is respected at typical corpus sizes.
- Breathing room around the polestar (no stars within ~0.45 hemisphere from polestar) is honored.
- Threads at default opacity (~25%) read as woven rather than wired.
- Atmosphere pool size (~45% of viewport short edge) is preserved unless the phase explicitly refines.

A phase that adds new visible elements that crowd these commitments either revises to respect them or argues for a refinement of the commitment itself.

### Compositional eye-movement verification

Each phase that adds visible elements verifies the design doc's eye-movement hierarchy. The visitor's eye, on first arrival to a populated /sky, should land:

1. At the polestar.
2. At the brightest (most-connected) star.
3. At the companion glyph (during demonstration drift).
4. At threads from the active basin.
5. At the horizon (chrome) only when reaching for it.

A phase that introduces a new visible element checks: *where does the eye land now?* If the new element pulls the eye away from the polestar at first arrival, the composition has been disturbed. Either the new element needs subduing, or the introduction is justified as an intentional shift in hierarchy.

This is the *visual democracy* failure mode named in the design doc and the audit, made into an active per-phase concern.

### Vocabulary and lexicon discipline

Each phase that adds code respects the design doc's lexicon:

- *Star, thread, basin, facet, horizon* are the constellation's vocabulary; component names, prop names, and copy use them.
- Code-internal names may diverge for technical reasons (e.g., `BASIN_RADIUS_RAD` was renamed in P0; new physics constants may use *attractor* / *well* / *tangent* terminology).
- Public API surfaces (component props, exported types, page URLs, microcopy) use the design lexicon.
- A phase that finds itself coining new terminology proposes the term with rationale; accepted terms enter the lexicon.

### Voice consistency check

Each phase that adds visible copy respects the system voice's five permitted registers (whispered narration, contextual hint, system status, empty/loading/offline, authoring trace) and refuses the four forbidden registers (imperative, confirmatory, first-person system, marketing). The phase's commit includes a voice-check note: *"all new copy in italic, second voice, no directives"* or equivalent honest summary.

---

## What this plan does not contain

The plan's scope is sequencing. Several adjacent concerns are deliberately out of scope and named here so a downstream consumer doesn't expect them.

- **Effort estimation.** No phase carries hours, days, weeks, or story points. Effort is a planning-tool concern, not a plan concern. When a phase is taken up, its author estimates within the team's working rhythm.
- **Calendar dates.** No phase has a target completion date. The plan is sequence; the schedule is whatever the practice yields.
- **Resource allocation.** The plan does not assume one author or many; it assumes phases happen when they pull. Whether one person ships P5 over a weekend or three people ship P5 over a month is outside the plan.
- **Risk register.** Standard risk-register practices (probability × impact tables, mitigation plans) are not part of the plan. Risks are surfaced in the audit's *common drift modes* and in each phase's *architectural decisions* sections.
- **Stakeholder communication plan.** /sky has one author and visitors. There is no stakeholder cohort to manage; communication is honesty in commits and specs.
- **Change-management process.** Phases ship via the existing PR workflow. The plan does not invent process.
- **Dependency-management for external libraries.** The plan does not recommend specific libraries (e.g., for the chrome substrate's headless library decision in P4). The phase's author decides at the moment of need.
- **Rollback plans for individual phases.** Phases are designed to be reversible (small commits, isolated impacts), but rollback procedures are not pre-authored. If a phase needs to be reverted, that's a working decision made at the moment, not pre-scripted.
- **A/B testing framework.** /sky does not run experiments on visitors. Variants in the design doc resolve through felt-sense and small-team review, not statistical inference.
- **The plan after this one.** The plan that succeeds this one is whatever the next pull asks for. The current plan does not prescribe its own successor.

If a downstream consumer needs any of these, they author them separately, alongside the plan.

---

## When this plan is done

The plan is done when:

- All visible phases (P0 through P12) have shipped, OR have been formally moved to *held-by-design* with rationale documented.
- P13 (spec reconciliation) is complete: every constellation-related spec describes the shipped state accurately.
- P14 (held register) is up to date: items still held are documented with their trigger conditions.
- P15 (beyond the plan) has been noted as the horizon: the plan acknowledges its own time-boundedness.

Completion does *not* mean every committed surface has been built. It means every committed surface has been *resolved* — built or held with reason. A surface held forever is a legitimate completion of the plan's scope; the plan's job is to make the *resolution* legible, not to force every commitment into code.

When the plan is done, this document gets a final commit:

- Status markers updated to `shipped` or `held-by-design` for every phase.
- The opening section's *what this document is* updates to past tense for shipped phases.
- A *retrospective* section may be added, naming what surprised the practice during execution.
- The plan is then archived (preserved in git, removed from the active spec map) — or replaced by its successor plan.

---

## Living the plan

The plan is a living document while in service. Several practices keep it honest.

### When a phase ships

- Status marker updates to `shipped`.
- The phase's *exit condition* is verified met; deviations documented.
- Architectural decisions made within the phase are noted (which variant chosen; what rationale).
- Specs reconciled by the phase are confirmed updated.
- The audit document updates: rows that this phase moved from `absent` to `present` are re-marked.
- A short retrospective note may be added to the phase's section: what was harder than expected, what the phase taught.

### When a pull arrives that the plan didn't anticipate

If a real pull arrives for work the plan does not have a phase for, the plan inserts a new phase (e.g., P5.5 between P5 and P6, or P16 if the addition is downstream of all current phases). The insertion is named, sequenced into the dependency tree, and the plan's *living the plan* discipline continues.

A pull that *redirects* an existing phase (the visitor's experience suggested a different scope than P6 originally committed to) modifies the phase's scope rather than creating a new one. The change is documented with rationale.

### When a pull doesn't arrive

A phase that sits in `pending` for a long time is not a failure. The architecting practice (spanda) commits to *not forcing* — a phase that hasn't pulled forward is correctly waiting. The plan does not pressure phases into existence; it makes their shape legible so the right pull, when it arrives, finds the work already framed.

If a phase has been pending for very long and the design's commitments around it have shifted (new variants emerged in design doc; new architectural commitments elsewhere have changed the substrate), the phase's scope updates. This is normal; the plan stays current with the design.

### When a phase is formally held

If during the practice, a phase that was *pending* is determined to *not pull within the foreseeable future*, the phase moves to `held-by-design` with rationale. The plan's status updates; subsequent agents know the phase is no longer expected.

A held phase can return to `pending` if a future pull resurrects it. The status is fluid; the legibility is the constant.

### When a phase is abandoned

A phase that was begun and then released without completion gets `abandoned` status with rationale. The architectural decisions made during the partial work are preserved or rolled back as appropriate. Abandonment is not failure — it is honest about what the practice can sustain.

### When the plan itself drifts

The plan, like every other spec in the system, is subject to drift. If the implementation diverges from the plan's named sequence, the plan updates to reflect what actually happened. *The implementation does not bend to honor a stale plan;* the plan bends to honor reality.

This means the plan's authority is *suggestive*, not *binding*. A phase shipped out of sequence, with its dependencies handled differently than the tree suggested, is legitimate as long as the dependencies are honored. The plan describes the cleanest sequence; reality may take a different path that respects the same constraints.

---

## Closing observations

The shape of the plan, briefly.

- **The plan is large.** Sixteen phases, several with substantial scope. This is honest about the gap; the gap is large because the design's commitments are large; the commitments are large because the experience the constellation reaches for is itself large. *A small plan would lie about the work.*
- **The plan is sequential where it has to be, parallel where it can be.** The chrome substrate (P4) is a real bottleneck for chrome surfaces; little can be done about that. But P0, P1, P2, P3 can ship in any order, and once P4 is shipped, P5–P10 can largely proceed in parallel.
- **The plan respects spanda.** No phase is scheduled; each waits for its tremor. The plan describes what would be done *if and when* each phase is pulled, not what *will* be done.
- **The plan is honest about its own scope.** It does not contain effort estimates, dates, resource plans, or risk registers. Those are downstream artifacts; the plan is the sequence-and-shape.
- **The plan is a living document.** Status markers update; phases are added or removed; held items shift; specs reconcile alongside. The plan in any single moment is a snapshot.
- **The plan's job ends when the plan is done.** The successor plan is whatever the next pull asks for. The current plan does not prescribe its own succession; it acknowledges its time-boundedness as completion.

The plan is the prerequisite for execution, not its substitute. *Reading the plan is not building the surface.* The plan is what makes the building of the surface legible — to its author, to future agents, to anyone reading the codebase as the work it is.

When the next pull arrives, the plan is here. Until then, the plan waits.

---

*This document is held vision under spanda discipline. Phases marked **pending** are not backlog items waiting for prioritization; they are commitments that wait for their tremor. When a tremor arrives, the plan is the sequence; until then, the plan is the legibility. Both states are correct.*
