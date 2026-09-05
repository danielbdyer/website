# danielbdyer.com

A quiet site of essays, poetry, case studies, and notes. Built as static HTML with TanStack Start, deployed as static assets behind Cloudflare Workers.

## For agents and contributors

The agentic surface is the entry point for all work on this codebase. Read [`CLAUDE.md`](./CLAUDE.md) first; it's the foyer of the spec layer and the soul of what the site is. The reading order continues through [`SPECIFICATION_MAP.md`](./SPECIFICATION_MAP.md), which lays out the full graph of specifications.

The site has a self-speaking voice in its specs that is deliberately distinct from Danny's voice as the site's author. Treat that distinction with care.

For task-specific orientation, the [`.claude/skills/`](./.claude/skills/) directory holds one skill per outcome: `coding`, `writing-prose`, `writing-specs`, `architecting`, `auditing`. They're loaded into context when you name the kind of work; they orient toward the specs without duplicating them.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Vite dev server with HMR. Shows drafts and future-dated works. |
| `pnpm run doctor` | Typecheck, the full lint chain, and vitest. The pre-push gate; `run` is load-bearing (bare `pnpm doctor` hits pnpm's own no-op command). |
| `pnpm test` | Lint, build, vitest, then Playwright `@smoke`. The full local gate. |
| `pnpm test:fast` | Vitest only. Tight TDD loop, no build. |
| `pnpm test:coverage` | Vitest with the v8 coverage floor over the pure logic (content, seo, utils). |
| `pnpm test:e2e` | Full Playwright suite. Assumes `dist/client/` is current; run `pnpm build` first if not. |
| `pnpm test:smoke` | Just the Playwright `@smoke` tier. Assumes a current build. |
| `pnpm test:perf` | The `@perf` Playwright tier under `xvfb-run`; the sky's frame budget. |
| `pnpm typecheck` | `tsc -b`, the full project. |
| `pnpm lint` | The whole chain: eslint, stylelint, color contrast, component shapes, markdownlint, cspell, secretlint, spec hyperlinks, the voice guard. Each is also runnable alone as `pnpm lint:<name>`. |
| `pnpm lint:knip` | Unused files, exports, and dependencies. Advisory; not in the chain or CI. |
| `pnpm build` | Vite build + filter the prerender manifest. |
| `pnpm build:analyze` | Build with the bundle visualizer enabled. |
| `pnpm build:deploy` | Typecheck, build, and verify the deploy artifacts. |
| `pnpm preview` | Build and serve locally. |
| `pnpm preview:deploy` | Build and serve via `wrangler dev` (closer to the production runtime). |
| `pnpm deploy:workers` | Build and deploy to Cloudflare Workers. |
| `pnpm lighthouse` | Build and run Lighthouse CI against the result, then print the scores. |
| `pnpm size` | Build and check the bundle-size budget. |
| `pnpm perf:sky` | Probe the sky's frame timing headlessly (`scripts/check-sky-perf.mjs`). |
| `pnpm harness:sky` | The `@dbd/sky` package's standalone harness: the sky alone, with a perf overlay. |
| `pnpm setup` | Install matching Playwright browsers (once after clone or after a Playwright bump). |

### The commit gates

Every commit runs [`lint-staged`](./lint-staged.config.js) on the staged files, a full typecheck, the three repo-scoped scripts (component shapes, spec hyperlinks, voice), and the vitest tests related to any staged TypeScript. Staging a work under `src/content/` also runs the corpus guard (`src/shared/content/corpus.test.ts`), which re-parses every work under production strictness: bad frontmatter, a filename that is not kebab-case, or a `[[wikilink]]` to a work that does not exist fails the commit. Every push runs `pnpm run doctor`. Commit messages follow [Conventional Commits](./commitlint.config.js).

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

- [`src/app/routes/`](./src/app/routes/) — file-based routing, one file per route: the foyer, the four rooms, `$room/$slug` for a work, `facet/$facet`, and `sky` for the constellation
- [`src/app/layout/`](./src/app/layout/) — Nav, Footer, ErrorBoundary, NotFound, ThemeToggle
- [`src/app/providers/`](./src/app/providers/) — ThemeProvider + theme-store
- [`src/shared/`](./src/shared/) — atoms, molecules, organisms; content loader, schema, wikilinks, and the graph (`content/`); types; SEO and JSON-LD
- [`src/shared/geometry/`](./src/shared/geometry/), [`sky/`](./src/shared/sky/), [`dom/`](./src/shared/dom/), [`webgl/`](./src/shared/webgl/) — the sky's pure core: sphere, camera, springs, motion, projection, and the WebGL firmament. See [`CONSTELLATION_ARCHITECTURE.md`](./CONSTELLATION_ARCHITECTURE.md).
- [`src/content/`](./src/content/) — markdown works, organized by room
- [`packages/sky/`](./packages/sky/) — `@dbd/sky`, the constellation as a package with its own harness; [`packages/slice/`](./packages/slice/) — `@dbd/slice`, the contract that crosses the wall to the engine (see [`CATHEDRALS.md`](./CATHEDRALS.md))
- [`scripts/`](./scripts/) — the repo-scoped checks (contrast, component shapes, spec hyperlinks, voice), build post-steps, and the Lighthouse ratchet
- [`e2e/`](./e2e/) — Playwright specs: core flows, error boundary, sky performance, visual regression
- [`.github/workflows/`](./.github/workflows/) — CI, the Lighthouse floor ratchet, and the snapshot updater

## License

Source code is private. Content (essays, poems, etc.) is owned by Danny Dyer; do not redistribute without permission.
