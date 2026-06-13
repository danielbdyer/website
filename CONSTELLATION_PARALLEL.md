# The Parallel Sky — Looking Up From Anywhere

*Drafted on 2026-06-13 from a conversation with Danny, who asked that this be designed before it is built. This file defines a navigation paradigm: every surface of the site has a sky-parallel, reached by looking up and left by looking down, oriented to whatever the visitor was just attending to. It sits downstream of [`CONSTELLATION.md`](./CONSTELLATION.md) (the experience of the sky), [`CONSTELLATION_HORIZON.md`](./CONSTELLATION_HORIZON.md) (the rendering architecture), [`INFORMATION_ARCHITECTURE.md`](./INFORMATION_ARCHITECTURE.md) (the site's routes and wayfinding), and [`INTERACTION_DESIGN.md`](./INTERACTION_DESIGN.md) (the look-up gesture, the view-transition vocabulary). It does **not** govern how the sky is rendered, how stars are placed, or what a work is — those are owned upstream. It governs only the relationship between the two ways of perceiving the site, and the gesture that crosses between them.*

This generalizes a thing the site already does once. Today the Foyer can look up into `/sky`. This file says: *so can every room, every work, every facet.* The sky is not a destination beside the site; it is the site seen from above — a second body the whole site shares, entered from wherever you stand.

---

## The Image

You are reading a work in the Study. You reach the top and keep reaching — *up, not down* — and the page does not end; it opens. The ground you were standing on stays beneath you, and the ceiling clarifies into the firmament. But you do not arrive at the polestar, disoriented, having to find your way back to what you were reading. You arrive **at the work's own star**, already lit, its threads bloomed toward the works it shares a facet with. The essay you were inside is now a point of light among the points it is related to. You can see, for the first time, *where this piece sits in the whole.*

You look back down and you are returned to the essay, exactly where you left it.

This is the paradigm: **the page and the sky are two views of the same place, and the gesture between them preserves your orientation.** Looking up never loses your place; it re-frames it. Looking down never loses the sky; it sets it back above you.

---

## The Orientation Contract

The crossing is only generous if it lands you somewhere meaningful. Each surface declares what its sky-parallel centers on. This is the contract; the rest is rendering.

| From (the ground) | Look up lands at (the sky) | Look down returns to |
|---|---|---|
| **A work** `/{room}/{slug}` | That work's star, *open* — centered, active, threads bloomed (the existing `/sky/{room}/{slug}` overlay state) | The work, scroll preserved |
| **A room** `/{room}` | The sky oriented to that room's region — its works gathered and lit, the rest of the firmament quieted | The room landing |
| **A facet** `/facet/{facets}` | The sky with that facet's constellation lit — its member stars and threads emphasized, others dimmed (the search-as-reduction grammar, applied to a facet) | The facet page, filters intact |
| **The Foyer** `/` | The polestar — the still center, the whole sky at rest | The Foyer |

And the inverse, which makes the sky a place you *leave through a door you can see*: a star looked-down-from returns to its work; a lit region returns to its room; a lit facet-constellation returns to that facet page. **The selection survives the crossing in both directions** — a facet filtered in the room view is the facet lit in the sky; a work open in the sky is the work the page renders on return.

---

## What Crosses, and What Does Not

The sky is a **lens on the one graph**, never a second copy of the site. This is the invariant the whole paradigm rests on.

- **Commitment — one graph, two views.** A star *is* its work — the same addressable entity, the same `/{room}/{slug}` identity, the same content. The sky re-presents what the page presents; it never holds content the page does not.
- **Commitment — the selection persists.** Room, facet filter, and open-work are a single orientation that both views read. Crossing changes the view, not the selection.
- **Invariant — no content lives only in the sky.** Everything reachable by looking up is reachable on the ground. The sky adds a *way of seeing*, not a stratum of content that the no-JS or no-sky visitor would miss.
- **Invariant — the ground is never destroyed to show the sky.** Looking up reveals; it does not navigate away-and-forget. Looking down restores the exact ground state (scroll, filter, open work).
- **Declination — no per-room duplicate skies as separate DOMs.** There is one constellation. A room's "sky" is the one sky *oriented* to that room, not a second rendered graph. (This resolves the held question in `CONSTELLATION.md` §"Held Questions" — *one sky or one sky per room* — toward **one sky, regionally oriented.**)
- **Declination — the parallel is not a mode the visitor must learn.** No toggle chrome that says "switch to sky view." The gesture *is* the affordance; the look-up link is its honest fallback. The site refuses a "view switcher" UI.

---

## The Architecture

The paradigm is cheap because the pieces already exist; it is mostly *wiring* and one small pure function.

**The gesture is already general.** `useThresholdReveal` (see `INTERACTION_DESIGN.md`) is direction-parameterized — `'up'` to enter, `'down'` to return — and writes a single `--reveal` channel with a cubic-bezier resistance. Today it is mounted on the Foyer (up) and `/sky` (down). The paradigm mounts the *up* gesture on every page, gated by `atBoundary` (the visitor is at the top), and the *down* gesture stays on the sky.

**Orientation is a pure function of the route.** A single helper — `skyFocusForRoute(pathname, search) → SkyFocus` — maps any surface to what its sky should center and light:

```ts
interface SkyFocus {
  readonly center: NodeKey | null;     // a work's star, or null for the polestar
  readonly room: Room | null;          // a region to gather and light
  readonly facets: readonly Facet[];   // constellations to light; others dim
  readonly open: NodeKey | null;       // a star whose work overlay is open
}
```

The sky reads `SkyFocus` and orients: the navigation camera eases to `center` (or the polestar), the well-field claim opens `open`, the lit set is `room` ∪ works carrying `facets`, and everything else quiets. The same shape, read in reverse on look-down, names the route to return to.

**The URL is the carrier, and most of it already exists.** `/sky/{room}/{slug}` is already the work-open state. The work-page parallel needs no new route — looking up from `/{room}/{slug}` enters `/sky/{room}/{slug}`; looking down returns. The room and facet parallels carry their orientation as sky search params (`/sky?room=garden`, `/sky?facet=craft,beauty`), prerenderable as the bare `/sky` with the focus applied client-side, so the SSG model (see `CONSTELLATION_HORIZON.md`) is untouched: the structural sky prerenders once; the orientation is a parameter, not a separate page.

**The crossing is a view transition.** Look-up and look-down are paired with the View Transitions API. The work↔star crossing reuses the existing `skyStarTransitionName` morph (the page's hero ↔ the star). The room and facet crossings are gentler — the firmament resolving over the receding page. The instant-Cross decision in `INTERACTION_DESIGN.md` is revisited here: between a surface and *its own parallel*, the crossing is a deliberate, continuous transition (the two views are the same place, so the eye should be carried), not the instant cut used between unrelated rooms.

---

## The Smallest Valid First Form

Per the practice of *spanda*, the paradigm ships one crossing first, and only when it pulls. **The work ↔ star jump** is the smallest valid form and the one Danny named directly ("jump back and forth between the regular node as a piece and then as a star"):

1. On a work page, an affordance — the look-up gesture, plus a visible "see this in the sky" link — enters `/sky/{room}/{slug}` with that star open.
2. On that sky state, the existing return gesture (and a visible link) comes back down to `/{room}/{slug}`.
3. The crossing uses the star↔hero view transition already wired.

This is a floor, complete on its own: it adds the round trip between a work and its star without requiring the room or facet parallels to exist. The room parallel pulls next (it inherits the gesture and the orientation function); the facet parallel after (it inherits the search-as-reduction lighting). None is a prerequisite for the one before shipping as a finished thing.

---

## Accessibility and the No-JS Floor

The paradigm holds the site's thresholds (see `ACCESSIBILITY.md`, `RENDERING_STRATEGY.md`):

- **Every crossing has a visible, keyboard-operable link.** The scroll gesture is the canonical path; a labeled link ("look up" / "return") is the honest fallback, present whether or not the gesture is discovered. The gesture is never the only way across.
- **Reduced motion** collapses the crossing to an instant, oriented arrival — no carpet, no morph, the sky simply present and centered where the contract says.
- **No JavaScript** still reaches every work on the ground; the parallel is enhancement. A star is a real `<a href="/{room}/{slug}">`, so the sky's content is addressable even when the gesture is inert.
- **The orientation is announced.** Arriving in the sky from a work focuses that work's star (focus management), so a screen-reader visitor lands where a sighted visitor's eye lands.

---

## What This File Does Not Govern

- **How the sky looks or renders** — owned by `CONSTELLATION.md` and `CONSTELLATION_HORIZON.md`. This file only says *what it centers on* when entered from a given surface.
- **How stars are placed** — owned by `CONSTELLATION.md` / `src/shared/content/constellation.ts` (facet-relation placement). The orientation function reads positions; it does not set them.
- **The look-up gesture's mechanics** — owned by `INTERACTION_DESIGN.md` and `useThresholdReveal`. This file says *where* the gesture is mounted and *what it carries*, not how the resistance is modeled.
- **Search** — if a search surface arrives (held in `INFORMATION_ARCHITECTURE.md`), its sky-parallel (a query lighting a subset of stars) follows the same orientation contract; the grammar is named here but the search surface itself is deferred.

---

## Held — Named So It Is Not Lost

- **Filters and rooms as cross-view toggles.** The selection persisting across the crossing is committed; a chrome control that toggles *the view itself* without scrolling is held — the gesture is the intended path, and a button risks the "view switcher" the site declines. Revisit if the gesture proves undiscoverable on a surface where scroll is owned by something else.
- **The room parallel's regional rendering.** *One sky, regionally oriented* is decided; whether a room's region is shown by camera framing, by lighting, or by both is a rendering question held for `CONSTELLATION.md` when the room parallel pulls.
- **Mobile gesture.** Overscroll-up is consumed by the OS on some mobile browsers (pull-to-refresh). The look-up *link* is the honest mobile path; a swipe gesture is held for its own design pass (echoing the same held question in `CONSTELLATION_HORIZON.md`).
- **The facet parallel's relationship to `/facet/{facets}` reconciliation.** The `/sky`↔`/facet` reconciliation is already tracked in `CONSTELLATION_IMPLEMENTATION_PLAN.md`; the facet parallel here inherits whatever that reconciliation settles.

---

## Enforced in Code

Today, exactly one crossing exists: the Foyer ↔ `/sky`, via `useThresholdReveal` (up, on the Foyer) and `useReturnGesture` + `useThresholdReveal` (down, on `/sky`), with the look-up / return links as fallbacks. The `/sky/{room}/{slug}` overlay route exists and renders a work open within the sky — the destination the work↔star parallel will reach.

Not yet built: the `skyFocusForRoute` orientation function; the look-up gesture mounted on work, room, and facet surfaces; the look-down return to the originating surface; the selection-persistence across the crossing. The first to build is the **work ↔ star** form above, when it pulls. Until then, this file is the design, held — a recognition of where the site is going, not a queue of work owed.

*If this document and the lived implementation disagree, the lived implementation is the present moment and this file is what it is reaching for. Catch the document up.*
