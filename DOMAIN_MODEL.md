# The Domain Model

The site has five rooms and eight threads that cross between them. A **work** — a poem, an essay, a case study, a note, a page that might be any of these — lives in one room and may carry any number of threads. This file names each of those concepts precisely: what they are, what invariants bind them, and where the model deliberately withholds commitment so that future work has room to arrive.

`CLAUDE.md` holds the soul of these concepts — why a room is a room, why the facets are what they are. This file holds the structure. When the two disagree, slow down. Usually the soul is ahead of the structure and the structure needs to catch up.

---

## The Ontology

At the center of the model is the **work**. Every other concept exists to give works a place, a context, and a set of relationships.

```
              ┌──────────┐
              │   Work   │
              └────┬─────┘
                   │ lives in exactly one
                   ▼
              ┌──────────┐        ┌──────────┐
              │   Room   │        │  Facet   │
              └──────────┘        └──────────┘
                                  carried by works,
                                  zero or more each,
                                  drawn from a closed set
```

A work is the unit of content. It lives in exactly one room. It carries zero or more facets — threads that cut across rooms, letting a visitor follow a dimension of Danny's life from one room into another.

**Modes** — a separate register for *how* a work expresses itself rather than *what* it's about — are held conceptually but not yet modeled. They are named below and left architecturally absent until they are needed.

---

## Rooms

There are five rooms. The set is closed. A sixth room is a domain change, not a content decision — it expands what the site *is* and belongs to the practice described in `EVOLUTION_PROTOCOL.md` when that file exists.

Each room is an atmosphere as much as a category. The room a work lives in is the room whose atmosphere the work most belongs to — not the only room where its concerns appear. A poem about leadership lives in the Garden and carries the `leadership` facet. A case study about attention lives in the Studio and carries `consciousness`. The room is the home; the facets are the reaches.

| Room | What it holds |
|---|---|
| **Foyer** | The entry. Who Danny is, how to orient, the invitation inward. The Foyer contains no works in the ordinary sense — it is the room that introduces the house. |
| **Studio** | Professional and technical work. Engineering, leadership, craft-as-devotion. Professionally legible but not corporate. |
| **Garden** | Poetry. Living, growing, seasonal. Work that breathes. |
| **Study** | Personal essays and philosophy. The quiet room with good light. |
| **Salon** | Music, aesthetics, art. Where beauty circulates between people. The cellist's son's room. |

### Invariants

- A work lives in **exactly one** room. No work is co-owned by two rooms; a work that feels like it belongs in two is usually a work that belongs in one and reaches into the other via a facet or a link.
- **Do not scaffold around the Foyer's current emptiness.** The Foyer does not today hold works, and code that iterates works-by-room may return an empty set for the Foyer. Treat that as a genuine empty set, not a special case — no `if (room === 'foyer') { /* skip */ }` branches, no separate code paths for the Foyer as "the weird room." The possibility of a Foyer work — a letter, an introduction rendered as a work, a portrait-as-work — is intentionally left open; nothing in the model should need to change to welcome such a work when it arrives.
- Rooms do not nest. There are no sub-rooms. A room that grows too large becomes a signal to reconsider whether a new dimension of Danny's life wants naming, not a signal to subdivide.

---

## Works

A **work** is the unit of content — the named thing that occupies a room. A poem is a work. An essay is a work. A case study is a work. A short note is a work. A work is addressable (it has a URL), it carries its own identity, and it deserves to persist. A piece of content that doesn't deserve to persist isn't a work — it's decoration.

The domain model does not yet specify what a work contains as data. That is the concern of `CONTENT_SCHEMA.md` (currently a gap). This file names only what a work *is* — the conceptual shape that the schema will later encode.

### What a work has

- **A room.** Exactly one. See above.
- **A title.** Every work can be named. A work that cannot be named is not yet ready to be a work.
- **A body.** The substance — the poem, the essay, the argument, the figure. The body can be any medium the Salon or Studio eventually supports (text today; audio and image held as concerns in `MEDIA_STRATEGY.md`).
- **Zero or more facets.** See below.
- **A position in time.** Every work exists at a moment. Whether that moment is authored date, published date, or something more specific to the room (the Garden's "seasonal") is a schema question, not a domain question.
- **An address.** Every work has a URL. This is non-negotiable — addressability is one of the seven dimensions named in `MEDIUM.md`, and a work that cannot be linked to cannot participate in the graph.

### What a work does not have

- **Categories within a room.** A poem is not a "lyric poem vs. prose poem." If those distinctions eventually matter, they matter as facets or as a new content-type axis defined in the schema — not as buckets within the Garden.
- **A status that determines placement.** Drafts, in-progress works, and seasonal rotations are lifecycle concerns that belong to `CONTENT_AUTHORING.md` and `CONTENT_SCHEMA.md`. A work is a work regardless of whether it is currently visible.
- **Hierarchy.** There are no parent-works or child-works. A work may link to other works; it does not contain them.

---

## Facets

A **facet** is a cross-room thread — a dimension of Danny's life that shows up across rooms and that a visitor can follow from one room into another. Facets are how the site holds the fact that Danny is not one thing without reducing that fact to a taxonomy.

A facet is not a tag. A tag describes what a work is about; a facet describes which of Danny's movements through the world the work belongs to. "Kubernetes" would be a tag. `craft` is a facet. The difference matters: tags proliferate with content, facets stay constant and deepen.

The facet set is **closed** in the sense that a work can only carry facets from the list below — eight facets, each chosen deliberately. The set is **open to proposal**: a new facet can enter the site, but only by being named, argued for, and added to this file. Adding a facet is a domain change, not a content decision, and it should be rare. A working heuristic: if something wants to be a facet, sit with it for a season before promoting it.

### The eight

| Facet | What it holds |
|---|---|
| **craft** | How things are made. The care in the making. Technique, tools, the hand and the material. |
| **consciousness** | Awareness, interiority, presence. The inner life examined. |
| **language** | Words as medium, as music, as meaning-making. The love of what language can do. |
| **leadership** | Building containers for others. Management philosophy, organizational thinking, the craft of leading. |
| **beauty** | The aesthetic dimension. What moves us and why. Not decoration — encounter. |
| **becoming** | The autotelic unfolding of personhood over time. Not awareness (that's `consciousness`), not thinking about it — the actual forward motion of a person revealing themselves to themselves. |
| **relation** | The space between. Authentic Relating, management-as-container, meaning-philosophy. The interpersonal ground where two can become. |
| **body** | The gymnast, the stutterer who found theater, muscle memory before thought. Consciousness without body floats — this is the ground. |

### Invariants

- A work carries **zero or more** facets. Zero is legitimate — some works belong to a room without carrying a cross-room thread. Many is legitimate — a work that genuinely moves through multiple facets should carry them all.
- Facets are **unordered**. A work's facets are a set, not a list. If one facet is primary and another secondary, that distinction is editorial, not structural, and it lives in the writing, not in the data.
- Facets do not belong to rooms. Any facet may appear in any room. A facet's presence in multiple rooms is the whole point; restricting a facet to one room would collapse it back into a category.
- Facets are not hierarchical. There are no parent-facets or sub-facets. `leadership` does not contain `craft`; they overlap, and that overlap is carried by individual works, not by the facet structure itself.

---

## Modes

A **mode** is a register — a way in which a work expresses itself, rather than a dimension of what it's about. Facets answer *what*. Modes answer *how*. A poem about leadership is in the `leadership` facet; whether it reads as devotional practice or as play is a mode.

Two modes are currently held:

- **devotion** — The quality of sustained attention. What the cellist parents modeled. The register, not the output. Craft can be devotional, but devotion can also be stillness.
- **play** — The gearless mode. Integration through non-orchestration. The anti-calcification agent that keeps the system from becoming another thing to live up to.

### Status: architecturally absent

Modes are named here so that their eventual arrival has a place to land, but they are **not yet modeled**. `shared/types/common.ts` exports `Room` and `Facet` and does not export `Mode`. The content schema (when it is written) should not require a mode field. No part of the codebase should currently branch on mode.

This absence is deliberate. Modes are a layer that might modify how a work is *presented*, not what it contains — and we do not yet know enough about presentation to know what modes should do. When a work arrives that can only be described by naming its mode, we'll know it's time. Until then, the concept is held in this file and nowhere else.

The test for whether modes should enter the code: can a mode be *felt* in existing works without being declared? If the answer is yes across enough works, declaring it would sharpen the site. If the answer is no, the concept is still gestating.

---

## Relationships Between Works

Works can link to other works. The graph that these links form is a first-class part of the site — `CLAUDE.md` commits to "everything is one graph" and `MEDIUM.md` names hypertextuality as one of the seven dimensions of the medium. The domain model's job here is narrow: to say *what can link to what*, so that the graph specification (gap: `GRAPH_AND_LINKING.md`) has a foundation.

- **Any work may link to any other work**, regardless of room. The one-graph commitment means a poem may link to a case study, a case study may link to an essay, an essay may link to a poem. Room boundaries are not link boundaries.
- **Links are directed.** A link has a source and a target. A backlink is the same edge observed from the other end.
- **Facets are not links.** Two works that share a facet are *adjacent* in a facet-view, but no edge exists between them unless one explicitly points to the other. The facet view is a lens; the link graph is a structure.

Further specifics — link syntax, backlink rendering, how the graph is prevented from becoming noise — belong to `GRAPH_AND_LINKING.md` when it is written. This file defines only the adjacency: what is linkable to what.

---

## What This Model Does Not Yet Decide

Some concerns have been raised and intentionally left unresolved here, because resolving them belongs to a file downstream.

- **How facets appear in the UI.** Whether they are shown as tags, used as filters, color-coded, or surfaced only via a facet-view page is an information architecture question. Held in `INFORMATION_ARCHITECTURE.md` (gap).
- **What "seasonal" means for the Garden.** Whether the Garden rotates works with the actual seasons, whether some works are hidden at certain times, whether seasonality is a lifecycle state or a presentation choice — held in `CONTENT_SCHEMA.md` and `CONTENT_AUTHORING.md` (both gaps).
- **How The Foyer is composed.** The Foyer is a room but not a content container; what it actually renders (a letter, a figure, a portrait, a map) is an IA/design question. Held in `INFORMATION_ARCHITECTURE.md`.
- **How audio and other media enter the Salon.** The Salon is the cellist's son's room, and audio is potentially first-class there. Held in `MEDIA_STRATEGY.md` (gap).
- **Content types (poem, essay, case study, note).** These words are used throughout this file informally. Whether they become a formal type axis (with different rendering, different frontmatter, different routes) or remain descriptive labels is held in `CONTENT_SCHEMA.md`.

These are not open problems to be solved before the next step. They are questions the domain model is consciously not answering, so that the files downstream have room to answer them well.

---

## Enforced in Code

Currently, `src/shared/types/common.ts` exports:

```ts
export type Room = 'foyer' | 'studio' | 'garden' | 'study' | 'salon';

export type Facet =
  | 'craft'
  | 'consciousness'
  | 'language'
  | 'leadership'
  | 'beauty'
  | 'becoming'
  | 'relation'
  | 'body';
```

This is the machine-readable slice of the model. The types mirror this document; if the two disagree, this document is authoritative and the types should be updated. `Mode` is intentionally absent — see above.

When `CONTENT_SCHEMA.md` arrives, it will define a `Work` type that uses `Room` and `Facet`, and this section will grow to include that. For now, the types encode only what the code already uses.
