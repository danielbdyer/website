---
name: audit-canaries
description: Use when running accessibility, performance, and SEO audits — or when diagnosing why a canary is failing. Walks the full audit surface and how to interpret the scores.
---

# Audit the Canaries

The site commits to keeping accessibility, performance, SEO, and best-practices scores near 100. Three audit surfaces enforce this:

- **Vitest + jest-axe** — component-level accessibility checks (runs on `pnpm test`)
- **Lighthouse CI** — category-score canaries against the built site (runs on `pnpm audit`)
- **Web Vitals (runtime)** — real-user metrics during dev, production analytics held for deploy

## Running the audits

### Component-level a11y

```
pnpm test --run
```

This runs the full vitest suite, which includes `axe(container)` checks on select components. `color-contrast` and `region` rules are disabled at this layer (they need a real browser). If new accessibility violations appear, the offending test fails with specific rule IDs.

See `src/test/axe.ts` for the shared configured helper. Apply it to new component tests:

```ts
import { axe } from '@/test/axe';
// ...
const results = await axe(container);
expect(results).toHaveNoViolations();
```

### Full Lighthouse canary

```
pnpm audit
```

This builds the site, serves `dist/` on a local port, runs Lighthouse, and asserts against the thresholds in `lighthouserc.js`. Thresholds:

- **Accessibility ≥ 0.95** — `error` (fails the audit)
- **SEO ≥ 0.95** — `error`
- **Best-practices ≥ 0.95** — `warn`
- **Performance ≥ 0.9** — `warn`

Performance is `warn` (not `error`) while the SSG pivot is pending — `gray-matter` and `marked` add ~310KB to the client bundle. That regression is expected and named in `PERFORMANCE_BUDGET.md` and `BACKLOG.md` under "SSG pivot to TanStack Start."

### Web Vitals in dev

`pnpm dev` with the browser devtools console open shows `[web-vital]` lines for CLS, INP, LCP, FCP, TTFB as the visitor interacts. Values and ratings (`good` / `needs-improvement` / `poor`) are logged. In production, these metrics will forward to an analytics provider — see `BACKLOG.md` → "Web Vitals production analytics."

## Interpreting failures

### A11y violation in vitest

The `jest-axe` output names the rule (e.g., `color-contrast`, `button-name`, `landmark-unique`). Read the rule description, fix the component, re-run. If the violation is structural and legitimate (e.g., color-contrast on a `--text-3` surface that's genuinely decorative per `ACCESSIBILITY.md`'s rules), document the exception in the component's test with a comment explaining *why* the rule doesn't apply.

### Lighthouse accessibility drop

Lighthouse catches what jsdom-based axe can't — color contrast in rendered context, focus indicators, tab order. A drop here usually means: a new color combination pushed below AA, a focus state vanished, a heading hierarchy broke. Read the specific audit findings in `.lighthouseci/` output.

### Lighthouse performance drop

Most likely: bundle size grew (new dependency, large asset), or a new component added a layout shift. `PERFORMANCE_BUDGET.md` names the targets. Either:
- Fix the regression (tree-shake, lazy-load, add `width`/`height` to images).
- Accept it and move the target in `PERFORMANCE_BUDGET.md` + `lighthouserc.js` — but only with a documented reason.

### Lighthouse SEO drop

Usually a missing `<title>`, `<meta description>`, or `robots.txt`. See `SEO_AND_META.md` and `BACKLOG.md`. If the drop is because per-page titles aren't set, that's the *per-page title and meta description* backlog item — expected until it's addressed, but should not error until then.

## When to add to the backlog vs. fix now

| Situation | Action |
|---|---|
| Accidental regression — a score dropped because a new change broke something. | Fix now. |
| Known tradeoff — the score reflects the current architecture's limit (e.g., performance because SSG pending). | Update target in spec; leave as `warn`. |
| New capability needs attention — e.g., first image arrives and needs optimization. | Add to `BACKLOG.md` with a trigger; fix in a dedicated pass. |

## Spec references

- `ACCESSIBILITY.md` — what the a11y audit enforces and why.
- `PERFORMANCE_BUDGET.md` — what the performance audit enforces and why.
- `SEO_AND_META.md` — what the SEO audit enforces and why.
- `BACKLOG.md` — where known gaps live, with triggers.
- `lighthouserc.js` — the assertion thresholds themselves.
- `src/test/axe.ts` — the component-level a11y helper.
- `src/shared/seo/web-vitals.ts` — the runtime vitals reporter.
