# Specification Map

This document is the inventory of every specification this codebase needs — reasoned from first principles, scoped by what this site actually is.

It exists because a codebase built by agents needs to know what it knows and what it doesn't. Each specification file captures a concern that an agent can't reliably derive from code alone — it requires intent, philosophy, or design rationale. The code implements decisions; the specifications hold the *reasons for* decisions, so that future decisions remain coherent with past ones.

This map was produced through a practice of exhaustive enumeration: starting from the domain of all possible website concerns, then scoping down by the constraints of Danny's site. It is meant to be critically evaluated, revised, and kept alive. If a specification exists that isn't on this map, the map is wrong. If this map names a specification that doesn't exist yet, that's a known gap — not necessarily a task.

---

## Reading Order

The agentic surface is not a flat list of files. It is a directed graph — a dependency structure that determines which context is present when each file is encountered, and how that context shapes understanding. An agent arriving at `REACT_NORTH_STAR.md` after reading `CLAUDE.md`, `MEDIUM.md`, and `DOMAIN_MODEL.md` understands the fourteen axioms as expressions of care within a specific medium for a specific domain. An agent arriving at it cold sees technical constraints. The order is content architecture. It does real work.

The graph is organized spatially, extending the house metaphor that already organizes the site itself. A house has an interior — what the rooms hold. It has an exterior — the rooms themselves, their surfaces and spatial design. It has a structural layer where interior and exterior become one built thing. It has thresholds — where the house meets the world beyond itself. And it has grounds — the land it sits on, the utilities, the maintenance infrastructure. Every specification file in this codebase maps to one of these layers. The metaphor isn't decorative; it tells you *why* a file belongs where it does, not just that it does.

### The Entry Sequence

The first four files are genuinely linear. Each prepares ground the next one needs. This is the one path every agent walks, every time, before anything else. It is the equivalent of walking up to the house, entering the foyer, and orienting before you enter any room or pick up any tool.

```
CLAUDE.md
  │   The foyer. Who Danny is, how to be here. The felt sense of
  │   the work, the practice of spanda, the philosophy of enough.
  │   Establishes the lens through which everything after is read.
  │
  ├─→ MEDIUM.md
  │     The ground beneath the house. What a webpage is — not what
  │     this site is, but what any webpage is. The seven dimensions
  │     (hypertextuality, temporality, responsiveness, addressability,
  │     semantic structure, social existence, materiality) and the
  │     agentic surface as an eighth. You must understand the medium
  │     before you build in it.
  │
  ├─→ TRANSPARENCY.md
  │     The site's relationship to its own making. Reframes everything
  │     that follows: these specifications live two lives, as agentic
  │     interface and as published content. The strata model, temporal
  │     archaeology, configuration-as-content. After reading this, an
  │     agent knows that the files it's reading are themselves part of
  │     what the site gives to its visitors.
  │
  └─→ SPECIFICATION_MAP.md
        This file. The inventory and wayfinding. Now you know what
        exists, what's missing, and how the concerns are organized.
        From here, the graph forks.
```

After the entry sequence, the structure branches. What follows is not a list to be read top-to-bottom but a graph to be navigated by need. The two trunks — inside and outside — are parallel and independent. Neither depends on the other. An agent follows whichever trunk its current task requires, or both if working at their intersection.

### Inside — What the Rooms Hold

The inside trunk is the semantic architecture of the site: what a room is, what a work is, what a facet means, how works are encoded as data, how they connect to each other, and how Danny creates them. This is the content, the meaning, the substance that the rooms exist to hold. It forms a self-contained dependency chain — each file depends only on inside files above it.

```
DOMAIN_MODEL.md
  │   The ontology. What a room is, what a work is, what a facet
  │   means, what modes are, and how they all relate as a conceptual
  │   system. The single source of truth for the site's semantic
  │   architecture. Currently a gap — split across CLAUDE.md (poetic)
  │   and DANNY_FOUNDATION.md (tabular), neither canonical.
  │
  ├─→ CONTENT_SCHEMA.md
  │     Works as data. Frontmatter shape, content types (poem, essay,
  │     case study, note), file naming, directory structure, how facets
  │     are encoded, how room assignment works. The bridge between the
  │     domain model's concepts and the component architecture's code.
  │     Depends on: DOMAIN_MODEL.
  │
  ├─→ GRAPH_AND_LINKING.md
  │     The "one graph" commitment made concrete. How backlinks work,
  │     how a poem links to a case study, how facets create navigable
  │     threads across rooms, what prevents the graph from becoming
  │     noise. Includes the ontological question: what can link to
  │     what, and what does a link mean?
  │     Depends on: DOMAIN_MODEL + CONTENT_SCHEMA.
  │
  └─→ CONTENT_AUTHORING.md
        Danny's workflow. How he writes, how drafts become published,
        what "seasonal" means for the Garden operationally, how the
        pipeline supports the practice of "this is enough, this can
        exist now." The specification of Danny's interface to his
        own site — a writer returning to voice, not a developer
        pushing code.
        Depends on: CONTENT_SCHEMA.
```

### Outside — The Rooms Themselves

The outside trunk is the experiential architecture: how the rooms look, feel, sound, move, and speak. Surfaces, light, palette, typography, motion, time, wayfinding. This is not what's *in* the rooms but the rooms *as experienced spaces* — the oak weight of the door, the way a room tells you something before you've looked at anything in it. The outside trunk is mostly self-contained, with one cross-dependency: information architecture needs to know what rooms exist, which comes from the inside trunk's domain model.

```
DESIGN_SYSTEM.md
  │   The visual language and its rationale. Not just token values
  │   (those live in tokens.css) but why umber, why serif, why paper
  │   grain. The aesthetic philosophy that guides every visual
  │   decision — materiality, structural warmth, the kind of warmth
  │   you feel in a space where someone chose every surface with care
  │   and then didn't mention it. Palette, typography, spacing, the
  │   Diamond and Ornament vocabulary.
  │
  ├─→ VOICE_AND_COPY.md
  │     How the site speaks in its own voice — not in Danny's works,
  │     but in navigation labels, button text, empty states, error
  │     messages, page titles, meta descriptions. The room's speech,
  │     not the work's. A site that "opens a door and stands back"
  │     speaks differently than one that leans forward.
  │     Depends on: DESIGN_SYSTEM.
  │
  ├─→ INTERACTION_DESIGN.md
  │     Motion, transitions, scroll behavior, pace, dark mode as a
  │     room dimming. The choreographic vocabulary: easing curves,
  │     duration philosophy, stagger patterns. This site uses time
  │     as a material — slow transitions, scroll reveals that feel
  │     like rooms opening, a geometric figure that takes a full
  │     minute to rotate. How motion serves the feeling of place
  │     rather than performing delight.
  │     Depends on: DESIGN_SYSTEM.
  │
  └─→ INFORMATION_ARCHITECTURE.md
        The hallways and doors. Navigation model, URL design, room-to-
        route mapping, the visitor's journey from arrival through
        orientation to wandering to deepening. How the house metaphor
        manifests in actual wayfinding — what each room's landing page
        contains, how a visitor discovers works within a room, how
        rooms invite you into adjacent rooms.
        Depends on: DESIGN_SYSTEM + DOMAIN_MODEL (cross-dependency).
```

### The House — Where Inside Meets Outside

The component architecture is where the two trunks converge into one built thing. It cannot be fully understood without both the inside (what are we building *for* — the domain, the content, the graph) and the outside (what does it *feel* like — the design, the motion, the voice). This is the most-connected node in the graph: the structural layer where meaning and material become code.

```
         DOMAIN_MODEL ──────┐
         (inside)           │
                            ▼
                     REACT_NORTH_STAR.md
                     The component architecture. Axioms,
                     atomic hierarchy, dependency direction
                     law, threshold system, state decisions,
                     hook taxonomy. How domain and design
                     become code. Currently comprehensive
                     at ~31K bytes; also partially covers
                     testing, dependencies, and performance.
                            ▲
         DESIGN_SYSTEM ─────┘
         (outside)
```

### The Threshold — Where the House Meets the World

Every file in the threshold layer is a boundary concern: the house interfacing with something beyond itself. These are not internal decisions about what the site is or how it's built — they are commitments about how the site meets other bodies, other devices, other machines, hostile actors, and the constraint of time. They are parallel leaves, not a chain. Each draws from whichever upstream files it constrains, but they do not depend on each other.

The word *threshold* is precise. A threshold is the strip of floor at the bottom of a doorway — the boundary between inside and outside, between the house and what's beyond it. Accessibility is literally about the threshold being passable by all bodies. Performance is about the threshold not making you wait. SEO is about the threshold being legible from the street. Responsive design is about the threshold adapting to how you arrive. Security is about the threshold being safe.

```
REACT_NORTH_STAR + INTERACTION_DESIGN
  └─→ PERFORMANCE_BUDGET.md
        The house meeting expectations of responsiveness. Core Web
        Vitals targets, bundle size limits, image and font loading
        strategy. The tension this file resolves: slow transitions
        are intentional (interaction design says so); slow page loads
        are not. "Slow on purpose" has a precise technical meaning
        here, and this file owns that distinction.

REACT_NORTH_STAR + DESIGN_SYSTEM
  └─→ ACCESSIBILITY.md
        The house meeting all bodies. WCAG 2.1 AA commitments,
        keyboard navigation, screen reader behavior, reduced-motion
        alternatives, focus management, ARIA live regions. A site
        that "gives" must give to everyone. REACT_NORTH_STAR.md
        mentions accessibility briefly; this file owns it fully.

DESIGN_SYSTEM + REACT_NORTH_STAR
  └─→ RESPONSIVE_STRATEGY.md
        The house meeting all viewports. Breakpoints, mobile
        behavior, touch interactions, print styles, browser support
        matrix. For a site about poetry and essays with a "paper on
        the walls" aesthetic, print rendering is a first-class
        concern — a poem should print as beautifully as it renders.

CONTENT_SCHEMA + INFORMATION_ARCHITECTURE
  └─→ SEO_AND_META.md
        The house meeting machines. Open Graph tags, structured data,
        social card design, sitemap, RSS/Atom syndication. How the
        site presents itself to link previews and search engines.
        For a poet-essayist, syndication matters — readers should be
        able to subscribe. How each room and work generates its own
        meta representation.

(minimal upstream dependencies)
  └─→ SECURITY.md
        The house meeting the hostile world. Content Security Policy,
        dependency auditing stance, data handling (the site likely
        collects nothing, but that decision should be explicit),
        privacy posture. Lighter for a static content site but the
        posture still needs to be named.
```

### The Grounds — What Supports the House

The grounds are everything that supports the house without being the house itself: the land it sits on, the utilities, the workshop, the inspection regime, the master plan for future additions. These files are meaningful only after the intent they serve is understood — an agent reading `DEPLOYMENT.md` before `CLAUDE.md` would make technically sound decisions that miss the point.

```
REACT_NORTH_STAR
  ├─→ DEPLOYMENT.md
  │     The land. Build pipeline, hosting platform, CI/CD, environments,
  │     DNS, SSL, CDN, caching strategy. Where the house physically
  │     lives and how it gets there.
  │
  ├─→ DEPENDENCY_POLICY.md
  │     The supply chain. When to add a dependency, evaluation criteria,
  │     update cadence, the philosophical stance on third-party code.
  │     REACT_NORTH_STAR.md lists the non-negotiable stack; this file
  │     (if separate) covers the judgment framework for future additions.
  │     May remain a section within the architecture doc if a section
  │     is sufficient.
  │
  └─→ TESTING_STRATEGY.md
        The inspection regime. What to test, what not to test, coverage
        philosophy, the layer-by-layer approach. Currently a section
        within REACT_NORTH_STAR.md. Wants its own home only if testing
        judgment needs more space than a section affords.

CONTENT_SCHEMA + DESIGN_SYSTEM
  └─→ MEDIA_STRATEGY.md
        The workshop. Images, audio, video — formats, optimization,
        CDN delivery, alt text philosophy, responsive images. The
        Salon is the cellist's son's room; audio is potentially a
        first-class medium. This file bridges inside (content) and
        outside (design) at the infrastructure level: how non-text
        materials are prepared, optimized, and delivered.

(all of the above)
  └─→ EVOLUTION_PROTOCOL.md
        The master plan. How the codebase grows over time. Refactoring
        triggers, migration patterns, how new rooms or content types
        are added, what "living over finished" means for the codebase
        itself. This is the capstone — the one file that needs the
        entire graph to make sense, because it specifies how the
        whole system evolves.
```

### How to Navigate

**The entry sequence is the one path everyone walks.** Soul → medium → self-knowledge → map. Non-negotiable, always linear, always first.

**After the entry sequence, follow the trunk you need.** Working on content structure? Follow the inside: domain model → content schema → content authoring. Working on visual language or motion? Follow the outside: design system → interaction design → voice. Working on components? You need both trunks — domain model and design system — before the architecture file at their intersection makes full sense.

**The threshold and grounds are read when relevant**, not in sequence. An agent working on accessibility reads the entry sequence, then design system, then component architecture, then the accessibility spec. An agent working on deployment reads the entry sequence, then component architecture, then deployment. The graph tells you which upstream files prepare the ground for any given concern.

**The entry point is always CLAUDE.md.** Every agent session begins there. The graph defines dependency structure — which files prepare ground for which other files — not a mandatory path through all twenty-three documents.

---

## The Complete Set

The twenty-three specification files are organized by the six layers of the house. Each layer section below names every file in that layer, its current status, its upstream dependencies, and what it's responsible for. The reading order graph (above) shows how to navigate; this section is the reference — the full inventory with enough detail that an agent can determine whether a file exists, whether it's relevant, and what it should expect to find there.

### The Entry Sequence

Before any specification about *this* site, an agent needs three things: the soul of the work, the nature of the medium, and the self-awareness that these specifications are themselves part of the site. The entry sequence provides these in order, then delivers the map. These four files are read linearly, every time, before any other specification is consulted.

| File | Layer | Status | Depends on | Purpose |
|---|---|---|---|---|
| `CLAUDE.md` | Entry | **Exists** | — | How to *be* while building here. Agent behavior, project soul, the felt sense of the work. Holds Danny's voice, the practice of spanda, the philosophy of enough. This is the file the agent reads first and carries throughout. It is the foyer of the agentic surface. |
| `MEDIUM.md` | Entry | **Exists** | `CLAUDE.md` | The epistemography of the webpage as a medium. Names the seven dimensions — hypertextuality, temporality, responsiveness, addressability, semantic structure, social existence, materiality — and the agentic surface as an eighth. This is the philosophical ground beneath the map: not what *this* site is, but what *any* webpage is, so that every downstream decision inherits the right assumptions about the medium it's working in. |
| `TRANSPARENCY.md` | Entry | **Exists** | `MEDIUM.md` | The site's commitment to publishing its own definition. Every specification lives two lives: as an agentic interface (instructing the agent that builds) and as published content (a visible stratum of the site itself). Defines the strata model, temporal archaeology (navigating the site's self-understanding through git history), configuration-as-content, and the annotation system that connects surface elements to their specification origins. This document makes the specification map not just an internal inventory but part of what the site gives to its visitors. |
| `SPECIFICATION_MAP.md` | Entry | **This file** | `TRANSPARENCY.md` | The inventory of specifications themselves — what exists, what's missing, what's deferred, and why. The meta-architectural concern. Also holds the reading order graph and the six-layer organizational structure. |

### Inside — What the Rooms Hold

The inside trunk is the semantic architecture: the content, the meaning, the works. These files define what a room is, what goes in it, how the things in it connect to each other, and how Danny puts new things in. The inside trunk forms a self-contained dependency chain. No inside file depends on any outside file.

| File | Layer | Status | Depends on | Purpose |
|---|---|---|---|---|
| `DOMAIN_MODEL.md` | Inside | **Gap** | Entry sequence | The ontology. Rooms, facets, works, modes, and their relationships as a conceptual system. The single source of truth for what a room *is*, what a facet *means*, what a work *contains*, and how they relate. Currently split between `CLAUDE.md` (which holds the poetic description) and `DANNY_FOUNDATION.md` (which holds a tabular version with stale open questions). Neither is canonical. This file should resolve that — absorbing the structural content from both and becoming the authoritative reference for the site's semantic architecture. `CLAUDE.md` keeps the soul; this file keeps the structure. |
| `CONTENT_SCHEMA.md` | Inside | **Gap** | `DOMAIN_MODEL.md` | Works as data. Frontmatter shape, file naming conventions, directory structure for content files, content types (poem, essay, case study, note), required vs. optional fields, how facets are encoded, how room assignment works. This is the bridge between the domain model ("works live in rooms and carry facets") and the component architecture ("containers call one orchestration hook and render one organism"). Without it, an agent has vision on one side and plumbing on the other, with no pipe between them. |
| `GRAPH_AND_LINKING.md` | Inside | **Gap** | `DOMAIN_MODEL.md` + `CONTENT_SCHEMA.md` | The "one graph" commitment made concrete. How backlinks work, how a poem links to a case study, how facets create navigable threads across rooms, what prevents the graph from becoming noise as it grows. This is architecturally significant — "everything is one graph" is a core promise in `CLAUDE.md`, but no specification exists for how it's implemented or maintained. Includes the ontological question: what can link to what, and what does a link *mean*? Depends on the domain model (what entities exist to link) and the content schema (how links are encoded in frontmatter or body). |
| `CONTENT_AUTHORING.md` | Inside | **Gap** | `CONTENT_SCHEMA.md` | Danny's workflow for creating and publishing works. How he writes (in-repo? external tool?), how drafts become published, whether there's a preview system, what "seasonal" means for the Garden operationally, how the content pipeline supports the practice of "this is enough, this can exist now." This is the specification of Danny's interface to his own site — a writer returning to voice, not a developer pushing code. Depends on the content schema because the authoring workflow must produce files that conform to it. |

### Outside — The Rooms Themselves

The outside trunk is the experiential architecture: how the rooms look, feel, move, speak, and connect to each other spatially. These files define the surfaces, the light, the transitions, the wayfinding — not what's *in* the rooms but the rooms *as experienced spaces*. The outside trunk is mostly self-contained. One cross-dependency exists: information architecture needs to know what rooms exist, which comes from the inside trunk's domain model.

| File | Layer | Status | Depends on | Purpose |
|---|---|---|---|---|
| `DESIGN_SYSTEM.md` | Outside | **Gap** | Entry sequence | The visual language and its rationale. Not just the token values (those live in `tokens.css`) but *why* umber, *why* serif, *why* paper grain. The aesthetic philosophy that guides every visual decision — materiality, structural warmth, the kind of warmth you feel in a space where someone chose every surface with care and then didn't mention it. Palette, typography, spacing, the Diamond and Ornament vocabulary, how these compose into the site's visual identity. This is probably the most important gap in the specification set — the second-most-important file after `CLAUDE.md`. |
| `VOICE_AND_COPY.md` | Outside | **Gap** | `DESIGN_SYSTEM.md` | How the site speaks in its own voice — not in Danny's works, but in navigation labels, button text, empty states, error messages, page titles, meta descriptions. The microcopy register. A site that "opens a door and stands back" speaks differently than one that leans forward. This file defines that speech. Depends on the design system because voice is an extension of visual identity — the same sensibility expressed in language rather than color and type. |
| `INTERACTION_DESIGN.md` | Outside | **Gap** | `DESIGN_SYSTEM.md` | Motion, transitions, scroll behavior, pace, and dark mode as a room dimming. The temporal/kinetic design language. This site uses time as a material — slow transitions, scroll reveals that feel like rooms opening, a geometric figure that takes a full minute to rotate. This file specifies the choreographic vocabulary: easing curves, duration philosophy, stagger patterns, how motion serves the feeling of place rather than performing delight. Dark mode lives here — it's a transition experience, not a toggle. Depends on the design system because motion is the design language in time. |
| `INFORMATION_ARCHITECTURE.md` | Outside | **Gap** | `DESIGN_SYSTEM.md` + `DOMAIN_MODEL.md` | Navigation model, URL design, room-to-route mapping, the visitor's journey from arrival through orientation to wandering to deepening. How the house metaphor manifests in actual wayfinding. Some of this is implied by the existing route structure (`/studio`, `/garden`, etc.) but the *intent* behind the structure — what each room's landing page contains, how a visitor discovers works within a room, how rooms invite you into adjacent rooms — isn't specified anywhere. Depends on the design system (navigation is a spatial/visual concern) and the domain model (you need to know what rooms exist before you can map them to routes). This is the one outside file with a cross-dependency on inside. |

### The House — Where Inside Meets Outside

The component architecture sits at the intersection of the two trunks. It is the structural layer where the domain model's concepts and the design system's materials become one built thing — React components, hooks, dependency laws, threshold systems. It is the most-connected node in the graph: the only file that requires both trunks upstream.

| File | Layer | Status | Depends on | Purpose |
|---|---|---|---|---|
| `REACT_NORTH_STAR.md` | The House | **Exists** | `DOMAIN_MODEL.md` + `DESIGN_SYSTEM.md` | The component architecture. The fourteen axioms, atomic hierarchy, dependency direction law, threshold system, state decisions, hook taxonomy. Currently comprehensive at ~31K bytes. Also partially covers concerns that belong to the threshold (performance budget, accessibility) and the grounds (testing strategy, dependency policy) — these subsections may or may not need to be extracted into their own files as the site grows. The architecture file is where an agent learns how to *build* after learning what to build (inside) and what it should feel like (outside). |

### The Threshold — Where the House Meets the World

Every file in this layer is a boundary concern: the house interfacing with something beyond itself. These are not internal decisions about what the site is or how it's built — they are commitments about how the site meets other bodies, other devices, other machines, hostile actors, and the constraint of time. The word *threshold* is precise: a threshold is the strip of floor at the bottom of a doorway, the boundary between the house and what's beyond it. These files are parallel leaves — each draws from whichever upstream files it constrains, but they do not depend on each other.

| File | Layer | Status | Depends on | Purpose |
|---|---|---|---|---|
| `PERFORMANCE_BUDGET.md` | Threshold | **Gap** | `REACT_NORTH_STAR.md` + `INTERACTION_DESIGN.md` | The house meeting expectations of responsiveness. Core Web Vitals targets, bundle size limits, image and font loading strategy. The tension this file resolves: slow transitions are intentional (interaction design says so); slow page loads are not. "Slow on purpose" has a precise technical meaning here, and this file owns that distinction. Depends on the component architecture (what's being loaded) and interaction design (what intentional slowness looks like, so it can be distinguished from unintentional slowness). |
| `ACCESSIBILITY.md` | Threshold | **Gap** | `REACT_NORTH_STAR.md` + `DESIGN_SYSTEM.md` | The house meeting all bodies. WCAG 2.1 AA commitments, keyboard navigation patterns, screen reader behavior, reduced-motion alternatives, focus management, ARIA live regions for dynamic content. `REACT_NORTH_STAR.md` mentions accessibility requirements briefly; this file owns them fully. A site that "gives" must give to everyone. Depends on the component architecture (accessibility is implemented in components) and the design system (color contrast, type sizing, focus indicators are design decisions). |
| `RESPONSIVE_STRATEGY.md` | Threshold | **Gap** | `DESIGN_SYSTEM.md` + `REACT_NORTH_STAR.md` | The house meeting all viewports. Breakpoints, mobile behavior, touch interactions, print styles, browser support matrix. For a site about poetry and essays with a "paper on the walls" aesthetic, print rendering is a first-class concern — a poem should print as beautifully as it renders. Depends on the design system (responsive design is the design language adapting) and the component architecture (responsive behavior is implemented in components). |
| `SEO_AND_META.md` | Threshold | **Gap** | `CONTENT_SCHEMA.md` + `INFORMATION_ARCHITECTURE.md` | The house meeting machines. Open Graph tags, structured data, social card design, sitemap generation, RSS/Atom syndication. How the site presents itself to link previews and search engines. For a poet-essayist, syndication (RSS) matters — readers should be able to subscribe. How each room and work generates its own meta representation. Depends on the content schema (meta is generated from content data) and information architecture (URLs and site structure determine what's indexable). |
| `SECURITY.md` | Threshold | **Gap** | Minimal upstream | The house meeting the hostile world. Content Security Policy, dependency auditing stance, data handling (the site likely collects nothing, but that decision should be explicit), privacy posture. Lighter for a static content site but the posture still needs to be named — the absence of data collection is itself a design decision worth declaring. |

### The Grounds — What Supports the House

The grounds are everything that supports the house without being the house itself: the land it sits on, the utilities, the workshop for preparing materials, the inspection regime, the master plan for future additions. These files are meaningful only after the intent they serve is understood. The word *grounds* is deliberate — it encompasses both the land a house is built on and the ongoing tending ("keeping up the grounds").

| File | Layer | Status | Depends on | Purpose |
|---|---|---|---|---|
| `DEPLOYMENT.md` | Grounds | **Gap** | `REACT_NORTH_STAR.md` | The land. Build pipeline, hosting platform, CI/CD configuration, environments (dev/staging/production), DNS, SSL, CDN, caching strategy, environment variables. Where the house physically lives and how it gets there. Depends on the component architecture because deployment is shaped by what's being deployed — static generation, bundle strategy, environment needs. |
| `DEPENDENCY_POLICY.md` | Grounds | **Partially covered in `REACT_NORTH_STAR.md`** | `REACT_NORTH_STAR.md` | The supply chain. When to add a dependency, evaluation criteria, update cadence, the philosophical stance on third-party code. `REACT_NORTH_STAR.md` lists the non-negotiable stack; this file (if separate) would cover the *judgment framework* for future additions. May remain a section within the architecture doc if a section is sufficient — the concern is real but may not need its own room. |
| `TESTING_STRATEGY.md` | Grounds | **Partially covered in `REACT_NORTH_STAR.md`** | `REACT_NORTH_STAR.md` | The inspection regime. What to test, what not to test, coverage philosophy, the layer-by-layer approach (domain → hooks → components → integration → E2E). Currently a section within `REACT_NORTH_STAR.md`. Wants its own home only if testing judgment needs more space than a section affords. |
| `MEDIA_STRATEGY.md` | Grounds | **Gap** | `CONTENT_SCHEMA.md` + `DESIGN_SYSTEM.md` | The workshop. Images, audio, video — formats, optimization, CDN delivery, alt text philosophy, responsive images. The Salon is the cellist's son's room; audio is potentially a first-class medium. This file bridges inside (content) and outside (design) at the infrastructure level: how non-text materials are prepared, optimized, and delivered. Depends on the content schema (what media types exist in the content model) and the design system (how media is presented). |
| `EVOLUTION_PROTOCOL.md` | Grounds | **Gap** | All of the above | The master plan. How the codebase grows over time. Refactoring triggers (already partially in `REACT_NORTH_STAR.md` as the "Evolution Protocol" section), migration patterns, how new rooms or content types would be added, what "living over finished" means for the codebase itself. The site grows like a garden — this file says how you tend it. This is the capstone of the entire graph: the one file that needs every other file's context to make sense, because it specifies how the whole system evolves. |

---

## Current State Assessment

**What exists today:**

| File | Layer | Covers | Gaps / Issues |
|---|---|---|---|
| `CLAUDE.md` | Entry | Soul, partial domain model, partial aesthetic | Overlaps with `DANNY_FOUNDATION.md` on the domain model. Aesthetic intent is beautifully expressed but not operationalized into design decisions. |
| `MEDIUM.md` | Entry | The medium's dimensions, the agentic surface | Complete for its scope. |
| `TRANSPARENCY.md` | Entry | Self-publishing commitment, strata model | Complete for its scope. |
| `SPECIFICATION_MAP.md` | Entry | This file — inventory, reading order, layer structure | Living document. Updated as specifications are created or gaps are filled. |
| `DANNY_FOUNDATION.md` | *(unplaced)* | Partial domain model | Contains stale open questions that are already answered (tech stack, navigation). Tabular content model overlaps with `CLAUDE.md`'s poetic version. Neither file is canonical for the domain model. This file's role resolves when `DOMAIN_MODEL.md` is written — it either gets absorbed, retired as a historical artifact, or refreshed. It is not a node in the reading order graph; it is a question the graph is holding. |
| `REACT_NORTH_STAR.md` | The House | Component architecture, partial performance, partial accessibility, partial testing, partial dependencies | Comprehensive for component architecture. Partially covers several concerns that belong to the threshold (`PERFORMANCE_BUDGET.md`, `ACCESSIBILITY.md`) and the grounds (`TESTING_STRATEGY.md`, `DEPENDENCY_POLICY.md`). These subsections may or may not need to be extracted into their own files as the site grows. |

**The domain model overlap:**

`CLAUDE.md` and `DANNY_FOUNDATION.md` both describe rooms, facets, works, and design principles. They share the same information in different registers — one poetic, one tabular. An agent reading both receives the concepts twice with slightly different framing and no clear authority hierarchy. The domain model needs one canonical home.

The resolution is implied by the graph structure: `DOMAIN_MODEL.md` becomes the inside trunk's root, the single source of truth for the site's semantic architecture. `CLAUDE.md` keeps the soul — the felt sense, the poetic description, the philosophy. `DOMAIN_MODEL.md` keeps the structure — the formal relationships, the enumerated facets, the content model. `DANNY_FOUNDATION.md` is either absorbed into `DOMAIN_MODEL.md` or retired as a historical artifact. This decision should be made before the content schema is written, because the content schema depends on a canonical domain model upstream.

---

## Near-Misses

Concerns that were evaluated and intentionally excluded from the primary set, with reasoning. The "where it lives instead" column now references the six-layer structure.

| Candidate | Why it argued for inclusion | Where it lives instead |
|---|---|---|
| `VISITOR_JOURNEY.md` | The intended experience arc — arrival, orientation, wandering, deepening. Distinct from information architecture (structure) and interaction design (kinetics). This is narrative design. | Section within `INFORMATION_ARCHITECTURE.md` (outside). The visitor journey is a spatial/experiential concern — it's about how the rooms are traversed, not what's in them. If the journey design becomes complex enough to fill its own file, it should be promoted. |
| `PRINT_STYLES.md` | For poetry and essays with a "paper on the walls" aesthetic, print is a first-class viewport. | Section within `RESPONSIVE_STRATEGY.md` (threshold). Print is another viewport the house must meet — a threshold concern. |
| `SYNDICATION.md` | RSS/Atom feeds. For a poet-essayist, how content leaves the site matters. | Section within `SEO_AND_META.md` (threshold). Another way the house presents itself beyond its own walls. |
| `VISUAL_IDENTITY.md` | The Diamond, the Ornament, the geometric vocabulary — a distinct design language. | Lives within `DESIGN_SYSTEM.md` (outside). The ornamental vocabulary is part of the visual language — part of the rooms themselves, not separate from them. |
| `SEARCH.md` | Content discovery beyond room navigation, especially as the graph grows. | Premature. Relevant at 50+ works, not at 5. When it arrives, it would likely live in the outside trunk (wayfinding) or at the inside/outside intersection. Revisit when the content layer is populated. |
| `CACHING_STRATEGY.md` | Service worker, offline-first, CDN rules. | Section within `DEPLOYMENT.md` (grounds). Not complex enough for its own file on a static content site. |
| `LEGAL.md` | Privacy policy, content licensing, cookie stance. | A real concern, but it's *content* (a page on the site) rather than architecture. The agent needs a template or a content authoring entry, not a specification. Not a node in the graph. |
| `CONTENT_LIFECYCLE.md` | Draft → review → publish → seasonal rotation. The Garden "grows seasonally" — that's a lifecycle. | Splits between `CONTENT_AUTHORING.md` and `CONTENT_SCHEMA.md` (both inside). The lifecycle is partly workflow (authoring) and partly data (status fields in frontmatter). |
| `MONITORING.md` | Error tracking, uptime, observability. | Section within `DEPLOYMENT.md` (grounds). A personal site doesn't need a separate observability specification. |
| `BROWSER_SUPPORT.md` | What browsers, graceful degradation. | One paragraph within `RESPONSIVE_STRATEGY.md` (threshold). |
| `ENV_CONFIG.md` | Environment variables, feature flags, build modes. | Section within `DEPLOYMENT.md` (grounds). |
| `STATE_ARCHITECTURE.md` | Client state, server state, URL state boundaries. | Already covered within `REACT_NORTH_STAR.md` (the house). For a content site with minimal client state, state decisions are component decisions. |
| `DARK_MODE.md` | The transition as experience — pacing, palette shifts, mood. | Lives within `INTERACTION_DESIGN.md` (outside). Dark mode is choreography — the room dimming — not a system. |

---

## Unmapped Territories

Concerns that may not yet have the right name or home. These surfaced during analysis and don't cleanly fit any file above. They're noted here so they aren't lost. Each is annotated with the layer or seam it would likely inhabit if it crystallized.

**Temporal design as its own concern.** This site uses time as a material — slow transitions, scroll pace, a geometric figure rotating over a full minute. `INTERACTION_DESIGN.md` (outside) covers motion, but *duration as philosophy* might be underspecified there. The site's relationship to time is unusual enough to warrant explicit attention, whether as a dedicated section within interaction design or as something that permeates the design system more broadly. If it became its own file, it would live in the outside trunk — time is a property of the rooms, not of the works.

**The authoring experience as UX.** `CONTENT_AUTHORING.md` (inside) covers Danny's workflow, but there's a deeper layer: what does the writing *environment* feel like? Does content hot-reload in development? Is there a preview that captures the site's typography and pacing? Does Danny write in the repo or in a separate tool? This is developer experience design for the site's primary user — someone who is not a developer in this context but a writer returning to voice. This concern straddles inside (content authoring) and outside (the preview environment's visual fidelity), and might touch the grounds (development tooling).

**The graph as knowledge architecture.** `GRAPH_AND_LINKING.md` (inside) covers technical linking, but the *ontological* decisions — what can link to what, what does a facet *mean* as a connection type, how do you prevent the graph from becoming noise — live at the seam between the domain model and the graph specification. Both are inside files, and the seam between them needs attention when both are written. The graph file depends on the domain model precisely because these ontological questions must be answered upstream first.

**Seasonal/temporal content.** The Garden is described as "living, growing, seasonal." Works may have temporal relevance — not lifecycle (draft → published) but something more like *what blooms when*. No specification addresses how time intersects with content visibility, ordering, or presentation. This lives on the inside trunk — it's about the content itself, not the rooms. It might want a section in `CONTENT_SCHEMA.md` (how seasonality is encoded) or might be a dimension of the domain model itself (what "seasonal" means as a concept).

---

## How to Use This Map

**For agents:** Before building a feature, identify which layer it lives in and which upstream files prepare the ground. Read the entry sequence first (always). Then follow the relevant trunk — inside if the work is about content or domain, outside if it's about design or experience, both if it's about components. If a specification exists, read it. If it's marked as a gap, note that you're making decisions without explicit guidance — proceed with the felt sense from `CLAUDE.md` and flag the gap. The six-layer structure tells you not just *what* to read but *why* — each file lands differently depending on which context is already present.

**For Danny:** This map is a place to see the whole. The six layers — entry, inside, outside, the house, the threshold, the grounds — are a spatial metaphor that extends the house metaphor of the site itself. Some gaps are intentional (the site waits for spanda). Some are oversights. Some will resolve themselves when the material is ready. You don't need to fill every gap to build. But knowing where the gaps are and which layer they belong to means the building stays coherent.

**For revision:** This map should be updated when specifications are created, when gaps are filled, when near-misses are promoted, or when new concerns surface. When adding a new file, place it in a layer and declare its upstream dependencies — this integrates it into the reading order graph. It is itself a living document — the meta-specification — and it follows the same principle as everything else here: it doesn't need to be complete to deserve a room.
