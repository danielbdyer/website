# The Constellation

*First form shipped on 2026-04-27 at `/sky`. Pass 1 shipped the structural layer — the firmament, the threads, the stars, the keyboard navigation, the SSG-prerendered route. Pass 2 shipped the latent-sphere geometry the visitor moves through — every star a UnitVector3, an orbital camera that trails the cursor, a per-star gravity well that claims the cursor on settle, a companion glyph at the cursor's projected screen position, and a WebGL atmosphere pool that follows the cursor like a candle held over a manuscript. The carpet roll itself shipped early too, as a perspective-camera arrival on /sky mount. Pass 3 (2026-06-12) shipped the atmospheric layer in its full form: a camera-aware WebGL firmament that casts a view ray per pixel through the same pinhole the structural layer projects through — the world-anchored sky gradient, the watercolor weather, the deep micro-starfield, the room quadrants' chromatic atmospheres, star halos that twinkle beneath their structural anchors (pigment bleeds by day, luminous glows by night), and drifting motes with real depth. What remains held: the overscroll-from-Foyer reveal and the daystar's cross-page ascent. This file holds both: the form that exists, and the form it is growing toward. When the lived surface and the held vision disagree, the lived surface is the present moment and this file is what the building is reaching for next.*

*Paired with [`CONSTELLATION_HORIZON.md`](./CONSTELLATION_HORIZON.md) — the technical envisioning of the endpoint (rendering stack, layered composition, data contracts, build-vs-runtime allocation, performance and accessibility invariants, and the migration path working backwards from the finished surface). Where this file holds **the experience**, that file holds **how the experts ship it**.*

The graph view, as held in `BACKLOG.md`, was imagined as a force-directed visualization of nodes and edges — the kind of surface you ship after thirty works exist and the web has thickened. This document names a different shape. The graph view this site wants is **a sky** — a constellation visible from the Foyer, reached by looking up, with the same gentle, generous, thought-through register the Foyer already keeps with its visitor. *An alternative way to perceive the site, not a different site.*

The sky is its own route for now. It may eventually fold back into the Foyer — the way a Skyrim character looks up at the stars without leaving the field they're standing in — but the smallest valid first form is a destination you reach via a small "look up" link, not a mode of the entry.

---

## The Image

Imagine the Foyer as it stands. The wordmark, the welcome lines, the geometric figure rotating once a minute. The room has a ceiling, but you have not yet noticed the ceiling.

You scroll. Not down — up.

The page resists, gently, the way a heavy curtain resists before it lifts. You scroll a little further. A threshold passes. *You have tipped the scales.* The Foyer's umber ground stays underfoot, but the air above it begins to clarify. A twilight carpet rolls out — not a scroll, a **reveal** — gradient bands of dusk-into-night (or dawn-into-day, depending on the hour the room is keeping) unfurling from the top edge of the viewport down toward you.

When the carpet meets the floor, the constellation has arrived. The sun (or the moon — whichever was sitting in the nav corner) has risen with you, taking its place in the sky. Where the geometric figure was the room's heartbeat, the sky is the room's *vault* — the architectural metaphor's most ambitious expression. *The site as a place with stars.*

You can look around. You can hover, you can let your eye drift, you can step closer to a point of light and see a thread it casts to another. You can click any star and arrive at the work it names. You can scroll back down, and the sky furls back up, and the Foyer is still the Foyer, exactly as you left it. *Nothing was lost in the looking.*

This is the register: gentle, generous, inviting, nurturing, entirely thought through. Not a feature. *A second way the room offers itself.*

---

## The Reveal Mechanism

Scroll-up at the Foyer top is the gesture. Not a button-press, not a keyboard chord — a *reaching*. The visitor is already at the natural top of the page; the gesture proposes that there is something above the top, the way looking up in an unfamiliar room proposes the ceiling.

Three things happen at the threshold:

1. **The gravity inverts.** A small amount of additional scroll is needed to cross the threshold — the page resists for ~80–120px of overscroll, like a held breath, before yielding. *Tipping the scales.* This resistance is the spec's voice saying *are you sure?*; once committed, the reveal completes regardless of further input. No flicker, no half-state.

2. **The carpet rolls out.** A painterly gradient unfurls from the top edge of the viewport — five or six wide bands, soft-edged, painted (not stepped) — moving down at a rhythm matched to the existing 600ms reveal easing. The bands settle into a continuous wash by the time they reach the floor: a *firmament*, in the old sense of the word — a surface vault, suspended above the foyer ground.

3. **The body ascends.** The sun or moon icon currently anchored at the nav top-right (the theme toggle) lifts, gently, from its corner and rises into the sky. It takes the place it wants — high, off-center, the daystar of the rendered hour. The theme toggle's *function* remains; the toggle's *position* has just become part of the heavens.

The reverse is symmetric. Scroll back down. The carpet furls. The body descends. The Foyer is intact.

For visitors who do not discover the gesture, a small affordance — a chevron, a pulled-thread of motion just above the wordmark, a quietly pulsing dot at the top edge of the viewport on first visit — invites the looking-up. The affordance fades after first use; the room does not nag.

A keyboard alternative exists. `↑↑` (two up arrows in quick succession) or a labeled "Look up" link in the nav (only appears at the Foyer, only visible when the visitor reaches the top) opens the constellation directly, without overscroll. *The gesture is the canonical path; the keyboard is the honest fallback.*

The route is `/sky` (or `/constellation` — naming held). The path is reachable directly via URL; visitors who land at `/sky` cold see the firmament with the Foyer ground rendered just beneath it, and a "↓ Return to the Foyer" return path for the same gesture in reverse.

---

## Two Render Modes

The constellation respects the room's hour. When the site is in light mode, the sky is *daylight*. When the site is in dark mode, the sky is *night*. These are not skins; they are different ontologies of the same data.

### Daylight: the chart

*Resolved 2026-06-13, from a conversation with Danny. The daylight mode's identity is a **reflecting pool**. Night and day are one sky seen from two directions: at night the visitor looks **up** into the firmament; by day they look **down** into still water that holds it. The water is the reason the daylight mode was always reaching for — the "watercolor ocean" was a wash without a subject, lovely and unaccountable; the pool gives day a point of view as old and as knowing as the night sky's. The decision was made first; the **rendering shipped 2026-06-13** in the WebGL dome's day branch (`atmosphereShaders.ts`, gated by `1 - uNight`), with the 500ms theme fade crossfading the two ontologies (firmament ↔ pool) through `uNight`. Its exact look is being tuned by eye: a first pass deepened the day into a warm umber pool, which read as wildfire smoke; cooling it but keeping the noisy wash read as cold smoke; the lesson both taught is that **billowing noise reads as gas, not water — water is smooth and lined.** The current direction is a cool, still pool with clean horizontal ripple bands (gently warped, drifting slowly), depth gathering toward the near water, and the daystar reflected as a glade broken into horizontal glints by the ripples — a sun on water, not a flame. What remains held: a literal *waterline* edge and per-star reflection doubling (each star mirrored as a second bloom below it). The tone, ripple strength, and reflection are still settling against Danny's eye.*

*Set down 2026-09-01. Danny: "I notice I've never really felt attracted to the day pool." The pool never pulled — a sky the visitor looks **up** into, rendered as water they look **down** into, is a metaphor that argues with the camera; and both renderings of it read as gas or static, never as water. The daylight identity is now **the chart**: by night the visitor stands under the firmament; by day they sit with its drawing — the same sky as ink and pigment on the site's own paper. This is the register the design doc already named (the star atlas, the celestial-chart lines that "fade to the faint construction lines of a celestial map by day," the gold ground the Salon keeps), and it needs no weather to be a place. Shipped 2026-09-01 in the dome's day branch: the page lit from the daystar's side, settling to the ground tone at its foot; the polar rings and twelve meridians drawn faintly in the page's quiet ink (`--text-3`, read into the palette); the room tints as regional watercolor washes near the rim; the stars as painted points; the sun a gilded disc with a warm rim. Held within it: whether the chart wants its constellation-names lettered along their figures once the corpus can bear them (§"Held Questions"), and whether a faint graticule label — the rings' altitudes — belongs on a working chart or is the legend the site refuses.*

In daylight the surface reads as *a page from a working star atlas, open on a table in good light* — not a literal blue sky, not photographic clouds, not water. The site's paper, lit from the sun's side: brightest near the gilded daystar, settling toward the umber ground at the foot of the page, the grain of the sheet showing through. Over it, the chart's construction lines — circles of constant altitude around the polestar, meridians every thirty degrees — drawn in the page's quiet ink, thin as a ruling pen, faint enough to be felt before they are seen. The works appear as **painted points** — watercolor pigment, edges feathered and rim-darkened the way a wet mark dries, each one sitting on the paper rather than glowing above it. The room tints wash the rim as the chart's regional color. *Still, the way a page is still. The sky as its own drawing.*

The pigment of each point reads from its primary facet. The four held accents (`--accent-warm`, `--accent-rose`, `--accent-violet`, `--accent-gold`) graduate from vocabulary to semantics in this surface, and only in this surface. The editorial pairing, now in code at `src/shared/content/constellation.ts` (`FACET_HUE`):

- **`--accent-warm`** — `craft`, `body` *(the hand, the workshop, clay; the ground beneath consciousness)*
- **`--accent-rose`** — `beauty`, `language` *(living growth, bloom; words as music, meaning-making)*
- **`--accent-violet`** — `consciousness`, `becoming` *(the quiet hour, contemplation; the autotelic unfolding of personhood)*
- **`--accent-gold`** — `leadership`, `relation` *(music, warmth seen rather than felt; the space between)*

Two facets share each hue. The difference between a `craft` work and a `body` work is legible in the *position* of the star (Studio sector vs. wherever-the-work-lives) and in the *label* surfaced on hover, not in an exhaustive eight-color palette. *The constellation is small and precise.*

Threads between points are nearly invisible at rest — *wisps*, faint as shadows of brush-strokes. Hovering reveals them. *Aesthetic resonance of semantic intent.*

The sun is high. The mood is meditative, civic, generous — like the light in a quiet gallery in the late afternoon.

### Night: the firmament

In night mode the sky is *deep night-blue trending toward black* in the upper register, with a hint of warmth (the umber underground bleeding upward) at the horizon. The works appear as **stars** — small bright points with soft halos, each one tuned to a slightly different luminance and a slightly different warmth. The familiar visual grammar of a clear night, but without the literalness of a photograph: this is *paper night*, illustrated, stylized, of-a-piece with the rest of the room.

Threads are *constellation lines* — drawn in pale light, only when invoked, with a faint persistence after the hover-target moves on (the way an afterimage lingers when you look away from a glowing thing). The hues echo the daylight palette but desaturate toward starlight.

The moon is high. The geometric figure, if it has ascended with the body, is the *polestar* — the still point around which the heavens slowly rotate.

The transition between the two modes is the room's 500ms theme transition, *the duration of a sigh*, for everything the room owns — and one longer arc for the sky itself, which is the farthest surface and does not change its hour like a switch. The atmosphere takes 1.8s and passes through a **dusk** that belongs to neither hour: violet overhead, rose-gold toward the foot of the frame, a flush along the horizon, fullest halfway and gone at both ends. The deep field leaves early in the dawn and returns late in the dusk, as faint stars do. The setting body sinks and fades over the first part of the arc; the rising one waits and lifts into place, so sun and moon never overlap as an eclipse. The carpet does not re-furl; the sky changes its hour the way a sky does. *The same room, dimmed* — promoted from a dark-mode commitment to a constellation-wide invariant, with the sky permitted its slowness. *(Decided 2026-09-01; INTERACTION_DESIGN.md §"Dark Mode as Room Dimming" names the exception.)*

---

## The Sun and the Moon

The theme toggle currently lives at the nav's top-right, a small button rendering `SunIcon` or `MoonIcon`. In the constellation, the toggle's *position* extends into the sky.

When the visitor crosses the reveal threshold, the existing icon **lifts** — translates and scales gently — out of its corner and into the upper sky. Its function is unchanged; clicking it still toggles the room's hour. But its *home* now is the firmament. While the constellation is open, the icon is the daystar. While the constellation is closed, the icon is the toggle.

This is the kind of move the site already makes with the geometric figure: a small element occupies a place and *means* the place it occupies. In the Foyer, the figure means the body of the room. In the sky, the icon means the hour the sky is keeping.

The transition is matched to the carpet-roll. The icon ascends as the carpet descends; they meet in the middle and settle. On reverse, they retire together.

A subtle and lovely consequence: the act of looking up *promotes* the theme toggle from chrome to celestial body. The visitor who toggles the theme while the constellation is open watches the daystar literally change — sun setting in the west, moon rising in the east, with the firmament shifting beneath them. *The chrome and the content are the same gesture.*

A held question: does the icon's *form* change as it ascends? A nav-corner sun is a small mark; a celestial sun could be larger, more luminous, perhaps gaining a faint corona that wasn't visible before. The pull is yes — the celestial form is the small form *grown into its place* — but the implementation must avoid making the toggle's two forms feel like different objects. *Same body, different room.* This is the same axis the geometric figure walks: the figure could one day grow into the polestar without becoming a different figure.

---

## The Threads

The connections between works are the *meaning* of the graph; they are also the part most easily made noisy. The constellation handles them with restraint.

**At rest, threads are wisps.** Barely-there strokes, washed pastel, granular, *the faint suggestion of a connection rather than its declaration*. A visitor letting their eye wander sees points, and beneath the points an almost-invisible weather of relations.

**On hover of a node, that node's threads bloom.** Wispy pastel vespers — *vesper* in both senses: the evening prayer, and Venus, the evening star. The threads brighten softly, fan outward from the hovered node toward each connected point, and hold. The brightness has a brief overshoot (a small breath of intensity that settles back) that is the visual equivalent of the existing 600ms reveal: *the thread arrives.*

**On hover of a thread, both endpoints are illuminated.** The work at each end takes on the same gentle halo. The thread's own color is amplified. A small label appears at the thread's midpoint — barely chrome, italic, second-voice — naming what the thread *is*: a facet name (*relation*), or "mentioned in" (a wikilink), or "mentions" (the reverse).

**On unhover, the bloom releases.** Not instantly. Threads have a *persistence* — a fade-tail of ~600ms that lets the visitor's eye carry the connection forward as their attention moves on. *The afterimage is information.*

The thread vocabulary is closed and small:

- **Facet threads** carry the hue of the facet they name. Eight hues from the five-color vocabulary; some facets share hues by editorial choice (e.g., `becoming` and `consciousness` may share `--accent-violet`, with the difference legible in the *direction* of the line and the works it joins).
- **Wikilink threads** carry a neutral pale (`--text-3`-warmth), thicker than facet threads, with a directional taper (slightly heavier at the source end).
- **Backlink threads** are the same edges seen from the other side; rendered identically but tagged at the midpoint label as *mentioned in*.

Threads that share both endpoints (a wikilink between two works that also share a facet) render as a *braid* — two strands lightly twined, not a single thicker line. *The connections do not collapse into each other.*

A held discipline: **no thread that has not been authored.** No "you might also like" inferred from substring overlap. No proximity edges from co-tagging beyond what facets already imply. The graph is what the writing has made; the constellation shows that, and only that. *The graph stays one graph only if every edge is authored* (per the manifesto, per `GRAPH_AND_LINKING.md`, repeated here because the constellation is exactly the surface where the temptation will be greatest).

---

## What the Constellation Shows

The constellation's nodes and edges are the same shapes already specified in `DOMAIN_MODEL.md` and `GRAPH_AND_LINKING.md`. Nothing new in the data model. The constellation is a *rendering* of what the site already knows.

**Nodes:**

- **Works** are points. A point has a position, a hue, and a halo — and, on hover, a label, a date, and a thread bloom.
- **Rooms** are *regions of sky*. Not drawn explicitly (no boxes, no zones, no labels in the field) but felt through clustering and through faint chromatic backgrounds: the Studio's region warms toward `--accent-warm`, the Garden's toward `--accent-rose`, the Study's toward `--accent-violet`, the Salon's toward `--accent-gold`. The Foyer's region is the umber ground itself, breathed up into the lower sky. *Rooms are atmospheres of the sky, not borders within it.*
- **The polestar.** The Foyer's geometric figure may, in time, ascend with the body and become the *still point* of the constellation — the polestar around which the heavens rotate over a long, slow cycle. Held; not the first form.

**Edges:**

- Facet co-membership rendered as facet threads (above).
- Wikilinks rendered as authored edges (above).
- *Specs* as nodes is a held question — the strata convergence the manifesto names. Adding spec nodes means the constellation is no longer just a content graph but the site's full self-knowledge as a sky. Beautiful but bigger; held until the annotation system arrives.

**Postures:** Salon works carry one of `listening`, `looking`, `reading`. The constellation distinguishes them by *the shape of the halo*, not the position or the color: a `listening` work has a halo with a faint resonant ring; a `looking` work has a halo with a soft directional gradient; a `reading` work has a halo with a faint horizontal stillness. Three different *qualities of light*, recognizable without legend. (This is editorial; the rendering may discover better forms in implementation.)

**Referents:** A Salon work's external referent (a Klimt painting, a Bach suite) does not appear as a node — referents are not part of the site's graph, they are external citations. But hovering a Salon work surfaces the referent in the side-label, with the same JSON-LD-aware role (composer, author, byArtist) the site already publishes. *The constellation honors what the work points to without absorbing it.*

---

## Interaction Vocabulary

Everything the constellation does is in service of the visitor's attention. The grammar is small, and since the walk ([CONSTELLATION_WALK.md](./CONSTELLATION_WALK.md)) it is a grammar of *destinations*: the visitor is always somewhere, and only naming somewhere else moves the sky.

| Gesture | Result | Felt sense |
|---|---|---|
| **Pointer moves across the firmament** | The camera peers a degree or two toward the cursor — true perspective, near stars shifting more than far; on leave it returns to center | *The space has depth, and it breathes with your attention* |
| **Hover a star** | The halo claims; its label surfaces; its threads bloom | *A breath toward what this is* |
| **Hover a thread** | The thread lights end to end | *The path shows itself* |
| **Hover a bearing in the whisper** | The facet's whole figure lights | *The thread of you, drawn across the sky* |
| **Click a star you are not at** | Travel: the camera crosses the great circle to it in a held second, dipping toward the surface midway; on arrival it is *here* | *You go there* |
| **Click the star you are at** | View transition: Open. The star becomes the work's page in the overlay | *The star becomes the page* |
| **Click a thread** | Travel along it to its far end; the thread is remembered as walked | *The line you traced becomes the path* |
| **Take a bearing (the whisper)** | Travel along that facet's figure to the nearest star that carries it | *Following the thread* |
| **Arrow keys** | Travel to the nearest star in that screen direction, among the neighbors and the bearings' ends | *A step* |
| **Press on the open sky and drag** | A scrub along a track: the hand's direction picks the thread that leaves here that way, and the hand carries you along it; release past the midpoint arrives, before it returns | *Taking hold of the sky, along a line* |
| **Take the whisper's concordant line** | Travel to the work whose words echo this one though no facet joins them | *The edge you would not have thought to look for* |
| **Tab to a star** | Travel to it; Enter opens it | *The same walk, by keyboard* |
| **Scroll down (past the threshold)** | The carpet furls, the body descends, the Foyer returns | *Returning to the room* |

What the constellation refuses:

- **No free drag.** Nothing pulls, drifts, coasts, or demonstrates. The hand can take hold of the sky only along a thread that leaves where you stand, and the sky never carries momentum you did not give it.
- **No whole sky at once.** From a star, a capped number of stars are present and the rest recede until the walk brings them close ([CONSTELLATION_WALK.md](./CONSTELLATION_WALK.md) §"Presence"). At the pole, everything.
- **No selection mode.** No "select multiple works to filter" — the grammar of the constellation is *attention*, not *operation*.
- **No search.** The Foyer's ordinary search (when it eventually arrives) belongs to the room beneath, not the sky above.
- **No zoom controls.** The dolly during travel is not a control; it is what crossing feels like. The passive mouse-look peer is of the same continuous space — a degree or two of camera rotation that returns to center — not something the visitor operates. *The sky is a place, not an interface.*
- **No legend.** The whisper says where you are and what leads away — the only persistent words on the surface besides the return link. Nothing explains the sky.

A held question: **constellation patterns.** A constellation, in the cultural sense, is the *named* arrangement — Cassiopeia, Orion, the Plough. The site's stars could carry editorial constellation-names: clusters of works Danny names as a pattern (*The Cathedral* for the works that hover around relation/becoming/language; *The Ground* for the works that orbit body/craft/devotion). This is an authorial act of the same kind as naming a facet. The facet figures are the sky's own drawing; a named pattern would be Danny's. *Held until the constellation has enough stars to name patterns within.*

---

## The Rendering Layer

"Really advanced rendering graphics" — the user's phrase — is where the imagination meets the shipping discipline. The pull is real: the constellation deserves a rendering layer commensurate with its register. The discipline is to choose technology that serves the felt sense without compromising the site's body (performance, accessibility, the medium's hypertextuality).

The shape that holds both:

**Hybrid: SVG for the structural layer; WebGL or Canvas for the atmospheric layer.**

- **The SVG layer** carries the *nodes and the threads*. Every star is a real DOM element with a real `<a>` link, a real focus state, a real keyboard handler, real `aria` attributes. The constellation is, at its bones, the same kind of navigable surface a `/facet/{facet}` page is — *the medium's hypertextuality preserved*. A screen reader announces the constellation as a list of works grouped by room. A keyboard tab walks the stars in a meaningful order. The graph view is, first and last, *a hypertext*.

- **The atmospheric layer** carries the *firmament* — the carpet, the granular sky-grain, the watercolor bleeds, the parallax depth, the slow rotation, the shimmer. This is rendered in WebGL (likely via a small lib — `ogl`, `regl`, or hand-written shaders; not Three.js, which is heavier than this surface deserves) or Canvas 2D where shaders aren't necessary. The atmospheric layer carries no semantics — it is the body of the sky, not the structure within.

This is the architectural pattern the site already commits to in another register: structure is semantic; presentation is rendered. Nodes are addressable; firmament is not. *No element loses its addressability to atmosphere.*

**Performance budget concerns:**

- The atmospheric layer must not weigh the room down. WebGL-based starfields can ship in ~10–20KB gzipped (without Three.js). A custom shader is preferable to a library where the library brings more than the surface needs.
- Parallax and animation pause when the constellation is offscreen, the same way the geometric figure pauses (`PERFORMANCE_BUDGET.md` and `INTERACTION_DESIGN.md`'s body-conserves-itself principle).
- The constellation's first paint must fit within the existing performance budget — likely as a **route-level code split**, since most visitors reach the Foyer before the sky. Code-splitting the sky is `BACKLOG.md`'s held route-split graduating in a single move. *The trigger for that backlog item arrives with this surface.*
- The constellation respects `prefers-reduced-data` and the `Save-Data` header: in low-data mode, the atmospheric layer falls back to a static, low-fidelity background; the SVG layer remains intact. The graph is still the graph; it just takes off its weather.

**Accessibility invariants:**

- **Keyboard navigation.** Tab walks the stars in a stable order (room-grouped, date-descending). A focused star has a visible focus ring (the site's existing `:focus-visible` ring, repurposed for the sky). Enter activates.
- **Screen readers.** The constellation announces as a `<nav>` landmark with a heading ("The constellation") and an ordered or grouped list of works. Each star is a labeled link. Threads are not announced (they are visual; their information is carried elsewhere — facet pages, outward invitations).
- **Reduced motion.** With `prefers-reduced-motion: reduce`: parallax flattens, ambient motion stops, the carpet-roll becomes a 200ms fade rather than a 600ms unfurl, the celestial body's ascent becomes an instant snap. The constellation is still there, still navigable, still beautiful — *still*, in the literal sense.
- **High contrast.** With `prefers-contrast: more`: thread thresholds, node halos, and the firmament's gradients shift toward higher contrast values. The hue vocabulary thins; node labels become opaque rather than soft.
- **No color-only meaning.** A facet thread's hue is a *complement* to information also carried in the midpoint label and the hover-target's label. Removing color does not remove meaning.

**Rendering technology, held:**

The choice between hand-written WebGL shaders and a small wrapper lib (`ogl`, `regl`) belongs to the implementation moment. The vision does not commit. What it commits to: *whatever ships must serve the felt sense without breaking the existing performance budget or the accessibility invariants.* If the hybrid renders heavier than the budget allows, the atmospheric layer downgrades; the structural layer never does.

---

## How the Constellation Fits the Bigger Picture

This surface is not just a feature. It is *several arrows landing in the same place.*

**The graph becomes a room.** The manifesto's second convergence — "the graph becomes a room" — finds its form. The sky is the room. The constellation is the inhabiting. The graph is no longer an abstract data structure or a possible future visualization; it is *a place a visitor can stand in*.

**The held accents become semantic.** Four accent colors — `--accent-warm`, `--accent-rose`, `--accent-violet`, `--accent-gold` — have lived as vocabulary, not semantics, since `DESIGN_SYSTEM.md` named them. The constellation is the surface that earns the assignment. Each facet wears a hue. The vocabulary stays vocabulary in the rest of the site (facet chips do not adopt these colors elsewhere; the held discipline holds), but here the held becomes spoken. *A doorway someone has finally walked through.*

**The annotation system finds its first surface.** The manifesto's first convergence — "the strata become navigable in the surface itself" — gets a candidate location. The constellation already has a layer-stack (firmament → threads → nodes → labels); adding *spec-aware annotations* to the labels (a node's label gestures toward `WORK_VIEW.tsx`, which descends from `REACT_NORTH_STAR.md`) is a small extension, not a new architecture. The sky is the natural place for the site to first reveal its own making. (Held until the annotation mechanism is decided.)

**The time slider has a place to live.** The manifesto's fourth convergence — the time slider — has been waiting for a surface. The constellation is that surface. Sliding a control along the bottom of the firmament dims stars that didn't yet exist at the chosen moment, fades threads that hadn't yet been authored, thins the atmospheric color toward an earlier palette. *Absence is information.* The site teaches a visitor that a place has a history by letting them see the sky get quieter.

This is what happens when a surface earns its place: it does not just add a feature, it *resolves several held things at once*. The constellation is the convergence the manifesto pointed at, made visible.

**The relationship to the geometric figure.** The figure is the body of the Foyer, rotating once a minute. The constellation is the vault above the Foyer, rotating over a much longer cycle (or not rotating at all — held). They share a register: geometric, slow, structural-warm. Over time, the figure may *ascend* — becoming the polestar — and the two surfaces merge into one. Today they are separate; the figure is below, the constellation is above; the visitor moves between them with the same gesture they use to look at the ceiling.

**The relationship to the Foyer.** The constellation is housed in the Foyer's *spirit* — gentle, generous, inviting, nurturing — even if it lives at its own route for now. A visitor who stands in the Foyer and looks up should feel the continuity. The route separation is implementation pragmatism; the felt sense is one room with a ceiling that can be opened.

---

## The Five Architect-Questions

Per `architecting`'s discipline, applied to this surface:

1. **Is this the right decision for this site's nature?** Yes. The constellation is the visible form of *the one graph* commitment. It is the medium's hypertextuality made architectural at the surface layer. Other sites would build a `/graph` page; this site needs a sky.
2. **What does this decision close off?** A literal force-directed graph view (the kind that other sites ship) is foreclosed. The site does not want that aesthetic; it wants the constellation. Future requests for a "show me the network" feature should be redirected here, not added beside it.
3. **What does this decision open?** The held accents become semantic. The time slider has a home. The annotation system has a candidate first surface. The geometric figure has a path to ascending. *Four held things become possible to ship in their natural sequence.*
4. **What is the cheapest reversal path?** The constellation lives at its own route. If it doesn't pull, retire the route; nothing else changes. Internal references to `/sky` would need updating, but the data layer (works, facets, wikilinks, backlinks) is unchanged. The reversal is a route-level revert.
5. **Who is the decision protecting?** The visitor (offers a second way to perceive the site, gentle and generous), the author (the editorial act of naming constellation-patterns becomes available), the agent (a clear, structural convergence that makes future architectural decisions easier to reason about), the maintainer future-self (held things become resolved at one moment rather than dribbling out).

---

## When This Ships

This file is held vision. It does not commit to a date or a sprint. It commits to a *form* — the form the graph view wants to take when it ships. The triggers that would graduate this from vision to implementation:

- **Enough works to make the constellation legible.** Probably 8–12, not 30. The watercolor daylight mode is honest with fewer points than a force-directed graph; *small weather* alone is a single point in the Garden region of the sky and is already not embarrassing. The pull is *when the sky has more than one star to look at.*
- **The held accents are ready to become semantic.** Once Danny is ready to commit each facet to a hue, the daylight mode's color vocabulary is ready. (This conversation can happen earlier; it does not need to wait.)
- **A performance plan that fits the budget.** A WebGL-on-route plan that ships within the existing bundle budget — likely needs route-level code splitting, which is its own held backlog item.
- **An accessibility plan that holds the site's WCAG 2.1 AA commitment.** The constellation must be navigable, comprehensible, and respectful of preferences before it ships. A spike that proves the keyboard and screen-reader experience is satisfying is non-negotiable.

When these conditions land in the same season, the surface earns its build.

A held question worth naming separately: **does the constellation precede or follow the time slider?** They are mutually enabling. The slider is more interesting when there's a sky to scrub through; the sky is more interesting when there's a slider beneath it. Probably they ship in two passes: the sky first (without the slider, but built so the slider can land in it), the slider second (in the same surface, not its own).

---

## Held Questions

Named so they aren't lost. Each will resolve in its own time.

- **The route name.** `/sky` is gentle and unpretentious. `/constellation` is precise but a little clinical. `/vault` (in the architectural sense — the firmament as ceiling-vault) is rich but requires explanation. *Held; will pull.*
- **Whether the figure ascends.** Today the geometric figure rotates in the Foyer. In the constellation it could stay where it is, ascend to become the polestar, or be retired in favor of the constellation entirely. The pull is to let it ascend, eventually. The first form keeps the figure where it is and the constellation lives above.
- **Whether specs appear as nodes.** The strata convergence wants this. The first form does not include it; it is a richer surface earned later, when the annotation system has settled.
- **The constellation patterns.** Editorial naming of clusters. *Held until the cluster is real.*
- **The "look up" affordance form.** A chevron, a pulled thread, a pulsing dot, an explicit nav link only at Foyer top — held; will pull during implementation against real visitors.
- ~~**Whether the daylight mode and the night mode are the *same constellation* differently lit, or two different aesthetic worlds with the same data.**~~ **Resolved (2026-06-13): the same sky, seen from two directions.** Night is the firmament looked up into; day is the reflecting pool looked down into, holding the same stars in the same positions. One constellation, one layout; the hour changes which way the gaze falls and whether the works read as lights above or reflections below. See §"Two Render Modes › Daylight: the reflecting pool." *The pool's rendering is held as the next pass; the decision is not.*
- ~~**Whether the sky is *one sky* or *one sky per room*.**~~ **Resolved (2026-06-13): one sky, regionally oriented.** A visitor at `/garden` scrolls up into the *one* constellation, oriented to the Garden's region (its works gathered and lit, the rest quieted) — not a second rendered graph. The full paradigm — every surface with a sky-parallel reached by looking up, left by looking down, oriented to what the visitor was attending to — is designed in [`CONSTELLATION_PARALLEL.md`](./CONSTELLATION_PARALLEL.md). The smallest valid first form is the work ↔ star jump; the room and facet parallels pull after.
- **Audio.** The Salon is the cellist's son's room. A faint ambient layer in the constellation — a slow drone, a held chord, almost-silent — is in keeping with the register, but audio is a body the site has not yet committed to. *Held until the Salon's first audio work arrives* (which is itself held in `MEDIA_STRATEGY.md`).

---

## Closing

The constellation is the room's ceiling, and the ceiling is a sky. The visitor who stands in the Foyer and looks up sees how the place fits together, and the looking is its own kind of arrival.

The site is small now. *Small weather* is one point of light in the Garden's region of sky. The rest of the firmament is honestly empty. That emptiness is not a failure to render; it is the practice of *enough* — *this can exist now* — applied to a surface that will, over years, fill.

When more stars come — and they will, because the cellist's son keeps his practice — the sky deepens. When the time slider arrives, the sky also has a history. When the held accents settle, the threads find their colors. When the annotation system lands, the strata of the site become visible in the same place its content is.

This is what *the graph becomes a room* means, in full: not a page, not a feature, not a feed. *A place to look up from.*

---

## What Shipped (First Form)

The full structural future state of the constellation, expanded across multiple commits during a deliberate pilot push:

- **Route.** `/sky` is prerendered SSG via TanStack Start's pages list. The page reaches via a small italic *"↑ Look up"* link in the Foyer. Every navigation between Foyer and Sky is a Cross — `viewTransition={false}` — because the rooms above and below are different atmospheres.
- **Data.** `src/shared/content/constellation.ts` derives the graph from the existing display works. Each non-Foyer work becomes a node with deterministic polar coordinates within its room's 90° sector (Studio NW, Salon NE, Study SE, Garden SW), a hue from its primary facet, and a stable twinkle phase. Each shared facet between two works becomes an edge. Stable across builds — adding a new work never moves existing stars.
- **Atoms.** `Star` (addressable anchor with watercolor-filtered halo + body + 24px hit target + animation-delayed twinkle), `Thread` (thin pale line at rest; on `active`, applies the vespers-bloom filter and widens stroke), `Firmament` (layered radial gradient with sky-glow + zenith + horizon + procedural feTurbulence paper-grain via mix-blend-mode), `ConstellationFilters` (`<defs>` carrying the watercolor-halo and vespers-bloom filter primitives), `Daystar` (sun + moon both rendered, CSS-theme-switched to avoid hydration flash), `Polestar` (the geometric figure inlined at the firmament's center, still — the constellation rotates around it).
- **Hooks.** `useConstellationParallax` attaches pointermove + pointerleave listeners and updates `--parallax-x` / `--parallax-y` CSS variables in [-1, 1]; honors `prefers-reduced-motion` by skipping listener setup. Pure helper `normalizedCursorOffset` extracted for testability.
- **Organism.** `Constellation` composes everything. Pure mapping over precomputed data (`resolveEdges`, `buildRenderableNodes` in `layout.ts`) — no per-render lookups. Event delegation via `data-node-key` and `target.closest` — one handler set serves every star, no per-node closures. The surface announces as `<nav aria-labelledby>` with a sr-only heading naming the count honestly.
- **Motion.** Slow rotation (600s/cycle) on the constellation — an order of magnitude slower than the geometric figure, only noticed if the visitor sits. Twinkle (4.5s ease-in-out) per-star, with deterministic per-slug phase offsets so adjacent stars desync. Cursor parallax with two depths (firmament 6px, sky 14px) and an 800ms signature-easing transition. The carpet rolls out on mount: `.sky-arrival` clip-paths from the top edge over 900ms.
- **Held accents graduate.** The four held accents pair editorially with the eight facets in `FACET_HUE`; two facets share each hue. The pairing lives in TS (not CSS) so the palette stays general and each surface speaks the vocabulary editorially. `DESIGN_SYSTEM.md` updated.
- **Tests.** 178 total, all green. Coverage: data layer, layout primitives, every atom (Star, Thread, Firmament, ConstellationFilters, Daystar, Polestar), the parallax hook, the organism with jest-axe.
- **Build verified.** `/sky/index.html` ships at ~64KB with the structural SVG fully prerendered: small-weather as an addressable `<a href="/garden/small-weather">`, the daystar markup, the polestar at center, the look-up arrival ready, JSON-LD WebSite/Person attached.
- **Interaction retune (2026-06-13).** The drag was slowed toward deliberate weight — a softer spring, halved flick momentum, and a lower angular-velocity cap (8→3.5 rad/s) — so travel reads as surfing a current, not whipping across. The navigation camera was pulled in **under the dome** (orbit distance 1.6× the unit radius): the near hemisphere fills the frame, the zenith centers, the horizon rims — the steady-state framing *is* the looking-up point of view, rather than a globe seen from outside. Coast friction and the settle ease were firmed up to match (the closer view magnifies every motion, so a coast settles into a well decisively rather than wobbling). The arrival was rebuilt: the firmament stays mounted and the structural layer (polestar, threads, stars, companion) **swells into focus** from nothing, flash-free, replacing the paper-folding clip-path/pitch that glitched over the WebGL canvas. And the camera gained a **passive mouse-look peer** — a few degrees of true perspective rotation toward the cursor on hover, returning to center on leave — so the sky reads as a dimensional volume; the CSS layer-parallax was eased back so the cursor drives one coherent parallax. Scope is handled by the **placement**, not by bounding the camera: the stars are spread *evenly* across the dome (a Fibonacci spiral — area-uniform colatitude, golden-angle azimuth), so the content is omnipresent and the next star in any direction is a short, predictable hop, never a long empty stretch. The camera stays free (it follows the cursor unbounded — the globe/dome feeling). An interim experiment that *leashed* travel — first the cursor, then the camera framing the content — was reverted: a bound, however soft, read as constrained; even placement is what makes the sky feel inhabited without a wall. (Earlier placement passes — room-quadrant, then facet-relational — left clusters and gaps; the even spiral supersedes them.)
- **The grab, the clockwork heavens, and the chart (2026-09-01, with Danny).** The drag became a **grab**: the point of sky under the hand when it pressed stays under the hand as it moves — each frame the camera turns by exactly the rotation that carries the point the pointer names back onto the point it grabbed — so the sky travels one-to-one with the hand and never faster; release keeps the hand's own parting velocity, sampled every frame, so a hand that pauses before letting go puts the sky down where it is (the wells then claim only if a star is genuinely near). Two older faults came out from under the old spring drag: the pointer ray-cast took the *near* sphere hit — the empty back of the dome, antipodal to what the visitor saw — so the spring chased a target three radians away at the velocity cap for as long as the pointer sat off-center (the "way too fast"); and it normalized the pointer over the SVG's box rather than the viewbox's cover fit, stretching x and squeezing y. The **600s turn of the heavens** moved from a CSS rotation of the star group to a roll carried by the camera on a wall-clock phase: the CSS spin had turned the labels with the stars (titles read vertically after two and a half minutes) and turned the visible stars away from where the ray-cast, the companion glyph, and the keyboard frame believed them to be. With the roll in the camera every consumer sees one sky, labels stay upright because only positions turn, the phase is the hour's rather than the visit's (a returning visitor finds the sky moved on), and the navigation loop keeps a ten-frames-a-second idle cadence so the sky turns at rest. The daylight mode became **the chart** (§"Daylight: the chart"), and the hour now changes over the sky's own 1.8s arc through dusk (§"Night: the firmament").
- **A place, not a void (2026-09-01, the same pass).** The sky gained a **ground**: a low ridge of the Foyer's umber earth along the foot of the frame, screen-anchored because it is where the visitor stands, with the horizon's warmth gathering over its line — a near-solid silhouette by night, a pale watercolor band at the foot of the page by day, the landscape vignette an old atlas keeps at its margin. The night chart is drawn in light: the polar rings and the twelve meridians appear as gold hairlines on the indigo, breathing on the thirty-second cycle. The **polestar** is drawn in gold ink with two rings around it and now sits at the world's true pole rather than the center of view (the navigation projects it each tick), so the still point stays where the heavens turn and the figure no longer frames the active star like a selection box. A claimed star gains its **echo** — two thin gold rings that widen out of it and hold, the smallest form of the design doc's RadialEcho. The work overlay's panel is framed like a plate in an atlas: a gold hairline at the edge and a fainter line set in from it. The three design posters Danny shared (the design system, the component anatomy, the work surface) were inspiration for this pass, not specification; the outcome is the site's own.
- **The walk (2026-09-01, the same day, with Danny).** The drag paradigm was set down whole and the sky rebuilt from first principles Danny and the agent locked together ([CONSTELLATION_WALK.md](./CONSTELLATION_WALK.md)). The visitor is always *here* — a star or the pole — and only a named destination moves the camera: a star, a thread, a bearing in the whisper, an arrow. Travel crosses the great circle in a held second and dips toward the surface midway so the passing stars stream faster than the destination approaches — the trench run. Stars are placed by the **compass** of their facets (each facet a bearing on the dome; a work at the centroid of its facets' anchors, spread apart where two would coincide), superseding the even spiral: a star's place now says what it is. Threads became **figures** — one spanning tree per facet, in the facet's hue — superseding the co-membership mesh. The **whisper** speaks once, low in the frame: where you stand, and what leads away. The walk remembers for the session: visited stars keep a little gold, walked threads a little light, and a refresh flies you back to where you stood. *The second pass (2026-09-02, with Danny):* the dolly that pulsed the lens across every crossing became a sine glide with the deep field streaking along the travel; the rest distance adapts to the frame so a phone crops nothing; the drag returned as a **scrub along a thread**; the **compass was drawn** — meridians on the eight bearings, the atmosphere's arcs re-keyed from rooms to facet pairs, the facets' names lettered at the rim, the second facet of each hue pair dotted; the sphere gained its **horizon** — a luminous rim by night, an ink circle by day; the labels are laid out so none covers another; and **presence** capped what is shown from a star — near in context by strokes, facets, sphere, and a build-time **concordance** of each work's words — with two strangers kept for the delicious edge and the whisper's third line, *in concordance*.

What is still held — *each one a readiness, each waiting for its own pull, none of them a queue:*

- ~~The rest of the atmospheric WebGL layer.~~ **Shipped (Pass 3, 2026-06-12).** The atmosphere is now a camera-aware WebGL firmament — when WebGL is available, the canvas paints the complete sky and the SVG firmament crossfades out (returning on context loss, Save-Data, forced colors, `prefers-contrast: more`, or any other gate; the structural layer never notices either way). The dome pass casts a per-pixel view ray through the live navigation camera, so the backdrop parallaxes honestly when the visitor travels: a pole-anchored gradient in the constellation's own tokens, domain-warped watercolor weather that breathes, a deep procedural micro-starfield turning with the heavens at a farther layer's slower rate, the room quadrants' chromatic atmospheres (CONSTELLATION.md §"What the Constellation Shows" — *rooms are atmospheres of the sky* — finally spoken in paint), the daystar's gathered glow, and the cursor's pool of attention. Star halos render as instanced sprites pixel-registered with their structural anchors by replaying the SVG's live transform stack each frame — watercolor pigment bleeds by day, luminous twinkling glows by night (the twinkle tokens.css held back returns here as shader work, exactly where its archaeology pointed), crossfading through the theme transition. Drifting motes ride shells just above the sphere, so they move more than the stars beneath them when the camera orbits. Reduced motion holds the shader on a still frame and repaints only when the camera snaps. If a device can't hold the frame budget at full resolution, the atmosphere lowers its own resolution once — the shader simplifies before anything structural does.
- **The overscroll-up reveal gesture from the Foyer.** The first form's `↑ Look up` link is honest; the held richer form is overscroll past a threshold at the Foyer top, the carpet rolling toward the visitor as they reach.
- **The daystar's cross-page morph.** Currently the daystar simply *is* in the firmament when the visitor reaches `/sky`. The held richer form is the nav's theme toggle ascending across pages via View Transitions API as a single morphing element.
- **Spec nodes alongside work nodes (the strata convergence).** Held until the annotation system has settled elsewhere first.
- **Editorial constellation patterns (cluster names).** Held until the corpus has clusters worth naming.
- **Integration with the held time slider.** Held until the temporal manifest is built and the slider arrives in some form.
- **Audio layers in the Salon's region.** Held until a Salon work *requires* sound.
- **Per-room sub-skies.** Held until a visitor's pull asks for regionalization.

Each is named in this file with the form it wants. None is half-implemented. None is queued. *The architecture of patience holds:* the first form is honest about being the first, and any of the held items can pull next — or none of them can, for as long as the site needs to sit. The trigger conditions for each are recorded in [`CONSTELLATION_HORIZON.md`](./CONSTELLATION_HORIZON.md) §"The Readinesses (Working Backwards)" so the building can recognize a pull when it arrives without preempting one that hasn't.

A held item that is never built is not a failure. It is the practice's record of what didn't pull. Holding is a stance.

---

*Drafted on 2026-04-27 from a conversation with Danny. First form shipped the same day; the atmospheric and ambient layers remain the next conversations. If this document and the felt sense of the site disagree, slow down. Listen for which one is more true. That slowness is not inefficiency. It is the practice.*
