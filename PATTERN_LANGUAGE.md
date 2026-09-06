# Pattern Language

*A pattern language for what the rooms display. Named 2026-09-06, with Danny, when he asked for "higher fidelity content types in a generic way distinct from use case" — Spotify, video, relational embeds, code, more robust filtering — as the beginning of "my constellation of component display patterns à la Christopher Alexander." Downstream of [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (the material), [INTERACTION_DESIGN.md](./INTERACTION_DESIGN.md) (the motion and the kind-table), [CONTENT_SCHEMA.md](./CONTENT_SCHEMA.md) (works as data), [GRAPH_AND_LINKING.md](./GRAPH_AND_LINKING.md) (the one graph), and [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md) (the anatomy of a work page). It sits on the outside trunk, where the rooms are experienced, and it fills the part of the `MEDIA_STRATEGY.md` gap that is about presentation. Documentation only, by Danny's word: nothing here is built until it pulls.*

*Alexander's form is kept because it is the right form for this: a pattern names a recurring problem in a context, states the forces that make it hard, and gives the core of a solution "in such a way that you can use this solution a million times over, without ever doing it the same way twice." A pattern is not a component. A component is one way a pattern becomes real in one place. The patterns below are numbered so they can point at each other; each says which smaller patterns it needs and which larger ones it completes. Confidence is marked the way Alexander marked it — ★★ where the pattern is proven here or elsewhere, ★ where it is a strong bet, and no mark where it is a real proposal that a first use will correct.*

---

## How to read this file

A pattern's status is one of four words. **Exists** means it is built and the pattern names what is already true. **Partial** means part of it is built and the rest is named. **Proposed** means it is not built and nothing blocks it but a pull. **Held** means it is not built and a trigger is named for when it may be. Every held pattern carries its trigger in the pattern, so `BACKLOG.md` can point here rather than restate.

The patterns are grouped by scale, as Alexander grouped his from region to construction detail:

- **I. The page** — where things sit: one anatomy for a work, fragments inside the body, the figure, the facade.
- **II. The fragments** — what a body may hold beyond prose: sound, moving image, quoted works, quoted claims, code, specimens, margin notes, anchors, the poem's lineation, the ledger.
- **III. The gathering** — how works are found together: threads as filters, the gathering, the series, the search.
- **IV. Construction** — the materials: which libraries fit this house's epistemics and aesthetics, and which are declined.

Two rules govern the whole language, and they are the same two rules that govern everything else here. **The closed sets stay closed.** A pattern is a way of displaying; it never adds a room, a facet, or a content type. `type` is `poem | essay | case-study | note`, and a Spotify embed inside a Salon essay does not make a fifth type; it makes an essay with a fragment in it. **The site gives.** Every pattern that reaches beyond the house — a third party's player, a font, a script — does so only when the visitor chooses, and says so. `PRIVACY.md` declines trackers; a pattern that would quietly load one is not a pattern of this house.

---

## I. The page

### 1 · ONE ANATOMY OF A WORK ★★

*Context.* A work is shown on at least five surfaces: its page (`WorkView`), the sky's overlay (`WorkOverlay`), the text-led entry (`WorkEntry`), the image-led row (`WorkRow`), and the masonry card (`FacetCard`). `INFORMATION_ARCHITECTURE.md` §"Anatomy" names the work page's five parts from top to bottom: the quiet header, the title, the metadata line, the body, the outward invitation.

*Problem.* **Five renderers of the same value disagree about what a work is.** The overlay shows the summary the page deliberately hides and drops the hero, the referent, the backlinks, and the outward invitation; the three listing surfaces have three different summary policies; two of five room-label maps disagree about casing and one covers four rooms. Each surface answers "what is the anatomy of a work" on its own (`REFINEMENT_AUDIT.md` §"Congruency").

*Forces.* A surface has a reason to omit: the overlay is a panel over a sky, the entry is a line in a list. But omission and disagreement are different things. A visitor who reads the summary in the sky and finds it gone on the page has been told two things about the same work. And a transition (`INTERACTION_DESIGN.md` §"The kind-table") morphs a card into a page only where the two share parts by name.

*Therefore.* **Define the anatomy once, as a value, and let every surface be a projection of it.** The anatomy is an ordered list of named parts — `kicker`, `title`, `meta`, `hero`, `deck`, `body`, `facets`, `referent`, `invitation` — each derived from `Work` by one pure function. A surface declares which parts it shows and in what order, never how to derive them. Where a surface omits a part, the omission is a declared choice in one table, not a forgotten branch. The room label, the date format, and the summary policy live with the anatomy, so five maps become one. The view-transition generators already pair the parts that morph (`hero`, `title`, `meta`, `card`); the anatomy is the list they are names for.

*Consequences.* Adding a part (a `series` line, a margin note count) is one entry in the anatomy and appears wherever a surface asked for it. The overlay stops being a second work page. The test "the page does not render the summary" becomes a row in a table rather than a fact about one component.

*Needs* 2 FRAGMENTS INSIDE THE BODY, 3 THE FIGURE. *Completes* `INFORMATION_ARCHITECTURE.md` §"Anatomy". **Status: proposed.** The refinement audit carries it as the first treatment to adjudicate.

### 2 · FRAGMENTS INSIDE THE BODY ★

*Context.* The body is markdown rendered by `marked` with one extension, the wikilink (`src/shared/content/wikilink-marked.ts`). `CONTENT_SCHEMA.md` §"Body and Markdown" holds MDX per file "for when embedded components become necessary (audio embeds in the Salon, interactive figures in case studies)." Nothing else is rendered specially: an image is a bare `<img>`, a code block is unstyled, a URL is a link.

*Problem.* **A body that wants more than prose has one door, and it is MDX, which is a change of language, not a fragment.** MDX makes a work a program: it imports, it evaluates, it needs a compiler per file, and it puts JSX in Danny's writing surface. The pull is smaller than that — a recording, a clip, a diagram, a quoted poem — and each of those is a *fragment*: a bounded thing inside prose with a kind, a source, and a way of being shown.

*Forces.* The wikilink already proves the shape: a tiny grammar inside markdown, parsed by a `marked` extension, resolved at build time against a registry, failing loudly when it does not resolve. A fragment wants exactly that shape. It also wants to be data before it is a component, so the slice, the search, and the sky can know a work holds a recording without rendering it.

*Therefore.* **Give the body a fragment grammar, small and Obsidian-shaped, and a fragment registry that is the verb registry's twin.** Three forms, all already familiar to a writer:

| Form | Reads as | Example |
|---|---|---|
| A URL alone on its own line | "show this here" | `https://open.spotify.com/track/…` |
| A transclusion | "quote this work here" | `![[garden/small-weather]]`, `![[study/on-enough#the-floor]]` |
| A fenced block with an info string | "this block is a kind of thing" | ```` ```ts ````, ```` ```figure ````, ```` ```specimen geometric-figure ```` |

Each kind is one entry in a registry whose shape is the fabric's `define` (`AGENTS.md` directive 16): a name, a sentence in the site's voice saying what it shows, a **consequence class** from a closed set — `inert` (pure HTML, no script), `live` (the site's own script), `third-party` (another party's script or network, loaded only on the visitor's choice) — a zod schema for what the fragment carries, and a renderer. The `marked` extension tokenizes the three forms into `{ kind, source, attrs }`, the registry validates and resolves at build time, and the renderer emits HTML or a component slot. An unknown kind or an unresolvable transclusion fails the build, as an unresolved wikilink does today. A fragment's kind and source are recorded on the `Work` (`fragments: readonly Fragment[]`), computed like `backlinks`, never authored in frontmatter.

*Consequences.* Markdown stays markdown; a work with a recording in it is still two frontmatter fields and a body. MDX stays held, now with a sharper trigger: a fragment that needs to *compose* with prose at runtime rather than sit inside it. The lossless handshake to watch for (directive 8): the wikilink grammar and the transclusion grammar are one grammar with one leading `!`, so `scanWikilinks` and the fragment scanner share a parser, and a transclusion is a `references` edge in the slice with origin `declared`.

*Needs* the wikilink engine (exists). *Completes* 1 ONE ANATOMY; every pattern in II. **Status: proposed.** Trigger for the first fragment kind: the first work that wants one, which the Salon will supply.

### 3 · THE FIGURE ★★

*Context.* `imageSchema` carries one image per work — `{ src, alt, caption?, credit? }` — with `alt` required and `caption` and `credit` deliberately separate: "a caption can be evocative where a credit must be exact" (`src/shared/content/schema.ts`). `WorkHero` renders it; `ImgSlot` renders the honest stand-in when there is no art. `CONTENT_SCHEMA.md` holds multi-attachment "until a work demands it."

*Problem.* **An image inside the body has none of the care the hero has.** Markdown `![alt](src)` becomes a bare `<img>`: no caption, no credit, no aspect box (so it shifts the page when it loads), no `loading="lazy"`, no responsive sources, no place in the light and dark palettes.

*Therefore.* **One figure, everywhere an image appears.** A figure is `image` plus a `placement` (`hero | inline | margin`), rendered as `<figure>` with the caption as `<figcaption>` and the credit as `creditText` for the machines (`SEO_AND_META.md`). It reserves its aspect ratio from the file at build time so nothing shifts; it lazy-loads below the fold; it takes the paper's tone in dark mode rather than glowing white against umber. The hero is the figure at `placement: hero`; a body image is the figure at `placement: inline`; a wide one may be a margin figure once 11 THE MARGIN NOTE exists. The stand-in stays honest: a figure with no art is an `ImgSlot`, never a placeholder that pretends.

*Consequences.* `MEDIA_STRATEGY.md`'s presentation half is this pattern; its preparation half (formats, sizing, where files live) stays a grounds concern. The build learns image dimensions once, in the loader, the way it learns backlinks.

*Needs* 2 FRAGMENTS (for inline placement). *Completes* 1 ONE ANATOMY. **Status: partial** — the hero exists; the inline figure and the aspect box are proposed.

### 4 · THE FACADE ★★

*Context.* The site declines trackers, cookies beyond the theme, and third-party scripts (`PRIVACY.md`). A Spotify player, a YouTube clip, or a Vimeo clip is an iframe that connects to another party the moment it renders, and brings a few hundred kilobytes of script with it. The performance budget is 100 KB of JavaScript (`PERFORMANCE_BUDGET.md`).

*Problem.* **A third party's player cannot be shown the way the third party ships it without the site quietly becoming a surface that reports on its visitors.**

*Forces.* The visitor came to listen; the recording is the point of the work. But listening is a choice, and the site's whole register is to open a door and stand back. The facade pattern — a static, honest stand-in that becomes the real player only on click — is the recommended default for embeds in 2026 and is what Lighthouse asks for; `lite-youtube-embed` proved it, and privacy-first facade components exist for Spotify, SoundCloud, Vimeo, and others.

*Therefore.* **Every `third-party` fragment renders as a facade first: the work's own paper, the referent's museum label, a still if there is one, and one plain sentence — *Listen on Spotify* — that is a real button.** No connection is made until the button is pressed; on press, the facade preconnects and replaces itself with the player. The facade is built from data the site already holds at build time: the referent (`referentSchema`: type, name, creator, year, url) and the provider's oEmbed response, fetched once at build and committed as JSON beside the work, so the build never depends on the provider being up and the provenance is minted at the event. The sentence the button carries is the site's voice (`VOICE_AND_COPY.md`), never the provider's chrome. Under `prefers-reduced-motion` nothing plays on its own; under no circumstance does anything autoplay.

*Consequences.* The privacy declaration stays true without an exception. The facade is the same shape as `ImgSlot`: an honest slot that says what it is. Two providers, two adapters, one facade.

*Needs* 3 THE FIGURE (the still), the referent (exists). *Completes* 5 SOUND IN THE ROOM, 6 MOVING IMAGE. **Status: proposed.** Trigger: the first Salon work with a recording.

---

## II. The fragments

### 5 · SOUND IN THE ROOM ★

*Context.* The Salon is the cellist's son's room; `listening` is one of its three postures; `music-composition`, `music-album`, and `music-recording` are three of the seven referent types (`DOMAIN_MODEL.md` §"Postures (Salon)"). Today a listening work can name what it listened to and cannot let the visitor hear it.

*Problem.* **A room named for listening has no sound in it.**

*Therefore.* **Two kinds of sound, one pattern.** For a recording that lives elsewhere — Spotify, Bandcamp, a label's page — the fragment is a URL on its own line, rendered as 4 THE FACADE with the referent's label; the provider is read off the URL's host, and the referent's `url` may be the same URL, so a work that already names its referent needs nothing more. For a recording the house owns — Danny's, or his parents', which is where this site's whole attention was learned — the fragment is a path to a file under `src/content/…/audio/`, rendered as the site's own `<audio>` with the browser's controls, a transcript or program note beneath when there is one, and no third party at all. The player never grows a waveform, a queue, or a follow button; it is a recording on a table. Where a work's posture is `listening`, the sound fragment may sit at the `hero` placement, so the room opens with the thing being listened to.

*Consequences.* `referent.url` and the fragment URL are one datum wherever they coincide — a lossless handshake between frontmatter and body. The Schema.org `MusicRecording` the referent already emits gains `audio` when the house owns the file.

*Needs* 2, 4. *Completes* the Salon's `listening` posture. **Status: proposed.** Trigger: the first listening work with a recording.

### 6 · MOVING IMAGE ★

*Context.* `movie` is a referent type; `looking` is a posture. A case study in the Studio may want a short clip of an interface; a Study essay may quote a lecture.

*Therefore.* **Moving image is 4 THE FACADE with a poster, and it never moves until asked.** YouTube and Vimeo by URL on its own line, the poster from oEmbed at build time, the play sentence in the site's voice. A clip the house owns is `<video>` with `preload="metadata"` and a poster, and it is captioned or it does not ship (`ACCESSIBILITY.md`). Under `prefers-reduced-motion` the poster stays still; the visitor's press is the only motion.

*Needs* 3, 4. **Status: proposed.** Trigger: the first work with a clip.

### 7 · THE QUOTED WORK ★★

*Context.* `GRAPH_AND_LINKING.md` makes a wikilink an authored edge, resolved at build time, inverted into backlinks. The slice carries edges with predicates — `references`, `expands_on`, `responds_to`, `part_of`, `succeeds` — and origins (`packages/slice/src/index.ts`). A wikilink is a pointer; there is no way for one work to *hold* another inside it.

*Problem.* **A poem cannot appear inside the essay about it; a case study cannot quote the note that started it. The graph has pointers and no quotations.**

*Therefore.* **A transclusion — `![[room/slug]]`, or `![[room/slug#heading]]` for a section — renders the quoted work's anatomy at `card` grain inside the body: kicker, title, deck, and, for a section, the section's prose, set off as a quotation on the paper with the quoted work's own view-transition names so a press on it is an Open.** A transclusion is a `references` edge with origin `declared`, so the quoted work's backlinks name the quoting one, the sky draws the thread, and the outward invitation composes it. A transclusion of a draft or a future-dated work fails the production build the way an unresolved wikilink does. Depth is one: a quoted work's own transclusions render as links, so a quotation never becomes a nesting.

*Consequences.* The handshake is exact: one grammar (`[[…]]` with a leading `!`), one parser, one edge vocabulary the slice already has. The vault's own transclusion syntax is the same syntax, which matters for 8.

*Needs* 1, 2. *Completes* `GRAPH_AND_LINKING.md` §"What the Graph Is". **Status: proposed.** Trigger: the second work that mentions the first — the same trigger the whole graph engine waits on.

### 8 · THE QUOTED CLAIM ★

*Context.* The vault (`book-research`) is a graph of atomic claims, each a lowercase sentence as a filename, each with sources and a topic map; `FABRIC.md` names it as a source the operator may bless into his space, read through an adapter into a slice. The book's claims and the site's works are "the same kind of thing — a body, a frontmatter, wikilinks" (`CATHEDRALS.md` §"Git Is the Vessel"). The vault's own rule for a cross-space pointer is a weak reference: a citation written on the relating node, with historical text (`AGENTS.md` directive 4).

*Problem.* **An essay in the Study that draws on a claim in the vault can only paraphrase it, and the paraphrase has no provenance.**

*Therefore.* **A claim is quoted by its title through the slice, as a weak reference rendered in the register of a citation:** the claim's sentence, in the vault's own words, with the source it names, set as a margin note or an inline quotation, and a line beneath saying which space it came from and when it was read. The renderer reads the slice, never the vault's files, so the site knows only what the blessed source disclosed (`FABRIC.md` §"Sources"). The edge is `references` across spaces, drawn in the sky as a thread whose origin is `declared` and whose predicate the whisper speaks. When the claim's text changes in the vault after the quotation was made, the quotation keeps its historical text and the build notes the drift, because a citation that silently updates is not a citation.

*Consequences.* The site can hold the book's thinking without holding the book. The pattern is the same as 7 with a space boundary in it, which is exactly what the weak reference was designed for.

*Needs* 7, the vault as a blessed source (waiting). **Status: held.** Trigger: the vault blessed into the operator's space, and one essay that wants a claim.

### 9 · CODE AS ARTIFACT ★★

*Context.* The Studio is craft rendered "professionally legible but not corporate" (`CLAUDE.md`). The site publishes its own making (`TRANSPARENCY.md`). A fenced code block today renders as the browser's default monospace, unstyled, in a page that is otherwise two serifs on paper; `tokens.css` has no `pre` or `code` rule.

*Problem.* **Code is the one material the Studio is made of, and it has no place set for it.**

*Therefore.* **Code is highlighted at build time and never by the visitor's browser.** Shiki runs in the loader with the site's own two themes derived from the palette tokens — umber paper by day, the dimmed room by night — and emits HTML with color as inline CSS variables, so the theme transition dims the code with the room and no grammar or highlighter ships to the client. The block keeps its language as a data attribute, gets a quiet caption line when the info string carries one (```` ```ts title="the fold" ````), and wraps long lines rather than scrolling the page sideways (`RESPONSIVE_STRATEGY.md`'s one column). A second form, **the diff**, renders a unified diff with the site's added and removed tones, for the day an essay wants to show a change rather than a state. Inline `code` is the monospace face at the body's size, on the tag background, never a button.

*Consequences.* Zero runtime cost, which is the only cost the budget allows. Shiki's `core` bundle with only the grammars the works actually use keeps the build fast.

*Needs* 2. *Completes* the Studio. **Status: proposed.** Trigger: the first Studio work, which will carry code.

### 10 · THE SPECIMEN

*Context.* `TRANSPARENCY.md` commits to an annotation system in which a rendered element can say which spec it descends from; `MANIFESTO.md` names the convergence where "the agentic surface and the rendered surface converge." The geometric figure, the Diamond, the Reveal, the daystar are components with specs behind them.

*Problem.* **An essay about the geometric figure cannot show the geometric figure; an essay about the site's motion cannot move.**

*Therefore.* **A specimen is a fragment that renders one of the site's own components, by name, from a registry of components that have consented to be shown** — ```` ```specimen geometric-figure ```` — inside a labeled frame that names the component and links to the spec section it descends from. The registry is a closed list, so a body cannot instantiate arbitrary components; a specimen's consequence class is `live`. The frame is the annotation system's first surface: the same frame that will later let any rendered element reveal its lineage.

*Needs* 2, 9 (a specimen may show its own source beside it). *Completes* `TRANSPARENCY.md` §"Annotation system". **Status: held.** Trigger: the first essay about the making.

### 11 · THE MARGIN NOTE ★

*Context.* The one column is 700 px (`RESPONSIVE_STRATEGY.md`). `marked` registers no footnote extension. An essay in the Study is the kind of writing that wants an aside.

*Therefore.* **Footnotes render as margin notes where there is a margin and as end notes where there is not.** The grammar is GitHub's (`[^1]`); the renderer places the note beside its reference when the viewport is wide enough for a margin outside the column, and folds it into a numbered list beneath the body otherwise; the reference is a real link either way, and each note has an anchor (12). A margin note is set in `text-3`, italic where the prose is roman, and it never hovers or pops.

*Needs* 12. **Status: proposed.** Trigger: the first work with a footnote.

### 12 · THE ANCHOR ★★

*Context.* `INFORMATION_ARCHITECTURE.md` §"Wayfinding Conventions" already commits: "when a work has internal headings, each should receive a stable id so a visitor can link to a section." `GRAPH_AND_LINKING.md` shows `[earlier in this essay](#the-section)`. Today headings have no id, no hash is read anywhere, and the internal link delegation refuses `#` hrefs.

*Problem.* **A work cannot be pointed into, only at.** No section links, no transclusion of a section (7), no margin note anchors (11).

*Therefore.* **Every heading gets an id slugified from its text, stable across builds; the loader records the heading list on the `Work`; the router leaves hash navigation to the browser, which already knows how.** A heading's id is part of the work's address grammar — `/{room}/{slug}#{heading}` — and a transclusion may name it. Duplicate headings within a work get a numeric suffix and a build warning.

*Consequences.* The address grammar in `INFORMATION_ARCHITECTURE.md` gains one segment and nothing else changes.

**Status: proposed.** Small; it pulls the moment any of 7, 11, or an essay with sections arrives.

### 13 · THE POEM'S LINEATION ★★

*Context.* A work of `type: poem` is rendered with `breaks: true`, so a newline is a line (`src/shared/content/loader.ts`), and `WorkEntry` suppresses its summary. *small weather* is the site's one work.

*Problem.* **A poem's form is its lineation, its stanza breaks, and its silences, and markdown knows one of the three.**

*Therefore.* **A poem's body is rendered as verse: a blank line is a stanza break with the poem's own vertical rhythm (a `--spacing-stanza` token), a newline is a line, a line beginning with spaces keeps its indent, and no line is ever reflowed at any width — a long line breaks with a hanging indent, the way a printed poem does.** The title sits closer to the first line than an essay's would; the metadata line is quieter; the outward invitation waits a beat longer (a poem's last line needs the silence after it). Nothing about this pattern is a fragment; it is the `poem` type rendered with care, which `CONTENT_SCHEMA.md` §"Content Types" promised: "type exists for sharpening the rendering."

**Status: partial** — breaks and the summary policy exist; the stanza rhythm, the hanging indent, and the pacing are proposed. Trigger: the second poem, which will show what the first one was hiding.

### 14 · THE LEDGER ★

*Context.* `marked` renders GFM tables; `tokens.css` has no table rule. The specs are full of tables; the site's own making, when published (`TRANSPARENCY.md`), will bring them into the rooms.

*Therefore.* **A table is set as a ledger: hairline rules only, a heading row in the small-caps register, numerals aligned, the whole scrolling inside its own frame rather than widening the page, and a caption when the info carries one.** Nothing zebra-striped, nothing boxed. A table wider than the column at a small viewport folds to a definition list.

**Status: proposed.** Trigger: the first work or published spec with a table.

---

## III. The gathering

### 15 · THREADS, NOT FILTERS ★★

*Context.* Facets are "not categories to sort by. They're the ways Danny moves through the world, made visible as threads you can follow across rooms" (`CLAUDE.md`). `/facet/{a,b}` is an intersection: a work is kept only if it carries every selected thread; the URL is the source of truth; two threads at most are prerendered; the sky lights one facet at a time as attention, not as a filter (`REFINEMENT_AUDIT.md` §"Filtering").

*Problem.* **"Filter" is the wrong word for what a facet page does, and the wrong word produces the wrong controls.** A filter narrows a catalog; a thread is followed. The one place the site has a filter-shaped control, the toggle bar, ends by ejecting the visitor to the Foyer when the last chip is dropped — which the kind-table names Cross, and which is honest only if the Foyer is where a visitor with no thread wanted to be.

*Therefore.* **Keep the semantics and rename the surface after what it does.** Following one thread is `/facet/{a}`; following two at once is `/facet/{a,b}` — *where these two cross* — and the intersection stays AND because a crossing is where both threads are. The control is a row of threads, not a filter bar; its copy says *follow* and *also*; the canonical order is one list (`FACETS` in the schema), declared once and imported everywhere. Dropping the last thread leads not to the Foyer but to 16 THE GATHERING, once it exists, and to the room the visitor came from until then. The sky's lit facet stays what it is — attention, ephemeral — and gains one door: from a lit facet in the sky to its thread page, so the two vocabularies meet at one link.

*Consequences.* Nothing in the URL grammar changes. The one word changes in the specs and in the copy.

**Status: partial.** The semantics exist; the naming, the single canonical order, and the drop-last destination are proposed.

### 16 · THE GATHERING ★

*Context.* The site has no surface that shows every work. `INFORMATION_ARCHITECTURE.md` declines `/posts`, `/blog`, `/archive`, `/tags` — "the house doesn't have those rooms" — and holds an all-facets overview "until a future authored surface wants a 'follow a thread' overview page." Room landings list a room's works; facet pages list a thread's; nothing lists the whole, and so dropping the last thread has nowhere honest to go, and a visitor who wants *everything by date* cannot have it.

*Problem.* **A house with five rooms has no place where the household gathers.** The plural-noun declination is right; a `/works` route would be a feed. But the absence of a gathering forces every other surface to be one.

*Forces.* A gathering is a place, and the house's grammar says places are rooms or the sky. The sky already gathers every work — as stars, under a presence cap of twenty-four, ranked by resonance. The gathering wanted here is the sky's complement: the same household, on paper, in order.

*Therefore.* **Decide the gathering's algebra now and its surface when it pulls.** The algebra: a gathering is the set of published works narrowed by a *lens* that is a product of independent axes — threads (AND, per 15), rooms (OR: a work is in one room), type (one), posture (one, Salon only) — and ordered by one of a closed set (date descending by default; title; room then date). The lens is URL state, validated by zod through the router's `validateSearch`, so every gathering is a shareable address and reload restores it losslessly: `?threads=craft,body&rooms=garden,study&order=date`. The surface, when it comes, is one page with the row register of `WorkEntry`, virtualized past a hundred works, headed by the threads row (15) and a quiet lens line in the site's voice: *Everything, newest first.* Its name is held; *the hall* and *the commonplace* have been said aloud; neither is settled. Where it lives in the URL is held with the name.

*Consequences.* 15's drop-last destination exists. Search (18) has a surface to land results on. The facet page becomes the gathering with one thread in its lens, which is what it already is.

**Status: held.** Trigger: the first room with more works than a landing wants to list, or the first visitor who asks where everything is.

### 17 · THE SERIES ★

*Context.* `CONTENT_SCHEMA.md` holds series and collections: "if a body of works develops that wants to be grouped, the schema grows a `series` field or a `collection` field. Not yet." The slice has `succeeds` and `part_of` as predicates.

*Therefore.* **A series is not a field; it is two edges.** A work that continues another says so with `succeeds` — authored in frontmatter as `succeeds: room/slug`, the one relational field the schema grows — and the loader inverts it into `precedes`, so a series is a chain the graph already knows how to walk. The work page renders the chain as a quiet line beneath the metadata (*Second of three; after [[…]]*) and the outward invitation offers the next before the room. The sky draws the chain as a thread with the predicate spoken. A collection that is not a sequence is `part_of` a work of `type: note` that names its members, so a collection is itself a work with a body, which is where its reason to exist gets written.

**Status: held.** Trigger: the first work that continues another.

### 18 · SEARCH

*Context.* Held in `INFORMATION_ARCHITECTURE.md` until roughly fifty works. The fabric already runs qmd over the works as a blessed source for the agent's resonance (`FABRIC.md` §"The vendor"). The site is static.

*Therefore.* **When search arrives, it is a slash-summoned quiet input, a build-time index over title, deck, body, headings, and threads, ranked in the browser, landing on 16 THE GATHERING with the query in its lens.** No server, no third party. If qmd's embeddings prove worth their weight for visitors as they have for the agent, the index may carry vectors; the trigger is the day keyword search misses something a visitor plainly asked for.

**Status: held.** Trigger: fifty works.

---

## IV. Construction

The house has a small dependency list and a taste for owning its own shapes: `ImgSlot` is an honest slot written here, not imported; the sky's pure core is written here; the wikilink engine is written here. The rule for a library is the rule for a name — it is a candidate until it earns a place — and the tests are these, in order: **unstyled** (it brings behavior, never a look; the look is `tokens.css`); **static-friendly** (it costs nothing at build time or nothing at runtime, and never both); **honest about the platform** (it uses what the browser has before reinventing it); **small enough to read**; **alive**. What follows is an assessment, not an install list.

| Concern | Candidate | Fit | Verdict |
|---|---|---|---|
| The overlay as a true dialog: focus trap, `inert` background, scroll lock, Escape, restore focus | **Base UI** (`@base-ui/react`, 1.x, from the Radix and Floating UI authors; 35 unstyled components, React 19, Tailwind-friendly) | Unstyled, current, and its `Dialog` does exactly what `REFINEMENT_AUDIT.md` finds missing in `WorkOverlay`. `Toggle Group` and `Toolbar` fit 15's threads row; `Tooltip` and `Popover` fit 10's specimen frame and 11's notes on touch devices. | **Adopt for the dialog first**, as the smallest real version; widen by pattern, never by "we have it now." |
| The same, hook-first | React Aria Components (Adobe) | The deepest accessibility primitives, at the cost of more code per component and a larger surface. | **Hold** as the alternative if Base UI's dialog proves insufficient for the sky's overlay-over-canvas case. |
| The same, cross-framework | Ark UI | State machines under every component; excellent, but its strength is Vue and Solid parity the house does not need. | **Decline** for now. |
| Code highlighting | **Shiki** (`shiki/core` with only the used grammars; VS Code's engine; runs at build) | Build-time HTML, zero client JS, themes as CSS variables — the only shape 9 allows. | **Adopt** with 9. |
| Third-party embeds | A house-written facade after `lite-youtube-embed`'s shape; oEmbed fetched at build by a script under `scripts/` and committed as JSON | The facade is thirty lines and the site already owns `ImgSlot`; a library here would bring a look. Spotify, YouTube, and Vimeo all publish oEmbed. | **Write it** with 4. `lite-embeds` is the reference, not the dependency. |
| Route transitions | **The View Transitions API through TanStack Router** (`defaultViewTransition: true`, exists) | Native, already the site's body; same-document transitions are baseline in every major browser. | **Keep.** Cross-document transitions stay held until Firefox lands them; the site is one document anyway. |
| Layout animation, gestures | Motion (`motion/react`, formerly Framer Motion; `animateView()` now free in core) | Capable, and its `animateView` papers over rough edges of the View Transitions API. But the sky's motion is a pure core with a thin shell, and a second animation system would be a second body. | **Decline** unless a gesture the platform cannot express arrives; name it then. |
| Long lists | **TanStack Virtual** | Headless, tiny, the router's sibling. | **Adopt** with 16, past a hundred works, not before. |
| URL state | **TanStack Router `validateSearch` with zod** (exists for `?focus` and `?posture`) | The lens in 16 is search params; the router already validates them and types them. One note: the zod adapter and zod 4 need the one-line fix the router's guide names. | **Keep and extend.** |
| Markdown fragments | **A `marked` extension**, after the wikilink extension's shape | The precedent is in the tree and tested; a remark/rehype pipeline would be a second parser for one grammar. | **Extend `marked`.** MDX stays held with its sharper trigger (2). |
| Search | `cmdk` for the palette; a house-written index (MiniSearch-class, or qmd's output) | Held with 18. | **Hold.** |
| Styled kits | shadcn/ui, Chakra, MUI, Mantine | Each brings a look, and the look here is the point. | **Decline**, as `DESIGN_SYSTEM.md` already implies. |

Sources consulted for the current state of these candidates, 2026-09-06: [Base UI releases](https://base-ui.com/react/overview/releases) and [its 1.0 announcement](https://news.ycombinator.com/item?id=46245401); [the headless-library comparison at LogRocket](https://blog.logrocket.com/headless-ui-alternatives/); [MDN and CSS-Tricks on cross-document view transitions](https://css-tricks.com/cross-document-view-transitions-part-1/); [Spotify's oEmbed reference](https://developer.spotify.com/documentation/embeds/reference/oembed); [react-shiki and Shiki's build-time usage](https://github.com/avgvstvs96/react-shiki); [Motion's React docs](https://motion.dev/); [web.dev on embed facades](https://web.dev/articles/embed-best-practices) and [lite-embeds](https://github.com/abderrahimghazali/lite-embeds); [TanStack's search params guide](https://tanstack.com/router/latest/docs/guide/search-params).

---

## What This Language Does Not Govern

- What a work *is*: `DOMAIN_MODEL.md`, `CONTENT_SCHEMA.md`. The closed sets are theirs.
- How a fragment's file is prepared and stored — formats, sizes, where audio lives, the CDN question: the preparation half of `MEDIA_STRATEGY.md`, still a gap on the grounds.
- The look of any pattern beyond what its forces require: `DESIGN_SYSTEM.md`.
- The sky's own patterns — the star, the thread, the whisper, the daystar: `CONSTELLATION_WALK.md` and its family. Where a pattern here meets the sky (7's thread, 15's door), the sky's spec governs the sky's side.
- Which of these gets built next. A pattern pulls or it waits; the triggers are in the patterns.

---

## Enforced in Code

Today: patterns 1, 3, 13, and 15 are partially real in `WorkView`, `WorkHero`, `ImgSlot`, the loader's `breaks` for poems, `getDisplayWorksByFacetsSync`'s intersection, and `FacetToggleBar`'s depth cap. Nothing else in this file is code. When a pattern is built, this section names the file, the test, and the invariant, in the ledger style the other specs use.

---

*Drafted 2026-09-06 from the state of the tree at that day, with the implementation audit in `REFINEMENT_AUDIT.md` as its evidence. A pattern is revised when a first use corrects it, which Alexander expected and so do we.*
