import { Context, Effect } from 'effect';
import { z } from 'zod';
import { canonical, same } from './canonical';
import { sliceFromState } from './graph';
import { pendingIn, project } from './log';
import { manifestFor } from './manifest';
import { Consent, EventLog, type ConsentService, type EventLogService } from './ports';
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

export interface VerbDefinition<I> {
  readonly verb: Verb;
  readonly input: z.ZodType<I>;
  readonly run: (
    input: I,
    call: CallContext,
  ) => Effect.Effect<unknown, never, EventLogService | ConsentService | SiblingsService>;
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

// ─── slice ────────────────────────────────────────────────────────

const sliceInput = z.object({
  query: z.string().min(1).optional().describe('Keep only reflections whose text contains this.'),
  topK: z.number().int().min(1).optional().describe('Keep at most this many, newest first.'),
});

const sliceOutput = z.object({}).passthrough();

export const slice = define(
  'slice',
  'Load your memory for this turn: the reflections you may see, newest first, with the proposals still waiting as ghosts.',
  'observe',
  sliceInput,
  sliceOutput,
  (input, call) =>
    state().pipe(
      Effect.map((current) =>
        sliceFromState(current, call.space, call.at, {
          ...(input.query === undefined ? {} : { query: input.query }),
          ...(input.topK === undefined ? {} : { topK: input.topK }),
        }),
      ),
    ),
);

// ─── reflect ──────────────────────────────────────────────────────

const reflectInput = z.object({
  attempted: z.string().min(1).describe('What this session set out to do, in one sentence.'),
  observed: z
    .array(z.string().min(1))
    .min(1)
    .describe('What actually happened. Facts a later session can rely on.'),
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
      return { reflection: id, bridge: bridge.id };
    }).pipe(Effect.orDie),
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
  [slice, reflect, pending, sync].map((definition) => [
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
  if (!blessed)
    return `INV-FAB-001: ${name} is not in the manifest; it is unblessed, retired, or unknown`;
  if (!definition) return `${name} is blessed but this build has no program for it`;
  if (!same(blessed.inputSchema, definition.verb.inputSchema)) {
    return `INV-FAB-007: ${name}'s signature was frozen at blessing and this build's differs; propose it as a new verb`;
  }
  return undefined;
}
