# danielbdyer.com

A quiet site of essays, poetry, case studies, and notes. Built as static HTML with TanStack Start, deployed as static assets behind Cloudflare Workers.

## For agents and contributors

The agentic surface is the entry point for all work on this codebase. Read [`CLAUDE.md`](./CLAUDE.md) first; it's the foyer of the spec layer and the soul of what the site is. The reading order continues through [`SPECIFICATION_MAP.md`](./SPECIFICATION_MAP.md), which lays out the full graph of specifications.

The site has a self-speaking voice in its specs that is deliberately distinct from Danny's voice as the site's author. Treat that distinction with care.

For task-specific orientation, the [`.claude/skills/`](./.claude/skills/) directory holds one skill per outcome: `coding`, `writing-prose`, `writing-specs`, `architecting`, `auditing`. They're loaded into context when you name the kind of work; they orient toward the specs without duplicating them.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm test` | Build, then vitest, then Playwright `@smoke`. The full local pre-commit gate. |
| `pnpm test:fast` | Vitest only — tight TDD loop, no build. |
| `pnpm test:e2e` | Full Playwright suite. Assumes `dist/client/` is current — run `pnpm build` first if not. |
| `pnpm test:smoke` | Just the Playwright `@smoke` tier. Assumes a current build. |
| `pnpm typecheck` | `tsc -b` — full project typecheck |
| `pnpm lint` | ESLint over `src/` |
| `pnpm build` | Vite build + filter the prerender manifest |
| `pnpm build:analyze` | Build with the bundle visualizer enabled |
| `pnpm build:deploy` | Build with typecheck + the deploy artifact verification |
| `pnpm preview` | Build and serve locally |
| `pnpm preview:deploy` | Build and serve via `wrangler dev` (closer to prod runtime) |
| `pnpm deploy:workers` | Build and deploy to Cloudflare Workers |
| `pnpm lighthouse` | Build and run Lighthouse CI against the result |
| `pnpm size` | Build and check the bundle-size budget |
| `pnpm setup` | Install matching Playwright browsers (run once after clone or after a Playwright version bump) |

## First-run setup

```sh
pnpm install
pnpm setup     # Playwright browsers — only needed once per Playwright bump
```

Node version is pinned in [`.nvmrc`](./.nvmrc) and [`engines`](./package.json). If you use `nvm`, `nvm use` does the right thing. Playwright is pinned to an exact version so the bundled browser binary stays reproducible across machines and CI.

## Visual regression baselines

Visual regression compares the prerendered rooms (light + dark, desktop + mobile) against baseline PNGs committed to `e2e/visual-regression.spec.ts-snapshots/`. Baselines must be generated in the same environment they're compared against — the official Playwright Docker image — so they're regenerated via a CI workflow rather than locally.

When you need to seed or refresh baselines (after a new visual-regression test, or after a deliberate visual change):

1. Push your branch.
2. Trigger the **Update Playwright Snapshots** workflow from the Actions tab on that branch.
3. The workflow runs `playwright test --grep @visual --update-snapshots`, commits the new PNGs back to your branch with `chore(visual): …`, and pushes.
4. The next CI run on the branch picks up the new baselines and the visual gate goes green.

Don't trigger this workflow on `main` directly — always on the branch where the visual change is being reviewed. The PR diff surfaces the snapshot change for review.

## Production env

| Variable | Purpose |
|---|---|
| `VITE_CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare Web Analytics property token. When set at build time, the analytics beacon ships with the prerendered HTML; when unset, no beacon ships. See [`PRIVACY.md`](./PRIVACY.md) for the privacy posture. |

Local dev never needs this. Production deploys read it from Cloudflare's environment-variable storage.

## Stack

- TanStack Start (SSG) on Vite + React 19
- Tailwind v4 with design tokens in [`src/styles/tokens.css`](./src/styles/tokens.css)
- Self-hosted variable fonts (Literata + Newsreader)
- Vitest + Testing Library + jest-axe for unit/component tests
- Playwright for browser tests (smoke tier on every `pnpm test`)
- Cloudflare Workers static-assets deploy (no production runtime — see [`RENDERING_STRATEGY.md`](./RENDERING_STRATEGY.md))

## Where things live

- [`src/app/routes/`](./src/app/routes/) — file-based routing, one file per route
- [`src/app/layout/`](./src/app/layout/) — Nav, Footer, ErrorBoundary, NotFound, ThemeToggle
- [`src/app/providers/`](./src/app/providers/) — ThemeProvider + theme-store
- [`src/shared/`](./src/shared/) — atoms, molecules, organisms, content loader, types, SEO
- [`src/content/`](./src/content/) — markdown works, organized by room
- [`e2e/`](./e2e/) — Playwright specs
- [`.github/workflows/`](./.github/workflows/) — CI

## License

Source code is private. Content (essays, poems, etc.) is owned by Danny Dyer; do not redistribute without permission.
