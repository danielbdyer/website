---
name: add-component
description: Use when building a new UI component or surface — an atom, molecule, organism, or app-layout piece. Walks the decision tree, the folder convention, the test requirement, and the style, accessibility, and voice commitments.
---

# Add a Component

This site's components follow a deterministic architecture. The folder structure is the architecture; the types are the specification; the linter enforces the boundaries. This skill walks the steps.

## Step 1 — Decide the level

| Level | Example | Characteristics |
|---|---|---|
| **Atom** (`shared/atoms/{Name}/`) | `Diamond`, `SunIcon`, `GeometricFigure` | Zero state, zero side effects, zero domain. ≤5 props, ≤40 lines. Fully controlled via props. |
| **Molecule** (`shared/molecules/{Name}/`) | `Reveal`, `Ornament` | Composition of atoms. `useState` only for UI-local state (open/closed, hover). ≤7 props, ≤60 lines. |
| **Organism** (`shared/organisms/{Name}/`) | `WorkView` | Feature-level presentational. Data via a typed `data` object prop. May own UI state. ≤7 props, ≤100 lines. |
| **App-layout** (`app/layout/{Name}.tsx`) | `Nav`, `Footer`, `ThemeToggle`, `NotFound` | App-shell pieces — persistent chrome, not feature-bound. |

If more than one answer fits, the lower level wins. If you reach for a container, pause — this site has no containers today because all data is synchronous (build-time loaded). See `REACT_NORTH_STAR.md`.

## Step 2 — Create the folder

Components live in `{PascalCase}/{PascalCase}.tsx` with a co-located `{PascalCase}.test.tsx`. Exception: `app/layout/` uses flat files (not subfolders) because the pieces are one-of-a-kind.

## Step 3 — Write types first

Props interface at the top of the file. Never optional when the caller must pass a value; `className?` and `size?` are allowed but bare `children` is not a catch-all.

## Step 4 — Style via `cn()` and tokens

- `cn()` from `@/shared/utils/cn` is the only way to combine Tailwind classes.
- Use named tokens (`bg-bg`, `text-text-2`, `border-border`). Inline hex or arbitrary values are a signal the design system needs a token — add it to `tokens.css` and document in `DESIGN_SYSTEM.md`.
- Every visual atom accepts `className`.
- Every interactive atom uses `forwardRef`.

## Step 5 — Accessibility is not optional

- Semantic HTML: `<button>` for interactive non-navigation, `<a href>` for navigation, `<nav>`/`<main>`/`<footer>`/`<article>` for landmarks.
- Decorative SVGs: `aria-hidden="true"`.
- Icon-only interactive elements: `aria-label`, dynamic if state-dependent.
- Focus-visible styles come for free from `tokens.css` — don't override unless you have a specific reason.
- Touch targets: interactive regions ≥44×44px.

See `ACCESSIBILITY.md` and `RESPONSIVE_STRATEGY.md`.

## Step 6 — Write a test

Co-located `{Name}.test.tsx`. Verify *behavior* (what the user sees and does), not implementation (internal state, hook calls). Use `@testing-library/react` with `userEvent.setup()` for interactions. For components using `<Reveal>`, the default IntersectionObserver mock in `src/test/setup.ts` suffices. For components using TanStack Router hooks, wrap in `createMemoryHistory + createRootRoute + createRouter + RouterProvider` (see `NotFound.test.tsx` for the pattern).

Every accessible surface should include `await axe(container)` via the helper in `src/test/axe.ts`.

## Step 7 — Voice for visible text

If the component displays copy, see `VOICE_AND_COPY.md`. Draft copy is `[bracketed]` and uses `--text-3`. Labels have no trailing period; sentences do. No exclamation points. No "Click here".

## Step 8 — Verify

- `pnpm test --run {path}`
- `pnpm exec tsc -b`
- `pnpm exec eslint src/`

If ESLint flags a boundary violation, the component is in the wrong folder or importing up the stack.

## Spec references

- `REACT_NORTH_STAR.md` — component architecture, thresholds, hook taxonomy, boundary law.
- `DESIGN_SYSTEM.md` — tokens, palette, typography, materiality.
- `VOICE_AND_COPY.md` — microcopy conventions and the bracket convention for drafts.
- `ACCESSIBILITY.md` — keyboard, semantic HTML, user preferences.
- `RESPONSIVE_STRATEGY.md` — touch targets, breakpoint discipline.
- `INTERACTION_DESIGN.md` — motion vocabulary if the component animates.
