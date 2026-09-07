import { describe, expect, it } from 'vitest';
import { Effect } from 'effect';
import {
  CHANGE_TARGETS,
  CONSEQUENCE_CLASSES,
  Consent,
  DECISIONS,
  EventLog,
  SPACE_KINDS,
  bridgeEdges,
  bridgesPendingIn,
  consentOverLog,
  fabricIssues,
  manifestFor,
  memoryEventLog,
  parseEvent,
  crossingsPendingIn,
  project,
  reflectionSchema,
  toolsFrom,
  visibleReflections,
  type FabricEvent,
  type Reflection,
  type Verb,
} from './index';

const AT = '2026-09-06T12:00:00.000Z';
const LATER = '2026-09-06T13:00:00.000Z';

const operator = { id: 'danny', kind: 'operator', sovereign: 'danny' } as const;
const agent = { id: 'agent', kind: 'agent', sovereign: 'agent' } as const;

const verb = (over: Partial<Verb> = {}): Verb => ({
  id: 'verb/reflect',
  space: 'danny',
  name: 'reflect',
  description: 'Record what a session noticed, in the shape the next one can retrieve.',
  consequence: 'propose',
  inputSchema: { type: 'object' },
  outputSchema: { type: 'object' },
  origin: 'declared',
  ...over,
});

const reflection = (over: Partial<Reflection> = {}): Reflection =>
  reflectionSchema.parse({
    id: 'reflection/1',
    session: 'session/1',
    space: 'agent',
    at: AT,
    attempted: 'orient on the six repositories',
    observed: ['the vault dates the triad to December 2025'],
    ...over,
  });

type Bare = Omit<FabricEvent, 'step' | 'actor'>;

const stamp = (events: readonly Bare[]): readonly FabricEvent[] =>
  events.map((event, step) => ({ actor: 'runtime', ...event, step }) as FabricEvent);

const opened = (): readonly Bare[] => [
  { kind: 'space.opened', at: AT, space: 'danny', payload: operator },
  { kind: 'space.opened', at: AT, space: 'agent', payload: agent },
];

describe('the vocabularies', () => {
  it('are closed', () => {
    expect(CONSEQUENCE_CLASSES).toEqual(['observe', 'derive', 'propose', 'world']);
    expect(SPACE_KINDS).toEqual(['operator', 'agent']);
    expect(DECISIONS).toEqual(['blessed', 'rejected']);
    expect(CHANGE_TARGETS).toEqual(['prompt', 'skill', 'verb', 'policy']);
  });
});

describe('the log', () => {
  it('replays to the same state, and survives JSON (INV-FAB-005)', () => {
    const events = stamp([
      ...opened(),
      { kind: 'verb.proposed', at: AT, space: 'danny', payload: verb() },
      {
        kind: 'verb.blessed',
        at: LATER,
        space: 'danny',
        payload: { verb: 'verb/reflect', by: 'danny', at: LATER },
      },
      { kind: 'reflection.recorded', at: LATER, space: 'agent', payload: reflection() },
    ]);
    const once = project(events);
    const text = JSON.stringify(events);
    const twice = project((JSON.parse(text) as unknown[]).map(parseEvent));
    expect(twice).toEqual(once);
    expect(once.step).toBe(4);
    expect(once.verbs.get('verb/reflect')?.blessedAt).toBe(LATER);
    expect(fabricIssues(events)).toEqual([]);
  });

  it('leaves unknown ids alone rather than inventing them', () => {
    const events = stamp([
      ...opened(),
      {
        kind: 'verb.blessed',
        at: AT,
        space: 'danny',
        payload: { verb: 'verb/ghost', by: 'danny', at: AT },
      },
    ]);
    expect(project(events).verbs.size).toBe(0);
    expect(fabricIssues(events)).toEqual([
      'INV-FAB-002: verb.blessed names verb/ghost, never proposed',
    ]);
  });
});

describe('the manifest', () => {
  it('is the projection of the blessed, unretired verbs of one space (INV-FAB-001)', () => {
    const verbs = [
      verb(),
      verb({ id: 'verb/slice', name: 'slice', consequence: 'observe', blessedAt: AT }),
      verb({ id: 'verb/old', name: 'old', blessedAt: AT, retiredAt: LATER }),
      verb({ id: 'verb/theirs', name: 'theirs', space: 'agent', blessedAt: AT }),
    ];
    const manifest = manifestFor('danny', LATER, verbs);
    expect(manifest.verbs.map((entry) => entry.name)).toEqual(['slice']);
    expect(toolsFrom(manifest)).toEqual([
      {
        name: 'slice',
        description: `[observe] ${verb().description}`,
        inputSchema: { type: 'object' },
      },
    ]);
  });

  it('reports a call to a verb that is not in it', () => {
    const events = stamp([
      ...opened(),
      { kind: 'verb.proposed', at: AT, space: 'danny', payload: verb() },
      {
        kind: 'verb.called',
        at: LATER,
        space: 'danny',
        payload: {
          id: 'receipt/1',
          verb: 'verb/reflect',
          space: 'danny',
          session: 'session/1',
          at: LATER,
          consequence: 'propose',
          because: 'a session tried',
          inputFingerprint: 'in',
          outputFingerprint: 'out',
        },
      },
    ]);
    expect(fabricIssues(events)).toEqual([
      'INV-FAB-001: receipt receipt/1 calls verb/reflect, which is not in the manifest',
    ]);
  });

  it('is blessed only by the sovereign of the verb’s space (INV-FAB-002)', () => {
    const events = stamp([
      ...opened(),
      { kind: 'verb.proposed', at: AT, space: 'danny', payload: verb() },
      {
        kind: 'verb.blessed',
        at: LATER,
        space: 'danny',
        payload: { verb: 'verb/reflect', by: 'agent', at: LATER },
      },
    ]);
    expect(fabricIssues(events)).toEqual([
      'INV-FAB-002: agent blessed verb/reflect in danny, whose sovereign is danny',
    ]);
  });
});

describe('crossing the wall', () => {
  const crossing = (): readonly Bare[] => [
    ...opened(),
    { kind: 'reflection.recorded', at: AT, space: 'agent', payload: reflection() },
    {
      kind: 'crossing.proposed',
      at: AT,
      space: 'danny',
      payload: {
        id: 'crossing/1',
        from: 'agent',
        to: 'danny',
        node: 'reflection/1',
        evidence: 'the dating is in the vault’s own note',
        proposedAt: AT,
        decision: null,
      },
    },
  ];

  it('holds the gap: a reflection is the agent’s until blessed across (INV-FAB-006)', () => {
    const state = project(stamp(crossing()));
    expect(crossingsPendingIn(state, 'danny')).toHaveLength(1);
    expect(visibleReflections(state, 'agent').map((entry) => entry.id)).toEqual(['reflection/1']);
    expect(visibleReflections(state, 'danny')).toEqual([]);
  });

  it('is closed by the target’s sovereign, once (INV-FAB-003)', () => {
    const blessed = stamp([
      ...crossing(),
      {
        kind: 'crossing.resolved',
        at: LATER,
        space: 'danny',
        payload: { crossing: 'crossing/1', decision: 'blessed', by: 'danny', at: LATER },
      },
      {
        kind: 'crossing.resolved',
        at: LATER,
        space: 'danny',
        payload: { crossing: 'crossing/1', decision: 'rejected', by: 'danny', at: LATER },
      },
    ]);
    const state = project(blessed);
    expect(state.crossings.get('crossing/1')?.decision).toBe('blessed');
    expect(crossingsPendingIn(state, 'danny')).toEqual([]);
    expect(visibleReflections(state, 'danny').map((entry) => entry.id)).toEqual(['reflection/1']);
    expect(fabricIssues(blessed)).toEqual([]);
  });

  it('refuses a stranger’s blessing and a crossing that goes nowhere', () => {
    const events = stamp([
      ...crossing(),
      {
        kind: 'crossing.resolved',
        at: LATER,
        space: 'danny',
        payload: { crossing: 'crossing/1', decision: 'blessed', by: 'agent', at: LATER },
      },
      {
        kind: 'crossing.proposed',
        at: LATER,
        space: 'agent',
        payload: {
          id: 'crossing/2',
          from: 'agent',
          to: 'agent',
          node: 'reflection/1',
          evidence: 'no wall here',
          proposedAt: LATER,
          decision: null,
        },
      },
    ]);
    expect(fabricIssues(events)).toEqual([
      'INV-FAB-003: crossing crossing/2 does not cross a wall (agent to agent)',
      'INV-FAB-003: agent resolved crossing crossing/1 into danny, whose sovereign is danny',
    ]);
  });

  it('keeps a weak reference on the citing side, as text (INV-FAB-004)', () => {
    const cited = {
      space: 'agent',
      onNode: 'reflection/1',
      to: { space: 'danny', node: 'notes/the triad predates the tradition', span: '§ dating' },
      citation:
        'the triad predates the author’s contact with the tradition named the triad, § dating',
      at: AT,
    };
    const good = stamp([
      ...crossing(),
      { kind: 'reference.cited', at: AT, space: 'agent', payload: cited },
    ]);
    expect(fabricIssues(good)).toEqual([]);
    expect(project(good).references).toHaveLength(1);
    const bad = stamp([
      ...crossing(),
      {
        kind: 'reference.cited',
        at: AT,
        space: 'agent',
        payload: { ...cited, to: { ...cited.to, space: 'agent' } },
      },
    ]);
    expect(fabricIssues(bad)).toEqual([
      'INV-FAB-004: reference on reflection/1 cites notes/the triad predates the tradition in its own space; a weak reference crosses a wall',
    ]);
  });
});

describe('a bridge in the fold', () => {
  const bridged = (space: string, decidedBy: string): readonly Bare[] => [
    ...opened(),
    {
      kind: 'bridge.proposed',
      at: AT,
      space,
      payload: {
        id: 'bridge/1',
        space,
        subject: 'reflection/1',
        predicate: 'contradicts',
        object: 'vault/the triad predates the tradition',
        evidence: 'the reflection dates the triad to December 2025; the claim dates it later',
        proposedAt: AT,
        proposedBy: 'session/1',
        decision: null,
      },
    },
    {
      kind: 'bridge.resolved',
      at: LATER,
      space,
      payload: { bridge: 'bridge/1', decision: 'blessed', by: decidedBy, at: LATER },
    },
  ];

  it('waits, is closed once by the sovereign of its space, and is then an edge (INV-FAB-012)', () => {
    const events = stamp([
      ...bridged('danny', 'danny'),
      {
        kind: 'bridge.resolved',
        at: LATER,
        space: 'danny',
        payload: { bridge: 'bridge/1', decision: 'rejected', by: 'danny', at: LATER },
      },
    ]);
    const state = project(events);
    expect(state.bridges.get('bridge/1')?.decision).toBe('blessed');
    expect(bridgesPendingIn(state, 'danny')).toEqual([]);
    expect(bridgeEdges(state, 'danny')).toEqual([
      {
        subject: 'reflection/1',
        predicate: 'contradicts',
        object: 'vault/the triad predates the tradition',
        origin: 'declared',
      },
    ]);
    expect(fabricIssues(events)).toEqual([]);
  });

  it('refuses a stranger’s answer and a node related to itself', () => {
    const events = stamp([
      ...bridged('danny', 'agent'),
      {
        kind: 'bridge.proposed',
        at: AT,
        space: 'agent',
        payload: {
          id: 'bridge/2',
          space: 'agent',
          subject: 'reflection/1',
          predicate: 'references',
          object: 'reflection/1',
          evidence: 'none',
          proposedAt: AT,
          proposedBy: 'session/1',
          decision: null,
        },
      },
    ]);
    expect(fabricIssues(events)).toEqual([
      'INV-FAB-012: bridge bridge/2 relates reflection/1 to itself',
      'INV-FAB-012: agent resolved bridge bridge/1 in danny, whose sovereign is danny',
    ]);
  });

  it('lets the runtime withdraw an unblessed verb, and not a blessed one (INV-FAB-002)', () => {
    const withdrawn = stamp([
      ...opened(),
      { kind: 'verb.proposed', at: AT, space: 'danny', payload: verb() },
      {
        kind: 'verb.withdrawn',
        at: LATER,
        space: 'danny',
        payload: { verb: 'verb/reflect', at: LATER },
      },
    ]);
    expect(project(withdrawn).verbs.get('verb/reflect')?.retiredAt).toBe(LATER);
    expect(manifestFor('danny', LATER, project(withdrawn).verbs.values()).verbs).toEqual([]);
    expect(fabricIssues(withdrawn)).toEqual([]);
    const overreach = stamp([
      ...opened(),
      { kind: 'verb.proposed', at: AT, space: 'danny', payload: verb() },
      {
        kind: 'verb.blessed',
        at: AT,
        space: 'danny',
        payload: { verb: 'verb/reflect', by: 'danny', at: AT },
      },
      {
        kind: 'verb.withdrawn',
        at: LATER,
        space: 'danny',
        payload: { verb: 'verb/reflect', at: LATER },
      },
    ]);
    expect(fabricIssues(overreach)).toEqual([
      'INV-FAB-002: runtime withdrew verb/reflect, which danny had blessed; only the sovereign retires a blessed verb',
    ]);
  });
});

describe('the ports, over the in-memory log', () => {
  const program = Effect.gen(function* () {
    const log = yield* EventLog;
    const consent = yield* Consent;
    yield* log.append({
      kind: 'space.opened',
      at: AT,
      space: 'danny',
      actor: 'runtime',
      payload: operator,
    });
    yield* log.append({
      kind: 'space.opened',
      at: AT,
      space: 'agent',
      actor: 'runtime',
      payload: agent,
    });
    yield* log.append({
      kind: 'reflection.recorded',
      at: AT,
      space: 'agent',
      actor: 'runtime',
      payload: reflection(),
    });
    const proposed = yield* consent.propose(
      {
        id: 'crossing/1',
        from: 'agent',
        to: 'danny',
        node: 'reflection/1',
        evidence: 'a session noticed it',
        proposedAt: AT,
      },
      'agent:session/1',
    );
    const waiting = yield* consent.pending('danny');
    const resolved = yield* consent.resolve('crossing/1', 'blessed', 'danny', LATER);
    const again = yield* Effect.either(consent.resolve('crossing/1', 'blessed', 'danny', LATER));
    const events = yield* log.read();
    return { proposed, waiting, resolved, again, events };
  });

  it('proposes, waits, resolves once, and leaves a replayable log', async () => {
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(consentOverLog), Effect.provide(memoryEventLog())),
    );
    expect(result.proposed.decision).toBeNull();
    expect(result.waiting.map((crossing) => crossing.id)).toEqual(['crossing/1']);
    expect(result.resolved.decision).toBe('blessed');
    expect(result.again._tag).toBe('Left');
    expect(result.events.map((event) => event.step)).toEqual([0, 1, 2, 3, 4]);
    expect(fabricIssues(result.events)).toEqual([]);
    expect(visibleReflections(project(result.events), 'danny')).toHaveLength(1);
  });
});
