# Specification Map

This document is the inventory of every specification this codebase needs — reasoned from first principles, scoped by what this site actually is.

It exists because a codebase built by agents needs to know what it knows and what it doesn't. Each specification file captures a concern that an agent can't reliably derive from code alone — it requires intent, philosophy, or design rationale. The code implements decisions; the specifications hold the *reasons for* decisions, so that future decisions remain coherent with past ones.

This map was produced through a practice of exhaustive enumeration: starting from the domain of all possible website concerns, then scoping down by the constraints of Danny's site. It is meant to be critically evaluated, revised, and kept alive. If a specification exists that isn't on this map, the map is wrong. If this map names a specification that doesn't exist yet, that's a known gap — not necessarily a task.

---

## Reading Order

The agentic surface has a directed reading order — not a list but a graph. The structure determines which context is present when each file is encountered, and that context shapes how the file is understood. An agent arriving at `REACT_NORTH_STAR.md` after reading `CLAUDE.md`, `MEDIUM.md`, and `DOMAIN_MODEL.md` understands the fourteen axioms as expressions of care within a specific medium for a specific domain. An agent arriving at it cold sees technical constraints.

### The Entry Sequence

The first four files are genuinely linear. Each prepares ground the next one needs.

```
CLAUDE.md                     The foyer. Who Danny is, how to be here.
  │                           Establishes the lens for everything after.
  │
  ├─→ MEDIUM.md               The ground. What a webpage is — the seven
  │                           dimensions, the agentic surface. You must
  │                           understand the medium before you build in it.
  │
  ├─→ TRANSPARENCY.md         The site's relationship to its own making.
  │                           Reframes everything that follows: specs are
  │                           not just instructions, they are content.
  │
  └─→ SPECIFICATION_MAP.md    This file. The inventory and wayfinding.
                              Now you know what exists, what's missing,
                              and how the concerns are organized.
```

After the entry sequence, the graph forks into two independent roots.

### The Two Trunks

Domain model and design system are parallel concerns. Neither depends on the other. One is semantic — what this site is *about*. The other is material — what this site *looks and feels like*. Both descend directly from the entry sequence, and each has its own descendants.

```
                    ┌─────────────────────────┐
                    │     Entry Sequence       │
                    │  CLAUDE → MEDIUM →       │
                    │  TRANSPARENCY → MAP      │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
          The Semantic Root                The Material Root
                 │                               │
          DOMAIN_MODEL.md                 DESIGN_SYSTEM.md
          Rooms, facets, works,           Why umber, why serif,
          modes, relationships.           why paper grain. The
          (gap — currently split          aesthetic philosophy
          across CLAUDE.md and            made operational.
          DANNY_FOUNDATION.md)            (gap)
                 │                               │
       ┌─────────┼──────────┐          ┌─────────┼──────────┐
       │         │          │          │         │          │
       ▼         ▼          ▼          ▼         ▼          ▼
   CONTENT   INFO_ARCH  GRAPH &    VOICE &   INTER-    MEDIA
   SCHEMA    .md        LINKING    COPY.md   ACTION    STRATEGY
   .md                  .md                  DESIGN    .md
   Works as  How rooms  The one-   How the   .md       Images,
   data.     become     graph      site      Motion,   audio,
   Front-    navigation commitment speaks.   time,     video
   matter,   — URLs,    made       Micro-    choreo-   pipeline.
   types,    wayfinding,concrete.  copy      graphy.
   directory the        Backlinks, register. Dark mode
   structure.visitor's  facet               as dimming.
             journey.   threading.
       │                    │
       ▼                    │
   CONTENT                  │
   AUTHORING.md             │
   Danny's workflow.        │
   How works enter          │
   the site.                │
                            │
       ┌────────────────────┘
       │
       │  (GRAPH_AND_LINKING depends on both
       │   DOMAIN_MODEL and CONTENT_SCHEMA —
       │   it sits at their intersection)
```

### The Confluence

The component architecture is where the two trunks meet. It can't be understood without both the semantic root (what are we building *for*) and the material root (what does it *feel* like). This is the most-connected node in the graph.

```
   DOMAIN_MODEL ──────┐
                      ▼
               REACT_NORTH_STAR.md
               How domain and design become
               code. Axioms, atoms, dependency
               law, threshold system.
                      ▲
   DESIGN_SYSTEM ─────┘
```

### Contracts

Technical contracts draw from both trunks and the confluence. They don't form a sequence — they're parallel leaves, each rooted in whichever upstream concerns they constrain.

```
   REACT_NORTH_STAR + INTERACTION_DESIGN ──→ PERFORMANCE_BUDGET.md
   REACT_NORTH_STAR + DESIGN_SYSTEM ───────→ ACCESSIBILITY.md
   DESIGN_SYSTEM + REACT_NORTH_STAR ───────→ RESPONSIVE_STRATEGY.md
   CONTENT_SCHEMA + INFO_ARCHITECTURE ─────→ SEO_AND_META.md
   REACT_NORTH_STAR ──────────────────────→ TESTING_STRATEGY.md
   (minimal dependencies) ────────────────→ SECURITY.md
```

### Operations

The outermost layer. These are meaningful only after the intent they serve is understood.

```
   REACT_NORTH_STAR ──────→ DEPLOYMENT.md
   REACT_NORTH_STAR ──────→ DEPENDENCY_POLICY.md
   (all of the above) ────→ EVOLUTION_PROTOCOL.md
```

### How to Navigate

**The entry sequence is the one path everyone walks.** Soul → medium → self-knowledge → map. Non-negotiable, always linear, always first.

**After the entry sequence, follow the trunk you need.** Working on content structure? Follow the semantic root: domain model → content schema → content authoring. Working on visual language or motion? Follow the material root: design system → interaction design → voice. Working on components? You need both trunks first — domain model and design system — before the architecture file makes full sense.

**Contracts and operations are read when relevant**, not in sequence. An agent working on accessibility reads the entry sequence, then design system, then component architecture, then the accessibility spec. An agent working on deployment reads the entry sequence, then component architecture, then deployment. The graph tells you which upstream files prepare the ground for any given concern.

**The entry point is always CLAUDE.md.** Every agent session begins there. The graph defines the dependency structure — which files prepare ground for which other files — not a mandatory linear path through all twenty-three documents.

---

## The Complete Set

### Tier 0 — The Ground

Before any specification about *this* site, there are two foundational questions: what is a webpage, and what is this site's relationship to its own making? The first is ontological — the medium has dimensions that exist whether or not we attend to them. The second is architectural — this site publishes its own definition as part of itself, making the specifications not just build instructions but a visible, navigable, temporal layer of the experience.

| # | File | Status | Purpose |
|---|---|---|---|
| 0a | `MEDIUM.md` | **Exists** | The epistemography of the webpage as a medium. Names the seven dimensions — hypertextuality, temporality, responsiveness, addressability, semantic structure, social existence, materiality — and traces how each specification inhabits them. This is the philosophical ground beneath the map: not what *this* site is, but what *any* webpage is, so that every downstream decision inherits the right assumptions about the medium it's working in. |
| 0b | `TRANSPARENCY.md` | **Exists** | The site's commitment to publishing its own definition. Every specification lives two lives: as an agentic interface (instructing the agent that builds) and as published content (a visible stratum of the site itself). Defines the strata model, temporal archaeology (navigating the site's self-understanding through git history), configuration-as-content, and the annotation system that connects surface elements to their specification origins. This document makes the specification map not just an internal inventory but part of what the site gives to its visitors. |

### Tier 1 — Soul and Structure

These files define what the site *is*. Without them, an agent is building blind.

| # | File | Status | Purpose |
|---|---|---|---|
| 1 | `CLAUDE.md` | **Exists** | How to *be* while building here. Agent behavior, project soul, the felt sense of the work. This is the file the agent reads first and carries throughout. It holds Danny's voice, the practice of spanda, the philosophy of enough. |
| 2 | `DOMAIN_MODEL.md` | **Gap** | The semantic architecture — rooms, facets, works, modes, and their relationships as a conceptual system. Currently split between `CLAUDE.md` (which holds the poetic description) and `DANNY_FOUNDATION.md` (which holds a tabular version with stale open questions). Neither is canonical. This file should be the single source of truth for what a room *is*, what a facet *means*, what a work *contains*, and how they relate. |
| 3 | `COMPONENT_ARCHITECTURE.md` | **Exists as `REACT_NORTH_STAR.md`** | The atomic hierarchy, dependency direction law, threshold system, state decisions, hook taxonomy, and testing architecture. Currently comprehensive at ~31K bytes. Also partially covers concerns that belong to #16 (Testing), #19 (Dependencies), and #12 (Performance). |
| 4 | `SPECIFICATION_MAP.md` | **This file** | The inventory of specifications themselves — what exists, what's missing, what's deferred, and why. The meta-architectural concern. |

### Tier 2 — Content and Expression

These files define what goes *in* the site and how it gets there.

| # | File | Status | Purpose |
|---|---|---|---|
| 5 | `CONTENT_SCHEMA.md` | **Gap** | Works as data. Frontmatter shape, file naming conventions, directory structure for content files, content types (poem, essay, case study, note), required vs. optional fields, how facets are encoded, how room assignment works. This is the bridge between the domain model ("works live in rooms and carry facets") and the component architecture ("containers call one orchestration hook and render one organism"). Without it, an agent has vision on one side and plumbing on the other, with no pipe between them. |
| 6 | `DESIGN_SYSTEM.md` | **Gap** | The visual language and its rationale. Not just the token values (those live in `tokens.css`) but *why* umber, *why* serif, *why* paper grain. The aesthetic philosophy that guides every visual decision — materiality, structural warmth, the kind of warmth you feel in a space where someone chose every surface with care and then didn't mention it. Palette, typography, spacing, the Diamond and Ornament vocabulary, how these compose into the site's visual identity. This is probably the second-most-important file after `CLAUDE.md`. |
| 7 | `VOICE_AND_COPY.md` | **Gap** | How the site speaks in its own voice — not in Danny's works, but in navigation labels, button text, empty states, error messages, page titles, meta descriptions. The microcopy register. A site that "opens a door and stands back" speaks differently than one that leans forward. This file defines that speech. |
| 8 | `CONTENT_AUTHORING.md` | **Gap** | Danny's workflow for creating and publishing works. How he writes (in-repo? external tool?), how drafts become published, whether there's a preview system, what "seasonal" means for the Garden operationally, how the content pipeline supports the practice of "this is enough, this can exist now." This is the specification of Danny's interface to his own site. |

### Tier 3 — Spatial and Navigational

These files define how visitors move through the site and how content connects.

| # | File | Status | Purpose |
|---|---|---|---|
| 9 | `INFORMATION_ARCHITECTURE.md` | **Gap** | Navigation model, URL design, room-to-route mapping, the visitor's journey from arrival through orientation to wandering to deepening. How the house metaphor manifests in actual wayfinding. Some of this is implied by the existing route structure (`/studio`, `/garden`, etc.) but the *intent* behind the structure — what each room's landing page contains, how a visitor discovers works within a room, how rooms invite you into adjacent rooms — isn't specified anywhere. |
| 10 | `GRAPH_AND_LINKING.md` | **Gap** | The "one graph" commitment made concrete. How backlinks work, how a poem links to a case study, how facets create navigable threads across rooms, what prevents the graph from becoming noise as it grows. This is architecturally significant — "everything is one graph" is a core promise in `CLAUDE.md`, but no specification exists for how it's implemented or maintained. Includes the ontological question: what can link to what, and what does a link *mean*? |
| 11 | `INTERACTION_DESIGN.md` | **Gap** | Motion, transitions, scroll behavior, pace, and dark mode as a room dimming. The temporal/kinetic design language. This site uses time as a material — slow transitions, scroll reveals that feel like rooms opening, a geometric figure that takes a full minute to rotate. This file specifies the choreographic vocabulary: easing curves, duration philosophy, stagger patterns, how motion serves the feeling of place rather than performing delight. Dark mode lives here — it's a transition experience, not a toggle. |

### Tier 4 — Technical Contracts

These files define commitments and constraints that shape implementation.

| # | File | Status | Purpose |
|---|---|---|---|
| 12 | `PERFORMANCE_BUDGET.md` | **Gap** | Core Web Vitals targets, bundle size limits, image and font loading strategy, what "slow on purpose" means technically (slow transitions are intentional; slow page loads are not). The tension between a site that uses duration as a design material and a site that must still feel responsive. |
| 13 | `ACCESSIBILITY.md` | **Gap** | WCAG 2.1 AA commitments, keyboard navigation patterns, screen reader behavior, reduced-motion alternatives, focus management, ARIA live regions for dynamic content. `REACT_NORTH_STAR.md` mentions accessibility requirements briefly; this file owns them fully. A site that "gives" must give to everyone. |
| 14 | `RESPONSIVE_STRATEGY.md` | **Gap** | How rooms translate across viewports. Breakpoints, mobile behavior, touch interactions, print styles. For a site about poetry and essays with a "paper on the walls" aesthetic, print rendering is a first-class concern — a poem should print as beautifully as it renders. Browser support matrix lives here too. |
| 15 | `SEO_AND_META.md` | **Gap** | Open Graph tags, structured data, social card design, sitemap generation, RSS/Atom syndication. How the site presents itself to machines and link previews. For a poet-essayist, syndication (RSS) matters — readers should be able to subscribe. How each room and work generates its own meta representation. |
| 16 | `TESTING_STRATEGY.md` | **Partially covered in `REACT_NORTH_STAR.md`** | What to test, what not to test, coverage philosophy, the layer-by-layer approach (domain → hooks → components → integration → E2E). Currently a section within `REACT_NORTH_STAR.md`. May not need its own file if that section is sufficient — but if testing judgment needs more space than a section affords, it wants its own home. |
| 17 | `SECURITY.md` | **Gap** | Content Security Policy, dependency auditing stance, data handling (the site likely collects nothing, but that decision should be explicit), privacy posture. Lighter for a static content site but still a real concern. |

### Tier 5 — Operations and Evolution

These files define how the site is built, deployed, and grows over time.

| # | File | Status | Purpose |
|---|---|---|---|
| 18 | `DEPLOYMENT.md` | **Gap** | Build pipeline, hosting platform, CI/CD configuration, environments (dev/staging/production), DNS, SSL, CDN, caching strategy, environment variables. Where the site lives and how it gets there. |
| 19 | `DEPENDENCY_POLICY.md` | **Partially covered in `REACT_NORTH_STAR.md`** | When to add a dependency, evaluation criteria, update cadence, the philosophical stance on the supply chain. `REACT_NORTH_STAR.md` lists the non-negotiable stack; this file (if separate) would cover the *judgment framework* for future additions. May be sufficient as a section in the architecture doc. |
| 20 | `EVOLUTION_PROTOCOL.md` | **Gap** | How the codebase grows over time. Refactoring triggers (already partially in `REACT_NORTH_STAR.md` as the "Evolution Protocol" section), migration patterns, how new rooms or content types would be added, what "living over finished" means for the codebase itself. The site grows like a garden — this file says how you tend it. |
| 21 | `MEDIA_STRATEGY.md` | **Gap** | Images, audio, video — formats, optimization, CDN delivery, alt text philosophy, responsive images. The Salon is the cellist's son's room; audio is potentially a first-class medium. This file specifies how non-text media is handled across the pipeline from authoring to delivery. |

---

## Current State Assessment

**What exists today:**

| File | Covers | Gaps / Issues |
|---|---|---|
| `CLAUDE.md` | #1 (Soul), partial #2 (Domain), partial #6 (Aesthetic) | Overlaps with `DANNY_FOUNDATION.md` on domain model. Aesthetic intent is beautifully expressed but not operationalized into design decisions. |
| `DANNY_FOUNDATION.md` | Partial #2 (Domain) | Contains stale open questions that are already answered (tech stack, navigation). Tabular content model overlaps with `CLAUDE.md`'s poetic version. Neither file is canonical for the domain model. This file's role is ambiguous — it reads as a historical artifact rather than a living specification. |
| `REACT_NORTH_STAR.md` | #3 (Components), partial #12 (Performance), partial #13 (Accessibility), partial #16 (Testing), partial #19 (Dependencies) | Comprehensive for component architecture. Partially covers several other concerns as subsections, which may or may not need to be extracted into their own files as the site grows. |

**The overlap problem:**

`CLAUDE.md` and `DANNY_FOUNDATION.md` both describe rooms, facets, works, and design principles. They share the same information in different registers — one poetic, one tabular. An agent reading both receives the concepts twice with slightly different framing and no clear authority hierarchy. The domain model needs one canonical home.

Three options exist:
1. `CLAUDE.md` absorbs the domain model fully (it mostly already has). `DANNY_FOUNDATION.md` is retired or becomes a historical artifact.
2. A new `DOMAIN_MODEL.md` becomes canonical for the semantic architecture. Both `CLAUDE.md` and `DANNY_FOUNDATION.md` defer to it. `CLAUDE.md` keeps the soul; `DOMAIN_MODEL.md` keeps the structure.
3. `DANNY_FOUNDATION.md` is refreshed — stale questions removed, made canonical for domain concerns. `CLAUDE.md` trims its domain content and points to the foundation doc.

This decision is not yet made. It should be made before the content layer is built, because the content schema (#5) depends on a canonical domain model.

---

## Near-Misses

Concerns that were evaluated and intentionally excluded from the primary set, with reasoning:

| Candidate | Why it argued for inclusion | Where it lives instead |
|---|---|---|
| `VISITOR_JOURNEY.md` | The intended experience arc — arrival, orientation, wandering, deepening. Distinct from information architecture (structure) and interaction design (kinetics). This is narrative design. | Section within `INFORMATION_ARCHITECTURE.md`. If the journey design becomes complex enough to fill its own file, it should be promoted. |
| `PRINT_STYLES.md` | For poetry and essays with a "paper on the walls" aesthetic, print is a first-class viewport. | Section within `RESPONSIVE_STRATEGY.md`. Print is another responsive target. |
| `SYNDICATION.md` | RSS/Atom feeds. For a poet-essayist, how content leaves the site matters. | Section within `SEO_AND_META.md`. Another machine-readable output. |
| `VISUAL_IDENTITY.md` | The Diamond, the Ornament, the geometric vocabulary — a distinct design language. | Lives within `DESIGN_SYSTEM.md`. The ornamental vocabulary is part of the visual language, not separate from it. |
| `SEARCH.md` | Content discovery beyond room navigation, especially as the graph grows. | Premature. Relevant at 50+ works, not at 5. Revisit when the content layer is populated. |
| `CACHING_STRATEGY.md` | Service worker, offline-first, CDN rules. | Section within `DEPLOYMENT.md`. Not complex enough for its own file on a static content site. |
| `LEGAL.md` | Privacy policy, content licensing, cookie stance. | A real concern, but it's *content* (a page on the site) rather than architecture. The agent needs a template or a content authoring entry, not a specification. |
| `CONTENT_LIFECYCLE.md` | Draft → review → publish → seasonal rotation. The Garden "grows seasonally" — that's a lifecycle. | Splits between `CONTENT_AUTHORING.md` (Danny's workflow) and `CONTENT_SCHEMA.md` (status fields in frontmatter). |
| `MONITORING.md` | Error tracking, uptime, observability. | Section within `DEPLOYMENT.md`. A personal site doesn't need a separate observability specification. |
| `BROWSER_SUPPORT.md` | What browsers, graceful degradation. | One paragraph within `RESPONSIVE_STRATEGY.md`. |
| `ENV_CONFIG.md` | Environment variables, feature flags, build modes. | Section within `DEPLOYMENT.md`. |
| `STATE_ARCHITECTURE.md` | Client state, server state, URL state boundaries. | Already covered within `REACT_NORTH_STAR.md` (Component Architecture). For a content site with minimal client state, state decisions are component decisions. |
| `DARK_MODE.md` | The transition as experience — pacing, palette shifts, mood. | Lives within `INTERACTION_DESIGN.md`. Dark mode is choreography, not a system. |

---

## Unmapped Territories

Concerns that may not yet have the right name or home. These surfaced during analysis and don't cleanly fit any file above. They're noted here so they aren't lost.

**Temporal design as its own concern.** This site uses time as a material — slow transitions, scroll pace, a geometric figure rotating over a full minute. `INTERACTION_DESIGN.md` covers motion, but *duration as philosophy* might be underspecified there. The site's relationship to time is unusual enough to warrant explicit attention, whether as a dedicated section within interaction design or as something that permeates the design system more broadly.

**The authoring experience as UX.** `CONTENT_AUTHORING.md` covers Danny's workflow, but there's a deeper layer: what does the writing *environment* feel like? Does content hot-reload in development? Is there a preview that captures the site's typography and pacing? Does Danny write in the repo or in a separate tool? This is developer experience design for the site's primary user — someone who is not a developer in this context but a writer returning to voice.

**The graph as knowledge architecture.** `GRAPH_AND_LINKING.md` covers technical linking, but the *ontological* decisions — what can link to what, what does a facet *mean* as a connection type, how do you prevent the graph from becoming noise — live somewhere between domain model and graph specification. That seam needs attention when both files are written.

**Seasonal/temporal content.** The Garden is described as "living, growing, seasonal." Works may have temporal relevance — not lifecycle (draft → published) but something more like *what blooms when*. No specification addresses how time intersects with content visibility, ordering, or presentation. This might want a section in `CONTENT_SCHEMA.md` or might be a dimension of the domain model itself.

---

## How to Use This Map

**For agents:** Before building a feature, check which specifications it touches. If a specification exists, read it. If it's marked as a gap, note that you're making decisions without explicit guidance — proceed with the felt sense from `CLAUDE.md` and flag the gap.

**For Danny:** This map is a place to see the whole. Some gaps are intentional (the site waits for spanda). Some are oversights. Some will resolve themselves when the material is ready. You don't need to fill every gap to build. But knowing where the gaps are means the building stays coherent.

**For revision:** This map should be updated when specifications are created, when gaps are filled, when near-misses are promoted, or when new concerns surface. It is itself a living document — the meta-specification — and it follows the same principle as everything else here: it doesn't need to be complete to deserve a room.
