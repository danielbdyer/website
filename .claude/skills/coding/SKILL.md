---
name: coding
description: Use when writing, modifying, or reviewing code on Danny's site. Orients to the commitments that the linter can't enforce — the React North Star's architectural grammar, functional-programming preferences, the design system's token discipline, accessibility as a constraint (not a feature), the draft-voice convention, and the performance budget. Bundles the non-lintable surface so an agent writing code in this repo writes it the way the repo wants.
---

# Coding on This Site

Every commitment below is a real commitment, not a suggestion. Some are enforced by tooling (TypeScript strictness, the boundaries linter, the 80-line hard limit, jsx-a11y rules). Many aren't — and that's why this skill exists. When you touch code here, hold these in view.

## The architectural grammar

`REACT_NORTH_STAR.md` is authoritative. The 14 axioms are non-negotiable. The ones that surface most in day-to-day work:

- **The domain doesn't know about React.** Pure TypeScript in `src/shared/content/`, no framework imports.
- **Dependencies point inward.** Components → shared; shared → shared; app → anything. The linter enforces this; if you're fighting it, move the file.
- **Data is immutable.** No `.push`, no `Object.assign`, no mutations. Spread, map, filter.
- **Render is a pure function.** Same inputs, same output. No side effects in render. Hooks unconditionally at the top, in the same order.
- **Compose, don't configure.** Small composable pieces over one component with many flags.
- **Types first.** `types.ts` precedes implementation. Zod schema + `z.infer` is the canonical pattern (see `src/shared/content/schema.ts`).

## Thresholds (soft ceilings)

- Component file: target 60–80 lines, hard limit 80 (enforced by ESLint `max-lines-per-function: error`).
- Component props: target 3–5, hard limit 7.
- JSX nesting depth: target 2–3, hard limit 4.
- `useEffect` per component: target 1, hard limit 2. Default assumption: *you probably don't need one.*

If a file is approaching the ceiling, extract. The cost of many small files is linear; the cost of understanding a large file is exponential.

## When to reach for an effect

Almost never. `useEffect` decision tree (from `REACT_NORTH_STAR.md`):

| Impulse | Do this instead |
|---|---|
| Derive a value from props | `const` or `useMemo` |
| Respond to a user event | Event handler |
| Read from localStorage / URL / external | `useSyncExternalStore` + module-level init (see `theme-store.ts`) |
| Subscribe to external system (IntersectionObserver) | Legitimate effect; keep the subscription tight and disconnect on unmount (see `Reveal.tsx`, `GeometricFigure.tsx`) |
| Fetch data | Build-time loader via `import.meta.glob`; consume through the async barrel in `src/shared/content/index.ts` |
| Initialize on mount | Lazy initializer or module-level |

Effects that fit the two legitimate patterns (subscriptions; analytics) live in custom hooks, never raw in components.

## FP discipline at the component layer

The site commits to functional-programming style at the React layer. The compiler auto-memoizes; the lint forbids manual `useMemo` / `useCallback` / `memo`. That trust is only honest if the component author writes code the compiler can memoize cleanly. The discipline below is what makes a component *compiler-friendly* and *intent-clear* at the same time.

**Take computation out of render.** A `.map()` whose body does lookups, sorts, derivation — that work belongs in a pure helper in a sibling `.ts` file (often `layout.ts` next to the component). The component imports the helper and the JSX becomes a thin map from precomputed data to elements. Compare:

```tsx
// suspect — render does lookups, derivation, conditional skip
{graph.edges.map((edge) => {
  const source = positioned.get(`${edge.source.room}/${edge.source.slug}`);
  const target = positioned.get(`${edge.target.room}/${edge.target.slug}`);
  if (!source || !target) return null;
  const id = `${nodeKey(source)}|${nodeKey(target)}|${edge.facet}`;
  return <Thread key={id} ... />;
})}

// preferred — pure helper precomputes; render is a thin map
const edges = resolveEdges(graph.edges, positioned);
// ...
{edges.map((edge) => <Thread key={edge.id} ... />)}
```

The helper is testable in isolation; the component shrinks; the compiler's job becomes obvious.

**Module-level pure functions for predicates and small derivations.** A two-line predicate or hue lookup belongs at module scope, not redefined inside the component on every render:

```tsx
// at module scope
const isThreadActive = (
  activeKey: string | null,
  sourceKey: string,
  targetKey: string,
): boolean => activeKey === sourceKey || activeKey === targetKey;

// inside render — no allocation per call
{edges.map((edge) => (
  <Thread active={isThreadActive(activeKey, edge.sourceKey, edge.targetKey)} ... />
))}
```

A predicate that closes over no component state has no business living inside the component.

**Event delegation over per-element closures.** When a list of items each needs hover/focus handlers, *do not* create an arrow function per item inside the map. One handler set on the parent serves every child via `data-` attributes and `target.closest`:

```tsx
// suspect — N closures allocated per render, one per item
{nodes.map((node) => (
  <g
    key={key}
    onMouseEnter={() => setActive(key)}
    onMouseLeave={() => setActive(null)}
    onFocus={() => setActive(key)}
    onBlur={() => setActive(null)}
  >
    <Star ... />
  </g>
))}

// preferred — one handler set, delegation via data-key
const handleActivate = (e: SyntheticEvent<Element>) => {
  const handle = (e.target as Element).closest('[data-node-key]');
  if (!handle) return;
  setActiveKey(handle.getAttribute('data-node-key'));
};
const handleMouseLeave = () => setActiveKey(null);
const handleBlur = (e: React.FocusEvent<Element>) => {
  if ((e.relatedTarget as Element | null)?.closest('[data-node-key]')) return;
  setActiveKey(null);
};
// ...
<g onMouseOver={handleActivate} onMouseLeave={handleMouseLeave} onFocus={handleActivate} onBlur={handleBlur}>
  {nodes.map(({ node, key }) => (
    <g key={key} data-node-key={key}>
      <Star ... />
    </g>
  ))}
</g>
```

The blur handler's `relatedTarget` check is the small bit of care that keeps a moving focus from briefly clearing the active key. *Care at the seam where state transitions live.*

**Higher-order functions over branching configuration.** Prefer composing small typed transformations over a single function with many flags. `nodes.flatMap(work => positioned.get(...) ? [{ node, pos }] : [])` is preferred to a manual loop with conditionals.

**Atomic boundaries.** Atoms are leaves — zero state, zero subscriptions, render their props. Molecules compose atoms with small local state (e.g., a `Reveal` wrapping intersection-observer state). Organisms compose molecules at feature scale, holding the kind of cross-cutting state the surface owns. If an atom grows hover-state or a subscription, it has become a molecule; rename and move it.

When a component crosses the 80-line ceiling, the question to ask is *what computation here doesn't need to live in render?* — not *what should I split into another component?* Extracting pure helpers usually pulls the line count back down without inventing new component boundaries.

## The data layer is async; the implementation is sync today

`RENDERING_STRATEGY.md` commits to **pure SSG with no production server runtime**, and to an isomorphic data contract: `src/shared/content/index.ts` exposes async functions (`getDisplayWorksByRoom`, `getDisplayWork`, etc.) that today wrap synchronous bundled reads. The async signature is the architectural seam — it means the day the loader changes (to JSON manifests fetched from `/data/*.json`, to a CMS in a hybrid setup, to anything else) **no route file changes**.

Hold the contract:

- **Routes `await` content reads.** They already do; keep it that way even though the wrapped functions resolve instantly.
- **Never expose a sync content function on the barrel.** Internal `*Sync` helpers stay inside `loader.ts` / `display.ts`. The boundary is async.
- **Never reach for `createServerFn` for static content reads.** It is the wrong abstraction for an SSG-only deploy — the client-side stub fetches over HTTP, and the static deploy has no handler. This was the bug that produced the `[Something here caught and fell.]` ErrorBoundary regression. The lesson is encoded in `RENDERING_STRATEGY.md` §"The createServerFn archaeology"; the rule is encoded here.
- `createServerFn` is appropriate only for code that *must* run with a runtime (mutations, secrets, request context). Adopting it implies provisioning a runtime in front of that one URL, scoped to that one feature. The default deploy stays static.

## Style and design tokens

- `cn()` from `@/shared/utils/cn` is the only way to combine Tailwind classes.
- Named tokens only. `bg-bg`, `text-text-2`, `border-border` — not `bg-[#f5f1eb]`.
- Inline hex or arbitrary values are a signal the design system needs a token. Add it to `tokens.css` and document in `DESIGN_SYSTEM.md`.
- Dark mode is the same room dimmed. A palette change that breaks that continuity is wrong.
- Motion durations come from the vocabulary: 200ms hover, 500ms theme, 600ms reveal, 60s ornament. A new duration earns a new token.

See `DESIGN_SYSTEM.md` and `INTERACTION_DESIGN.md`.

## Accessibility is not optional

Every component contributes to the site's a11y posture. On every UI surface:

- Semantic HTML. `<button>` for non-navigation interactions; `<a href>` for navigation. Landmarks (`<nav>`, `<main>`, `<footer>`, `<article>`).
- Decorative SVGs carry `aria-hidden="true"`.
- Icon-only interactive elements carry `aria-label` (dynamic if state-dependent — see `ThemeToggle`).
- Touch targets ≥44×44px.
- Heading hierarchy never skips levels.
- `:focus-visible` styling comes for free from `tokens.css`. Don't override.
- `prefers-reduced-motion` is honored: CSS already collapses transitions; if you add JS-driven motion, guard with `matchMedia('(prefers-reduced-motion: reduce)')`.

See `ACCESSIBILITY.md` and `RESPONSIVE_STRATEGY.md`.

## Draft voice convention

If a component renders visible copy that hasn't been settled by `VOICE_AND_COPY.md`, mark it as draft:

- Wrap in square brackets: `[This is draft copy.]`
- Use `text-[var(--text-3)]` (the quietest tone)
- Keep italic register

When voice settles, remove brackets and restore `text-2`. The brackets are a visible acknowledgment of incompleteness, not a bug to be hidden.

See `VOICE_AND_COPY.md`.

## Voice in code itself

- **Comments are rare, and only for the non-obvious.** Don't narrate what the code does; let the code speak. Comment when a constraint isn't visible from the code (a bug workaround, a contract with an external system, a deliberately slow value).
- **Variables and functions are named for what they are.** `workSchema`, not `generateSchemaOrgBlockForAWorkEntity`. `isPublished`, not `computeDisplayabilityOfWorkWithCurrentDate`.
- **Tests verify behavior.** What the user sees; what the caller receives. Not internal state, not hook-call counts.

## Performance awareness

Every new dependency is a commitment of bundle weight. Every effect, every piece of client-side state, every import.meta.glob is a choice.

- If it can be built at build-time instead of runtime, do that.
- If a dependency is >50KB and you use one function, consider writing the function yourself.
- Bundle size limits live in `PERFORMANCE_BUDGET.md`. The SSG pivot (to TanStack Start) is held in `BACKLOG.md` — it's the eventual answer to the current ~200KB gzipped bundle.
- Motion durations are intentional slowness (`INTERACTION_DESIGN.md`); load times are not.

## Testing as you go

- Co-locate `{Name}.test.tsx` with every component.
- Use `@testing-library/react` + `userEvent.setup()` for interactions.
- Use `axe(container)` from `@/test/axe` for a11y assertions on any visible surface.
- For components using `<Reveal>`: the default IntersectionObserver mock in `src/test/setup.ts` suffices. For components that *drive* the reveal: override locally (see `Reveal.test.tsx`).
- For components using router hooks: wrap in `createMemoryHistory + createRootRoute + RouterProvider` (see `NotFound.test.tsx`).

Run `pnpm test --run`, `pnpm exec tsc -b`, `pnpm exec eslint src/` before committing. All three must pass. The ESLint boundary rules will flag misplaced imports; fix by moving the file, not by suppressing.

## Spec references (the reading order for code work)

- `REACT_NORTH_STAR.md` — the architectural spine.
- `DESIGN_SYSTEM.md` — material vocabulary.
- `INTERACTION_DESIGN.md` — motion vocabulary.
- `ACCESSIBILITY.md` — user preferences and WCAG commitments.
- `RESPONSIVE_STRATEGY.md` — viewport and touch discipline.
- `VOICE_AND_COPY.md` — microcopy conventions and the draft pattern.
- `PERFORMANCE_BUDGET.md` — what fast means here.

If all of these are new to you, start with `REACT_NORTH_STAR.md` and `DESIGN_SYSTEM.md`. The rest slot in as the work requires.
