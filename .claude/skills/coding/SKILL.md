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
| Subscribe to external system (IntersectionObserver) | Legitimate effect, but wrap in a custom hook (see `useReveal`) |
| Fetch data | Build-time loader via `import.meta.glob` (see `src/shared/content/loader.ts`) |
| Initialize on mount | Lazy initializer or module-level |

Effects that fit the two legitimate patterns (subscriptions; analytics) live in custom hooks, never raw in components.

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
- For components using `<Reveal>`: the default IntersectionObserver mock in `src/test/setup.ts` suffices. For components that *drive* the reveal: override locally (see `useReveal.test.tsx`).
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
