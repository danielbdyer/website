# Component Catalog

*Every component and mode the composite is expected to need, laid out by the concern each one separates, rather than by how it should be built. Asked for on 2026-10-04: "document some core assumptions about all of the components we'll need, all of the modes that they'll have … while remaining unprescriptive about how it's done, but really inspiring the separation of concerns more than the implementation detail, so the next agent can find joy in implementing it how they wish alongside your recommendations. They might discover refactors you didn't see possible and that would be an even more delightful outcome than yours!"*

*Downstream of [COMPONENT_GRAMMAR.md](./COMPONENT_GRAMMAR.md) (the shape), [ARCHITECTURE.md](./ARCHITECTURE.md) (the coordinates every component keeps), [VISION.md](./VISION.md) (what it is for), [HYPOTHESIS.md](./HYPOTHESIS.md) (Danny's words), [PATTERN_LANGUAGE.md](./PATTERN_LANGUAGE.md) (the display patterns), and both React specifications. When a builder finds a better decomposition than this file suggests, [EVOLUTION_PROTOCOL.md](./EVOLUTION_PROTOCOL.md) §"When a Plan Is Bettered" is how it lands.*

---

## The Conclusion First

1. **Seven concerns, each owned by its own components.**
   - *Anatomy:* what a thing is.
   - *Ink:* how its text reads.
   - *Verbs:* what can be done to it.
   - *Authority:* who may do it.
   - *Attention:* how far forward it sits.
   - *Orientation:* where you are.
   - *Crossing:* how you move to another mode.

   Two kinds of component hold many nodes at once: *gatherings* (lists of nodes) and *fragments* (things inside a body). Everything else is a mode's own *chrome*.
2. **A component owns one concern.** When one seems to need two, that is the seam to look for, and usually the start of a better design.
3. **Entries describe, they do not instruct.** Each gives what the component is for, what exists today, what is assumed, what would likely be worth doing, what is left to the builder, and the sign that it has gone wrong. Names are candidates.
4. **The assumptions come first,** each with what changes if it is wrong, so that a builder who knows better can tell which entries to distrust.

---

## Core Assumptions

| Assumption | Why it is believed | If it is wrong |
|---|---|---|
| **One author.** | The site and the record are Danny's. Agents propose, visitors read. | The authority line grows a second author. `CATHEDRALS.md` Phase 5's trigger fires. |
| **Most writing happens in the outline.** The authored page is for touching up in place. | Answer 13: "get most everything done in one mode - maybe a little constrained." | If he writes whole essays on the page, the in-place editor becomes primary and needs the outline's frame budget. |
| **Visitors only read.** No accounts, comments or cookies. | `PRIVACY.md`; the house's refusals. | A new actor class, and the privacy and authority lines change together. |
| **Works stay few, and the sky's cap of 24 present stars holds for a long time.** | One authored work today. The pace is slow on purpose. | The held high-node-count strategy in `CONSTELLATION_IMPLEMENTATION_PLAN.md`. |
| **He authors on the site at night.** | Answer 11: "only the night." | The sun also receives the name. That is a one-line change in the gesture's target. |
| **He uses at least two devices,** a laptop and a phone. | The outline has a mobile bar; passkeys need a recovery device. | Recovery needs another path before any enrollment. |
| **Capture works offline and syncs later.** | Harness §4, local-first; D-140, the device keeps the log. | Sync gets simpler, but the 16 ms keystroke budget depends on local writes either way. |
| **Agents are mostly Claude Code sessions,** reaching the system through MCP, HTTP and the CLI. | `AGENTS.md` directive 5; the outline's MCP tools. | Other agents, such as Copilot, make the ported MCP server over the harness's verbs matter sooner. |
| **React renders every mode until a frame budget says otherwise.** | Both React specifications; A-37 chooses a renderer by measurement. | Only the render arrow changes. Every other concern in this file is untouched. |
| **The closed sets stay closed:** five rooms, eight facets, four types of work. | `DOMAIN_MODEL.md`; a ninth facet is "a domain change … sit with it for a season." | A season's decision, then one change to an enum. |
| **His prose stays readable as markdown in git** with none of this software. | Harness D-049, his decision. | Only his amendment changes it. |
| **The site's motion vocabulary stays the site's.** Four durations and one easing curve. The outline keeps its own, quieter one. | `INTERACTION_DESIGN.md`; the outline's frame-first renderer (D-127). This one is a guess. | If they converge, a shared set of motion tokens becomes a component concern of its own. |

---

## The Modes

### The sky

- **For:** seeing relations. Works as stars placed by their facets, threads between them, a walk from star to star.
- **Who:** visitors and Danny.
- **Known:** `/sky`. The `Constellation` organism, built in six layers: Graph, Walk, Motion, Frame, Paint, Shell (`CONSTELLATION_ARCHITECTURE.md`). WebGL atmosphere through `ogl`. A cap of 24 present stars.
- **Assumed:** it stays the house's relational view. Outline nodes can be drawn in it once they arrive through a slice.
- **Worth doing:**
  - draw ghosts for proposals (held in `CONSTELLATION_WALK.md`);
  - give vault claims a second region;
  - possibly host the relational mode and the ontology arena.
- **Left open:** whether the relational mode over the sky is the same mode or a sibling.
- **Watch for:** the sky becoming a dashboard. "A place to think, not a dashboard to monitor" (`CATHEDRALS.md`).

### The page

- **For:** reading.
- **Who:** visitors.
- **Known:** every room, facet and work route, prerendered. `WorkView`, `WorkEntry`, `WorkRow`, `FacetCard`, `WorkOverlay`.
- **Assumed:** it stays static, and it never learns that anyone edits it.
- **Worth doing:**
  - one anatomy of a work (adjudication A1);
  - `data-address` and `data-part` on every part;
  - pattern 2's fragments.
- **Left open:** how the Foyer composes placed cards, if Danny chooses cards (`HYPOTHESIS.md`, reflection 8).
- **Watch for:** a component that branches on whether the author is present. That belongs to the authored page.

### The authored page

- **For:** touching up in place. "Whatever's visible can be edited easily."
- **Who:** Danny, on an enrolled device, at night.
- **Known:** nothing yet. The page parts it will attach to exist.
- **Assumed:** it is the page plus one layer, served only to his device, attached by address.
- **Worth doing:**
  - the title first;
  - then the deck, the facets (a `+` offering the eight), and the image;
  - then selecting a paragraph to write in place.
- **Left open:** how the layer finds and decorates parts, what editing in place looks like, and how a save is shown.
- **Watch for:** the visitor's bytes changing, or a page module importing anything from the layer.

### The outline

- **For:** writing.
- **Who:** Danny and his agents.
- **Known:** `packages/outline-app`, hand-written and virtualized (D-127, D-128). Rows, bullets, chips, the bullet menu, the palette, panes, panels, the mobile bar, presence.
- **Assumed:** the calm surface stays calm. Power stays one gesture away.
- **Worth doing:**
  - fields shown only when zoomed in;
  - the menu's new commands: publish, open in its type's editor, make this a type;
  - proposals shown only one level below his focus;
  - a first-use tour that is not a pile of proposals.
- **Left open:** what a typed node's own page looks like when zoomed in. This is where "a Tana-like editor when you're in them" lives.
- **Watch for:** anything on screen he did not write or summon.

### The relational mode

- **For:** relational structuring. Typed nodes forward, everything else quieted and still within reach.
- **Who:** Danny, by deliberate crossing.
- **Known:** nothing in the outline. The sky's presence and its facet emphasis are the nearest precedent.
- **Assumed:** it is a prominence function over an existing mode, not a new renderer.
- **Worth doing:** a storyboard first. Then the crossing into it, with readiness.
- **Left open:** whether it is the outline's mode, the sky's, or both. How "the Tana or relational functionality could pop out in interesting ways."
- **Watch for:** it becoming the place he goes instead of writing.

### Not modes, but close

- **The type editor.** The outline, zoomed into a typed node. If it seems to need its own renderer, the outline's zoomed page is missing something.
- **The arena.** A sky of types, where rival ontologies meet under D-005's rule. It is held until several prior ontologies have been brought in.
- **The agent's surface.** MCP tools, the intents API, the CLI. Rendered as JSON for a reader that is not a person, and served by the same projections a mode uses.
- **The Foyer.** A page whose composition may become cards Danny places (`HYPOTHESIS.md`). The look-up stays its gesture until he says otherwise.

---

## The Components, by Concern

Each entry follows the same form:

- **Concern:** the one thing it separates.
- **Modes:** where it appears.
- **Known:** what exists today, with its path.
- **Worth doing:** the likely next step.
- **Left open:** what the builder decides.
- **Watch for:** the sign it has gone wrong.

### I. Anatomy: what a thing is

**Node scope.**

- **Concern:** giving a node's parts to the components that show them, computed once.
- **Modes:** all.
- **Known:** nothing shared. Five work renderers each derive their own parts.
- **Worth doing:** pattern 1's anatomy as a value, and a compound root that provides it.
- **Left open:** context, props or render functions as the carrier, within the specifications' limits on context fields.
- **Watch for:** a part that computes something the anatomy should have.

**Title.**

- **Concern:** the node's name.
- **Modes:** every mode. A heading on the page, a label in the sky, a row's text in the outline.
- **Known:** in five work renderers and in the outline's `Title`.
- **Worth doing:** one derivation, many renderings, and the same view-transition name wherever it morphs.
- **Watch for:** a title that differs between two modes for the same node.

**Meta.**

- **Concern:** when, and by whom: the date, the draft badge in development, the writer's color.
- **Modes:** page, outline.
- **Known:** the site's metadata line; the outline's presence and writer colors.
- **Worth doing:** one date format and one draft policy (`REFINEMENT_AUDIT.md` §"Anatomy").
- **Left open:** whether provenance is ever shown to visitors. Today it is not.

**Deck.**

- **Concern:** the summary.
- **Modes:** page, sky (the whisper), outline (the note).
- **Known:** three listing surfaces with three summary policies.
- **Worth doing:** one policy, declared per surface.
- **Watch for:** the overlay showing a summary the page hides. The audit already found this.

**Body.**

- **Concern:** the children of a node, each rendered by its layout: paragraph, heading, quote, code, list, table.
- **Modes:** page, outline.
- **Known:** the site renders markdown with `marked` and a wikilink extension. The outline renders layouts per row (`p`, `h1`–`h3`, `quote`, `code`, `table`).
- **Worth doing:** the same layout vocabulary in both, so the article mode and the outline mode are two renderings of one tree.
- **Left open:** whether the site's body becomes a tree of nodes, or stays markdown read into one (D-049).
- **Watch for:** a layout the outline knows that the page cannot show.

**Fields.**

- **Concern:** typed values: room, facets, type, and any approved field.
- **Modes:** page (facet chips, the room kicker), sky (position), outline (only when zoomed in), relational (forward).
- **Known:** frontmatter on the site; `node.field` in the outline, unseen (D-125).
- **Worth doing:** each field shown by a renderer chosen by its type: a closed set as chips, a date, text, a reference.
- **Left open:** what a field looks like as a quiet, empty question.
- **Watch for:** a field asked for at writing time.

**Relations.**

- **Concern:** edges: backlinks, threads, mirrors, links, the outward invitation.
- **Modes:** page, sky, outline, relational.
- **Known:** `WorkOutwardInvitation` with its backlinks line; threads in the sky; "Linked from" and "Also shown in" in the bullet menu.
- **Worth doing:** one relation projection feeding all of them.
- **Watch for:** a relation the sky draws that the page cannot reach.

**Standing mark.**

- **Concern:** whether something is proposed or approved.
- **Modes:** outline (muted, with a chip), sky (a ghost). Never on the page.
- **Known:** the outline's chips and muted text.
- **Worth doing:** quiet by default, forward on hover (answer 7).
- **Watch for:** a standing mark on a visitor's page.

**Figure, hero, referent, kicker.**

- **Concern:** the work-specific parts of pattern 1 and pattern 3.
- **Modes:** page.
- **Known:** `WorkHero`, `ImgSlot`, `WorkReferent`, `WorkKickerBar`.
- **Worth doing:** each as a declared part of the work's anatomy.

### II. Ink: how text reads

**Inline.**

- **Concern:** marks inside a line: emphasis, links, wikilinks, tags, dates, code.
- **Modes:** page, outline.
- **Known:** the site's `marked` extension and wikilink engine (`src/shared/content/wikilinks.ts`). The outline's inline painter and grammar (`packages/outline/src/core/inline.ts`).
- **Worth doing:** one inline grammar, two painters. The site paints at build. The outline paints per frame.
- **Left open:** whether the grammar lives in the outline's core or in a shared package.
- **Watch for:** a mark one side parses and the other shows as raw text.

**Chip.**

- **Concern:** a label that is also a way somewhere.
- **Modes:** page (facet chips), outline (tags), relational.
- **Known:** `FacetChip`, a closed set of eight that opens a facet. The outline's tag spans and `toggle-tag`, open text that filters.
- **Worth doing:** one chip whose vocabulary is either closed or open.
- **Watch for:** a chip that both navigates and filters in the same mode.

### III. Verbs: what can be done

**Menu.**

- **Concern:** the verbs offered on one node, here, to this actor.
- **Modes:** outline (the bullet menu), authored page (a part's menu).
- **Known:** `BulletMenu` and `plan-menu`'s `intentOf`.
- **Worth doing:** a menu built from `offered(actor, mode, node)`. Right-click, long-press and one key all open it.
- **Watch for:** a menu item that changes the record by any path but the intents.

**Palette.**

- **Concern:** every verb, searchable.
- **Modes:** outline.
- **Known:** `Palette`, built from the keymap.
- **Worth doing:** the same list on the authored page, if he wants it there.

**Decide.**

- **Concern:** keep, drop, reopen.
- **Modes:** outline, later the sky's ghosts.
- **Known:** on four surfaces in the outline: the row's chips, the Review panel, the bullet menu, the mobile bar.
- **Worth doing:** one decide control, placed by the surface.
- **Watch for:** a decision that cannot be undone (D-138).

**In-place editor.**

- **Concern:** writing into a part where it stands. Select, write, click off to save.
- **Modes:** authored page; the outline is already this.
- **Known:** the outline's `Editable`.
- **Worth doing:** the title first.
- **Left open:** whether it reuses the outline's editable row or is its own.
- **Watch for:** the page jumping when a part becomes editable.

**Choice editor.**

- **Concern:** picking from a closed set: a facet, a room, a type of work.
- **Modes:** authored page, outline.
- **Known:** the outline's suggestions.
- **Worth doing:** the `+` beside the facet chips, offering the eight.

**Publish.**

- **Concern:** the first world verb. A node becomes a work in git.
- **Modes:** outline, authored page.
- **Known:** nothing.
- **Worth doing:** the site's fields asked for at that moment, already filled where they can be guessed; a commit to main; readiness before it.
- **Watch for:** a publish that cannot be undone.

**Discuss.**

- **Concern:** asking an agent, in place.
- **Modes:** outline.
- **Known:** D-139, `DiscussDialog`.
- **Worth doing:** the answer arrives under the question, quietly. It does already.

**What it will do.**

- **Concern:** one line saying what a verb will do before it runs, and what it did after. This is care 14.
- **Modes:** all authoring modes.
- **Known:** the outline's change descriptions (`describe-change`).
- **Watch for:** the line becoming a confirmation dialog.

### IV. Authority: who may do it

**The name and the moon.**

- **Concern:** beginning the author's crossing.
- **Modes:** page, at night, on an enrolled device.
- **Known:** the wordmark (`Nav`) and the moon glyph (`ThemeToggle`). The glyph is already the seat of the daystar.
- **Worth doing:** the drag. The moon draws the name the last distance. Nothing marks it as a feat.
- **Left open:** everything about how it feels, which the storyboard will draw.
- **Watch for:** the gesture existing in a visitor's bytes.

**Passkey confirmation.**

- **Concern:** the second consent.
- **Modes:** the authored page's threshold.
- **Known:** the outline's identity (D-135).
- **Worth doing:** at least two devices enrolled, and recovery written down first.

**Author layer root.**

- **Concern:** attaching the author's components to page parts by address.
- **Modes:** authored page.
- **Known:** nothing.
- **Worth doing:** a separate entry that no page module imports.
- **Watch for:** the layer reaching into page internals instead of addresses.

**Presence.**

- **Concern:** who else is writing here.
- **Modes:** outline.
- **Known:** `Presence`, writer colors.
- **Worth doing:** agents shown as present only when they are writing.

### V. Attention: how far forward

**Prominence.**

- **Concern:** how far forward a node sits. This is mostly a function, `prominenceOf`, with many consumers.
- **Modes:** sky (presence), outline (a proposal's quiet), relational (typed nodes forward).
- **Known:** `src/shared/content/presence.ts`.
- **Worth doing:** one function family. A hover or a click raises a node's prominence, softly (answer 7).
- **Left open:** how prominence looks in each mode.
- **Watch for:** anything that seeks attention. "It's gotta be non-attention seeking basically."

### VI. Orientation: where you are

**The way back up.**

- **Concern:** the path to the containing place.
- **Modes:** page (the kicker), outline (`Crumbs`).
- **Known:** both exist.
- **Worth doing:** one orientation value feeding both.

**Here.**

- **Concern:** the current place in a mode: the sky's here, the outline's zoom.
- **Modes:** sky, outline.
- **Known:** three writers of "here" in the sky (`REFINEMENT_AUDIT.md` §"Orientation").
- **Worth doing:** one value with one precedence law.

**The address.**

- **Concern:** the URL as state.
- **Modes:** all of the site's; the outline's zoom route.
- **Known:** `room/slug`; the outline's `n.$nodeId`.
- **Worth doing:** the one function that maps an address to a node id and back (directive 8).

### VII. Crossings: moving between modes

**The crossing.**

- **Concern:** a change of mode, carrying where you came from, with readiness.
- **Modes:** between any two.
- **Known:** the look-up, `useThresholdReveal`: gather, reveal, commit, or release and settle back.
- **Worth doing:**
  - one readiness machine (offered, gathered, taken);
  - a `Crossing` type that cannot be built without its origin.
- **Left open:** what each crossing feels like. "The UI drops away and you kind of are transported to somewhere else but it's all very intentional."
- **Watch for:** an "are you sure?" anywhere.

**Open elsewhere.**

- **Concern:** the links that cross applications: from a page to its node in the outline, and from a node to its page.
- **Modes:** authored page, outline.
- **Known:** nothing.
- **Worth doing:** a crossing that lands on the same node, zoomed, at `outline.danielbdyer.com`, and back.

**Return.**

- **Concern:** going back the way you came.
- **Modes:** sky, overlays, the relational mode.
- **Known:** `useReturnGesture`: the down arrow and Escape.
- **Worth doing:** the same return from every crossing.

### VIII. Gatherings: many nodes at once

**Listings.**

- **Concern:** many nodes in an order.
- **Modes:** the room lists, facet masonry, the outline's virtualized rows, search results, the Review queue.
- **Known:** `WorkEntry` lists, `FacetMasonry`, `RowList`, `ReviewPanel`.
- **Worth doing:** each listing as a projection plus a renderer. The order and the filter are the projection's, never the component's.
- **Watch for:** a listing that sorts by recency or popularity on a visitor's page. That is a refusal.

**Saved search as a bullet.**

- **Concern:** a live query whose results are children.
- **Modes:** outline.
- **Known:** starred searches in the sidebar.
- **Worth doing:** B-46's "a saved search as a bullet whose children are its results." It is power on demand, and it is still only a bullet.

**The Foyer's composition.**

- **Concern:** cards Danny places, if he chooses them.
- **Modes:** page.
- **Known:** the figure and the welcome.
- **Held:** until he decides between the Foyer's refusal and the synthesis he described.

**The gathering.**

- **Concern:** every work under a lens kept in the address.
- **Known:** `PATTERN_LANGUAGE.md` pattern 16, held.

### IX. Fragments: things inside a body

**Fragment registry.**

- **Concern:** kinds of thing inside prose, such as a recording, a transclusion or a figure. Each has a consequence class (inert, live, or third-party).
- **Modes:** page.
- **Known:** pattern 2, proposed.
- **Worth doing:** the registry as the verb registry's twin, with the Salon's first recording as its pull.

**Transclusion and mirror.**

- **Concern:** one node shown inside another, with one source of truth.
- **Modes:** page (`![[…]]`), outline (mirrors, D-124).
- **Worth doing:** one idea in both.

**Quoted claim.**

- **Concern:** a vault claim inside an essay, bound by a pin.
- **Known:** `PATTERN_LANGUAGE.md` pattern 8.
- **Pull:** the first essay that wants one.

### X. Chrome: each mode's own

These are not shared.

- **The site:** the nav and wordmark, the theme toggle and hour, the footer.
- **The sky:** the compass, the whisper, the daystar.
- **The outline:** the header, sidebar, panels, mobile bar.

**Watch for:** chrome becoming domain. If a piece of chrome starts carrying a node's parts, it has become an anatomy component.

### XI. Honesty: telling the truth about state

**Named reasons.**

- **Concern:** a failure shown as one plain sentence naming what happened, because every error is a value with a name.
- **Known:** the harness's tagged errors; `NotFound` and the error boundary.

**Sync state.**

- **Concern:** whether what he wrote has reached the record.
- **Known:** the outline's connection dot.
- **Worth doing:** quiet unless something is wrong.

**Empty states.**

- **Concern:** naming an absence plainly.
- **Known:** `VOICE_AND_COPY.md`, "Empty facet pages."

### XII. For agents: not rendered

**The agent's surface.**

- **Concern:** the same nouns and verbs, for a reader that is not a person.
- **Known:** the outline's MCP tools and HTTP API (`GET /api` describes itself); the harness's CLI.
- **Worth doing:**
  - the fabric's MCP server, ported to the harness's verbs, with a receipt per call;
  - self-description with a drift check.
- **Watch for:** an agent tool that writes by any path but the intents.

---

## Seams Worth Looking For

These are places where a refactor might dissolve several components into one. They are guesses, offered to be overturned. A builder may well find that the seams run elsewhere.

| Today | Perhaps one thing | Why it might be |
|---|---|---|
| Five work renderers | One anatomy, five projections | Adjudication A1 says so already. |
| Decide on four outline surfaces | One decide control | The verb is one. |
| The facet chip and the tag chip | One chip, with a closed or open vocabulary | Same shape, different vocabulary. |
| `WorkOverlay` and the outline's panels and dialogs | One overlay contract | Both close on Escape, take focus and return it. |
| The look-up and the moon drag | One readiness machine | Both can be begun, felt and abandoned. |
| Sky presence, the relational mode and a proposal's quiet | One prominence function | All three answer "how far forward." |
| `skyFocusForRoute`, the outline's zoom and the crumbs | One orientation value | All three answer "where am I." |
| `DiscussDialog` and `ShortcutDialog` | One single-input dialog | The inventory found them identical. |
| Five room-label maps | One | `REFINEMENT_AUDIT.md` counted them. |
| The palette and the suggestions | One option list | Both filter, rank and choose. |
| The site's wikilink engine and the outline's inline grammar | One inline grammar | Both parse the same marks. |

---

## Amendments

*None yet. When a builder betters an entry, the entry is updated and a dated line here says what was improved and by whom.*

*Written 2026-10-04 from the site at `05b6933`, the harness at `ecfbce7`, and an inventory of every component and hook in both.*
