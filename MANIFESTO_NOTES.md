# Manifesto Notes

*A technical accompaniment to [`MANIFESTO.md`](./MANIFESTO.md). The manifesto names the patterns; this file shows the apparatus — file paths, line numbers, lint rules, the small places where a claim is enforced or where it has drifted.*

The two files are paired. Read the manifesto for the slingshot; read this for the wiring. If a claim in the manifesto cannot be located here in code or spec, one of them has drifted and needs to update.

This file is dense by design. It is the second life of the manifesto — the side that an agent reads when the question is *how do I keep this true?* rather than *what is this becoming?*

---

## Reading Order

The arrows below mirror the six in the manifesto. Each has the same structure:

- **Where it lives** — the spec, the file paths, the line numbers.
- **What proves it** — the lint rule, the test, the runtime invariant.
- **What threatens it** — the regression mode that would silently undo it.

Convergences follow the arrows. Verification commands follow the convergences. A drift inventory at the end names the small honesties that are worth keeping in view.

---

## Arrow 1: The medium is hosting the making

**Where it lives.**
Twenty-two specifications at the repo root, organized into the six layers of `SPECIFICATION_MAP.md` (entry, inside, outside, the house, the threshold, the grounds). The skills layer at [`.claude/skills/`](./.claude/skills/) (`coding`, `writing-prose`, `writing-specs`, `architecting`, `auditing`) — orientation, never duplication. The dual-life commitment is stated in `TRANSPARENCY.md`. The eighth dimension of the medium — the agentic surface — is named in `MEDIUM.md` §"The Agentic Surface".

**What proves it.**
Every spec opens with a header line declaring its role and dependencies (per the entry sequence in `SPECIFICATION_MAP.md`). Cross-references between specs are prose-encoded but real edges; `SPECIFICATION_MAP.md` is the table-of-contents-as-graph. The skills' `SKILL.md` files reference specs by filename, so a spec rename would break a skill's orientation — making the link discoverable.

**What threatens it.**
A spec written without dual-life voice — internal jargon, agent-instruction tone, no register suitable for a visitor. A skill that begins to *contain* what a spec already says rather than orient toward it. A new top-level markdown that is not placed in a layer of the spec map. Any of these turn the medium back into documentation.

---

## Arrow 2: Time is being authored as a material

**Where it lives.**
The four canonical durations — 200ms, 500ms, 600ms, 60s — are tokens in `src/styles/tokens.css` (`--animate-geo-spin`, the `.reveal` class) and Tailwind utilities (`duration-200`, `duration-500`). The signature easing curve `cubic-bezier(0.23, 1, 0.32, 1)` is set on `.reveal`. The theme transition lives in [`src/app/providers/theme-store.ts`](./src/app/providers/theme-store.ts) (`applyToDOM` runs at module load, before React renders). View transitions are wired via `defaultViewTransition: true` in [`src/router.tsx`](./src/router.tsx). The kind-table — *Open, Close, Rearrange, Cross, Step, Fall-through* — is specified in `INTERACTION_DESIGN.md` §"Page and Route Transitions".

**What proves it.**
All `viewTransitionName` values flow through the canonical generators in [`src/shared/utils/view-transition-names.ts`](./src/shared/utils/view-transition-names.ts) — `workHeroTransitionName`, `workTitleTransitionName`, `workMetaTransitionName`, `workCardTransitionName`. A grep across `src/` for inline name strings (e.g. `viewTransitionName: 'foo'`) returns zero non-generator hits. The Reveal molecule honors `motion-reduce:transition-none` so reduced-motion is honest. The geometric figure pauses when off-screen via IntersectionObserver — a body that conserves itself.

**What threatens it.**
A new motion that earns no token. A `viewTransitionName: '...'` written by hand. An `animation-duration: 437ms` that lands somewhere because it "felt right." A theme transition migrated to React state, reintroducing the flash-of-wrong-theme that the module-level init exists to prevent. Any of these are a regression — the spec calls them out by name.

---

## Arrow 3: The graph is one graph, deepening

**Where it lives.**
The closed sets are typed in [`src/shared/types/common.ts`](./src/shared/types/common.ts) — `Room`, `Facet`, `Posture`, `ReferentType`. The frontmatter contract is in [`src/shared/content/schema.ts`](./src/shared/content/schema.ts). The wikilink engine — parsing, scanning, resolving, and inverting the outbound graph — is in [`src/shared/content/wikilinks.ts`](./src/shared/content/wikilinks.ts) (`parseWikilinkInner`, `scanWikilinks`, `resolveWikilink`, `invertOutboundGraph`). The marked extension that will feed the resolver into HTML rendering lives in [`src/shared/content/wikilink-marked.ts`](./src/shared/content/wikilink-marked.ts). The display layer is [`src/shared/content/display.ts`](./src/shared/content/display.ts). Click delegation that routes wikilinks through TanStack instead of full-reloading lives in [`src/shared/hooks/useInternalLinkDelegation.ts`](./src/shared/hooks/useInternalLinkDelegation.ts) and is called inside `WorkView`.

**What proves it.**
Zod schemas reject unknown rooms, facets, postures, and referent types at content load. `src/shared/content/wikilinks.test.ts` exercises the parser against the syntax forms (`[[slug]]`, `[[room/slug]]`, `[[slug|display]]`) and the resolver against the slug index. Salon referent types map to Schema.org classes in [`src/shared/seo/schema-org.ts`](./src/shared/seo/schema-org.ts) — a `MusicComposition` carries `composer`, a `Book` carries `author`, a `Movie` carries `director` (the role-aware creator property is a closed-set behavior, not a string field).

**What threatens it.**
Auto-related inference (a "you might also like" computed from substring overlap, co-tagged works, or vector similarity). A ninth facet promoted without sitting a season. A wikilink that resolves at runtime instead of build-time. A new content type added to the schema without naming what it does to rendering. The graph stays *one graph* only if every edge is authored.

---

## Arrow 4: The site has a body

**Where it lives.**
The geometric figure at [`src/shared/atoms/GeometricFigure/`](./src/shared/atoms/GeometricFigure/) — 60s linear rotation, IntersectionObserver pause when off-screen. The Diamond at [`src/shared/atoms/Diamond/`](./src/shared/atoms/Diamond/) — 45° rotate on group-hover of the wordmark, 300ms. The Reveal molecule at [`src/shared/molecules/Reveal/`](./src/shared/molecules/Reveal/) — 14px translateY, 600ms, `cubic-bezier(0.23, 1, 0.32, 1)`, threshold 0.08. The view-transition pairings live on `WorkView`, `WorkHero`, `WorkEntry`, `WorkRow`, and `FacetCard` — five surfaces, four canonical generators, one body moving. React Compiler is wired in [`vite.config.ts`](./vite.config.ts) and enforced in [`eslint.config.js`](./eslint.config.js):

- `react-compiler/react-compiler: 'error'` — bailouts are a lint failure
- `no-restricted-syntax` warns on manual `useMemo` / `useCallback`
- `no-restricted-imports` warns on `memo` / `forwardRef` from `react`
- `react/jsx-max-depth: 4` — working memory's structural ceiling

**What proves it.**
A grep across `src/` for `viewTransitionName:` finds 14 hits, all of them generator calls, none of them inline strings. The lint refuses bailouts at build time, so a render-impure component cannot ship without an explicit per-line disable that names its reason. The `motion-reduce:transition-none` modifier sits on the Reveal class string. The `applyToDOM(isDark())` call at module load in `theme-store.ts` is what protects the no-flash-of-wrong-theme invariant.

**What threatens it.**
A `useMemo` that "fixes" a perf concern instead of re-architecting the component. A `memo()` import slipped past the lint warning. A new motion attached to a DOM element without view-transition naming. A reveal duration changed to "feel snappier" without revisiting the kind-table. The body of the site is real because every gesture is named; if a new gesture lands without a name, the body grows a limb the architecture can't move.

---

## Arrow 5: Every gap has a trigger

**Where it lives.**
[`BACKLOG.md`](./BACKLOG.md) — every item carries a `**Trigger:**` line that names the condition under which it should be taken up. Categories: Accessibility, Performance, Content, Design, Infrastructure, Code Quality. Triggers range from concrete (*"the first work in any room"*, *"build time crosses ≥30s"*) to felt (*"when the design tokens change often enough that manual verification stops being reliable"*). The five skills at [`.claude/skills/`](./.claude/skills/) orient toward these triggers; the `auditing` skill is the one that re-reads the backlog when running canaries.

**What proves it.**
The backlog file is the proof — it is one of two near-canonical places (with `SPECIFICATION_MAP.md`) where the site says what it knows it owes itself. Recent commits show triggers firing in real time: *"Cap multi-facet prerender to depth 2; toggle bar honors the cap"* (2026-04-25 area, the depth-cap trigger met) and *"Wikilinks resolution + backlinks: the graph's first whisper"* (the second-work-style condition partially met by *small weather*'s arrival).

**What threatens it.**
A backlog item without a trigger (*"someday this should be cleaner"*). A trigger met but unread (build time crosses 30s and the prerender depth cap is not revisited; a second use of `leading-[1.4]` lands without graduating to a token). The backlog only works as spanda-translated-into-ops if the building actually pauses to listen when a condition arrives.

---

## Arrow 6: Closed sets, open practice

**Where it lives.**
The closed sets are typed in [`src/shared/types/common.ts`](./src/shared/types/common.ts):

```ts
export type Room = 'foyer' | 'studio' | 'garden' | 'study' | 'salon';
export type Facet = 'craft' | 'consciousness' | 'language' | 'leadership'
                  | 'beauty' | 'becoming' | 'relation' | 'body';
export type Posture = 'listening' | 'looking' | 'reading';
export type ReferentType = 'visual-artwork' | 'music-composition'
                         | 'music-album' | 'music-recording'
                         | 'book' | 'article' | 'movie';
```

`Mode` is *not* exported. Held architecturally absent per `DOMAIN_MODEL.md` §"Modes". The four held accent colors (`--accent-warm`, `--accent-rose`, `--accent-violet`, `--accent-gold`) live in [`src/styles/tokens.css`](./src/styles/tokens.css) as vocabulary; no semantic token references them yet. The Foyer is reachable via the wordmark, never labeled in nav (per `INFORMATION_ARCHITECTURE.md`).

**What proves it.**
`grep -rn 'export type Mode' src/` returns zero hits. `grep -rn -- '--facet-' src/styles/` returns zero hits — the held accents have not been assigned to facets. The facet route's loader uses `roomSchema.safeParse` and `facetSchema.safeParse` so a malformed URL cannot produce a malformed render. The Zod refusal of unknown values at content load is the closed-set vow enforced at the boundary.

**What threatens it.**
A premature `Mode` enum that introduces branching before a work needs it. A `--facet-craft: var(--accent-warm)` mapping shipped before a surface earns the distinction. A ninth facet added because three works happen to share a theme. A new room added to ship a new content category. The architecture of patience holds only if the closed sets are felt as vows — not as fields awaiting their default values.

---

## Convergence Wiring

The manifesto names three convergences ahead, plus a fourth quieter one. Each is partially wired today; the gap between current state and arrival is small and explicit.

### A. The strata become navigable in the surface itself

**What exists.** The strata model is committed in `TRANSPARENCY.md`. The specs are markdown, addressable at file paths and at heading anchors. `SPECIFICATION_MAP.md` is the navigable index.

**What's missing.** The annotation mechanism. A way for a rendered surface element (a token, a navigation pattern, a transition) to declare which spec section it descends from — and a viewer mode that surfaces that lineage. `TRANSPARENCY.md` §"Annotation system" names this as architectural commitment, mechanism deferred (overlay vs. marginalia vs. data attributes consumed by a viewer mode).

**Triggering condition.** Probably the first time a visitor (or Danny) wants to see *why* a surface looks the way it looks. Could ride alongside the time-slider drawer or precede it.

### B. The graph becomes a room

**What exists.** Wikilink parsing, scanning, resolution, and inversion (`src/shared/content/wikilinks.ts`). The slug index. The Schema.org JSON-LD scaffolding for referents. The display layer (`getDisplayWork`, `getDisplayWorksByRoom`, `getDisplayWorksByFacets`). The facet route with multi-select and depth cap.

**What's missing.** A visible graph surface — likely not a force-directed simulation (too noisy for a quiet room), more likely per-facet small graphs or a slowly-rotating constellation echoing the geometric figure. The data shape is decided; the rendering is held.

**Triggering condition.** Per `BACKLOG.md` §Design / "Visible graph surface": *probably 30+ works with enough interlinks*. Until then the graph is felt through the outward invitation.

### C. The agentic surface and the rendered surface converge

**What exists.** Most specs are already authored with dual-life voice — they read as both instruction and content. `MEDIUM.md` and `TRANSPARENCY.md` are the cleanest examples. The build pipeline produces `dist/client/` from a deterministic input set that includes the markdown specs.

**What's missing.** A rendering treatment for specs as published content. A typography / page shape that distinguishes specification-as-content from work-as-content without flattening either. A discoverable surface where a visitor can encounter the specs without it feeling like a docs section.

**Triggering condition.** A surface composition that earns it. Likely the same moment as the annotation system — once you can point from a rendered element to a spec section, rendering the spec section itself becomes the natural next surface.

### D. The time slider arrives

**What exists.** Git history. Reserved location in nav (top-right) per `INFORMATION_ARCHITECTURE.md`. Structural reasoning held in `TRANSPARENCY.md` §"The Time Slider". Clean commit messages on the recent series (*"View transitions, kind 1/3 → 2/3 → 3/3"*) — the kind of authored history the slider would navigate.

**What's missing.** A build-time temporal index (date → file states). A drawer UI. A content-anchored scrubbing interaction. A clear decision about read-only-snapshot vs. navigable-historical-state.

**Triggering condition.** Per `BACKLOG.md` §Design / "Time-slider drawer": *enough temporal depth (years of specification changes, a meaningful content history)*. The slider arrives when there is enough to move through that movement is felt.

---

## Verification Protocol

Commands and checks that prove the manifesto's claims have not drifted. Run these when a surface changes and the change touches one of the arrows.

| Claim | How to verify |
|---|---|
| *"Render is a pure function"* | `pnpm lint` — `react-compiler/react-compiler` errors flag any bailout. |
| *"No inline view-transition strings"* | `grep -rn "viewTransitionName: ['\"]" src/` — expect zero hits outside `view-transition-names.ts`. |
| *"Closed sets"* | Diff `src/shared/types/common.ts` against `DOMAIN_MODEL.md` §"Enforced in Code". They should match exactly. |
| *"Mode architecturally absent"* | `grep -rn "export type Mode" src/` — expect zero hits. |
| *"Held accents not yet semantic"* | `grep -rn -- "--facet-" src/styles/` — expect zero hits. When a hit appears, it should reference a `--accent-*` vocabulary token. |
| *"No flash of wrong theme"* | Verify `applyToDOM(isDark())` runs at module load in `src/app/providers/theme-store.ts`, not inside a `useEffect`. |
| *"Wikilinks resolve at build time"* | The marked extension is wired into the loader; `wikilinks.test.ts` covers the resolver. |
| *"Backlinks newest-first"* | `invertOutboundGraph` signature in `wikilinks.ts` accepts a `dateLookup` and sorts each list. |
| *"Geometric figure pauses off-screen"* | IntersectionObserver in `GeometricFigure.tsx` toggles `animation-play-state`. |
| *"Reduced motion honored"* | `motion-reduce:transition-none` on `.reveal`; theme transition gated on the same media query (gap noted below). |
| *"Foyer is not special-cased"* | `grep -rn "room === 'foyer'" src/` — expect at most one drift, see Drift Inventory. |
| *"Multi-facet prerender capped at depth 2"* | `vite.config.ts` filter on `/facet/...,...` paths; `FacetToggleBar` disables off-chips when two are selected. |

These are not exhaustive. They are the specific checks that catch the kind of drift a manifesto-aware engineer would worry about.

---

## Drift Inventory

Small honesties. Places where a claim in the manifesto or in a spec is *almost* enforced — close enough that the practice still works, far enough that they're worth naming. Not failures. Not bugs. Drift, in the sense a sailor uses the word: a small angle off course that is correctable now and expensive later.

### 1. One Foyer special case in preview-data

`src/shared/content/preview-data.ts:603` contains:

```ts
if (room === 'foyer') return [];
```

`DOMAIN_MODEL.md` §"Invariants" explicitly forbids this pattern: *"no `if (room === 'foyer') { /* skip */ }` branches."* The function returns the empty set, which is what `previewWorksByRoom['foyer']` would naturally produce — but the branch is there because the indexer is keyed by the four content-bearing rooms. **Resolution path:** key `previewWorksByRoom` over all five rooms with `[]` for `foyer`, drop the branch. The fix is two lines.

### 2. One inline duration literal in Reveal

`src/shared/molecules/Reveal/Reveal.tsx:46` uses `duration-[600ms]` and `[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]` as Tailwind arbitrary values. `INTERACTION_DESIGN.md` §"The Choreographic Vocabulary" forbids inline arbitrary durations and treats the four canonical durations as token vocabulary. **Resolution path:** lift `--duration-reveal: 600ms` and `--ease-arrival: cubic-bezier(0.23, 1, 0.32, 1)` into `tokens.css`, expose Tailwind utilities for them, replace the inline literals. The fix is small and graduates the duration from a one-site magic number to a named gesture. Note that the agent's earlier read called the `.reveal` curve "hardcoded in CSS" — once tokenized, that note retires.

### 3. Reduced-motion gating is partial

`INTERACTION_DESIGN.md` §"Reduced Motion" commits to instant Reveal, instant theme transition, and paused geometric figure under `prefers-reduced-motion: reduce`. The Reveal class string carries `motion-reduce:transition-none`. The theme transition does not yet honor the media query — a 500ms `body { transition: ... }` runs even when reduced-motion is set. **Resolution path:** add a `@media (prefers-reduced-motion: reduce)` block in `tokens.css` that zeroes out the body transition and pauses `--animate-geo-spin`. Backlog item exists; trigger is the next accessibility pass.

### 4. Two markdown parsers ship in the client bundle

`marked` and `gray-matter` (≈30KB gzipped together) ride in the client chunk so that route loaders can resolve content during client-side navigation. A previous experiment with `createServerFn` removed them at the cost of breaking client nav under SSG. The current state is a deliberate choice; the held alternative is a build step that emits per-room and per-work JSON manifests and a fetch-based loader. Backlog item exists under Performance with the trigger named: *when bundle weight becomes a felt cost.*

### 5. `WorkOutwardInvitation` composes only one of three lines

`GRAPH_AND_LINKING.md` specifies the outward invitation as facet threads + backlinks + return-to-room. Today only the return-to-room renders. Facet threads need facet data on works (which exists for *small weather*); backlinks need wikilinks resolving (the engine is wired but not yet activated by a second work). The full composition lands when *small weather* gets a sibling that mentions it.

### 6. Room landings render no works list yet

`INFORMATION_ARCHITECTURE.md` commits that each room landing lists its works. Today the four room routes render only title + bracketed description + outward invitation. The room-landing list arrives with the first work in any non-Garden room (or when *small weather* gets a sibling in the Garden). Trigger noted in backlog under Content.

These six items are the truth-in-advertising layer of the manifesto. None of them threaten the slingshot. All of them are the kind of small thing the practice of attention is for.

---

## What This File Owes Itself

Like the backlog, this accompaniment carries triggers. When any of the following arrive, this file should be revisited:

- **A new arrow.** A pattern surfaces that is not one of the six. It earns a section and the manifesto gets a counterpart edit.
- **A new convergence.** The slingshot reveals a fourth or fifth destination. (The time slider was added as a fourth quieter convergence; more may arrive.)
- **A drift resolved.** When one of the six items in the inventory closes, retire it from this file with a note in the commit message naming the closure. Git keeps the record.
- **A drift introduced.** When a code change crosses a verification check, name it here before merging — better to acknowledge a deliberate exception than to let an unwitnessed one accrete.
- **A spec reorganized.** A move in `SPECIFICATION_MAP.md` that changes which file owns a concern means the line references in this document need refreshing.

The discipline mirrors `BACKLOG.md`'s: every item in the drift inventory should carry a resolution path, even if the path is *"sit with it."*

---

## Closing

The manifesto is the slingshot. This file is the apparatus. The two are paired the way a poem is paired with the room it is read in — neither subordinates the other. A manifesto without an apparatus drifts into rhetoric. An apparatus without a manifesto becomes maintenance.

Held together, they keep the building honest about what it is and where it is going. *And — because both files live two lives, as agentic interface and as published content — they keep that honesty visible to a visitor as well.*

---

*Drafted on 2026-04-27 alongside `MANIFESTO.md`. Companion file: revisit when the manifesto revises, when a drift resolves, when a new arrow surfaces. If this file and the codebase disagree, the codebase is the present moment and this file is a paragraph behind. Catch it up.*
