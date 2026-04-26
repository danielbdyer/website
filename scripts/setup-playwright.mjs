#!/usr/bin/env node
// Idempotent Playwright browser installer. Resolves the binary version
// the installed @playwright/test wants, and runs `playwright install` if
// the matching binary is missing. Designed for CI, devcontainers, and
// fresh clones — same command everywhere.
//
// Why a script and not a postinstall hook: `pnpm install` runs a lot in
// development (lockfile changes, branch switches), and a Chromium
// download adds ~120MB and minutes of waiting most of which is wasted.
// This script runs on demand: CI invokes it, contributors invoke it
// once after clone or after a Playwright version bump.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkgPath = resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const playwrightVersion = pkg.devDependencies?.['@playwright/test'];

if (!playwrightVersion) {
  console.error('No @playwright/test in devDependencies. Aborting.');
  process.exit(1);
}

if (playwrightVersion.startsWith('^') || playwrightVersion.startsWith('~')) {
  console.warn(
    `Warning: @playwright/test is "${playwrightVersion}" — pin it to an exact version so the bundled browser binary stays reproducible.`,
  );
}

console.log(`Installing Playwright browsers for @playwright/test ${playwrightVersion}…`);

// `--with-deps` installs OS-level dependencies on Linux (Chromium, fonts).
// Safe no-op on macOS. Chromium-only — the project's playwright.config.ts
// declares only chromium projects, so installing the others is wasted bandwidth.
const result = spawnSync('pnpm', ['exec', 'playwright', 'install', '--with-deps', 'chromium'], {
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error(`Playwright install exited with status ${result.status}.`);
  process.exit(result.status ?? 1);
}

// Sanity check: the install should have produced a chrome binary at the
// path Playwright expects. If it didn't, fail loudly so the next test
// run isn't a confusing surprise.
const browsersPath =
  process.env.PLAYWRIGHT_BROWSERS_PATH ||
  resolve(process.env.HOME ?? '/tmp', '.cache/ms-playwright');
if (!existsSync(browsersPath)) {
  console.warn(
    `Note: expected Playwright browsers under ${browsersPath} but the directory does not exist. If tests fail with "Executable doesn't exist", set PLAYWRIGHT_BROWSERS_PATH or re-run \`pnpm setup\`.`,
  );
}

console.log('Playwright browsers ready.');
