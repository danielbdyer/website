import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Effect, Layer } from 'effect';
import {
  Consent,
  EventLog,
  consentOverLog,
  fabricIssues,
  memoryEventLog,
  project,
  type FabricEvent,
} from './index';
import { sliceFromState } from './graph';
import { fileEventLog } from './node/file-log';
import { canonicalJson } from './canonical';
import { fingerprint } from './node/fingerprint';
import { parseGitmodules } from './node/siblings';
import { noMemoryCompile } from './node/compile';
import { graphSourceOver } from './node/graph-source';
import { noResonance } from './ports';
import { noCanon } from './node/canon';
import { handleCall, handleList, runnerOver, type Runner, type ToolResult } from './server';
import {
  AGENT_SPACE,
  OPERATOR_SPACE,
  Siblings,
  decideBridge,
  proposedVerbs,
  refusal,
  type CallContext,
} from './verbs';

const AT = '2026-09-06T12:00:00.000Z';

const noSiblings = Layer.succeed(Siblings, { list: () => Effect.succeed([]) });

const opened = (): readonly Bare[] => [
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
];

type Bare = Omit<FabricEvent, 'step' | 'actor'>;

const stamp = (events: readonly Bare[]): readonly FabricEvent[] =>
  events.map((event, step) => ({ actor: 'runtime', ...event, step }) as FabricEvent);

/** A runner over the in-memory log, seeded with the spaces and the
 *  verbs, with the named verbs already blessed by the operator. */
const runnerWith = (blessed: readonly string[]): Runner => {
  const verbs = proposedVerbs();
  const seeded = stamp([
    ...opened(),
    ...verbs.map((verb) => ({
      kind: 'verb.proposed' as const,
      at: AT,
      space: verb.space,
      payload: verb,
    })),
    ...verbs
      .filter((verb) => blessed.includes(verb.name))
      .map((verb) => ({
        kind: 'verb.blessed' as const,
        at: AT,
        space: verb.space,
        payload: { verb: verb.id, by: OPERATOR_SPACE, at: AT },
      })),
  ]);
  const log = memoryEventLog(seeded);
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
      noSiblings,
      noCanon,
    ),
  );
};

/** The JSON a tool answered with, typed by the caller. */
const answer = async <T>(result: Promise<ToolResult>): Promise<T> => {
  const { content } = await result;
  return JSON.parse(content[0]?.text ?? '{}') as T;
};

const call = (session = 'session/1'): CallContext => ({
  session,
  at: AT,
  space: AGENT_SPACE,
  fingerprint,
});

const noticed = {
  attempted: 'orient on the six repositories',
  observed: ['the vault dates the triad to December 2025', 'the site holds one poem'],
  inferred: ['the six are one project seen from six positions'],
  cites: [{ space: OPERATOR_SPACE, node: 'CATHEDRALS.md', span: 'The Image' }],
};

describe('the manifest as tools', () => {
  it('lists only what the operator blessed', async () => {
    const tools = await handleList(runnerWith(['slice', 'reflect']), AT);
    expect(tools.map((tool) => tool.name)).toEqual(['reflect', 'slice']);
    expect(tools[1]?.description).toMatch(/^\[observe\]/);
    expect(tools[0]?.inputSchema).toMatchObject({
      type: 'object',
      required: ['attempted', 'observed'],
    });
  });

  it('refuses an unblessed verb and a drifted signature', () => {
    const verbs = proposedVerbs();
    expect(refusal('reflect', verbs)).toMatch(/^INV-FAB-001/);
    const drifted = verbs.map((verb) =>
      verb.name === 'reflect'
        ? { ...verb, blessedAt: AT, inputSchema: { ...verb.inputSchema, required: [] } }
        : verb,
    );
    expect(refusal('reflect', drifted)).toMatch(/^INV-FAB-007/);
    expect(
      refusal(
        'reflect',
        verbs.map((verb) => ({ ...verb, blessedAt: AT })),
      ),
    ).toBeUndefined();
  });
});

describe('a session in the fabric', () => {
  it('reflects, sees its own memory at once, and sees it cross only when blessed', async () => {
    const run = runnerWith(['slice', 'reflect', 'pending']);

    const refused = await handleCall(run, call(), 'sync', {});
    expect(refused.isError).toBe(true);
    expect(refused.content[0]?.text).toMatch(/INV-FAB-001/);

    const malformed = await handleCall(run, call(), 'reflect', { attempted: 'x' });
    expect(malformed.isError).toBe(true);

    const recorded = await handleCall(run, call(), 'reflect', noticed);
    expect(recorded.isError).toBeUndefined();
    const { reflection, crossing } = JSON.parse(recorded.content[0]?.text ?? '{}') as {
      reflection: string;
      crossing: string;
    };
    expect(reflection).toMatch(/^reflection\//);
    expect(crossing).toMatch(/^crossing\//);

    const before = await answer<{
      nodes: { id: string; group: string }[];
      pending: { unresolved: number };
    }>(handleCall(run, call(), 'slice', { because: 'orienting' }));
    expect(before.nodes.map((node) => [node.id, node.group])).toEqual([[reflection, AGENT_SPACE]]);
    expect(before.pending.unresolved).toBe(0);

    const waiting = await answer<{ unresolved: number }>(
      handleCall(run, call(), 'pending', { because: 'counting the gap' }),
    );
    expect(waiting.unresolved).toBe(1);

    await run(
      Consent.pipe(
        Effect.flatMap((consent) => consent.resolve(crossing, 'blessed', OPERATOR_SPACE, AT)),
      ),
    );

    const after = await answer<{ nodes: { id: string; group: string }[] }>(
      handleCall(run, call('session/2'), 'slice', { because: 'the next session orienting' }),
    );
    expect(after.nodes.map((node) => [node.id, node.group])).toEqual([
      [reflection, OPERATOR_SPACE],
    ]);

    const events = await run(EventLog.pipe(Effect.flatMap((log) => log.read())));
    const state = project(events);
    expect(state.receipts.map((receipt) => receipt.verb)).toEqual([
      'verb/reflect',
      'verb/slice',
      'verb/pending',
      'verb/slice',
    ]);
    expect(fabricIssues(events)).toEqual([]);
  });

  it('cuts a grounded slice with the proposals as ghosts', () => {
    const state = project(
      stamp([
        ...opened(),
        {
          kind: 'reflection.recorded',
          at: AT,
          space: AGENT_SPACE,
          payload: {
            id: 'reflection/a',
            session: 's',
            space: AGENT_SPACE,
            at: AT,
            attempted: 'a',
            observed: ['a'],
            inferred: [],
            shouldChange: [],
            cites: [{ space: AGENT_SPACE, node: 'reflection/b' }],
            outcomes: [],
            status: 'nascent',
          },
        },
        {
          kind: 'reflection.recorded',
          at: AT,
          space: AGENT_SPACE,
          payload: {
            id: 'reflection/b',
            session: 's',
            space: AGENT_SPACE,
            at: AT,
            attempted: 'b',
            observed: ['b'],
            inferred: [],
            shouldChange: [],
            cites: [],
            outcomes: [],
            status: 'nascent',
          },
        },
        {
          kind: 'crossing.proposed',
          at: AT,
          space: OPERATOR_SPACE,
          payload: {
            id: 'crossing/a',
            from: AGENT_SPACE,
            to: OPERATOR_SPACE,
            node: 'reflection/a',
            evidence: 'e',
            proposedAt: AT,
            decision: null,
          },
        },
      ]),
    );
    const mine = sliceFromState(state, AGENT_SPACE, AT);
    expect(mine.edges).toEqual([
      {
        subject: 'reflection/a',
        predicate: 'references',
        object: 'reflection/b',
        origin: 'declared',
      },
    ]);
    const theirs = sliceFromState(state, OPERATOR_SPACE, AT);
    expect(theirs.nodes).toEqual([]);
    expect(theirs.pending).toEqual({
      unresolved: 1,
      ghosts: [{ id: 'crossing/a', operation: 'create_entity', title: 'a', evidence: 'e' }],
    });
    expect(
      sliceFromState(state, AGENT_SPACE, AT, { query: 'B', topK: 1 }).nodes.map((n) => n.id),
    ).toEqual(['reflection/b']);
  });
});

describe('a bridge: a relation with evidence', () => {
  const related = {
    subject: 'reflection/a',
    predicate: 'expands_on' as const,
    object: 'reflection/b',
    evidence: 'reflection/a’s second observation restates reflection/b’s first with the date added',
    because: 'relating what this session read',
  };

  it('is refused until the operator blesses the verb (INV-FAB-001)', async () => {
    const run = runnerWith(['reflect']);
    const refused = await handleCall(run, call(), 'bridge', related);
    expect(refused.isError).toBe(true);
    expect(refused.content[0]?.text).toMatch(/^INV-FAB-001: bridge is not in the manifest/);
    const events = await run(EventLog.pipe(Effect.flatMap((log) => log.read())));
    expect(project(events).refusals.map((refusal) => refusal.verb)).toEqual(['bridge']);
  });

  it('lands blessed in the session’s own space at once, since a tenant is its own sovereign', async () => {
    const run = runnerWith(['reflect', 'bridge', 'slice']);
    const a = await answer<{ reflection: string }>(
      handleCall(run, call(), 'reflect', { ...noticed, attempted: 'a' }),
    );
    const b = await answer<{ reflection: string }>(
      handleCall(run, call(), 'reflect', { ...noticed, attempted: 'b' }),
    );
    const own = await answer<{ bridge: string; space: string; decision: string | null }>(
      handleCall(run, call(), 'bridge', {
        ...related,
        subject: a.reflection,
        object: b.reflection,
        space: AGENT_SPACE,
      }),
    );
    expect(own.bridge).toMatch(/^bridge\//);
    expect(own.space).toBe(AGENT_SPACE);
    expect(own.decision).toBe('blessed');

    const mine = await answer<{ edges: { subject: string; predicate: string; object: string }[] }>(
      handleCall(run, call(), 'slice', { because: 'reading my own space' }),
    );
    expect(mine.edges).toEqual([
      { subject: a.reflection, predicate: 'expands_on', object: b.reflection, origin: 'declared' },
    ]);
    const events = await run(EventLog.pipe(Effect.flatMap((log) => log.read())));
    expect(fabricIssues(events)).toEqual([]);
    expect(events.find((event) => event.kind === 'bridge.resolved')?.actor).toBe(
      `author:${AGENT_SPACE}`,
    );
  });

  it('waits in the operator’s space as a ghost, and blessed is an edge in his slice (INV-FAB-012)', async () => {
    const run = runnerWith(['reflect', 'bridge', 'slice', 'pending']);
    const a = await answer<{ reflection: string; crossing: string }>(
      handleCall(run, call(), 'reflect', { ...noticed, attempted: 'a' }),
    );
    const b = await answer<{ reflection: string; crossing: string }>(
      handleCall(run, call(), 'reflect', { ...noticed, attempted: 'b' }),
    );
    const proposed = await answer<{ bridge: string; decision: string | null }>(
      handleCall(run, call(), 'bridge', {
        ...related,
        subject: a.reflection,
        object: b.reflection,
      }),
    );
    expect(proposed.decision).toBeNull();

    const waiting = await answer<{ unresolved: number; bridges: { id: string }[] }>(
      handleCall(run, call(), 'pending', { because: 'counting the gap' }),
    );
    expect(waiting.unresolved).toBe(3);
    expect(waiting.bridges.map((bridge) => bridge.id)).toEqual([proposed.bridge]);

    // The operator carries both reflections across, then blesses the bridge.
    for (const crossing of [a.crossing, b.crossing]) {
      await run(
        Consent.pipe(
          Effect.flatMap((consent) => consent.resolve(crossing, 'blessed', OPERATOR_SPACE, AT)),
        ),
      );
    }
    const ghosted = await answer<{ edges: unknown[]; pending: { ghosts: { id: string }[] } }>(
      handleCall(run, call('session/2'), 'slice', {
        space: OPERATOR_SPACE,
        because: 'the next session reading the operator’s space',
      }),
    );
    expect(ghosted.edges).toEqual([]);
    expect(ghosted.pending.ghosts.map((ghost) => ghost.id)).toEqual([proposed.bridge]);

    await run(decideBridge(proposed.bridge, 'blessed', OPERATOR_SPACE, AT));
    const drawn = await answer<{ edges: { subject: string; object: string }[] }>(
      handleCall(run, call('session/2'), 'slice', {
        space: OPERATOR_SPACE,
        because: 'reading again once blessed',
      }),
    );
    expect(drawn.edges).toEqual([
      { subject: a.reflection, predicate: 'expands_on', object: b.reflection, origin: 'declared' },
    ]);
    const again = await run(
      decideBridge(proposed.bridge, 'rejected', OPERATOR_SPACE, AT).pipe(Effect.either),
    );
    expect(again._tag).toBe('Left');
    const events = await run(EventLog.pipe(Effect.flatMap((log) => log.read())));
    expect(fabricIssues(events)).toEqual([]);
  });

  it('refuses a node related to itself', async () => {
    const run = runnerWith(['bridge']);
    const refused = await handleCall(run, call(), 'bridge', {
      ...related,
      object: related.subject,
    });
    expect(refused.isError).toBe(true);
    expect(refused.content[0]?.text).toMatch(/INV-FAB-012/);
  });
});

describe('the log as JSON lines', () => {
  const dirs: string[] = [];
  beforeEach(async () => {
    dirs.splice(0, dirs.length, await mkdtemp(path.join(tmpdir(), 'fabric-')));
  });
  afterEach(async () => {
    await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('appends with per-tenant steps and reads back the same log', async () => {
    const dir = dirs[0] ?? '';
    const run = <A>(effect: Effect.Effect<A, unknown, never>) => Effect.runPromise(effect);
    const layer = fileEventLog(dir);
    const program = Effect.gen(function* () {
      const log = yield* EventLog;
      const first = yield* log.append({ ...opened()[0], actor: 'runtime' } as Omit<
        FabricEvent,
        'step'
      >);
      const second = yield* log.append({ ...opened()[1], actor: 'runtime' } as Omit<
        FabricEvent,
        'step'
      >);
      const third = yield* log.append({
        kind: 'verb.proposed',
        at: AT,
        space: OPERATOR_SPACE,
        actor: 'runtime',
        payload: proposedVerbs()[0] as never,
      });
      return { steps: [first.step, second.step, third.step], all: yield* log.read() };
    });
    const { steps, all } = await run(Effect.provide(program, layer));
    expect(steps).toEqual([0, 0, 1]);
    expect(all).toHaveLength(3);
    const text = await readFile(path.join(dir, `${OPERATOR_SPACE}.jsonl`), 'utf8');
    expect(text.trim().split('\n')).toHaveLength(2);
    const again = await run(
      Effect.provide(EventLog.pipe(Effect.flatMap((log) => log.read())), fileEventLog(dir)),
    );
    expect(project(again)).toEqual(project(all));
    // The signature a verb carried through the file is the one this
    // build would check a call against (INV-FAB-007 stays quiet).
    const stored = [...project(again).verbs.values()].map((verb) => ({ ...verb, blessedAt: AT }));
    expect(refusal(stored[0]?.name ?? '', stored)).toBeUndefined();
  });
});

describe('the small handshakes', () => {
  it('fingerprints the same value the same way whatever its key order', () => {
    expect(canonicalJson({ b: [1, { d: 2, c: 3 }], a: 1, '~meta': 0 })).toBe(
      '{"a":1,"b":[1,{"c":3,"d":2}]}',
    );
    expect(fingerprint({ a: 1, b: 2 })).toBe(fingerprint({ b: 2, a: 1 }));
    expect(fingerprint({ a: 1 })).not.toBe(fingerprint({ a: 2 }));
  });

  it('reads pins from .gitmodules and none from nothing', () => {
    expect(parseGitmodules('')).toEqual([]);
    expect(
      parseGitmodules(
        '[submodule "lineage/living-graph"]\n\tpath = lineage/living-graph\n\turl = https://github.com/danielbdyer/living-graph\n[submodule "x"]\n\tpath = x\n',
      ),
    ).toEqual([
      { path: 'lineage/living-graph', url: 'https://github.com/danielbdyer/living-graph' },
    ]);
  });
});
