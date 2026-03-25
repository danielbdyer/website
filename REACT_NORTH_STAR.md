# The React North Star

## Architectural Specification for Component-Based Frontend Systems

---

## Governing Axioms

These are non-negotiable. Every directive in this document derives from them.

### 1. Components Are Cognitive Artifacts

A component's primary consumer is a human being with approximately seven slots of working memory. Boundaries must respect this constraint. A component that cannot be explained in 60 seconds is a component that has failed, regardless of whether it functions correctly.

### 2. Structure Determines Correctness

Every architectural decision in the codebase must be determinable from context without requiring taste, intuition, or experience. If the question "where does this go?" has more than one valid answer, the architecture is incomplete. The right decision must be the only decision that fits.

### 3. Interfaces Are Promises

Every prop is a commitment to every present and future consumer. Wide interfaces shift cognitive burden from author to caller, permanently. Narrow interfaces are generous — they say "I've done the thinking so you don't have to."

### 4. The Domain Doesn't Know About React

Business rules — validation, calculation, transformation, policy — must be expressible as pure TypeScript functions with zero framework imports. React is a delivery mechanism. The domain is the system. The delivery mechanism changes; the domain persists.

### 5. Complexity Must Be Earned

The default state of a component is simple. Complexity is added only when reality demands it, and when added, it is isolated — pushed into hooks, extracted into utilities, quarantined in containers — so that the presentation layer remains a declarative description of what the user sees.

### 6. Thresholds Are Phase Transitions

The numeric limits in this specification are not style preferences. They are derived from cognitive science (Miller's Law), combinatorial testing theory (state explosion), and empirical observation of where code maintainability undergoes qualitative degradation. Argue with the derivation, not the number.

### 7. Files Are Cheap, Cognitive Load Is Expensive

Prefer many small files over few large files. The cost of navigating many small files is linear. The cost of understanding one large file is exponential. A 40-line file that does exactly one thing is always superior to a 200-line file that does five related things.

### 8. Patterns Must Be Fractal

The same structural pattern repeats at every scale. A feature folder looks like a miniature application. A component folder looks like a miniature feature. Understanding the pattern at one level confers understanding at every level.

### 9. The Folder Structure Is the Architecture

The directory tree is not an organizational convenience — it is the primary architectural document. Every structural decision is encoded in the tree. Correct code should be generable from the folder structure alone, without reading a single line of existing implementation.

### 10. Types Are the Specification

TypeScript types are not annotations on implementation — they are contracts that precede and constrain implementation. Types are written first. Implementation satisfies them. The type system is the first line of architectural enforcement.

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
│   │   ├── __root.tsx              # Root layout
│   │   ├── index.tsx               # Home page
│   │   └── checkout.tsx            # Route page
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
│   ├── atoms/                      # Shared atomic components
│   │   └── {ComponentName}/
│   │       ├── {ComponentName}.tsx
│   │       └── {ComponentName}.test.tsx
│   ├── molecules/                  # Shared molecular components
│   ├── hooks/                      # Shared utility hooks
│   ├── utils/                      # Pure utility functions
│   │   ├── cn.ts                   # className merge: clsx + tailwind-merge
│   │   └── invariant.ts           # Runtime assertion helper
│   ├── types/                      # Shared type definitions
│   │   ├── api.ts
│   │   └── common.ts
│   └── lib/                        # Third-party library wrappers
│       └── query-client.ts         # TanStack Query client config
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
app/routes       →  features/*/containers, shared/*, app/providers
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

Compositions of atoms forming a cohesive unit. A form field (label + input + error). A search bar (input + button). A card header (avatar + name + timestamp).

**Contract**:
- Composed exclusively from atoms and HTML primitives
- `useState` allowed only for UI-local state (open/closed, hover, internal focus management)
- No domain logic, no data fetching, no effects that reach outside the component
- Props describe what to display, never how to get it
- Maximum 7 props
- Maximum 60 lines

**Canonical shape**: Composes atoms (e.g., `Label` + `Input` + `ErrorText`). Props describe what to display. Uses `children` for the input slot so the molecule stays generic.

### Organisms

Feature-level presentational components. A navigation bar. A comment thread. A data table with sorting. An order summary.

**Contract**:
- Composed from molecules and atoms
- Receives ALL data and callbacks via props
- May own UI state (sort order, expanded sections, active tab)
- Never fetches data. Never calls APIs. Never imports from `hooks/` or `infrastructure/`
- Maximum 7 props (use a typed data object to flatten)
- Maximum 100 lines

**Canonical shape**: Receives a typed data object + callbacks via props. Composes molecules and atoms. May own UI state (sort, expand, active tab). Uses a single data prop to flatten interface (e.g., `data: OrderSummaryData`) plus event callbacks.

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

**If a container exceeds 40 lines, one of two things is true**: the orchestration hook is insufficiently abstracted, or two features are being wired in one container. Both must be resolved by splitting.

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

Domain tests use Vitest with plain assertions. No React. No rendering. No mocking (unless the function depends on a port). Tests are written **before** implementation — the type signature from `types.ts` specifies the contract.

```tsx
describe('calculateTotal', () => {
  it('sums active items only', () => {
    const result = calculateTotal([
      { id: '1', name: 'A', quantity: 2, unitPrice: 10, status: 'active' },
      { id: '2', name: 'B', quantity: 1, unitPrice: 5, status: 'removed' },
    ]);
    expect(result.subtotal).toBe(20);
  });
});
```

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

**"I need to derive a value from props or state."**
→ Use a `const` or `useMemo`. Derivation is not a side effect. `const fullName = first + ' ' + last` does not need an effect. Neither does `useMemo(() => expensiveCompute(items), [items])`.

**"I need to respond to a user event."**
→ Use an event handler. If the user clicked a button, handle it in `onClick`. Effects that watch state to trigger actions (`useEffect(() => { if (submitted) doThing() }, [submitted])`) are disguised event handlers. Put the logic where the event happens.

**"I need to read from localStorage, the URL, or another external source."**
→ Use `useSyncExternalStore` or a lazy state initializer (`useState(() => readFromStorage())`). These are synchronous reads, not effects.

**"I need to subscribe to an external system (WebSocket, IntersectionObserver, media query, cross-tab storage events)."**
→ This is a legitimate effect — **but wrap it in a custom hook** that names the concern. The component never contains a raw `useEffect` for subscriptions.

**"I need to keep the DOM in sync with React state."**
→ First ask: can the store own the DOM sync? (See `useSyncExternalStore` pattern below.) If the sync truly belongs in React, this is one of the few valid effects — but it should live in a custom hook, not inline in a component.

**"I need to fetch data."**
→ Use TanStack Query. Never `useEffect` + `fetch`. TanStack Query handles caching, deduplication, background refetching, error/loading states, and race conditions. A hand-rolled fetch effect handles none of these correctly.

**"I need to initialize something on mount."**
→ Use a lazy initializer (`useState(() => init())`), a module-level initialization, or a ref. `useEffect` with `[]` runs *after* the first paint, which means a flash of uninitialized state.

### The Canonical External Store Pattern

When state lives outside React (localStorage, URL params, media queries, third-party libraries), use `useSyncExternalStore`. The store exposes `subscribe`, `getSnapshot`, and `getServerSnapshot`; React reads it synchronously during render. The store owns its own DOM side effects (e.g., toggling classes on `documentElement`). Module-level initialization runs before React renders — no flash of wrong state, no wasted render cycle, and cross-tab sync comes free via `storage` events.

### The Only Legitimate Effects

After exhausting the alternatives above, these remain:

**Subscription**: "While mounted, maintain this connection." Always wrapped in a custom hook.
```tsx
// shared/hooks/use-reveal.ts — IntersectionObserver is a browser subscription
useEffect(() => {
  const observer = new IntersectionObserver(callback, { threshold });
  observer.observe(el);
  return () => observer.disconnect();
}, [threshold]);
```

**Analytics / logging**: "When X happens, record it." Fire-and-forget, no state update.
```tsx
useEffect(() => { analytics.track('page_viewed', { page }); }, [page]);
```

**The constraint**: Maximum one effect per component at the atom/molecule/organism level. Containers may have up to two. If a component accumulates effects, extract a custom hook that names and encapsulates the temporal concern.

**The underlying math**: Effect interaction complexity is O(n²). Two effects have one interaction pair. Three have three. Four have six. The bug surface grows faster than the feature surface.

---

## Error and Loading States

Every container handles exactly three states. No exceptions. No "we'll add error handling later."

1. **Loading** → Render a purpose-built skeleton component
2. **Error** → Render a contextual error component with retry capability
3. **Success** → Render the organism with data

**Every organism has a corresponding skeleton.** The skeleton matches the organism's layout and provides visual continuity during loading. It is designed alongside the organism, not after.

**Skeleton naming convention**: `{ComponentName}Skeleton.tsx`, colocated with its organism.

**Error component**: Receives the error object and an optional retry callback. It is contextual to the feature, not a generic "something went wrong."

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

**Target distribution**: ~50% domain/hook unit tests, ~30% component tests, ~20% integration/E2E. Heaviest at the bottom where tests are fastest and cheapest.

**Domain test generation protocol**: For every domain function, write tests *before* writing the implementation. The function signature from `types.ts` specifies inputs and outputs; the tests specify behavior. Implementation satisfies both.

**Component test protocol**: Build the component, then write tests that verify its contract. Components are tested for *behavior* (what the user sees and does), not *implementation* (internal state, hook calls).

---

## The Infrastructure Layer

API clients and external service adapters live in `infrastructure/`, isolated from both domain and presentation.

The `client.ts` base provides a typed `apiFetch<T>(path, init?)` wrapper that sets headers and throws a typed `ApiError(status, body)` on non-OK responses. Endpoint files (e.g., `orders.ts`) are thin functions that call `apiFetch` with the right URL and return typed data. **They do not transform, validate, or process.** Transformation happens in domain functions, invoked via TanStack Query's `select`.

---

## Naming Covenant

### Files

| Layer | Pattern | Example |
|-------|---------|---------|
| Domain function | `verb-noun.ts` | `calculate-total.ts` |
| Query hook | `use-{noun}.ts` | `use-order.ts` |
| Mutation hook | `use-{verb}-{noun}.ts` | `use-submit-order.ts` |
| Computation hook | `use-{noun}-{computed}.ts` | `use-order-total.ts` |
| Orchestration hook | `use-{noun}-workflow.ts` | `use-order-workflow.ts` |
| Component | `PascalCase/PascalCase.tsx` | `OrderSummary/OrderSummary.tsx` |
| Skeleton | `PascalCase/PascalCaseSkeleton.tsx` | `OrderSummary/OrderSummarySkeleton.tsx` |
| Container | `{Feature}Container.tsx` | `OrderSummaryContainer.tsx` |
| Types | `types.ts` | `types.ts` |
| Barrel | `index.ts` | `index.ts` |

### Components

| Level | Convention | Example |
|-------|-----------|---------|
| Atom | Bare noun | `Button`, `Badge`, `Input` |
| Molecule | Compound noun | `FormField`, `SearchInput` |
| Organism | Feature-level noun | `OrderSummary`, `CommentThread` |
| Container | `{Organism}Container` | `OrderSummaryContainer` |
| Page | `{Route}Page` | `CheckoutPage` |
| Layout | `{Scope}Layout` | `AppLayout`, `AuthLayout` |
| Skeleton | `{Component}Skeleton` | `OrderSummarySkeleton` |

---

## Styling with Tailwind + Radix

### The `cn()` Utility

Every component uses `cn()` (`clsx` + `twMerge`) for class merging. Defined in `shared/utils/cn.ts`. This is the only way to combine Tailwind classes.

### Radix Integration Pattern

Radix provides behavior (focus management, keyboard nav, ARIA). Tailwind provides style. They compose via `cn()` on Radix's unstyled primitives (e.g., `Dialog.Overlay`, `Dialog.Content`). Never conflict.

### Variants via Class Maps

No CSS-in-JS, `styled-components`, or runtime style objects. Use `as const` objects mapping variant keys to Tailwind class strings (e.g., `const variants = { primary: '...', secondary: '...' } as const`).

---

## Forms with React Hook Form + Zod

The Zod schema is the single source of truth. Define the schema in `types.ts`, derive the TypeScript type via `z.infer<typeof schema>`, and pass `zodResolver(schema)` to `useForm`. The form component remains presentational — it receives `onSubmit` and `isSubmitting` as props. The container provides the mutation. The Zod schema provides the validation. The form just wires them together.

---

## Evolution Protocol

### When a Component Gets Too Big

**Trigger**: Component exceeds 80 lines.
**Action**: Extract sub-components into the same component folder. They remain private to this feature until needed elsewhere.

### When Two Features Need the Same Component

**Trigger**: An import would cross a feature boundary.
**Action**: Promote the component to `shared/`. Generalize its props if necessary. Never create cross-feature internal imports.

### When a Feature Gets Too Many Components

**Trigger**: The `components/` folder exceeds 7 items.
**Action**: Introduce sub-features. A feature may contain a `features/` subfolder with the identical canonical structure (e.g., `checkout/features/payment-method/` has its own `types.ts`, `domain/`, `hooks/`, `components/`, `containers/`). The fractal holds.

### When You Need Global State

**Action**: Create a provider in `app/providers/`. One provider per concern. The provider pattern is the only mechanism for cross-feature state. No global stores. No imports from one feature's hooks into another feature's components.

### When a Domain Function Serves Multiple Features

**Action**: Move it to `shared/utils/` or create `shared/domain/`. The function remains pure. The move is mechanical.

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

**God components**: A 400-line component with 12 props, 4 effects, inline calculations, and API calls. Split it. There are always seams.

**Smart atoms**: An atom that reads context, fetches data, or contains business logic. The brain does not belong in the fingertip. The atom receives a boolean; the container decides its value.

**Premature abstraction**: Building `GenericDataTable<T>` before the second table exists. Write concrete components. Extract the shared surface only when it reveals itself. It is always smaller than expected.

**Prop drilling past two levels**: Use context or restructure. Intermediate components should not carry data they do not use.

**Domain logic in components**: A `calculateTotal` call inside an organism's JSX. This belongs in a domain function, called by a computation hook, returned by the orchestration hook, and passed to the organism as a number. The organism renders the number. That's all.

**Style-prop creep**: `headerClassName`, `bodyClassName`, `footerClassName`, `itemClassName`. This is not a component — it is a CSS proxy. Use composition, slots, or `children`.

---

## Composition Patterns

- **Compound components**: Shared implicit state via dot-notation API (e.g., `<Tabs.List>`, `<Tabs.Content>`)
- **Render prop / children-as-function**: Flexible rendering without prop explosion (e.g., `<DataList items={items}>{(item) => <Card />}</DataList>`)
- **Slot pattern**: Named sections as props (e.g., `<PageLayout header={...} sidebar={...} content={...} />`)

Principle: **composition over configuration.** The consumer assembles what they need.

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
| Dependency direction | `eslint-plugin-boundaries` |
| Import restrictions per layer | `eslint-plugin-boundaries` |
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
