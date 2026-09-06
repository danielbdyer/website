import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Effect, Layer, Option, Ref } from 'effect';
import {
  AGENT_SPACE,
  Canon,
  EventLog,
  GRADUATION,
  OPERATOR_SPACE,
  Siblings,
  changed,
  consentOverLog,
  decidePatch,
  describe as describeFabric,
  diffLines,
  fabricIssues,
  graduation,
  memoryEventLog,
  project,
  proposedVerbs,
  readmeFrom,
  targetOf,
  unified,
  unmeasuredIn,
  type CanonService,
  type Evaluation,
  type FabricEvent,
  type Patch,
} from './index';
import { canonFor } from './node/canon';
import { noMemoryCompile } from './node/compile';
import { fingerprint } from './node/fingerprint';
import { graphSourceOver } from './node/graph-source';
import { noResonance } from './ports';
import { handleCall, runnerOver, type Runner, type ToolResult } from './server';
import type { CallContext } from './verbs';

// ─── The loop pointed at itself ───────────────────────────────────
//
// A session proposes a patch to a skill; the fabric evaluates what it
// can; the operator applies it, to the base it named, once; the next
// session reports whether the hypothesis held; the loop measures
// itself against a floor stated in advance. Each step is a test.

const AT = '2026-09-06T12:00:00.000Z';
const LATER = '2026-09-06T13:00:00.000Z';

type Bare = Omit<FabricEvent, 'step' | 'actor'>;

const stamp = (events: readonly Bare[]): readonly FabricEvent[] =>
  events.map((event, step) => ({ actor: 'test', ...event, step }) as FabricEvent);

const seeded = (): readonly FabricEvent[] => {
  const verbs = proposedVerbs();
  return stamp([
    {
      kind: 'space.opened',
      at: AT,
      space: OPERATOR_SPACE,
      payload: { id: OPERATOR_SPACE, kind: 'operator', sovereign: OPERATOR_SPACE },
    },
    {
      kind: 'space.opened',
      at: AT,
      space: AGENT_SPACE,
      payload: { id: AGENT_SPACE, kind: 'agent', sovereign: AGENT_SPACE },
    },
    ...verbs.map((verb) => ({
      kind: 'verb.proposed' as const,
      at: AT,
      space: verb.space,
      payload: verb,
    })),
    ...verbs.map((verb) => ({
      kind: 'verb.blessed' as const,
      at: AT,
      space: verb.space,
      payload: { verb: verb.id, by: OPERATOR_SPACE, at: AT },
    })),
  ]);
};

const SKILL = [
  '---',
  'name: coding',
  'description: How code is written here.',
  '---',
  '',
  '# Coding',
  '',
  'Write it plainly.',
  '',
].join('\n');

const REVISED = SKILL.replace('Write it plainly.', 'Write it plainly, and say why.');

/** A canon over one skill held in a Ref: the on-disk adapter's shape,
 *  with the disk replaced by memory. Evaluation checks only the base. */
const canonOver = (initial: string): Layer.Layer<CanonService> =>
  Layer.effect(
    Canon,
    Ref.make(initial).pipe(
      Effect.map((text) => {
        const evaluation = (patch: Patch, now: string): Evaluation => ({
          patch: patch.id,
          at: patch.proposedAt,
          checks: [{ name: 'base', passed: fingerprint(now) === patch.baseFingerprint }],
          passed: fingerprint(now) === patch.baseFingerprint,
        });
        return {
          read: (node) =>
            node === 'skill/coding'
              ? Ref.get(text).pipe(
                  Effect.map((now) => Option.some({ text: now, fingerprint: fingerprint(now) })),
                )
              : Effect.succeed(Option.none()),
          evaluate: (patch) => Ref.get(text).pipe(Effect.map((now) => evaluation(patch, now))),
          apply: (patch) =>
            Ref.modify(text, (now) =>
              fingerprint(now) === patch.baseFingerprint ? [true, patch.body] : [false, now],
            ),
        };
      }),
    ),
  );

const runnerWith = (canon: Layer.Layer<CanonService>): Runner => {
  const log = memoryEventLog(seeded());
  return runnerOver(
    Layer.mergeAll(
      log,
      Layer.provide(consentOverLog, log),
      Layer.provide(
        graphSourceOver(() => Promise.resolve([])),
        log,
      ),
      noMemoryCompile,
      noResonance,
      Layer.succeed(Siblings, { list: () => Effect.succeed([]) }),
      canon,
    ),
  );
};

const call = (session = 'session/1', at = AT): CallContext => ({
  session,
  at,
  space: AGENT_SPACE,
  fingerprint,
});

const answer = async <T>(result: Promise<ToolResult>): Promise<T> => {
  const { content } = await result;
  return JSON.parse(content[0]?.text ?? '{}') as T;
};

const proposal = {
  node: 'skill/coding',
  body: REVISED,
  because: 'two sessions rewrote a function without saying why, and the next session undid it',
  hypothesis: 'the next session’s reflection names a reason for each rewrite it observed',
};

interface Proposed {
  readonly patch: string;
  readonly base: string;
  readonly evaluation: Evaluation;
}

const events = (run: Runner): Promise<readonly FabricEvent[]> =>
  run(EventLog.pipe(Effect.flatMap((log) => log.read())));

describe('the line diff', () => {
  it('finds the longest common subsequence and scripts the rest', () => {
    const hunks = diffLines('a\nb\nc\nd', 'a\nc\nd\ne');
    expect(hunks.map((hunk) => `${hunk.kind}:${hunk.text}`)).toEqual([
      'same:a',
      'removed:b',
      'same:c',
      'same:d',
      'added:e',
    ]);
    expect(changed(hunks)).toEqual({ added: 1, removed: 1 });
    expect(diffLines('', '')).toEqual([]);
    expect(diffLines('x', 'x')).toEqual([{ kind: 'same', text: 'x' }]);
  });

  it('renders the changed lines with context and folds the rest', () => {
    const before = Array.from({ length: 12 }, (_, index) => `line ${index}`).join('\n');
    const after = before.replace('line 6', 'line six');
    const shown = unified(before, after, 1);
    expect(shown.split('\n')).toEqual([
      '  …',
      '  line 5',
      '- line 6',
      '+ line six',
      '  line 7',
      '  …',
    ]);
  });
});

describe('a patch through the gate', () => {
  it('reads the target off the node id', () => {
    expect(Option.getOrUndefined(targetOf('skill/coding'))).toBe('skill');
    expect(Option.getOrUndefined(targetOf('verb/slice'))).toBe('verb');
    expect(Option.isNone(targetOf('reflection/abc'))).toBe(true);
  });

  it('is proposed against the base read, evaluated, and waits in the operator’s space', async () => {
    const run = runnerWith(canonOver(SKILL));

    const proposed = await answer<Proposed>(handleCall(run, call(), 'propose', proposal));
    expect(proposed.patch).toMatch(/^patch\//);
    expect(proposed.base).toBe(fingerprint(SKILL));
    expect(proposed.evaluation.passed).toBe(true);

    const state = project(await events(run));
    const patch = state.patches.get(proposed.patch);
    expect(patch).toMatchObject({
      space: OPERATOR_SPACE,
      node: 'skill/coding',
      target: 'skill',
      decision: null,
      applied: false,
      proposedBy: 'session/1',
    });
    expect(patch?.evaluation?.checks).toEqual([{ name: 'base', passed: true }]);
    expect(describeFabric(state).waiting.patches).toBe(1);
    expect(fabricIssues(await events(run))).toEqual([]);
  });

  it('refuses a node the canon does not hold, and one no patch may change', async () => {
    const run = runnerWith(canonOver(SKILL));
    const missing = await handleCall(run, call(), 'propose', { ...proposal, node: 'skill/absent' });
    expect(missing.isError).toBe(true);
    expect(missing.content[0]?.text).toMatch(/not in the canon/);
    const outside = await handleCall(run, call(), 'propose', {
      ...proposal,
      node: 'reflection/abc',
    });
    expect(outside.isError).toBe(true);
    expect(outside.content[0]?.text).toMatch(/not a node a patch may change/);
    const state = project(await events(run));
    expect(state.patches.size).toBe(0);
    expect(state.receipts).toHaveLength(0);
  });

  it('is applied by the operator to the base it named, once, and never by a session (INV-FAB-008)', async () => {
    const run = runnerWith(canonOver(SKILL));
    const { patch } = await answer<Proposed>(handleCall(run, call(), 'propose', proposal));

    const decided = await run(decidePatch(patch, 'blessed', OPERATOR_SPACE, LATER));
    expect(decided.applied).toBe(true);
    const now = await run(Canon.pipe(Effect.flatMap((canon) => canon.read('skill/coding'))));
    expect(Option.getOrUndefined(now)?.text).toBe(REVISED);

    const again = await run(
      decidePatch(patch, 'blessed', OPERATOR_SPACE, LATER).pipe(
        Effect.map(() => 'decided'),
        Effect.catchAll((cause) => Effect.succeed(cause._tag)),
      ),
    );
    expect(again).toBe('NotWaiting');

    const log = await events(run);
    expect(fabricIssues(log)).toEqual([]);
    const strangers = fabricIssues([
      ...log,
      {
        kind: 'patch.resolved',
        step: log.length,
        at: LATER,
        space: OPERATOR_SPACE,
        actor: AGENT_SPACE,
        payload: { patch, decision: 'blessed', by: AGENT_SPACE, at: LATER, applied: true },
      },
    ]);
    expect(strangers.some((issue) => issue.startsWith('INV-FAB-008'))).toBe(true);
    // The fold keeps the first answer: a second resolution changes nothing.
    expect(project(log).patches.get(patch)?.decidedBy).toBe(OPERATOR_SPACE);
  });

  it('stays waiting when the base moved, and is rejected without touching the node', async () => {
    const run = runnerWith(canonOver(SKILL));
    const first = await answer<Proposed>(handleCall(run, call(), 'propose', proposal));
    const second = await answer<Proposed>(
      handleCall(run, call('session/2'), 'propose', {
        ...proposal,
        body: SKILL.replace('Write it plainly.', 'Write it, and read it back.'),
      }),
    );
    await run(decidePatch(first.patch, 'blessed', OPERATOR_SPACE, LATER));

    const moved = await run(
      decidePatch(second.patch, 'blessed', OPERATOR_SPACE, LATER).pipe(
        Effect.map(() => 'decided'),
        Effect.catchAll((cause) => Effect.succeed(cause._tag)),
      ),
    );
    expect(moved).toBe('BaseMoved');
    const stillWaiting = project(await events(run)).patches.get(second.patch);
    expect(stillWaiting?.decision).toBeNull();

    const rejected = await run(decidePatch(second.patch, 'rejected', OPERATOR_SPACE, LATER));
    expect(rejected).toMatchObject({ decision: 'rejected', applied: false });
    const now = await run(Canon.pipe(Effect.flatMap((canon) => canon.read('skill/coding'))));
    expect(Option.getOrUndefined(now)?.text).toBe(REVISED);
    expect(fabricIssues(await events(run))).toEqual([]);
  });
});

describe('the loop measured', () => {
  const noticed = {
    attempted: 'refactor the slice cut',
    observed: ['each rewrite in the diff carries a reason in the commit body'],
  };

  it('records an outcome only for an applied patch (INV-FAB-009), and shows the next session what to measure', async () => {
    const run = runnerWith(canonOver(SKILL));
    const { patch } = await answer<Proposed>(handleCall(run, call(), 'propose', proposal));

    const early = await handleCall(run, call('session/2', LATER), 'reflect', {
      ...noticed,
      outcomes: [{ patch, outcome: 'confirmed', because: 'too soon' }],
    });
    expect(early.isError).toBe(true);
    expect(early.content[0]?.text).toMatch(/INV-FAB-009/);
    expect(project(await events(run)).reflections.size).toBe(0);

    await run(decidePatch(patch, 'blessed', OPERATOR_SPACE, LATER));
    const before = project(await events(run));
    expect(unmeasuredIn(before, OPERATOR_SPACE).map((entry) => entry.id)).toEqual([patch]);

    const measured = await answer<{ outcomes: number }>(
      handleCall(run, call('session/2', LATER), 'reflect', {
        ...noticed,
        outcomes: [{ patch, outcome: 'confirmed', because: noticed.observed[0] }],
      }),
    );
    expect(measured.outcomes).toBe(1);

    const log = await events(run);
    const state = project(log);
    expect(state.outcomes).toEqual([
      {
        patch,
        outcome: 'confirmed',
        because: noticed.observed[0],
        session: 'session/2',
        at: LATER,
      },
    ]);
    expect(unmeasuredIn(state, OPERATOR_SPACE)).toEqual([]);
    expect(fabricIssues(log)).toEqual([]);
    expect(
      fabricIssues([
        ...log,
        {
          kind: 'patch.outcome',
          step: log.length,
          at: LATER,
          space: OPERATOR_SPACE,
          actor: 'session/3',
          payload: {
            patch: 'patch/never',
            outcome: 'contradicted',
            because: 'x',
            session: 'session/3',
            at: LATER,
          },
        },
      ]).some((issue) => issue.startsWith('INV-FAB-009')),
    ).toBe(true);
  });

  it('graduates over a window against a floor stated in advance, and gates nothing', () => {
    const empty = graduation(project(seeded()));
    expect(empty).toMatchObject({ ...GRADUATION, proposed: 0, applied: 0, graduated: false });
    expect(empty.rate).toBeUndefined();

    const patch = (index: number): Patch => ({
      id: `patch/${index}`,
      space: OPERATOR_SPACE,
      node: 'skill/coding',
      target: 'skill',
      baseFingerprint: 'base',
      body: 'body',
      because: 'because',
      hypothesis: 'hypothesis',
      proposedAt: AT,
      proposedBy: 'session/1',
      decision: null,
      applied: false,
    });
    const outcomes = [
      'confirmed',
      'confirmed',
      'contradicted',
      'confirmed',
      'contradicted',
    ] as const;
    const loop = stamp([
      ...seeded().map(({ step: _step, actor: _actor, ...event }) => event as Bare),
      ...outcomes.flatMap((outcome, index): readonly Bare[] => [
        { kind: 'patch.proposed', at: AT, space: OPERATOR_SPACE, payload: patch(index) },
        {
          kind: 'patch.resolved',
          at: LATER,
          space: OPERATOR_SPACE,
          payload: {
            patch: `patch/${index}`,
            decision: 'blessed',
            by: OPERATOR_SPACE,
            at: LATER,
            applied: true,
          },
        },
        {
          kind: 'patch.outcome',
          at: `2026-09-07T0${index}:00:00.000Z`,
          space: OPERATOR_SPACE,
          payload: {
            patch: `patch/${index}`,
            outcome,
            because: 'measured',
            session: `session/${index}`,
            at: `2026-09-07T0${index}:00:00.000Z`,
          },
        },
      ]),
    ]);
    const measure = graduation(project(loop));
    expect(measure).toMatchObject({
      proposed: 5,
      applied: 5,
      confirmed: 3,
      contradicted: 2,
      rate: 0.6,
      graduated: true,
    });
    expect(fabricIssues(loop)).toEqual([]);
    const page = readmeFrom(describeFabric(project(loop)));
    expect(page).toContain('## The loop, pointed at itself');
    expect(page).toContain('| 5 | 5 | 3 | 2 | 0.60 | 0.5 | 5 | yes |');
  });
});

describe('the canon on disk', () => {
  const root = { dir: '' };

  beforeEach(async () => {
    root.dir = await mkdtemp(path.join(tmpdir(), 'fabric-canon-'));
    await mkdir(path.join(root.dir, '.claude', 'skills', 'the-coding-skill'), { recursive: true });
    await writeFile(
      path.join(root.dir, '.claude', 'skills', 'the-coding-skill', 'SKILL.md'),
      SKILL,
      'utf8',
    );
  });

  afterEach(async () => {
    await rm(root.dir, { recursive: true, force: true });
  });

  const withSkills = (): readonly FabricEvent[] =>
    stamp([
      ...seeded().map(({ step: _step, actor: _actor, ...event }) => event as Bare),
      {
        kind: 'source.proposed',
        at: AT,
        space: OPERATOR_SPACE,
        payload: {
          id: 'source/skills',
          space: OPERATOR_SPACE,
          kind: 'skills',
          path: '.claude/skills',
          origin: 'declared',
        },
      },
      {
        kind: 'source.blessed',
        at: AT,
        space: OPERATOR_SPACE,
        payload: { source: 'source/skills', by: OPERATOR_SPACE, at: AT },
      },
    ]);

  it('finds a skill by its frontmatter name, checks the base and the frontmatter, and applies once', async () => {
    const log = memoryEventLog(withSkills());
    const run = runnerOver(
      Layer.mergeAll(
        log,
        Layer.provide(consentOverLog, log),
        Layer.provide(
          graphSourceOver(() => Promise.resolve([])),
          log,
        ),
        noMemoryCompile,
        noResonance,
        Layer.succeed(Siblings, { list: () => Effect.succeed([]) }),
        Layer.provide(canonFor(root.dir), log),
      ),
    );
    const read = await run(Canon.pipe(Effect.flatMap((canon) => canon.read('skill/coding'))));
    expect(Option.getOrUndefined(read)?.fingerprint).toBe(fingerprint(SKILL));
    expect(
      Option.isNone(await run(Canon.pipe(Effect.flatMap((canon) => canon.read('skill/absent'))))),
    ).toBe(true);

    const proposed = await answer<Proposed>(handleCall(run, call(), 'propose', proposal));
    const byName = Object.fromEntries(
      proposed.evaluation.checks.map((check) => [check.name, check.passed]),
    );
    expect(byName).toMatchObject({ base: true, changes: true, frontmatter: true });
    expect(byName).toHaveProperty('markdownlint-cli2');
    expect(byName).toHaveProperty('cspell');

    const unchanged = await answer<Proposed>(
      handleCall(run, call('session/2'), 'propose', { ...proposal, body: SKILL }),
    );
    expect(unchanged.evaluation.checks.find((check) => check.name === 'changes')?.passed).toBe(
      false,
    );
    const headless = await answer<Proposed>(
      handleCall(run, call('session/3'), 'propose', { ...proposal, body: '# No frontmatter\n' }),
    );
    expect(headless.evaluation.checks.find((check) => check.name === 'frontmatter')?.passed).toBe(
      false,
    );

    const decided = await run(decidePatch(proposed.patch, 'blessed', OPERATOR_SPACE, LATER));
    expect(decided.applied).toBe(true);
    const onDisk = await readFile(
      path.join(root.dir, '.claude', 'skills', 'the-coding-skill', 'SKILL.md'),
      'utf8',
    );
    expect(onDisk).toBe(REVISED);

    const moved = await run(
      decidePatch(unchanged.patch, 'blessed', OPERATOR_SPACE, LATER).pipe(
        Effect.map(() => 'decided'),
        Effect.catchAll((cause) => Effect.succeed(cause._tag)),
      ),
    );
    expect(moved).toBe('BaseMoved');
  });
});
