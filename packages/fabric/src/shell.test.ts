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
import { handleCall, handleList, runnerOver, type Runner, type ToolResult } from './server';
import {
  AGENT_SPACE,
  OPERATOR_SPACE,
  Siblings,
  proposedVerbs,
  refusal,
  type CallContext,
} from './verbs';

const AT = '2026-09-06T12:00:00.000Z';

const noSiblings = Layer.succeed(Siblings, { list: () => Effect.succeed([]) });

const opened = (): readonly Omit<FabricEvent, 'step'>[] => [
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

const stamp = (events: readonly Omit<FabricEvent, 'step'>[]): readonly FabricEvent[] =>
  events.map((event, step) => ({ ...event, step }) as FabricEvent);

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
  return runnerOver(Layer.mergeAll(log, Layer.provide(consentOverLog, log), noSiblings));
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
    const { reflection, bridge } = JSON.parse(recorded.content[0]?.text ?? '{}') as {
      reflection: string;
      bridge: string;
    };
    expect(reflection).toMatch(/^reflection\//);
    expect(bridge).toMatch(/^bridge\//);

    const before = await answer<{
      nodes: { id: string; group: string }[];
      pending: { unresolved: number };
    }>(handleCall(run, call(), 'slice', {}));
    expect(before.nodes.map((node) => [node.id, node.group])).toEqual([[reflection, AGENT_SPACE]]);
    expect(before.pending.unresolved).toBe(0);

    const waiting = await answer<{ unresolved: number }>(handleCall(run, call(), 'pending', {}));
    expect(waiting.unresolved).toBe(1);

    await run(
      Consent.pipe(
        Effect.flatMap((consent) => consent.resolve(bridge, 'blessed', OPERATOR_SPACE, AT)),
      ),
    );

    const after = await answer<{ nodes: { id: string; group: string }[] }>(
      handleCall(run, call('session/2'), 'slice', {}),
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
            status: 'nascent',
          },
        },
        {
          kind: 'bridge.proposed',
          at: AT,
          space: OPERATOR_SPACE,
          payload: {
            id: 'bridge/a',
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
      ghosts: [{ id: 'bridge/a', operation: 'create_entity', title: 'a', evidence: 'e' }],
    });
    expect(
      sliceFromState(state, AGENT_SPACE, AT, { query: 'B', topK: 1 }).nodes.map((n) => n.id),
    ).toEqual(['reflection/b']);
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
      const first = yield* log.append(opened()[0]!);
      const second = yield* log.append(opened()[1]!);
      const third = yield* log.append({
        kind: 'verb.proposed',
        at: AT,
        space: OPERATOR_SPACE,
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
