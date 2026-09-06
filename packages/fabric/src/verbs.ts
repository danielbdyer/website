import { Context, Effect, Option } from 'effect';
import { z } from 'zod';
import type { Slice } from '@dbd/slice';
import { canonical, same } from './canonical';
import { cut } from './graph';
import { pendingIn, project, sourcesOf } from './log';
import { manifestFor } from './manifest';
import {
  Consent,
  EventLog,
  GraphSource,
  Resonance,
  type ConsentService,
  type EventLogService,
  type GraphSourceService,
  type Hit,
  type ResonanceService,
} from './ports';
import { changeRequestSchema, citationSchema, type Verb } from './schema';

// ─── The verbs ────────────────────────────────────────────────────
//
// A verb is a node in the operator's space; its schemas travel as
// data and its signature is frozen at blessing. The code here is the
// other half: the zod schema the JSON Schema was emitted from, and the
// program a call runs. The two halves are checked against each other
// before any call (INV-FAB-007): if the code's schema has drifted from
// the blessed one, the verb is not called. A change is a new verb.
//
// Every program describes effects and performs none; the shell runs it.

/** The operator's space, where verbs live and are blessed. */
export const OPERATOR_SPACE = 'danny';
/** The agent's space, where a session records without asking. */
export const AGENT_SPACE = 'agent';

/** What the shell knows about the call: who is calling, when, and how
 *  to fingerprint. The fingerprint stays a port so the core never
 *  touches a hashing library. */
export interface CallContext {
  readonly session: string;
  readonly at: string;
  readonly space: string;
  readonly fingerprint: (value: unknown) => string;
}

/** One sibling repository as `sync` reports it. */
export interface Sibling {
  readonly path: string;
  readonly url: string;
  readonly pinned: string;
  readonly remote: string | undefined;
  readonly drifted: boolean;
}

/** The siblings port: how the workspace sees the repositories it holds
 *  by reference. The git adapter lives in the shell. */
export interface SiblingsService {
  readonly list: () => Effect.Effect<readonly Sibling[]>;
}
export const Siblings = Context.GenericTag<SiblingsService>('@dbd/fabric/Siblings');

/** One observation of one reflection, as the compile receives it. */
export interface SourceTurn {
  readonly id: string;
  readonly session: string;
  readonly date: string;
  readonly sessionIndex: number;
  readonly turnIndex: number;
  readonly role: string;
  readonly text: string;
}

/** What the memory compile hands back for a question: the compiled
 *  claims and events with their times and quantities, the conflicts it
 *  found, and its answer, reported as it gave it. */
export interface Recollection {
  readonly compiler: string;
  readonly claims: readonly {
    readonly id: string;
    readonly text: string;
    readonly kind: string;
    readonly validFrom: string | undefined;
    readonly observedAt: string | undefined;
    readonly sources: readonly string[];
  }[];
  readonly events: readonly {
    readonly id: string;
    readonly text: string;
    readonly predicate: string;
    readonly start: string | undefined;
    readonly end: string | undefined;
    readonly observedAt: string | undefined;
    readonly quantities: readonly {
      readonly property: string;
      readonly value: number;
      readonly unit: string;
    }[];
  }[];
  readonly entities: readonly { readonly id: string; readonly label: string }[];
  readonly conflicts: readonly { readonly id: string; readonly claims: readonly string[] }[];
  readonly answer: {
    readonly text: string;
    readonly selected: readonly string[];
    readonly status: string | undefined;
  };
}

/** The memory-compile port. Fed the reflections a viewer may see as
 *  source turns; asked one question; deterministic without a reasoner.
 *  Absent when no compiler is wired, so `recall` can say so. */
export interface MemoryCompileService {
  readonly recall: (
    turns: readonly SourceTurn[],
    query: string,
    asOf: string,
  ) => Effect.Effect<Option.Option<Recollection>>;
}
export const MemoryCompile = Context.GenericTag<MemoryCompileService>('@dbd/fabric/MemoryCompile');

export type VerbEnvironment =
  | EventLogService
  | ConsentService
  | SiblingsService
  | GraphSourceService
  | MemoryCompileService
  | ResonanceService;

/** The collections resonance may search for a space: a tenant's own
 *  reflections, and the operator's blessed sources by kind. */
export const collectionsFor = (space: string, sourceKinds: readonly string[]): readonly string[] =>
  space === AGENT_SPACE ? ['reflections'] : ['reflections', ...sourceKinds];

/** What resonance found for a query across collections, as scores by
 *  node id; empty when there is no provider or nothing near. */
const resonate = (
  collections: readonly string[],
  query: string | undefined,
  k: number,
): Effect.Effect<ReadonlyMap<string, number>, never, ResonanceService> =>
  query === undefined
    ? Effect.succeed(new Map())
    : Resonance.pipe(
        Effect.flatMap((resonance) =>
          Effect.forEach((collection: string) => resonance.nearest(collection, query, k))(
            collections,
          ),
        ),
        Effect.map(
          (found) => new Map(found.flat().map((hit: Hit): [string, number] => [hit.id, hit.score])),
        ),
      );

export interface VerbDefinition<I> {
  readonly verb: Verb;
  readonly input: z.ZodType<I>;
  readonly run: (input: I, call: CallContext) => Effect.Effect<unknown, never, VerbEnvironment>;
}

/** The JSON Schema a zod schema emits, in canonical form: what a verb
 *  node carries, what the manifest lists, and what a call is checked
 *  against. Canonical so the frozen signature survives the trip through
 *  the log unchanged (INV-FAB-007). */
const jsonSchemaOf = (schema: z.ZodType): Record<string, unknown> =>
  canonical(z.toJSONSchema(schema, { io: 'input' })) as Record<string, unknown>;

/** A verb node as `init` proposes it into the operator's space:
 *  declared, unblessed, waiting. */
const define = <I>(
  name: string,
  description: string,
  consequence: Verb['consequence'],
  input: z.ZodType<I>,
  output: z.ZodType,
  run: VerbDefinition<I>['run'],
): VerbDefinition<I> => ({
  verb: {
    id: `verb/${name}`,
    space: OPERATOR_SPACE,
    name,
    description,
    consequence,
    inputSchema: jsonSchemaOf(input),
    outputSchema: jsonSchemaOf(output),
    origin: 'declared',
  },
  input,
  run,
});

const state = () =>
  EventLog.pipe(
    Effect.flatMap((log) => log.read()),
    Effect.map(project),
  );

const aperture = (input: {
  readonly query?: string | undefined;
  readonly topK?: number | undefined;
}) => ({
  ...(input.query === undefined ? {} : { query: input.query }),
  ...(input.topK === undefined ? {} : { topK: input.topK }),
});

// ─── slice ────────────────────────────────────────────────────────

const sliceInput = z.object({
  space: z
    .string()
    .min(1)
    .default(AGENT_SPACE)
    .describe('The space to read: your own, or the operator’s through what he has blessed.'),
  query: z.string().min(1).optional().describe('Keep only nodes whose text mentions this.'),
  topK: z.number().int().min(1).optional().describe('Keep at most this many, newest first.'),
});

const sliceOutput = z.object({}).passthrough();

export const slice = define(
  'slice',
  'Load a space for this turn as a slice: nodes, edges, axes, and the proposals still waiting as ghosts. Your own space whole; the operator’s through its blessed sources and what he has blessed across.',
  'observe',
  sliceInput,
  sliceOutput,
  (input, call) =>
    Effect.gen(function* () {
      const source = yield* GraphSource;
      const loaded = yield* source.slice(input.space, {
        viewer: call.space,
        asOf: call.at,
        ...aperture(input),
      });
      const current = yield* state();
      const kinds = sourcesOf(current, input.space).map((entry) => entry.kind);
      const scores = yield* resonate(
        collectionsFor(input.space, kinds),
        input.query,
        input.topK ?? 12,
      );
      return cut(loaded, aperture(input), scores);
    }),
);

// ─── reflect ──────────────────────────────────────────────────────

const reflectInput = z.object({
  attempted: z.string().min(1).describe('What this session set out to do, in one sentence.'),
  observed: z
    .array(z.string().min(1))
    .min(1)
    .describe('What actually happened. Facts a later session can rely on, one per entry.'),
  inferred: z
    .array(z.string().min(1))
    .default([])
    .describe('What you concluded from the observations. Kept apart from them.'),
  shouldChange: z
    .array(changeRequestSchema)
    .default([])
    .describe('What a prompt, skill, verb, or policy should do differently, and why.'),
  cites: z
    .array(citationSchema)
    .default([])
    .describe('The nodes you read, by space and id, with the span if it matters.'),
});

const reflectOutput = z.object({ reflection: z.string(), bridge: z.string() });

export const reflect = define(
  'reflect',
  'Record what this session noticed, in the shape the next session can retrieve. Lands in your own space at once; a proposal to carry it into the operator’s memory waits for blessing.',
  'propose',
  reflectInput,
  reflectOutput,
  (input, call) =>
    Effect.gen(function* () {
      const log = yield* EventLog;
      const consent = yield* Consent;
      const body = { ...input, session: call.session, space: call.space, at: call.at };
      const id = `reflection/${call.fingerprint(body).slice(0, 16)}`;
      const reflection = { id, ...body, status: 'nascent' as const };
      yield* log.append({
        kind: 'reflection.recorded',
        at: call.at,
        space: call.space,
        actor: call.session,
        payload: reflection,
      });
      const bridge = yield* consent.propose({
        id: `bridge/${call.fingerprint({ id, to: OPERATOR_SPACE }).slice(0, 16)}`,
        from: call.space,
        to: OPERATOR_SPACE,
        node: id,
        evidence: `session ${call.session}: ${input.attempted}`,
        proposedAt: call.at,
      });
      // The index is recomputable from the log: a derive, not a write.
      yield* Resonance.pipe(Effect.flatMap((resonance) => resonance.refresh('reflections')));
      return { reflection: id, bridge: bridge.id };
    }).pipe(Effect.orDie),
);

// ─── recall ───────────────────────────────────────────────────────

const recallInput = z.object({
  query: z.string().min(1).describe('The question, in plain words.'),
});

const recallOutput = z.object({}).passthrough();

/** The reflections in a slice, as the compile's source turns: each
 *  observation one turn, in the order it was recorded. */
export const turnsFrom = (slice: Slice): readonly SourceTurn[] =>
  slice.nodes
    .filter((node) => node.kind === 'reflection')
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    .flatMap((node, sessionIndex) =>
      (node.summary ?? '').split(' · ').flatMap((text, turnIndex) =>
        text.length === 0
          ? []
          : [
              {
                id: `${node.id}#${turnIndex}`,
                session: node.id,
                date: node.createdAt.slice(0, 10),
                sessionIndex,
                turnIndex,
                role: 'agent',
                text,
              },
            ],
      ),
    );

export const recall = define(
  'recall',
  'Ask your memory a question. Resonance ranks the reflections nearest it; those are compiled into claims and events with their times and quantities, conflicts between them are named, and the compile answers as far as it can. Without a compiler wired, it says so.',
  'observe',
  recallInput,
  recallOutput,
  (input, call) =>
    Effect.gen(function* () {
      const source = yield* GraphSource;
      const compile = yield* MemoryCompile;
      const mine = yield* source.slice(call.space, { viewer: call.space, asOf: call.at });
      const scores = yield* resonate(['reflections'], input.query, 12);
      const nearest = scores.size > 0 ? cut(mine, { query: input.query }, scores) : mine;
      const recollection = yield* compile.recall(turnsFrom(nearest), input.query, call.at);
      return {
        resonance: [...scores.entries()].map(([id, score]) => ({ id, score })),
        ...Option.getOrElse(recollection, () => ({
          compiler: 'none',
          note: 'No memory compiler is wired; use slice.',
        })),
      };
    }),
);

// ─── pending ──────────────────────────────────────────────────────

const pendingInput = z.object({
  space: z.string().min(1).default(OPERATOR_SPACE).describe('The space whose gap to count.'),
});

const pendingOutput = z.object({
  space: z.string(),
  unresolved: z.number(),
  proposals: z.array(z.unknown()),
});

export const pending = define(
  'pending',
  'The proposals still waiting in a space: what has been offered and not yet answered.',
  'observe',
  pendingInput,
  pendingOutput,
  (input) =>
    state().pipe(
      Effect.map((current) => {
        const proposals = pendingIn(current, input.space);
        return { space: input.space, unresolved: proposals.length, proposals };
      }),
    ),
);

// ─── sync ─────────────────────────────────────────────────────────

const syncInput = z.object({});

const syncOutput = z.object({ siblings: z.array(z.unknown()) });

export const sync = define(
  'sync',
  'Report the drift between each sibling repository’s pinned commit and its remote. No pin moves; advancing one is a pull request.',
  'observe',
  syncInput,
  syncOutput,
  () =>
    Siblings.pipe(
      Effect.flatMap((siblings) => siblings.list()),
      Effect.map((siblings) => ({ siblings })),
    ),
);

// ─── The registry ─────────────────────────────────────────────────

/** Every verb the code knows how to run, by name. The manifest decides
 *  which of these a session may see; this decides what a call does. */
export const REGISTRY: ReadonlyMap<string, VerbDefinition<never>> = new Map(
  [slice, reflect, recall, pending, sync].map((definition) => [
    definition.verb.name,
    definition as unknown as VerbDefinition<never>,
  ]),
);

/** The verb nodes `init` proposes, in registry order. */
export const proposedVerbs = (): readonly Verb[] =>
  [...REGISTRY.values()].map((definition) => definition.verb);

/** Why a call cannot proceed, as a message; `undefined` when it can. A
 *  call needs a verb in the manifest (INV-FAB-001) whose blessed
 *  signature the code still matches (INV-FAB-007). */
export function refusal(name: string, manifestVerbs: readonly Verb[]): string | undefined {
  const blessed = manifestFor(OPERATOR_SPACE, '1970-01-01T00:00:00.000Z', manifestVerbs).verbs.find(
    (verb) => verb.name === name,
  );
  const definition = REGISTRY.get(name);
  if (!blessed) {
    return `INV-FAB-001: ${name} is not in the manifest; it is unblessed, retired, or unknown`;
  }
  if (!definition) return `${name} is blessed but this build has no program for it`;
  if (!same(blessed.inputSchema, definition.verb.inputSchema)) {
    return `INV-FAB-007: ${name}'s signature was frozen at blessing and this build's differs; propose it as a new verb`;
  }
  return undefined;
}
