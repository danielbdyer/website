import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { Effect, Layer } from 'effect';
import { constVoid } from 'effect/Function';
import { z } from 'zod';
import { Resonance, type Hit, type ResonanceService } from '../ports';
import type { Reflection } from '../schema';

// ─── qmd, as resonance ────────────────────────────────────────────
//
// qmd is the vault's own search: a project-local index of markdown
// folders with local embeddings and no key. It speaks JSON, names each
// hit by a `qmd://<collection>/<path>` URI, and the fabric's node ids
// are functions of those paths, so a hit maps to a node with nothing
// guessed. Collections are the sources: the vault, the works, the
// skills, and the reflections the fabric writes out as markdown for
// qmd to read. `refresh` re-indexes and re-embeds; `nearest` asks.
//
// Everything qmd needs that the log holds is materialized under
// `fabric/.memory/`, which is ignored by git and rebuilt at will.

const run = promisify(execFile);

/** Where the reflections are written out for qmd. Rebuilt, never
 *  canonical. */
export const MEMORY_DIR = path.join('fabric', '.memory', 'reflections');

const hitSchema = z.object({
  file: z.string(),
  score: z.number(),
  title: z.string().default(''),
  snippet: z.string().default(''),
});

const URI = /^qmd:\/\/([^/]+)\/(.+)$/;

/** The node id a qmd hit names, by the same rule the source adapters
 *  use to name nodes, or nothing for a path outside the collections. */
const namers: Record<string, (stem: string) => string | undefined> = {
  vault: (stem) => `vault/${path.basename(stem)}`,
  works: (stem) => stem,
  skills: (stem) => {
    const [name, leaf] = stem.split('/');
    return leaf === 'SKILL' && name ? `skill/${name}` : undefined;
  },
  reflections: (stem) => `reflection/${path.basename(stem)}`,
};

export function nodeIdFromUri(uri: string): string | undefined {
  const match = URI.exec(uri);
  const namer = match?.[1] === undefined ? undefined : namers[match[1]];
  return namer?.((match?.[2] ?? '').replace(/\.md$/, ''));
}

/** qmd's JSON as hits, mapped to node ids; lines that are not hits are
 *  ignored, since qmd may print its query expansion before the array. */
export function hitsFrom(stdout: string): readonly Hit[] {
  const start = stdout.indexOf('[');
  if (start === -1) return [];
  const parsed = z.array(hitSchema).safeParse(JSON.parse(stdout.slice(start)));
  if (!parsed.success) return [];
  return parsed.data.flatMap((hit) => {
    const id = nodeIdFromUri(hit.file);
    return id ? [{ id, score: hit.score, title: hit.title, snippet: hit.snippet }] : [];
  });
}

/** A reflection as the markdown qmd indexes: what it holds, in the
 *  order it was noticed. The filename is the id's leaf. */
export function reflectionMarkdown(reflection: Reflection): string {
  return [
    '---',
    `session: ${reflection.session}`,
    `at: ${reflection.at}`,
    `status: ${reflection.status}`,
    '---',
    `# ${reflection.attempted}`,
    '',
    ...reflection.observed.map((line) => `- ${line}`),
    ...(reflection.inferred.length > 0
      ? ['', '## inferred', '', ...reflection.inferred.map((line) => `- ${line}`)]
      : []),
    ...(reflection.shouldChange.length > 0
      ? [
          '',
          '## should change',
          '',
          ...reflection.shouldChange.map(
            (change) => `- ${change.target} ${change.node}: ${change.change} (${change.because})`,
          ),
        ]
      : []),
    '',
  ].join('\n');
}

const qmd = (root: string, args: readonly string[]): Promise<string> =>
  run('qmd', [...args], { cwd: root, maxBuffer: 16 * 1024 * 1024 }).then(({ stdout }) => stdout);

const quiet = (promise: Promise<unknown>): Promise<void> => promise.then(constVoid, constVoid);

/** The collections qmd should hold, by name and folder, relative to
 *  the root. The reflections folder is the fabric's own. */
export interface Collection {
  readonly name: string;
  readonly folder: string;
}

/** Write the reflections out and make sure qmd knows every collection,
 *  then update and embed. Each step is best effort: a missing qmd, or
 *  a folder that is not there, leaves the index as it was. */
export const materialize = async (
  root: string,
  reflections: readonly Reflection[],
  collections: readonly Collection[],
  scope: 'reflections' | 'all',
): Promise<void> => {
  const dir = path.join(root, MEMORY_DIR);
  await mkdir(dir, { recursive: true });
  await Promise.all(
    reflections.map((reflection) =>
      writeFile(
        path.join(dir, `${path.basename(reflection.id)}.md`),
        reflectionMarkdown(reflection),
        'utf8',
      ),
    ),
  );
  await quiet(qmd(root, ['init']));
  await Promise.all(
    collections.map((collection) =>
      quiet(
        qmd(root, [
          'collection',
          'add',
          collection.folder,
          '--name',
          collection.name,
          '--mask',
          '**/*.md',
        ]),
      ),
    ),
  );
  await quiet(qmd(root, ['update']));
  await quiet(
    qmd(
      root,
      scope === 'all'
        ? ['embed', '--timeout', '30']
        : ['embed', '-c', 'reflections', '--timeout', '5'],
    ),
  );
};

/** Resonance through qmd, over the project-local index at the root.
 *  `refresh` is given the reflections and the collections to keep
 *  current; the shell supplies both from the log. */
export const qmdResonance = (
  root: string,
  current: () => Promise<{
    readonly reflections: readonly Reflection[];
    readonly collections: readonly Collection[];
  }>,
): Layer.Layer<ResonanceService> =>
  Layer.succeed(Resonance, {
    nearest: (collection, query, k) =>
      Effect.promise(() =>
        qmd(root, ['vsearch', query, '--json', '-n', String(k), '-c', collection]).then(
          hitsFrom,
          () => [],
        ),
      ),
    refresh: (scope) =>
      Effect.promise(async () => {
        const { reflections, collections } = await current();
        await materialize(root, reflections, collections, scope);
      }),
  });
