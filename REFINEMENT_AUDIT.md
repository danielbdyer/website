# Refinement Audit

*The implemented realities of the house, read against their higher disposition, gathered so a refinement treatment can be adjudicated. Named 2026-09-06, with Danny, from his ask: "resolution and refinement of current primitives and domain algebras / state models — auditing implemented realities like view transitions and filtering semantics and UI continuity / justification, deep link resourcing, consistent navigation from any content up to its place in the sky, better understanding of the use of the facets in the UI, congruency in the implementation (e.g. rendering overlays) — such that a refinement treatment can be adjudicated upon it. We're getting there but I feel it's a little loose and could be clarified to its higher disposition." Downstream of every spec it cites; it sits in the house, beside [REACT_NORTH_STAR.md](./REACT_NORTH_STAR.md), because it is about where inside and outside became code and where they did not quite meet. Its sibling for the sky alone is [CONSTELLATION_IMPLEMENTATION_AUDIT.md](./CONSTELLATION_IMPLEMENTATION_AUDIT.md); this file covers the whole house and reaches into the sky only where the ground meets it.*

*The method is the same on every concern. **Disposition** is what the specs promise, quoted. **Reality** is what the code does, with a file and a line for every claim, read on 2026-09-06 at commit `cb4188e`. **The gap** is the difference, named without blame. **Treatment** is the smallest real version and the larger one behind it. **Adjudication** is the decision only Danny can make, with its options, because a refinement that is reported as its conclusion asks him to approve a sentence rather than a decision. The adjudications are gathered at the end as a table he can answer in one sitting.*

*Two facts frame everything below. First: `src/content/` holds exactly one authored work, *small weather*; every other work a visitor meets is a preview seed from `src/shared/content/preview-data.ts` — twenty are defined, and fifteen are shown, because the Garden's five step aside for the one authored work — injected wherever a room has no authored work. Much of what looks like content behavior is preview-fallback behavior, and the preview pipeline is a second, hand-maintained copy of the loader; every room but the Garden, every facet page, and fifteen of sixteen work pages carry `noindex` today because they hold previews, and the sky shows sixteen stars of which one is real. Second: the sky has roughly three hundred and fifty unit cases and the rooms roughly thirty; the surfaces where this audit finds the most divergence — listing, filtering, the overlay — are the surfaces with no tests.*

---

## The primitives, resolved

Before the concerns, the algebra they share. Each primitive below exists in the code under two or more names, or exists in a spec and not in the code, or exists in the code and not in a spec. Resolving the concern is mostly resolving the primitive.

### Address

A work's identity is `{ room, slug }`, and its string form `room/slug` is the key of every system that touches it: the URL path (`src/app/routes/$room.$slug.tsx`), the sky's node key (`src/shared/content/constellation.ts:296`), the wikilink index (`src/shared/content/wikilinks.ts:81`), the view-transition names (`src/shared/utils/view-transition-names.ts:26-70`), and the `?focus=` search param (`src/shared/organisms/WorkView/WorkView.tsx:57`). `nodeKey` is defined identically twice (`constellation.ts:296`, `src/shared/organisms/Constellation/layout.ts:56`); `?focus=` is split by hand with no validation (`src/app/routes/sky.tsx:89`).

*Resolved:* one `Address` type with one `key` and one `parse`, both in the content domain, both validated by `roomSchema`, imported everywhere the string appears. `INFORMATION_ARCHITECTURE.md` §"URL Design" already treats the address as the whole grammar; `PATTERN_LANGUAGE.md` pattern 12 adds a heading segment to it. No decision is needed; this is one file.

### Anatomy

`INFORMATION_ARCHITECTURE.md` §"Anatomy" names a work page's five parts. The code has five renderers of a work — `WorkView`, `WorkOverlay`, `WorkEntry`, `WorkRow`, `FacetCard` — that derive the parts separately and disagree: the overlay renders the summary the page deliberately hides (`WorkView.tsx:68-70` versus `WorkOverlay.tsx:76`); three listing surfaces have three summary policies (`WorkEntry.tsx:57`, `WorkRow.tsx:92`, `FacetCard.tsx:114`); five room-label maps exist with two casings and one covering four rooms (`WorkView.tsx:17`, `layout.ts:42`, `FacetCard.tsx:16`, `WorkOverlay.tsx:167`, `schema-org.ts:19`).

*Resolved:* `PATTERN_LANGUAGE.md` pattern 1, ONE ANATOMY OF A WORK — the parts derived once, each surface a declared projection. **Adjudication A1.**

### Orientation

`CONSTELLATION_PARALLEL.md` §"The Architecture" names `SkyFocus = { center, room, facets, open }`, a pure value derived from the ground route by `skyFocusForRoute`, and holds the function as not yet built. In the code, "where in the sky am I" has three writers: `?focus=` (authoritative at mount, `src/shared/sky/walk.ts:34-36`), `sessionStorage['sky:here']` (applied after mount by `useSkyTravel`, `src/shared/state/hereStorage.ts:22`), and the walk reducer's `here` (`src/shared/sky/walkState.ts:28`). They can disagree, and the precedence is documented at no single site.

*Resolved:* the orientation is one value with one precedence law — an explicit `focus` in the address wins; a remembered `here` fills in when the address names none; the pole is the rest — computed by the function the spec already named, in one place. **Adjudication A5** decides what the address may carry.

### Gesture

`INTERACTION_DESIGN.md` §"The kind-table" names seven kinds of movement and maps every navigation to one. The code expresses the table as scattered facts: `defaultViewTransition: true` on the router (`src/router.tsx:20`), `viewTransition={false}` on four surfaces with no comment (`Nav.tsx:18,30`, `NotFound.tsx:16`, `ErrorBoundary.tsx:46`), and a scroll heuristic keyed on `/facet/` pathnames (`__root.tsx`). The spec contradicts itself about the opt-out — §"Held questions, resolved" says it is "the durable choice" on Nav, and §"Adding a new participant" says "Today this isn't used anywhere."

*Resolved:* the kind-table becomes a pure function, `kindOf(from, to, trigger)`, and a `Link`'s `viewTransition` prop and the root's scroll rule both read from it. The spec's table and the code's table are then one table — the lossless handshake directive 8 asks for. The spec sentence that says the opt-out is unused is corrected in the same change. No decision is needed beyond **A2**, which is the one held row in the table.

### Lens

A gathering of works is narrowed by a lens. The code has three unrelated narrowings that share nothing: the facet path (`/facet/a,b`, AND, `src/shared/content/display.ts:43-49`), the Salon posture (`?posture=`, single, `src/app/routes/salon.tsx:50-52`), and the sky's lit facet (reducer state, ephemeral, `walkState.ts:30`). `PATTERN_LANGUAGE.md` pattern 16 defines the lens as a product of independent axes with the URL as its only form.

*Resolved:* one `Lens` type, validated by zod through `validateSearch`, with the facet page as the lens with one thread and the Salon posture as the lens with one posture. The sky's lit facet is not a lens and stays attention. **Adjudication A3** decides where a visitor lands when the lens empties.

### State, in three tiers

Every piece of state belongs to exactly one tier, and the tier decides where it lives:

| Tier | Survives reload | Shareable | Lives in | Today |
|---|---|---|---|---|
| **Address** | yes | yes | the URL path and validated search params | `/facet/…`, `?posture=`, `?focus=` |
| **Session** | yes | no | `sessionStorage` or `localStorage`, one key each, named in one file | `sky:here`, `theme` |
| **Ephemeral** | no | no | a reducer or a module store | `visited`, `walked`, `litFacet`, `hovered`, the camera, the cursor |

The law: whatever a visitor would expect to find again after a reload is address or session, never ephemeral; whatever two visitors should be able to share is address, never session. Today `here` is both session and, through `?focus=`, address, which is the duplication under Orientation above. Module-level mutables outside any tier — `ascentTimer` and `liftCancel` in `index.tsx:47-48`, `descentTimer` in `sky.tsx:57` — are rim state without a `@bigO` note, which `CONSTELLATION_ARCHITECTURE.md` §"Enforced in Code" forbids.

---

## 1 · View transitions and continuity

**Disposition.** The View Transitions API runs on every internal navigation; seven kinds of movement are named by meaning; names come from four generators and never inline; Cross is instant because "the rooms aren't continuous; pretending they are is dishonest" (`INTERACTION_DESIGN.md` §"Page and Route Transitions", §"The kind-table"). In the sky, "the world is never destroyed to show the sky" and "the constellation continues rendering behind a soft veil" (`CONSTELLATION_PARALLEL.md` §"What Crosses, and What Does Not"; `CONSTELLATION_DESIGN.md` C12).

**Reality.**

- The generator discipline holds: every `viewTransitionName` in the tree is a generator call; the overlay-star pairing suppresses the name on the open star so no snapshot carries it twice (`src/shared/organisms/Constellation/Stage.tsx:223-225`). This is the one place in the codebase that handles the uniqueness hazard, and it is correct.
- **Opening the overlay remounts the whole sky.** The root wraps the outlet in `<ErrorBoundary key={pathname}>` with `pathname` taken from the last match (`src/app/routes/__root.tsx:85-87,193`). `/sky` → `/sky/garden/small-weather` changes the key, so React discards and remounts `SkyPage`, the constellation, the walk reducer, the travel shell, and the WebGL canvas. The `sky-star` morph still plays, because the transition snapshots before and after, so the break is invisible as motion and real as state: `here` survives through `sessionStorage`; `visited`, `walked`, `litFacet`, the camera's in-flight motion do not. The spec's own words in `sky.$room.$slug.tsx:9-10` ("the parent's firmament continues to paint behind") describe what the code does not do.
- The primary navigation opts out of transitions on the wordmark and all four room links (`Nav.tsx:18,30`), which the kind-table calls Cross and decides; the code carries no comment saying so, and the spec's later section says the opt-out is unused.
- The hero morph has a source on one room. `WorkEntry` renders no image, so Studio, Garden, and Study entries carry no `work-hero-*`; only the Salon's `WorkRow` and the facet page's `FacetCard` morph a thumbnail into a hero (`WorkEntry.tsx:27-30`; `WorkHero.tsx:27`). Open, on three of four rooms, is a title-and-meta slide, which may be right and is not what the kind-table describes.
- Reduced motion is honored in CSS on the `::view-transition` pseudo-elements and short-circuits the Foyer's lift (`index.tsx:62-65`); `defaultViewTransition` itself is not gated, which is fine while the CSS holds.
- `RoomOutwardInvitation`'s adjacent-room link transitions by default; the spec holds the question (`INTERACTION_DESIGN.md` §"Held question on RoomOutwardInvitation").

**The gap.** One structural bug (the remount), one spec contradiction (the opt-out), one kind that is only partly real (Open without a hero on three rooms), one held question.

**Treatment.** Smallest: key the error boundary on the route's first non-root match rather than the last pathname, so a child route opening over `/sky` keeps its parent mounted; add the comment the four opt-outs lack, or better, derive them from `kindOf`; correct the spec sentence. Larger: the Gesture primitive above, so the table is code; and decide whether Open on an image-less work wants a `work-card` → `work-view` wrapper pairing after all, which `view-transition-names.ts:51-54` deliberately withholds.

**Adjudication A2.** The adjacent-room hint at the foot of a room landing: Cross (instant, like Nav) or the default crossfade it has today. The spec asked for "a few real visits"; the visits have happened. **A6** covers the remount, which is a fix rather than a decision but changes what the overlay is.

---

## 2 · Filtering semantics

**Disposition.** Facets are threads, not filters — "not categories to sort by" (`CLAUDE.md`); "facets are discovered, not browsed" (`INFORMATION_ARCHITECTURE.md` §"No 'all facets' overview"). Multi-facet is intersection, both on the ground and in the proposed sky filter: "Multiple active chips intersect (AND)" (`CONSTELLATION_DESIGN.md` C8). Dropping the last chip is Cross to the Foyer: "the visitor is leaving the facet space entirely; instant is the right gesture" (`INTERACTION_DESIGN.md` §"Held questions, resolved"). The sky's filter, when it comes, "dims, never removes" and its URL ownership is open (`CONSTELLATION_IMPLEMENTATION_PLAN.md` P6).

**Reality.**

- AND is real: `facets.every(...)` in `display.ts:43-49`; the empty selection returns the empty set by design; the copy says "no works currently carry every selected thread" (`facet.$facet.tsx:88`). The depth cap of two is real and paired with the prerender filter on both sides (`FacetToggleBar.tsx:5,64-75`; `vite.config.ts:84-89`) — one of the better-kept couplings in the tree.
- The URL is canonicalized after parse, not by redirect: `/facet/body,beauty` renders the canonical content with the non-canonical address still in the bar (`facet.$facet.tsx:22-35`).
- Dropping the last chip links to `/` (`FacetToggleBar.tsx:77-83`), as the spec decided. The root cause the spec did not name: the site has no surface that shows every work, so there is nowhere else honest to go.
- The Salon's `loaderDeps` declares the posture and the loader ignores it; the filter happens in the component (`salon.tsx:18-22,50-52`). Dead wiring that re-runs the loader on every toggle.
- The sky has no filter. `litFacet` is attention set by hovering a compass name or a whisper bearing and released on leave (`useSkyInteractions.ts:100-109`). Its reduction of the visible field is presence — a cap of twenty-four scored by strokes, shared facets, concordance, and distance, plus two strangers (`src/shared/content/presence.ts:23-31`) — which is a different idea and the right one.
- `ConstellationFilters` is not a filter. It is an SVG `<defs>` block of two `<filter>` elements and two gradients (`src/shared/atoms/ConstellationFilters/ConstellationFilters.tsx:16-104`). In a tree that names things carefully, this is the one name that misleads.
- Three canonical facet orders coexist: `FACETS` in `schema.ts:6`, `FACET_ORDER` redeclared in `facet.$facet.tsx:11`, and `COMPASS` sorted by azimuth in `constellation.ts:55`.

**The gap.** The semantics are what the specs say. The looseness is in the vocabulary (a filter that is not one, a name that is not a filter), in three orders for one set, and in the drop-last destination, which is spec-consistent and still ejects a wandering visitor into the Foyer because the house has no hall.

**Treatment.** Smallest: one `FACETS` imported everywhere; `loaderDeps` removed or honored; `ConstellationFilters` renamed to what it is (`SkyDefs` has been said aloud; the name is held); the facet route redirects a non-canonical order to the canonical one. Larger: `PATTERN_LANGUAGE.md` pattern 15 (threads, not filters) and 16 (the gathering), which give the drop-last gesture a destination.

**Adjudication A3.** When the last thread is dropped: the Foyer (today, spec-decided), the room the visitor came from, or the gathering once it exists. **A4** on the sky's future filter: AND with dim-not-remove and the URL as truth, as P6 proposes, or no filter in the sky at all, as `CONSTELLATION_WALK.md` §"The Principles" 8 ("the sky refuses legend, search, zoom, selection") and `CONSTELLATION.md` ("No selection mode") say — the two constellation specs disagree and the walk is the later one.

---

## 3 · Continuity and justification of the overlay

**Disposition.** A work in the sky opens "in the overlay" over a veiled, still-rendering world; closing "returns focus to the originating star and its context"; "no content lives only in the sky. Everything reachable by looking up is reachable on the ground"; the overlay "MUST NOT BECOME … a modal trap with hidden or unclear exit" (`CONSTELLATION_DESIGN.md` C12; `CONSTELLATION_PARALLEL.md` §"What Crosses, and What Does Not"). The page is "the deepening surface" with the anatomy in `INFORMATION_ARCHITECTURE.md` §"Anatomy".

**Reality.**

- Two complete renderers of a work, diverging on nine parts (the table under Anatomy above). The overlay drops the hero, the referent, the posture, the backlinks, the outward invitation, the draft badge, the preview note, and the JSON-LD, and shows the deck the page hides (`WorkOverlay.tsx` versus `WorkView.tsx`).
- The overlay's body has no link delegation: `WorkView.tsx:83,146` wires `useInternalLinkDelegation`; `WorkOverlay.tsx:143-146` does not, so a wikilink inside the overlay is a full document reload — the exact failure the hook's docblock names (`useInternalLinkDelegation.ts:9-13`).
- The overlay declares `aria-modal="true"` and is not modal: no focus trap, no `inert` or `aria-hidden` on the constellation, and the root's pathname effect steals the initial focus from the panel because child effects run before parent effects (`WorkOverlay.tsx:93,117`; `__root.tsx:137`). The axe test passes because axe cannot see this (`WorkOverlay.test.tsx:80`). Confirmed in a browser: after a star is opened by click or Enter, `document.activeElement` is `<main>`; after Escape it is `<main>` again, not the star. A cold load of `/sky/garden/small-weather` focuses the panel correctly, so the defect is client-navigation only.
- After Back from the overlay, no star carries `data-here` or `aria-current` and the whisper reads "the polestar": the walk the visitor was standing in is gone with the remount, while the URL restored. Confirmed in a browser.
- The overlay's `ROOM_LABEL` covers four rooms; a Foyer work would read "From undefined" (`WorkOverlay.tsx:64,167-172`).
- The overlay is prerendered as its own page (`dist/client/sky/garden/small-weather/index.html` carries both the overlay and the constellation), which is right and is the one place the overlay is exactly what the spec says.

**The gap.** The overlay is a second work page that forgot most of the first, on a canvas that is torn down beneath it, in a dialog that is not one.

**Treatment.** Smallest: wire the delegation hook; make the dialog a dialog (Base UI's `Dialog` gives the trap, `inert`, scroll lock, and restore in one component — `PATTERN_LANGUAGE.md` §IV); fix the boundary key. Larger: pattern 1, so the overlay is the page's anatomy at panel grain and its omissions are declared.

**Adjudication A1** (what the overlay shows), **A6** (whether the overlay stays a route — yes is the current answer and the right one; the question is whether `/{room}/{slug}` should also offer *open in the sky* as an overlay rather than only `?focus=`). **A7**: the dialog primitive — Base UI, or a hand-rolled trap.

---

## 4 · Deep-link resourcing

**Disposition.** "To give something a URL is to say it deserves to persist" (`MEDIUM.md` §"Addressability"); every work has an address, non-negotiable (`DOMAIN_MODEL.md`); "the URL is the share" (`INFORMATION_ARCHITECTURE.md`); headings get stable ids; a 404 is "a short message in the site's voice, an `<Ornament />` above a quiet invitation back to the Foyer" (`INFORMATION_ARCHITECTURE.md` §"404"). No trailing slashes; canonical form without. Filtered and pinned sky states are "not currently URL-addressable; whether they should be … is a held design question" (`CONSTELLATION_IMPLEMENTATION_AUDIT.md`), and "no 'share this view' links" for time-slider or hover states (`CONSTELLATION_HORIZON.md` §"What We Refuse").

**Reality.**

- Every work, every overlay, every room, the sky, and thirty-six facet pairs are prerendered; the address grammar in the spec is real, plus the two sky addresses (`/sky/{room}/{slug}`, `/sky?focus=`) the constellation specs added and the IA grammar does not list.
- **The site's 404 never renders on a hard load.** `wrangler.jsonc:6` asks Cloudflare for `404-page`, the build emits no `404.html`, and the deploy verifier does not check for one (`scripts/verify-deploy-artifacts.mjs:1-29`). `NotFound` and the four `throw notFound()` loaders fire only on client-side navigation. Confirmed on the deployed branch preview on 2026-09-06: `/nowhere`, `/garden/does-not-exist`, and `/facet/a,b,c` each return a 404 with an empty body — no site copy, no Ornament, no door back. Under `vite preview` the site's own page renders with a true 404 status, which is why the gap is invisible locally.
- **Every work address is redirected to a trailing slash at the edge.** `INFORMATION_ARCHITECTURE.md` §"URL Design": "No trailing slashes … the canonical form is without." The build writes each work as `garden/small-weather/index.html`; `wrangler.jsonc` sets no `html_handling`, so Cloudflare's default (`auto-trailing-slash`) answers `/garden/small-weather` with a `307` to `/garden/small-weather/`. Confirmed on the deployed preview. The sitemap and the JSON-LD say the slashless form; the edge says the other. The share URL changes under the visitor who copies it.
- **No `<link rel="canonical">` anywhere.** Canonical URLs exist only as strings inside JSON-LD (`schema-org.ts:14-17,149`). Meanwhile the generated sitemap lists fifteen query-string URLs (`?focus=` ×12, `?posture=` ×3) that serve the same HTML as their base paths (`dist/client/sitemap.xml`); the prerender filter excludes `?` paths from prerendering (`vite.config.ts:70-74`) and not from the sitemap.
- Headings carry no ids; no hash is read anywhere; the link delegation refuses `#` hrefs (`useInternalLinkDelegation.ts:49`). A work can be pointed at, never into.
- `?focus=` is parsed by a bare `split('/')` with no `roomSchema` check, unlike every other room-bearing entry (`sky.tsx:89`), and then used to build a navigation target (`sky.tsx:93`).
- The address grammar accepts `.mdx` in the loader's regex and the glob picks up only `.md` (`loader.ts:47,177`).

**The gap.** The grammar is right and two of its promises — the 404 and the canonical — are not kept at the edge where a visitor arrives cold. Anchors are promised and absent.

**Treatment.** Smallest, all fixes and no decisions: emit `404.html` from the `NotFound` component at build and verify it in the deploy check; set `assets.html_handling` to `drop-trailing-slash` in `wrangler.jsonc` so the edge serves the form the IA promised and redirects the other way; emit `<link rel="canonical">` from the root for every route, pointing search-param addresses at their base path; drop query URLs from the sitemap; validate `?focus=` through `Address.parse`; heading ids per `PATTERN_LANGUAGE.md` pattern 12; an `h1` on the Foyer and on the 404, whose title today is the bare site name. Larger: **A5**, what else the sky's address may carry. **A13** confirms the slash direction, since it is a spec commitment and not only a config.

**Adjudication A5.** The sky's addressable states. Today: `?focus=room/slug`. `CONSTELLATION_PARALLEL.md` proposes `?room=` and `?facet=`; P6 proposes `?facets=`; the horizon refuses `share this view` for time and hover. Decide the closed set of search params the sky's address may carry, so the orientation function has a domain. The candidate is `{ focus?, room?, facets? }` — center, region, lit threads — and nothing that is a hover, a time, or a mode.

---

## 5 · From any content up to its place in the sky, and back

**Disposition.** "The page and the sky are two views of the same place, and the gesture between them preserves your orientation. Looking up never loses your place; it re-frames it. Looking down never loses the sky" (`CONSTELLATION_PARALLEL.md` §"The Image"). The orientation contract maps work → its star, room → its region, facet → its figure, Foyer → the pole, and back, with "the selection survives the crossing in both directions." The work ↔ star jump shipped 2026-06-13; the room and facet parallels are held. "Every crossing has a visible, keyboard-operable link."

**Reality.**

- Work → star is real: `↑ See this in the sky` on every non-Foyer work page navigates to `/sky?focus=room/slug` (`WorkView.tsx:54-62`); the walk resolves the focus and falls back to the pole silently when the key is stale (`walk.ts:34-36`). Star → work page is real only through the return link and only when `focus` was set (`sky.tsx:90-97`).
- **The round trip is asymmetric.** A visitor who enters the sky from the Foyer, walks to a star, and opens its overlay has no path to that work's page: the overlay's only outbound links are three copies of `closeHref` and the facet chips (`WorkOverlay.tsx:124,135,155`); its `From {Room}` is plain text (`WorkOverlay.tsx:63-65`); the return link reads "Return to the Foyer." The spec's "everything reachable by looking up is reachable on the ground" is true of the content and false of the path.
- Clicking the star you stand at opens the overlay; clicking any other star travels the camera (`Stage.tsx:107`; `useSkyInteractions.ts:68-72`). Right by the walk's own words ("a Tab is a step, a press is a choice"), and to a mouse visitor the first press reads as a link that did nothing. Confirmed in a browser: first click on a star, URL unchanged and no dialog; second click, the overlay. **Adjudication A12.**
- Wheel-down on the bare sky, about forty ticks, navigates to the Foyer; Escape on the bare sky does the same. Designed as the return gesture; an instinctive scroll ends the visit. Confirmed in a browser.
- Under `prefers-reduced-motion: reduce`, arriving by Look up, the sky's threads and labels were in the DOM and not yet painted 1.5 s after arrival, and painted by 8 s. Reduced motion should mean instant, not delayed. Observed once in a headless browser; worth a second look on a device before it is treated.
- At 1280×900 by day, the label "Spanda — waiting for the tremor" runs across the *small weather* star, and *small weather*'s label across the thread beneath it; at 390×844 two labels overlap neighboring stars and the constellation sits in the middle third under a large empty band. Sixteen stars, fifteen of them previews; the collision is a preview-density artifact and a real one.
- Every sky load logs four `GPU stall due to ReadPixels` warnings from the atmosphere canvas — SwiftShader noise, and a `readPixels` call that would also stall a real GPU.
- A work's star sits at the centroid of its facets' fixed azimuths with slug-keyed jitter, pushed apart, projected to the sphere; the edges are per-facet minimum spanning trees (`constellation.ts:42-51,200-222,273-284,335-370`). This matches the walk spec exactly. Hue comes from the **first-listed** facet (`constellation.ts:391`), which makes frontmatter order load-bearing for a star's color while `DOMAIN_MODEL.md` §"Invariants" says "facets are unordered. A work's facets are a set, not a list."
- The room and facet parallels are held, as the spec says. Nothing in the sky links to `/facet/{facet}`; nothing on a facet page links into the sky; the compass and the thread labels are `aria-hidden` (`Compass.tsx:32`; `Thread.tsx:100`), so the only sky surface that names a facet to assistive tech is the whisper's buttons.
- The camera's rest distance is declared three times with three comments acknowledging the coupling (`skyWalk.ts:35`, `skyCamera.ts:28-34`, `layout.ts:31`); `TWINKLE_DURATION_SECONDS` is paired to a CSS keyframe by comment with no test (`constellation.ts:172`); `Thread`'s `DOTTED_FACETS` restates `FACET_HUE`'s pairing by hand (`Thread.tsx:55`; `constellation.ts:68-77`).

**The gap.** The first form of the parallel shipped and is honest. What is loose: the overlay is a dead end for the page; the sky and the thread pages do not know about each other; a star's hue depends on an order the domain says does not exist; and three constants that must agree are held together by comments.

**Treatment.** Smallest: a real link from the overlay's kicker to `/{room}/{slug}` (Step), and a `↑ See this in the sky` on the page is already there, so the loop closes; the return link's target and copy derived from the orientation, not from whether `focus` happened to be set; one door from a lit facet in the sky to its thread page, and one from a thread page up to `/sky?facets=` once **A5** admits it. Larger: `skyFocusForRoute` as the spec names it, the room and facet parallels behind it; `REST_DISTANCE` derived once and imported.

**Adjudication A8.** A star's hue: keep "first-listed facet" and amend the domain model so a work's first facet is its primary (authored, meaningful, and then `WorkEntry` and the chips should honor the same order); or keep facets a set and derive the hue by a rule that does not depend on order (the facet earliest in compass order, or the facet with the fewest members, so rarer threads show). The model and the sky currently disagree, and whichever is chosen, the other catches up.

---

## 6 · Facets in the UI

**Disposition.** A facet is "a cross-room thread — a dimension of Danny's life"; not a tag, not a category, unordered, non-hierarchical, never a link in prose (`DOMAIN_MODEL.md` §"Facets"; `GRAPH_AND_LINKING.md` §"Facets are never links in prose"). Chips stay neutral everywhere except the sky, where the four held accents pair up over eight facets: "the held accents do not leak out of the constellation" (`DESIGN_SYSTEM.md` §"The accents"). The facet page's title is capitalized "for visitor reading" and its list is grouped by room (`INFORMATION_ARCHITECTURE.md` §"The facet page"). How facets appear in the UI was deferred by the domain model to the IA.

**Reality.**

- The chip is one component, `FacetChip`, used at five sites with identical styling, always a real link to `/facet/{facet}`, always kept outside the row's wrapping link with the reason documented (`FacetChip.tsx:16-22`; `WorkEntry.tsx:61`; `WorkRow.tsx:97`; `FacetCard.tsx:131`). This is consistent and good.
- Case differs by surface: `FACET_META[f].label` ("Craft") on facet pages; the raw lowercase key everywhere else; `FacetCard` lowercases the *room* label deliberately while four other maps capitalize it (`facet-meta.ts:14-51`; `FacetCard.tsx:16-22,102`).
- Hue is sky-only by design (`constellation.ts:66-68`), so a visitor learns "beauty is rose" in the sky and finds nothing on the ground that agrees. Design-decided; noted because it is the one place the two vocabularies could reinforce each other and do not.
- Affordance differs: on the ground a facet is a link to a page; in the sky the same word is a camera control, and in two of three sky surfaces it is hidden from assistive tech. No sky surface leads to a thread page.
- The facet page's list is a masonry ordered by date with featured interjections (`FacetMasonry`, `feature`), where the IA spec promises a list grouped by room. Two specs describe two surfaces and neither acknowledges the other (`INFORMATION_ARCHITECTURE.md` §"The facet page"; `CONTENT_SCHEMA.md` §"Posture, image, referent, feature").
- The word *thread* means a sky edge in `Thread.tsx` and a facet in prose in `RoomOutwardInvitation` and `WorkOutwardInvitation` ("Threaded through *beauty*, *body*"). Two meanings, both first-class, in a house that holds names.
- `FacetToggleBar` has three chip states with their own class table (`FacetToggleBar.tsx:12-16`); `FacetChip` has one. The toggle chip is a different atom wearing the same clothes.
- The mapping from facet to hue is in TypeScript on purpose (`DESIGN_SYSTEM.md`: no `--facet-*` tokens because pairs share hues); `Thread` restates half of it as `DOTTED_FACETS`.

**The gap.** The chip is right. The rest is a vocabulary that means one thing in the domain, a second on the ground, a third in the sky, and a fourth in a spec that describes a surface that was replaced.

**Treatment.** Smallest: one casing rule (proposal: lowercase key everywhere the facet is a thread, capitalized only as a page title — which is what the code does, so the rule is to write it down); `FacetToggleBar` composed from `FacetChip` with a `state` rather than a parallel class table; `DOTTED_FACETS` derived from `FACET_HUE`; the IA spec's facet-page paragraph rewritten to describe the masonry that exists, or the masonry replaced by the grouped list the spec describes. Larger: `PATTERN_LANGUAGE.md` pattern 15, and one door between the sky's facet and the ground's.

**Adjudication A9.** The facet page's shape: the masonry by date with featured interjections that exists, or the list grouped by room the IA promised — "the facet is the thread that crosses rooms, and the grouping makes the crossing visible." **A10.** The word *thread*: keep both meanings (an edge in the sky, a facet on the ground, and they are the same idea seen twice), or rename the ground's usage to *facet* in copy. The pattern language leans toward keeping both, because a facet *is* the thread the sky draws; the decision is whether the double meaning is felt as depth or as looseness.

---

## 7 · Congruency

**Disposition.** "Every concept has one name, and the name is the domain's" (`AGENTS.md` directive 9). "A change lives in one place." The rim is named file by file with a `@bigO` note or not at all (`CONSTELLATION_ARCHITECTURE.md`). The manifesto's verification protocol expects `grep` to find zero of several things.

**Reality**, as one ranked list, with the first three already treated above.

| # | Finding | Where | Weight |
|---|---|---|---|
| C1 | The site's 404 never renders on a hard load; no `404.html` is emitted | `wrangler.jsonc:6`; `scripts/verify-deploy-artifacts.mjs` | high |
| C2 | Opening the overlay remounts the constellation | `__root.tsx:85-87,193` | high |
| C3 | Wikilinks in the overlay reload the document | `WorkOverlay.tsx:143-146` | high |
| C4 | The overlay is not modal in practice; the root steals its focus | `WorkOverlay.tsx:93,117`; `__root.tsx:137` | high |
| C5 | `ConstellationFilters` is not a filter | `ConstellationFilters.tsx:16-104` | medium |
| C6 | No canonical link; fifteen query URLs in the sitemap | `schema-org.ts`; `dist/client/sitemap.xml` | medium |
| C7 | Drop-last ejects to the Foyer because no gathering exists | `FacetToggleBar.tsx:77-83` | medium |
| C8 | Five room-label maps, two `nodeKey`s, three facet orders, three rest distances | listed above | medium |
| C9 | Nav opts out of transitions with no comment, against a spec that says the opt-out is unused | `Nav.tsx:18,30`; `INTERACTION_DESIGN.md` | medium |
| C10 | Overlay and page disagree on what a work is | §3 | medium |
| C11 | `getDisplayWorksByFacetGrouped` has no caller; knip warns and never fails | `display.ts:28-35`; `knip.config.ts:29-33` | low |
| C12 | The Salon's `loaderDeps` is inert | `salon.tsx:18-22` | low |
| C13 | `?focus=` parsed without validation | `sky.tsx:89` | low |
| C14 | `Thread`'s `DOTTED_FACETS` shadows `FACET_HUE`'s pairing | `Thread.tsx:55` | low |
| C15 | `.mdx` is matched and unreachable | `loader.ts:47,177` | low |
| C16 | `preview-data.ts` is a second content pipeline with its own `Marked` and its own backlink inversion | `preview-data.ts` | low today, high on the day the loader changes |
| C17 | Three module-level timers outside the named rim | `index.tsx:47-48`; `sky.tsx:57` | low |
| C18 | `WorkOutwardInvitation` destructures `room` and never uses it | `WorkOutwardInvitation.tsx:40-45` | low |
| C19 | The rooms have no tests where the sky has hundreds: `FacetCard`, `FacetMasonry`, `FacetToggleBar`, `WorkEntry`, `WorkRow`, `WorkHero`, `WorkOutwardInvitation`, `RoomOutwardInvitation`, `Stage`, `DaystarSeat`, and eight of ten shared hooks are untested | — | the reason the rest of this table exists |

Also true, and worth saying: there are zero `TODO`, `FIXME`, or `HACK` comments in `src`, `packages`, or `e2e`. Deferred work lives in `BACKLOG.md`, which is the practice. The looseness this audit finds is not neglect; it is the residue of a sky built with enormous care beside rooms that were built first and never revisited with the same eye.

**Treatment.** The smallest real version of the whole table is a single sweep that fixes C1, C3, C5, C6, C8, C11–C15, C17, and C18 without a decision, and writes the missing room tests as it goes; the rest wait on the adjudications.

---

## 8 · Contradictions between specs that this audit inherits

The spec survey found the specs disagreeing with one another on the concerns above; the ones that bear on a treatment are these, so the treatment does not resolve a spec against a spec by accident.

- **The constellation plan builds what the walk refuses.** `CONSTELLATION_DESIGN.md`'s component library and `CONSTELLATION_IMPLEMENTATION_PLAN.md`'s phases P4 through P10 and P12 build a horizon strip, a search field, facet chips as filters, a time scrubber, a radial menu, a pin panel, a demonstration drift, and a contemplative drift; `CONSTELLATION_WALK.md` §"The Principles" 8 refuses "legend, search, zoom, selection, and metrics" and §"Travel" refuses "wells, flick, coast, demonstration drift, settle assist"; `CONSTELLATION_STORYBOARD.md` declines "the timeline, the corner glyphs, a search field, a legend." The walk and the storyboard are later and are what the code does. The implementation audit those phases rest on is a Pass-2 snapshot of a physics camera that has since been set down, and its sixteen phases all still read `pending`. **Adjudication A11.**
- `CONSTELLATION.md` says every Foyer ↔ sky navigation is Cross with `viewTransition={false}`; `INTERACTION_DESIGN.md` names Ascend and Descend as their own kind carried by the `daystar` name over 900 ms; `CONSTELLATION_PARALLEL.md` revisits the instant-Cross decision for a surface and its own parallel. The code does Ascend.
- `INFORMATION_ARCHITECTURE.md` declares five URL patterns "the whole site's URL surface"; the constellation specs add `/sky/{room}/{slug}`, `/sky?focus=`, and propose `?room=` and `?facet=`; the kind-table adds `/facet/X,Y`. **A5** closes the set.
- `CONSTELLATION_DESIGN.md` uses *basin* in two senses in one file — the held editorial cluster in its lexicon, the superseded gravity well in its surface inventory — and the code keeps `BASIN_RADIUS_RAD`.
- `INTERACTION_DESIGN.md` says the transition opt-out is the durable choice on Nav and, later in the same file, that it is used nowhere; it also lists "page-to-page route transitions" as not yet implemented beneath a section that specifies them in full, and declares four durations "the only durations the site uses today" beneath rows that name 900 ms and 1.4 s. Reduced motion is "a known gap" there and "implemented" in `ACCESSIBILITY.md`; the skip link is described as present, listed as held, and reported as shipped, across two files. The code is right in each case and the spec is behind.
- `CONSTELLATION_DESIGN.md` C8 and `CONSTELLATION_IMPLEMENTATION_PLAN.md` P6 specify a sky filter (AND, dim-not-remove, URL state); `CONSTELLATION_WALK.md` §"The Principles" and `CONSTELLATION.md` §"Interaction Vocabulary" refuse selection and filtering in the sky. The walk is the later document.
- `INFORMATION_ARCHITECTURE.md` promises a facet page grouped by room; `CONTENT_SCHEMA.md` describes the facet-page masonry the code has.
- `CONSTELLATION.md` says in one section that two facets share each of four hues and in another that facet threads carry "eight hues." Four is what the code does.
- `CONSTELLATION_DESIGN.md` assumes a whole visible field; `CONSTELLATION_WALK.md` caps presence and says "the sky does not show everything at once." The walk is what the code does.
- `CONSTELLATION_IMPLEMENTATION_AUDIT.md` records the star-to-overlay morph as absent; `CONSTELLATION_STORYBOARD.md`, later, records it as standing. The storyboard is what the code does.
- Several specs still say things exist as gaps that have since been built (`DESIGN_SYSTEM.md` calling `INTERACTION_DESIGN.md` a gap; `CONTENT_SCHEMA.md` §"Enforced in Code" saying no loader exists; `GRAPH_AND_LINKING.md` §"Enforced in Code" saying nothing is implemented). These are catch-ups, not decisions, and the manifesto's own rule applies: the codebase is the present moment and the spec is a paragraph behind.

---

## The adjudications

Each is a decision only Danny makes. The recommendation is first where there is one; the strength of the evidence is stated, because two independent events and a single data point are different situations.

| # | Decision | Options | Recommendation and evidence |
|---|---|---|---|
| **A1** | What the overlay shows of a work, and whether the summary is shown anywhere | (a) The overlay is the page's anatomy at panel grain: kicker as a link, title, meta, body, facets, referent, a one-line invitation; no deck, since the page has none. (b) The overlay keeps the deck and the page gains it. (c) Leave the two as they are and document the divergence. | (a), or (b) if the deck is wanted at all. Evidence: strong — nine divergences in a table, and the transition kinds only pair parts both sides have. |
| **A2** | The adjacent-room hint's transition | Cross (instant) or the default crossfade | Cross, for consistency with Nav; the spec asked for real visits before deciding, and the visits are behind us. Evidence: one held question, no data either way. |
| **A3** | Where the visitor lands when the last thread is dropped | The Foyer (today); the room they came from; the gathering (pattern 16) once it exists | The gathering when it exists; the room of origin until then. Evidence: moderate — one spec decision, one root cause the spec did not name. |
| **A4** | A filter in the sky | AND, dim-not-remove, URL state (P6); or none (the walk) | None, and retire P6's filter, because the walk is later and presence already does the sky's narrowing. Evidence: two later specs against two earlier ones. |
| **A5** | The closed set of search params the sky's address may carry | `{ focus }` (today); `{ focus, room, facets }`; anything | `{ focus, room, facets }`, so the orientation contract's four rows have addresses and the horizon's refusals (no time, no hover) are kept. Evidence: strong — the spec already names all three. |
| **A6** | Whether the overlay stays a route and whether the page offers it | Route (today) with a page → overlay affordance; route without; overlay only client-side | Route, kept; the page's `↑ See this in the sky` already goes to the star, which is the spec's stated preference ("not read again in a panel"). Fix the remount regardless. Evidence: strong. |
| **A7** | The dialog primitive for the overlay | Base UI `Dialog`; React Aria; a hand-rolled trap | Base UI, smallest real version, one component. Evidence: moderate — a survey of the three, no trial in this tree. |
| **A8** | A star's hue when a work has several facets | First-listed facet, and the domain model amends "unordered" to "the first is primary"; or a rule independent of order | First-listed, made honest: the model admits an authored primary facet, and the chips render in the authored order. Evidence: single data point — one work, four facets. |
| **A9** | The facet page's shape | Masonry by date with featured interjections (exists); list grouped by room (IA) | Keep the masonry and amend the IA; the grouping can return as a lens (`rooms=`) on the gathering. Evidence: moderate — the masonry was built after the IA and with `feature` in the schema. |
| **A10** | The word *thread* | Both meanings (an edge in the sky; a facet followed on the ground); or *facet* on the ground | Both. A facet is the thread the sky draws; the double meaning is the site's one graph seen twice. Evidence: the pattern language leans this way; the feeling decides. |
| **A11** | The constellation plan's chrome and drift phases (P2, P4–P10, P12) against the walk's refusals | Retire them to the plan's held register with the walk cited as the reason; keep them pending; rewrite the plan | Retire to held, and let the plan's P13 (spec reconciliation) become the only live phase. Evidence: strong — two later specs and the shipped code refuse what the phases build, and the audit they rest on describes a camera that no longer exists. |
| **A12** | The press on a star that is not *here* | Travel on the first press and open on the second (today); open on the first press; travel, and cue the second press in the whisper | Keep travel-then-open, and let the whisper say so on arrival (*press again to open*), in second voice, once per session. Evidence: one browser session; the walk's own reasoning is sound and the mouse visitor's confusion is real. |
| **A13** | The trailing slash | Drop it at the edge (`drop-trailing-slash`), as the IA promised; or accept it and change the IA, the sitemap, and the JSON-LD | Drop it. Evidence: strong — a spec commitment, a sitemap, and structured data all say one form, and one config line makes the edge agree. |

---

## What This Audit Does Not Cover

- The sky's own internals — the walk, the motion core, the painters, the daystar's passes. `CONSTELLATION_IMPLEMENTATION_AUDIT.md` and `CONSTELLATION_STORYBOARD.md` audit those, and the tests there are the densest in the tree.
- The fabric and the slice, which have their own invariant ledgers.
- Performance and bundle weight beyond what a finding implies; `PERFORMANCE_BUDGET.md` and the Lighthouse ratchet hold those.
- Whether any preview seed should become a work. That is content, and content is Danny's.

---

## Verification

The claims above were made by reading the tree at `cb4188e`; by running the build and inspecting `dist/client`; by opening the built site in a headless Chromium under `vite preview` and driving it — every route cold, the star and overlay round trips, the facet and posture filters through reload, the keyboard order, reduced motion, and the theme — with screenshots kept in the session's scratch directory; and, for the two edge findings (the empty 404 and the trailing-slash redirect), by requesting the deployed branch preview directly. Re-verify a finding before treating it: `grep -rn "viewTransition={false}" src/` for C9; `ls dist/client/*.html` for C1; `grep -c "<loc>" dist/client/sitemap.xml` and `grep -c '?' dist/client/sitemap.xml` for C6; `grep -rn "ROOM_LABEL" src/` for C8; `grep -rn "nodeKey = " src/` for the address. A finding that no longer reproduces is retired from this file in the commit that retires it.

---

*Drafted 2026-09-06. This file is the collection; the treatment is whatever Danny blesses from the adjudication table, and it lands as commits that cite the finding they close. When a finding closes, it leaves this file and the commit message carries its number.*
