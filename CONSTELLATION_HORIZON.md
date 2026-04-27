# The Constellation Horizon

*A technical envisioning paired with [`CONSTELLATION.md`](./CONSTELLATION.md). That file holds the experience the site is building toward — the felt sense of looking up, the watercolor weather, the daystar's ascent. This file holds the architecture an expert team would have shipped when the surface is fully realized: the rendering stack, the layered composition, the data contracts each layer needs, the build-vs-runtime allocation, the performance and accessibility invariants, and the migration path from where we are to where we are going.*

The discipline of this document: **work backwards from the endpoint.** Imagine the constellation in its finished form. Reverse-engineer the architecture that would have to be true for it to behave that way. Then sequence the work to get there without ever shipping a half-form that we'd later have to tear out.

Where `CONSTELLATION.md` is the dream the building is reaching for, this is the structure the dream rests on.

---

## The Endpoint

The visitor approaches the Foyer. The geometric figure rotates once a minute. The wordmark sits in italic Newsreader. They scroll — *up, not down* — and a threshold passes. The Foyer's ground stays at their feet. The ceiling dissolves. A vast, granular firmament unfurls above them with the quiet inevitability of a curtain lifting.

In daylight, the sky is a *watercolor ocean* — the umber palette breathed up into a luminous expanse, paper-grain catching imagined light. Each work is a soft pigment bleed, edges feathered, slightly translucent. The points drift, parallactically, with the visitor's cursor and the slow-rotating heavens. The sun rides high — the same `SunIcon` that was in the nav corner, ascended into the firmament when the sky opened.

In night, the sky is paper-night — illustrated, stylized, deep. Stars carry soft halos that twinkle, almost-imperceptibly. The constellation lines (facet threads) are pale, drawn in barely-there light. Hover over a star and its threads *bloom* — wispy pastel vespers fan outward, brightening with a tiny overshoot, persisting with an afterimage as attention moves on. The connected stars respond with their own halos. A small label appears in italic, naming the work and its room. The moon rides high.

The polestar at the center is the geometric figure, ascended. The whole sky rotates slowly around it — over five minutes, or ten — so slowly the visitor only notices if they sit. *The room's heartbeat made vault.*

A small chevron at the bottom edge reveals a drawer: the time slider. They drag it left. Stars wink out — works that didn't yet exist. Threads dim — relationships not yet authored. The atmospheric color shifts toward an earlier palette. *Absence is information.* They drag it back to now and the sky refills.

In the Salon's region of the sky, an ambient layer hums: a slow drone, a held chord, the kind of audio that lives below conscious attention. Hover over a Salon star and a brief musical phrase plays — a fragment of its referent, attribution made sound.

A toggle in the corner reveals the *strata*. Faint ghost-nodes appear behind each star — specifications, components, design tokens. Hover over a star and the lineage threads connect it to the spec documents that govern its rendering. The constellation becomes a cross-section of the site's self-knowledge.

When the visitor scrolls down, the sky furls. The daystar descends to the corner. The Foyer is the Foyer. *Nothing was lost in the looking.*

The whole surface is keyboard-navigable, screen-reader-honest, reduced-motion-respectful, low-data-graceful, and renders in well under the performance budget the site has held since the SSG pivot. None of that is mentioned in the room. It is simply true, the way a well-built room is structurally sound without announcing its joinery.

This is the endpoint.

---

## The Layers

The endpoint is one composed surface to the visitor; to the architecture it is **five distinct layers**, each with a single responsibility and a clean contract with its neighbors. The discipline is exactly what `MEDIUM.md` names for the webpage as a whole: *the interface is the outermost layer of the content itself.* Each layer carries a real concern. None of them duplicates another's work.

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: AUDIO          (lazy, Salon-scoped)                │
│  Web Audio API · ambient drone · per-work referent samples   │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: STRATA         (opt-in, low z)                     │
│  Spec ghost-nodes · lineage threads · annotation overlay     │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: STRUCTURAL     (always-on, top z, semantic)        │
│  SVG <a> stars · threads · screen-reader nav · keyboard      │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: LABELING       (transient, hover/focus)            │
│  SVG label callouts · constellation patterns · midpoint tags │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: ATMOSPHERIC    (always-on, bottom z, painterly)    │
│  WebGL firmament · paper grain · parallax · twinkle          │
└─────────────────────────────────────────────────────────────┘
                       Time slider sits beside the
                       canvas as a separate route-level
                       overlay, modulating which nodes
                       and threads each layer sees.
```

### Layer 1: Atmospheric (the firmament)

A full-route-bleed WebGL canvas, mounted behind everything else, `aria-hidden="true"`. The shader paints:

- A radial gradient from polestar warmth to horizon depth, theme-aware.
- Procedural noise (Perlin or simplex, octaves tuned for paper grain) layered with low opacity.
- A twinkle field on per-star halo positions — soft sinusoidal luminance offsets at random phases per node.
- A parallax offset field driven by `pointermove` and the slow autonomous rotation. Nearer "atmospheric depth" moves more, farther layers move less.
- Day vs. night shader variants — different gradients, different twinkle palette, different grain density. The 500ms theme transition crossfades the two shader outputs at the canvas level.

The atmospheric layer carries **zero semantic content**. It is paint, not navigation. A screen reader walks past it; a `prefers-reduced-data` visitor never downloads it.

### Layer 2: Labeling (the transient annotations)

Lives inside the SVG, above the structural anchors. Renders only when something is hovered or focused: the work's title and room as a small italic callout positioned near the star; a midpoint tag on a hovered thread naming the joining facet; a constellation pattern's name when its bounding cluster is dwelt on.

This layer carries no addressable elements — labels are not links, they are descriptive. Screen readers get this content through the structural layer's `aria-label`s; sighted visitors get it as transient typographic chrome.

### Layer 3: Structural (the bones)

The semantic SVG we already shipped. Each work is a real `<a href>` with a real `aria-label`, a real focus ring, a real keyboard tab order. Threads are decorative `<line>`s with `aria-hidden`. The container is a `<nav aria-labelledby>` with a sr-only heading naming the count.

This is the layer that carries **the medium's hypertextuality**. If WebGL fails, if the canvas refuses to compile shaders, if the visitor disables JavaScript entirely — *this layer still works*. Every star is still a link. The constellation degrades gracefully to a quiet SVG sky.

### Layer 4: Strata (the opt-in cross-section)

A toggle in the page-level chrome reveals ghost-nodes for each specification document and a set of lineage threads tracing which specs govern which works' rendering. This is the manifesto's first convergence (*"the strata become navigable in the surface itself"*) made visible.

Renders below the structural layer (lower z) so it never blocks navigation. Animations are slower than the rest of the surface — strata move *under* the constellation, not in front of it.

### Layer 5: Audio (the Salon's region)

A lazy-loaded ambient layer that activates only when the constellation route is in `prefers-reduced-motion: no-preference` and the visitor has not set `Save-Data`. A faint synthesized drone (Web Audio: a few oscillators, gentle filtering, low gain) hums when the cursor is over the Salon's quadrant. Hover a Salon star and a short sample plays — pre-encoded, attributed, lazy-fetched, brief.

Audio is **always opt-out via a chrome toggle** and never auto-plays without prior cursor interaction (browser policy). It honors the same accessibility invariants as motion: reduced-motion silences it, Save-Data refuses to load it.

---

## Layer Composition

The five layers compose in z-order with a single `<div>` per layer (or a single `<canvas>` for atmospheric). The composition is pure — each layer is mounted independently, communicates with its neighbors only through state in a small `useConstellationStore` (likely Zustand or a React context), and can be removed, replaced, or upgraded without touching the others.

```tsx
<SkyRoute>
  <ConstellationProvider value={graphAndState}>
    <FoyerGround />          {/* the carpet, carpet-roll animation */}
    <AtmosphericCanvas />    {/* WebGL, layer 1, aria-hidden */}
    <ConstellationSvg>
      <LabelingLayer />      {/* layer 2 */}
      <StructuralLayer />    {/* layer 3 — what we shipped */}
      <StrataLayer />        {/* layer 4, opt-in */}
    </ConstellationSvg>
    <AudioLayer />           {/* layer 5, opt-in */}
    <TimeSliderDrawer />     {/* the temporal overlay */}
    <SkyChrome />            {/* the daystar, the strata toggle, the
                                 audio toggle, the look-down link */}
  </ConstellationProvider>
</SkyRoute>
```

The graph data flows in once at load. Interaction state (`activeKey`, `hoveredEdgeId`, `temporalDate`, `strataOpen`, `audioEnabled`) flows through the provider. Each layer subscribes to only the slices of state it needs. This is the React-North-Star axiom 5 (complexity is earned, isolated, kept out of the presentation layer) at scale.

---

## The Stack (Considered, Chosen, and What We Refused)

The user named four candidate technologies for the rendering: WebGL, Canvas, react-force-graph, "or similar." Each makes sense for a different surface. The constellation is not a force-directed graph and it is not a 3D scene; it is *a painted, slowly-rotating, semantic-graph-as-sky*. The stack the experts ship is shaped by exactly that nature.

### What we refused, and why

**`react-force-graph` (and the d3-force family).** Force-directed layouts simulate physics — nodes pull and push until they settle. Every node-add re-runs the simulation. *The layout is unstable across builds.* This violates the constellation's deterministic-positioning commitment (`CONSTELLATION.md` §"What Shipped (First Form)": *the same input produces the same graph, and adding a new work never moves the existing stars*). A visitor returning after a publish event would see a different sky, which would feel like the room had moved while they were out. Refused. The deterministic polar layout we already have is the right primitive.

**`@react-three/fiber` / Three.js.** A 3D scene graph is overkill. We do not need orthographic-vs-perspective cameras, OrbitControls, lights, materials, or a depth buffer. We are painting a flat sky. Three.js would import ~150KB minified for capabilities we do not use. Refused. *Use the right tool, not the impressive one.*

**Canvas 2D for the structural layer.** Canvas loses the DOM. No `<a>` elements, no focus ring, no `aria-label`, no keyboard tab traversal *unless* we re-implement all of it on top of a hit-testing layer. That re-implementation would not pass a real screen-reader audit, and we'd lose the medium's hypertextuality (`MEDIUM.md` §"Hypertextuality"). Refused for the structural layer. Considered for the atmospheric layer — see below.

**Pure SVG for the atmospheric layer.** SVG filters can do paper grain (feTurbulence), soft bleeds (feGaussianBlur + feColorMatrix), and even rudimentary parallax — but at 30+ filtered nodes the browser's filter pipeline becomes a bottleneck, especially on mobile. SVG is fast for a few hundred elements; it is slow for thousands of small parallax-offset draws per frame. The endpoint wants thousands. Refused for the atmospheric layer. Kept for structural, labeling, strata.

### The stack the experts ship

**WebGL (via [`ogl`](https://github.com/oframe/ogl) or hand-rolled) for the atmospheric layer.**

`ogl` is a minimal WebGL wrapper — about 12KB gzipped, written by oframe, with a tiny API surface and zero opinions about scene graphs. It exposes: `Renderer`, `Camera`, `Geometry`, `Program`, `Mesh`, `Transform`, `Texture`. That's it. Everything else is your shader code. The library does not impose a scene graph, a render loop policy, or a material system. It hands you a GL context and gets out of the way.

For our needs:

- One `Renderer` instance bound to a `<canvas>` element sized to the constellation viewport.
- One `Mesh` covering the canvas — full-screen quad with a fragment shader doing the painting.
- A handful of uniforms updated each frame: `uTime`, `uCursorPos`, `uTheme` (0..1, animated through 500ms transitions), `uStarPositions` (texture or uniform array), `uHoveredStar`, `uTemporalActive` (which stars are present at the current slider position), `uReducedMotion` (boolean).
- The shader does:
  - Multi-octave Perlin/simplex noise for paper grain (compile-time-tuned octave count).
  - Radial gradient anchored to polestar with horizon falloff.
  - Per-star halo passes — soft additive disks at the star positions, with twinkle (sin-wave luminance) and parallax offset (cursor-space delta).
  - Theme blend — two output palettes, mixed by `uTheme`.

The shader is one fragment program, ~150 lines of GLSL. It compiles once on route load, runs at 60fps on modern hardware, and degrades to a fixed framerate on lower-end devices via a `prefers-reduced-motion`-aware loop.

**Held alternative: hand-rolled WebGL with no library at all.** The honest version of "we want very particular shader effects no library will get right" is to write the WebGL bindings ourselves — ~80 lines of setup code, full control. The library/no-library split is a coin flip; `ogl` saves 80 lines of bindings and costs 12KB. For a one-off surface, no-library wins. For a surface that may grow more rendering targets (the time slider drawer? a per-room mini-sky?), the library wins. *Held until the second use earns the abstraction.*

**SVG (with React) for the structural, labeling, and strata layers.**

The DOM tree is the navigation. Already shipped for layer 3; layers 2 and 4 follow the same pattern. SVG `<filter>` elements handle the labeling layer's soft callouts; CSS `:has()` and data attributes handle hover-driven label revelation without re-rendering React. The strata layer adds ghost-nodes as separate SVG groups with reduced opacity and slower animation timing.

**Web Audio API (synthesized) + a tiny audio sample manifest for the audio layer.**

The ambient drone is not a recording — it is synthesized in-browser by a small graph: 3-4 sine oscillators at frequency ratios chosen to avoid cluster dissonance, biquad lowpass filter, gentle gain envelope tied to cursor proximity to the Salon region. Synthesizing avoids shipping audio bytes. The per-work referent samples are pre-encoded as ~10s opus or AAC (~8KB each), lazy-fetched only when a Salon star is hovered, played through a separate `AudioBufferSourceNode`.

**Zustand (or context + useReducer) for the cross-layer state.**

The constellation store holds: `activeKey`, `hoveredEdgeId`, `temporalDate`, `strataOpen`, `audioEnabled`, `parallaxCursor`, `themePhase` (0..1 during transitions). Layers subscribe to slices. Zustand's footprint is ~1KB and avoids prop-drilling across five layers. Held alternative: pure context — works, but causes more re-renders than zustand's selector-based subscriptions.

**Build-time precomputation** (the architectural lock-in that makes the whole thing fast):

- The deterministic graph is computed at build, embedded in the route's loader return.
- The temporal manifest (one snapshot per relevant date in git history) is computed at build, served as a static JSON manifest, fetched lazily by the time slider on first interaction.
- The strata lineage map is computed at build from a small structured table that maps work content types and rooms to the spec documents that govern their rendering.
- The audio sample manifest (for Salon referents) is authored alongside the work and bundled at build.

Nothing about the constellation requires a server runtime. The endpoint stays SSG.

---

## The Data Contracts

Each layer needs a precise, narrow contract with the data layer. The contracts are designed so each layer can be built, tested, and shipped independently — and so a future layer can land without forcing changes to the layers below it.

### Atmospheric layer ← `AtmosphericScene`

```ts
interface AtmosphericScene {
  /** Star positions in normalized [0,1]² space — the WebGL shader's
   *  uniform array. Derived from ConstellationGraph at module load. */
  readonly haloPositions: readonly { x: number; y: number; hue: ConstellationHue }[];
  /** Twinkle phase per star — random but stable across renders so
   *  the same star always twinkles on the same beat. */
  readonly twinklePhases: readonly number[];
  /** The polestar position (the geometric figure's ascended location). */
  readonly polestar: { x: number; y: number };
  /** Theme phase: 0 = light, 1 = dark, animated during transitions. */
  readonly themePhase: number;
  /** Reduced motion flag — when true, the shader holds its current
   *  frame and stops parallax / twinkle. */
  readonly reducedMotion: boolean;
}

function buildAtmosphericScene(graph: ConstellationGraph): AtmosphericScene;
```

The atmospheric layer never consumes the full `ConstellationGraph`. It only needs positions and hues. Threads are not visible at this layer; the structural layer paints them.

### Structural layer ← `ConstellationGraph` (as today)

Already shipped. No change needed.

### Labeling layer ← derived from interaction state

```ts
interface LabelingState {
  hoveredStar: ConstellationNode | null;
  hoveredEdge: { source: ConstellationNode; target: ConstellationNode; facet: Facet } | null;
  hoveredPattern: ConstellationPattern | null;
}
```

Computed reactively from the `activeKey` and `hoveredEdgeId` in the store, joined against the graph.

### Strata layer ← `SurfaceLineage`

```ts
interface SurfaceLineage {
  /** For each work, which spec documents inform its rendering. The
   *  graph between works and specs is small and authored — eight to
   *  twelve specs per work, drawn from a single editorial table. */
  readonly workToSpecs: ReadonlyMap<string /*"room/slug"*/, readonly SpecRef[]>;
  /** Position each spec at a stable point behind the constellation —
   *  ghost-nodes with their own polar layout, slightly inside the
   *  star ring so the strata read as "underneath" the works. */
  readonly specPositions: ReadonlyMap<string /*spec filename*/, { x: number; y: number }>;
}

interface SpecRef {
  filename: string;        // "REACT_NORTH_STAR.md"
  section?: string;        // optional anchor within the file
  reason: string;          // editorial — why this spec governs this work
}
```

Built from a small structured table at build time. The table is authored — adding a new spec or changing which specs govern a work is a deliberate edit, not a derivation.

### Time slider ← `TemporalManifest`

```ts
interface TemporalSnapshot {
  date: Date;             // a meaningful date in the site's history
  presentNodes: readonly string[];  // "room/slug" keys of works that exist
  presentEdges: readonly string[];  // edge ids that are authored
  themeAtTime?: ThemeSnapshot;      // tokens.css palette at this date
}

interface TemporalManifest {
  snapshots: readonly TemporalSnapshot[];  // sorted by date
  earliest: Date;
  latest: Date;
}

// At build time:
function buildTemporalManifest(): Promise<TemporalManifest>;
// — walks git history, computes each snapshot from the file states
//   at that commit, emits to dist/client/temporal.json.

// At runtime, when the slider drawer opens:
function loadTemporalManifest(): Promise<TemporalManifest>;
// — fetches the JSON, caches it in memory.
```

The temporal manifest is the architectural innovation that lets the time slider be a UI over a precomputed data source. The git walk happens once, at build time. The runtime cost is one `fetch()` per visitor when the drawer opens.

### Audio layer ← `ReferentSoundtrack`

```ts
interface ReferentSoundtrack {
  /** For each Salon work that has audio attribution, the sample to
   *  play on hover and the attribution to display alongside it. */
  readonly samples: ReadonlyMap<string, {
    src: string;            // /audio/{slug}.opus
    attribution: string;    // "from Bach's Suite No. 1 in G major, mvt. 1 — performed by [...]"
    durationSeconds: number;
  }>;
}
```

Authored, not derived. The audio layer never plays a sample without explicit author intent.

---

## Build vs. Runtime

The expert architecture allocates work to whichever moment makes the visitor's experience cheapest. *Visitors should not pay for a build's laziness.*

### What happens at build time

- The `ConstellationGraph` is computed and embedded in the prerendered `/sky` HTML's data island. *No fetch on first paint.*
- The `AtmosphericScene` (positions, hues, twinkle phases) is precomputed and embedded the same way. *Shader receives uniforms instantly.*
- The `SurfaceLineage` is built from the editorial table. *No runtime spec parsing.*
- The `TemporalManifest` is built by walking git history. Output is `dist/client/temporal.json`. *No git access at runtime.*
- The audio sample manifest is bundled into a small JS module. Audio files themselves are emitted as static assets with content-hash names.
- The shaders are compiled to GLSL strings at build, embedded in the JS bundle. *No shader-source fetch.*
- The structural SVG is fully prerendered to HTML. *The constellation renders on first paint with zero JS.*

### What happens at request time (first navigation to /sky)

- The static HTML arrives with the structural SVG already painted. *The constellation is functional with JS off.*
- The `/sky` route's JS bundle hydrates, attaching event handlers, mounting the WebGL canvas, beginning the atmospheric animation loop.
- The atmospheric canvas takes ~200-300ms to fully render its first frame after JS hydration. The structural SVG remains visible underneath; the canvas fades in over the existing painted layer.

### What happens on interaction

- Hover/focus a star → activeKey state change → labeling layer rerenders the affected callout, atmospheric shader receives a uniform update, structural threads receive a `data-active` attribute toggling their CSS opacity.
- Theme toggle → `themePhase` animates from 0 to 1 (or vice versa) over 500ms via `requestAnimationFrame` → atmospheric shader interpolates output palette → SVG inherits via CSS variables → all surfaces transition together.
- Open time slider → `fetch('/temporal.json')` → cache in memory → render slider with snapshot count → on drag, dispatch `temporalDate` updates that filter `presentNodes`/`presentEdges` for both atmospheric and structural layers.
- Open strata → strata layer mounts, ghost-nodes fade in over ~600ms, lineage threads draw on hover.
- Audio toggle on, hover Salon star → fetch sample → play through Web Audio.

### The first-paint commitment

The `/sky` static HTML carries enough markup that *every star is already a clickable link before any JavaScript runs*. The atmospheric layer is enhancement; the structural layer is the surface. This is the same commitment the rest of the site already holds (`RENDERING_STRATEGY.md` §"SSG Stance"). It just applies harder here because the temptation to make the constellation purely-JS is real and would be wrong.

---

## Performance & Accessibility — the Floor That Doesn't Move

The endpoint must hold every existing invariant. Nothing about the visual ambition shifts the floor.

### Performance budget

| Surface | Target | Hard limit |
|---|---|---|
| `/sky` route's first-paint LCP | ≤ 1.5s | 2.0s |
| `/sky` INP (hover responsiveness) | ≤ 100ms | 200ms |
| `/sky` CLS | ≤ 0.05 | 0.1 |
| `/sky` JS bundle (route-split) | ≤ 60KB gzipped | 90KB |
| WebGL atmospheric chunk (lazy) | ≤ 30KB gzipped | 50KB |
| Frame budget (atmospheric) | 60fps | 30fps minimum |
| Audio assets per Salon work | ≤ 12KB | 20KB |

The `/sky` bundle is **route-level code-split**. The Foyer never loads the WebGL bundle. The first-paint structural SVG ships with the existing main chunk; the atmospheric canvas hydrates only on `/sky`.

If the WebGL chunk exceeds budget, the atmospheric shader simplifies (fewer noise octaves, no twinkle, no parallax) before any structural cuts. *The bones never lose weight to make the body lighter.*

### Accessibility invariants

- **Keyboard.** Every star tab-reachable in stable order (room-grouped, date-descending). Focus ring is the site's existing `:focus-visible` ring, sized for the SVG context. Time slider drawer is keyboard-operable (open/close + range with arrow keys). Strata toggle is a button. Audio toggle is a button.
- **Screen reader.** WebGL canvas: `aria-hidden="true"`. Structural nav: `<nav aria-labelledby>` with sr-only heading naming the count. Each star: `aria-label` of "{title} — {room}{, preview if applicable}". Time slider: `<input type="range">` with `aria-valuetext` reading "April 2026 — 8 works".
- **Reduced motion.** Atmospheric: shader holds last frame, parallax disabled, twinkle stopped. Structural: thread bloom is instant (no 200ms transition). Carpet roll-out: 200ms fade instead of 600ms unfurl. Polestar rotation: paused (still visible). Audio: silenced.
- **Reduced data.** WebGL bundle does not load. The atmospheric layer is replaced by a static CSS gradient background — same colors, no animation. The structural layer is unchanged. Audio: never loads.
- **High contrast.** Thread opacity at rest doubles. Halo radius increases. Hue palette shifts toward maximum-distinguishability variants of the held accents. Labels become opaque rather than soft.
- **No JavaScript.** Static HTML carries the full structural SVG. Every star is a link. The constellation degrades to a quiet, unmoving sky — but it works.
- **WebGL context loss.** GPU runs out of memory or browser revokes context → atmospheric layer unmounts, falls back to the static-CSS path. Structural layer never notices.

These are not aspirations. They are the floor. A surface that ships without holding all of them is not the endpoint — it is a draft.

---

## The Migration Path (Working Backwards)

The endpoint is described above. The current state is six commits in: data layer, held-accents graduation, atoms, organism, route, spec catch-up. The path forward is **eight phases**, each ending in a shippable, reversible state. Each phase's name is the question it answers; each phase's commits are the smallest valid set that delivers the answer without committing the next.

### Phase 0 (shipped) — *Does the structural surface exist?*

Six commits already in. `/sky` prerenders. `small-weather` is a real link. Held accents are paired editorially. Tests are green. Spec catches up to code.

### Phase 1 — *Does the carpet roll out when you look up?*

The reveal-from-Foyer gesture. Overscroll-up at the Foyer top, the twilight carpet unfurls, the daystar (`SunIcon`/`MoonIcon`) ascends from the nav corner into the firmament. The held richest gesture from `CONSTELLATION.md` §"The Reveal Mechanism."

Tech: pure CSS gradient transitions for the carpet, View Transitions API for the daystar's position move (the toggle keeps its functionality; only its `viewTransitionName`-paired position changes), an `IntersectionObserver` + scroll listener for the overscroll threshold.

Two commits. No new dependencies. Reversible by reverting the Foyer route and removing the carpet CSS.

### Phase 2 — *Does the sky have weather?*

The atmospheric WebGL layer, first form. Paper grain, radial firmament gradient, soft halos at star positions. No twinkle yet, no parallax. *A sky that breathes.*

Tech: `ogl` added as a dep (≤12KB gzipped), shader code in a single `.glsl` file imported as raw text, mounted as a `<canvas>` behind the SVG. Reduced-data and reduced-motion fallbacks land in the same commit so the surface never ships without them.

Two commits. New dep gate: `ogl` defended in the commit message; held alternative (hand-rolled WebGL) named.

### Phase 3 — *Does the sky live?*

Twinkle, parallax (cursor-driven), slow autonomous rotation. The atmospheric layer becomes time-aware. The polestar (still position-only at this phase, no figure ascended yet) is the rotation pivot.

Tech: animation loop runs at 60fps via `requestAnimationFrame`, throttled by `prefers-reduced-motion`. Shader uniform updates happen once per frame.

One commit. Pure shader work; no new deps.

### Phase 4 — *Does looking at a star bloom its threads?*

The full hover-bloom richness — wispy pastel vespers fanning outward, brightening with overshoot, persisting with afterimage. Replace the current opacity-only thread highlight with a gesture rich enough to feel like attention.

Tech: SVG filters for the bleed (feGaussianBlur + feColorMatrix), CSS transitions tuned per layer, optional shader contribution from the atmospheric layer (a soft additive glow at thread paths during bloom).

One commit.

### Phase 5 — *Can you scrub through the sky's history?*

The time slider. A drawer at the bottom-right of `/sky`, hidden until invoked. Drag to scrub; stars and threads update; atmospheric palette shifts.

Tech: `buildTemporalManifest()` in the build pipeline (walks git history, emits `dist/client/temporal.json`); `TimeSliderDrawer` component lazy-loaded on first interaction; structural and atmospheric layers gain a `temporalDate` filter.

Two commits — one for the manifest builder, one for the slider UI.

### Phase 6 — *Can you see the strata?*

The opt-in spec-strata layer. Toggle reveals ghost-nodes for spec documents and lineage threads connecting works to the specs that govern their rendering.

Tech: `SurfaceLineage` table authored as a `.ts` file (no derivation — explicit editorial), `StrataLayer` component, opacity/animation timing chosen so strata read as "underneath" the constellation.

Two commits — table + component.

### Phase 7 — *Does the geometric figure ascend?*

The polestar. The Foyer's `GeometricFigure` becomes the still point of the constellation. Same atom, repositioned in the page-level chrome. The sky rotates around it; the Foyer no longer carries it.

Tech: `GeometricFigure` becomes a context-aware atom that knows whether it lives at the Foyer scale or the firmament scale; the route layout decides where it mounts. The Foyer keeps its silhouette but the figure follows the visitor's gaze upward.

One commit. This is small but architecturally significant — it commits to the figure as a cross-route entity.

### Phase 8 — *Does the Salon's region hum?*

The audio layer. Ambient drone over the Salon quadrant, per-work referent samples on hover. Behind the audio toggle, never autoplay, lazy-loaded.

Tech: Web Audio API graph (oscillators + biquad lowpass), a small `ReferentSoundtrack` manifest, sample files emitted at build with content-hashed names.

One commit. Audio is gated by an explicit toggle and Salon presence; can ship after the rest of the surface is comfortable.

### Phase 9 (held) — *Constellation patterns*

Editorial named clusters with tracing lines. Earned only when the corpus has clusters worth naming. *Held until the writing pulls the names out.*

### Phase 10 (held) — *Per-room sub-skies*

A visitor at `/garden` can scroll up to see the Garden's regional constellation. *Held until the surface earns the regionalization.*

### What this sequence avoids

- No phase ships a half-form that must be torn out for the next phase to land.
- Each phase has a clear question it answers and a small set of commits it spans.
- Each phase is reversible — if Phase 4 doesn't pull, revert Phase 4 alone; Phases 0-3 still stand.
- New dependencies are introduced one at a time, in commits that name them and defend them.
- The accessibility floor and performance budget are held at every phase. *Phase 1 is as accessible as Phase 8.*

---

## Open Questions (Held Architecturally)

The endpoint is described, but several decisions inside it are deliberately not committed yet. Each is named here so the building can recognize it when it pulls.

**The shader library question.** `ogl` (named above) versus hand-rolled WebGL versus `pixi.js` for the atmospheric layer. The ~12KB difference is small; the ergonomic difference is medium; the long-term-evolution difference (a second WebGL surface arriving) is the deciding factor. *Held until Phase 2 implementation, where the shader code's complexity reveals which fits best.*

**Where the polestar lives in code.** Today `GeometricFigure` is a Foyer-scoped atom. In Phase 7 it becomes a cross-route entity. The right architectural move — context-aware atom, route-level layout slot, or a new `Polestar` molecule that wraps `GeometricFigure` — is a `architecting`-level decision worth its own conversation.

**The temporal manifest's snapshot density.** Every commit? Every meaningful site-state change (work added/removed, spec rewritten, palette tuned)? Every Tuesday? The slider's resolution depends on this. *Held until the manifest builder is written and we can see what the commit history looks like as a slider's domain.*

**Strata visibility default.** Off, on, or "on if the visitor came from a spec page"? The strata layer is opt-in for now; the question of whether it should ever be opt-out is held.

**Audio default state.** Off (current spec), or "on for the Salon if the visitor's session has had any audio interaction"? Browser autoplay policy makes the latter complicated. *Held until the audio layer is built and we hear what default feels right.*

**The full-screen mode question.** Should there be a full-screen toggle on `/sky` that hides the page chrome (nav, footer) and gives the constellation the entire viewport? The pull is yes — *the sky is a place* — but the cost is one more chrome piece that needs to be designed, tested, and documented. *Held until a visitor asks.*

**Mobile gestures.** The reveal-from-Foyer is described as overscroll-up. On mobile, overscroll is a gesture the OS sometimes consumes (pull-to-refresh on Chrome Android). The keyboard alternative (`↑↑` chord, "Look up" link) is honest. The right primary gesture on mobile is held — likely a swipe-up from the top edge, but worth its own design pass.

**Whether to publish the shader source.** The shader code is part of the site's making. `TRANSPARENCY.md`'s commitments suggest it should be visible — but it is technical enough that surfacing it in the strata layer (rather than as raw text) might be the right form. *Held until the strata layer is shipped and we see how technical content reads at that surface.*

---

## What This Document Is And Isn't

**It is** a forward-looking technical envisioning, paired with `CONSTELLATION.md`'s experiential vision. The two compose: this file says *how the experts shipped it*; that file says *what it feels like to encounter*.

**It isn't** a roadmap. The phases are in the order they make architectural sense, not in the order Danny will choose. The held questions are not TODO items — they are doors that have not yet been walked through.

**It isn't** a commitment. New evidence rewrites the document. If `ogl` turns out to have a subtle bug at the scale we want, the shader library question changes its answer. If the time slider arrives before Phase 5 because the spec history surfaces something pulling, the order changes. *The discipline is to stay honest about what we know and what we are still learning.*

**It does** establish the floor: the medium's hypertextuality is preserved at every phase; the SSG model is preserved at every phase; the accessibility floor never moves. These are the commitments the endpoint inherits from the rest of the site, and they are not negotiable inside this surface.

---

## Closing

The .5%-talented architect, looking at the constellation when it is finished, would not say *"we built a graph view."* They would say *"we built a sky."* The difference is in every layer of this document: the structural layer carries the medium's hypertextuality; the atmospheric layer carries the felt sense of place; the labeling layer carries the transient grace of attention; the strata layer carries the site's self-knowledge made visible; the audio layer carries the cellist's son's room into the sky.

None of this is mentioned to the visitor. They scroll up, the room opens, they see what they see. The architecture's job is to make sure that what they see is what we meant.

Working backwards from there is the only honest direction.

---

*Drafted on 2026-04-27 alongside `CONSTELLATION.md`. Updated whenever the endpoint clarifies, the stack reconsiders, or a held question resolves. If this document and the lived implementation disagree, the lived implementation is the present moment and this file is what it is becoming next. Catch the document up.*
