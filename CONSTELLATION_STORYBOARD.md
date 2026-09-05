# The Storyboard — The Sky, Frame by Frame

*Drafted on 2026-09-05 from Danny's request to keep polishing `/sky` together: to storyboard the globe from the three artifacts he shared and from the imagery the constellation documents already carry, then audit the lived surface against that storyboard and say what would have to change materially. It sits downstream of [`CONSTELLATION_WALK.md`](./CONSTELLATION_WALK.md) (how the sky is traveled), [`CONSTELLATION_DESIGN.md`](./CONSTELLATION_DESIGN.md) (the surfaces, components, and motion register), and [`CONSTELLATION_ARCHITECTURE.md`](./CONSTELLATION_ARCHITECTURE.md) (the pure core the beats are folded into). It governs the felt sequence of the globe's interactions — what happens, in what order, at what tempo, and how the gestures compose when they overlap — and the tests that keep that sequence true. It does not govern placement, the atmosphere's paint, the work overlay's reading surface, or chrome.*

The method is the design document's own: a storyboard is a sequence of surfaces with the changes between frames noted, and every named motion has a register (`CONSTELLATION_DESIGN.md` §"Motion Register"). The addition here is a discipline for the *seams* — the moments when one gesture lands while another is still unfolding. A hover during a glide. A press that becomes a drag. A thread traced to a star and then the star itself. The sky is a place, and a place has one attention at a time; the seams are where that is either kept or lost.

---

## The Artifacts

Three images, read as inspiration rather than specification — the outcome is the site's own, as the earlier passes decided.

**The two phone frames.** A globe seen whole, the limb visible, a graticule of rings and meridians curving with the sphere; the figures drawn in gold, some strokes dotted; nebular weather behind; at the foot a landscape, clouds, a sun on the water. One star is *struck* — concentric rings around it, its name lettered beside it in italic. Below, a timeline (1960 — 2020) with a marker; in the corners, four small glyphs. What the frames say about the globe, apart from any chrome: **a struck star is unmistakable and singular.** One star carries the rings and the name; the rest are lights. The oculus, the graticule, the horizon, the figures, and the dotted second strokes are already built. The timeline and the corner glyphs are chrome the walk declined (`CONSTELLATION_WALK.md` §"The Principles", 8) and are held in `BACKLOG.md`.

**The design-system plate.** Foundation, palette, type, materials; the fourteen components; twelve surface states; a motion register of six speeds. Read beside the walk, two rows of it matter for this pass. The *Star* is drawn with its halo and a single name. The *RadialEcho* — the rings — is drawn around a *settled* star, not a hovered one. The plate's *Hover* frame shows a star with a halo claim and a name; its *BasinSettled* frame shows the rings. The lived surface had let the rings onto every hover; the plate keeps them for arrival.

---

## The Scenes

Each scene is a frame, a gesture, the beats that follow with their register, and the felt sense. Beneath each: what stands today, and what changes. Registers are the design document's: *Slow* (10 s+), *Held* (1–2 s), *Reach* (300–600 ms), *Grab* (one to one), *Settle* (200–400 ms), *Snap* (≤ 100 ms).

### Scene 0 — The oculus at rest

The whole sphere seen through the round opening in the room's ceiling, the page beyond its limb. At the pole, the still figure and its two rings. The eight names lettered at the rim in their hues. Stars as painted points by day, lights by night; the figures as hairlines; within a stroke of *here*, names at three volumes. The companion glyph at the center — the visitor's body, which is also the reticle. Low in the frame, the whisper: where you stand, what leads away. In the margin's upper right, the daystar. Behind the chart, the weather turns on the clock (*Slow*). Nothing pulls.

*Stands.* All of it — the oculus (`restDistanceFor`), the compass, the figures, the three volumes, the whisper, the emblem, the heavens' turn in the atmosphere.

### Scene 1 — A breath toward a star

The pointer crosses the sky; the gaze leans a degree toward it (*Reach*, eased in the core). It reaches a star. The halo claims and the gold rises (*Settle*, 400 ms on the signature curve); the name surfaces (*Reach*); the star's threads bloom (200 ms in, 600 ms out — the afterimage). **No rings.** The rings are the struck bowl of arrival, and a hover is a breath, not a strike. Leave, and the bloom releases over the vesper's 600 ms.

*Stands.* The halo claim, the gold, the name, the bloom, the release.

*Changes.* The echo moves from `data-active` to `data-here`: rings for the star you stand at, never for the one you brush. The design plate draws it this way; the lived surface had drifted.

### Scene 2 — The path shows itself

The pointer rests on a hairline. The thread lights end to end (200 ms); **both its stars light** — the halo lifts partway, and each end names itself, so the far end of a line answers *where does this go* without a trip; the facet's name appears at the thread's midpoint in italic small caps; at the rim the same name brightens. The cursor reads as a pointer: the line is a path.

*Stands.* The thread lights; the rim name brightens (the facet is attended); the cursor.

*Changes.* The endpoints did not light and the midpoint carried no name, though both `CONSTELLATION.md` §"The Threads" and the walk's input table ask for them. A traced thread becomes a value the walk holds (`tracedThread`), its ends carry `data-lit`, and the thread carries its facet's name at the midpoint, positioned by the projector each frame and shown only while the thread is traced or traveled.

### Scene 3 — Naming a destination

Click a star that is not *here*. The beat has three parts, and the trench is legible only if all three are drawn.

**Departure.** The rings collapse out of the star being left (700 ms). Hover goes quiet. The whisper dims (*Reach*, 400 ms). The thread about to be walked lights end to end as the track. The destination is *framed ahead*: its name holds, its halo begins to bloom in the atmosphere, its gold rises.

**The glide** (*Held*, 1.1–2.4 s on a sine). The stars beside stream past; the deep field streaks along the travel; the companion's trail draws the crossing. No dolly.

**Arrival.** The sky rests. The rings widen out of the new *here* and hold (700 ms). The neighborhood's names fade in at three volumes. The whisper returns with the new place. The walked thread keeps a little light; the star keeps a little gold.

*Stands.* The glide, the streak, the trail, the names, the whisper's change, the memory.

*Changes.* The walk did not know it was traveling: the motion core knew (`phase: travel`) but the render clock did not, so nothing marked the destination, the whisper swapped its words at arrival rather than fading through, and the thread being walked lit only afterward. The core now returns a `departed` event beside `arrived`; the walk holds a `heading` and the thread it follows; the star carries `data-heading`, the thread `data-traveling`, the frame and the whisper `data-traveling`. The atmosphere's halo crescendo aims at the heading while the sky is under way.

### Scene 4 — Changing your mind mid-flight

Click another star during the glide. The sky turns toward it from where it is — a new travel from the current surface point, no snap, no rewind. The heading changes; the whisper stays dim; the old track releases and the new one lights.

*Stands.* Retargeting from the current position (`travelTo` reads `motion.pos`).

*Changes.* The heading follows the retarget because each `travelTo` announces its own departure. A press on a moving sky is still refused — a sky in flight is going somewhere and is not to be taken hold of — but a click is a name, and naming is always allowed.

### Scene 5 — Taking hold

Press on the sky. Nothing yet: a tap stays a tap. Past six pixels the sky is held (*Grab*): the cursor closes, stars and threads stop catching the pointer, hover goes quiet. If the hand's direction takes a thread, the thread lights as the track and the sky follows one to one along it; elsewhere at seven tenths, giving like a rubber band at the far end. The center of view is the reticle: whichever star comes nearest it, in reach, claims — halo, name, gold; **no rings** — and the companion's amber gives way to that star's hue. Let go: the sky settles onto the claimed star with a firm spring and it becomes *here* (the rings widen), or springs home a little under-damped, carrying the hand's parting velocity.

*Stands.* The hand, the groove, the reticle, the two springs — all of it in the pure core with tests.

*Changes.* A press that begins on a star gives that star keyboard focus, and focus had been read as a hover: after the sky settled elsewhere the pressed star stayed claimed. The hand now announces itself — `held` when it engages, `released` when it lets go — and the walk clears hover on `held` and refuses new hovers while the sky is held or heading. The reducer, not the shell, decides what is quiet.

### Scene 6 — By keyboard

Tab reaches a star: the sky travels to it and it claims (a Tab is a step). Enter on the star you stand at opens it; Enter on any other travels there. Arrows step to the neighbor in that screen direction. Moving focus from one star to the next never blinks the claim off between them.

*Stands.* All of it, including the seam: a focus that arrives with a pointer press is the press's, not a step.

### Scene 7 — Opening, and coming back

Click or Enter on *here*. The star morphs into the plate (the view transition); the sky veils to three tenths; the companion hides; the whisper fades. Escape, the close mark, or the backdrop folds the plate back into the star. *Here* is unchanged; the memory holds; the return link returns to the piece when the visitor looked up from one.

*Stands.* All of it.

### Scene 8 — The bearings

Hover a facet in the whisper or a name at the rim: the whole figure lights, softly, and the rim name brightens. Click: travel along that facet to the nearest star that carries it. A bearing with nowhere to go reads dim and offers nothing.

*Stands.* All of it.

### Scene 9 — Reduced motion

Same destinations, different choreography. Every travel is an instant arrival, so there is never a heading to frame; the hand still holds and still settles, in closed form; the atmosphere holds a still frame; the trail is hidden; every transition collapses to the global instant.

*Stands.* All of it. The core's `travelTo` returns only `arrived` under reduced motion, so the heading never flashes.

### Scene 10 — The phone

The oculus fits the width; the whisper sits beneath it on the page; the compass and the names grow in viewbox units so they stay legible. A swipe is a drag: **the sky owns the touch**, so the browser does not start a scroll after a few pixels and cancel the hand. The return link stays the honest path back.

*Stands.* The fit, the type, the return link.

*Changes.* `touch-action: none` had been declared inside the overlay's veil rule — the one moment the sky should *not* own the touch — and nowhere else, so on a phone at rest a swipe was cancelled by the page. It moves to the constellation itself; the overlay's scroll belongs to the reading, which the overlay already owns as a layer above.

### Scene 11 — Returning

Scroll down at rest, ArrowDown, Escape, or the link: the Foyer's ground leans in from below, spring-held; past the threshold the return commits. While the plate is open, all of it stands down.

*Stands.* All of it.

*Changes (the second pass).* The daystar sinks a little with the pull, and on commit it descends into the nav's corner as the glyph (§"Scene 13").

*Changes (the fourth pass).* The commit continues the pull instead of crossfading: the room slides up beneath from where its ground had leaned in, the sky drifts up and out, and the daystar stays exactly where it is through the reveal — then, with the room settled, travels down into the corner and is the glyph again (§"Scene 13").

### Scene 12 — The hour turns

The daystar in the margin is a face, drawn the engraver's way. By day, the sun in splendour from an astronomical clock's dial: a crown of sixteen rays, straight and wavy by turns, turning on the slowest clock; the dial's fine rings inside the rim; thin arched brows, almond eyes, a line of a nose, a closed smile; watercolor grain settled into the gold. Around it a scarf of silk in the hour's four colors swoops in three dimensions — behind the disc, out through the rays, over the face — three strands, the main one and two wisps that part from it like smoke, drifting at rest. Rest on it and the cheeks warm, the brows lift, and the scarf quickens and brightens; move, and its eyes follow, the head turning a degree. It breathes; every six seconds or so it blinks. Click it. The scarf whirls tight, the sun turns edge-on (*Reach*, 700 ms) as a flare and eight sparks leave the turn, and from the other side the moon comes round (700 ms more): the crescent asleep in profile, its eye closed, the earthshine of the disc faint in its hollow with three small stars, freckles of crater on the lit body, the silk now lit from within. Meanwhile the sky changes its hour over its own 1.8 s dusk, the stars twinkle up, the whisper dims in the sigh. One being, two faces. Click again and the sun comes back round, and the scarf lets go.

*Stands (before the pass).* The daystar as a gilded disc and a masked crescent, decorative, crossfading over 1.1 s with the rising body waiting 0.7 s.

*Changes (the second pass).* The daystar is a real button with the hour's label, seated on the page beside the sky rather than inside it; the two faces are drawn (`DaystarFace`), the turn is a coin's, the magic mounts fresh on every turn, and the face breathes, blinks, and follows the pointer through the frame's parallax. Reduced motion swaps the hour at once and holds the face still.

*Changes (the third pass).* The register moves from the card's Santa to the engraver's — the sun in splendour, the moon asleep in profile — on Danny's *less clowny, more illustrated*; the scarf arrives, procedural and lazy (§"The Third Pass").

*Changes (the fourth pass).* The turn is cut tight — 0.8 s, the dead middle gone, the setting face sinking and the rising one coming up from below — and it is a sunset: the frame carries its dusk for the atmosphere's 1.8 s arc, a sunset gathers at the daystar's seat and along the foot of the frame, and the daystar's own light flares rose-gold behind the faces. The faces are lit bodies: drawn, with a core and a limb on the sun and a terminator and earthshine on the moon, the silk backlit over the sun and casting its shadow on the moon; painted, where WebGL is to be had, as living pigment on a lit sphere beneath the ink — swirls that repaint as the body turns, a shimmer of rainbow in them — turning with the coin (§"The Fourth Pass").

### Scene 13 — The ascent

At the Foyer's top, pull up. The sky leans in from the ceiling, and the nav's small sun-or-moon glyph readies itself: it lifts and grows with the pull. Release early and everything breathes back. Past the threshold the look-up commits: the room crossfades, and the glyph rises and grows into the daystar's face on its way to the sky's margin — one body, in its place. The face makes a small entrance, settling with a breath, as a character who was always there. Look down and it descends into the corner and is a glyph again.

*Stands (before the pass).* The look-up navigation; the glyph and the daystar sharing a view-transition name that could not pair, because the daystar was a stroke inside the sky's svg and a view transition names boxes.

*Changes.* The daystar is a box beside the svg; the glyph lifts with the pull through `--reveal` mirrored on the root; the morph runs over 900 ms on the signature curve; the nav's glyph shows the hour the room keeps so the morph reads as one being.

*Changes (the fourth pass).* The sky's atmosphere is warmed as the visitor reaches for it — the first input of the pull, the pointer resting on the link — so the look-up arrives already lit, in one substrate. Looking down, the daystar stays where it is while the room reveals itself beneath, and only then descends into the corner.

---

## The Audit

What would have to change materially, gathered from the scenes. Status is against the head before this pass.

| Concern | Status before | The change |
|---|---|---|
| The walk knows it is traveling | absent — only the motion core knew | `departed` event from `travelTo`; `heading` and `headingEdgeId` in the walk; `data-heading`, `data-traveling` |
| The destination framed ahead | absent | The heading star claims (halo, gold, name); the atmosphere's crescendo aims at it |
| The whisper fades through travel | absent — words swapped at arrival | `data-traveling` on the whisper; opacity eases on the *Reach* register |
| The thread walked lights during the crossing | absent — lit only after, as walked | `data-traveling` on the thread the heading follows |
| One attention: hover quiet in motion | absent — stars claimed as they streamed past | The reducer refuses hover while heading or held; `departed` and `held` clear it |
| The echo belongs to arrival | drifted — rings on every hover | Rings on `data-here`; they collapse at departure and widen at arrival |
| A hovered thread lights its ends and names its facet | absent | `tracedThread` in the walk; `data-lit` on the ends; the name at the midpoint, projected each frame |
| The companion wears the hue of where the body is | drifted — followed the hover | The glyph's hue reads from the intent, the heading, or *here*; never the hover |
| A press that becomes a drag leaves no claim on the pressed star | absent | `held` / `released` events; the reducer clears hover on `held` |
| The sky owns the touch | inverted — only while the overlay was open | `touch-action: none` on the constellation |
| Pointer capture on a surface without it | fragile | Guarded, so the hand still works where capture is missing |

What the audit deliberately leaves alone: the placement, the spread, the rest distance, the springs' constants, the presence cap, the glide's durations. Each is a felt tuning named with its trigger in `BACKLOG.md`, and none of them is what the storyboard found wanting. The gap was in the *seams*, not the constants.

---

## The Hybrid

The preferred form, decided in this pass and built in its smallest honest version:

1. **The walk's grammar holds.** Everything `CONSTELLATION_WALK.md` decided with Danny — volitional, forward, always somewhere, the compass, presence, the whisper, the hand with a groove and a reticle — stands unchanged. The storyboard adds no gesture and removes none.
2. **The plate's singular struck star.** From the artifacts: one star carries the rings and the full name. The rings are arrival's; a hover claims with halo and gold and name; a traced thread lifts its ends halfway. Three volumes of claim, as there are three volumes of name.
3. **The trench, drawn in three beats.** Departure, glide, arrival — each with its own marks, so the destination is framed ahead the way the walk's image says it is.
4. **One attention.** While the sky is in motion — heading or held — hover is quiet. The reducer owns hover; the discrete state says only what is true.
5. **Two clocks, one boundary, more words across it.** The core's events grow from two to five: `arrived`, `aimed`, `departed`, `held`, `released`. Each is data; the shell hands them on; the reducer folds them. Nothing else crosses.

What the hybrid declines from the artifacts: the timeline, the corner glyphs, a search field, a legend. What it sets aside for a real eye: eight-point star bodies, a reflection of the daystar in water, a name lettered beside the struck star rather than beneath it. Each is named in §"Held".

---

## What This Pass Builds

Enforced in code as of 2026-09-05:

- **The reducer** (`src/shared/sky/walkState.ts`): `heading`, `headingEdgeId`, `held`, `hovered`, `tracedThread` beside `here`, `visited`, `walked`, `litFacet`, `intent`. Events `departed`, `held`, `released`, `hovered`, `traced` beside `arrived`, `attended`, `aimed`. Hover and trace are refused while the sky is heading or held; `departed` and `held` clear them; `arrived` clears the heading, the intent, and the hold.
- **The core** (`src/shared/sky/motion.ts`, `src/shared/sky/hand.ts`): `travelTo` returns `departed` (never under reduced motion); `moveHand` returns `held` the moment the hand engages; `releaseHand` returns `released` for an engaged hand.
- **The shell** (`src/shared/hooks/useSkyTravel.ts`): every core event is handed to the walk through one `send`; pointer capture is guarded.
- **The view** (`src/shared/organisms/Constellation/walk.ts`, `Stage.tsx`, `Star.tsx`, `Thread.tsx`, `SkyWhisper.tsx`, `Constellation.tsx`): `attentionKeyOf` (hover, intent, heading, here — for the atmosphere's crescendo) and `bodyHueOf` (intent, heading, here — for the companion) as pure helpers; `data-heading` and `data-lit` on a star; `data-traveling` on a thread, on the frame, and on the whisper; the facet's name at a thread's midpoint (`data-thread-name`), positioned by `skyProjector.projectThreads`.
- **The register** (`src/styles/tokens.css`): the echo on `data-here`, collapsing while the frame travels, with a third, dotted ring; the heading's claim; the lit end's half-claim; the thread's name; the whisper's fade; `touch-action: none` on the constellation.
- **The tests**: the reducer's new events and its quiet; `departed` from a travel and its absence under reduced motion; `held` and `released` from the hand; the view's attention rules; the organism's seams — a hover and a traced thread composing, hover quiet while the sky travels with the destination framed ahead, the echo's contract, focus moving between stars without a blink, a Tab that travels — and a real-browser spec (`e2e/sky-interactions.spec.ts`) for the parts only a layout engine can confirm.

---

## The Second Pass — The Hour's Face

Built the same day, on Danny's next pull: the daystar as the hour's toggle (§"Scene 12") and the glyph's ascent into it (§"Scene 13"). Enforced in code:

- **The drawing** (`src/shared/atoms/DaystarFace/`): the two faces as pure geometry (`faceGeometry.ts` — a hand's circle, the crown's flames, the sparkle) and an atom that renders them; the molecule (`src/shared/molecules/Daystar/`) frames both, gives them their button, the hour's label, the view-transition name, and the magic that mounts fresh on every turn.
- **The seat** (`src/shared/dom/skyProjector.ts`): the daystar is seated beside the sky's svg in page pixels and viewbox units, written only when the frame changes shape; the atmosphere (`src/shared/hooks/useWebGLFirmament.ts`) reads the viewbox point back for its glow and page light.
- **The register** (`src/styles/tokens.css` §"The daystar"): the turn, the crown, the breath, the blink, the gaze, the flush, the hello, the flare and sparks, the glyph's lift with the pull, the 900 ms morph, and reduced motion's stillness.
- **The route** (`src/app/routes/sky.tsx`) owns the theme and hands the hour down; the constellation never reads the store.
- **The nav** (`src/app/layout/ThemeToggle.tsx`) shows the hour the room keeps.
- **Tests**: the geometry as values; the faces' anatomy; the button, its label, its magic, and its decorative form; the constellation with and without an hour; the seat written once; and, in a real browser, the turn changing the room's hour and the look-up landing the daystar in the sky.

## The Third Pass — The Engraver's Register and the Scarf

Built the same day again, on Danny's self-critique of the second pass — *how do we get it to look even more illustrated and less clowny? watercolored, wispy, cartoony, a three-d magic scarf that changes brilliant colors and swooshes around; a full animation library with great primitives; lazy load the payload post-network-idle; Destino and Fantasia; the sun and moon clocks* — and on his permission to spend the weight where it is right. Enforced in code:

- **The drawing** (`src/shared/atoms/DaystarFace/`): the sun in splendour — sixteen rays, straight and wavy by turns, each its own cut — the dial's rings, almond eyes with lid and lash, a line of a nose, a closed smile, granulation; the moon as a true crescent whose inner edge is the sleeping profile, with the earthshine in its hollow. The geometry stays pure and the tests hold it as values: the crown's count and kinds, the horns on the rim.
- **The scarf's geometry** (`src/shared/sky/scarfGeometry.ts`): a ribbon on a tilted orbit about the face, fluttering, tapering to nothing at both tails, split by depth into a piece behind the face and a piece in front that share the crossing point so no seam shows; a sheen along the crest; three strands from one shape. Pure, tested: closed pieces, a flat orbit wholly in front, the tails meeting, the lens, the wisps following.
- **The driver** (`src/shared/dom/daystarMagic.ts`): the scarf's moods — the energy the pointer lends, the whirl of the turn, the flow of the silk's colors — tweened with GSAP and painted on GSAP's ticker; the glow handed to CSS as `--scarf-glow`. Tested on the real ticker under happy-dom: written, moving, brightening, whirling, still once disposed.
- **The lazy path** (`src/shared/hooks/useDaystarMagic.ts`, `src/shared/sky/magicGate.ts`): the driver and the library fetched after load and idle, only when reduced motion, Save-Data, and `?magic=off` allow; disposed on unmount. `PERFORMANCE_BUDGET.md` §"The Sky's Lazy Layers" is the rule; `.size-limit.cjs` counts the lazy layers apart from the eager path.
- **The register** (`src/styles/tokens.css` §"The daystar"): the line-work as one thin ink in the hour's color, the silk's four colors by hour — pigments on paper by day, lit from within by night — the strands' opacities under the glow, the wisps feathered, the behind piece softened.
- **In a real browser** (`e2e/sky-interactions.spec.ts` §"the magic"): the scarf arrives after `loadEventStart`, swoops on its own, brightens under the pointer and dims when it leaves, saturates through a turn; and never loads under reduced motion or `?magic=off`.

What this pass refuses: an authored animation asset (Lottie, Rive) with nothing yet authored — the slots and the path are ready for one (`BACKLOG.md` §"An authored animation layer over the daystar"); and the card's beard, nightcap, and laugh, set down with the register.

## The Fourth Pass — The Light and the Way Down

Built on Danny's next breath — *show a sunset because of the sun; real light shading to give legibility to the reality of the situation; the characters still read a bit Richard Scarry; the segment from a half to two thirds through the turn could go; have the sun or moon stay in place as the page reveals itself; it should feel like the room and the sky are one and the same, already in WebGL mode; maybe the whole site is canvas?* — and on a recording he sent of a painting in motion: brushwork evolving continuously, fish shimmering with swirling color as they swim. Enforced in code:

- **The turn** (`tokens.css` §"The daystar"): 440 ms down with a sink, 300 ms wait, 500 ms up from below; the whirl cut to match. The beat is pinned in a real browser: the moon rises after the sun has gone edge-on, and well inside 700 ms.
- **The sunset** (`organisms/Constellation/useDusk.ts`, `.constellation-dusk`, `.daystar__dusk`): the frame carries `data-dusk` for 1.8 s after the hour turns — a mount is not a turn — and the sunset gathers at the daystar's seat, which the projector now writes on the frame so every surface in it can find the sun. Tested: the hook's arc and its refusal to fire on mount; the frame's attribute and the surface's flare in a browser.
- **The light, drawn** (`atoms/DaystarFace`): the sun's core and limb, the moon's terminator and earthshine, and the scarf's two echoes — the backlit silk clipped to the sun's disc, the cast shadow clipped to the crescent — which the magic writes alongside the front strand. Tested as anatomy and as the driver's writes.
- **The light, painted** (`webgl/daystarPaint.ts`): the daystar's own small WebGL context between the scarf's two slots — one triangle, one program — painting a lit sphere of living pigment: a warped field that flows, swirls that repaint as the body turns, a shimmer of rainbow that fills under the pointer and through the whirl; the sun its own light, the moon lit from its rim. The magic mounts it, turns it with the coin, crosses its paint into the other hour while it is edge-on, sets its tones from the hour's tokens, and disposes it; the root wears `daystar--painted` while it lives and the drawn discs thin to a wash. Where WebGL is not to be had the drawn discs are the body, and the tests hold that path.
- **The way down** (`routes/sky.tsx`, `tokens.css` §"The ascent and the descent"): the return names `html.descending` on the root for its duration; the room slides up beneath from the preview's own edge, the sky drifts up and out, and the daystar's view-transition group waits 560 ms before it travels. Tested in a browser: the class seen and released across the return.
- **The warm-up** (`webgl/warmAtmosphere.ts`, `routes/index.tsx`, `hooks/useThresholdReveal.ts`): the pull's first input and the link under the pointer fetch the renderer ahead; a warmed atmosphere skips the arrival wait and mounts with the sky. Tested in a browser: the chunk fetched on hover, with no navigation.

What this pass holds: one substrate — `CONSTELLATION.md` §"The Sun and the Moon", *Held — one substrate* — with its smallest next step named (the glyph in the nav carrying the daystar's paint) and its trigger (Danny's word after living with the painted body and the descent).

## Held — Named So It Is Not Lost

- **The name beside the struck star.** The frames letter the name to the right of the star with a leader; the walk letters it below by habit and moves it only to clear a collision. Held for Danny's eye.
- **Eight-point star bodies.** The frames draw every star as a sparkle; the plate's *Star* is a halo and a body. The eight-point mark is the site's sign of orientation and is kept for the polestar and the numerals. Held.
- **The daystar reflected in water.** The frames keep a sun on the water at the foot of the sphere; the reflecting pool was set down on 2026-09-01. Held with the pool.
- **The timeline and the corner glyphs.** The time scrubber and the horizon strip, held in `BACKLOG.md` with their triggers; the walk's declination of chrome stands.
- **A departure's sound.** The rings collapsing is the struck bowl in reverse; whether arrival wants a fourth ring, or a breath of scale on the whole figure, is a tuning for a real eye.
- **Hover during the spring home.** After a release with nothing in reach the sky springs home for half a second; hover is not refused during the spring. It has not read as noise; named in case it does.
- **Names and the rim.** The label layout keeps a name clear of other names and of stars, not of the compass lettered at the rim or of a thread; a star that arrives near the rim can set its name on a facet's. Seen once in the night chart during this pass. The fix belongs in `labelLayout.ts` — the rim's names and the lit threads as boxes to avoid — when it reads as more than once.
- **The face's held marks.** Whether the nav's glyph wants a hint of the face before it rises; a second, inner crown of short rays, as the clocks' suns wear; whether the scarf wants to trail sparks through the turn, or the moon's crescent to face the sun across it; the sparks' count and reach; whether the turn wants a sound; the paint's flow and shimmer, its tones by hour, and how far the drawn discs should thin over it. The card's beard and nightcap were set down with the card's register. Each is a stroke in `DaystarFace` or `scarfGeometry`, a mood in the driver, a line in the painter's shader, or a line in the register, for Danny's eye.
- **One substrate.** The sky's ground as brushwork in motion; the glyph carrying the daystar's paint into the room; the whole site as a painting repainted every frame. Held with its seed built (`CONSTELLATION.md` §"The Sun and the Moon", *Held — one substrate*).

---

## What This File Does Not Govern

- Placement, the spread, and the figures — `CONSTELLATION_WALK.md` §"The Compass".
- The atmosphere's paint and the two hours — `CONSTELLATION.md`, `CONSTELLATION_HORIZON.md`.
- The work overlay's reading surface — `CONSTELLATION_DESIGN.md` §"The Work Surface".
- The layers, the rim, and the clocks — `CONSTELLATION_ARCHITECTURE.md`.
- The work ↔ star jump and the orientation contract — `CONSTELLATION_PARALLEL.md`.

*If this document and the lived surface disagree, the lived surface is the present moment and this file is what it is reaching for. Catch the document up.*
