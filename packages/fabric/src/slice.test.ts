import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Effect, Layer, Option } from 'effect';
import type { Slice } from '@dbd/slice';
import {
  AGENT_SPACE,
  EVENT_KINDS,
  EventLog,
  OPERATOR_SPACE,
  Siblings,
  consentOverLog,
  cut,
  describe as describeFabric,
  eventJsonSchema,
  fabricIssues,
  memoryEventLog,
  mergeParts,
  noResonance,
  project,
  proposedVerbs,
  readmeFrom,
  turnsFrom,
  type FabricEvent,
} from './index';
import { noCanon } from './node/canon';
import { noMemoryCompile, recollectionFrom } from './node/compile';
import { graphSourceOver } from './node/graph-source';
import { hitsFrom, nodeIdFromUri, reflectionMarkdown } from './node/qmd';
import { readSkills, readVault, readWorks } from './node/sources';
import { fingerprint } from './node/fingerprint';
import { handleCall, handleResources, runnerOver, type Runner } from './server';
import type { CallContext } from './verbs';

const AT = '2026-09-06T12:00:00.000Z';

type Bare = Omit<FabricEvent, 'step' | 'actor'>;

const stamp = (events: readonly Bare[]): readonly FabricEvent[] =>
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

const seeded = (blessed: readonly string[]): readonly FabricEvent[] => {
  const verbs = proposedVerbs();
  return stamp([
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
};

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
      Layer.succeed(Siblings, { list: () => Effect.succeed([]) }),
      noCanon,
    ),
  );
};

const call: CallContext = { session: 'session/1', at: AT, space: AGENT_SPACE, fingerprint };

const answer = async <T>(
  result: Promise<{ readonly content: readonly { readonly text: string }[] }>,
) => {
  const { content } = await result;
  return JSON.parse(content[0]?.text ?? '{}') as T;
};

describe('refusals are events', () => {
  it('records why a call was not run, and leaves no receipt', async () => {
    const run = runnerWith(seeded([]));
    const refused = await handleCall(run, call, 'slice', {});
    expect(refused.isError).toBe(true);
    const state = project(await run(EventLog.pipe(Effect.flatMap((log) => log.read()))));
    expect(state.refusals.map((refusal) => [refusal.verb, refusal.session])).toEqual([
      ['slice', 'session/1'],
    ]);
    expect(state.refusals[0]?.reason).toMatch(/^INV-FAB-001/);
    expect(state.receipts).toEqual([]);
    const resources = await handleResources(run);
    const described = JSON.parse(resources[0]?.text ?? '{}') as { waiting: { verbs: string[] } };
    expect(described.waiting.verbs).toContain('slice');
  });
});

describe('the description', () => {
  it('is the same for the same log, and carries the schema, the invariants, and the manifest', () => {
    const state = project(seeded(['slice', 'reflect']));
    const once = describeFabric(state);
    const twice = describeFabric(project(seeded(['slice', 'reflect'])));
    expect(twice).toEqual(once);
    expect(once.asOf).toBe(AT);
    expect(once.manifest.verbs.map((verb) => verb.name)).toEqual(['reflect', 'slice']);
    expect(once.waiting.verbs).toEqual(['propose', 'recall', 'pending', 'sync']);
    expect(once.vocabularies.eventKinds).toEqual(EVENT_KINDS);
    expect(EVENT_KINDS).toContain('verb.refused');
    expect(EVENT_KINDS).toContain('source.blessed');
    expect(once.invariants).toHaveLength(11);
    const schema = eventJsonSchema();
    expect(JSON.stringify(schema)).toContain('"verb.refused"');
    const readme = readmeFrom(once);
    expect(readme).toContain('| `reflect` | propose |');
    expect(readme).toContain('INV-FAB-007');
    expect(readme).not.toContain('~standard');
  });

  it('is served as three resources', async () => {
    const resources = await handleResources(runnerWith(seeded(['slice'])));
    expect(resources.map((resource) => resource.uri)).toEqual([
      'fabric://manifest',
      'fabric://events.schema',
      'fabric://readme',
    ]);
    expect(resources[2]?.mimeType).toBe('text/markdown');
  });
});

describe('the sources on disk', () => {
  const dirs: string[] = [];
  beforeEach(async () => {
    dirs.splice(0, dirs.length, await mkdtemp(path.join(tmpdir(), 'fabric-sources-')));
  });
  afterEach(async () => {
    await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it('reads a vault of claims into grounded parts', async () => {
    const root = dirs[0] ?? '';
    await mkdir(path.join(root, 'notes'), { recursive: true });
    await writeFile(
      path.join(root, 'notes', 'the triad predates the tradition.md'),
      '---\ndescription: The corners were axiomatized in December 2025.\ncategory: structure\ntopics: ["[[container-anatomy]]", "[[methods]]"]\nstate: full\n---\n\nSee [[the triad is the anatomy of every container]] and [[a note that is not here]].\n',
    );
    await writeFile(
      path.join(root, 'notes', 'the triad is the anatomy of every container.md'),
      '---\ndescription: Every container has three corners.\ncategory: claim\ntopics: ["[[container-anatomy]]"]\n---\n\nBody.\n',
    );
    const parts = await readVault(root, AT);
    expect(parts.axes.map((axis) => axis.id)).toEqual(['container-anatomy', 'methods']);
    expect(parts.nodes.map((node) => [node.id, node.kind, node.status])).toEqual([
      ['vault/the triad is the anatomy of every container', 'claim', undefined],
      ['vault/the triad predates the tradition', 'structure', 'full'],
    ]);
    expect(parts.edges).toEqual([
      {
        subject: 'vault/the triad predates the tradition',
        predicate: 'references',
        object: 'vault/the triad is the anatomy of every container',
        origin: 'declared',
      },
    ]);
    const slice = mergeParts(OPERATOR_SPACE, AT, { unresolved: 0, ghosts: [] }, [parts]);
    expect(slice.nodes).toHaveLength(2);
  });

  it('reads works and skills, and nothing from a path that is not there', async () => {
    const root = dirs[0] ?? '';
    await mkdir(path.join(root, 'content', 'garden'), { recursive: true });
    await writeFile(
      path.join(root, 'content', 'garden', 'small-weather.md'),
      '---\ntitle: small weather\ndate: 2026-04-24\ntype: poem\nfacets: [relation, body]\n---\n\nlisten —\n',
    );
    await mkdir(path.join(root, 'skills', 'coding'), { recursive: true });
    await writeFile(
      path.join(root, 'skills', 'coding', 'SKILL.md'),
      '---\nname: coding\ndescription: Use when writing code.\n---\n\n# Coding\n',
    );
    const works = await readWorks(path.join(root, 'content'), AT);
    expect(
      works.nodes.map((node) => [node.id, node.kind, node.group, node.createdAt.slice(0, 10)]),
    ).toEqual([['garden/small-weather', 'poem', 'garden', '2026-04-24']]);
    expect(works.axes).toHaveLength(8);
    const skills = await readSkills(path.join(root, 'skills'), AT);
    expect(skills.nodes.map((node) => [node.id, node.href, node.summary])).toEqual([
      ['skill/coding', 'coding/SKILL.md', 'Use when writing code.'],
    ]);
    expect(await readVault(path.join(root, 'nowhere'), AT)).toEqual({
      axes: [],
      nodes: [],
      edges: [],
    });
  });
});

describe('merging and cutting', () => {
  const node = (id: string, createdAt = AT, summary = '') => ({
    id,
    title: id,
    kind: 'note',
    axes: [],
    summary,
    createdAt,
  });

  it('keeps first wins by id, grounds the edges, and cuts by resonance then mention', () => {
    const merged = mergeParts(OPERATOR_SPACE, AT, { unresolved: 0, ghosts: [] }, [
      { axes: [], nodes: [node('a', AT, 'about poems')], edges: [] },
      {
        axes: [{ id: 'x', name: 'x', azimuthDeg: 0 }],
        nodes: [node('a', AT, 'shadowed'), node('b', '2026-09-05T00:00:00.000Z', 'about triads')],
        edges: [
          { subject: 'a', predicate: 'references', object: 'b', origin: 'declared' },
          { subject: 'a', predicate: 'references', object: 'gone', origin: 'declared' },
        ],
      },
    ]);
    expect(merged.nodes.map((entry) => entry.summary)).toEqual(['about poems', 'about triads']);
    expect(merged.edges).toHaveLength(1);
    const byMention = cut(merged, { query: 'triad' });
    expect(byMention.nodes.map((entry) => entry.id)).toEqual(['b']);
    expect(byMention.edges).toEqual([]);
    const byResonance = cut(merged, { query: 'triad', topK: 2 }, new Map([['a', 0.9]]));
    expect(byResonance.nodes.map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('turns a memory slice into the compile’s source turns', () => {
    const slice: Slice = {
      space: AGENT_SPACE,
      asOf: AT,
      axes: [],
      nodes: [
        { ...node('reflection/x', AT, 'one · two'), kind: 'reflection' },
        { ...node('vault/y', AT, 'ignored'), kind: 'claim' },
      ],
      edges: [],
      pending: { unresolved: 0, ghosts: [] },
    };
    expect(turnsFrom(slice)).toEqual([
      {
        id: 'reflection/x#0',
        session: 'reflection/x',
        date: '2026-09-06',
        sessionIndex: 0,
        turnIndex: 0,
        role: 'agent',
        text: 'one',
      },
      {
        id: 'reflection/x#1',
        session: 'reflection/x',
        date: '2026-09-06',
        sessionIndex: 0,
        turnIndex: 1,
        role: 'agent',
        text: 'two',
      },
    ]);
  });
});

describe('the small handshakes with the vendors', () => {
  it('maps qmd hits to node ids by the sources’ own naming', () => {
    expect(nodeIdFromUri('qmd://vault/the triad predates the tradition.md')).toBe(
      'vault/the triad predates the tradition',
    );
    expect(nodeIdFromUri('qmd://works/garden/small-weather.md')).toBe('garden/small-weather');
    expect(nodeIdFromUri('qmd://skills/coding/SKILL.md')).toBe('skill/coding');
    expect(nodeIdFromUri('qmd://skills/coding/notes.md')).toBeUndefined();
    expect(nodeIdFromUri('qmd://reflections/abc123.md')).toBe('reflection/abc123');
    expect(nodeIdFromUri('file:///elsewhere.md')).toBeUndefined();
    const hits = hitsFrom(
      'Searching 2 vector queries...\n[{"docid":"#1","score":0.55,"file":"qmd://reflections/abc.md","line":6,"title":"t","snippet":"s"},{"docid":"#2","score":0.3,"file":"qmd://nowhere/x.md"}]',
    );
    expect(hits).toEqual([{ id: 'reflection/abc', score: 0.55, title: 't', snippet: 's' }]);
    expect(hitsFrom('nothing here')).toEqual([]);
  });

  it('writes a reflection as the markdown qmd indexes', () => {
    const text = reflectionMarkdown({
      id: 'reflection/abc',
      session: 's',
      space: AGENT_SPACE,
      at: AT,
      attempted: 'drive it',
      observed: ['one', 'two'],
      inferred: ['three'],
      shouldChange: [
        { target: 'skill', node: 'skill/coding', change: 'say less', because: 'it ran long' },
      ],
      cites: [],
      outcomes: [],
      status: 'nascent',
    });
    expect(text).toContain('# drive it');
    expect(text).toContain('- one\n- two');
    expect(text).toContain('## should change');
  });

  it('accepts the sidecar’s shape and nothing else', () => {
    expect(Option.isNone(recollectionFrom({ nope: true }))).toBe(true);
    const recollection = Option.getOrUndefined(
      recollectionFrom({
        compiler: 'activegraph-memory 0.4.0',
        claims: [
          {
            id: 'claim:1',
            text: 'The site holds one poem.',
            validFrom: '2026-09-06',
            observedAt: null,
          },
        ],
        events: [
          {
            id: 'event:1',
            text: 'The site holds one poem.',
            start: '2026-09-06',
            quantities: [{ property: 'poem', value: 1, unit: 'poem' }],
          },
        ],
        answer: { status: 'unanswerable_from_available_memory' },
      }),
    );
    expect(recollection?.claims[0]).toEqual({
      id: 'claim:1',
      text: 'The site holds one poem.',
      kind: 'fact',
      validFrom: '2026-09-06',
      observedAt: undefined,
      sources: [],
    });
    expect(recollection?.events[0]?.quantities).toEqual([
      { property: 'poem', value: 1, unit: 'poem' },
    ]);
    expect(recollection?.answer.status).toBe('unanswerable_from_available_memory');
  });
});

describe('recall without a compiler', () => {
  it('says so, and the invariants hold over the log it leaves', async () => {
    const run = runnerWith(seeded(['recall', 'reflect']));
    await handleCall(run, call, 'reflect', { attempted: 'a', observed: ['b'] });
    const recalled = await answer<{ compiler: string; resonance: unknown[] }>(
      handleCall(run, call, 'recall', { query: 'b', because: 'asking memory' }),
    );
    expect(recalled.compiler).toBe('none');
    expect(recalled.resonance).toEqual([]);
    const events = await run(EventLog.pipe(Effect.flatMap((log) => log.read())));
    expect(project(events).receipts.map((receipt) => receipt.verb)).toEqual([
      'verb/reflect',
      'verb/recall',
    ]);
    expect(fabricIssues(events)).toEqual([]);
  });
});
