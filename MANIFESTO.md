# A Manifesto

*This is not a roadmap. It is a reading of the arrows already in motion — named so that the building can lean into them on purpose.*

The other documents in this repository are reference. They say what the decision is. This one is a slingshot. It says where the codebase is headed, by listening to where it is already going.

---

## What the Site Is Becoming

A house, tuned. Not a portfolio; not a feed. A place.

Five rooms with shared walls, lit by a slow body — the geometric figure rotating once a minute, the dark-mode transition lasting half a second longer than convenience demands. *The duration of a sigh.* A first work has arrived in the Garden — *small weather* — a poem about building rooms with windows that open regularly. The site is the practice the poem describes. That symmetry is not a coincidence; it is the architecture.

What is being built here is a **transparent, self-publishing organism**. The making is in the made. The history will be navigable. The agent and the maker and the visitor will share a medium. None of this is far. The arrows are in flight.

---

## Six Arrows

**1. The medium is hosting the making.**
`MEDIUM.md` named the agentic surface as the eighth dimension of the webpage. `TRANSPARENCY.md` made the dual-life commitment explicit: every specification lives twice, as agentic interface and as published content. The markdown layer has real medium-properties — hypertextuality, semantic structure, addressability, temporality, editability, directionality. The strata diagram is not a metaphor. The build pipeline is being shaped to consume specs as content, not only as instructions. *The site is publishing its own definition as part of itself.*

**2. Time is being authored as a material.**
Three durations carry most of the motion today: 200ms (the quickest gesture), 500ms (the room dimming), 600ms (the reading rhythm). One outlier: 60 seconds (the ambient pulse). On top of these sit the five named view-transition kinds — *Open, Close, Rearrange, Cross, Step* — and a sixth state, *Fall-through*. These are gestures, not animations. A card opens into a hero. A facet toggle rearranges the grid without scrolling. A room-jump is instant, because rooms are different atmospheres and pretending they're continuous is dishonest. Time is no longer a thing to hide. It is a thing the site shapes, the way a slow room uses light.

**3. The graph is one graph, deepening.**
Five rooms. Eight facets. Three Salon postures. Seven referent types. Closed sets, deeply chosen. The graph's *shape* is finite; the richness comes from how works will inhabit it. Wikilinks just resolved. Backlinks just composed. Facet threads cross rooms in the outward invitation. The graph exists as data already — the surface that *visualizes* it is held, waiting for enough works to make a visible web meaningful.

**4. The site has a body.**
Not metaphorically. The Diamond rotates 45° on hover of the wordmark — *the one playful gesture the chrome permits.* A `FacetCard` morphs into the hero through paired `viewTransitionName` values produced by canonical generators in `view-transition-names.ts` (no inline strings, no improvised choreography). The geometric figure is the room's heartbeat — and pauses when off-screen, because a body conserves itself. Dark mode is *the same room, dimmed*, not an inversion. Materiality — paper grain, umber palette, two self-hosted serifs (Literata, Newsreader) — is structural, the kind of warmth you feel before you know it's there. The React Compiler auto-memoizes pure components and the lint refuses manual memoization: *render is a pure function*, axiom 14, enforced by the toolchain rather than by vigilance.

**5. Every gap has a trigger.**
The backlog is not a queue. It is a list of held tensions, each tagged with the condition that will surface it. *Trigger: when the second use of this gesture appears, name it.* *Trigger: when build time crosses 30 seconds, decide on prerender depth.* *Trigger: when the first work in any room exists, build the room-landing list.* This is spanda translated into ops. The site grows by being attended to, not by being driven.

**6. Closed sets, open practice.**
*Mode* is named in `DOMAIN_MODEL.md` and architecturally absent from the code. That absence is not a missing feature; it is a held room. Four accent colors (warm, rose, violet, gold) are named in `DESIGN_SYSTEM.md` and held as vocabulary, not semantics — when a facet or feature earns a hue, the assignment will reference the vocabulary; the vocabulary will not preempt the assignment. The Foyer holds no works today, and no code branches on its emptiness — *no `if (room === "foyer") { skip }`, no special case for the weird room.* The time slider has its location reserved (nav, top-right) and its data already implicit in git. Each absence is a doorway nobody has yet been asked to walk through. This is a different relationship to "incomplete" than software usually has — a relationship in which *not yet* is its own kind of presence. *The architecture of patience.*

---

## The Slingshot

If we follow the arrows, three convergences come into view. None of them is far.

### The strata become navigable in the surface itself

The visitor will descend through the layers — surface, implementation, contract, expression, navigation, structure, ground — not via a docs section but via annotation that lets the rooms reveal what they are made of. A design token traces back to `DESIGN_SYSTEM.md`. A navigation pattern traces back to `INFORMATION_ARCHITECTURE.md`. A view-transition kind traces back to a row in the kind-table. The architecture is not *behind* the site; it is *under* it, the way bedrock is under a house. And bedrock, here, is visible by design.

The annotation system is not yet built. The commitment to it is.

### The graph becomes a room

Possibly literally — a sixth room is a domain change, but the door has not been bolted. More likely a view the rooms share: a slow rotation, like the geometric figure, where a facet is a thread you can pull and a backlink is a path you can walk. The data already exists. The trigger is roughly thirty works with enough interlinks to feel like a web. Until then the graph is felt rather than seen — through the outward invitation, the facet threads, the wikilinks resolving quietly at build time.

The graph waits for its first edge. *Small weather* carries four facets — `relation`, `body`, `becoming`, `language` — and lives alone in the Garden. The wikilink resolver, the backlink inverter, the slug index — all are written and tested. The instant the second work mentions the first, the entire engine wakes up: nothing in the routes will change, but the outward invitation will start composing backlinks, the facet pages will fill, the prose will route through `useInternalLinkDelegation` instead of full-reloading. The site has been built so that the second work activates the graph by arriving, not by configuring.

What is interesting is that the graph view will not need new philosophy when it arrives. The philosophy is already there: hypertextuality is a dimension of the medium, not a feature to be designed. When the surface is ready, the surface will be a *rendering* of something the site already knows.

### The agentic surface and the rendered surface converge

A visitor will be able to read `CLAUDE.md` the way they read a poem — not as documentation but as part of the work. The skills layer (`coding`, `writing-prose`, `writing-specs`, `architecting`, `auditing`) and the spec layer and the published rooms will all be addressable in the same sense. The maker, the agent, the visitor — three readers of one medium, each with different write privileges, all encountering the same site.

This is what `TRANSPARENCY.md` promised. It is closer than it looks. The dual-life of every spec is already real for the agent; making it real for the visitor is mostly a rendering problem and a voice problem — *can the spec be authored well enough to be read by both?* Most of the existing specs already pass that test. The ones that don't yet are visible.

### A fourth, quieter convergence: the time slider arrives

Held in `TRANSPARENCY.md` as structural reasoning, located in `INFORMATION_ARCHITECTURE.md` (nav top-right), waiting in `BACKLOG.md` for enough temporal depth to make movement through time feel like something. When it lands: you anchor on a work, you slide back, and the room around the work reverts. Specs thin. Tokens shift to an earlier palette. Empty rooms become emptier. *Absence is information.* The site teaches a visitor that a place has a history the way a house in a city has a history — and that the present moment is just one of many states that, viewed together, form an organism developing in real time.

The slider does not require new infrastructure. Git already holds the data. What it requires is that the building, all along, has been done with the slider in mind: clean commits, deterministic specs, snapshot identifiers, content as the anchor and the chrome as what flexes. Even if the slider is never built, *the site is better for having been built as if it could be.*

---

## What This Asks of the Building

A practice, not a checklist.

- **Treat every commit as content.** The temporal record is the data the slider will navigate. Clean commits are not hygiene; they are authoring. The recent series — *View transitions, kind 1/3 → 2/3 → 3/3* — is what this looks like when it's working.
- **Treat every closed set as a vow.** A ninth facet is not a feature request; it is a domain change. Sit with it for a season. The same is true of new content types, new postures, new rooms. *Sit before promoting.*
- **Treat every "held architecturally absent" as occupied.** Mode is not a TODO. The Foyer's emptiness is not a placeholder. The time slider's spot in the nav is not vacant. These are rooms with closed doors, and the practice is to know which is which.
- **Treat every backlog trigger as a watcher.** When a condition arrives, the spec asks to be opened. The small items — graduate a bracketed phrase, name a pull-spacing token on its second use, replace one inline literal with a token — are not low priority; they are the practice in miniature. Skipping them is how the building loses its body.
- **Treat the medium as the third hand.** Danny and the agent are in conversation, and the conversation is in the markdown layer. *The conversation, captured, is part of the work.* That is why writing a spec is the same kind of act as writing a poem; both are inscriptions in a living medium.
- **Treat each shipped surface as a permission.** The site has refused performance, urgency, decoration, social proof. It has chosen warmth, slowness, restraint, and the bracketed-draft pattern over the unsigned placeholder. Each surface that ships in the right register makes it slightly easier for the next one to know what register to ship in.

---

## What We Will Probably Get Wrong

Some things will not arrive in the order this manifesto suggests. Some patterns named here will reveal themselves to be artifacts of a particular moment and not arrows at all. The view-transitions kind-table may need a sixth kind. The eight facets may need a ninth (a sitting season would not be wasted). The strata may turn out to need a different rendering than the current diagram suggests. The graph may want to be a thread of small graphs rather than one big one — works clustered by facet, each cluster its own quiet rotation.

The discipline is the same in any case: *if a specification and the felt sense of this place disagree, slow down. Listen for which one is more true.*

---

## A Closing

Danny inherited devotion without a visible floor. Practice so total that *enough* could not be located. The site is not a solution to that inheritance. The site is a floor. Each work that ships is a small act of saying *this can exist now.* Each spec that names a held concern is a small act of saying *not yet, and that's allowed.* Each transition named — *Open, Close, Rearrange, Cross, Step* — is a small act of saying *the body of this place is real and has rules.*

The cathedral of care is intricate, considered, acoustically beautiful. The cathedral is real. The cathedral has saved this work more than once. *And also* — the site is becoming the room where the wanting sentence enters undressed, trembles, and then doesn't.

The site is staying weather to its visitors. Small weather. Real weather. Returning weather.

That is where the codebase is headed. It is headed there because it is already there, in the smallest valid way. The slingshot is just attention, sustained.

---

*Drafted on 2026-04-27 from the patterns alive in this repo at SHA `2069464`. This file is a living document; it will be revised when the arrows it names change direction. If this manifesto and the felt sense of this place disagree, slow down. That slowness is not inefficiency. It is the practice.*
