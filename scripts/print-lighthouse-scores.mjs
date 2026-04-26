#!/usr/bin/env node
// Print Lighthouse scores after `lhci autorun`. The default lhci output
// only shows assertion failures — you learn nothing about headroom when
// the run passes. This reads the lhr-*.json reports lhci writes to
// `.lighthouseci/`, computes per-URL category scores, looks up the
// matching floor from `lighthouserc.cjs`, and prints a table with
// headroom annotations so the floors can be tightened intentionally.
//
// Run as `pnpm lighthouse:report` after `pnpm lighthouse`, or via CI
// after the lhci step (with `if: always()`). Also writes a Markdown
// summary to $GITHUB_STEP_SUMMARY when running in GitHub Actions, so
// scores show up directly in the run summary without scrolling logs.

import { existsSync, readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LHCI_DIR = resolve('.lighthouseci');
const FLOORS_PATH = resolve('lighthouserc-floors.json');

if (!existsSync(LHCI_DIR)) {
  console.error(`No .lighthouseci/ directory found at ${LHCI_DIR}.`);
  console.error('Run `pnpm lighthouse` (or `pnpm exec lhci autorun`) first.');
  process.exit(1);
}

const floors = JSON.parse(readFileSync(FLOORS_PATH, 'utf8'));

// Find the floors entry whose pattern matches a given URL — first match
// wins (matching lhci's assertMatrix behavior).
function floorsFor(url) {
  for (const entry of floors) {
    if (new RegExp(entry.matchingUrlPattern).test(url)) {
      return entry.scores ?? {};
    }
  }
  return {};
}

function floorFor(scores, category) {
  return typeof scores[category] === 'number' ? scores[category] : null;
}

const lhrFiles = readdirSync(LHCI_DIR)
  .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
  .map((f) => resolve(LHCI_DIR, f));

if (lhrFiles.length === 0) {
  console.error(`No lhr-*.json files in ${LHCI_DIR}.`);
  process.exit(1);
}

const reports = lhrFiles
  .map((path) => {
    const json = JSON.parse(readFileSync(path, 'utf8'));
    return {
      url: json.finalUrl ?? json.requestedUrl,
      categories: json.categories,
    };
  })
  .sort((a, b) => a.url.localeCompare(b.url));

const CATEGORY_KEYS = ['performance', 'accessibility', 'best-practices', 'seo'];
const CATEGORY_LABELS = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  seo: 'SEO',
};

function fmtScore(score) {
  return score == null ? '—'.padStart(5) : score.toFixed(2).padStart(5);
}

function annotate(score, floor) {
  if (floor == null) return '(no floor)';
  if (score == null) return '';
  const headroom = score - floor;
  if (Math.abs(headroom) < 0.005) return `[at floor ${floor.toFixed(2)}]`;
  if (headroom < 0) return `[FAIL ${floor.toFixed(2)}, ${headroom.toFixed(2)}]`;
  return `[floor ${floor.toFixed(2)}, +${headroom.toFixed(2)}]`;
}

const lines = ['', 'Lighthouse scores', '─────────────────', ''];
for (const { url, categories } of reports) {
  const scores = floorsFor(url);
  lines.push(url);
  for (const key of CATEGORY_KEYS) {
    const score = categories?.[key]?.score ?? null;
    const floor = floorFor(scores, key);
    const label = CATEGORY_LABELS[key].padEnd(15);
    lines.push(`  ${label} ${fmtScore(score)}  ${annotate(score, floor)}`);
  }
  lines.push('');
}
console.log(lines.join('\n'));

// GitHub Actions summary — if running in CI, append a Markdown table
// to $GITHUB_STEP_SUMMARY so scores surface in the run summary panel.
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const md = ['## Lighthouse scores', ''];
  md.push('| URL | Performance | Accessibility | Best Practices | SEO |');
  md.push('| --- | --- | --- | --- | --- |');
  for (const { url, categories } of reports) {
    const scores = floorsFor(url);
    const cells = CATEGORY_KEYS.map((key) => {
      const score = categories?.[key]?.score ?? null;
      const floor = floorFor(scores, key);
      const text = score == null ? '—' : score.toFixed(2);
      const note = annotate(score, floor);
      return `${text} <sub>${note}</sub>`;
    });
    md.push(`| \`${url}\` | ${cells.join(' | ')} |`);
  }
  md.push('');
  appendFileSync(summaryPath, md.join('\n'));
}
