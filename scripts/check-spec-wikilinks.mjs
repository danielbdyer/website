#!/usr/bin/env node
// Check that every Markdown hyperlink `[text](path)` to a relative
// path in the project's spec markdown resolves to a file on disk.
// The previous `chats/chat1.md` rot would have been caught by this.
//
// Scope rules:
//   - Only honest hyperlinks `[text](path)` (not prose-style
//     filename mentions, which often appear as illustrative paths).
//   - Skip absolute URLs (http, mailto) and absolute site paths
//     (`/facet/foo`, etc.) — those are app routes, not files.
//   - Skip references inside fenced code blocks (where `[text](url)`
//     can appear inside a CSS or YAML example without being a real
//     link).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');

function listMarkdownFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git' || entry === '.claude') {
      continue;
    }
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) listMarkdownFiles(full, acc);
    else if (entry.endsWith('.md')) acc.push(full);
  }
  return acc;
}

function stripCode(body) {
  return body
    .replaceAll(/```[\s\S]*?```/g, '') // fenced code blocks
    .replaceAll(/`[^`\n]+`/g, ''); // inline code spans
}

const linkRe = /\[[^\]]*\]\(([^)#\s]+)(?:#[^)]*)?\)/g;
const errors = [];

for (const file of listMarkdownFiles(repoRoot)) {
  const rel = file.replace(repoRoot + '/', '');
  const body = stripCode(readFileSync(file, 'utf8'));
  const baseDir = dirname(file);

  for (const match of body.matchAll(linkRe)) {
    const target = match[1];
    if (target.startsWith('http') || target.startsWith('mailto:')) continue;
    if (target.startsWith('/')) continue;
    if (target.startsWith('#')) continue;
    const resolved = normalize(join(baseDir, target));
    try {
      statSync(resolved);
    } catch {
      errors.push(`${rel} → ${target}`);
    }
  }
}

if (errors.length === 0) {
  console.log('All spec markdown hyperlinks resolve. ✓');
  process.exit(0);
}
console.error(`Spec wikilink check failed — ${errors.length} unresolved references:`);
for (const e of errors) console.error(`  ${e}`);
process.exit(1);
