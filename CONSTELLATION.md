# The Constellation

*Held vision. A future surface for the site, captured here in the form it arrived in — vividly, before the smallest valid implementation reduces it. This file is not yet a specification. It is the dream we are building toward, named so that the building can recognize it when it pulls.*

The graph view, as held in `BACKLOG.md`, was imagined as a force-directed visualization of nodes and edges — the kind of surface you ship after thirty works exist and the web has thickened. This document names a different shape. The graph view this site wants is **a sky** — a constellation visible from the Foyer, reached by looking up, with the same gentle, generous, thought-through register the Foyer already keeps with its visitor. *An alternative way to perceive the site, not a different site.*

The sky is its own route for now. It may eventually fold back into the Foyer — the way a Skyrim character looks up at the stars without leaving the field they're standing in — but the smallest valid first form is a destination you scroll toward, not a mode of the entry.

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

### Daylight: the watercolor ocean

In daylight the sky reads as a *sea-painted dome* — not a literal blue sky, not photographic clouds. A washed, granular, paper-grain expanse, in the same umber family as the Foyer ground but lifted lighter, hazier, suspended. The works appear as **watercolor points** — soft circular bleeds of pigment, edges feathered, each one a small bloom of color sitting on the textured field. *Calm. Floating in the ocean.*

The pigment of each point reads from its primary facet: the four held accents (`--accent-warm`, `--accent-rose`, `--accent-violet`, `--accent-gold`) plus the primary `--accent` give a vocabulary of five hues, distributed across the eight facets — the held accents *graduate from vocabulary to semantics* in this surface, and only in this surface, for now. (The mapping is editorial; the held question of which facet wears which hue belongs to a later moment in this file.)

Threads between points are nearly invisible at rest — *wisps*, faint as shadows of brush-strokes. Hovering reveals them. *Aesthetic resonance of semantic intent.*

The sun is high. The mood is meditative, civic, generous — like the light in a quiet gallery in the late afternoon.

### Night: the firmament

In night mode the sky is *deep night-blue trending toward black* in the upper register, with a hint of warmth (the umber underground bleeding upward) at the horizon. The works appear as **stars** — small bright points with soft halos, each one tuned to a slightly different luminance and a slightly different warmth. The familiar visual grammar of a clear night, but without the literalness of a photograph: this is *paper night*, illustrated, stylized, of-a-piece with the rest of the room.

Threads are *constellation lines* — drawn in pale light, only when invoked, with a faint persistence after the hover-target moves on (the way an afterimage lingers when you look away from a glowing thing). The hues echo the daylight palette but desaturate toward starlight.

The moon is high. The geometric figure, if it has ascended with the body, is the *polestar* — the still point around which the heavens slowly rotate.

The transition between the two modes is the existing 500ms theme transition, *the duration of a sigh*, applied to the entire firmament. The carpet does not re-furl; the sky simply changes its hour. *The same room, dimmed* — promoted from a dark-mode commitment to a constellation-wide invariant.

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

Everything the constellation does is in service of the visitor's attention. The grammar is small.

| Gesture | Result | Felt sense |
|---|---|---|
| **Pointer enters the firmament** | The sky settles, parallax relaxes, ambient motion slows | *The room knows you arrived* |
| **Hover a node** | Threads bloom outward; the node's label appears as a soft caption | *A breath toward what this is* |
| **Hover a thread** | Both endpoints illuminate; midpoint label names the relation | *The connection speaks its own name* |
| **Hover a region of sky** | The room's atmospheric color brightens half a step; no label | *The neighborhood acknowledges itself* |
| **Click a node** | View transition: Open. The point becomes the work's hero on the work page | *The star becomes the page* |
| **Click a thread** | View transition: Step. Crossfade to the facet page or the linked work | *The line you traced becomes the path* |
| **Scroll up while in the sky** | The sky deepens — parallax intensifies, more stars come into focus | *Looking further into the sky* |
| **Scroll down (past the threshold)** | The carpet furls, the body descends, the Foyer returns | *Returning to the room* |

What the constellation refuses:

- **No selection mode.** No "select multiple works to filter" — the grammar of the constellation is *attention*, not *operation*.
- **No search.** The Foyer's ordinary search (when it eventually arrives) belongs to the room beneath, not the sky above.
- **No zoom controls.** The depth of the sky is one continuous parallax; no UI for stepping through zoom levels. *The sky is a place, not an interface.*
- **No legend.** Hover surfaces every label that needs surfacing. A persistent legend would be the constellation explaining itself, which is exactly the chrome the site refuses.

A held question: **constellation patterns.** A constellation, in the cultural sense, is the *named* arrangement — Cassiopeia, Orion, the Plough. The site's stars could carry editorial constellation-names: clusters of works Danny names as a pattern (*The Cathedral* for the works that hover around relation/becoming/language; *The Ground* for the works that orbit body/craft/devotion). This is an authorial act of the same kind as naming a facet. *Held until the constellation has enough stars to name patterns within.*

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
- **Whether the daylight mode and the night mode are the *same constellation* differently lit, or two different aesthetic worlds with the same data.** The pull is the former (same constellation, different hour). Implementation may discover that a faithful daylight mode requires different placement, different density. *Held.*
- **Whether the sky is *one sky* or *one sky per room*.** A visitor at `/garden` could, in theory, scroll up to see *the Garden's sky* — a regional constellation. Held; the first form is one shared sky.
- **Audio.** The Salon is the cellist's son's room. A faint ambient layer in the constellation — a slow drone, a held chord, almost-silent — is in keeping with the register, but audio is a body the site has not yet committed to. *Held until the Salon's first audio work arrives* (which is itself held in `MEDIA_STRATEGY.md`).

---

## Closing

The constellation is the room's ceiling, and the ceiling is a sky. The visitor who stands in the Foyer and looks up sees how the place fits together, and the looking is its own kind of arrival.

The site is small now. *Small weather* is one point of light in the Garden's region of sky. The rest of the firmament is honestly empty. That emptiness is not a failure to render; it is the practice of *enough* — *this can exist now* — applied to a surface that will, over years, fill.

When more stars come — and they will, because the cellist's son keeps his practice — the sky deepens. When the time slider arrives, the sky also has a history. When the held accents settle, the threads find their colors. When the annotation system lands, the strata of the site become visible in the same place its content is.

This is what *the graph becomes a room* means, in full: not a page, not a feature, not a feed. *A place to look up from.*

---

*Drafted on 2026-04-27 from a conversation with Danny. The vision is captured; the smallest valid first form is the next conversation. If this document and the felt sense of the site disagree, slow down. Listen for which one is more true. That slowness is not inefficiency. It is the practice.*
