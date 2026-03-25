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

**Contract**: Zero internal state (except `useId`, `useRef`, or UI-local focus). Zero side effects. Zero domain knowledge. Fully controlled via props. Max 5 props, 40 lines.

**Forbidden imports**: `useState` (for domain state), `useEffect`, `useContext`, `useQuery`, `useMutation`, any feature module, any API client.

Every visual atom accepts `className` for compositional styling. Every interactive atom uses `forwardRef`. Use `cn()` for class merging. Use `as const` class map objects for variants — never CSS-in-JS or runtime style objects.

### Molecules

Compositions of atoms forming a cohesive unit. A form field (label + input + error). A search bar (input + button).

**Contract**: Composed exclusively from atoms and HTML primitives. `useState` allowed only for UI-local state (open/closed, hover). No domain logic, no data fetching, no effects. Max 7 props, 60 lines.

### Organisms

Feature-level presentational components. A navigation bar. A data table. An order summary.

**Contract**: Composed from molecules and atoms. Receives ALL data and callbacks via props. May own UI state (sort order, expanded sections). Never fetches data. Never calls APIs. Never imports from `hooks/` or `infrastructure/`. Max 7 props (use a typed data object to flatten), 100 lines.

### Containers

The wiring layer between domain and presentation.

**Contract**: Calls exactly ONE orchestration hook. Renders exactly ONE primary organism. Handles three states: loading, error, success. Zero business logic. Max 50 lines.

```tsx
export function OrderSummaryContainer({ orderId }: { orderId: string }) {
  const { data, isLoading, error, removeItem } = useOrderWorkflow(orderId);

  if (isLoading) return <OrderSummarySkeleton />;
  if (error) return <FeatureError error={error} />;
  if (!data) return null;

  return <OrderSummary data={data} onRemoveItem={removeItem} />;
}
```

If a container exceeds 40 lines: the orchestration hook is insufficiently abstracted, or two features are being wired in one container. Split.

### Pages

Route-level components defined by TanStack Router file-based routing. Compose containers and layout components. Own Suspense boundary placement and route-level data loading via loaders.

---

## The Domain Layer

The `domain/` folder within each feature is the hexagonal core. It contains pure TypeScript functions with zero framework dependencies.

### Rules

1. No file in `domain/` may import from `react`, `@tanstack/*`, or any UI library.
2. Every function is pure: same inputs produce same outputs, no side effects.
3. Every function has a corresponding test file using plain `expect()` assertions.
4. Domain functions are the implementation of type signatures defined in `types.ts`.

### Domain Function Taxonomy

| Kind | Purpose | Example |
|------|---------|---------|
| **Calculation** | Transform data into derived data | `calculateTotal(items): OrderTotal` |
| **Validation** | Check business constraints | `validateOrder(data): ValidationResult` |
| **Transformation** | Reshape between types | `transformApiOrder(raw): OrderSummaryData` |
| **Predicate** | Boolean question about state | `canSubmitOrder(data): boolean` |

### Domain Testing

Domain tests use Vitest with plain assertions. No React. No rendering. No mocking (unless the function depends on a port). Write tests *before* the implementation — the type signature specifies inputs/outputs, the tests specify behavior.

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

**Query hooks** use TanStack Query's `select` to delegate transformation to domain functions: `select: transformApiOrder`. The hook doesn't contain the transformation — it delegates.

**Computation hooks** are a one-line `useMemo` wrapping a pure function: `useMemo(() => calculateTotal(items), [items])`. The hook is a membrane, not a brain.

**Orchestration hooks** are the container's entire interface. They compose query, mutation, and computation hooks into a single return object typed by `types.ts`. The container calls this hook, destructures the result, and renders. Nothing else.

---

## The Type System as Specification

For each feature, `types.ts` is written **before any implementation** and contains: domain entities, computed aggregates, API response shapes, component prop interfaces, orchestration hook return types, and validation results. Every other file in the feature implements something defined here. Domain functions transform between these types. Hooks produce them. Components receive them as props. The types are the architecture's spine.

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

When state lives outside React (localStorage, URL params, media queries), use `useSyncExternalStore`. The store module owns reads, writes, DOM sync, and subscriber notification. The React component calls `useSyncExternalStore(store.subscribe, store.getSnapshot)` — zero effects.

See `src/app/providers/theme-store.ts` and `ThemeProvider.tsx` for the canonical implementation. Key properties: no flash of wrong state (store initializes before React renders), no wasted render cycle, cross-tab sync via `storage` events, testable as a plain module without React.

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

API clients and external service adapters live in `infrastructure/`, isolated from both domain and presentation. `infrastructure/api/client.ts` provides a thin typed `apiFetch<T>()` wrapper around `fetch`. Per-resource endpoint files in `infrastructure/api/endpoints/` call it with the right URL and return typed data. They do not transform, validate, or process — transformation happens in domain functions, invoked via TanStack Query's `select`.

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

Sub-feature fractal structure:

```
features/checkout/
├── types.ts
├── features/
│   ├── payment-method/
│   │   ├── types.ts
│   │   ├── domain/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── containers/
│   └── shipping-address/
│       ├── types.ts
│       ├── domain/
│       ├── hooks/
│       ├── components/
│       └── containers/
├── hooks/
│   └── use-checkout-workflow.ts
└── containers/
    └── CheckoutContainer.tsx
```

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
