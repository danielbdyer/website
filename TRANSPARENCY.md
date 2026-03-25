# Transparency

The specifications in this repository are not documentation *about* the site. They are the site's definition — the deterministic interfaces through which intent enters the system and becomes implementation. An agent reads `DESIGN_SYSTEM.md` and produces visual decisions. It reads `CONTENT_SCHEMA.md` and produces a data layer. The markdown files are upstream of the code the way a score is upstream of a performance. They are the site's haecceity — its thisness — made legible.

This document names a commitment: **the site publishes its own definition as part of itself.** The specifications are not hidden in the repository. They are a visible layer of the site — a transparent veneer through which a visitor can see how the thing they're experiencing came to be what it is.

---

## The Dual Life of a Specification

Every markdown file in this repository lives two lives simultaneously:

**As agentic interface.** The file instructs an agent. It carries intent, rationale, constraint, and philosophy. When the agent builds, it builds *from* these files. The files are not consulted — they are constitutive. The site is what the specifications say it is, enacted by an agent, rendered by a browser. Remove a specification and the corresponding dimension of the site loses its coherence.

**As published content.** The same file, consumed during the build process, becomes part of the site itself. Not as a "docs" section or a developer blog post. As a *layer* — a stratum of intention that is present beneath the interface the way geological strata are present beneath a landscape. A visitor encountering the site sees the surface (the rooms, the works, the warmth). A visitor who looks deeper sees the strata (the specifications that produced that surface). Both are the site. Neither is more real than the other.

This dual life is not a trick or a transparency gimmick. It is the site being honest about what it is: a thing made by a person and an agent in conversation, where the conversation itself — captured in these files — is part of the work.

---

## The Strata

The specifications form layers, each one closer to the surface:

```
┌─────────────────────────────────────────────────┐
│                   The Surface                    │
│         What the visitor sees and feels          │
│        (rooms, works, warmth, pace, light)       │
├─────────────────────────────────────────────────┤
│               Implementation                     │
│     Components, styles, routes, data layer       │
│       (the code that enacts the specs)           │
├─────────────────────────────────────────────────┤
│            Technical Contracts                    │
│   Performance, accessibility, security, testing  │
│     (the constraints the code operates within)   │
├─────────────────────────────────────────────────┤
│          Content and Expression                   │
│    Schema, voice, authoring, design system       │
│      (what goes in the site, how it speaks)      │
├─────────────────────────────────────────────────┤
│           Spatial and Navigational                │
│    Information architecture, graph, interaction   │
│     (how visitors move, how content connects)    │
├─────────────────────────────────────────────────┤
│            Soul and Structure                     │
│    Domain model, component architecture, soul    │
│       (what the site is, how it's built)         │
├─────────────────────────────────────────────────┤
│               The Ground                         │
│        The medium itself, this document          │
│   (what a webpage is, what transparency means)   │
└─────────────────────────────────────────────────┘
```

The site should allow a visitor to descend through these strata. Not by navigating to a hidden section, but through annotation — a quality of the interface that reveals its own making. How this manifests is a design question (overlays, marginalia, a dedicated archaeological view, subtle indicators that a specification exists behind a given surface), but the commitment is architectural: **the build process consumes the specifications not only as instructions but as content to be rendered.**

---

## Temporal Archaeology

The specifications change over time. `DESIGN_SYSTEM.md` will be written, revised, expanded, reconsidered. The domain model will evolve as new rooms or facets emerge. The content schema will deepen as the content layer matures. Each change is a shift in the site's self-understanding.

Git preserves these shifts. Every commit to a specification file is a dated record of what the site believed about itself at that moment. This is already true of any repository — but this site makes that record *navigable*.

**The archaeological layer.** The site publishes not just the current state of its specifications but their history. A visitor can move through time and see:
- When a specification was first written (the moment a concern became explicit)
- How it changed (the evolution of intent)
- What was added, removed, reconsidered (the practice of attention over time)
- The relationship between specification changes and site changes (how intent became implementation)

This is not a changelog. A changelog narrates what happened. The archaeological layer *shows* what the site was — its specifications, its configuration, its self-definition — at any point in its history. The visitor navigates not events but states.

**Forward migration.** The temporal record doesn't just look backward. Because the specifications are deterministic interfaces (they define what the site *is*), viewing an earlier specification state is equivalent to viewing an earlier version of the site's definition. The site reveals itself as a process — not a product with a history, but an ongoing act of becoming that happens to have a present moment.

This resonates with the site's deepest concerns. Danny's facet of *becoming* — "the autotelic unfolding of personhood over time, the forward motion that is revealed rather than achieved" — applies to the site itself. The site is becoming. The archaeological layer makes that becoming visible.

---

## Configuration as Content

The principle extends beyond specification files. Configuration — `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `tokens.css`, `package.json` — also defines what the site is. These files are not administrative overhead. They are decisions:

- The TypeScript strict mode configuration is a decision about rigor.
- The ESLint boundary rules are a decision about architectural discipline.
- The design tokens are a decision about materiality.
- The dependency list is a decision about what the site stands on.

If done carefully, these too can be surfaced — not as raw config files, but as the decisions they represent. The tokens file becomes a visible palette. The dependency list becomes a visible foundation. The boundary rules become a visible architecture diagram. Each configuration file has a human-readable interpretation that is part of the site's self-revelation.

---

## Architectural Implications

This commitment has concrete consequences for how the site is built:

**Build pipeline.** The build process must consume markdown files in two modes: as agent instructions (pre-build, informing how the agent writes code) and as publishable content (build-time, transforming specifications into renderable pages or annotation layers). The same file, two consumption paths.

**Content pipeline.** The specifications enter the content pipeline alongside works. They are not works — they don't live in rooms or carry facets — but they are content. They need their own rendering treatment: typography that reads well for technical prose, a visual language that distinguishes specification content from Danny's creative and reflective work.

**Versioning.** Git history becomes a data source. The build process must be able to read the history of specific files and produce a navigable timeline. This may mean pre-computing specification history at build time, or it may mean an API layer that queries git at request time. The architectural choice depends on the hosting model.

**Annotation system.** The surface layer of the site needs a mechanism for connecting visible elements to their specification origins. A design token in use on the page traces back to `DESIGN_SYSTEM.md`. A navigation pattern traces back to `INFORMATION_ARCHITECTURE.md`. The mechanism (data attributes, an overlay system, marginalia, a dedicated view mode) is a design decision. The commitment to *having* such a mechanism is architectural.

**Snapshot identity.** Each deployable state of the site should carry an identifier that links it to its specification state. This is stronger than a git SHA — it's a declaration that "this build was produced from these specifications at this moment." The archaeological layer uses these identifiers to align site states with specification states.

---

## What This Changes About the Specification Map

The `SPECIFICATION_MAP.md` inventories the specifications as concerns to be captured. This document adds a meta-concern: the specifications are not just instructions for building the site — they are part of what the site publishes. This means:

1. **Every specification must be authored with dual readership in mind.** An agent will read it to build. A visitor will read it to understand. The writing must serve both without compromising either.

2. **The specification map itself is published.** The inventory of what the site knows about itself, what it doesn't yet, and what it's holding — that inventory is part of the site's honesty.

3. **Gaps are visible.** When the specification map marks a concern as a "gap," the site doesn't hide that. An empty stratum is still a stratum. The visitor sees what the site hasn't yet defined, and that absence is itself informative — it's the practice of "not yet" made visible.

4. **The archaeological layer is a new specification concern.** The mechanism by which the site publishes its own history needs its own specification — or it lives here, in this document, as a self-specifying system.

This is the site building a room for its own making. Not a "behind the scenes" section. A permanent, navigable, temporally deep layer of the site that is as much a part of the experience as the poems and essays and case studies. The site's transparency is not a feature. It is a dimension of its character.
