# Graph and Linking

`CLAUDE.md` commits to one promise that no other spec can break: *everything is one graph.* A poem can link to a case study. A facet can gather works across rooms. A visitor can arrive at an essay from a backlink in a morning note. The rooms are lenses through which the graph is viewed; the graph is the thing itself.

This file defines what the graph is, how links are encoded in content, how the graph is assembled at build time, how backlinks surface, and how the graph resists becoming noise as it grows. It is downstream of `DOMAIN_MODEL.md` (which names what can link to what) and `CONTENT_SCHEMA.md` (which says where links live — in the body, not the frontmatter). `INFORMATION_ARCHITECTURE.md` defers the specifics of facet chips and outward-invitation composition to this file; we pay that debt here.

---

## What the Graph Is

The graph is a directed set of edges over the set of works, plus a parallel adjacency structure from facets.

**Nodes** are works. The Foyer, rooms, and facets are not nodes — they are lenses. Only individual works are citizens of the graph.

**Two kinds of adjacency:**

- **Links** — explicit, authored edges. A work's body contains a pointer to another work. This is a directed edge: the pointing work is the source, the pointed-to work is the target. Links carry intent — a reader following them is following a decision the author made.
- **Facet adjacency** — implicit, structural proximity. Two works that share a facet are in each other's neighborhood, but no edge exists between them unless one explicitly links to the other. Facet adjacency is a lens; link adjacency is a graph.

These are different enough to stay distinct. The facet view groups; the link graph connects. A visitor who follows a facet is wandering through a neighborhood; a visitor who follows a link is walking a path someone built for them.

**What the graph does not carry:**

- No weights. Every link is the same link.
- No types or semantic labels. A link is a link; the body's prose around it carries whatever context matters.
- No "related-because-of-shared-substring" or other automatic inference. The graph is authored, not computed.
- No private edges. Every link is visible in the source and in the rendered page.

---

## Link Syntax

The site accepts two syntaxes in markdown bodies. Each serves a different need; they coexist without overlap.

### Wikilinks for within-site

Links between works use wikilink syntax: `[[slug]]` for same-room links, `[[room/slug]]` for cross-room links.

```md
A thought about attention, developed further in [[some-poem]]
and contrasted with the argument in [[studio/some-case-study]].
```

At build time the loader resolves these to canonical URLs: `[[some-poem]]` in a Garden work becomes `/garden/some-poem`; `[[studio/some-case-study]]` becomes `/studio/some-case-study`. The rendered anchor text defaults to the target work's title; a visitor sees "A thought about attention, developed further in *The Morning the Garden Spoke Back*."

**Wikilink with override text:**

```md
…developed further in [[some-poem|that morning poem]]…
```

The pipe introduces display text, which overrides the default (the target's title). This is the escape hatch when prose wants different words than the title provides.

**Why wikilinks for internal:** they keep prose short, they surface structural meaning (a wikilink *is* a link between two works, visibly so), and they fail loudly if the target doesn't exist — which is what we want.

### Standard markdown for everything else

External links use standard markdown: `[text](https://example.com)`. This includes links to:

- External sites
- Specific sections within a work (anchor links): `[earlier in this essay](#the-section)`
- Resources that are not works (images, downloads, though those are a `MEDIA_STRATEGY.md` concern)

**Never mix syntaxes for the same purpose.** A wikilink to an external site is wrong. A canonical markdown link to another work is technically legal (it resolves) but discouraged — use the wikilink so the edge is visible at author-time.

### Facets are never links in prose

Facets live in frontmatter; they never appear as inline links in a work's body. A sentence like "This work is about [[craft]]" is not valid — `craft` is not a work. Facets surface at the top of the work page (as chips) and at the bottom (in the outward invitation); they do not appear as prose anchors.

---

## Link Resolution at Build Time

The content loader produces a `Works` index keyed by `{room, slug}`. When parsing a work's body, wikilinks are resolved as follows:

1. **Parse the wikilink.** `[[some-slug]]` → `{ target: 'some-slug', room: current }`; `[[room/some-slug]]` → `{ target: 'some-slug', room: 'room' }`; `[[...|display]]` → includes the override text.
2. **Look up the target.** If `{room, slug}` exists in the Works index, the wikilink is valid.
3. **If the target does not exist**, the build fails with a specific error naming the source work, the line, and the unresolved target. This is an authored error, not a runtime one — an unresolved wikilink at build time means the author meant to link to something that is not there, and that is worth stopping for.
4. **If the target is a draft** and the build is a production build, treat it as unresolved — a published work cannot link to a draft in production, because the link would render as a broken edge.

This strictness is the same practice as `CONTENT_SCHEMA.md`'s validation stance: the site is honest about what it can and cannot do, and it refuses to pretend a broken link is fine.

### The rendered anchor

A resolved wikilink renders as a standard `<a href="/room/slug">`. It carries the target's title (or the override text) as its text content, and it is styled like any other link — there is no visual distinction between "internal work link" and "external link" in the rendered page. A visitor who hovers or inspects sees the URL; the prose does not announce its type.

This intentional flatness serves the reader: a link is a link. The author-time distinction (wikilink vs. markdown) helps the author; the reader sees consistent prose.

---

## Backlinks

A backlink is the same edge observed from the target's side. When work A links to work B, work B has a backlink from A. Backlinks are computed at build time by traversing every published work's body and recording the edges.

**Where backlinks surface:** on the target work's page, in the outward invitation at the bottom. They are the quietest part of the page. They are not a sidebar, not a sticky footer, not a dense "what links here" table. They are one line of secondary-voice prose like:

> *Mentioned in* [[another-work]] *and* [[yet-another-work]].

If there is one backlink, the line is shorter. If there are no backlinks, the line is absent — not "No mentions yet." The site does not narrate absence.

**Ordering:** backlinks are ordered by the target work's date (newest first) for stable, predictable presentation. This can be revisited when a work has many backlinks and ordering starts to matter; for now, newest-first keeps it simple.

**Draft backlinks:** a draft work that links to a published work does not produce a backlink in production. The draft is invisible; its edges are invisible with it. In development, drafts contribute backlinks normally so Danny can see the graph as it will be.

**Reciprocity is not required.** A work that links out does not need to be linked to, and vice versa. Some works are terminal in one direction and not the other; the graph accepts that.

---

## The Outward Invitation

`INFORMATION_ARCHITECTURE.md` commits every work page to a quiet outward invitation at the bottom. This file defines what it contains. The invitation is a composition of up to three elements, shown in this priority:

1. **Facet threads.** If the work carries facets, a line lists them: *More in [craft](/facet/craft), [consciousness](/facet/consciousness).* Each facet name links to its facet page. This is the default, always-present element when facets exist.
2. **Backlinks.** If other published works link to this one, a line names them: *Mentioned in [[work-a]], [[work-b]].* Present when at least one backlink exists.
3. **Return to room.** Always present, as the final line: *Keep wandering in The Garden →.* The link points to the work's room landing.

### The priority order

These three elements fill the invitation in priority, but the third is non-negotiable. The minimum invitation is the room return: every work page, no matter how isolated in the graph, offers a way back to its room. A work with no facets and no backlinks still shows the return line — it is the single guaranteed door.

### What the invitation is *not*

- **Not an algorithmic "related works" panel.** There is no "works you might also like" based on word similarity, click behavior, or co-occurrence. The outward invitation is composed from authored structure only (facets the author chose, links the author made).
- **Not a carousel.** If there are many facet threads or many backlinks, they all appear as a comma-joined line — at most, a few. If the line grows unwieldy, that's a signal from the graph itself that something needs authorial attention (too many facets, or a particularly well-connected work that wants its own treatment).
- **Not decorated.** The invitation uses the same typographic register as the rest of the page — secondary-voice, italic where appropriate, no boxes, no cards, no "continue reading" buttons. It is text. The `<Ornament />` molecule marks its separation from the body above it.

---

## Graph Assembly

The graph is assembled once, at build time, and baked into the bundle. The pipeline:

1. **Load all works** via `CONTENT_SCHEMA.md`'s loader. This produces a `Work[]` with parsed frontmatter, resolved room and slug, and raw body strings.
2. **Filter by environment.** In production, drafts and future-dated works are excluded from the graph (they neither appear as nodes nor participate in edges). In development, all works appear.
3. **Parse each body's wikilinks.** For each work, extract the set of outgoing wikilinks. This is a single-pass traversal of the markdown AST (whatever parser we choose — likely a remark plugin).
4. **Resolve each wikilink** against the works index. Record the edge `(source, target)`. If the target does not resolve, fail the build with a specific error.
5. **Compute backlinks** by inverting the edge set. For each work, the list of works that link to it.
6. **Index facet membership.** For each facet, the list of works that carry it, grouped by room.

The output is a `Graph` object:

```ts
export interface Graph {
  works: Map<string, Work>; // keyed by `${room}/${slug}`
  outbound: Map<string, string[]>; // work id → work ids it links to
  inbound: Map<string, string[]>; // work id → work ids that link to it
  byFacet: Map<Facet, Map<Room, Work[]>>; // facet → room → works in that room
}
```

Components and page-level loaders read from this `Graph` at render time. They do not recompute edges; they do not re-parse bodies. The graph is a build artifact, consumed as data.

---

## Graph Noise Resistance

A graph that grows too dense becomes illegible. Every cross-room link costs the reader something; at some scale, even authored links become noise. This file names the cultural practice that keeps the graph sparse without policing it.

**Rules of thumb, not rules:**

- **A link should say something the prose couldn't.** If the sentence reads fine without the link, the link isn't earning its place.
- **Prefer fewer, richer links over many thin ones.** One link to a foundational work is worth more than five to adjacent asides.
- **Let facets carry the broad adjacencies.** Don't link every craft-themed work to every other craft-themed work — the `/facet/craft` page does that.
- **Sit with a work before linking it.** If a link feels obligatory at publish-time rather than revelatory, it probably wants to be removed.

**Structural guards (not yet needed):**

- No limit is enforced on outgoing or incoming edges per work today. When the graph has enough mass to reveal natural thresholds, `EVOLUTION_PROTOCOL.md` may gain a linting check or a soft threshold surfaced at build time. Not yet.
- No cycle detection, because cycles are legitimate. A work can link to another work that links back; the graph is directed, not acyclic.

---

## Held: The Visible Graph Surface

`INFORMATION_ARCHITECTURE.md` mentions a possible "graph view" page as a held concept — a surface that shows works as nodes, links and facets as edges. This file reserves the architectural ground for it:

- The `Graph` object described above is sufficient to render such a view without additional build work.
- A visualization would live at `/graph` or similar, as a single page rather than a persistent overlay.
- It would likely use the accent palette held in `DESIGN_SYSTEM.md` — the four non-primary accents might finally find their semantic assignment as facet tints, specifically within this surface.

Absent until built. Named so the build pipeline above produces data rich enough for it, when it arrives.

---

## Enforced in Code

Nothing in this file is implemented today. The content loader does not exist; the graph object does not exist; wikilink parsing does not exist; backlinks are not computed; the outward invitation component is not built.

The order of arrival is implied:

1. **The first work** triggers `CONTENT_SCHEMA.md`'s loader and this file's wikilink-parsing plugin. The minimum viable graph is a single node with zero edges.
2. **The second work** — if it links to the first — triggers the edge-set and the backlinks computation. The minimum viable outward invitation appears on the target.
3. **The first work carrying a facet** triggers the facet chips and the `/facet/{facet}` surface. The facet adjacency structure earns its code.
4. **The visible graph surface** earns its code whenever it earns its place — not before the content has enough edges to be worth visualizing.

Each step adds to the previous; none replaces it. The graph grows the way the content grows — one deliberate step at a time, with each step authored rather than computed.
