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
| Language | TypeScript 5+ (strict mode) | Yes |
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

**TanStack Router**: File-based routing with full type safety. Route params, search params, and loaders are typed end-to-end. No `as` casts. No runtime surprises.

**TanStack Query**: Declarative server state with normalized caching, background refetching, optimistic updates, and Suspense integration. Eliminates hand-rolled data fetching hooks and the entire class of bugs they produce.

**Radix UI**: Unstyled, accessible primitives. They provide behavior (focus management, keyboard navigation, ARIA) without opinions about appearance. Tailwind provides the appearance. This separation is correct.

**React Hook Form + Zod**: Forms are validated by schemas, not by imperative logic. The Zod schema is the single source of truth for both client validation and type inference. `z.infer<typeof schema>` eliminates type drift between form data and domain types.

**eslint-plugin-boundaries**: Enforces dependency direction rules as lint errors, not conventions. If the linter allows an import, someone will eventually write it. The boundaries must be machine-enforced.

**MSW**: Intercepts network requests at the service worker level. Tests and development use the same mock layer. No test-specific API abstractions. No mocking `fetch` in unit tests.

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

**These rules are enforced by `eslint-plugin-boundaries` configuration, not by convention.**

```javascript
// .eslintrc.js — boundaries configuration
{
  plugins: ['boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'domain', pattern: 'features/*/domain/*' },
      { type: 'hooks', pattern: 'features/*/hooks/*' },
      { type: 'components', pattern: 'features/*/components/*' },
      { type: 'containers', pattern: 'features/*/containers/*' },
      { type: 'shared', pattern: 'shared/*' },
      { type: 'infrastructure', pattern: 'infrastructure/*' },
      { type: 'app', pattern: 'app/*' },
    ],
    'boundaries/ignore': ['**/*.test.*'],
  },
  rules: {
    'boundaries/element-types': [2, {
      default: 'disallow',
      rules: [
        { from: 'domain', allow: ['shared'] },
        { from: 'hooks', allow: ['domain', 'shared', 'infrastructure'] },
        { from: 'components', allow: ['shared'] },
        { from: 'containers', allow: ['hooks', 'components', 'shared'] },
        { from: 'app', allow: ['containers', 'shared'] },
      ]
    }],
    'boundaries/no-unknown': [2],
    'boundaries/no-private': [2],
  }
}
```

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

**Canonical form**:

```tsx
import { type ComponentPropsWithRef, forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = 'Button';

const buttonVariants = { /* Tailwind classes */ } as const;
const buttonSizes = { /* Tailwind classes */ } as const;
```

**Notes**: Every visual atom accepts `className` for compositional styling. Every interactive atom uses `forwardRef`. These are not optional.

### Molecules

Compositions of atoms forming a cohesive unit. A form field (label + input + error). A search bar (input + button). A card header (avatar + name + timestamp).

**Contract**:
- Composed exclusively from atoms and HTML primitives
- `useState` allowed only for UI-local state (open/closed, hover, internal focus management)
- No domain logic, no data fetching, no effects that reach outside the component
- Props describe what to display, never how to get it
- Maximum 7 props
- Maximum 60 lines

**Canonical form**:

```tsx
import { Input } from '@/shared/atoms/Input';
import { Label } from '@/shared/atoms/Label';
import { ErrorText } from '@/shared/atoms/ErrorText';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, name, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
```

### Organisms

Feature-level presentational components. A navigation bar. A comment thread. A data table with sorting. An order summary.

**Contract**:
- Composed from molecules and atoms
- Receives ALL data and callbacks via props
- May own UI state (sort order, expanded sections, active tab)
- Never fetches data. Never calls APIs. Never imports from `hooks/` or `infrastructure/`
- Maximum 7 props (use a typed data object to flatten)
- Maximum 100 lines

**Canonical form**:

```tsx
import type { OrderSummaryData } from '../types';
import { LineItem } from './LineItem/LineItem';
import { PriceDisplay } from '@/shared/atoms/PriceDisplay';

interface OrderSummaryProps {
  data: OrderSummaryData;
  onRemoveItem: (itemId: string) => void;
}

export function OrderSummary({ data, onRemoveItem }: OrderSummaryProps) {
  return (
    <section aria-label="Order summary">
      <h2 className="text-lg font-semibold mb-4">Your Order</h2>
      <ul className="divide-y">
        {data.items.map((item) => (
          <LineItem key={item.id} item={item} onRemove={onRemoveItem} />
        ))}
      </ul>
      <footer className="flex justify-between pt-4 border-t mt-4">
        <span className="font-medium">Total</span>
        <PriceDisplay amount={data.total} size="lg" />
      </footer>
    </section>
  );
}
```

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

**Calculations**: Transform data into derived data.
```tsx
// domain/calculate-total.ts
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

**Validations**: Determine whether data satisfies business constraints.
```tsx
// domain/validate-order.ts
import type { OrderSummaryData, ValidationResult } from '../types';

export function validateOrder(data: OrderSummaryData): ValidationResult {
  const errors = [];
  if (data.items.length === 0) errors.push({ field: 'items', code: 'EMPTY', message: 'Order must have at least one item' });
  if (data.total <= 0) errors.push({ field: 'total', code: 'INVALID', message: 'Total must be positive' });
  return { isValid: errors.length === 0, errors };
}
```

**Transformations**: Reshape data from one form to another.
```tsx
// domain/transform-api-order.ts
import type { ApiOrder, OrderSummaryData } from '../types';

export function transformApiOrder(raw: ApiOrder): OrderSummaryData {
  const items = raw.line_items.map((li) => ({
    id: li.id,
    name: li.product_name,
    quantity: li.qty,
    unitPrice: li.unit_price_cents / 100,
    status: li.cancelled ? 'removed' as const : 'active' as const,
  }));
  return { items, ...calculateTotal(items) };
}
```

**Predicates**: Boolean questions about state.
```tsx
// domain/can-submit-order.ts
export function canSubmitOrder(data: OrderSummaryData): boolean {
  return data.items.some((i) => i.status === 'active') && data.total > 0;
}
```

### Domain Testing

Domain tests use Vitest with plain assertions. No React. No rendering. No mocking (unless the function depends on a port, in which case mock the port).

```tsx
// domain/calculate-total.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotal } from './calculate-total';

describe('calculateTotal', () => {
  it('sums active items only', () => {
    const result = calculateTotal([
      { id: '1', name: 'A', quantity: 2, unitPrice: 10, status: 'active' },
      { id: '2', name: 'B', quantity: 1, unitPrice: 5, status: 'removed' },
    ]);
    expect(result.subtotal).toBe(20);
  });

  it('waives shipping above $100', () => {
    const result = calculateTotal([
      { id: '1', name: 'A', quantity: 1, unitPrice: 150, status: 'active' },
    ]);
    expect(result.shipping).toBe(0);
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

### Query Hook

```tsx
// hooks/use-order.ts
import { useQuery } from '@tanstack/react-query';
import { getOrder } from '@/infrastructure/api/endpoints/orders';
import { transformApiOrder } from '../domain/transform-api-order';

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
    select: transformApiOrder,
  });
}
```

**Note the `select` usage**: API response transformation happens in `select`, powered by a domain function. The hook doesn't contain the transformation — it delegates to the domain layer.

### Mutation Hook

```tsx
// hooks/use-remove-item.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeOrderItem } from '@/infrastructure/api/endpoints/orders';

export function useRemoveItem(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeOrderItem(orderId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', orderId] }),
  });
}
```

### Computation Hook

```tsx
// hooks/use-order-total.ts
import { useMemo } from 'react';
import { calculateTotal } from '../domain/calculate-total';
import type { LineItem } from '../types';

export function useOrderTotal(items: LineItem[]) {
  return useMemo(() => calculateTotal(items), [items]);
}
```

**The gold standard**: The hook is a one-line `useMemo` wrapping a pure function. All logic lives in the domain layer. The hook is a membrane, not a brain.

### Orchestration Hook

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

```tsx
// features/order-summary/types.ts

/** Domain entity */
export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  status: 'active' | 'removed';
}

/** Computed domain aggregate */
export interface OrderTotal {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

/** Shape the organism receives */
export interface OrderSummaryData extends OrderTotal {
  items: LineItem[];
}

/** API response shape (infrastructure layer) */
export interface ApiOrder {
  id: string;
  line_items: Array<{
    id: string;
    product_name: string;
    qty: number;
    unit_price_cents: number;
    cancelled: boolean;
  }>;
}

/** What the orchestration hook returns */
export interface OrderWorkflowState {
  data: OrderSummaryData | null;
  isLoading: boolean;
  error: Error | null;
  canSubmit: boolean;
  removeItem: (itemId: string) => void;
  isRemoving: boolean;
}

/** Validation result */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; code: string; message: string }>;
}
```

**Every file in the feature is an implementation of something defined here.** Domain functions implement transformations between these types. Hooks produce these types. Components receive them as props. The types are the architecture's spine.

---

## Effects

Effects establish relationships with time. Each type has a distinct purpose and a distinct test strategy.

**Setup-only**: "When X becomes true, do Y once."
```tsx
useEffect(() => { analytics.track('page_viewed', { page }); }, [page]);
```

**Subscription**: "While mounted, maintain this connection."
```tsx
useEffect(() => {
  const unsub = eventBus.on('update', handler);
  return () => unsub();
}, [handler]);
```

**Synchronization**: "Keep two sources of truth aligned." These are usually code smells. Ask whether `useMemo`, a controlled component pattern, or the `select` option in TanStack Query can eliminate the effect entirely.

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

```tsx
// infrastructure/api/client.ts
const BASE_URL = import.meta.env.VITE_API_URL;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) throw new ApiError(response.status, await response.text());
  return response.json();
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API error ${status}`);
    this.name = 'ApiError';
  }
}
```

```tsx
// infrastructure/api/endpoints/orders.ts
import { apiFetch } from '../client';
import type { ApiOrder } from '@/features/order-summary/types';

export function getOrder(orderId: string): Promise<ApiOrder> {
  return apiFetch(`/orders/${orderId}`);
}

export function removeOrderItem(orderId: string, itemId: string): Promise<void> {
  return apiFetch(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' });
}
```

**API clients are thin.** They call `fetch` with the right URL and return typed data. They do not transform, validate, or process. Transformation happens in domain functions, invoked via TanStack Query's `select`.

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

Every component uses `cn()` for class merging. This is the only way to combine Tailwind classes.

```tsx
// shared/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Radix Integration Pattern

Radix provides behavior. Tailwind provides style. They compose, never conflict.

```tsx
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/shared/utils/cn';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onOpenChange, title, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-md rounded-lg bg-white p-6 shadow-xl',
        )}>
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Variants via Class Maps

Do not use CSS-in-JS, `styled-components`, or runtime style objects. Use const objects mapping variant keys to Tailwind class strings.

```tsx
const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
} as const;
```

---

## Forms with React Hook Form + Zod

The Zod schema is the single source of truth. Form state, validation, and TypeScript types all derive from it.

```tsx
// features/checkout/types.ts
import { z } from 'zod';

export const shippingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'Use 2-letter state code'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;
```

```tsx
// features/checkout/components/ShippingForm/ShippingForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shippingSchema, type ShippingFormData } from '../../types';
import { FormField } from '@/shared/molecules/FormField';
import { Input } from '@/shared/atoms/Input';
import { Button } from '@/shared/atoms/Button';

interface ShippingFormProps {
  onSubmit: (data: ShippingFormData) => void;
  isSubmitting: boolean;
}

export function ShippingForm({ onSubmit, isSubmitting }: ShippingFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
  });

  return (
    <div className="space-y-4" role="form" aria-label="Shipping address">
      <FormField label="Full name" name="name" error={errors.name?.message}>
        <Input {...register('name')} />
      </FormField>
      <FormField label="Address" name="address" error={errors.address?.message}>
        <Input {...register('address')} />
      </FormField>
      <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </div>
  );
}
```

**The form component is still presentational.** It receives `onSubmit` and `isSubmitting` as props. The container provides the mutation. The Zod schema provides the validation. The form itself just wires them together.

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
**Action**: Introduce sub-features. A feature may contain a `features/` subfolder with the identical canonical structure. The fractal holds.

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

**God components**: A 400-line component with 12 props, 4 effects, inline calculations, and API calls. Split it. There are always seams.

**Smart atoms**: An atom that reads context, fetches data, or contains business logic. The brain does not belong in the fingertip. The atom receives a boolean; the container decides its value.

**`useEffect` as event handler**: Watching state to trigger actions. If the user clicked a button, handle it in the click handler. Effects are for synchronization with external systems.

**Premature abstraction**: Building `GenericDataTable<T>` before the second table exists. Write concrete components. Extract the shared surface only when it reveals itself. It is always smaller than expected.

**Prop drilling past two levels**: Use context or restructure. Intermediate components should not carry data they do not use.

**Domain logic in components**: A `calculateTotal` call inside an organism's JSX. This belongs in a domain function, called by a computation hook, returned by the orchestration hook, and passed to the organism as a number. The organism renders the number. That's all.

**Style-prop creep**: `headerClassName`, `bodyClassName`, `footerClassName`, `itemClassName`. This is not a component — it is a CSS proxy. Use composition, slots, or `children`.

**Synchronized state**: Two pieces of state kept in sync via `useEffect`. If one derives from the other, compute it. `useMemo` or a plain `const` eliminates the effect, the extra render, and the bug.

---

## Composition Patterns

**Compound components** for complex UI with shared implicit state:

```tsx
<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="details">Details</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">...</Tabs.Content>
  <Tabs.Content value="details">...</Tabs.Content>
</Tabs>
```

**Render prop / children-as-function** for flexible rendering without prop explosion:

```tsx
<DataList items={items}>
  {(item) => <OrderCard key={item.id} order={item} />}
</DataList>
```

**Slot pattern** for layout components that accept named sections:

```tsx
<PageLayout
  header={<BreadcrumbNav />}
  sidebar={<FilterPanel />}
  content={<ResultsList />}
/>
```

These patterns share a principle: **composition over configuration.** The consumer assembles what they need. The component does not anticipate every combination via props.

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
