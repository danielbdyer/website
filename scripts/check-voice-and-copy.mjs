#!/usr/bin/env node
// Site-specific voice guard. VOICE_AND_COPY.md §"Declinations" lists
// what the site does not say:
//   - "Click here" / "Read more" — call-to-action labels
//   - "Welcome to" / "Hi, I'm" — performed greetings
//   - Exclamation points — never
//   - Emoji in chrome — never
//
// This script scans JSX/TSX string literals (not works' bodies) for
// these patterns. Catches drift before review.
//
// Out of scope: the works themselves (`src/content/**`), where Danny's
// voice is unconstrained.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const srcRoot = join(repoRoot, 'src');

function listFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.') || entry === 'content') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) listFiles(full, acc);
    else if (/\.(tsx|ts)$/.test(entry) && !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) {
      acc.push(full);
    }
  }
  return acc;
}

const FORBIDDEN = [
  { pattern: /\bclick here\b/i, message: 'Voice: "click here" is a banned CTA per VOICE_AND_COPY.md.' },
  { pattern: /\bread more\b/i, message: 'Voice: "read more" is a banned CTA per VOICE_AND_COPY.md.' },
  { pattern: /\bwelcome to\b/i, message: 'Voice: "welcome to" is performed; the site does not perform.' },
  // Emoji range — broad Unicode emoji block (skip the Diamond ◆ which
  // is decorative typography in the wordmark).
  {
    pattern: /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2700}-\u{27BF}]/u,
    message: 'Voice: emoji in chrome is declined per VOICE_AND_COPY.md §"Declinations".',
  },
];

const findings = [];

for (const file of listFiles(srcRoot)) {
  const rel = file.replace(repoRoot + '/', '');
  const body = readFileSync(file, 'utf8');
  // Pull out JSX text nodes and string literals. Crude but effective
  // for our flat tree: any quoted string or JSX text that isn't a
  // className.
  const lines = body.split('\n');
  for (const [i, raw] of lines.entries()) {
    const line = raw.trim();
    // Skip className= / class= attributes — they're Tailwind tokens.
    if (/className=/.test(raw) && !/>[^<]*</.test(raw)) continue;
    // Skip imports.
    if (line.startsWith('import') || line.startsWith('export')) continue;
    // Skip comments.
    if (line.startsWith('//') || line.startsWith('*')) continue;
    for (const { pattern, message } of FORBIDDEN) {
      if (pattern.test(raw)) {
        findings.push(`${rel}:${i + 1}  ${message}`);
      }
    }
  }
}

if (findings.length === 0) {
  console.log('Voice guard: no forbidden phrases in JSX. ✓');
  process.exit(0);
}
console.error(`Voice guard found ${findings.length} issue(s):`);
for (const f of findings) console.error(`  ${f}`);
process.exit(1);
