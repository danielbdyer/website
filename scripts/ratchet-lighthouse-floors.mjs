#!/usr/bin/env node
// Lighthouse floor ratchet. Reads multi-run Lighthouse output from
// .lighthouseci/, computes a confident new floor per (URL group,
// category) using the minimum across runs minus a small jitter buffer,
// and rewrites lighthouserc-floors.json with floors that have moved
// upward. Emits a markdown summary to stdout (and to
// $GITHUB_OUTPUT.summary if running in Actions) describing the change.
//
// Floors only ratchet upward. If the computed proposal is at or below
// the current floor, no change is made. Floors at 1.00 stay at 1.00.
//
// The script is read-only against lhci's output and idempotent against
// the floors file: running it twice with the same .lighthouseci/ data
// produces the same result.
//
// Triggered by: .github/workflows/ratchet-lighthouse.yml. Can also be
// run locally via `pnpm exec node ./scripts/ratchet-lighthouse-floors.mjs`
// after a multi-run `lhci collect`.

import { existsSync, readdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LHCI_DIR = resolve('.lighthouseci');
const FLOORS_PATH = resolve('lighthouserc-floors.json');

// Tunables. The buffer absorbs Lighthouse's run-to-run jitter; the
// minimum delta keeps the workflow from opening a noisy PR for a
// 0.005 improvement. These values were chosen for the desktop preset
// against a static site — adjust if the site adds dynamic surfaces or
// the runners change characteristics.
const JITTER_BUFFER = 0.02; // proposed_floor = min_score - buffer
const MIN_DELTA = 0.05; // raise only if min_score >= current_floor + 0.05
const PERFECT_THRESHOLD = 0.99; // ≥ this counts as "deterministic 1.00"

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

if (!existsSync(LHCI_DIR)) {
  console.error(`No .lighthouseci/ directory at ${LHCI_DIR}.`);
  console.error(
    'Run a multi-run `lhci collect` first (the ratchet workflow does this automatically).',
  );
  process.exit(1);
}

const floors = JSON.parse(readFileSync(FLOORS_PATH, 'utf8'));

const lhrFiles = readdirSync(LHCI_DIR)
  .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
  .map((f) => resolve(LHCI_DIR, f));

if (lhrFiles.length === 0) {
  console.error(`No lhr-*.json files in ${LHCI_DIR}.`);
  process.exit(1);
}

// Group scores by URL across all runs.
const runsByUrl = new Map();
for (const path of lhrFiles) {
  const lhr = JSON.parse(readFileSync(path, 'utf8'));
  const url = lhr.finalUrl ?? lhr.requestedUrl;
  if (!runsByUrl.has(url)) runsByUrl.set(url, []);
  runsByUrl.get(url).push(lhr.categories);
}

function findFloorEntry(url) {
  return floors.find((entry) => new RegExp(entry.matchingUrlPattern).test(url));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Walk URLs and aggregate min scores under each floor entry's pattern.
// One pattern can match many URLs (the "rooms" pattern matches all four
// room landings); we want the minimum across every (URL, run) pair under
// the same pattern, so the floor is confident across the whole group.
const aggregated = new Map(); // entry.label → { perf: min, a11y: min, ... }
for (const [url, runs] of runsByUrl) {
  const entry = findFloorEntry(url);
  if (!entry) continue;
  if (!aggregated.has(entry.label)) {
    aggregated.set(entry.label, Object.fromEntries(CATEGORIES.map((c) => [c, []])));
  }
  const acc = aggregated.get(entry.label);
  for (const run of runs) {
    for (const cat of CATEGORIES) {
      const score = run?.[cat]?.score;
      if (typeof score === 'number') acc[cat].push(score);
    }
  }
}

// Compute proposed floors and apply ratchet rules.
const proposals = [];
for (const entry of floors) {
  const acc = aggregated.get(entry.label);
  if (!acc) continue;
  for (const cat of CATEGORIES) {
    const samples = acc[cat];
    if (samples.length === 0) continue;
    const min = Math.min(...samples);
    const current = entry.scores[cat] ?? 0;

    let proposed;
    if (min >= PERFECT_THRESHOLD) {
      // Deterministic perfect score — raise to the ceiling without buffer.
      proposed = 1.0;
    } else {
      // Apply jitter buffer.
      proposed = round2(min - JITTER_BUFFER);
    }

    // Only ratchet upward, and only by a meaningful delta.
    if (proposed <= current) continue;
    if (min - current < MIN_DELTA) continue;

    proposals.push({
      label: entry.label,
      pattern: entry.matchingUrlPattern,
      category: cat,
      current,
      proposed,
      observedMin: round2(min),
      runCount: samples.length,
    });
  }
}

// Apply proposals to the floors data and write back.
let changed = false;
if (proposals.length > 0) {
  for (const p of proposals) {
    const entry = floors.find((e) => e.label === p.label);
    if (entry) {
      entry.scores[p.category] = p.proposed;
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(FLOORS_PATH, JSON.stringify(floors, null, 2) + '\n');
  }
}

// Summary output. Both human-readable (stdout) and a structured
// summary for the workflow's PR body.
function fmt(n) {
  return n.toFixed(2);
}

const lines = [];
if (proposals.length === 0) {
  lines.push('No floor raises proposed — current floors are at or above sustained minimums.');
} else {
  lines.push('## Proposed Lighthouse floor raises', '');
  lines.push('| Group | Category | Current | Proposed | Observed min | Runs |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const p of proposals) {
    lines.push(
      `| ${p.label} | ${p.category} | ${fmt(p.current)} | **${fmt(p.proposed)}** | ${fmt(p.observedMin)} | ${p.runCount} |`,
    );
  }
  lines.push('');
  lines.push(
    `Buffer: ${JITTER_BUFFER} (subtracted from observed minimum unless ≥ ${PERFECT_THRESHOLD}, in which case floor goes to 1.00).`,
  );
  lines.push(`Minimum delta to ratchet: ${MIN_DELTA}.`);
}
const summary = lines.join('\n');
console.log(summary);

// Emit GitHub Actions outputs so the workflow can branch on whether
// any changes were made and use the summary as a PR body.
const outPath = process.env.GITHUB_OUTPUT;
if (outPath) {
  appendFileSync(outPath, `changes=${changed ? 'true' : 'false'}\n`);
  // Multi-line outputs use a heredoc-style delimiter.
  const delim = `EOF_${Date.now()}`;
  appendFileSync(outPath, `summary<<${delim}\n${summary}\n${delim}\n`);
}
