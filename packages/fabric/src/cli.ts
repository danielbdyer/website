import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Effect } from 'effect';
import { homeOf, pendingIn, project, visibleReflections, type FabricState } from './log';
import { manifestFor } from './manifest';
import { Consent, EventLog } from './ports';
import type { Reflection, Space } from './schema';
import { paths, readSession, runnerFor, serve, type Runner } from './server';
import { AGENT_SPACE, OPERATOR_SPACE, proposedVerbs } from './verbs';

// ─── The sovereign's terminal, and the hooks ──────────────────────
//
// `init` opens the two spaces and proposes the verbs, unblessed.
// `bless` and `reject` are the operator's, from the terminal, per
// CATHEDRALS.md §"Git Is the Vessel": blessing happens where it
// already happens, and the commit that follows is its record.
// `orient` and `stop-check` are the two hooks a session runs: the
// first marks the session and prints its memory into context; the
// second asks for a reflection if none was recorded.
//
// Both hooks are a handshake with no loss: Claude Code hands a hook
// its session id as JSON on stdin, takes a start hook's stdout into
// the session's context, and takes `{ decision: "block", reason }` on
// a stop hook's stdout as the reason the session must keep going.

const root = process.cwd();
const run: Runner = runnerFor(root);
const now = (): string => new Date().toISOString();

/** What the terminal or the hook prints. `console` is the site's
 *  chrome; a shell speaks through stdout. */
const say = (text: string): void => {
  process.stdout.write(`${text}\n`);
};

const spaces: readonly Space[] = [
  { id: OPERATOR_SPACE, kind: 'operator', sovereign: OPERATOR_SPACE },
  { id: AGENT_SPACE, kind: 'agent', sovereign: AGENT_SPACE },
];

const state = (): Promise<FabricState> =>
  run(
    EventLog.pipe(
      Effect.flatMap((log) => log.read()),
      Effect.map(project),
    ),
  );

/** JSON from stdin when a hook is calling; nothing when a person is. */
const hookInput = (): Record<string, unknown> => {
  if (process.stdin.isTTY) return {};
  const raw = (() => {
    try {
      return readFileSync(0, 'utf8');
    } catch {
      return '';
    }
  })();
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const init = async (): Promise<void> => {
  const current = await state();
  const at = now();
  const opened = spaces.filter((space) => !current.spaces.has(space.id));
  const proposed = proposedVerbs().filter((verb) => !current.verbs.has(verb.id));
  await run(
    EventLog.pipe(
      Effect.flatMap((log) =>
        Effect.forEach(
          [
            ...opened.map((space) => ({
              kind: 'space.opened' as const,
              at,
              space: space.id,
              payload: space,
            })),
            ...proposed.map((verb) => ({
              kind: 'verb.proposed' as const,
              at,
              space: verb.space,
              payload: verb,
            })),
          ],
          (event) => log.append(event),
        ),
      ),
    ),
  );
  const after = await state();
  const waiting = [...after.verbs.values()].flatMap((verb) =>
    verb.blessedAt === undefined ? [verb.name] : [],
  );
  say(
    `opened ${opened.length} space(s); proposed ${proposed.length} verb(s). ` +
      `Waiting for blessing: ${waiting.join(', ') || 'none'}.`,
  );
};

const bless = async (
  target: string | undefined,
  decision: 'blessed' | 'rejected',
): Promise<void> => {
  if (!target) {
    console.error('name a verb or a bridge id');
    process.exitCode = 2;
    return;
  }
  const current = await state();
  const at = now();
  const verb = [...current.verbs.values()].find(
    (entry) => entry.name === target || entry.id === target,
  );
  if (verb) {
    if (decision === 'rejected') {
      console.error('a verb is retired, not rejected; retire is held');
      process.exitCode = 2;
      return;
    }
    await run(
      EventLog.pipe(
        Effect.flatMap((log) =>
          log.append({
            kind: 'verb.blessed',
            at,
            space: verb.space,
            payload: {
              verb: verb.id,
              by: current.spaces.get(verb.space)?.sovereign ?? OPERATOR_SPACE,
              at,
            },
          }),
        ),
      ),
    );
    say(`blessed ${verb.name} into the manifest of ${verb.space}`);
    return;
  }
  const bridge = current.bridges.get(target);
  if (!bridge) {
    console.error(`nothing named ${target} is waiting`);
    process.exitCode = 2;
    return;
  }
  const by = current.spaces.get(bridge.to)?.sovereign ?? OPERATOR_SPACE;
  await run(
    Consent.pipe(Effect.flatMap((consent) => consent.resolve(bridge.id, decision, by, at))),
  );
  say(`${decision} ${bridge.node} into ${bridge.to}`);
};

const describe = (current: FabricState, reflection: Reflection): string => {
  const home = homeOf(current, reflection);
  const changes = reflection.shouldChange.map(
    (change) => `${change.target} ${change.node}: ${change.change}`,
  );
  return [
    `- [${home}] ${reflection.at} — ${reflection.attempted}`,
    `  observed: ${reflection.observed.join('; ')}`,
    ...(reflection.inferred.length > 0 ? [`  inferred: ${reflection.inferred.join('; ')}`] : []),
    ...(changes.length > 0 ? [`  should change: ${changes.join('; ')}`] : []),
  ].join('\n');
};

const orient = async (): Promise<void> => {
  const input = hookInput();
  const session =
    typeof input.session_id === 'string' && input.session_id ? input.session_id : undefined;
  if (session) {
    await mkdir(path.dirname(paths(root).session), { recursive: true });
    await writeFile(
      paths(root).session,
      JSON.stringify({ session_id: session, started_at: now() }),
      'utf8',
    );
  }
  const current = await state();
  const manifest = manifestFor(OPERATOR_SPACE, now(), current.verbs.values());
  const unblessed = [...current.verbs.values()].filter(
    (verb) => verb.blessedAt === undefined && verb.retiredAt === undefined,
  );
  const waiting = pendingIn(current, OPERATOR_SPACE);
  const memory = visibleReflections(current, AGENT_SPACE)
    .toSorted((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  say(
    [
      '## The fabric',
      `Session ${session ?? (await readSession(root))}, acting as \`${AGENT_SPACE}\`. The log is \`fabric/spaces/\`.`,
      manifest.verbs.length > 0
        ? `Manifest of \`${OPERATOR_SPACE}\`: ${manifest.verbs.map((verb) => `\`${verb.name}\` (${verb.consequence})`).join(', ')}.`
        : `No verb is blessed yet, so the manifest is empty.`,
      ...(unblessed.length > 0
        ? [
            `Waiting for the operator's blessing: ${unblessed.map((verb) => `\`pnpm fabric bless ${verb.name}\``).join(', ')}.`,
          ]
        : []),
      `Waiting in \`${OPERATOR_SPACE}\`: ${waiting.length} proposal(s).`,
      memory.length > 0 ? 'Memory, newest first:' : 'Memory: nothing recorded yet.',
      ...memory.map((reflection) => describe(current, reflection)),
      'Before ending, record what this session noticed with `reflect`. The stop hook asks once if nothing was recorded.',
    ].join('\n'),
  );
};

const stopCheck = async (): Promise<void> => {
  const input = hookInput();
  const session = typeof input.session_id === 'string' ? input.session_id : await readSession(root);
  if (input.stop_hook_active === true) return;
  const current = await state();
  const recorded = [...current.reflections.values()].some(
    (reflection) => reflection.session === session,
  );
  if (recorded) return;
  say(
    JSON.stringify({
      decision: 'block',
      reason:
        'No reflection was recorded for this session. Call the fabric’s `reflect` tool once — what was attempted, what was observed, what was inferred, what should change, what was cited — then end.',
    }),
  );
};

const showPending = async (): Promise<void> => {
  const current = await state();
  const waiting = pendingIn(current, OPERATOR_SPACE);
  say(
    waiting.length === 0
      ? `nothing is waiting in ${OPERATOR_SPACE}`
      : waiting
          .map(
            (bridge) =>
              `${bridge.id}  ${bridge.node}  from ${bridge.from}  ${bridge.proposedAt}\n  ${bridge.evidence}`,
          )
          .join('\n'),
  );
};

const showLog = async (): Promise<void> => {
  const current = await state();
  say(
    [
      `spaces: ${[...current.spaces.keys()].join(', ') || 'none'}`,
      `verbs: ${[...current.verbs.values()].map((verb) => `${verb.name}${verb.blessedAt ? '' : ' (unblessed)'}`).join(', ') || 'none'}`,
      `reflections: ${current.reflections.size}`,
      `receipts: ${current.receipts.length}`,
      `bridges: ${current.bridges.size} (${pendingIn(current, OPERATOR_SPACE).length} waiting)`,
    ].join('\n'),
  );
};

const usage = (): void => {
  say(
    [
      'fabric init                 open the two spaces and propose the verbs, unblessed',
      'fabric bless <verb|bridge>  the operator blesses a verb into the manifest, or a proposal across',
      'fabric reject <bridge>      the operator rejects a proposal; it is kept, as data',
      'fabric pending              what is waiting in the operator’s space',
      'fabric log                  what the log holds',
      'fabric orient               the start hook: mark the session, print its memory',
      'fabric stop-check           the stop hook: ask for a reflection if none was recorded',
      'fabric serve                the Model Context Protocol server, over stdio',
    ].join('\n'),
  );
};

const commands: Record<string, (argument: string | undefined) => Promise<void>> = {
  init: () => init(),
  bless: (argument) => bless(argument, 'blessed'),
  reject: (argument) => bless(argument, 'rejected'),
  pending: () => showPending(),
  log: () => showLog(),
  orient: () => orient(),
  'stop-check': () => stopCheck(),
  serve: () => serve(root),
};

const [command, argument] = process.argv.slice(2);
const chosen = command === undefined ? undefined : commands[command];
if (chosen) {
  await chosen(argument);
} else {
  usage();
  process.exitCode = command === undefined ? 0 : 2;
}
