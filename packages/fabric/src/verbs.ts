import { Context, Data, Effect, Option } from 'effect';
import { z } from 'zod';
import { PREDICATES, type Slice } from '@dbd/slice';
import { canonical, same } from './canonical';
import { cut } from './graph';
import {
  bridgesPendingIn,
  crossingsPendingIn,
  patchesPendingIn,
  project,
  sourcesOf,
  type FabricState,
} from './log';
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
  type LogRejected,
  type ResonanceService,
} from './ports';
import {
  CHANGE_TARGETS,
  RUNTIME_ACTOR,
  agentActor,
  authorActor,
  changeRequestSchema,
  citationSchema,
  evaluationSchema,
  outcomeReportSchema,
  type Bridge,
  type Candidate,
  type ChangeTarget,
  type Decision,
  type Evaluation,
  type Patch,
  type RetrievalVerb,
  type Verb,
} from './schema';

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

/** A node's text as the canon holds it now, with its fingerprint: the
 *  base a patch is proposed against. */
export interface NodeText {
  readonly text: string;
  readonly fingerprint: string;
}

/** The canon port: the nodes a patch may change, wherever the shell
 *  keeps them. `read` gives the base; `evaluate` runs what the fabric
 *  can verify on its own before the operator sees the patch; `apply`
 *  writes the body only if the base still matches, and answers whether
 *  it did. Only the operator's terminal calls `apply`. */
export interface CanonService {
  readonly read: (node: string) => Effect.Effect<Option.Option<NodeText>>;
  readonly evaluate: (patch: Patch) => Effect.Effect<Evaluation>;
  readonly apply: (patch: Patch) => Effect.Effect<boolean>;
}
export const Canon = Context.GenericTag<CanonService>('@dbd/fabric/Canon');

export type VerbEnvironment =
  | EventLogService
  | ConsentService
  | SiblingsService
  | GraphSourceService
  | MemoryCompileService
  | ResonanceService
  | CanonService;

// ─── Why a program stops ──────────────────────────────────────────
//
// A verb's program may fail, and the shell answers the caller with the
// reason; a failure is a value, never a thrown exception. The two
// reasons the loop's verbs have are named here.

/** The node named is not one the canon holds, or not one a patch may
 *  change. */
export interface NoSuchNode {
  readonly _tag: 'NoSuchNode';
  readonly node: string;
  readonly message: string;
}
export const NoSuchNode = Data.tagged<NoSuchNode>('NoSuchNode');

/** An outcome was reported for a patch that was never applied, so
 *  there is nothing it could have measured (INV-FAB-009). */
export interface NotApplied {
  readonly _tag: 'NotApplied';
  readonly patch: string;
  readonly message: string;
}
export const NotApplied = Data.tagged<NotApplied>('NotApplied');

/** What a change targets, read off the node's id: `skill/coding` is a
 *  skill. A node outside the four targets is not one a patch may change. */
export const targetOf = (node: string): Option.Option<ChangeTarget> =>
  Option.fromNullable(CHANGE_TARGETS.find((target) => node.startsWith(`${target}/`)));

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

/** A verb's two halves. `run` may fail with a named reason, which the
 *  shell answers with; it never throws. */
export interface VerbDefinition<I> {
  readonly verb: Verb;
  readonly input: z.ZodType<I>;
  /** The sentence the receipt carries: why this call was made, read
   *  off the input. Every agent event has one (INV-FAB-011). */
  readonly becauseOf: (input: I) => string;
  readonly run: (input: I, call: CallContext) => Effect.Effect<unknown, unknown, VerbEnvironment>;
}

/** The one field every verb asks for: why, in a sentence. It is the
 *  context a retrieval is made in and the reason a receipt records. */
const because = z
  .string()
  .min(1)
  .describe(
    'Why this call, in one sentence: the context you are in. It travels with the receipt and is what a later session reads.',
  );

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
  becauseOf: VerbDefinition<I>['becauseOf'],
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
  becauseOf,
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

/** The candidates a cut surfaced, in the order the session saw them:
 *  resonance where it scored the node, mention where a query matched
 *  its text, recency otherwise. */
export const candidatesOf = (
  nodes: readonly { readonly id: string }[],
  scores: ReadonlyMap<string, number>,
  query: string | undefined,
): readonly Candidate[] =>
  nodes.map((node, index) => {
    const score = scores.get(node.id);
    return {
      node: node.id,
      rank: index + 1,
      ...(score === undefined ? {} : { score }),
      by: score === undefined ? (query === undefined ? 'recency' : 'mention') : 'resonance',
    };
  });

/** Record what a retrieval surfaced. Every retrieval is an event, with
 *  its context and every candidate in rank order (INV-FAB-010): the raw
 *  material of R(t), the measure of whether the corpus compounds. */
const surfaced = (
  call: CallContext,
  verb: RetrievalVerb,
  context: string,
  query: string | undefined,
  k: number,
  candidates: readonly Candidate[],
) =>
  EventLog.pipe(
    Effect.flatMap((log) =>
      log.append({
        kind: 'retrieval.surfaced',
        at: call.at,
        space: call.space,
        actor: agentActor(call.session),
        because: context,
        payload: {
          id: `retrieval/${call.fingerprint({ verb, session: call.session, at: call.at, context, query }).slice(0, 16)}`,
          session: call.session,
          at: call.at,
          verb,
          context,
          ...(query === undefined ? {} : { query }),
          k,
          candidates: [...candidates],
        },
      }),
    ),
  );

// ─── slice ────────────────────────────────────────────────────────

const sliceInput = z.object({
  space: z
    .string()
    .min(1)
    .default(AGENT_SPACE)
    .describe('The space to read: your own, or the operator’s through what he has blessed.'),
  query: z.string().min(1).optional().describe('Keep only nodes whose text mentions this.'),
  topK: z.number().int().min(1).optional().describe('Keep at most this many, newest first.'),
  because,
});

const sliceOutput = z.object({}).passthrough();

export const slice = define(
  'slice',
  'Load a space for this turn as a slice: nodes, edges, axes, and the proposals still waiting as ghosts. Your own space whole; the operator’s through its blessed sources and what he has blessed across.',
  'observe',
  sliceInput,
  sliceOutput,
  (input) => input.because,
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
      const seen = cut(loaded, aperture(input), scores);
      yield* surfaced(
        call,
        'slice',
        input.because,
        input.query,
        input.topK ?? seen.nodes.length,
        candidatesOf(seen.nodes, scores, input.query),
      );
      return seen;
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
    .describe(
      'What a prompt, skill, verb, or policy should do differently, and why. A wish; `patch` is the change.',
    ),
  outcomes: z
    .array(outcomeReportSchema)
    .default([])
    .describe(
      'For each applied patch `orient` showed you: was its hypothesis confirmed or contradicted by this session, and why.',
    ),
  cites: z
    .array(citationSchema)
    .default([])
    .describe('The nodes you read, by space and id, with the span if it matters.'),
});

const reflectOutput = z.object({
  reflection: z.string(),
  crossing: z.string(),
  outcomes: z.number(),
});

/** The outcomes a reflection reports, each checked against the log:
 *  an outcome measures an applied patch or it measures nothing. */
const outcomesOf = (
  input: z.infer<typeof reflectInput>,
  call: CallContext,
): Effect.Effect<readonly Patch[], NotApplied, EventLogService> =>
  state().pipe(
    Effect.flatMap((current) =>
      Effect.forEach((report: z.infer<typeof outcomeReportSchema>) => {
        const patch = current.patches.get(report.patch);
        return patch?.applied
          ? Effect.succeed(patch)
          : Effect.fail(
              NotApplied({
                patch: report.patch,
                message: `INV-FAB-009: ${report.patch} was never applied, so nothing measured it; session ${call.session} reports it ${report.outcome}`,
              }),
            );
      })(input.outcomes),
    ),
  );

export const reflect = define(
  'reflect',
  'Record what this session noticed, in the shape the next session can retrieve. Lands in your own space at once; a crossing to carry it into the operator’s memory waits for his blessing. Outcomes you report on applied patches are the loop’s own measure.',
  'propose',
  reflectInput,
  reflectOutput,
  (input) => input.attempted,
  (input, call) =>
    Effect.gen(function* () {
      const log = yield* EventLog;
      const consent = yield* Consent;
      const measured = yield* outcomesOf(input, call);
      const body = { ...input, session: call.session, space: call.space, at: call.at };
      const id = `reflection/${call.fingerprint(body).slice(0, 16)}`;
      const reflection = { id, ...body, status: 'nascent' as const };
      yield* log.append({
        kind: 'reflection.recorded',
        at: call.at,
        space: call.space,
        actor: agentActor(call.session),
        because: input.attempted,
        payload: reflection,
      });
      yield* Effect.forEach((report: z.infer<typeof outcomeReportSchema>, index: number) =>
        log.append({
          kind: 'patch.outcome',
          at: call.at,
          space: measured[index]?.space ?? OPERATOR_SPACE,
          actor: agentActor(call.session),
          causedBy: id,
          because: report.because,
          payload: { ...report, session: call.session, at: call.at },
        }),
      )(input.outcomes);
      const crossing = yield* consent.propose(
        {
          id: `crossing/${call.fingerprint({ id, to: OPERATOR_SPACE }).slice(0, 16)}`,
          from: call.space,
          to: OPERATOR_SPACE,
          node: id,
          evidence: `session ${call.session}: ${input.attempted}`,
          proposedAt: call.at,
        },
        agentActor(call.session),
      );
      // The index is recomputable from the log: a derive, not a write.
      yield* Resonance.pipe(Effect.flatMap((resonance) => resonance.refresh('reflections')));
      return { reflection: id, crossing: crossing.id, outcomes: input.outcomes.length };
    }),
);

// ─── patch ────────────────────────────────────────────────────────

const patchInput = z.object({
  node: z
    .string()
    .min(1)
    .describe('The node to change, by id, as the operator’s slice names it: today `skill/<name>`.'),
  body: z.string().min(1).describe('The node’s whole new text. A patch is the text, not a diff.'),
  because: z.string().min(1).describe('What you observed that this change answers.'),
  hypothesis: z
    .string()
    .min(1)
    .describe(
      'What the next session should observe if the change worked, stated so it can fail. It is what that session reports on.',
    ),
});

const patchOutput = z.object({
  patch: z.string(),
  base: z.string(),
  evaluation: evaluationSchema,
});

export const patch = define(
  'patch',
  'Propose a change to one of the operator’s nodes: its whole new text, against the base you read, with why and what should be observable if it worked. The fabric evaluates what it can and the patch waits in his space; only his terminal applies it, and only to the base you named.',
  'propose',
  patchInput,
  patchOutput,
  (input) => input.because,
  (input, call) =>
    Effect.gen(function* () {
      const canon = yield* Canon;
      const log = yield* EventLog;
      const target = yield* Option.match(targetOf(input.node), {
        onNone: () =>
          Effect.fail(
            NoSuchNode({
              node: input.node,
              message: `${input.node} is not a node a patch may change; a patch targets ${CHANGE_TARGETS.join(', ')}`,
            }),
          ),
        onSome: Effect.succeed,
      });
      const base = yield* canon.read(input.node).pipe(
        Effect.flatMap(
          Option.match({
            onNone: () =>
              Effect.fail(
                NoSuchNode({
                  node: input.node,
                  message: `${input.node} is not in the canon; read the operator's slice for what is`,
                }),
              ),
            onSome: Effect.succeed,
          }),
        ),
      );
      const proposed: Patch = {
        id: `patch/${call.fingerprint({ node: input.node, body: input.body, base: base.fingerprint, session: call.session, at: call.at }).slice(0, 16)}`,
        space: OPERATOR_SPACE,
        node: input.node,
        target,
        baseFingerprint: base.fingerprint,
        body: input.body,
        because: input.because,
        hypothesis: input.hypothesis,
        proposedAt: call.at,
        proposedBy: call.session,
        decision: null,
        applied: false,
      };
      yield* log.append({
        kind: 'patch.proposed',
        at: call.at,
        space: OPERATOR_SPACE,
        actor: agentActor(call.session),
        because: input.because,
        payload: proposed,
      });
      const evaluation = yield* canon.evaluate(proposed);
      yield* log.append({
        kind: 'patch.evaluated',
        at: evaluation.at,
        space: OPERATOR_SPACE,
        actor: RUNTIME_ACTOR,
        causedBy: proposed.id,
        payload: evaluation,
      });
      return { patch: proposed.id, base: base.fingerprint, evaluation };
    }),
);

// ─── bridge ───────────────────────────────────────────────────────
//
// A bridge is a relation with evidence: this node, that node, one of
// the engine's predicates, and the span or observation that shows it.
// It lands in the space it names. A session's own space answers at
// once, because the session is that space's sovereign and a tenant
// sees its own space whole (INV-FAB-006); the operator's waits for his
// terminal. Blessed, the bridge is an edge in that space's slice, and
// the operator's own wiki links are the same edge reached by writing.

const bridgeInput = z.object({
  subject: z
    .string()
    .min(1)
    .describe('The node the relation starts from, by id as a slice names it.'),
  predicate: z
    .enum(PREDICATES)
    .describe(
      'The relation, from the engine’s closed set: references, is_a, expands_on, responds_to, contradicts, part_of, inspired_by, succeeds.',
    ),
  object: z.string().min(1).describe('The node the relation reaches, by id.'),
  evidence: z
    .string()
    .min(1)
    .describe(
      'What shows the relation: the span you read, or the observation, quoted so the sovereign can check it.',
    ),
  space: z
    .string()
    .min(1)
    .default(OPERATOR_SPACE)
    .describe(
      'Where the relation lands. Your own space answers at once; the operator’s waits for his blessing.',
    ),
  because,
});

const bridgeOutput = z.object({
  bridge: z.string(),
  space: z.string(),
  decision: z.enum(['blessed']).nullable(),
});

/** A bridge whose ends are the same node relates nothing. */
export interface NotARelation {
  readonly _tag: 'NotARelation';
  readonly message: string;
}
export const NotARelation = Data.tagged<NotARelation>('NotARelation');

export const bridge = define(
  'bridge',
  'Relate two nodes with evidence: subject, predicate from the engine’s set, object, and the span that shows it. In your own space it is an edge at once; in the operator’s it waits for his blessing, and blessed it is an edge in his slice.',
  'propose',
  bridgeInput,
  bridgeOutput,
  (input) => input.because,
  (input, call) =>
    Effect.gen(function* () {
      const log = yield* EventLog;
      if (input.subject === input.object) {
        return yield* Effect.fail(
          NotARelation({
            message: `INV-FAB-012: a bridge relates two nodes; ${input.subject} to itself is not a relation`,
          }),
        );
      }
      const own = input.space === call.space;
      const proposed: Bridge = {
        id: `bridge/${call.fingerprint({ subject: input.subject, predicate: input.predicate, object: input.object, space: input.space, session: call.session, at: call.at }).slice(0, 16)}`,
        space: input.space,
        subject: input.subject,
        predicate: input.predicate,
        object: input.object,
        evidence: input.evidence,
        proposedAt: call.at,
        proposedBy: call.session,
        decision: null,
      };
      yield* log.append({
        kind: 'bridge.proposed',
        at: call.at,
        space: input.space,
        actor: agentActor(call.session),
        because: input.because,
        payload: proposed,
      });
      if (own) {
        yield* log.append({
          kind: 'bridge.resolved',
          at: call.at,
          space: input.space,
          actor: authorActor(call.space),
          causedBy: proposed.id,
          payload: { bridge: proposed.id, decision: 'blessed', by: call.space, at: call.at },
        });
      }
      return {
        bridge: proposed.id,
        space: input.space,
        decision: own ? ('blessed' as const) : null,
      };
    }),
);

// ─── recall ───────────────────────────────────────────────────────

const recallInput = z.object({
  query: z.string().min(1).describe('The question, in plain words.'),
  because,
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
  (input) => input.because,
  (input, call) =>
    Effect.gen(function* () {
      const source = yield* GraphSource;
      const compile = yield* MemoryCompile;
      const mine = yield* source.slice(call.space, { viewer: call.space, asOf: call.at });
      const scores = yield* resonate(['reflections'], input.query, 12);
      const nearest = scores.size > 0 ? cut(mine, { query: input.query }, scores) : mine;
      yield* surfaced(
        call,
        'recall',
        input.because,
        input.query,
        12,
        candidatesOf(nearest.nodes, scores, scores.size > 0 ? input.query : undefined),
      );
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
  because,
});

const pendingOutput = z.object({
  space: z.string(),
  unresolved: z.number(),
  crossings: z.array(z.unknown()),
  bridges: z.array(z.unknown()),
  patches: z.array(z.unknown()),
});

export const pending = define(
  'pending',
  'What is still waiting in a space: the crossings to carry a node in, the bridges to relate two, and the patches to change one, each with what the fabric could check. Offered and not yet answered.',
  'observe',
  pendingInput,
  pendingOutput,
  (input) => input.because,
  (input) =>
    state().pipe(
      Effect.map((current) => {
        const crossings = crossingsPendingIn(current, input.space);
        const bridges = bridgesPendingIn(current, input.space);
        const patches = patchesPendingIn(current, input.space);
        return {
          space: input.space,
          unresolved: crossings.length + bridges.length + patches.length,
          crossings,
          bridges,
          patches,
        };
      }),
    ),
);

// ─── sync ─────────────────────────────────────────────────────────

const syncInput = z.object({ because });

const syncOutput = z.object({ siblings: z.array(z.unknown()) });

export const sync = define(
  'sync',
  'Report the drift between each sibling repository’s pinned commit and its remote. No pin moves; advancing one is a pull request.',
  'observe',
  syncInput,
  syncOutput,
  (input) => input.because,
  () =>
    Siblings.pipe(
      Effect.flatMap((siblings) => siblings.list()),
      Effect.map((siblings) => ({ siblings })),
    ),
);

// ─── The operator's answer to a patch ─────────────────────────────
//
// Not a verb: no session may call it. The terminal runs it, as it runs
// blessing. A blessed patch is applied to the canon first, only if the
// base it named is still the base, and the resolution records whether
// it was; a rejected patch is kept, as data, and touches nothing.

/** The node moved since the patch was proposed, so the patch cannot be
 *  applied as it stands; a new patch against the new base is the way
 *  through (INV-FAB-008). */
export interface BaseMoved {
  readonly _tag: 'BaseMoved';
  readonly patch: string;
  readonly message: string;
}
export const BaseMoved = Data.tagged<BaseMoved>('BaseMoved');

/** The patch named is not waiting: unknown, or already answered. */
export interface NotWaiting {
  readonly _tag: 'NotWaiting';
  readonly patch: string;
  readonly message: string;
}
export const NotWaiting = Data.tagged<NotWaiting>('NotWaiting');

export const decidePatch = (
  id: string,
  decision: Decision,
  by: string,
  at: string,
): Effect.Effect<Patch, BaseMoved | NotWaiting | LogRejected, EventLogService | CanonService> =>
  Effect.gen(function* () {
    const log = yield* EventLog;
    const canon = yield* Canon;
    const current = yield* state();
    const patch = current.patches.get(id);
    if (patch?.decision !== null) {
      return yield* Effect.fail(
        NotWaiting({ patch: id, message: `${id} is not waiting; nothing to decide` }),
      );
    }
    const applied = decision === 'blessed' ? yield* canon.apply(patch) : false;
    if (decision === 'blessed' && !applied) {
      return yield* Effect.fail(
        BaseMoved({
          patch: id,
          message: `INV-FAB-008: ${patch.node} moved since ${id} was proposed against it; the patch stays waiting, and a new patch against the new base is the way through`,
        }),
      );
    }
    yield* log.append({
      kind: 'patch.resolved',
      at,
      space: patch.space,
      actor: authorActor(by),
      causedBy: patch.id,
      payload: { patch: patch.id, decision, by, at, applied },
    });
    return { ...patch, decision, decidedAt: at, decidedBy: by, applied };
  });

/** The patches applied in a space whose hypotheses no session has
 *  reported on yet: what `orient` shows a session so it can. */
export const unmeasuredIn = (current: FabricState, space: string): readonly Patch[] => {
  const measured = new Set(current.outcomes.map((outcome) => outcome.patch));
  return [...current.patches.values()].filter(
    (patch) => patch.space === space && patch.applied && !measured.has(patch.id),
  );
};

// ─── The sovereign's answer to a bridge ───────────────────────────
//
// Not a verb either. A bridge waits in the space it names until that
// space's sovereign answers; the answer is an event, and the first one
// wins (INV-FAB-012).

export const decideBridge = (
  id: string,
  decision: Decision,
  by: string,
  at: string,
): Effect.Effect<Bridge, NotWaiting | LogRejected, EventLogService> =>
  Effect.gen(function* () {
    const log = yield* EventLog;
    const current = yield* state();
    const waiting = current.bridges.get(id);
    if (waiting?.decision !== null) {
      return yield* Effect.fail(
        NotWaiting({ patch: id, message: `${id} is not waiting; nothing to decide` }),
      );
    }
    yield* log.append({
      kind: 'bridge.resolved',
      at,
      space: waiting.space,
      actor: authorActor(by),
      causedBy: waiting.id,
      payload: { bridge: waiting.id, decision, by, at },
    });
    return { ...waiting, decision, decidedAt: at, decidedBy: by };
  });

// ─── The registry ─────────────────────────────────────────────────

/** Every verb the code knows how to run, by name. The manifest decides
 *  which of these a session may see; this decides what a call does. */
export const REGISTRY: ReadonlyMap<string, VerbDefinition<never>> = new Map(
  [slice, reflect, patch, bridge, recall, pending, sync].map((definition) => [
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
