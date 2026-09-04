# Backlog

Held concerns — work that has been named, understood, and deliberately deferred. Not a kanban. Not a roadmap. A list of things the site knows it owes itself, with the reason each is waiting.

The practice: every backlog item has a _trigger_ — the condition under which it should be taken up. Items without triggers tend to stay on the list forever. Items with triggers surface themselves when their moment arrives.

When a backlog item is taken up, it is removed from this file. Git history preserves the record.

---

## Accessibility

### Skip-to-main-content link

**State:** Implemented as of the accessibility pass. Present in `__root.tsx`.

### Custom `:focus-visible` ring

**State:** Implemented as of the accessibility pass. Defined in `tokens.css`.

### Focus management on route transitions

**State:** Implemented in `__root.tsx`. `RootComponent` subscribes to `useRouterState({ select: (s) => s.location.pathname })` and focuses `<main id="main-content">` on each pathname change after the initial mount.

### Investigate the room-landing accessibility 0.95

**Why:** Lighthouse scores the four room landings (`/studio`, `/garden`, `/study`, `/salon`) at a11y 0.95 — one violation each — while the foyer hits 1.0. The blocker for graduating the room floor back to 1.0 is identifying and fixing whatever the violation is. Most likely candidates: contrast on `text-text-3` preview-note copy, the `noindex, nofollow` meta surfacing as an a11y signal in some audits, or a heading-order finding from the preview content.
**Trigger:** Next time the audit skill runs, or when a contributor opens the rooms in Lighthouse and reads the actual finding.

### `prefers-contrast: more` handling

**Why:** `ACCESSIBILITY.md` commits to honoring this preference. Border and text tones should strengthen toward `--text` and solid borders when requested.
**Trigger:** When the design system's secondary tones stabilize enough that high-contrast variants are meaningful to define.

### Automated color contrast checks

**Why:** Ensure that token combinations never regress below AA for body text.
**Trigger:** When design tokens change often enough that manual verification stops being reliable.

### `axe-core` integration in tests

**State:** Implemented as of the canary-baseline pass. `jest-axe` is wired into vitest via `src/test/axe.ts`; NotFound and WorkView tests assert zero violations. `color-contrast` and `region` checks are disabled in the vitest suite because they need a real browser — those are covered by Lighthouse CI against the built site.

### Expand axe coverage to more components

**Why:** Today, axe runs on NotFound, WorkView, Nav, and Footer. ThemeToggle and the Foyer page still have no a11y assertion.
**Trigger:** When any of those components gain interactive complexity, or when a regression is caught in Lighthouse but not in component tests.

---

## Performance

### Multi-facet prerender combinatorics

**Why:** The facet route supports multi-select via comma-separated paths (`/facet/beauty,body`). The toggle bar emits links to every reachable selection, so `crawlLinks: true` walks the full power set of 8 facets — 255 prerendered pages, most of which are empty-intersection states. Today the cost is small (each page is tiny, build finishes in seconds), but the count grows superlinearly with the facet vocabulary. A ninth facet doubles it to 511.
**Trigger:** Either the build time crosses a felt cost (≥30s), the deploy bundle approaches the Cloudflare Pages limit, or a ninth facet is proposed. Any of those graduates this to a real decision: cap depth (prerender only 1- and 2-facet combinations), `noindex` empty intersections, or shift multi-facet routes to client-side via a `_redirects` SPA fallback.

### Route-level code splitting

**Why:** Every route currently loads in the initial bundle. A visitor arriving at `/garden` downloads the code for `/salon` too.
**Trigger:** When the bundle has enough per-route weight to justify the cost of lazy loading (new components, per-route data, etc.). Today, each route is <50 lines; splitting is not worth it.

### Image optimization pipeline

**Why:** When images arrive (in works and possibly the Salon), they need responsive sources, modern formats (AVIF, WebP), and lazy loading. None of this exists yet.
**Trigger:** The first image in any work. Owned by `MEDIA_STRATEGY.md` when that file is written.

### Move `marked` and `gray-matter` back off the client bundle

**Why:** The two markdown parsers ship in the client chunk (≈30KB gzipped) so that route loaders can resolve content during client-side navigation without a server. A previous experiment with `createServerFn` removed them at the cost of breaking client-side nav under SSG (see `RENDERING_STRATEGY.md` §"The createServerFn archaeology"); the savings were paid for in fragility. The async barrel in `src/shared/content/index.ts` is the seam through which a future migration can land — most likely a build step that emits per-room and per-work JSON manifests under `dist/client/data/`, with the loader switching to `fetch()` calls behind the same async signatures. No route file would change.
**Trigger:** When the bundle weight becomes a felt cost — a Lighthouse regression, a measurable TTI hit on a real device, or the addition of a parser-heavy feature that pushes total weight over the budget in `PERFORMANCE_BUDGET.md`. Today it's noise against more meaningful concerns.

---

## Content

### Wikilink resolution in the loader

**Why:** `GRAPH_AND_LINKING.md` specifies `[[slug]]` and `[[room/slug]]` syntax with build-time resolution, but the loader currently passes markdown bodies through `marked` without parsing wikilinks. The code is structured to accept a wikilink plugin; one has not been written.
**Trigger:** When the first work links to another work (i.e., the second published work, if it references the first). Until then, there is nothing to resolve and nothing to break.

### Backlinks computation

**Why:** `GRAPH_AND_LINKING.md` specifies that backlinks are computed at build time by inverting the outbound-link set and surfaced in each work's outward invitation. The loader does not yet build this index.
**Trigger:** Same as wikilink resolution. The two ship together — backlinks require resolved wikilinks.

### Outward-invitation composition

**Why:** `GRAPH_AND_LINKING.md` specifies the bottom-of-work invitation as facet threads + backlinks + return-to-room. `WorkView` today renders only the return-to-room link. Facet threads and backlinks are gaps.
**Trigger:** When facets exist on works (add facet-thread composition) and when wikilinks resolve (add backlink composition).

### Room-landing works list

**Why:** `INFORMATION_ARCHITECTURE.md` specifies that each room landing lists its works. Currently each room renders only its title and bracketed description.
**Trigger:** The first work in any room. The list component is small and can be built that day.

### Facet chip atom + facet pages

**Why:** Specified in IA and GRAPH_AND_LINKING; rendering is not yet built. No `/facet/{facet}` route, no chip atom.
**Trigger:** When a work carries facets and the chip becomes visible absence on the work page.

### Per-content-type prose rendering

**Why:** The current `.prose` styles in `tokens.css` are generic — paragraphs, headings, lists, code. `CONTENT_SCHEMA.md` names four types (poem, essay, case-study, note), each of which may render differently (poems preserving line breaks, case studies handling figures, etc.).
**Trigger:** When a work exists whose type does not read comfortably in the generic `.prose` treatment.

### MDX support per-file

**Why:** `CONTENT_SCHEMA.md` names MDX as a held option for works that need embedded components (audio in the Salon, interactive figures in the Studio). The loader currently handles `.md` only.
**Trigger:** The first work that wants a component embed. Likely in the Salon or a Studio case-study.

### Draft graduation of bracketed copy

**Why:** 404 lines, the 404 link label, and the four room descriptions are bracketed per `VOICE_AND_COPY.md`'s draft convention. They await voice settlement.
**Trigger:** Whenever Danny has a settled phrasing for any of these surfaces. Graduation is per-surface — the Garden's description can graduate without waiting on the 404.

---

## Design

### Empty-room outward invitation

**Why:** `INFORMATION_ARCHITECTURE.md` commits that room landings carry an outward invitation even when empty. Today the four room landings have title + bracketed description and no outward gesture.
**Trigger:** Coupled to draft graduation — when the room's voice settles, the invitation is added in the same pass.

### Accent color semantic assignment

**State:** Partially graduated as of the constellation's first form. The four held accents pair editorially with the eight facets in `FACET_HUE` (`src/shared/content/constellation.ts`); the held discipline still holds for the rest of the site (chips, toggles, outward invitation remain neutral). A future surface that needs a different pairing names its own pairing in its own file.

### Visible graph surface

**State:** Substantially shipped at `/sky`. The structural future state in pure SVG/CSS is real (layered firmament with paper-grain noise, watercolor-filtered halos, vespers thread bloom, slow rotation, cursor parallax, the daystar, the polestar, the carpet rolling out on first paint), and the atmospheric WebGL layer has since shipped in its full form — a camera-aware firmament (`src/shared/webgl/`) that paints the complete sky when WebGL is available: per-pixel view rays through the live navigation camera, domain-warped watercolor weather, a deep micro-starfield, the room quadrants' chromatic atmospheres, shader-based per-star halos pixel-registered with the structural anchors (pigment by day, twinkling glow by night), and drifting motes with real depth. The SVG firmament remains the complete fallback behind every gate. `CONSTELLATION.md` §"What Shipped (First Form)" and `CONSTELLATION_HORIZON.md` Phases 0–4, 7 enumerate every shipped element. Since then (2026-09-01): the drag became a grab, the 600s turn of the heavens moved into the camera on a wall-clock phase, and the daylight mode became the chart — the sky drawn on paper — with a 1.8s dusk between the hours (`CONSTELLATION.md` §"What Shipped"). Then the walk ([CONSTELLATION_WALK.md](./CONSTELLATION_WALK.md), 2026-09-01): stars placed by the compass of their facets and spread apart where they would coincide, figures as per-facet spanning trees, destination travel in place of the drag, the whisper, threads as paths, names within a stroke of here, and the walk's session memory. _What remains held_: the strata layer, the time slider integration, audio in the Salon's region, per-room sub-skies.
**Trigger for the next moves:** each named with its own trigger in `CONSTELLATION_HORIZON.md`; a Salon work that asks for sound remains the audio trigger.

### Framing the focused star when it sits at the dome's edge

**Why:** The work ↔ star jump (`CONSTELLATION_PARALLEL.md`) opens the sky centered on the work's star. When that star sits near the edge of the populated cap, centering it pushes most of the constellation off one side of the frame and leaves the other half empty sky. The star is where it should be; the framing around it could be more generous — the camera aimed a little toward the polestar so the star lands off-center among its relations, or the cap's edge stars given a wider margin.
**Trigger:** A second surface that orients the sky (the room parallel, the facet parallel) — the orientation function they share is the right place to decide framing once, rather than special-casing the work jump.

### Placement override in frontmatter

**Why:** Stars are placed by the compass — the centroid of a work's facet anchors, spread apart where two would coincide ([CONSTELLATION_WALK.md](./CONSTELLATION_WALK.md) §"The Compass"). A work Danny wants somewhere specific has no way to say so.
**Trigger:** The first work whose compass place feels wrong to Danny's eye. An optional `sky: { azimuth, radius }` in frontmatter is the smallest form.

### The return flight on refresh

**Why:** The session remembers where you stood (`hereStorage.ts`). Prerendered markup cannot know it, so the sky opens at the pole and flies you back — a one-to-two-second crossing on every refresh or return from a work page. It reads as the sky returning you; it may read as delay.
**Trigger:** Danny's felt sense after living with it. The alternative is an instant re-place before first paint (a hydration-safe read), which trades the arrival for stillness.

### The drag's feel

**Why:** The drag follows the hand fully along a thread and at seven tenths elsewhere, aims at the star nearest the center, and settles onto it or springs home on release ([CONSTELLATION_WALK.md](./CONSTELLATION_WALK.md) §"Input"). Its constants are first guesses tuned with a mouse in headless Chromium: the play off a thread (`PLAY`) and the give's far limit (`ELASTIC_LIMIT_VB`), the reticle's reach and the head start a graph step gets (`INTENT_RADIUS_VB`, `INTENT_STEP_BONUS_VB` in `intent.ts`), the commit fraction and alignment tolerance of a track, and the two springs' frequency, damping, and velocity cap (`useSkyTravel.ts`).
**Trigger:** Danny's thumb on a phone, then a trackpad, then a mouse.

### The oculus's fit and the streak

**Why:** The resting camera fits the whole sphere — the oculus — to the frame's shorter side at 92% (about 3.85 radii on a landscape screen, farther on a phone), and travel reads its velocity from the deep field's streak rather than a dolly. The fill, the streak's strength, and the glide's duration range are tuned in a few viewports. Single-facet works also gather along their facet's bearing in a near-straight string; a wider azimuth jitter for them may read more like a sky.
**Trigger:** Danny's eye across a phone, a laptop, and a wide screen. The constants are `restDistanceFor` and `REST_DISTANCE` (`skyWalk.ts`), the streak in `atmosphereShaders.ts`, the durations in `useSkyTravel.ts`, and the jitter in `constellation.ts`.

### The presence cap

**Why:** From a star, at most `PRESENT_CAP` (24) stars are present, two of them strangers; the rest recede. The cap sits above the corpus today, so the reveal has not yet begun; as the corpus grows past it, the cap decides how much of the sky a visitor sees at once, and whether the reveal feels like a tree unfolding or like things going missing.
**Trigger:** The corpus passing thirty works, or Danny's felt sense sooner. `PRESENT_CAP` and `STRANGER_COUNT` in `presence.ts`. The book's sky passed it first (258 claims, 24 present at any star), and the dial (`CONSTELLATION_WALK.md` §"The Dial") keeps about `VIEW_TARGET` in frame around them.

### Embeddings behind the concordance

**Why:** The concordance is a TF-IDF cosine over each work's prose — honest and free, but shallow. Danny has been playing with qmd for embeddings; a build-time step that reads an embeddings manifest would make "in concordance" mean something closer to what he means.
**Trigger:** A manifest that can be produced deterministically at build time without a network call. `buildConcordance` (`concordance.ts`) is the seam; nothing downstream changes.

### One frame, two painters

**Why:** The painters split the work now (2026-09-04): the atmosphere draws every thread's resting hairline and every halo; the SVG paints the touchable few and whatever the walk lights. But each still projects for itself, and they agree only by construction. `CONSTELLATION_ARCHITECTURE.md` §"What Remains" names the rest of the way: a pure `projectFrame` returning every screen position and the label layout as data, and two painters that write it.
**Trigger:** The next change that has to be made in two projections at once.

### The arrival's render

**Why:** When presence changes at arrival, React renders every star and thread to flip a few attributes — in the development build half of a crossing's cost at a vault's density (`CONSTELLATION_ARCHITECTURE.md` §"What Shipped (2026-09-04)"). The hover already left React (`useSkyAttention.ts`); presence could follow it, written by the shell on arrival.
**Trigger:** Danny's word; the crossing sits at about thirty-five frames a second in production today.

### Hidden, not gone

**Why:** A present star's halo, gold, and echo are hidden with `visibility` so the claim's crescendo can still transition from its resting values, and hidden elements stay in layout: at the pole, moving 258 stars lays out 258 eight-box subtrees a frame. `display: none` would drop them from layout and cost the crescendo its start.
**Trigger:** Danny's word — the trade is the crescendo's start; the pole under a moving pointer sits at about twenty-six frames a second in production today.

### Gestures as data

**Why:** The shell still reads pointer and keyboard events directly. A pure `gestureOf(event, geometry)` would make every gesture a value the core can be tested against without the DOM.
**Trigger:** The first gesture that is hard to test through the DOM.

### The event log

**Why:** Arrivals, aims, and attentions are already values. Kept as a log they are the walk's memory in full, the transparency layer's material, and the generative horizon's seam — a proposal is an event the author blesses.
**Trigger:** The first proposal.

### Ghosts — agent-proposed stars

**Why:** The generative horizon ([CONSTELLATION_WALK.md](./CONSTELLATION_WALK.md) §"The Generative Horizon"): stars proposed in conversation, drawn faintly until blessed. Danny's decision: author-only until he blesses them into public view.
**Trigger:** The first conversation that produces a work worth placing before it is written. The data shape — a proposed state on a node, an author gate — precedes any UI.

### Time-slider drawer

**Why:** `TRANSPARENCY.md` holds the time slider; `INFORMATION_ARCHITECTURE.md` holds its location (nav top-right, native drawer).
**Trigger:** When the site has enough temporal depth (years of specification changes, a meaningful content history) to make movement through time feel like something rather than a sparse slider with few stops.

### Negative-pull spacing token (`--spacing-pull`)

**Why:** Room landings use `-mt-4 sm:-mt-6` to pull preview notes up under the deck — a deliberate overlap gesture. Today the pattern appears once, so a token would be over-naming. The pattern is real, but premature.
**Trigger:** A second use of the gesture (e.g. a deck-with-attribution, a kicker-pulled-under-title, a salon work-page meta tucked under the title). At that point name `--spacing-pull` and `--spacing-pull-md`.

### Single-use leading graduation (`leading-[1.4]`, `[1.55]`, `[1.6]`)

**Why:** Three leading values currently live inline because each has only one site (image-slot caption, Foyer welcome lines, Salon postures). Tokenizing now is anticipation; the leading palette should grow only when use repeats.
**Trigger:** A second use of any of these values in a different surface graduates that value into a named `--leading-*` token.

### Empty-state spacing (`--spacing-empty-breathe`)

**Why:** `INFORMATION_ARCHITECTURE.md` commits that empty rooms acknowledge their emptiness "by their quiet, not papered over with chrome." Today empty rooms are simply the absence of a works list — there is no named vertical breathing room around the silence.
**Trigger:** The first empty surface that visibly needs vertical breathing — likely a facet page with zero matching works once authored content fills the rooms enough to make the empty state read as deliberate. Likely value 80–96px (ladder rungs `20`/`24`).

### Fluid `--spacing-edge` with safe-area composition

**Why:** Edge padding currently steps from 32px to 40px at the `sm` breakpoint, with `max(…, env(safe-area-inset-*))` wrapping. The step pair works for mobile and tablet. A foldable or rotating-class device might benefit from a clamp-based smooth transition.
**Trigger:** A foldable-class viewport (or three+ visitor reports) that produces a visible mid-orbit step as the device moves between viewport classes.

### Print-mode space overrides

**Why:** Print is a backlog item per `RESPONSIVE_STRATEGY.md:64–82`. When the print stylesheet is written, every spacing token may want a `@media print` override — paper has different breath rules than screen.
**Trigger:** Coupled to the print stylesheet item above. Adopted as part of that pass.

### Page-transition spatial token (`--spacing-transition-rise`)

**Why:** Page transitions are deferred per `INTERACTION_DESIGN.md:117–123`. When implemented, the new page may want a small vertical offset (e.g. 14px, matching the Reveal token) for entering from below.
**Trigger:** Page transitions implemented. Adopted as part of that pass.

---

## Infrastructure

### Print stylesheet

**Why:** A site about poetry and essays with a "paper on the walls" aesthetic should print beautifully. Current print output includes nav and footer chrome.
**Trigger:** When a visitor asks to print a work, or when the first work that invites printing (a long essay, a sequence of poems) exists.

### Dependency policy

**Why:** `DEPENDENCY_POLICY.md` is partially covered in the north star's technology stack table. A full policy would name evaluation criteria, update cadence, and the philosophical stance on third-party code.
**Trigger:** When a new dependency needs adding and the existing table doesn't give enough guidance.

### Testing strategy

**Why:** `TESTING_STRATEGY.md` is partially covered in the north star. Explicit testing policy — what to test, coverage philosophy, integration vs. unit balance — may want its own file.
**Trigger:** When the test suite grows beyond a handful of files and seams become harder to navigate.

### Media strategy

**Why:** `MEDIA_STRATEGY.md` is a gap. Owns image optimization, audio handling (Salon), responsive images, alt text philosophy, CDN delivery.
**Trigger:** The first media-bearing work, likely in the Salon.

### Evolution protocol

**Why:** `EVOLUTION_PROTOCOL.md` is a gap. How the codebase grows — refactor triggers, migration patterns, what "living over finished" means operationally.
**Trigger:** When the codebase has enough shape that evolution decisions start to benefit from a named practice.

### Security posture

**Why:** `SECURITY.md` is a gap. For a static content site the posture is light (no user input, no auth), but it should still be declared.
**Trigger:** Before the site ships to production. The absence of data collection is itself a security decision worth declaring.

### SEO and meta

**State:** Specification exists (`SEO_AND_META.md`). Schema.org JSON-LD is implemented for `WebSite`, `Person`, the `CreativeWork` subtypes for works, and `BreadcrumbList` for work pages. Remaining items below are sub-tasks of the spec.

### Per-page title and meta description

**Why:** The root route now sets a site-wide title and description in each prerendered page (via the TanStack Start `head` config), so every route has valid meta. Each route should also emit its own specific `<title>` and `<meta name="description">` — the Studio's title is currently "Danny Dyer" like every other page, and descriptions don't yet distinguish rooms or works.
**Trigger:** Before the first deploy for the rooms. Per-work titles land with the first work (the `$room/$slug` route's loader already surfaces the work's title).

### Open Graph image generation

**Why:** Each work wants a 1200×630 OG image rendered from its title, date, and facets over the umber ground. Specified in `SEO_AND_META.md`.
**Trigger:** Before the first deploy, once a shared aesthetic for the card is decided.

### RSS / Atom feeds

**Why:** Per-room feeds and a site-wide feed, full-content not summaries. Specified in `SEO_AND_META.md`.
**Trigger:** With the first work that a reader might want to follow.

### Web Vitals production analytics

**State:** `web-vitals` library is wired (`src/shared/seo/web-vitals.ts`) and logs to the console in dev. Production forwarding is deferred.
**Trigger:** When a deployment and analytics provider are chosen (`DEPLOYMENT.md`).

---

## The Cathedral

Held phases of `CATHEDRALS.md`, the founding document of the workspace the house shares with Danny's knowledge-graph engine. Each phase names its pull there; the pulls are repeated here so the backlog stays the one place held things are listed.

### Ghosts are drawn

**Why:** The slice carries pending proposals and the vault reader fills them from the inbox, but the sky does not yet draw a ghost — a star not yet lit, where it would land if blessed.
**Trigger:** Phase 1's second pass; the book has two.

### The field past the center

**Why:** The dial (`CONSTELLATION_WALK.md` §"The Dial") runs the camera from the palantír to the center of the vault and stops there. A sky denser than about fifty stars a steradian still holds more than `VIEW_TARGET` (32) at the center — the book holds about 48. The next stop is a narrower field of view past the center, the camera's `fovY` turned by the same dial.
**Trigger:** A slice whose center view is half again over the target; `walkDistanceFor` in `src/shared/sky/dial.ts`.

### The atmosphere's sectors follow the compass

**Why:** The dome's meridians and tinted sectors are eight and four in the shader (`atmosphereShaders.ts`); a compass of thirteen speaks over them. The atmosphere should take its sectors from the slice's axes.
**Trigger:** Phase 1's second pass.

### Labels inside the vault

**Why:** Standing at the center, the atmosphere's halos grow with nearness and the labels' offsets (`slotOffset`, `labelLayout.ts`) do not, so the name of _here_ sits in its own glow. The offsets could follow the projected halo, or the halo could hold its size.
**Trigger:** Danny's eye inside the book sky.

### The engine enters the workspace

**Why:** `cathedrals` becomes `packages/hg` by `git subtree add`, history intact; `hg slice --json` emits a slice; the vault's claims render as a second sky with its pending proposals as ghosts.
**Trigger:** Reachability fired: `main` on GitHub is current. Waits on the workspace's visibility (`CATHEDRALS.md` §"Held").

### The seed and the root enter as lineage

**Why:** The third repository, the Living Graph (December 2025; `living-graph`, created empty on 2026-09-03 for Danny's push), is the seed both the house and the engine grew from: the engine kept its constitution, the house kept its design brief, the sky kept its constellation and set down its canvas. The fourth, Dyerverse (2025), is the root: the longing, the golden loop, the protocol of essence and vector and link, and the creed of pure functions, before consent. No code enters from either; the documents do, whole, at `lineage/living-graph/` and `lineage/dyerverse/`, cited from the two constitutions they fathered. The seed's reference implementation of a canvas editor is the source for the sky's authoring verbs (Phase 5).
**Trigger:** Fired 2026-09-03; both repositories are reachable. Waits on the workspace's visibility, and on Danny naming which documents are intimate.

### The site moves under `apps/`

**Why:** Today the site lives at the root and the workspace grows by packages. When something else needs the root, the site moves to `apps/site`, the Workers Builds root directory follows, and the movements of `CATHEDRALS.md` become the root `CLAUDE.md`.
**Trigger:** A second app, or the engine's Worker, needs the root.

### Blessing from the sky

**Why:** A web verb for blessing is request-time behavior in the page — the second of `RENDERING_STRATEGY.md`'s two triggers for a runtime — scoped to one route. Until then blessing happens in the terminal and the sky shows the ghost before and the star after.
**Trigger:** Danny wants to bless from a phone, or a second author appears.

### The dotting collision

**Why:** The sky dots the second facet of each hue pair to keep adjacent facets apart; the contract wants dotting for origin. One yields.
**Trigger:** Phase 1's second pass, with the book on screen — thirteen axes in four hues make the collision visible.

### The workspace's visibility

**Why:** This repository is public; the engine, the vault, the seed, and the root are private, and some lineage documents are intimate. Phases 2 and 3 publish whatever enters. A private workspace, a public one with selective lineage, a public one with everything, or the fourth that arrived with the book — code public, private slices out of git, private skies deployed as their own Workers behind Cloudflare Access (`pnpm deploy:book`): Danny's call.
**Trigger:** Before Phase 2 or Phase 3 lands.

### Slices load with the sky, not the site

**Why:** A named slice file is bundled eagerly into the main chunk through `import.meta.glob`; the book adds some seventy kilobytes gzipped to every page of that build. A slice should load with the sky route only.
**Trigger:** Fired 2026-09-04 with the book's first private build; open.

### One frontmatter for works and claims

**Why:** A work has title, date, facets, type; a vault claim has type, status, origin, confidence, evidence, constellations. They rhyme and do not match; the engine's markdown reader wants one shape.
**Trigger:** Phase 2's markdown reader.

---

## Code Quality

### Frontmatter validation in the pre-commit hook

**Why:** `CONTENT_SCHEMA.md` specifies Zod-validated frontmatter, and `src/shared/content/schema.ts` already holds the schema. When a `.md` under `src/content/{room}/` is staged, the pre-commit hook should parse its frontmatter and run the schema against it — catching a malformed `type`, a missing `title`, or an unknown facet at the moment of commit rather than at build time.
**Trigger:** The first work. Until then, there is no content directory to validate.

### Wikilink resolvability in the pre-commit hook

**Why:** `GRAPH_AND_LINKING.md` commits that unresolved wikilinks fail the build. The pre-commit hook can surface that failure earlier — parse `[[slug]]` and `[[room/slug]]` in any staged `.md` under `src/content/`, fail if any target isn't in the resolved set.
**Trigger:** Pairs with the wikilink-resolution loader item under Content. Both ship together.
