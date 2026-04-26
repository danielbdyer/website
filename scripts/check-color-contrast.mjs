#!/usr/bin/env node
// Color contrast linter. Parses src/styles/tokens.css for color tokens
// in both palettes and checks every meaningful text-on-background
// pairing against WCAG AA (4.5:1 for normal text). Fails the build if
// any pair drops below the floor.
//
// Why this exists: Lighthouse flags color-contrast violations only when
// a real DOM is rendered with the failing pairing. A token can quietly
// fail AA in tokens.css and the failure only surfaces after a CI run
// against the prerendered HTML. This script lifts the check to the
// token layer — a token edit can't be committed under-contrast.
//
// Wiring:
//   - `pnpm test` runs it (alongside vitest + Playwright @smoke)
//   - lint-staged runs it on every commit that touches tokens.css
//   - CI runs it as part of the `check` job
//
// Spec ground: ACCESSIBILITY.md §"Color Contrast" names every commitment
// this script enforces.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TOKENS_PATH = resolve('src/styles/tokens.css');
const FLOOR = 4.5; // WCAG AA, normal text. Large text (18pt+) is 3:1
//                    but all text-3 usages on the site are small.

// The pairings we audit. Each entry is { fg, bg, palettes? } — palettes
// defaults to ['lt', 'dk']. The list is intentionally explicit rather
// than auto-generated: not every (text, bg) combination is rendered on
// the site, and treating every cross-product as a real pairing would
// flag pairs that never appear together (e.g. text-3 on tag-bg in light
// mode if no FacetChip uses text-3).
const PAIRINGS = [
  // Body, secondary, and tertiary text on every site background.
  { fg: 'text', bg: 'bg' },
  { fg: 'text', bg: 'bg-warm' },
  { fg: 'text', bg: 'bg-card' },
  { fg: 'text-2', bg: 'bg' },
  { fg: 'text-2', bg: 'bg-warm' },
  { fg: 'text-2', bg: 'bg-card' },
  { fg: 'text-3', bg: 'bg' },
  { fg: 'text-3', bg: 'bg-warm' },
  { fg: 'text-3', bg: 'bg-card' },
  // Tag chips.
  { fg: 'tag-text', bg: 'tag-bg' },
];

function parseTokens(css) {
  // Tokens live in two blocks: `:root, .lt { ... }` and `.dk { ... }`.
  // A token line is `--name: value;`. Hex values only — the site's
  // palette is hex, and HSL/RGB extraction would need its own parser.
  const lt = {};
  const dk = {};
  const ltMatch = css.match(/:root,\s*\.lt\s*\{([\s\S]*?)\}/);
  const dkMatch = css.match(/\.dk\s*\{([\s\S]*?)\}/);
  if (!ltMatch || !dkMatch) {
    throw new Error(`Could not locate :root/.lt or .dk blocks in ${TOKENS_PATH}`);
  }
  for (const [block, target] of [
    [ltMatch[1], lt],
    [dkMatch[1], dk],
  ]) {
    for (const line of block.split('\n')) {
      const m = line.match(/^\s*--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/);
      if (m) target[m[1]] = m[2].toLowerCase();
    }
  }
  return { lt, dk };
}

function luminance(hex) {
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const linear = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function checkPalette(name, palette) {
  const failures = [];
  for (const { fg, bg } of PAIRINGS) {
    const fgHex = palette[fg];
    const bgHex = palette[bg];
    if (!fgHex || !bgHex) {
      failures.push({
        kind: 'missing-token',
        message:
          `[${name}] missing token: ${!fgHex ? `--${fg}` : ''} ${!bgHex ? `--${bg}` : ''}`.trim(),
      });
      continue;
    }
    const ratio = contrast(fgHex, bgHex);
    if (ratio < FLOOR) {
      failures.push({
        kind: 'contrast',
        message: `[${name}] --${fg} (${fgHex}) on --${bg} (${bgHex}): ${ratio.toFixed(2)}:1 (need ≥ ${FLOOR}:1)`,
      });
    }
  }
  return failures;
}

const css = readFileSync(TOKENS_PATH, 'utf8');
const { lt, dk } = parseTokens(css);

const allFailures = [...checkPalette('light', lt), ...checkPalette('dark', dk)];

if (allFailures.length > 0) {
  console.error('Color contrast check failed:');
  for (const f of allFailures) console.error('  ' + f.message);
  console.error(`\n${allFailures.length} violation(s). See ACCESSIBILITY.md §"Color Contrast".`);
  process.exit(1);
}

const total = PAIRINGS.length * 2;
console.log(`Color contrast: ${total}/${total} pairings clear AA (≥${FLOOR}:1) in both palettes.`);
