import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Effect, Layer } from 'effect';
import fc from 'fast-check';
import {
  AGENT_SPACE,
  Consent,
  EventLog,
  OPERATOR_SPACE,
  Siblings,
  agentActor,
  authorActor,
  compounding,
  consentOverLog,
  describe as describeFabric,
  fabricIssues,
  homeOf,
  memoryEventLog,
  parseEvent,
  project,
  proposedVerbs,
  readmeFrom,
  retrievalResults,
  type FabricEvent,
} from './index';
import { noCanon } from './node/canon';
import { noMemoryCompile } from './node/compile';
import { fileEventLog } from './node/file-log';
import { fingerprint } from './node/fingerprint';
import { graphSourceOver } from './node/graph-source';
import { noResonance } from './ports';
import { handleCall, runnerOver, type Runner, type ToolResult } from './server';
import type { CallContext } from './verbs';

// ─── The instrument, and the properties the corpus rests on ───────
//
// Four things must hold for any log, not just the ones a test wrote by
// hand: the fold is deterministic; the portable format round-trips to
// the same projection; nothing an agent writes reaches the operator's
// projection without his blessing; and every event says who wrote it
// and, for an agent, why. fast-check generates the logs. Then the
// instrument itself: a retrieval is an event, a later citation is a
// use, and the numbers come out as the definition says.

const AT = '2026-09-06T12:00:00.000Z';
const LATER = '2026-09-06T13:00:00.000Z';

type Bare = Omit<FabricEvent, 'step' | 'actor'>;
type Authored = Omit<FabricEvent, 'step'>;

/** Events in order, stepped; an event that names no actor is the runtime's. */
const stamp = (events: readonly (Bare | Authored)[]): readonly FabricEvent[] =>
  events.map((event, step) => ({ actor: 'runtime', ...event, step }) as FabricEvent);

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

const blessedVerbs = (): readonly Bare[] =>
  proposedVerbs().flatMap((verb) => [
    { kind: 'verb.proposed' as const, at: AT, space: verb.space, payload: verb },
    {
      kind: 'verb.blessed' as const,
      at: AT,
      space: verb.space,
      payload: { verb: verb.id, by: OPERATOR_SPACE, at: AT },
    },
  ]);

// ─── Generators ───────────────────────────────────────────────────

const slug = fc.stringMatching(/^[a-z][a-z0-9]{0,7}$/);
const sentence = fc.stringMatching(/^[A-Za-z][a-z ]{2,30}$/);
const minute = fc.integer({ min: 0, max: 59 });
const timeAt = (hour: number) =>
  minute.map(
    (m) => `2026-09-06T${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`,
  );

/** A session reflecting, at a time, citing some nodes: what a log is
 *  mostly made of. */
const reflectionEvent = fc
  .record({
    session: slug.map((s) => `session/${s}`),
    at: timeAt(12),
    attempted: sentence,
    observed: fc.array(sentence, { minLength: 1, maxLength: 3 }),
    cites: fc.array(
      slug.map((s) => `reflection/${s}`),
      { maxLength: 3 },
    ),
  })
  .map(({ session, at, attempted, observed, cites }) => {
    const id = `reflection/${fingerprint({ session, at, attempted }).slice(0, 8)}`;
    return {
      reflection: { id, session, at, attempted, observed },
      events: [
        {
          kind: 'reflection.recorded' as const,
          at,
          space: AGENT_SPACE,
          actor: agentActor(session),
          because: attempted,
          payload: {
            id,
            session,
            space: AGENT_SPACE,
            at,
            attempted,
            observed,
            inferred: [],
            shouldChange: [],
            outcomes: [],
            cites: cites.map((node) => ({ space: AGENT_SPACE, node })),
            status: 'nascent' as const,
          },
        },
        {
          kind: 'crossing.proposed' as const,
          at,
          space: OPERATOR_SPACE,
          actor: agentActor(session),
          because: attempted,
          payload: {
            id: `crossing/${id.slice(11)}`,
            from: AGENT_SPACE,
            to: OPERATOR_SPACE,
            node: id,
            evidence: attempted,
            proposedAt: at,
            decision: null,
          },
        },
      ] satisfies readonly Authored[],
    };
  });

/** A log: the spaces, some reflections with their crossings, and the
 *  operator answering some of the crossings. */
const logArbitrary = fc
  .array(reflectionEvent, { minLength: 0, maxLength: 6 })
  .chain((reflections) =>
    fc
      .array(fc.constantFrom('blessed' as const, 'rejected' as const, 'left' as const), {
        minLength: reflections.length,
        maxLength: reflections.length,
      })
      .map((answers) =>
        stamp([
          ...opened(),
          ...reflections.flatMap((entry) => entry.events),
          ...reflections.flatMap((entry, index) => {
            const decision = answers[index];
            return decision === undefined || decision === 'left'
              ? []
              : [
                  {
                    kind: 'crossing.resolved' as const,
                    at: LATER,
                    space: OPERATOR_SPACE,
                    actor: authorActor(OPERATOR_SPACE),
                    payload: {
                      crossing: `crossing/${entry.reflection.id.slice(11)}`,
                      decision,
                      by: OPERATOR_SPACE,
                      at: LATER,
                    },
                  },
                ];
          }),
        ]).map((event, step) => ({ ...event, step })),
      ),
  );

const runs = { numRuns: 60 };

describe('properties of any log', () => {
  it('folds to the same state twice, and after a trip through JSON (INV-FAB-005)', () => {
    fc.assert(
      fc.property(logArbitrary, (events) => {
        const once = project(events);
        const text = JSON.stringify(events);
        const again = project((JSON.parse(text) as unknown[]).map(parseEvent));
        expect(again).toEqual(once);
        expect(project(events)).toEqual(once);
      }),
      runs,
    );
  });

  it('carries no agent event without a because, and every actor in the grammar (INV-FAB-011)', () => {
    fc.assert(
      fc.property(logArbitrary, (events) => {
        for (const event of events) expect(() => parseEvent(event)).not.toThrow();
        const stripped = events.map((event) =>
          event.actor.startsWith('agent:') ? { ...event, because: undefined } : event,
        );
        const agentEvents = stripped.filter((event) => event.actor.startsWith('agent:'));
        for (const event of agentEvents) expect(() => parseEvent(event)).toThrow(/INV-FAB-011/);
        expect(() => parseEvent({ ...events[0], actor: 'nobody' })).toThrow(/actor/);
      }),
      runs,
    );
  });

  it('keeps a reflection out of the operator’s projection until he blesses it (INV-FAB-006)', () => {
    fc.assert(
      fc.property(logArbitrary, (events) => {
        const state = project(events);
        const blessedNodes = new Set(
          events.flatMap((event) =>
            event.kind === 'crossing.resolved' && event.payload.decision === 'blessed'
              ? [state.crossings.get(event.payload.crossing)?.node]
              : [],
          ),
        );
        for (const reflection of state.reflections.values()) {
          expect(homeOf(state, reflection) === OPERATOR_SPACE).toBe(
            blessedNodes.has(reflection.id),
          );
        }
        expect(fabricIssues(events)).toEqual([]);
      }),
      runs,
    );
  });
});

describe('the portable format', () => {
  const dirs: string[] = [];
  beforeEach(async () => {
    dirs.splice(0, dirs.length, await mkdtemp(path.join(tmpdir(), 'fabric-portable-')));
  });
  afterEach(async () => {
    await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('round-trips any log through JSON lines on disk to the identical projection', async () => {
    await fc.assert(
      fc.asyncProperty(logArbitrary, async (events) => {
        const dir = await mkdtemp(path.join(dirs[0] ?? tmpdir(), 'log-'));
        const write = Effect.gen(function* () {
          const log = yield* EventLog;
          for (const event of events) {
            const { step: _step, ...bare } = event;
            yield* log.append(bare);
          }
          return yield* log.read();
        });
        const written = await Effect.runPromise(Effect.provide(write, fileEventLog(dir)));
        const readBack = await Effect.runPromise(
          Effect.provide(EventLog.pipe(Effect.flatMap((log) => log.read())), fileEventLog(dir)),
        );
        expect(project(readBack)).toEqual(project(written));
        // Steps are per tenant, so the on-disk log's own steps decide; the
        // projection is what must agree with the in-memory fold.
        const ignoringSteps = (list: readonly FabricEvent[]) =>
          list.map(({ step: _step, ...rest }) => rest);
        expect(ignoringSteps(readBack)).toEqual(ignoringSteps(written));
      }),
      { numRuns: 20 },
    );
  });
});

// ─── The instrument ───────────────────────────────────────────────

const runnerWith = (events: readonly FabricEvent[]): Runner => {
  const log = memoryEventLog(events);
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
      noCanon,
      Layer.succeed(Siblings, { list: () => Effect.succeed([]) }),
    ),
  );
};

const call = (session: string, at: string): CallContext => ({
  session,
  at,
  space: AGENT_SPACE,
  fingerprint,
});

const answer = async <T>(result: Promise<ToolResult>): Promise<T> => {
  const { content } = await result;
  return JSON.parse(content[0]?.text ?? '{}') as T;
};

describe('the instrument', () => {
  it('logs every retrieval with its candidates, and counts a use only when another session made the node', async () => {
    const run = runnerWith(stamp([...opened(), ...blessedVerbs()]));

    // Session one reflects; the operator blesses it across.
    const first = await answer<{ reflection: string; crossing: string }>(
      handleCall(run, call('session/1', AT), 'reflect', {
        attempted: 'orient on the six repositories',
        observed: ['the vault dates the triad to December 2025'],
      }),
    );
    await run(
      Consent.pipe(
        Effect.flatMap((consent) => consent.resolve(first.crossing, 'blessed', OPERATOR_SPACE, AT)),
      ),
    );

    // Session two slices, sees session one's reflection, and cites it.
    const seen = await answer<{ nodes: { id: string }[] }>(
      handleCall(run, call('session/2', LATER), 'slice', { because: 'orienting at start' }),
    );
    expect(seen.nodes.map((node) => node.id)).toEqual([first.reflection]);

    const before = compounding(
      project(await run(EventLog.pipe(Effect.flatMap((log) => log.read())))),
    );
    expect(before).toMatchObject({ retrievals: 1, used: 0, rate: 0, hitAtK: 0, mrr: 0, missed: 0 });

    await handleCall(run, call('session/2', '2026-09-06T13:30:00.000Z'), 'reflect', {
      attempted: 'build on what session one found',
      observed: ['the triad predates the corpus'],
      cites: [{ space: AGENT_SPACE, node: first.reflection }],
    });

    const events = await run(EventLog.pipe(Effect.flatMap((log) => log.read())));
    const state = project(events);
    expect(state.retrievals).toHaveLength(1);
    expect(state.retrievals[0]).toMatchObject({
      session: 'session/2',
      verb: 'slice',
      context: 'orienting at start',
      candidates: [{ node: first.reflection, rank: 1, by: 'recency' }],
    });
    expect(retrievalResults(state)[0]?.firstUsedRank).toBe(1);

    const after = compounding(state);
    expect(after).toMatchObject({
      retrievals: 1,
      used: 1,
      rate: 1,
      hitAtK: 1,
      mrr: 1,
      missed: 0,
      acceptance: { decided: 1, blessed: 1, rate: 1 },
    });
    expect(after.series).toEqual([{ session: 'session/2', at: LATER, retrievals: 1, used: 1 }]);

    // Every receipt for a retrieval verb has its retrieval event, every
    // agent event its because, and the description carries the numbers.
    expect(fabricIssues(events)).toEqual([]);
    expect(
      events.filter((event) => event.actor.startsWith('agent:')).every((event) => event.because),
    ).toBe(true);
    const page = readmeFrom(describeFabric(state));
    expect(page).toContain('## Does it compound?');
    expect(page).toContain('| 1 | 1 | 1.00 | 1.00 | 1.00 | 0 | 1 | 1.00 |');
  });

  it('does not count a session citing its own fresh reflection, and counts a citation nothing surfaced as missed', async () => {
    const run = runnerWith(stamp([...opened(), ...blessedVerbs()]));
    const mine = await answer<{ reflection: string }>(
      handleCall(run, call('session/1', AT), 'reflect', {
        attempted: 'first',
        observed: ['a'],
      }),
    );
    await handleCall(run, call('session/1', LATER), 'slice', { because: 'looking back' });
    await handleCall(run, call('session/1', '2026-09-06T14:00:00.000Z'), 'reflect', {
      attempted: 'second',
      observed: ['b'],
      cites: [
        { space: AGENT_SPACE, node: mine.reflection },
        { space: OPERATOR_SPACE, node: 'skill/coding' },
      ],
    });
    const state = project(await run(EventLog.pipe(Effect.flatMap((log) => log.read()))));
    expect(compounding(state)).toMatchObject({ retrievals: 1, used: 0, missed: 1 });
  });

  it('counts a bridge as a use of both its ends, like a citation', async () => {
    const run = runnerWith(stamp([...opened(), ...blessedVerbs()]));
    const first = await answer<{ reflection: string; crossing: string }>(
      handleCall(run, call('session/1', AT), 'reflect', {
        attempted: 'first',
        observed: ['the triad was axiomatized in December 2025'],
      }),
    );
    await run(
      Consent.pipe(
        Effect.flatMap((consent) => consent.resolve(first.crossing, 'blessed', OPERATOR_SPACE, AT)),
      ),
    );
    const seen = await answer<{ nodes: { id: string }[] }>(
      handleCall(run, call('session/2', LATER), 'slice', { because: 'orienting' }),
    );
    expect(seen.nodes.map((node) => node.id)).toEqual([first.reflection]);
    const later = '2026-09-06T13:30:00.000Z';
    const own = await answer<{ reflection: string }>(
      handleCall(run, call('session/2', later), 'reflect', {
        attempted: 'second',
        observed: ['the corpus was compiled in July 2026'],
      }),
    );
    await handleCall(run, call('session/2', later), 'bridge', {
      subject: own.reflection,
      predicate: 'succeeds',
      object: first.reflection,
      evidence: 'the dates in the two observations order them',
      because: 'relating what was read to what was found',
    });
    const state = project(await run(EventLog.pipe(Effect.flatMap((log) => log.read()))));
    expect(compounding(state)).toMatchObject({ retrievals: 1, used: 1, hitAtK: 1, missed: 0 });
  });

  it('flags a retrieval receipt with no retrieval event (INV-FAB-010)', () => {
    const events = stamp([
      ...opened(),
      ...blessedVerbs(),
      {
        kind: 'verb.called',
        at: LATER,
        space: AGENT_SPACE,
        payload: {
          id: 'receipt/1',
          verb: 'verb/slice',
          space: AGENT_SPACE,
          session: 'session/9',
          at: LATER,
          consequence: 'observe',
          because: 'a slice whose retrieval was never logged',
          inputFingerprint: 'in',
          outputFingerprint: 'out',
        },
      },
    ]);
    expect(fabricIssues(events).some((issue) => issue.startsWith('INV-FAB-010'))).toBe(true);
  });
});
