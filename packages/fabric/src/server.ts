import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { project } from './log';
import { manifestFor, toolsFrom, type ToolListing } from './manifest';
import { fileEventLog } from './node/file-log';
import { fingerprint } from './node/fingerprint';
import { gitSiblings } from './node/siblings';
import { consentOverLog, EventLog, type ConsentService, type EventLogService } from './ports';
import {
  AGENT_SPACE,
  OPERATOR_SPACE,
  REGISTRY,
  refusal,
  type CallContext,
  type SiblingsService,
} from './verbs';

// ─── The session shell ────────────────────────────────────────────
//
// The one place an effect is performed. A session starts this server
// over stdio and ends it. Listing tools is reading the manifest;
// calling one is running its program and appending a receipt. The
// handlers take a runner so a test can drive them over the in-memory
// log; `serve` wires the file log, consent over it, and git.
//
// Two handshakes meet here without loss: the Model Context Protocol's
// tool listing takes the JSON Schema a verb carries as data, verbatim;
// and the log's `kind` discriminator is the same shape the protocol's
// own request schemas use, so nothing is translated on either side.

export type Runner = <A>(
  effect: Effect.Effect<A, unknown, EventLogService | ConsentService | SiblingsService>,
) => Promise<A>;

export interface ToolResult {
  readonly content: readonly { readonly type: 'text'; readonly text: string }[];
  readonly isError?: boolean;
}

const text = (value: unknown): ToolResult => ({
  content: [
    { type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) },
  ],
});

const failure = (message: string): ToolResult => ({ ...text(message), isError: true });

const currentState = EventLog.pipe(
  Effect.flatMap((log) => log.read()),
  Effect.map(project),
);

/** A failure as one line, whatever was thrown. */
export const reasonOf = (cause: unknown): string =>
  cause instanceof Error ? cause.message : JSON.stringify(cause);

/** The manifest of the operator's space, as tools. */
export const handleList = (run: Runner, at: string): Promise<readonly ToolListing[]> =>
  run(
    currentState.pipe(
      Effect.map((state) => toolsFrom(manifestFor(OPERATOR_SPACE, at, state.verbs.values()))),
    ),
  );

/** One call: refuse, or parse, run, receipt, and answer. */
export const handleCall = (
  run: Runner,
  call: CallContext,
  name: string,
  args: unknown,
): Promise<ToolResult> =>
  run(
    Effect.gen(function* () {
      const state = yield* currentState;
      const why = refusal(name, [...state.verbs.values()]);
      if (why !== undefined) return failure(why);
      const definition = REGISTRY.get(name);
      if (!definition) return failure(`${name} has no program in this build`);
      const parsed = definition.input.safeParse(args ?? {});
      if (!parsed.success) return failure(`${name}: ${parsed.error.message}`);
      const output = yield* definition.run(parsed.data, call);
      const log = yield* EventLog;
      yield* log.append({
        kind: 'verb.called',
        at: call.at,
        space: call.space,
        payload: {
          id: `receipt/${call.fingerprint({ name, session: call.session, at: call.at, args }).slice(0, 16)}`,
          verb: definition.verb.id,
          space: call.space,
          session: call.session,
          at: call.at,
          consequence: definition.verb.consequence,
          inputFingerprint: call.fingerprint(parsed.data),
          outputFingerprint: call.fingerprint(output),
        },
      });
      return text(output);
    }).pipe(Effect.catchAll((cause) => Effect.succeed(failure(reasonOf(cause))))),
  );

/** Where the fabric keeps its log and its session mark, under a root. */
export const paths = (root: string) => ({
  spaces: path.join(root, 'fabric', 'spaces'),
  session: path.join(root, 'fabric', '.session'),
});

/** The layers a real shell provides: the file log, consent over it,
 *  and the siblings through git. */
export const layersFor = (root: string) => {
  const log = fileEventLog(paths(root).spaces);
  return Layer.mergeAll(log, Layer.provide(consentOverLog, log), gitSiblings(root));
};

/** One runtime over a layer, built once, so every call shares the
 *  same log rather than a fresh one. */
export const runnerOver = (
  layer: Layer.Layer<EventLogService | ConsentService | SiblingsService>,
): Runner => {
  const runtime = ManagedRuntime.make(layer);
  return (effect) => runtime.runPromise(effect);
};

export const runnerFor = (root: string): Runner => runnerOver(layersFor(root));

/** The session the start hook marked, or an honest stand-in. */
export const readSession = async (root: string): Promise<string> => {
  const raw = await readFile(paths(root).session, 'utf8').catch(() => '');
  const parsed: unknown = raw ? JSON.parse(raw) : {};
  const id =
    typeof parsed === 'object' && parsed !== null && 'session_id' in parsed
      ? String(parsed.session_id)
      : '';
  return id || `session/unmarked-${process.pid}`;
};

const callContext = (session: string): CallContext => ({
  session,
  at: new Date().toISOString(),
  space: AGENT_SPACE,
  fingerprint,
});

/** Serve the fabric over stdio until the session ends. */
export const serve = async (root: string): Promise<void> => {
  const run = runnerFor(root);
  const session = await readSession(root);
  const server = new Server(
    { name: '@dbd/fabric', version: '0.0.0' },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...(await handleList(run, new Date().toISOString()))],
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await handleCall(
      run,
      callContext(session),
      request.params.name,
      request.params.arguments,
    );
    return { content: [...result.content], ...(result.isError ? { isError: true } : {}) };
  });
  await server.connect(new StdioServerTransport());
};
