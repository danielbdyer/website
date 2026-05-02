#!/usr/bin/env node
// Component-shape linter for atoms / molecules / organisms.
//
// REACT_NORTH_STAR.md commits to two shape constraints the
// codebase actually enforces, and that ESLint can't catch on
// its own:
//
//   1. Per-tier prop count ceilings.
//        Atoms     ≤ 5 props
//        Molecules ≤ 7 props
//        Organisms ≤ 7 props
//
//   2. Banned generic prop names. When a component has a single
//      object prop, the name must be domain-relevant (`work`,
//      `world`, `endpoints`, `comments`) — never a generic
//      placeholder like `data` / `config` / `options` /
//      `params` / `state` / `info`. *Domain-relevant names or
//      bust.*
//
// This script walks the atomic-design folders, parses each
// `*Props` interface (or type alias), counts properties, and
// flags violations of either rule. Wired into `pnpm lint` so a
// regression surfaces on every push.
//
// The naming convention the script relies on: the props
// type/interface is named with a `Props` suffix and lives in
// the same file as the component. That matches the rest of the
// codebase already.
//
// Limits and the banned-names list live here as a single source
// of truth; touching them requires touching REACT_NORTH_STAR.md
// too (the commit message names the rationale).

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TIERS = [
  { name: 'atoms', dir: 'src/shared/atoms', max: 5 },
  { name: 'molecules', dir: 'src/shared/molecules', max: 7 },
  { name: 'organisms', dir: 'src/shared/organisms', max: 7 },
];

/** Generic prop names the codebase refuses. The replacement is
 *  always a domain-relevant noun: a Star takes a `work`, a Stage
 *  takes a `world`, a Thread takes `endpoints`, a CommentThread
 *  takes `comments`. The placeholder names below sneak generic
 *  shapes into a domain layer and erode the surface's clarity.
 *  REACT_NORTH_STAR.md §"Organisms" names this commitment. */
const BANNED_PROP_NAMES = new Set(['data', 'config', 'options', 'params', 'state', 'info']);

/** Count the property declarations inside a single interface or
 *  type-alias body. A property is a line that starts (after
 *  whitespace and optional `readonly`) with an identifier
 *  followed by `?:` or `:`. Comments and blank lines don't
 *  count. */
function countProps(body) {
  const lines = body.split('\n');
  let count = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;
    if (/^(?:readonly\s+)?[a-zA-Z_$][\w$]*\??\s*:/.test(line)) count += 1;
  }
  return count;
}

/** List the top-level prop names declared in the body. Same
 *  predicate as countProps, but returns the names so the
 *  banned-name check can flag them. */
function propNames(body) {
  const names = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;
    const match = /^(?:readonly\s+)?([a-zA-Z_$][\w$]*)\??\s*:/.exec(line);
    if (match) names.push(match[1]);
  }
  return names;
}

/** Find every `*Props` declaration in a source file and return
 *  an array of `{ name, count, props }`. Handles both
 *  `interface FooProps {…}` and `type FooProps = {…}` (the
 *  codebase uses both). Brace matching is naive but sufficient
 *  for this codebase's flat, non-nested Props shapes. */
function scan(source) {
  const results = [];
  const headerRe = /(?:^|\n)(?:export\s+)?(?:interface|type)\s+(\w+Props)\s*(?:=\s*)?\{/g;
  let match;
  while ((match = headerRe.exec(source)) !== null) {
    const name = match[1];
    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      i += 1;
    }
    if (depth !== 0) continue;
    const body = source.slice(start, i - 1);
    results.push({ name, count: countProps(body), props: propNames(body) });
  }
  return results;
}

async function walkTsx(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkTsx(full)));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.tsx') &&
      !entry.name.endsWith('.test.tsx') &&
      !entry.name.endsWith('.stories.tsx')
    ) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const countViolations = [];
  const nameViolations = [];
  for (const tier of TIERS) {
    const root = path.join(REPO_ROOT, tier.dir);
    const files = await walkTsx(root);
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      const rel = path.relative(REPO_ROOT, file);
      for (const { name, count, props } of scan(source)) {
        if (count > tier.max) {
          countViolations.push({ tier: tier.name, file: rel, name, count, max: tier.max });
        }
        for (const propName of props) {
          if (BANNED_PROP_NAMES.has(propName)) {
            nameViolations.push({ tier: tier.name, file: rel, name, propName });
          }
        }
      }
    }
  }
  const failed = countViolations.length > 0 || nameViolations.length > 0;
  if (!failed) {
    console.log(
      'Component shapes: every Props interface within tier limits and naming discipline.',
    );
    return;
  }
  if (countViolations.length > 0) {
    console.error('Prop ceilings violated:');
    for (const v of countViolations) {
      console.error(`  ${v.file} → ${v.name} (${v.tier}): ${v.count} props (max ${v.max})`);
    }
    console.error(
      'REACT_NORTH_STAR.md §"Atoms / Molecules / Organisms" names these limits. ' +
        'Group props into a typed object named for the domain it represents (e.g. ' +
        '`work: WorkRecord`), or split the component, to bring the count back inside.',
    );
  }
  if (nameViolations.length > 0) {
    if (countViolations.length > 0) console.error('');
    console.error('Generic prop names violated:');
    for (const v of nameViolations) {
      console.error(`  ${v.file} → ${v.name} (${v.tier}): "${v.propName}" is a banned name`);
    }
    console.error(
      'Domain-relevant names or bust. A Star takes `work`, a Stage takes `world`, a Thread\n' +
        'takes `endpoints` — never `data` / `config` / `options` / `params` / `state` /\n' +
        "`info`. The placeholder names erode the surface's clarity over time.",
    );
  }
  process.exit(1);
}

await main();
