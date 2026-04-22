---
name: auditing
description: Use when running accessibility / performance / SEO audits, verifying the site still feels like itself, or diagnosing why a canary has failed. Orients to the three audit surfaces (vitest + jest-axe, Lighthouse CI, runtime Web Vitals), how to interpret scores, and — importantly — how to distinguish a regression from a known tradeoff so the response matches the actual condition.
---

# Auditing This Site

Three audit surfaces keep the site honest about quality:

| Surface | Tool | What it catches |
|---|---|---|
| Component-level | `vitest` + `jest-axe` via `src/test/axe.ts` | Structural a11y violations (ARIA, labels, heading order, semantic HTML) |
| Full-page synthetic | `@lhci/cli` via `pnpm audit` | Accessibility, performance, SEO, best-practices scores against the built site |
| Runtime | `web-vitals` via `src/shared/seo/web-vitals.ts` | Real CLS / INP / LCP / FCP / TTFB measurements during actual use |

The site commits to keeping scores near 100. When a score drops, the response depends on whether the drop is a regression or a known tradeoff.

## Running the audits

### Component-level a11y

```
pnpm test --run
```

`axe(container)` runs on every component test that imports it from `@/test/axe`. `color-contrast` and `region` rules are disabled at this layer because jsdom can't compute rendered styles accurately. Those are covered by Lighthouse against the real browser.

### Full Lighthouse canary

```
pnpm audit
```

Builds, serves `dist/` locally, runs Lighthouse, asserts against `lighthouserc.js` thresholds:

- **Accessibility ≥ 0.95** — error (fails the audit).
- **SEO ≥ 0.95** — error.
- **Best-practices ≥ 0.95** — warn.
- **Performance ≥ 0.9** — warn.

Performance is `warn` (not `error`) while the SSG pivot to TanStack Start is pending. `gray-matter` and `marked` add ~310KB to the client bundle; that cost is named in `PERFORMANCE_BUDGET.md` and `BACKLOG.md`. When the pivot lands, performance can graduate to `error`.

### Web Vitals in dev

`pnpm dev` logs `[web-vital]` lines for CLS / INP / LCP / FCP / TTFB with ratings (`good` / `needs-improvement` / `poor`). Useful when the dev experience of a feature feels off — often the metrics confirm what the body already noticed.

## Interpreting failures

The response to a failing canary depends on what the failure *means*.

### "A score dropped because I broke something" — regression

Fix now. Read the Lighthouse findings (or the axe violation rule), identify the component or change that introduced the regression, undo or repair.

Common regressions:

- **Color contrast drop** — someone used `--text-3` for prose instead of decorative type. See `ACCESSIBILITY.md`'s commitment that `--text-3` is never used for content a reader needs to read.
- **Missing alt text** — an image was added without alt. Fix at authoring time in markdown `![alt](src)`.
- **Heading hierarchy broke** — a work's `<h1>` was followed by `<h3>` or similar. See `ACCESSIBILITY.md`.
- **Bundle size jumped** — a new dependency was added. Check `package.json` diff; consider whether the dependency is justified or if there's a lighter approach.
- **CLS increased** — an image was added without intrinsic `width` / `height`, or a font swap caused layout shift. Add dimensions.

### "This is where the architecture is" — known tradeoff

Don't fix; verify it's named. Current known tradeoffs:

- **Performance score ~85** — SPA with client-side markdown parsing. Expected until SSG pivot. Named in `PERFORMANCE_BUDGET.md` → "Current State" and `BACKLOG.md` → "SSG pivot."
- **JSON-LD not visible to non-JS crawlers** — same root cause. `SEO_AND_META.md` notes this; resolves with SSG.

If a new failure looks like a known tradeoff but isn't in `BACKLOG.md` or a spec, *it's a regression masquerading as a tradeoff.* Treat as regression.

### "This is a future concern" — backlog candidate

Some failures flag something worth addressing but not now. Example: a touch-target violation on a button that's never been interacted with in practice. The fix is small but not urgent.

Add to `BACKLOG.md` with a trigger (when will we take this up?) and a brief reason. The item stays visible; the work is deferred on purpose, not forgotten.

## The felt-sense audit

Automated canaries catch the floor, not the ceiling. The ceiling is: does the site still feel like itself?

When a feature is added or a spec changes, re-read the first three entry-sequence files (`CLAUDE.md`, `MEDIUM.md`, `TRANSPARENCY.md`) with the new surface in mind. Ask:

- Does this feel like a room you'd want to stay in?
- Does the added piece have a body — weight, texture, temperature?
- Does it speak in the site's register, or does it perform?
- Does it give, or does it demand?

If the felt sense is off but no automated canary catches it, the problem is still real. Name it. A section in `BACKLOG.md` or a new spec note. Don't dismiss felt-sense failures because the numbers are green.

## When to adjust the budget

If the current performance or a11y commitments feel wrong given what the site has become:

1. Propose the change in writing — a spec edit to `PERFORMANCE_BUDGET.md` or `ACCESSIBILITY.md` with the reason.
2. Update `lighthouserc.js` to match.
3. Commit with a message that names the reason.

Adjusting a budget because something isn't passing is a decision to be made *deliberately*, not a shortcut. The budget is a commitment; changing it is a change in commitments.

## Canary checkpoints

Before committing meaningful changes:

- [ ] `pnpm exec tsc -b`
- [ ] `pnpm exec eslint src/`
- [ ] `pnpm test --run`
- [ ] `pnpm build` (catches bundler-level issues)

Before shipping a release (when deployment exists):

- [ ] `pnpm audit` (Lighthouse)
- [ ] Manual keyboard walk through every new surface
- [ ] Manual `prefers-reduced-motion` check (macOS: System Settings → Accessibility → Display → Reduce motion)
- [ ] Manual `prefers-color-scheme` check (toggle system theme)

## Spec references

- `ACCESSIBILITY.md` — what the a11y audit enforces and why.
- `PERFORMANCE_BUDGET.md` — what the perf audit enforces, and what's tolerated today.
- `SEO_AND_META.md` — what the SEO audit enforces.
- `BACKLOG.md` — where known gaps with triggers live.
- `lighthouserc.js` — the assertion thresholds themselves.
- `src/test/axe.ts` — the component-level a11y helper.
- `src/shared/seo/web-vitals.ts` — the runtime vitals reporter.
