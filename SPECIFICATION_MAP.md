# Specification Map

This document is the map of the house — every room, hallway, threshold, and plot of ground that the specification layer contains. It names what exists, what's missing, how the pieces connect, and why each one belongs where it does.

It exists because a codebase built by agents needs to know its own shape. Each specification file captures a concern that an agent can't reliably derive from code alone — it requires intent, philosophy, or design rationale. The code implements decisions; the specifications hold the *reasons for* decisions, so that future decisions remain coherent with past ones.

The map is organized spatially, extending the house metaphor that already organizes the site itself. The site has rooms (Foyer, Studio, Garden, Study, Salon). The specification layer has six layers that mirror the anatomy of a house: an **entry sequence** (how you arrive and orient), the **inside** (what the rooms hold), the **outside** (the rooms themselves — surfaces, light, wayfinding), **the house** (where inside and outside become one built thing), **the threshold** (where the house meets the world beyond itself), and **the grounds** (the land, utilities, and maintenance that support everything above). Every specification file maps to one of these layers. The metaphor isn't decorative; it tells you *why* a file belongs where it does, not just that it does.

If a specification exists that isn't on this map, the map is wrong. If this map names a specification that doesn't exist yet, that's a known gap — not necessarily a task. The map is a living document. It follows the same principle as everything else here: it doesn't need to be complete to deserve a room.

---

## The Entry Sequence

The first four files are genuinely linear. Each prepares ground the next one needs. This is the one path every agent walks, every time, before anything else — walking up to the house, entering the foyer, and orienting before you enter any room or pick up any tool.

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
        This file. The map and the wayfinding. Now you know what
        exists, what's missing, and how the concerns are organized.
        From here, the graph forks.
```

**`CLAUDE.md`** | Entry | Exists | Depends on: —
How to *be* while building here. Agent behavior, project soul, the felt sense of the work. Holds Danny's voice, the practice of spanda, the philosophy of enough. This is the file the agent reads first and carries throughout. It is the foyer of the agentic surface.

**`MEDIUM.md`** | Entry | Exists | Depends on: `CLAUDE.md`
The epistemography of the webpage as a medium. Names the seven dimensions — hypertextuality, temporality, responsiveness, addressability, semantic structure, social existence, materiality — and the agentic surface as an eighth. This is the philosophical ground beneath the map: not what *this* site is, but what *any* webpage is, so that every downstream decision inherits the right assumptions about the medium it's working in.

**`TRANSPARENCY.md`** | Entry | Exists | Depends on: `MEDIUM.md`
The site's commitment to publishing its own definition. Every specification lives two lives: as an agentic interface (instructing the agent that builds) and as published content (a visible stratum of the site itself). Defines the strata model, temporal archaeology (navigating the site's self-understanding through git history), configuration-as-content, and the annotation system that connects surface elements to their specification origins. This document makes the specification map not just a builder's reference but part of what the site gives to its visitors.

**`SPECIFICATION_MAP.md`** | Entry | This file | Depends on: `TRANSPARENCY.md`
The map of the house. What exists, what's missing, what's deferred, and why. The reading order graph and the six-layer organizational structure. The meta-architectural concern.

After the entry sequence, the structure branches. What follows is not a list to be read top-to-bottom but a graph to be navigated by need. The two trunks — inside and outside — are parallel and independent. Neither depends on the other. An agent follows whichever trunk its current task requires, or both if working at their intersection.

## Inside — What the Rooms Hold

The inside trunk is the semantic architecture of the site: what a room is, what a work is, what a facet means, how works are encoded as data, how they connect to each other, and how Danny creates them. This is the content, the meaning, the substance that the rooms exist to hold. It forms a self-contained dependency chain — each file depends only on inside files above it. No inside file depends on any outside file.

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

**`DOMAIN_MODEL.md`** | Inside | Exists | Depends on: Entry sequence
The ontology. Rooms, facets, works, modes, and their relationships as a conceptual system. The single source of truth for what a room *is*, what a facet *means*, what a work *contains*, and how they relate. Absorbs the structural content previously split between `CLAUDE.md` (which keeps the soul) and `DANNY_FOUNDATION.md` (retired). Currently covers rooms, works, facets, modes (held architecturally absent), work-to-work relationships, and explicitly defers several downstream concerns to files that will own them.

**`CONTENT_SCHEMA.md`** | Inside | Exists | Depends on: `DOMAIN_MODEL.md`
Works as data. Filesystem convention (`src/content/{room}/{slug}.md`), the Zod-validated frontmatter shape with minimal required fields (`title`, `date`) and richly optional ones (`summary`, `facets`, `type`, `draft`), content types as rendering hints, draft handling as a frontmatter flag, body as GitHub-flavored markdown with MDX held as a per-file option, build-time loading via `import.meta.glob`, and explicit deferrals for media, link syntax, and series/collections.

**`GRAPH_AND_LINKING.md`** | Inside | Exists | Depends on: `DOMAIN_MODEL.md` + `CONTENT_SCHEMA.md`
The "one graph" commitment made concrete. Wikilinks (`[[slug]]`, `[[room/slug]]`, with `|display` override) for within-site links; standard markdown for external. Unresolved wikilinks fail the build. Backlinks computed at build time, surfaced quietly in the outward invitation. The outward invitation specified as facet threads + backlinks + guaranteed return-to-room. Graph noise resistance held as cultural practice rather than enforced limit. Visible graph surface held as a future possibility whose data is already produced.

**`CONTENT_AUTHORING.md`** | Inside | Exists | Depends on: `CONTENT_SCHEMA.md`
Danny's workflow. Writing happens in the repository in markdown, with `pnpm dev` as the preview (drafts and future-dated works visible) and `pnpm build` as the public site (drafts and future excluded). The smallest valid work is two frontmatter fields and a body. Names the costs of editing each field (titles free, slugs costly, dates sensitive), declines a CMS / staging environment / publish button / scheduling UI, and notes that deletion is rare — drafting is preferred over deleting.

## Outside — The Rooms Themselves

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

**`DESIGN_SYSTEM.md`** | Outside | Exists | Depends on: Entry sequence
The visual language and its rationale. Not just the token values (those live in `tokens.css`) but *why* umber, *why* serif, *why* paper grain. Holds the "warmth over polish" anchor, materiality (paper / grain / shadow / border), the umber palette with one primary accent and four held accents, typography (Literata + Newsreader), space and rhythm, a motion gesture (full vocabulary deferred to `INTERACTION_DESIGN.md`), and the ornamental vocabulary (Diamond, Ornament).

**`VOICE_AND_COPY.md`** | Outside | Exists | Depends on: `DESIGN_SYSTEM.md`
How the site speaks in its own voice — not in Danny's works, but in nav labels, room descriptions, work-page chrome (kicker, metadata, outward invitation), facet pages, errors, and empty states. Names the register (quiet, italic, second-voice, never performative), surface-by-surface conventions, microcopy rules (em-dash rhythm, no exclamation points, present tense, no first-person plural), declinations (no CTAs, no social proof, no urgency language, no emoji in chrome), and the bracket-plus-`text-3` draft pattern for placeholder copy.

**`INTERACTION_DESIGN.md`** | Outside | Exists | Depends on: `DESIGN_SYSTEM.md`
Motion as material. Names the four current durations (200ms hover, 500ms theme, 600ms reveal, 60s spin), the signature easing curve (`cubic-bezier(0.23, 1, 0.32, 1)` for arrivals; default for change), the Reveal pattern, dark mode as room dimming with the no-flash-of-wrong-theme invariant, hover and focus restraint, the geometric figure as ambient pulse, and reduced-motion as a known gap to honor. Declines page transitions for now while reserving architectural ground.

**`INFORMATION_ARCHITECTURE.md`** | Outside | Exists | Depends on: `DESIGN_SYSTEM.md` + `DOMAIN_MODEL.md`
The hallways and doors. Names the four registers (arrival, orientation, wandering, deepening) and maps each to a surface. Specifies URL design (`/`, `/{room}`, `/{room}/{slug}`, `/facet/{facet}`), the sticky text-only nav with the wordmark as home, room-landing shape, the Foyer's composition, work-page anatomy with the no-dead-ends commitment, facet chips + facet pages grouped by room, and error/empty-state behavior. Holds search and the graph-view surface as deferred concepts; holds the time-slider location in the nav top-right.

## The House — Where Inside Meets Outside

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

**`REACT_NORTH_STAR.md`** | The House | Exists | Depends on: `DOMAIN_MODEL.md` + `DESIGN_SYSTEM.md`
The component architecture. The fourteen axioms, atomic hierarchy, dependency direction law, threshold system, state decisions, hook taxonomy. Currently comprehensive at ~31K bytes. Also partially covers concerns that belong to the threshold (performance budget, accessibility) and the grounds (testing strategy, dependency policy) — these subsections may or may not need to be extracted into their own files as the site grows. The architecture file is where an agent learns how to *build* after learning what to build (inside) and what it should feel like (outside).

## The Threshold — Where the House Meets the World

Every file in this layer is a boundary concern: the house interfacing with something beyond itself. These are not internal decisions about what the site is or how it's built — they are commitments about how the site meets other bodies, other devices, other machines, hostile actors, and the constraint of time. They are parallel leaves, not a chain. Each draws from whichever upstream files it constrains, but they do not depend on each other.

The word *threshold* is precise. A threshold is the strip of floor at the bottom of a doorway — the boundary between the house and what's beyond it. Accessibility is literally about the threshold being passable by all bodies. Performance is about the threshold not making you wait. SEO is about the threshold being legible from the street. Responsive design is about the threshold adapting to how you arrive. Security is about the threshold being safe.

```
REACT_NORTH_STAR + INTERACTION_DESIGN
  └─→ PERFORMANCE_BUDGET.md
        The house meeting expectations of responsiveness.

REACT_NORTH_STAR + DESIGN_SYSTEM
  └─→ ACCESSIBILITY.md
        The house meeting all bodies.

DESIGN_SYSTEM + REACT_NORTH_STAR
  └─→ RESPONSIVE_STRATEGY.md
        The house meeting all viewports.

CONTENT_SCHEMA + INFORMATION_ARCHITECTURE
  └─→ SEO_AND_META.md
        The house meeting machines.

(minimal upstream dependencies)
  └─→ SECURITY.md
        The house meeting the hostile world.
```

**`PERFORMANCE_BUDGET.md`** | Threshold | Exists | Depends on: `REACT_NORTH_STAR.md` + `INTERACTION_DESIGN.md`
The house meeting expectations of responsiveness. Web Vitals targets (LCP ≤ 1.5s, INP ≤ 100ms, CLS ≤ 0.05), bundle-size targets (100KB JS gzipped, 15KB CSS), current-state measurement, and the explicit SSG pivot to TanStack Start as the chosen path to hit targets. Names what counts as intentional slowness vs. unintentional. Font loading, image handling budgets, and monitoring strategy.

**`ACCESSIBILITY.md`** | Threshold | Exists | Depends on: `REACT_NORTH_STAR.md` + `DESIGN_SYSTEM.md`
The house meeting all bodies. WCAG 2.1 AA baseline. User preferences (`prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`) as first-class invariants. Keyboard navigation with skip link, semantic HTML with landmarks, color contrast audited per token, screen-reader patterns, custom `:focus-visible` ring. Known gaps held in the backlog.

**`RESPONSIVE_STRATEGY.md`** | Threshold | Exists | Depends on: `DESIGN_SYSTEM.md` + `REACT_NORTH_STAR.md`
The house meeting all viewports. The single 700px column as the one layout, zero explicit breakpoints today, minimum 44×44 touch-target commitment, hover-state mitigations for touch devices, browser support tiers, high-DPI handling, and print as a first-class surface (held in backlog — print stylesheet not yet written).

**`SEO_AND_META.md`** | Threshold | Exists | Depends on: `CONTENT_SCHEMA.md` + `INFORMATION_ARCHITECTURE.md`
The house meeting machines. Per-page title/meta patterns, Schema.org JSON-LD for `WebSite` / `Person` on every page and `CreativeWork`-family + `BreadcrumbList` on work pages (implemented via `src/shared/seo/`), Open Graph image generation (held), sitemap and feeds (held), `robots.txt` (held). Most surface-level items are cheaper on the other side of the SSG pivot.

**`SECURITY.md`** | Threshold | Gap | Depends on: Minimal upstream
The house meeting the hostile world. Content Security Policy, dependency auditing stance. Privacy is now split into its own file (`PRIVACY.md`); this one remains a gap focused on threat posture. Lighter for a static content site but the posture still needs to be named — the absence of data collection is itself a design decision worth declaring.

**`PRIVACY.md`** | Threshold | Exists | Depends on: Minimal upstream
The site's relationship to visitor data. Declines all personal-data collection, cookies (except a `theme` localStorage entry), third-party trackers, fingerprinting, session replay. Commits to aggregate-only, IP-non-retained, privacy-respecting Web Vitals when analytics eventually wires. Names a known privacy leak (Google Fonts) with a clear path to self-hosting in the backlog.

## The Grounds — What Supports the House

The grounds are everything that supports the house without being the house itself: the land it sits on, the utilities, the workshop for preparing materials, the inspection regime, the master plan for future additions. These files are meaningful only after the intent they serve is understood — an agent reading `DEPLOYMENT.md` before `CLAUDE.md` would make technically sound decisions that miss the point. The word *grounds* is deliberate — it encompasses both the land a house is built on and the ongoing tending ("keeping up the grounds").

```
REACT_NORTH_STAR
  ├─→ DEPLOYMENT.md
  │     The land. Where the house physically lives.
  │
  ├─→ DEPENDENCY_POLICY.md
  │     The supply chain. What materials, how chosen.
  │
  └─→ TESTING_STRATEGY.md
        The inspection regime. What to verify, how.

CONTENT_SCHEMA + DESIGN_SYSTEM
  └─→ MEDIA_STRATEGY.md
        The workshop. Non-text materials prepared
        and delivered.

(all of the above)
  └─→ EVOLUTION_PROTOCOL.md
        The master plan. How the house grows over time.
```

**`DEPLOYMENT.md`** | Grounds | Gap | Depends on: `REACT_NORTH_STAR.md`
The land. Build pipeline, hosting platform, CI/CD configuration, environments (dev/staging/production), DNS, SSL, CDN, caching strategy, environment variables. Where the house physically lives and how it gets there. Depends on the component architecture because deployment is shaped by what's being deployed — static generation, bundle strategy, environment needs.

**`DEPENDENCY_POLICY.md`** | Grounds | Partially covered in `REACT_NORTH_STAR.md` | Depends on: `REACT_NORTH_STAR.md`
The supply chain. When to add a dependency, evaluation criteria, update cadence, the philosophical stance on third-party code. `REACT_NORTH_STAR.md` lists the non-negotiable stack; this file (if separate) would cover the *judgment framework* for future additions. May remain a section within the architecture doc if a section is sufficient — the concern is real but may not need its own room.

**`TESTING_STRATEGY.md`** | Grounds | Partially covered in `REACT_NORTH_STAR.md` | Depends on: `REACT_NORTH_STAR.md`
The inspection regime. What to test, what not to test, coverage philosophy, the layer-by-layer approach (domain → hooks → components → integration → E2E). Currently a section within `REACT_NORTH_STAR.md`. Wants its own home only if testing judgment needs more space than a section affords.

**`MEDIA_STRATEGY.md`** | Grounds | Gap | Depends on: `CONTENT_SCHEMA.md` + `DESIGN_SYSTEM.md`
The workshop. Images, audio, video — formats, optimization, CDN delivery, alt text philosophy, responsive images. The Salon is the cellist's son's room; audio is potentially a first-class medium. This file bridges inside (content) and outside (design) at the infrastructure level: how non-text materials are prepared, optimized, and delivered. Depends on the content schema (what media types exist in the content model) and the design system (how media is presented).

**`EVOLUTION_PROTOCOL.md`** | Grounds | Gap | Depends on: All of the above
The master plan. How the codebase grows over time. Refactoring triggers (already partially in `REACT_NORTH_STAR.md` as the "Evolution Protocol" section), migration patterns, how new rooms or content types would be added, what "living over finished" means for the codebase itself. The site grows like a garden — this file says how you tend it. This is the capstone of the entire graph: the one file that needs every other file's context to make sense, because it specifies how the whole system evolves.

---

---

## How to Navigate

**The entry sequence is the one path everyone walks.** Soul → medium → self-knowledge → map. Non-negotiable, always linear, always first.

**After the entry sequence, follow the trunk you need.** Working on content structure? Follow the inside: domain model → content schema → content authoring. Working on visual language or motion? Follow the outside: design system → interaction design → voice. Working on components? You need both trunks — domain model and design system — before the architecture file at their intersection makes full sense.

**The threshold and grounds are read when relevant**, not in sequence. An agent working on accessibility reads the entry sequence, then design system, then component architecture, then the accessibility spec. An agent working on deployment reads the entry sequence, then component architecture, then deployment. The graph tells you which upstream files prepare the ground for any given concern.

**The entry point is always CLAUDE.md.** Every agent session begins there. The graph defines dependency structure — which files prepare ground for which other files — not a mandatory path through all twenty-three documents.

---

## The Agentic Surface: Skills

The specs above are a **reference layer** — dense, authoritative, organized for coherence. They are the right shape for an agent that needs to understand *why* something is the way it is.

Alongside the specs, the repo carries a **task-orientation layer** at [`.claude/skills/`](./.claude/skills/). Each skill is an *orientation toward an outcome Danny has requested* — a persistent bundle of the right specs, practices, and sensibilities to bring to that kind of work. Skills are not task-step walkthroughs; they are the context an agent needs to do right work of a certain kind, loaded as core memory when Danny names the outcome.

The five outcomes today:

| Skill | The outcome Danny is requesting | Primary specs it orients to |
|---|---|---|
| [`coding`](./.claude/skills/coding/SKILL.md) | Writing, modifying, or reviewing code on this site. | `REACT_NORTH_STAR`, `DESIGN_SYSTEM`, `INTERACTION_DESIGN`, `ACCESSIBILITY`, `VOICE_AND_COPY`, `PERFORMANCE_BUDGET`, `RESPONSIVE_STRATEGY` |
| [`writing-prose`](./.claude/skills/writing-prose/SKILL.md) | Authoring a work — poem, essay, case study, note. | `CONTENT_AUTHORING`, `CONTENT_SCHEMA`, `DOMAIN_MODEL`, `GRAPH_AND_LINKING`, `CLAUDE` |
| [`writing-specs`](./.claude/skills/writing-specs/SKILL.md) | Adding or updating a specification file. | `CLAUDE`, `MEDIUM`, `TRANSPARENCY`, `SPECIFICATION_MAP`, `VOICE_AND_COPY` |
| [`architecting`](./.claude/skills/architecting/SKILL.md) | Making a structural decision — domain change, stack pivot, spec reconciliation, or a held tension that needs acknowledgment. | `CLAUDE` (spanda), `DOMAIN_MODEL`, `SPECIFICATION_MAP`, `BACKLOG`, `PERFORMANCE_BUDGET`, `REACT_NORTH_STAR` |
| [`auditing`](./.claude/skills/auditing/SKILL.md) | Running accessibility / performance / SEO canaries, or distinguishing a regression from a known tradeoff. | `ACCESSIBILITY`, `PERFORMANCE_BUDGET`, `SEO_AND_META`, `BACKLOG` |

**The discipline.** Skills bundle; they never duplicate. When a skill and a spec disagree, the spec wins. When a skill grows long, extract the duplicated content back to a spec and reference it from the skill. The skill layer speaks to *orientation* (how to approach this kind of work); the spec layer speaks to *reference* (what the decision actually is). Keeping that distinction honest keeps both useful.

**Why outcomes rather than tasks.** The earlier draft of this layer was five task-oriented skills (`write-a-work`, `add-component`, ...). The current draft replaces them with five *outcome* orientations. The shift matters: Danny requests outcomes, not tasks. "Help me code on this site" loads `coding` — the full orientation, persistent as core memory for the session. Task-level help emerges *inside* that orientation when needed. The outcome-skill surface is smaller and richer; the task-step breakdown lives inside the relevant spec, a click away.

**When to add a new skill.** When a new outcome category surfaces — a kind of work that doesn't fit any of the five above, that Danny requests often enough to warrant its own core memory bundle. Not before.

---

## Current State

**What exists today:**

| File | Status | Notes |
|---|---|---|
| `CLAUDE.md` | Exists | Soul, partial domain model, partial aesthetic. Overlaps with `DANNY_FOUNDATION.md` on the domain model. Aesthetic intent is beautifully expressed but not operationalized into design decisions. |
| `MEDIUM.md` | Exists | Complete for its scope. |
| `TRANSPARENCY.md` | Exists | Complete for its scope. |
| `SPECIFICATION_MAP.md` | Exists | This file. Living document. |
| `REACT_NORTH_STAR.md` | Exists | Comprehensive for component architecture. Partially covers threshold concerns (performance, accessibility) and grounds concerns (testing, dependencies). |
| `DOMAIN_MODEL.md` | Exists | The inside trunk's root. Absorbed the structural content previously held in `DANNY_FOUNDATION.md`. |
| `DESIGN_SYSTEM.md` | Exists | The outside trunk's root. Holds the rationale behind `tokens.css` — warmth over polish, the umber palette, two serifs, materiality. Four non-primary accents named and held. |
| `CONTENT_SCHEMA.md` | Exists | Works as data. Filesystem-first, Zod-validated frontmatter, minimal required fields, draft as a frontmatter flag, MDX held per-file. No content or loader exists yet — both appear with the first work. |
| `INFORMATION_ARCHITECTURE.md` | Exists | The hallways and doors. The four registers, URL design, the nav and Foyer, room landings, work pages with no dead ends, facet surfaces, error and empty states. Work and facet routes noted as gaps until content arrives; a 404 route and empty-room invitation can be built before. |
| `GRAPH_AND_LINKING.md` | Exists | The one graph, made concrete. Wikilink syntax, build-time resolution, backlinks, the outward invitation, graph noise resistance as cultural practice. No code yet — the graph arrives with the first work. |
| `VOICE_AND_COPY.md` | Exists | The site's speaking voice (the house's voice, not the works'). Register, surface conventions, microcopy rules, declinations, and the `[bracketed]` draft pattern honored by the 404 and four room descriptions today. |
| `INTERACTION_DESIGN.md` | Exists | Motion as material. The four durations, the signature easing curve, Reveal as reading rhythm, dark mode as room dimming, the geometric figure as ambient pulse. Reduced motion noted as a known gap. |
| `CONTENT_AUTHORING.md` | Exists | Danny's workflow. Write in the repo, `pnpm dev` previews everything including drafts, `pnpm build` publishes only the published. Smallest valid work is two fields and a body. No CMS, no staging, no publish button. |
| `ACCESSIBILITY.md` | Exists | WCAG 2.1 AA baseline with user preferences (`prefers-reduced-motion`, `prefers-color-scheme`) as first-class invariants. Skip link, `:focus-visible` ring, semantic HTML. Known gaps held in `BACKLOG.md`. |
| `RESPONSIVE_STRATEGY.md` | Exists | Single 700px column, no breakpoints today. 44×44 touch-target minimum. Print held in backlog. |
| `PERFORMANCE_BUDGET.md` | Exists | Web Vitals targets. Names the SSG pivot to TanStack Start as the deliberate performance path, held in backlog until the third-work threshold. |
| `SEO_AND_META.md` | Exists | Per-page meta patterns and Schema.org JSON-LD, implemented for every route. Sitemap, feeds, OG images, and robots.txt held in backlog. |
| `PRIVACY.md` | Exists | Privacy posture for a static content site. Declines tracking, cookies, fingerprinting. Web Vitals forwarding held until a privacy-respecting provider is chosen. |
| `BACKLOG.md` | Exists | Held concerns with trigger conditions. Not a roadmap — a list of work the site knows it owes itself. |

**The domain model overlap: resolved.** `CLAUDE.md` and `DANNY_FOUNDATION.md` previously described rooms, facets, works, and design principles in different registers — one poetic, one tabular. `DOMAIN_MODEL.md` now holds the structural content canonically; `CLAUDE.md` continues to hold the soul. `DANNY_FOUNDATION.md` has been retired; its history remains navigable via git per the archaeological commitment in `TRANSPARENCY.md`.

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

**For agents:** Before building a feature, identify which layer it lives in and which upstream files prepare the ground. Read the entry sequence first (always). Then follow the relevant trunk — inside if the work is about content or domain, outside if it's about design or experience, both if it's about components. If a specification exists, read it. If it's marked as a gap, note that you're making decisions without explicit guidance — proceed with the felt sense from `CLAUDE.md` and flag the gap.

**For Danny:** This map is a place to see the whole. Some gaps are intentional (the site waits for spanda). Some are oversights. Some will resolve themselves when the material is ready. You don't need to fill every gap to build. But knowing where the gaps are means the building stays coherent.

**For revision:** Update this map when specifications are created, gaps are filled, near-misses are promoted, or new concerns surface. When adding a new file, place it in a layer and declare its upstream dependencies — this integrates it into the reading order graph. The map follows the same principle as everything else here: it doesn't need to be complete to deserve a room.
