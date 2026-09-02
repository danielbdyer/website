# The Walk — How the Sky Is Traveled

*Drafted on 2026-09-01 from a conversation with Danny, who asked to set the constellation down and align on first principles before scaffolding again. This file defines how the sky is traveled: not floated over, not only looked at, but walked — from star to star along the threads, with intent. It sits downstream of [`CONSTELLATION.md`](./CONSTELLATION.md) (the experience of the sky) and [`CONSTELLATION_HORIZON.md`](./CONSTELLATION_HORIZON.md) (the rendering architecture), beside [`CONSTELLATION_PARALLEL.md`](./CONSTELLATION_PARALLEL.md) (how a page and its star face each other). It governs placement, the lines drawn at rest, motion, and the small grammar of orientation. It does not govern how the firmament is painted, how the hours change, or what a work is.*

Danny's felt reference, offered plainly: the trench run in *A New Hope*. Forward motion through structure. A destination framed ahead. Walls streaming past. Nothing about it is ambient; every foot of it is chosen.

---

## The Image

You stand at a star. Around you, the nearest stars are named; farther ones are only lights. Beneath the star you stand at, a whisper in second voice says where you are — its title, its room — and what leads away: the facets it carries, each a bearing you can take. You choose *becoming*. The sky moves toward it, along the thread, and for a held second you are traveling: the stars beside you slide past, the deep field turns a little slower than they do, the destination grows. You arrive. The star acknowledges you — two gold rings widen out of it and hold — and its own neighborhood reveals itself: new names, new bearings. Behind you, the thread you walked stays lit. The tree of the corpus unfolds one junction at a time, in the order you chose to walk it. The sphere has no edge; keep going and you come round.

Enter the star you stand at, and it becomes readable — the work opens in the sky. Look down, and you are on the ground again, exactly where you left it.

---

## The Principles

These were agreed on 2026-09-01 and are the spine of this file. The rest is consequence.

1. **Travel is volitional.** The sky moves only toward something the visitor named — a star, a bearing, a thread. Nothing pulls, drifts, coasts, or demonstrates on its own.
2. **Travel is forward.** The camera moves *along* the thread from here to there, with depth: stars ahead grow, stars beside slide past, the deep field parallaxes. Arrival is a settle and a reveal.
3. **The sky is closed.** The sphere wraps. Every direction continues; there is no edge and no end.
4. **The visitor is always somewhere.** *Here* is a star or the pole. Its neighborhood is named; farther stars are lights. Choosing a neighbor travels; entering *here* opens the work.
5. **Facets are the bearings.** The eight facets are the polestar's eight points — the compass of the sky. A work sits where its facets pull it. Each facet's stars form one figure, lit when attended. From any star, its facets are the bearings it offers.
6. **Stars are uniform.** A work is a work. Hue is the primary facet; gold is attention.
7. **A place has a ground and a still point.** The ridge and the Foyer beneath; the polestar at the pole; the heavens turning about it on the clock. Two hours, one chart, dusk between (`CONSTELLATION.md`).
8. **No new content, no chrome.** Every star is a real link; no-JS and reduced motion get a still chart; the sky refuses legend, search, zoom, selection, and metrics. The only words are the whisper.
9. **It grows like a garden.** A new work adds a star and extends its figures by a stroke; nothing else moves. The returning visitor finds the sky where the hour has carried it, and sees what is new bloom (held: `CONSTELLATION_DESIGN.md` §"C14. NewStarBloom").
10. **The horizon is generative.** Proposals will appear as ghost stars and ghost threads awaiting blessing. Nothing built now may foreclose that.

---

## The Compass

The eight facets take the eight points of the polestar. Adjacent points share a hue, so the dome reads as four chromatic arcs: warm (`craft`, `body`), rose (`beauty`, `language`), violet (`consciousness`, `becoming`), gold (`leadership`, `relation`). The bearings, in degrees of azimuth: craft 0, body 45, beauty 90, language 135, consciousness 180, becoming 225, leadership 270, relation 315.

**Placement is a sentence.** A work sits at the centroid of its facets' anchors on the dome, each anchor a fixed distance from the pole along its bearing. A single-facet work sits on its bearing; a many-faceted work is pulled inward, toward the pole, by the facets that disagree about which way it should go. A work whose facets pull in all directions rests near the still center — a true thing to say about it. A small deterministic jitter per slug separates works that share a facet set exactly. Adding a work never moves another.

**Gaps are honest.** Where no work points, no star sits. The compass is drawn faintly in the sky itself (the meridians and rings of the chart), so an empty bearing reads as *nothing yet points that way*, not as a void.

**The pole** is where the visitor stands before any star — the still point, the polestar's figure. From the pole, all eight bearings are offered; each leads to the nearest star that carries that facet.

*Held: a frontmatter override (`sky:` with a bearing and a distance) for the rare star Danny wants to place by hand. The pull is real — "every star placed" is the authorial trace the design doc asks for — but the corpus has not yet produced a star that wants it.*

---

## What the Sky Draws at Rest

**Figures, not a mesh.** Each facet's member stars are joined by the fewest strokes that connect them — a spanning tree over their geodesic distances — and that tree is the facet's **figure**. Sixteen works with two to four facets each give roughly thirty strokes, each belonging to a named figure, in place of the hundred lines that facet co-membership drew as a complete graph. At rest the figures are hairlines in their facet's hue. When a facet is attended — its bearing hovered, or a star that carries it stood at — its figure lights.

**Derived relation is attention, not line.** Facet co-membership is a lens: it shows on hover, as the lit figure, and never as a resting mesh. The design doc's sign for threads holds: *threads were drawn, not derived*. When wikilinks arrive in the writing, they are drawn at rest between figures as the only cross-figure lines, because a hand made them.

**Stars are uniform.** No magnitude. Hue from the primary facet. The active star carries gold: the echo, the halo's claim, the label.

**Names belong to the neighborhood.** Only *here* and its neighbors along the figures carry labels at rest. Everything farther is light. Context grows exactly as far as the visitor can reach, which is what makes reaching feel like a decision.

---

## Travel

**A destination, then motion.** Travel begins only when the visitor names where to go. The camera's surface point moves from *here* to *there* along the great circle in a held second — the *Held* register of `CONSTELLATION_DESIGN.md` §"Motion Register", 1–2 s scaled to the distance — on the site's signature ease. During the crossing the camera dollies in toward the surface and back out, so the stars beside the path stream past faster than the destination approaches, and the atmosphere's deep field, which turns slower than the stars, deepens the frame. This is the trench: velocity read as depth, not as speed.

**Arrival acknowledges.** The destination becomes *here*: the echo widens, the label settles, the whisper changes, the new neighborhood's names fade in. The thread walked stays lit.

**Nothing ambient.** No wells, no flick, no coast, no demonstration drift, no settle assist. The heavens still turn on the clock, the stars twinkle, the atmosphere breathes; those are the sky's own motions, not the visitor's.

**Reduced motion** collapses travel to an instant arrival — the new *here* simply is, with its whisper and its names.

---

## Input

| Gesture | Result |
|---|---|
| **Hover a star** | Its label; its figures light softly; its threads bloom |
| **Click a star that is not here** | Travel to it |
| **Click, or Enter on, the star that is here** | Open the work in the sky (`/sky/{room}/{slug}`) |
| **Hover a thread** | Both endpoints light; the facet's name at the midpoint |
| **Click a thread** | Travel along it to its far end |
| **Hover a bearing** (a facet word in the whisper) | That facet's figure lights |
| **Click a bearing** | Travel along that facet to its nearest star |
| **Arrow keys** | Travel to the neighbor in that screen direction |
| **Tab** | Focus moves through the stars in stable order; Enter travels or opens |
| **Scroll down at rest, ArrowDown, Escape, the return link** | Look down: the ground returns |

**Drag is retired.** With destination travel the grab is unnecessary, and the earlier physics drag was the thing that made the sky feel like a machine. The mouse-look peer stays at a degree or two of parallax so the space breathes with attention. *Held: an additional interaction surface if the viewport comes to feel empty of things to take hold of — Danny's condition is that hover be good and threads be clickable first.*

---

## The Whisper

The sky speaks once, in second voice, beneath the star the visitor stands at:

> *small weather · the Garden*
> *relation · body · becoming · language*

The first line is where you are. The second is what leads away — each facet a bearing, each a real control. A bearing with nowhere to go yet reads dim and offers nothing. At the pole the first line is *the polestar* and the second is all eight bearings. The whisper fades through travel and returns with the new *here*. It is the only persistent text on the surface besides the return link, and it is italic, quiet, and never a sentence.

---

## The Walk's Memory

Within a session the sky remembers the walk: stars the visitor has stood at stay a shade brighter, threads walked stay a shade more present, and the neighborhoods revealed stay revealed. The unexplored stays dark. This is what makes the tree feel as though it is unfolding rather than being redrawn. The memory is the session's — it dissolves between visits, per `CONSTELLATION_DESIGN.md` §"Living-Document Behavior". *Here* persists within the session so a return from a work lands where the visitor stood.

---

## The Generative Horizon

Danny's far image: a surface where he can author, or bless agent-authored additions to the graph, in conversation — proposals appearing as ghost stars and ghost threads in the sky, taken up or let go. This file does not build it. It names what today must keep open:

- **The graph stays live data.** The sky renders from `ConstellationGraph`; a proposal is a node or edge in that graph with a different state, not a different surface.
- **States are representable.** Today a work is published or draft. The horizon needs a third: *proposed* — authored by an agent, not yet blessed. Proposed stars and threads render as ghosts (dimmed, dashed, unlabeled until attended).
- **Ghosts are the author's until blessed.** Decided 2026-09-01: visitors never see a proposal. The proposed state is an author-only stratum; blessing moves a proposal to the corpus, where it becomes a star like any other and blooms for returning visitors.
- **The whisper is the seam.** A conversational authoring surface would speak in the same second voice, at the same place, offering rather than commanding.

*Held until the writing and the agent both have something to propose.*

---

## What This Supersedes

The physics camera and everything built on it — the wells, the flick, the coast, the settle assist, the demonstration drift, the grab of 2026-09-01 — are set down. The even (Fibonacci) placement is set down; the compass placement returns with its meaning now drawn into the sky. The complete co-membership mesh is set down in favor of figures. `CONSTELLATION.md` §"Interaction Vocabulary" is superseded by the table above; §"What the Constellation Shows" by the compass and figures here.

What stays: the two hours and the dusk; the heavens' roll on the clock; the ground; the polestar at the pole; the echo; the work overlay and the work ↔ star jump; the return gesture; the accessibility floor; every star a real link.

---

## Held — Named So It Is Not Lost

- The frontmatter placement override.
- Drag or another interaction surface, on Danny's condition above.
- Where the time slider lands in the walk (it dims what did not yet exist; the walk's memory and the slider share the register of *what was*).
- Constellation names lettered along their figures once the corpus can bear them (`CONSTELLATION.md` §"Held Questions").
- Whether hovering a room's name in the whisper should light the room's stars as a region — rooms are atmospheres, not figures, and the compass is by facet; the room parallel (`CONSTELLATION_PARALLEL.md`) may want this.
- The return flight on refresh, the rest distance and the trench, and the near-straight strings single-facet works make along their bearing — felt tunings, each named with its trigger in `BACKLOG.md`.
- The whisper on small screens shares the foot of the frame with the return link; it sits above the link below the `sm` breakpoint for now.

---

## Enforced in Code

*Shipped 2026-09-01:* the compass placement, the spread, and the facet figures live in `src/shared/content/constellation.ts`; the neighborhood, bearings (with the thread each travels along), names within a stroke, and the arrow-key choice in `src/shared/content/skyWalk.ts`; destination travel with the trench dolly, the wall-clock roll, the mouse-look peer, the reduced-motion instant arrival, and the session's return flight in `src/shared/hooks/useSkyTravel.ts`, which replaced the physics navigation hook (the wells, the flick, the coast, and the demonstration drift are gone); the walk's state in `src/shared/hooks/useSkyWalk.ts` and `src/shared/state/hereStorage.ts`; the input grammar in `src/shared/organisms/Constellation/useSkyInteractions.ts` (a pointer press never triggers focus-travel; only keyboard focus does); the whisper in `src/shared/molecules/SkyWhisper/`; threads as paths in `src/shared/atoms/Thread/Thread.tsx` with the projector moving the hit twin. Not yet built: the proposed state and its author gate, the placement override, the drag as an additional surface.

*If this document and the lived implementation disagree, the lived implementation is the present moment and this file is what it is reaching for. Catch the document up.*
