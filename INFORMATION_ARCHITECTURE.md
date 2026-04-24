# The Information Architecture

A visitor arrives, orients, wanders, and deepens. This file names the shape of that movement and the surfaces that support it. It is the hallways and doors of the house — the structure that lets each room be entered, wandered into, and left again.

The house metaphor from `CLAUDE.md` is the organizing principle. `DOMAIN_MODEL.md` says what a room *is* and what a work *is*; `DESIGN_SYSTEM.md` says what a room *feels like*; `CONTENT_SCHEMA.md` says what a work *contains on disk*. This file says how a visitor *moves*. It sits at the cross of the inside and outside trunks in `SPECIFICATION_MAP.md`.

What this file does not govern: motion vocabulary (deferred to `INTERACTION_DESIGN.md`), microcopy and labels (deferred to `VOICE_AND_COPY.md`), or how links render as a graph surface (deferred to `GRAPH_AND_LINKING.md`). This file names the *shape* of navigation; those files name its speech, its choreography, and its graph.

---

## The Four Registers

A visitor to this site moves through four registers of experience. Each is a different quality of attention, and each has its own corresponding surface. An agent building a surface should know which register it is supporting; a design choice that fits one register may break another.

| Register | The visitor is… | Primary surface |
|---|---|---|
| **Arrival** | Encountering the site for the first time, or returning. Opening a door. | The Foyer (`/`) |
| **Orientation** | Learning the shape of the house. Discovering what rooms exist and what lives in each. | The nav, the room landings (`/studio`, `/garden`, `/study`, `/salon`) |
| **Wandering** | Following a thread — a facet, a link, a curiosity — between rooms, or across works within a room. | The graph of links, the facet surfaces, the invitations at the bottom of each work |
| **Deepening** | Settling into a single work. Reading. Listening. | The work page (`/{room}/{slug}`) |

These registers are not a funnel. A visitor does not arrive, orient, wander, then deepen in sequence. Some arrive and deepen immediately (they clicked a direct link to a work). Some arrive and wander back out without deepening. Some deepen into one work, return to wander, find another. The registers are qualities of attention that can appear in any order; the site's job is to serve each one well where it arises.

**The test for any surface:** which register does this primarily serve, and does the surface match the register? A room landing page that demands attention like a work (deepening) has made a category error. A work page that flaunts navigational metadata (orientation) has made the opposite error. Each surface should feel like what it is.

---

## URL Design

URLs follow the house. The grammar is small and strict:

```
/                           The Foyer (home)
/{room}                     A room landing — /studio, /garden, /study, /salon
/{room}/{slug}              A work — /garden/a-poem, /studio/some-case-study
/facet/{facet}              A facet lens — /facet/craft, /facet/language, ...
```

That is the whole site's URL surface. There is no `/posts`, no `/blog`, no `/archive`, no `/tags`. The house doesn't have those rooms. Plural nouns are declined because the site is organized by place, not by format.

**The Foyer is reached via `/`, not `/foyer`.** The Foyer is implicit home. The word "Foyer" belongs to the internal vocabulary (the `Room` type, the spec files) and never appears in a URL or a visitor-facing label. A visitor returning home clicks the wordmark in the nav; the nav does not display a "Foyer" link.

**Slugs are stable.** Renaming a file renames its URL, which breaks any link to it. This is a real cost; rename with care. The filesystem convention in `CONTENT_SCHEMA.md` pins slug to filename precisely so that slug changes are visible in version control and never accidental.

**No trailing slashes.** `/garden` and `/garden/` should resolve identically but the canonical form is without. This is a `SEO_AND_META.md` concern for server configuration; the commitment lives here.

**Case is lowercase.** URLs use lowercase kebab-case throughout. A file called `MyPoem.md` would be a bug; the loader should reject it rather than silently lowercase it.

---

## Navigation Model

The nav is sticky, text-only, and quiet. It is the only persistent orientation surface on the site.

### Structure

```
[◆ Danny Dyer]                Studio  Garden  Study  Salon   [☼/☾]
(wordmark, home)              (four room links)              (theme toggle)
```

- **The wordmark is home.** `◆ Danny Dyer` links to `/`. It is the sole way to return to the Foyer from inside the house; there is no "Home" label and no "Foyer" label.
- **The four room links** appear in a fixed order: Studio, Garden, Study, Salon. The order is not alphabetical; it follows the rhythm from professional to poetic to reflective to aesthetic — the arc `CLAUDE.md` holds implicitly.
- **The theme toggle** is the only interactive control in the nav beyond links. Its placement at the far right keeps it out of the reading path but reachable.
- **No dropdowns, no mega-menus, no search bar (yet).** The nav is flat and small because the house is small.

### Active state

The room link for the visitor's current room carries a subtle `active` style — a darker ink, not a decoration. The visitor should feel *where they are* without being told. When the visitor is at `/` or on a work page, no room link is active; the wordmark's presence is orientation enough.

### Mobile behavior

The nav does not collapse to a hamburger. Four short labels and a toggle fit across a phone width without compromise. If the label set ever grows beyond what a phone can hold, the design system will gain a smaller typographic treatment before it gains a menu icon. A hamburger is a surrender; the nav is short for a reason.

### The time-slider drawer (held)

The `TRANSPARENCY.md` time slider — the control that lets a visitor move backward through the site's history — is held to live *in the nav, top right, as a natively hidden drawer*. When built, it will sit between the four room links and the theme toggle, revealed by click or hover. Absent until built; named here so its location is not rediscovered later.

---

## Room Landings

Each of the four content rooms has a landing page at `/{room}`. A room landing is an orientation surface — it tells a visitor what this room is and what is in it. It is not a deepening surface; it should not demand sustained attention.

### The common shape

Every room landing has:

1. **A title** — the room's name, in Newsreader, at the typographic weight of a room heading. `The Studio`. `The Garden`. `The Study`. `The Salon`. (The definite article is part of the name.)
2. **A short room description** — one or two lines of italic secondary voice that name what the room holds. This is the room speaking about itself. The current placeholder descriptions in the route files are voice-level drafts; `VOICE_AND_COPY.md` will refine them.
3. **The room's works** — a list of the works that live in this room, ordered newest-first by default. Each entry shows title, date, and (if present) summary and facets.
4. **An invitation outward** — at the bottom, a small nudge toward an adjacent room or a facet thread. No room ends with "nothing more here"; there is always a door.

### The empty-room state

A room with no published works is honest about its emptiness. It still shows title and description; it does not show a works list at all (not an empty bulleted list, not "no works yet" placeholder text); it keeps the outward invitation. The voice of an empty room belongs to `VOICE_AND_COPY.md`, but the architectural commitment is: absence is acknowledged by its quiet, not papered over with chrome.

Today, all four rooms are empty. That is the current state and it is correct.

### Per-room character

Each room is the same shape but carries its own register. These are notes, not commands — the visual expression belongs to `DESIGN_SYSTEM.md` when it is deepened, and to specific component decisions when works arrive.

- **Studio** — reverse-chronological. Each work entry shows substantial summary and facet chips. The room reads like a portfolio without pretending to be one.
- **Garden** — chronological or curated; a garden isn't sorted by recency alone. Each work entry is shorter — poems don't need summaries. Dates may be de-emphasized.
- **Study** — reverse-chronological. Summary matters; essays earn their length and their listing should hint at it.
- **Salon** — the one room whose landing may differ structurally from the others, because audio and visual media don't list the way prose does. If the Salon eventually carries albums or sequences, its landing may carry album-level groupings rather than flat work lists. Deferred to `MEDIA_STRATEGY.md` when Salon content arrives.

---

## The Foyer

The Foyer is the arrival surface. Its job is to welcome, to orient implicitly, and to leave the door open. It is not a room in the same way the others are; it does not contain works, and it does not announce itself as "The Foyer."

### What the Foyer contains

Today, and for now:

- **A geometric figure** — the 60s-rotating `GeometricFigure` atom. Material presence. The site's body, visible.
- **A short welcome** — the current "The door is open. / The rooms are waiting." is the Foyer's voice in draft. Two italic lines, no more.
- **Implicit invitation via the nav** — the four room links in the nav are the explicit paths onward. The Foyer does not duplicate them as a secondary room list; the nav is the list.

### What the Foyer does *not* contain (today)

- No featured works, no "latest from the Garden," no activity feed.
- No explanation of what the site is. A visitor who lands here and doesn't understand is invited to wander; the rooms explain themselves.
- No call-to-action in the product sense. The site is a door, not a funnel.

### The Foyer's future

`DOMAIN_MODEL.md` softened its earlier invariant so that the Foyer can one day hold a work — a letter, an introduction-as-work, a portrait. If such a work arrives, it composes into the Foyer alongside the figure and the welcome rather than replacing them. The Foyer's architectural identity (not-a-content-list) persists.

---

## Work Pages

A work page is the deepening surface. It is the room a visitor sits in to read. Its job is to serve the work — to get out of the work's way — and then, at the end, to quietly offer a door outward.

### Anatomy

From top to bottom:

1. **A quiet header** — the room name as a small kicker linking back to the room (`← The Garden`), in secondary voice. This is the one piece of navigational chrome the work carries; it lives above the title because a visitor who clicked in from outside may want to know where they are.
2. **The title** — in Newsreader, at the work's rendering size (which differs by `type`; `DESIGN_SYSTEM.md` will deepen this when type-specific rendering arrives).
3. **The metadata line** — date and facet chips, in secondary voice. If the work has no facets, no chips — not an empty chip row. If the work has a summary, it may sit here as a single italic line beneath the metadata, or it may be omitted depending on the type.
4. **The body** — the work itself, rendered from markdown. This is the centerpiece.
5. **The outward invitation** — below the body, a small section that offers the visitor somewhere to go next.

### The outward invitation

No work ends at its own last line. Below every work sits a quiet invitation: return to the room, or follow a facet, or read an adjacent work. The specific composition depends on what the site knows:

- If the work carries facets: a line like "More in *craft*, *consciousness*" with each facet linking to `/facet/{facet}`.
- If other works exist in the same room: a link back to the room (`Keep wandering in The Garden →`).
- If the graph is rich enough: one to three suggested neighboring works — by shared facet, by explicit link, or by proximity in the room.

The specific copy is `VOICE_AND_COPY.md`'s job. The architectural rule is: **never a dead end.** If a work page has rendered correctly, the visitor can leave it without clicking the browser's back button.

### What work pages do *not* carry

- No social share buttons. The site's social surface is the Open Graph card, decided by `SEO_AND_META.md`. Sharing is done by copying the URL — the URL is the share.
- No comment thread. The site is not a conversation surface.
- No "reading time" estimate. The site is slow on purpose; timing the visitor would break the register.
- No related-works carousel. The invitation at the bottom is quiet, not algorithmic.

---

## Facet Surfaces

Facets appear in two places: as chips on work pages, and as a dedicated page per facet at `/facet/{facet}`.

### Chips on works

A work that carries facets renders them as small chips beneath the metadata line. Each chip links to `/facet/{chip-name}`. Chip styling is a `DESIGN_SYSTEM.md` concern; the architectural commitment is: chips are small, clickable, and use each facet's held character (see the accents in `DESIGN_SYSTEM.md`) only if and when the design system formally assigns an accent to a facet.

### The facet page

`/facet/{facet}` renders every published work that carries that facet, across all rooms. Its shape:

1. The facet name as a title (`Craft`, not `craft` — capitalized for visitor reading).
2. A one-line description of the facet, lifted from `DOMAIN_MODEL.md`.
3. A list of works carrying the facet, each showing title, room, date, and summary.
4. The list is **grouped by room** rather than flat-chronological. Craft in the Studio is adjacent to itself; craft in the Garden sits under its own subhead. The facet is the thread that crosses rooms, and the grouping makes the crossing visible.

### No "all facets" overview (yet)

There is no `/facets` index page today. A visitor encounters facets contextually — on works and at the bottom of works — rather than as a menu. If a future authored surface wants a "follow a thread" overview page, it earns its place then. Until then, facets are discovered, not browsed.

### Works without facets

A work without facets has no chips and is never reachable via a facet page. This is legitimate — not every work carries a cross-room thread. A visitor who wants to see "everything in this room" uses the room's landing; the facet surface is for cross-room movement, not exhaustive listing.

---

## Error and Empty States

Errors and emptiness belong here because they are shapes a visitor can encounter, and the shape of the site under stress is part of the architecture.

### 404

A request for a URL that does not resolve returns a 404 surface:

- A short message in the site's voice (`VOICE_AND_COPY.md` will write it).
- An `<Ornament />` above a quiet invitation back to the Foyer.
- No search bar, no suggested links, no "did you mean?" The site is honest: the door you tried doesn't open; the ones that do are still here.

### Empty rooms

See above under Room Landings. An empty room is acknowledged by its quiet; it does not display a placeholder list.

### Empty facet pages

A facet with no published works yet (any of the eight, early in the site's life) shows the facet name, the description, and acknowledges the absence. The facet still exists as a concept; the absence of current works carrying it is information, not an error.

### Build failures

An invalid work file halts the build loudly, per `CONTENT_SCHEMA.md`. Build failures are not a runtime concern for the visitor; the deployed site should never ship a broken work. If it does, that is a `DEPLOYMENT.md` concern, not an IA one.

---

## Wayfinding Conventions

Small decisions about how the visitor knows where they are.

- **No breadcrumbs.** The URL itself is the breadcrumb; the nav shows the active room; the work page shows `← The Room`. Beyond these, breadcrumbs would be redundant and noisy.
- **Back-button fidelity.** The browser's back button is a real navigation affordance. Scroll position is preserved when returning to a list; deep-link scrolling to a specific work-within-a-list is not a current concern.
- **Anchor links within works.** When a work has internal headings, each should receive a stable id so a visitor can link to a section. The heading's text becomes a slug-ified anchor. This is a markdown-rendering concern at the content layer, named here so the architecture remembers to preserve it.
- **No page-level loading chrome.** Content is baked into the bundle (see `CONTENT_SCHEMA.md`); there is nothing to load asynchronously beyond the initial bundle. The reveal animation on scroll is motion, not loading.

---

## Held Concepts

Ideas named here so they don't get lost, with a sketch of where they would live if built.

### Search

Deferred per `SPECIFICATION_MAP.md` until the site has enough works for search to matter (50+). When built, it would live as a small surface — likely a slash-triggered command palette or a quiet input in the nav — that searches title, summary, body, and facet. It would not replace the room-based navigation; it would complement it for visitors who know what they're looking for.

### The time slider (held)

Per above, its location is held: nav, top right, natively hidden drawer. Its behavior is held in `TRANSPARENCY.md`.

### A "graph view" surface

`CLAUDE.md` commits to "everything is one graph." A surface that *shows* the graph — works as nodes, facets and links as edges — is an appealing idea that is intentionally not committed to here. The graph manifests first through the quiet surfaces (chips, facet pages, bottom-of-work invitations). A visual graph page is possible but it earns its place only when the graph has enough nodes to be meaningful.

### Room-to-room transitions

When navigating between rooms, there is an opportunity for the transition itself to carry meaning — a visible moment of moving through the house. This is an `INTERACTION_DESIGN.md` concern, not an IA one, but IA should reserve the concept by not over-specifying instant page swaps as the forever-default.

---

## Enforced in Code

Today, `src/app/routes/` contains:

- `__root.tsx` — layout shell (`<Nav />`, `<main><Outlet/></main>`, `<Footer />`)
- `index.tsx` — the Foyer surface
- `studio.tsx`, `garden.tsx`, `study.tsx`, `salon.tsx` — four room landings, each with title and a draft italic description, no works list (none exists yet)

Not yet in code:

- `src/app/routes/{room}.{slug}.tsx` or a dynamic work route — work pages are a gap until the first work arrives
- `src/app/routes/facet.{facet}.tsx` or similar — facet surfaces are a gap for the same reason
- A 404 route — TanStack Router's `notFoundComponent` is not yet set
- The outward invitation at the bottom of work pages — the component does not exist
- Facet chip atom — the component does not exist

The order of arrival is implied by the schema's order: when the first work exists, the dynamic work route and the work-page component come with it; when works carrying facets exist, the facet chip and facet page come with them. Each new surface composes into the existing shell rather than replacing it. The 404 route and the empty-room invitation can be built before the first work, as part of tightening the house before anyone moves in.
