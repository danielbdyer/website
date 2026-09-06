import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { describe, eventJsonSchema, readmeFrom, RESOURCES } from './describe';
import { project } from './log';
import { manifestFor, toolsFrom, type ToolListing } from './manifest';
import { pythonMemoryCompile } from './node/compile';
import { fileEventLog } from './node/file-log';
import { fingerprint } from './node/fingerprint';
import { graphSourceFor } from './node/graph-source';
import { MEMORY_DIR, qmdResonance } from './node/qmd';
import { gitSiblings } from './node/siblings';
import { consentOverLog, EventLog } from './ports';
import { sourcesOf } from './log';
import {
  AGENT_SPACE,
  OPERATOR_SPACE,
  REGISTRY,
  refusal,
  type CallContext,
  type VerbEnvironment,
} from './verbs';

// ─── The session shell ────────────────────────────────────────────
//
// The one place an effect is performed. A session starts this server
// over stdio and ends it. Listing tools is reading the manifest;
// calling one is running its program and appending a receipt; refusing
// one is an event too. Reading a resource is reading the fabric's own
// description. The handlers take a runner so a test can drive them
// over the in-memory log; `serve` wires the file log, consent over it,
// the sources on disk, the compile sidecar, and git.

export type Runner = <A>(effect: Effect.Effect<A, unknown, VerbEnvironment>) => Promise<A>;

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

/** One call: refuse and record the refusal, or parse, run, receipt, and
 *  answer. */
export const handleCall = (
  run: Runner,
  call: CallContext,
  name: string,
  args: unknown,
): Promise<ToolResult> =>
  run(
    Effect.gen(function* () {
      const state = yield* currentState;
      const log = yield* EventLog;
      const why = refusal(name, [...state.verbs.values()]);
      if (why !== undefined) {
        yield* log.append({
          kind: 'verb.refused',
          at: call.at,
          space: call.space,
          actor: call.session,
          payload: { verb: name, session: call.session, at: call.at, reason: why },
        });
        return failure(why);
      }
      const definition = REGISTRY.get(name);
      if (!definition) return failure(`${name} has no program in this build`);
      const parsed = definition.input.safeParse(args ?? {});
      if (!parsed.success) return failure(`${name}: ${parsed.error.message}`);
      const output = yield* definition.run(parsed.data, call);
      const id = `receipt/${call.fingerprint({ name, session: call.session, at: call.at, args }).slice(0, 16)}`;
      yield* log.append({
        kind: 'verb.called',
        at: call.at,
        space: call.space,
        actor: call.session,
        payload: {
          id,
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

export interface Resource {
  readonly uri: string;
  readonly name: string;
  readonly mimeType: string;
  readonly text: string;
}

/** The fabric's description, as resources any client can read. */
export const handleResources = (run: Runner): Promise<readonly Resource[]> =>
  run(
    currentState.pipe(
      Effect.map((state) => {
        const description = describe(state);
        return [
          {
            uri: RESOURCES[0],
            name: 'The fabric, described',
            mimeType: 'application/json',
            text: JSON.stringify(description, null, 2),
          },
          {
            uri: RESOURCES[1],
            name: 'The event log’s schema',
            mimeType: 'application/schema+json',
            text: JSON.stringify(eventJsonSchema(), null, 2),
          },
          {
            uri: RESOURCES[2],
            name: 'How to speak to the fabric',
            mimeType: 'text/markdown',
            text: readmeFrom(description),
          },
        ];
      }),
    ),
  );

/** Where the fabric keeps its log and its session mark, under a root. */
export const paths = (root: string) => ({
  spaces: path.join(root, 'fabric', 'spaces'),
  session: path.join(root, 'fabric', '.session'),
  manifest: path.join(root, 'fabric', 'manifest.json'),
  eventsSchema: path.join(root, 'fabric', 'events.schema.json'),
  readme: path.join(root, 'fabric', 'README.md'),
});

/** The layers a real shell provides: the file log, consent over it,
 *  the sources on disk, the compile sidecar, and the siblings. */
export const layersFor = (root: string) => {
  const log = fileEventLog(paths(root).spaces);
  const state = () => ManagedRuntime.make(log).runPromise(currentState);
  const resonance = qmdResonance(root, async () => {
    const current = await state();
    return {
      reflections: [...current.reflections.values()],
      collections: [
        { name: 'reflections', folder: MEMORY_DIR },
        ...sourcesOf(current, OPERATOR_SPACE).map((source) => ({
          name: source.kind,
          folder: source.kind === 'vault' ? path.join(source.path, 'notes') : source.path,
        })),
      ],
    };
  });
  return Layer.mergeAll(
    log,
    Layer.provide(consentOverLog, log),
    Layer.provide(graphSourceFor(root), log),
    pythonMemoryCompile(root),
    resonance,
    gitSiblings(root),
  );
};

/** One runtime over a layer, built once, so every call shares the
 *  same log rather than a fresh one. */
export const runnerOver = (layer: Layer.Layer<VerbEnvironment>): Runner => {
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
    { capabilities: { tools: {}, resources: {} } },
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
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = await handleResources(run);
    return { resources: resources.map(({ uri, name, mimeType }) => ({ uri, name, mimeType })) };
  });
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resources = await handleResources(run);
    const found = resources.find((resource) => resource.uri === request.params.uri);
    return {
      contents: found
        ? [{ uri: found.uri, mimeType: found.mimeType, text: found.text }]
        : [{ uri: request.params.uri, mimeType: 'text/plain', text: 'no such resource' }],
    };
  });
  await server.connect(new StdioServerTransport());
};
