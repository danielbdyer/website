import { execFile } from 'node:child_process';
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { Effect, Layer, Option } from 'effect';
import { project, sourcesOf, type FabricState } from '../log';
import { EventLog, type EventLogService } from '../ports';
import type { Check, Evaluation, Patch } from '../schema';
import { Canon, OPERATOR_SPACE, type CanonService, type NodeText } from '../verbs';
import { fingerprint } from './fingerprint';
import { parseDocument } from './sources';

// ─── Canon on disk ────────────────────────────────────────────────
//
// The nodes a patch may change live as files: today, the skills, one
// `SKILL.md` per folder under the blessed skills source. `read` gives a
// node's text and fingerprint; `evaluate` runs what the fabric can
// verify on its own, in a scratch copy, before the operator sees the
// patch; `apply` writes the body only if the base still matches, and
// only the operator's terminal calls it. The commit that follows is
// his, as always.

const run = promisify(execFile);

/** Where a scratch copy of a patched node is written for the lints. */
export const SCRATCH_DIR = path.join('fabric', '.memory', 'patches');

const readText = async (file: string): Promise<Option.Option<NodeText>> =>
  readFile(file, 'utf8').then(
    (text) => Option.some({ text, fingerprint: fingerprint(text) }),
    () => Option.none(),
  );

/** The `SKILL.md` whose frontmatter names the skill, under the blessed
 *  skills source: the slice names a skill by that name, so the canon
 *  finds it by that name, not by its folder. */
const skillFile = async (skillsRoot: string, name: string): Promise<string | undefined> => {
  const folders = await readdir(skillsRoot, { withFileTypes: true }).catch(() => []);
  const named = await Promise.all(
    folders.flatMap((entry) => {
      if (!entry.isDirectory()) return [];
      const file = path.join(skillsRoot, entry.name, 'SKILL.md');
      return [
        readFile(file, 'utf8').then(
          (text) => (parseDocument(file, text).front.name === name ? [file] : []),
          () => [],
        ),
      ];
    }),
  );
  return named.flat()[0];
};

const fileFor = async (
  root: string,
  state: FabricState,
  node: string,
): Promise<string | undefined> => {
  const [kind, name] = node.split('/');
  const skills = sourcesOf(state, OPERATOR_SPACE).find((source) => source.kind === 'skills');
  return kind === 'skill' && name && skills
    ? skillFile(path.resolve(root, skills.path), name)
    : undefined;
};

/** What a lint said about a file, one finding per line, with the path
 *  and the position stripped so two copies of a file can be compared. */
const findingsOf = (output: string, file: string): readonly string[] =>
  output
    .split('\n')
    .flatMap((line) => {
      const at = line.indexOf(file);
      if (at === -1) return [];
      const finding = line.slice(at + file.length).replace(/^:\d+(?::\d+)?\s*-?\s*/, '');
      return finding.length > 0 ? [finding] : [];
    })
    .toSorted();

/** The findings in `after` that no finding in `before` accounts for,
 *  as multisets: a finding the base carries twice covers two. */
const newFindings = (before: readonly string[], after: readonly string[]): readonly string[] => {
  const budget = before.reduce(
    (counts, finding) => new Map([...counts, [finding, (counts.get(finding) ?? 0) + 1]]),
    new Map<string, number>(),
  );
  return after.reduce<{
    readonly left: ReadonlyMap<string, number>;
    readonly added: readonly string[];
  }>(
    ({ left, added }, finding) => {
      const remaining = left.get(finding) ?? 0;
      return remaining > 0
        ? { left: new Map([...left, [finding, remaining - 1]]), added }
        : { left, added: [...added, finding] };
    },
    { left: budget, added: [] },
  ).added;
};

/** Run one lint over one file from the root and collect its findings;
 *  a clean run has none. */
const findings = async (
  root: string,
  bin: string,
  args: readonly string[],
  file: string,
): Promise<readonly string[]> =>
  run(bin, [...args, file], { cwd: root }).then(
    ({ stdout, stderr }) => findingsOf(`${stdout}\n${stderr}`, file),
    (error: unknown) => {
      const {
        stdout = '',
        stderr = '',
        message = '',
      } = error as {
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      const found = findingsOf(`${stdout}\n${stderr}`, file);
      return found.length > 0 ? found : [message || String(error)];
    },
  );

/** One lint as a ratchet: the patched text may carry no finding the
 *  base does not already carry. The repository decides which paths
 *  it lints; a node it never lints is held to itself, not to a rule it
 *  was never under. A lint that is not installed fails the check and
 *  says so; a check never passes by being skipped. */
const lint = async (
  root: string,
  name: string,
  args: readonly string[],
  base: string,
  patched: string,
): Promise<Check> => {
  const bin = path.join(root, 'node_modules', '.bin', name);
  const installed = await access(bin).then(
    () => true,
    () => false,
  );
  if (!installed) return { name, passed: false, detail: `${name} is not installed under the root` };
  const [before, after] = await Promise.all([
    findings(root, bin, args, base),
    findings(root, bin, args, patched),
  ]);
  const added = newFindings(before, after);
  if (added.length > 0) {
    return { name, passed: false, detail: `new: ${added.slice(0, 6).join('; ')}` };
  }
  return before.length > 0
    ? { name, passed: true, detail: `no new finding; the base keeps ${before.length}` }
    : { name, passed: true };
};

const evaluateOn = async (
  root: string,
  file: string | undefined,
  patch: Patch,
): Promise<Evaluation> => {
  const at = patch.proposedAt;
  if (!file) {
    return {
      patch: patch.id,
      at,
      checks: [
        { name: 'node', passed: false, detail: `${patch.node} is not a node a patch can change` },
      ],
      passed: false,
    };
  }
  const current = await readText(file);
  const base: Check = Option.match(current, {
    onNone: () => ({ name: 'base', passed: false, detail: 'the node is not on disk' }),
    onSome: ({ fingerprint: now }) =>
      now === patch.baseFingerprint
        ? { name: 'base', passed: true }
        : { name: 'base', passed: false, detail: 'the node changed since the patch was proposed' },
  });
  const changes: Check = Option.match(current, {
    onNone: () => ({ name: 'changes', passed: true }),
    onSome: ({ text }) =>
      text === patch.body
        ? { name: 'changes', passed: false, detail: 'the body is the node’s text already' }
        : { name: 'changes', passed: true },
  });
  const front = parseDocument(file, patch.body).front;
  const parses: Check =
    typeof front.name === 'string' && typeof front.description === 'string'
      ? { name: 'frontmatter', passed: true }
      : { name: 'frontmatter', passed: false, detail: 'a skill needs a name and a description' };
  const scratch = path.join(root, SCRATCH_DIR, path.basename(patch.id));
  await Promise.all(
    (['base', 'patched'] as const).map((side) =>
      mkdir(path.join(scratch, side), { recursive: true }),
    ),
  );
  const baseText = Option.match(current, { onNone: () => '', onSome: ({ text }) => text });
  const baseFile = path.join(scratch, 'base', 'SKILL.md');
  const patchedFile = path.join(scratch, 'patched', 'SKILL.md');
  await Promise.all([
    writeFile(baseFile, baseText, 'utf8'),
    writeFile(patchedFile, patch.body, 'utf8'),
  ]);
  const [before, after] = [path.relative(root, baseFile), path.relative(root, patchedFile)];
  const checks = [
    base,
    changes,
    parses,
    await lint(root, 'markdownlint-cli2', [], before, after),
    await lint(root, 'cspell', ['--no-progress'], before, after),
  ];
  return { patch: patch.id, at, checks, passed: checks.every((check) => check.passed) };
};

/** Canon over the log's blessed skills source, on disk under the root. */
export const canonFor = (root: string): Layer.Layer<CanonService, never, EventLogService> =>
  Layer.effect(
    Canon,
    EventLog.pipe(
      Effect.map((log) => {
        const state = () => log.read().pipe(Effect.map(project));
        return {
          read: (node) =>
            state().pipe(
              Effect.flatMap((current) =>
                Effect.promise(async () => {
                  const file = await fileFor(root, current, node);
                  return file ? readText(file) : Option.none();
                }),
              ),
            ),
          evaluate: (patch) =>
            state().pipe(
              Effect.flatMap((current) =>
                Effect.promise(async () =>
                  evaluateOn(root, await fileFor(root, current, patch.node), patch),
                ),
              ),
            ),
          apply: (patch) =>
            state().pipe(
              Effect.flatMap((current) =>
                Effect.promise(async () => {
                  const file = await fileFor(root, current, patch.node);
                  if (!file) return false;
                  const now = await readText(file);
                  const matches = Option.match(now, {
                    onNone: () => false,
                    onSome: ({ fingerprint: base }) => base === patch.baseFingerprint,
                  });
                  if (!matches) return false;
                  await writeFile(file, patch.body, 'utf8');
                  return true;
                }),
              ),
            ),
        };
      }),
    ),
  );

/** Canon over nothing: a test or a bare checkout. */
export const noCanon: Layer.Layer<CanonService> = Layer.succeed(Canon, {
  read: () => Effect.succeed(Option.none()),
  evaluate: (patch) =>
    Effect.succeed({
      patch: patch.id,
      at: patch.proposedAt,
      checks: [{ name: 'node', passed: false, detail: 'no canon is wired' }],
      passed: false,
    }),
  apply: () => Effect.succeed(false),
});
