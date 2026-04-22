# The React North Star

## Architectural Specification for Component-Based Frontend Systems

---

## Governing Axioms

These are non-negotiable. Every directive in this document derives from them.

1. **Components Are Cognitive Artifacts** — A component's consumer has ~7 slots of working memory. A component that cannot be explained in 60 seconds has failed, regardless of whether it functions correctly.

2. **Structure Determines Correctness** — If "where does this go?" has more than one valid answer, the architecture is incomplete. The right decision must be the only decision that fits.

3. **Interfaces Are Promises** — Every prop is a commitment to every present and future consumer. Narrow interfaces are generous — they say "I've done the thinking so you don't have to."

4. **The Domain Doesn't Know About React** — Business rules must be pure TypeScript with zero framework imports. React is a delivery mechanism; the domain persists.

5. **Complexity Must Be Earned** — Complexity is isolated — pushed into hooks, utilities, containers — so the presentation layer remains a declarative description of what the user sees.

6. **Thresholds Are Phase Transitions** — Limits derive from cognitive science (Miller's Law), combinatorial testing theory, and empirical observation of maintainability degradation. Argue with the derivation, not the number.

7. **Files Are Cheap, Cognitive Load Is Expensive** — The cost of navigating many small files is linear. The cost of understanding one large file is exponential.

8. **Patterns Must Be Fractal** — The same structure repeats at every scale. A feature folder looks like a miniature application. Understanding at one level confers understanding at every level.

9. **The Folder Structure Is the Architecture** — The directory tree is the primary architectural document. Correct code should be generable from folder structure alone.

10. **Types Are the Specification** — Types are contracts that precede and constrain implementation. Written first. The type system is the first line of architectural enforcement.

11. **Dependencies Point Inward** — The domain core has zero external dependencies. Each layer depends only on layers closer to the core. Infrastructure adapts the outside world to domain interfaces, never the reverse. This is the Dependency Inversion Principle made spatial — hexagonal architecture where ports face outward and the domain faces only itself.

12. **Data Is Immutable** — Functions receive data and return new data. State transitions produce new values, never mutate existing ones. Arrays are filtered and mapped, never spliced. Objects are spread, never assigned into. Immutability makes pure functions possible, makes React's reconciliation correct, and eliminates stale closures and shared-mutable-state bugs.

13. **Compose, Don't Configure** — Build larger things by assembling smaller independent pieces. Atoms compose into molecules. Hooks compose behaviors. Providers compose context. Prefer many small functions over one with many parameters. When two concerns vary independently, they are separate compositions, not branches in a configuration object. This is the Composite pattern at every scale.

14. **Render Is a Pure Function** — A component's JSX is determined entirely by its props and hook return values — referential transparency applied to the view layer. Same inputs, same output. Hooks are called unconditionally, in the same order, at the top. No side effects in the render path. The component is a pure pipeline from data to pixels.

---

## Technology Stack

| Concern | Choice | Non-Negotiable |
|---------|--------|----------------|
| Language | TypeScript 6+ (strict mode) | Yes |
| Framework | React 19+ | Yes |
| Build | Vite | Yes |
| Routing | TanStack Router | Yes |
| Server state | TanStack Query | Yes |
| Styling | Tailwind CSS 4 | Yes |
| Component primitives | Radix UI | Yes |
| Form management | React Hook Form + Zod | Yes |
| Testing (unit/component) | Vitest + React Testing Library | Yes |
| Testing (e2e) | Playwright | Yes |
| API mocking | MSW (Mock Service Worker) | Yes |
| Linting | ESLint + `eslint-plugin-boundaries` | Yes |
| Formatting | Prettier | Yes |
| Package manager | pnpm | Yes |
| Animation | Motion (formerly Framer Motion) | No |
| Icons | Lucide React | No |
| Date handling | date-fns | No |
| Class merging | tailwind-merge + clsx (via `cn()`) | Yes |

### Why These

- **TanStack Router**: File-based routing, fully typed params/search/loaders end-to-end
- **TanStack Query**: Declarative server state — caching, deduplication, background refetch, Suspense
- **Radix UI**: Unstyled accessible primitives (behavior without appearance opinions); Tailwind provides appearance
- **React Hook Form + Zod**: Schema-driven validation; `z.infer<typeof schema>` eliminates type drift
- **eslint-plugin-boundaries**: Dependency direction as lint errors, not conventions
- **MSW**: Network-level mocking shared between tests and development

---

## Threshold System

### Size Thresholds

| Artifact | Target | Hard Limit | Derivation |
|----------|--------|------------|------------|
| Component file | 60–80 lines | 120 | Single-pass comprehension and generation window |
| Hook file | 40–60 lines | 100 | Single-purpose constraint |
| Pure function | 10–25 lines | 40 | One transformation, fully named and tested |
| Type definition file | 20–40 lines | 80 | One domain concept per file |
| Test file | 40–80 lines | 150 | One `describe` block, one concern |
| Index/barrel file | 5–15 lines | 25 | Re-exports only, zero logic |
| Container file | 25–40 lines | 50 | Wiring only — if longer, the orchestration hook isn't doing its job |

### Interface Thresholds

| Artifact | Target | Hard Limit | Derivation |
|----------|--------|------------|------------|
| Component props | 3–5 | 7 | Combinatorial state: 2^n testing states |
| Hook parameters | 1–2 | 3 | Ideally a single ID or config object |
| Hook return values | 2–4 | 5 | Named object, never positional |
| Context value fields | 3–4 | 6 | Small contexts, more of them |

### Structural Thresholds

| Artifact | Target | Hard Limit | Derivation |
|----------|--------|------------|------------|
| JSX nesting depth | 2–3 | 4 | Working memory stack depth |
| Prop drilling levels | 1 | 2 | Beyond 2, use context |
| Context provider nesting | 2 | 3 | Provider comprehension |
| Hook composition depth | 1–2 | 3 | Indirection traceability |

### Temporal Thresholds

| Artifact | Target | Hard Limit | Derivation |
|----------|--------|------------|------------|
| `useEffect` per component | 1 | 2 | Effect interaction complexity scales as n² |
| `useEffect` dependency count | 2–3 | 5 | Dependency tracking capacity |
| Suspense boundaries per page | 2–3 | 5 | Loading state coordination |

**The heuristic**: Approaching the target prompts reflection. Exceeding the hard limit prompts splitting. No exceptions.

---

## Canonical Folder Structure

```
src/
├── app/                            # Application shell
│   ├── App.tsx                     # Root component, provider composition
│   ├── routes/                     # TanStack Router route definitions
│   │   ├── __root.tsx              # Root layout (composes the shell)
│   │   ├── index.tsx               # Home page
│   │   └── checkout.tsx            # Route page
│   ├── layout/                     # App-shell components (Nav, Footer, etc.)
│   │   ├── Nav.tsx
│   │   ├── Footer.tsx
│   │   └── ThemeToggle.tsx
│   └── providers/                  # Global providers (auth, theme, etc.)
│       ├── AuthProvider.tsx
│       ├── ThemeProvider.tsx
│       └── index.ts
│
├── features/                       # Feature modules (the bulk of the app)
│   └── {feature-name}/
│       ├── index.ts                # Public API (re-exports only)
│       ├── types.ts                # Domain types — written FIRST
│       ├── domain/                 # Pure business logic — NO React imports
│       │   ├── {verb}-{noun}.ts
│       │   └── {verb}-{noun}.test.ts
│       ├── hooks/                  # React integration layer
│       │   ├── use-{noun}.ts           # Query hook
│       │   ├── use-{verb}-{noun}.ts    # Mutation hook
│       │   ├── use-{noun}-{noun}.ts    # Computation hook
│       │   └── use-{noun}-workflow.ts  # Orchestration hook
│       ├── components/             # Presentation layer
│       │   └── {ComponentName}/
│       │       ├── {ComponentName}.tsx
│       │       └── {ComponentName}.test.tsx
│       └── containers/             # Wiring layer
│           ├── {Feature}Container.tsx
│           └── {Feature}Container.test.tsx
│
├── shared/                         # Cross-feature shared code
│   ├── atoms/                      # Shared atomic components ({Name}/{Name}.tsx + test)
│   ├── molecules/                  # Shared molecular components
│   ├── hooks/                      # Shared utility hooks
│   ├── utils/                      # Pure utilities (cn.ts, invariant.ts)
│   ├── types/                      # Shared type definitions (api.ts, common.ts)
│   └── lib/                        # Third-party wrappers (query-client.ts)
│
└── infrastructure/                 # External system adapters
    ├── api/                        # API client functions
    │   ├── client.ts               # Base fetch wrapper
    │   └── endpoints/              # Per-resource API functions
    │       ├── orders.ts
    │       └── users.ts
    └── storage/                    # Local/session storage adapters
```

### Dependency Direction Law

Arrows indicate allowed import direction. All unlisted directions are forbidden.

```
app/routes       →  features/*/containers, shared/*, app/providers, app/layout
app/layout       →  app/providers, shared/*
features/containers  →  features/hooks, features/components
features/hooks       →  features/domain, features/types, shared/hooks, infrastructure/api, TanStack Query
features/components  →  features/types (for prop types only), shared/atoms, shared/molecules
features/domain      →  features/types, shared/utils
shared/molecules     →  shared/atoms
shared/atoms         →  shared/utils, shared/types
infrastructure       →  shared/types

FORBIDDEN:
features/domain      →  react (ANY import)
features/components  →  features/hooks
features/components  →  infrastructure/*
shared/atoms         →  features/*
features/*           →  other-feature/components/*  (no cross-feature internals)
```

**These rules are enforced by `eslint-plugin-boundaries` in `eslint.config.js`, not by convention.** See the actual configuration in the repository for the full rule set using ESLint flat config and `boundaries/dependencies`.

---

## The Atomic Hierarchy

### Atoms

The irreducible units of UI. A button, input, label, badge, icon, spinner.

**Contract**:
- Zero internal state (except `useId`, `useRef`, or UI-local state like focus)
- Zero side effects
- Zero domain knowledge
- Fully controlled via props
- Maximum 5 props
- Maximum 40 lines

**Forbidden imports**: `useState` (for domain state), `useEffect`, `useContext`, `useQuery`, `useMutation`, any feature module, any API client.

**Canonical shape**: `forwardRef` component extending `ComponentPropsWithRef<'element'>`, variant/size props with defaults, `cn()` for class merging, `as const` variant maps. Every visual atom accepts `className`. Every interactive atom uses `forwardRef`. These are not optional.

### Molecules

Compositions of atoms forming a cohesive unit (form field, search bar, card header). Composed exclusively from atoms and HTML primitives. `useState` allowed only for UI-local state (open/closed, hover, focus). No domain logic, no data fetching, no external effects. Props describe what to display, never how to get it. Uses `children` for slots. Maximum 7 props, 60 lines.

### Organisms

Feature-level presentational components (nav bar, comment thread, data table, order summary). Composed from molecules and atoms. Receives ALL data and callbacks via props — uses a typed data object to flatten (e.g., `data: OrderSummaryData`). May own UI state (sort, expand, active tab). Never fetches data, never calls APIs, never imports from `hooks/` or `infrastructure/`. Maximum 7 props, 100 lines.

### Containers

The wiring layer between domain and presentation. This is where data meets UI.

**Contract**:
- Calls exactly ONE orchestration hook
- Renders exactly ONE primary organism
- Handles three states: loading, error, success
- Contains zero business logic — no calculations, no transformations, no conditionals beyond the three-state switch
- Maximum 50 lines

**Canonical form**:

```tsx
import { OrderSummary } from '../components/OrderSummary/OrderSummary';
import { OrderSummarySkeleton } from '../components/OrderSummary/OrderSummarySkeleton';
import { FeatureError } from '@/shared/molecules/FeatureError';
import { useOrderWorkflow } from '../hooks/use-order-workflow';

interface OrderSummaryContainerProps {
  orderId: string;
}

export function OrderSummaryContainer({ orderId }: OrderSummaryContainerProps) {
  const { data, isLoading, error, removeItem } = useOrderWorkflow(orderId);

  if (isLoading) return <OrderSummarySkeleton />;
  if (error) return <FeatureError error={error} />;
  if (!data) return null;

  return <OrderSummary data={data} onRemoveItem={removeItem} />;
}
```

Every organism has a corresponding `{ComponentName}Skeleton.tsx` (colocated, designed alongside the organism). Error components receive the error object + optional retry callback, contextual to the feature. **If a container exceeds 40 lines**: the orchestration hook is insufficiently abstracted, or two features are being wired in one container. Split.

### Pages

Route-level components. The component that corresponds to a URL.

**Contract**:
- Defined by TanStack Router file-based routing
- Compose containers and layout components
- Own Suspense boundary placement
- Own route-level data loading via TanStack Router loaders
- Define document title and meta concerns

---

## The Domain Layer

The `domain/` folder within each feature is the hexagonal core. It contains pure TypeScript functions with zero framework dependencies.

### Rules

1. No file in `domain/` may import from `react`, `@tanstack/*`, or any UI library.
2. Every function is pure: same inputs produce same outputs, no side effects.
3. Every function has a corresponding test file using plain `expect()` assertions.
4. Domain functions are the implementation of type signatures defined in `types.ts`.

### Domain Function Taxonomy

| Type | Purpose | Example file |
|------|---------|-------------|
| **Calculation** | Transform data into derived data | `calculate-total.ts` |
| **Validation** | Check business constraints, return `ValidationResult` | `validate-order.ts` |
| **Transformation** | Reshape data between forms (e.g., API → domain) | `transform-api-order.ts` |
| **Predicate** | Boolean question about state | `can-submit-order.ts` |

```tsx
// domain/calculate-total.ts — canonical example (all types follow this shape)
import type { LineItem, OrderTotal } from '../types';

export function calculateTotal(items: LineItem[]): OrderTotal {
  const subtotal = items
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = subtotal * 0.087;
  const shipping = subtotal > 100 ? 0 : 12.99;
  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}
```

### Domain Testing

Domain tests use Vitest with plain `expect()` assertions. No React, no rendering, no mocking (unless the function depends on a port). Tests are written **before** implementation — the type signature from `types.ts` specifies the contract; tests specify behavior.

---

## The Hook Layer

Hooks are the React integration layer. They bridge domain logic and external systems to the component tree.

### Hook Taxonomy

| Type | File pattern | Purpose | Allowed dependencies |
|------|-------------|---------|---------------------|
| Query | `use-{noun}.ts` | Read external data | TanStack Query, API client |
| Mutation | `use-{verb}-{noun}.ts` | Write to external systems | TanStack Query, API client |
| Computation | `use-{noun}-{computed}.ts` | Wrap pure domain function in `useMemo` | Domain functions only |
| Orchestration | `use-{noun}-workflow.ts` | Combine hooks into unified state for container | Other hooks in same feature |

### Key Patterns

**Query hooks** use TanStack Query's `select` to delegate transformation to domain functions — the hook doesn't contain the logic, it delegates. **Mutation hooks** call the API client and invalidate relevant queries on success. **Computation hooks** are one-line `useMemo` calls wrapping pure domain functions — the hook is a membrane, not a brain.

### Orchestration Hook (the container's entire interface)

```tsx
// hooks/use-order-workflow.ts
import { useOrder } from './use-order';
import { useRemoveItem } from './use-remove-item';
import { canSubmitOrder } from '../domain/can-submit-order';
import type { OrderWorkflowState } from '../types';

export function useOrderWorkflow(orderId: string): OrderWorkflowState {
  const order = useOrder(orderId);
  const removeItem = useRemoveItem(orderId);

  return {
    data: order.data ?? null,
    isLoading: order.isLoading,
    error: order.error ?? null,
    canSubmit: order.data ? canSubmitOrder(order.data) : false,
    removeItem: removeItem.mutate,
    isRemoving: removeItem.isPending,
  };
}
```

**This hook is the container's entire interface.** The container calls this hook and destructures the result into its organism. Nothing else.

---

## The Type System as Specification

For each feature, `types.ts` is written **before any implementation** and serves as the contract every other file fulfills.

A feature's `types.ts` defines: domain entities (`LineItem`), computed aggregates (`OrderTotal`), organism data shapes (`OrderSummaryData`), API response shapes (`ApiOrder`), orchestration hook return types (`OrderWorkflowState`), and validation results (`ValidationResult`).

**Every file in the feature implements something defined here.** Domain functions transform between these types. Hooks produce them. Components receive them as props. The types are the architecture's spine.

---

## Effects — You Probably Don't Need One

Effects are the most overused primitive in React. Most effects are symptoms of misplaced logic. Before writing `useEffect`, exhaust every alternative. The right answer is almost always not an effect.

### The Decision Tree

| "I need to..." | Use instead of `useEffect` |
|----------------|---------------------------|
| Derive a value from props/state | `const` or `useMemo` — derivation is not a side effect |
| Respond to a user event | Event handler (`onClick`, etc.) — effects watching state to trigger actions are disguised handlers |
| Read from localStorage/URL/external source | `useSyncExternalStore` or lazy initializer `useState(() => read())` — synchronous reads, not effects |
| Subscribe to external system (WebSocket, IntersectionObserver, media query) | Legitimate effect — **but wrap in a custom hook**. Components never contain raw `useEffect` for subscriptions |
| Keep DOM in sync with React state | Let the store own DOM sync via `useSyncExternalStore`. If truly React-owned, custom hook only |
| Fetch data | TanStack Query — handles caching, dedup, background refetch, races. Never `useEffect` + `fetch` |
| Initialize on mount | Lazy initializer, module-level init, or ref. `useEffect([])` runs *after* first paint → flash |

### The Canonical External Store Pattern

When state lives outside React (localStorage, URL params, media queries, third-party libraries), use `useSyncExternalStore`. The store exposes `subscribe`, `getSnapshot`, and `getServerSnapshot`; React reads it synchronously during render. The store owns its own DOM side effects (e.g., toggling classes on `documentElement`). Module-level initialization runs before React renders — no flash of wrong state, no wasted render cycle, and cross-tab sync comes free via `storage` events.

### The Only Legitimate Effects

After exhausting the alternatives above, two remain: **Subscriptions** ("while mounted, maintain this connection" — e.g., IntersectionObserver, WebSocket — always in a custom hook) and **analytics/logging** (fire-and-forget, no state update).

**Constraint**: Maximum one effect per component at atom/molecule/organism level. Containers may have up to two. Effect interaction complexity is O(n²) — the bug surface grows faster than the feature surface.

---

## State — It Has Exactly One Correct Home

State placement is the most consequential decision in a React codebase. Misplaced state causes cascading problems: unnecessary re-renders, prop drilling that shouldn't exist, contexts that grow into god objects, duplicated sources of truth. Before writing `useState`, determine where the state belongs.

### The Decision Tree

| "This state is..." | Place it in | Mechanism |
|---------------------|-------------|-----------|
| UI-only, single component (open/closed, hover, focus) | The component | `useState` |
| UI-only, shared between siblings | Nearest common parent | Lifted `useState`, passed as props |
| Remote/server data | TanStack Query cache | `useQuery` — never duplicate in local state |
| Derived from other state or props | Not state at all | `const` or `useMemo` — derivation, not duplication |
| Needed across component tree (>2 levels deep) | Feature-level context | `createContext` + provider in container |
| Cross-feature or app-wide | `app/providers/` | One provider per concern, never a god context |
| Persistent across sessions (theme, preferences) | External store | `useSyncExternalStore` + localStorage/etc. |
| Shareable via URL (filters, pagination, selected tab) | URL search params | TanStack Router `searchParams` — the URL is the state |
| Outlives React entirely (audio, WebSocket) | Module-level external store | `useSyncExternalStore` — React subscribes, store owns |

### The Cardinal Rules

**Never copy server state into local state.** `const [data, setData] = useState(null)` followed by an effect that calls `setData(response)` is the most common state anti-pattern. TanStack Query owns server state. Read from the cache; don't mirror it.

**Never derive state into state.** If `fullName` can be computed from `firstName` and `lastName`, it is not state — it is a `const`. Using `useState` + `useEffect` for derivation creates a render where the derived value is stale.

---

## Testing Architecture

Each layer has exactly one testing strategy, determined by the layer.

| Layer | Strategy | Tools | What You Verify |
|-------|----------|-------|-----------------|
| Domain functions | Unit | Vitest | `expect(fn(input)).toBe(output)` — pure logic |
| Computation hooks | Unit | Vitest | Same as domain — these are thin wrappers |
| Query/mutation hooks | Integration | Vitest + MSW | Data lifecycle: loading → success/error |
| Atoms | Snapshot + a11y | Vitest + Testing Library | Correct render, keyboard nav, ARIA |
| Molecules | Component | Vitest + Testing Library | Composition works, callbacks fire |
| Organisms | Component | Vitest + Testing Library | Data displays correctly, interactions propagate |
| Containers | Integration | Vitest + Testing Library + MSW | Full flow: loading → error → success |
| Pages | E2E | Playwright | User flows work end-to-end |

**Target distribution**: ~50% domain/hook unit tests, ~30% component tests, ~20% integration/E2E. Domain tests are written *before* implementation. Component tests verify *behavior* (what the user sees and does), not implementation (internal state, hook calls).

---

## The Infrastructure Layer

API clients and external service adapters live in `infrastructure/`, isolated from both domain and presentation.

The `client.ts` base provides a typed `apiFetch<T>(path, init?)` wrapper that sets headers and throws a typed `ApiError(status, body)` on non-OK responses. Endpoint files (e.g., `orders.ts`) are thin functions that call `apiFetch` with the right URL and return typed data. **They do not transform, validate, or process.** Transformation happens in domain functions, invoked via TanStack Query's `select`.

---

## Naming Covenant

Domain functions: `verb-noun.ts`. Hook file patterns: see Hook Taxonomy above. Types: `types.ts`. Barrel: `index.ts` (re-exports only).

| Component level | File pattern | Name convention | Example |
|----------------|-------------|----------------|---------|
| Atom | `PascalCase/PascalCase.tsx` | Bare noun | `Button`, `Input` |
| Molecule | `PascalCase/PascalCase.tsx` | Compound noun | `FormField`, `SearchInput` |
| Organism | `PascalCase/PascalCase.tsx` | Feature-level noun | `OrderSummary` |
| Container | `{Feature}Container.tsx` | `{Organism}Container` | `OrderSummaryContainer` |
| Page | — | `{Route}Page` | `CheckoutPage` |
| Layout | — | `{Scope}Layout` | `AppLayout` |
| Skeleton | `{Component}Skeleton.tsx` | `{Component}Skeleton` | `OrderSummarySkeleton` |

---

## Styling, Forms, and Composition

**Styling**: Every component uses `cn()` (`clsx` + `twMerge`, defined in `shared/utils/cn.ts`) as the only way to combine Tailwind classes. Radix provides behavior (focus, keyboard, ARIA); Tailwind provides style via `cn()` on Radix's unstyled primitives. No CSS-in-JS or runtime style objects — use `as const` variant maps.

**Forms**: Zod schema is the single source of truth. Define in `types.ts`, derive type via `z.infer<typeof schema>`, pass `zodResolver(schema)` to `useForm`. Form components remain presentational (`onSubmit` + `isSubmitting` as props). Container provides the mutation; Zod provides validation.

**Composition**: Compound components for shared implicit state (dot-notation API). Render props for flexible rendering without prop explosion. Slot pattern for layout sections as named props. Principle: **composition over configuration**.

---

## Evolution Protocol

| Trigger | Action |
|---------|--------|
| Component exceeds 80 lines | Extract sub-components into same folder, private to feature until needed elsewhere |
| Import would cross feature boundary | Promote component to `shared/`. Generalize props. Never cross-feature internal imports |
| `components/` exceeds 7 items | Introduce sub-features: `features/` subfolder with identical canonical structure. The fractal holds |
| Need cross-feature state | Provider in `app/providers/`, one per concern. Only mechanism for cross-feature state. No global stores |
| Domain function serves multiple features | Move to `shared/utils/` or `shared/domain/`. Remains pure. Mechanical move |

---

## Feature Generation Sequence

When building a new feature, follow this order. Each layer depends only on layers already completed.

1. **`types.ts`** — Define all domain types, API shapes, prop interfaces, and hook return types.
2. **`domain/*.ts` + `domain/*.test.ts`** — Write pure functions and their tests. Tests first.
3. **`hooks/use-*.ts`** — Wire domain logic to data sources via TanStack Query.
4. **`components/*/`** — Build from atoms up. Each component receives typed props from `types.ts`.
5. **`containers/`** — Call the orchestration hook. Pass data to the organism. Handle loading/error/success.
6. **Wire into route** — Import the container into the page component in `app/routes/`.

This sequence is not a suggestion. It is the dependency-respecting order that ensures each layer can be built and tested against already-existing contracts.

---

## Anti-Patterns

### Effect Anti-Patterns (Most Common)

| Anti-pattern | Example smell | Correct alternative |
|-------------|--------------|-------------------|
| Effect as event handler | `if (submitted) save()` in effect | Put logic in `onClick` |
| Effect for derived state | `setFullName(first + last)` in effect | `const` or `useMemo` |
| Effect for data fetching | `fetch(url).then(setData)` in effect | TanStack Query |
| Effect for external reads | `setTheme(localStorage.get(...))` in effect | `useSyncExternalStore` or lazy initializer |
| Effect for store-owned DOM sync | Echoing external state back to DOM | Store owns its own side effects |
| Effect with `[]` for init | Runs after first paint → flash | Lazy initializer or module-level init |

### Structural Anti-Patterns

| Anti-pattern | Symptom | Fix |
|-------------|---------|-----|
| God components | 400 lines, 12 props, 4 effects, inline API calls | Split — there are always seams |
| Smart atoms | Atom reads context, fetches data, or has business logic | Atom receives a boolean; container decides its value |
| Premature abstraction | `GenericDataTable<T>` before the second table exists | Write concrete; extract shared surface when it reveals itself |
| Prop drilling past 2 levels | Intermediates carry data they don't use | Context or restructure |
| Domain logic in components | `calculateTotal` in JSX | Domain function → computation hook → orchestration hook → prop |
| Style-prop creep | `headerClassName`, `bodyClassName`, `footerClassName` | Composition, slots, or `children` |

---

## Accessibility Requirements

Accessibility is not a feature. It is a constraint, like type safety.

- All interactive elements are keyboard-navigable
- All images have `alt` text (empty string for decorative images)
- All form fields have associated labels (via `htmlFor` or `aria-labelledby`)
- All dynamic content changes are announced to screen readers (`aria-live`)
- Focus management is explicit after modal open/close and route transitions
- Color contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for large text)
- Radix primitives handle most of this by default — do not override their ARIA attributes unless you have a specific reason

---

## Summary of Enforcement Mechanisms

| Constraint | Enforced By |
|-----------|-------------|
| Dependency direction + import restrictions | `eslint-plugin-boundaries` |
| No `any` | `tsconfig.json` strict mode |
| Type coverage | TypeScript `strict: true`, `noUncheckedIndexedAccess: true` |
| Component size limits | ESLint `max-lines-per-function` |
| No unused variables/imports | ESLint + TypeScript |
| Consistent naming | ESLint naming-convention rules |
| Formatting | Prettier (on save and in CI) |
| Test coverage threshold | Vitest `coverage.thresholds` |
| Accessibility | `eslint-plugin-jsx-a11y` + Playwright axe checks |
| No `console.log` in production | ESLint `no-console` |
| Bundle size | Vite build analysis in CI |

**If it is not machine-enforced, it will eventually be violated.** Every rule in this document that matters has a corresponding lint rule, type constraint, or CI gate. Convention without enforcement is decoration.

---

*This specification encodes the shape where the right decision is the only decision that fits. The structure is deterministic. The patterns are fractal. The types are the spec. The linter is the architect. Build accordingly.*
