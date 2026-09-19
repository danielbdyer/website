# Objects of Scale — A Scrolling Bestiary of Speed

*Drafted on 2026-09-19 from Danny's proposal of the same day, and from his idea that followed it: that this could be a place you secretly travel to from one of the sky's stars. This file defines the bestiary as a surface — what it is, how it is reached, how a page runs, how the seven straws morph, what a page is as data, and what is held — and the passage from the sky that leads to it. It sits beside [`CONSTELLATION.md`](./CONSTELLATION.md) and downstream of [`CONSTELLATION_WALK.md`](./CONSTELLATION_WALK.md), whose whisper offers the passage. It does not govern how the sky is walked, what a work is, or the house's rooms; the bestiary is none of these.*

Danny's felt reference, offered plainly: *1.25 football fields per second is nuts.* It began as a reply to a tweet.

---

## The Idea

A scroll-through bestiary where every speed record moves past its object of scale at the true rate, so the visitor feels the number instead of reading it.

Each page is one record and one unit: a falcon and a football field, a tortoise and a banana, a space probe and a marathon. While the visitor stays on a page, the motion runs continuously at the real relative velocity. Scroll away and come back, and it starts over from frame zero, so the speed lands fresh every time.

The look borrows *Superhot*'s stillness: a pale matte stage, flat saturated color, no texture. Everything that moves is drawn with solid-color bendy-straw tubes, and the tubes are the motion itself. They stream in as ribbons, set the scene, then bend at their elbows and fold into the character. Scroll on, and the character unknots back into ribbons that carry the visitor to the next page.

**A good unit is a zoom lens.** The speeds on the ladder span about seventeen orders of magnitude, from fingernail growth to light. No single animation scale can hold that. The right object of scale does the zooming instead, and brings each speed to a rate a body can watch: between one unit every few seconds and about eight per second. The snail passes a grain of rice every 2.5 seconds; light laps the Earth 7.5 times a second; both are watchable. That gives every page a tempo, and the best units keep landing near a resting pulse — Bolt passes a school bus at 61 beats per minute, the cheetah a blue whale at 60, the falcon a football field at 59 — which may be why they feel right.

**The rule for a unit: kin or stranger.** It is related to the thing (water speed in bathtubs; the fastest land animal in the largest animal) or has nothing to do with it (a tortoise in bananas). Anything in between is just a conversion.

---

## The Passage

The bestiary is not a room of the house. It is not in the nav, not in the sitemap, not a work in a room. It is a place the sky keeps, off the chart, and the sky offers it at one star only, to a visitor who stands there a while.

**Where.** The passage leaves from *small weather* — the one star in the sky today, and the right one: a poem in which distance is "just geography," and the physics that authorizes the vanishing is something one writes. The bestiary is physics that makes distance feelable; its last page says that lying still you travel a marathon every 1.4 seconds. Whether the passage stays at this star as the corpus grows is Danny's; the passage is data (`src/shared/content/passage.ts`), and moving it is one edit.

**How.** The whisper's fourth line. Beneath *where you are* and *what leads away* and, when the words say so, *in concordance*, the sky adds — after the visitor has stood at the star for a held while, seven seconds today — *off the chart · Objects of Scale*. The line fades in over a breath. It is a real link, and taking it leaves the sky. Before the dwell nothing is rendered: a secret is not in the accessibility tree either. The dwell counts only while the sky is still; a sky under way does not count as standing. Coming straight back to a star already dwelled at finds the line already there — the walk's memory.

**Why a dwell, and not a ninth bearing.** The sky's grammar is *destinations*: the visitor is always somewhere, and only naming somewhere else moves the sky (`CONSTELLATION_WALK.md` §"The Principles"). A passage that appeared on arrival would be a bearing, and the compass is closed — eight facets, eight points. A passage that appears to the visitor who stays is of a piece with the poem it leaves from, which is about staying. The sky keeps it the way a house keeps a door behind a bookcase. `DECISIONS.md` D-007 records the alternatives.

**The way back** is the star the passage left from: the bestiary's one link out, *← the sky*, opens the sky standing at *small weather*. The address (`/scale`) is a real address — it prerenders and it can be shared — and it carries `noindex, nofollow`, so the sitemap leaves it out. A secret is not indexed. `DECISIONS.md` D-008.

---

## The Experience

One page per record, full-screen, snapping into place. The page runs while the visitor holds still and restarts whenever they arrive.

- **Scroll-snap, one stop per page.** A hard flick cannot skip a page, so every record gets its entrance.
- **On arrival the page's clock resets to zero.** Ribbons enter, lay down the scene, and fold into the character in about a second and a half. Then the loop runs for as long as the visitor stays.
- **While the visitor is there the motion is continuous and at the true rate.** A counter ticks up: *bananas since you got here: 14*. Leave and return, and it starts again at zero.
- **Between pages the transition is tied to the thumb.** Drag slowly and a falcon can be held half-unfolded.

This is *Superhot* turned inside out. In the game, time moves only when you move. Here the world runs only when you hold still, and scrolling is the one thing that takes it apart. The final page cashes that in (held; §"The Ladder").

**Every page lives one cycle.** Ribbons (the page arrives, clock at zero) → Folding (the scene laid down, the elbows set) → Character (looping at the true rate for as long as you stay) → Unfolding (the scroll begins; released early, it refolds; carried through, the next page snaps in). Only the unfolding is driven by scroll position; everything else runs on the page's own clock.

**Two kinds of time.** Unfolding is scrubbed by the thumb. Folding runs on the page clock after arrival. That split is what makes the entrance feel fresh and the exit feel held. A scroll that starts to leave and is pulled back by the snap resumes the clock; the restart is reserved for arriving from a different page.

---

## Visual Language

A pale matte stage, one saturated color per page, black scale objects, and nothing on screen that isn't a tube or a flat plane.

- **Stage.** Bone white to pale concrete. One soft directional light and faint contact shadows. No gradients, no texture, no outlines. The bestiary keeps its own palette and does not follow the house's hour; it is not in the house's light. Off-planet, the stage inverts to black and the tubes go ultraviolet and white (held with those pages).
- **Tubes.** Solid color, matte, constant diameter, round caps. The only surface detail anywhere is the corrugated accordion section where a tube bends. That elbow is the signature.
- **Tube grammar.** Slow things get a few fat tubes with lazy curves. Fast things get thin tubes, ruler-straight runs, and sharp elbows. The speed should be guessable from the line quality before anything moves.
- **Scale objects.** Flat black and low-poly, like *Superhot*'s pickups. They are furniture. The tubes are the life.
- **Color ladder.** Moss and teal for the slow end, coral and red for bodies, signal orange and yellow for machines. Off-planet, ultraviolet and white on black.
- **Type.** One heavy grotesk. The line settles in sentence case under the stage. Whether it first flashes in beats, *Superhot*-style — ONE. BLUE WHALE. PER SECOND. — is held (§"Held"), and bounded by the flash limit either way. The face itself is held; the system's grotesk stands in.

Lineage pinned to the wall: Marey's chronophotographs, Balla's *Dynamism of a Dog on a Leash*, Duchamp's *Nude Descending a Staircase*, long-exposure light trails, manga speed lines. Each draws the motion instead of the mover. This draws both and lets them trade places.

---

## The Morph

Every character is a knot tied in its own velocity. The tubes that express the motion are the same tubes that bend into the thing that moves.

**The same seven straws play every role.** Seven tubes travel the whole site and never leave the screen. They change color, thickness, and bend. Tube 3 is the falcon's spine, then the tortoise's shell spiral, then a Blackbird's wing edge. This makes the ribbons the protagonist and gives the site one unbroken line of motion from first page to last. It also makes the morph tractable, because tube 3 always maps to tube 3.

**Three states.** *Ribbon:* the tubes run roughly parallel and stream along the page's axis of motion — velocity with no body yet; the scale objects lay themselves down while the ribbons pass. *Fold:* elbows appear where the character needs joints; the tubes kink in sequence, head to tail, over about half a second. *Character:* the figure holds its place on stage while the scale objects stream past it. The exit runs in reverse, from the tail forward, driven by scroll position; the outgoing ribbons sweep off in the scroll direction and shift hue on the way, arriving as the next page's incoming ribbons.

**A straw bends; it never stretches or melts.** The morph is built around that rule. A tube is held two ways: as the points it is drawn through, and as its *bends* — a start, a heading per segment, a length per segment. Morphing in points shrinks a tube through a collapsed average and reads as melting. Morphing in bends — the headings slerped along the shortest turn, the lengths lerped, the points integrated back — keeps every segment its length and reads as a straw bending. Each pose is smoothed through its control points by a centripetal Catmull-Rom (uniform splines loop and cusp at sharp elbows) and resampled to forty-eight evenly spaced points, so a morph pairs segment with segment and never bunches. **The fold wave:** each segment gets its own delayed progress, a smoothstep offset by its position along the tube, so the bend travels head to tail on entry and tail to head on exit.

**Elbows.** Where the turn between one sample and the next crosses a threshold, the painter draws ribs across the tube. Ribs appear exactly where the straw bends and nowhere else.

**Loose ends, the toon ramp, and the ground shadow** are drawn in their smallest form today: a two-tone stroke (the shade full width, the lit color narrower and a little higher), and each tube flattened onto the ground at eight percent. The streamer flutter on the last fifteen percent of each tube, scaled by the log of the page's speed, is held.

---

## Anatomy of a Page

A stage on top, one line beneath it, a counter, and an honest clock.

| Element | What it does |
|---|---|
| **Stage** | The top seventy percent of the screen. The character holds near center; the scale objects tile end to end along the ground and stream past at the true rate. Motion stays inside this band and never runs full-bleed. |
| **The line** | *One football field per second.* Large. The only sentence most people will read. A real heading. |
| **The facts** | Subject, speed in m/s and mph, who set the record and when. Small. |
| **The counter** | Units passed since the visitor arrived. Resets on every arrival. Not a live region, or it would announce every whale. |
| **The clock badge** | *Real time* on most pages. Time-lapse and slow-motion pages state their factor plainly: ×600 for bamboo, ÷1,000,000,000 for light's foot per nanosecond. |
| **Index** | *10 / 24 · bodies* — the record's rung on the ladder and its tier. |

The promise to the viewer: true in time, scaled in space, and labeled whenever it isn't.

---

## The Ladder

Twenty-four pages: a cold open on the car, a drop to the slowest things on Earth, then the climb to light, and one page past it. Two are drawn (**05** and **10**); the rest are held with the triggers in §"Held."

| # | Page | The line | Tempo or clock |
|---|---|---|---|
| 00 | BYD Yangwang U9 Xtreme (title page) | 1.25 football fields per second | 75 bpm |
| 01 | Continents drifting, the Moon leaving | Both at the speed your fingernails grow | Time-lapse |
| 02 | Bamboo, record growth | The tip of a kitchen clock's hour hand | Time-lapse ×600 |
| 03 | Archie, the record racing snail | A grain of rice every 2.5 seconds | 24 bpm |
| 04 | Heinz ketchup | 4.5 Archies | Race |
| **05** | **Bertie, the fastest tortoise** | **A banana and a half per second** | **88 bpm** |
| 06 | Fastest 50 m freestyle | A bathtub and a half per second | 94 bpm |
| 07 | Usain Bolt | One school bus per second | 61 bpm |
| 08 | House cat against Bolt | The cat wins | Race |
| 09 | Cheetah | One blue whale per second | 60 bpm |
| **10** | **Peregrine falcon, diving** | **One football field per second** | **59 bpm** |
| 11 | Hummingbird, mite, copepod | Hundreds of itself per second | A blur, on purpose |
| 12 | Fastest tennis serve | Three courts per second, on one court | 184 bpm |
| 13 | Shuttlecock against the car | The shuttlecock wins | Race |
| 14 | Guangzhou elevator (vertical) | Four stacked giraffes per second | 229 bpm |
| 15 | L0 maglev | 3.3 Olympic pools per second | 201 bpm |
| 16 | ThrustSSC, and sound itself | One Eiffel Tower per second | 62 bpm |
| 17 | Felix Baumgartner (vertical) | Falls faster than the record car drives | Race |
| 18 | SR-71 Blackbird | Three Eiffel Towers per second | 178 bpm |
| 19 | The ISS (stage inverts to black) | A marathon every 5.5 seconds | 11 bpm |
| 20 | Voyager 1 | Two Everests per second | 115 bpm |
| 21 | Parker Solar Probe | 4.5 marathons per second | 273 bpm |
| 22 | Light | 7.5 laps of Earth per second | 449 bpm |
| 23 | You, lying still | A marathon every 1.4 seconds | 42 bpm |

Tempo does not rise with speed, and that is a feature. As the things get faster the units get bigger, so the ISS page, at one marathon every 5.5 seconds, is the calmest on the site. The climb is felt in what the unit has become: rice, bananas, buses, towers, mountains, the planet. Callbacks reward attention: the car ghosts past the falcon at 1.27 falcons; the swimmer from page 06 is still in the first pool when the maglev clears its seventieth; the marathon that takes the ISS 5.5 seconds returns on the last page as the unit for *you*.

**The last page breaks the grammar on purpose.** The ribbons fold into a figure lying down, holding a small rectangle of light; the counter reads zero; two full seconds of nothing, the only still frame on the site. Then the stage itself starts to move: hundreds of hairline ribbons stream behind the figure, who stays still. On every other page the character moved past a still world; here the world moves past a still character. *A marathon every 1.4 seconds. You, around the sun.* One more scroll, inside the page: *Five marathons per second. You, around the galaxy. Faster than anything we have ever built.* And the last counter: *Since you opened this page, you have travelled 61,000 km* — counting for as long as the visitor stays. Held; §"Held."

---

## A Page Is Data

Every record is one value, and the rate on screen is computed from the facts, never typed by hand.

```ts
interface SpeedRecord {
  id: string;                     // "falcon", also the URL hash
  rung: number;                   // its place on the ladder of twenty-four
  tier: 'slow' | 'bodies' | 'machines' | 'offplanet' | 'finale';
  line: string;                   // "One football field per second."
  claim: number;                  // the count the line claims: 1, or 1.5
  subject: { name; speedMs; holder; source; asOf };
  unit: { name; plural; lengthM; silhouette; screenWidth };
  clock: { mode: 'real' | 'lapse' | 'slowmo'; factor };
  color: string;
  ribbon: { angle; spread; wave }; // the entry pose
  tubes: Seven<Tube>;             // exactly seven: the character pose
}
// derived at load, never stored:
//   rate = subject.speedMs / unit.lengthM   (units per second)
//   bpm  = rate * 60
```

A test walks every record and checks that the number the line claims is the computed rate to the nearest half unit. If a record falls, one edit to `speedMs` updates the motion, the counter, and the tempo, and the test says whether the sentence still holds. The joke only works if the math does.

**Facts.** The two records' figures — the falcon's 108.2 m/s (242 mph, "Frightful," 2005) against a 120-yard field with its end zones (109.73 m); Bertie's 0.28 m/s (2014) against a 19 cm banana — are from the proposal and from memory, each with a source name and an as-of date in the data. A sourcing pass with citations is owed before the ladder is called finished; §"Held."

---

## Invariants

- **INV-SCL-001 — the line is true.** The number the line claims equals the computed rate, rounded to the nearest half unit. Tested over every record.
- **INV-SCL-002 — seven tubes, drawn head to tail.** Every record carries exactly seven tubes (the type says so), each with at least two control points, each resampled to the same count so morphs pair segment with segment.
- **INV-SCL-003 — the rate ceiling.** No page above eight units per second: on a 60 Hz screen a tiled object strobes or runs backward past about half a unit per frame. The unit choice already protects this; the test makes it a rule.
- **INV-SCL-004 — the clock is a difference of timestamps.** Elapsed time is *now* minus the arrival, less time paused, times the page's clock factor. Never a sum of frame deltas, which drift and are throttled in background tabs. Pausing holds it; resuming continues it; arrival alone resets it.
- **INV-SCL-005 — the rate is derived.** No record stores a rate or a tempo. Both are functions of the facts.

---

## Accessibility Limits

Three hard requirements shape the design.

- **A pause control is mandatory.** WCAG 2.2.2 requires a way to pause any motion that starts on its own and runs longer than five seconds. Every page qualifies. One persistent button, over the stage, that reads *Pause* while the motion runs and *Play* while it does not. The space bar is held (§"Held"): native scroll already means *page down* to it, and the proposal asks for both.
- **Flash limits.** WCAG 2.3.1 caps flashing at three per second. Any *Superhot*-style type flash has to stay under that. On the fastest pages the black scale objects stay under a quarter of the stage's area and lean on the smear, so a goalpost passing 7.5 times a second never reads as a strobe.
- **Reduced motion.** With `prefers-reduced-motion`, the page opens on the resolved character, still, with the counter ticking and the same control reading *Play*. Streaming motion always stays inside the stage band.
- **Screen readers.** The canvas is `aria-hidden`. Each page is a section labelled by its line, a real heading, with the facts as text. The counter is not a live region.
- **Keyboard.** Arrow keys, space, and page keys move between pages through the native scroll. Focus order follows page order. The pause button and the way back are real controls at the touch-target size.

---

## Declinations

- **No scroll-jacking.** The browser's own scroll-snap is used and listened to. Momentum, keyboard paging, and assistive tech work for free.
- **No 3D yet.** The proposal's smallest next thing is the falcon and Bertie in 2D canvas, before anything else, to answer three questions: does a seven-tube falcon read as a falcon; does restart-on-arrival feel fresh or nag; does a football field passing at 59 beats per minute feel like 242 mph. Those are answered by living with it, not by building the engine first. `DECISIONS.md` D-009.
- **No new content, no chrome, in the sky.** The passage adds one line to the whisper, at one star, after a dwell. It is not a bearing, not a star, not a legend.
- **No sound yet.** Sound exists in the design and is off by default; it is held with the ticker.

---

## Held — Named So It Is Not Lost

- **The other twenty-two rungs**, and with them the race pages (the seven straws split four and three), the two vertical pages, the time-lapse pages, the blur page (drawn as a streak texture on purpose, the one page where the unit fails to tame the number), the dark stage off-planet, and the finale with its site-wide counter. *Trigger:* Danny draws, or asks for, the next character; the falcon and Bertie have answered the three questions.
- **The 3D renderer.** Three.js tubes swept along Catmull-Rom curves with rotation-minimizing frames (Frenet frames flip at inflections and on straight runs), pre-allocated rings with buffers rewritten in place, a two-tone toon shader with the shade derived in OKLCH, a narrow twenty-degree camera so it reads as a flat diorama. The 2D renderer stays as the no-WebGL fallback, drawing the same pose data. *Trigger:* the slice's three questions answered yes, and a page worth a screenshot wanted.
- **The lab.** A route where any two pages can be picked, the morph scrubbed by hand, stagger and easing tuned, the rate watched. The proposal builds it in the first week; this pass used a headless browser instead. *Trigger:* the third character.
- **The authoring pipeline.** A Figma template with seven named stroke layers, t1 the spine and t7 the tail, every path drawn head to tail; a script that samples each to forty-eight points and writes the tubes into the record. Today the two characters are control points typed by hand. *Trigger:* the same as the lab.
- **The grotesk.** One heavy face, self-hosted like the two serifs. The system's grotesk stands in.
- **The type flash** in *Superhot* beats — or whether that is one homage too many.
- **The smear** from three to eight units per second, the streamer flutter on loose ends, the ghost of the car past the falcon at 1.27 falcons, and the callbacks between pages.
- **Sound.** One soft tick per unit passed, scheduled ahead on the audio clock; the whole site a tempo ladder from 11 to 449 beats per minute. Off by default.
- **Share images**, one still per page of the resolved character with its line.
- **The space bar** as pause.
- **A sourcing pass** on every fact, with a citation, before the ladder is called done.
- **Whether seven is the right number of tubes.** Five reads cleaner; nine draws better animals.
- **Whether the tubes keep soft 3D shading or go fully flat.**
- **Where the passage lives** as the corpus grows: at *small weather* for now.
- **The dwell.** Seven seconds today (`PASSAGE_DWELL_MS`), a felt tuning.
- **What was in the vision that isn't here yet.** Danny's own open question, kept open.

---

## What This File Does Not Govern

- How the sky is walked, what the whisper says at every other star, and the walk's memory — `CONSTELLATION_WALK.md`.
- What a work is, what a room holds — `DOMAIN_MODEL.md`. The bestiary is neither.
- The house's palette and type — `DESIGN_SYSTEM.md`. The bestiary's palette is its own, declared in its own block of `tokens.css`, and named there as such.
- Motion in the rooms — `INTERACTION_DESIGN.md`. The bestiary's motion is the subject, not the register.
- The performance budget the route lives under — `PERFORMANCE_BUDGET.md`. The route is one lazy chunk with no dependency beyond React and the router; the 3D renderer, when it comes, will be a lazy layer.

---

## Enforced in Code

*Shipped 2026-09-19:* the straws in `src/shared/scale/tubes.ts` (the two holdings, the centripetal spline, the resample, the fold wave, the morph in bends, the turn at a point); the records and their derived rate and tempo in `src/shared/scale/records.ts`; the page's clock and phases in `src/shared/scale/director.ts`; the picture at one moment in `src/shared/scale/frame.ts`; the 2D painter in `src/shared/dom/scalePainter.ts`; the shell — the schedule, the scroll, the arrival, the pause, the tab — in `src/shared/hooks/useBestiary.ts`; the placard in `src/shared/molecules/Placard/`; the organism in `src/shared/organisms/Bestiary/`; the route at `src/app/routes/scale.tsx`, treated by the root as the sky is treated and prerendered with `noindex`. The passage: `src/shared/content/passage.ts`, the dwell in `src/shared/hooks/useDwell.ts`, the fourth line in `src/shared/molecules/SkyPassage/`, composed beneath the whisper in the constellation organism. The invariants INV-SCL-001 to 004 are tests in `src/shared/scale/records.test.ts` and `tubes.test.ts`; INV-SCL-005 is the shape of the type.
