import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Effect, Option } from 'effect';
import { canonicalJson } from './canonical';
import { describe, eventJsonSchema, graduation, readmeFrom } from './describe';
import { unified } from './diff';
import {
  homeOf,
  patchesPendingIn,
  pendingIn,
  project,
  sourcesOf,
  visibleReflections,
  type FabricState,
  type PatchRecord,
} from './log';
import { manifestFor } from './manifest';
import { Consent, EventLog, Resonance } from './ports';
import {
  RUNTIME_ACTOR,
  SOURCE_KINDS,
  type Check,
  type Patch,
  type Reflection,
  type Source,
  type Space,
} from './schema';
import { paths, readSession, reasonOf, runnerFor, serve, type Runner } from './server';
import {
  AGENT_SPACE,
  Canon,
  OPERATOR_SPACE,
  decidePatch,
  proposedVerbs,
  unmeasuredIn,
} from './verbs';

// ─── The sovereign's terminal, and the hooks ──────────────────────
//
// `init` opens the two spaces and proposes the verbs and the sources,
// unblessed. `bless` and `reject` are the operator's, from the
// terminal, per CATHEDRALS.md §"Git Is the Vessel": blessing happens
// where it already happens, and the commit that follows is its record.
// A patch is blessed the same way: `pending` shows it as a diff with
// what the fabric could check, and `bless patch/<id>` applies it to
// the canon and records that it did.
// `describe` writes the fabric's self-description beside the log, and
// `describe --check` fails when the written copy has drifted from the
// log, so the description in git is never stale. `orient` and
// `stop-check` are the two hooks a session runs.
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

const complain = (text: string): void => {
  process.stderr.write(`${text}\n`);
  process.exitCode = 2;
};

const spaces: readonly Space[] = [
  { id: OPERATOR_SPACE, kind: 'operator', sovereign: OPERATOR_SPACE },
  { id: AGENT_SPACE, kind: 'agent', sovereign: AGENT_SPACE },
];

/** The sources `init` proposes into the operator's space: the house's
 *  own skills and works, and the vault beside the house. Paths are
 *  relative to the workspace root; a sibling not checked out reads as
 *  nothing. */
const proposedSources = (): readonly Source[] =>
  (
    [
      ['skills', '.claude/skills'],
      ['works', 'src/content'],
      ['vault', '../book-research'],
    ] as const
  ).map(([kind, sourcePath]) => ({
    id: `source/${kind}`,
    space: OPERATOR_SPACE,
    kind,
    path: sourcePath,
    origin: 'declared',
  }));

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
  const verbs = proposedVerbs().filter((verb) => !current.verbs.has(verb.id));
  const sources = proposedSources().filter((source) => !current.sources.has(source.id));
  await run(
    EventLog.pipe(
      Effect.flatMap((log) =>
        Effect.forEach(
          [
            ...opened.map((space) => ({
              kind: 'space.opened' as const,
              at,
              space: space.id,
              actor: RUNTIME_ACTOR,
              payload: space,
            })),
            ...verbs.map((verb) => ({
              kind: 'verb.proposed' as const,
              at,
              space: verb.space,
              actor: RUNTIME_ACTOR,
              payload: verb,
            })),
            ...sources.map((source) => ({
              kind: 'source.proposed' as const,
              at,
              space: source.space,
              actor: RUNTIME_ACTOR,
              payload: source,
            })),
          ],
          (event) => log.append(event),
        ),
      ),
    ),
  );
  const after = await state();
  const waitingVerbs = [...after.verbs.values()].flatMap((verb) =>
    verb.blessedAt === undefined ? [verb.name] : [],
  );
  const waitingSources = [...after.sources.values()].flatMap((source) =>
    source.blessedAt === undefined ? [source.id] : [],
  );
  say(
    `opened ${opened.length} space(s); proposed ${verbs.length} verb(s) and ${sources.length} source(s). ` +
      `Waiting for blessing: ${[...waitingVerbs, ...waitingSources].join(', ') || 'none'}.`,
  );
};

const propose = async (kind: string | undefined, sourcePath: string | undefined): Promise<void> => {
  const known = SOURCE_KINDS.find((candidate) => candidate === kind);
  if (!known || !sourcePath) {
    complain(`propose source <${SOURCE_KINDS.join('|')}> <path>`);
    return;
  }
  const at = now();
  const source: Source = {
    id: `source/${known}/${path.basename(sourcePath)}`,
    space: OPERATOR_SPACE,
    kind: known,
    path: sourcePath,
    origin: 'declared',
  };
  await run(
    EventLog.pipe(
      Effect.flatMap((log) =>
        log.append({
          kind: 'source.proposed',
          at,
          space: source.space,
          actor: RUNTIME_ACTOR,
          payload: source,
        }),
      ),
    ),
  );
  say(`proposed ${source.id} into ${source.space}; waiting for blessing`);
};

/** The operator's answer to a patch: applied to the canon first when
 *  blessed, then recorded; or refused with the reason, and still
 *  waiting. */
const blessPatch = async (
  patch: Patch,
  decision: 'blessed' | 'rejected',
  by: string,
  at: string,
): Promise<void> => {
  const answered = await run(
    decidePatch(patch.id, decision, by, at).pipe(
      Effect.map((decided) => ({ ok: true as const, decided })),
      Effect.catchAll((cause) => Effect.succeed({ ok: false as const, why: reasonOf(cause) })),
    ),
  );
  if (!answered.ok) {
    complain(answered.why);
    return;
  }
  say(
    answered.decided.applied
      ? `blessed ${patch.id}: ${patch.node} now reads as proposed; commit it, and the next session will report on “${patch.hypothesis}”`
      : `${decision} ${patch.id}; ${patch.node} is unchanged`,
  );
};

const bless = async (
  target: string | undefined,
  decision: 'blessed' | 'rejected',
): Promise<void> => {
  if (!target) {
    complain('name a verb, a source, or a bridge id');
    return;
  }
  const current = await state();
  const at = now();
  const sovereignOf = (space: string): string =>
    current.spaces.get(space)?.sovereign ?? OPERATOR_SPACE;
  const verb = [...current.verbs.values()].find(
    (entry) => entry.name === target || entry.id === target,
  );
  const source = [...current.sources.values()].find(
    (entry) => entry.id === target || entry.id === `source/${target}`,
  );
  if (verb || source) {
    if (decision === 'rejected') {
      complain('a verb or a source is retired, not rejected; retire is held');
      return;
    }
    const space = verb?.space ?? source?.space ?? OPERATOR_SPACE;
    const by = sovereignOf(space);
    await run(
      EventLog.pipe(
        Effect.flatMap((log) =>
          log.append(
            verb
              ? {
                  kind: 'verb.blessed',
                  at,
                  space,
                  actor: by,
                  causedBy: verb.id,
                  payload: { verb: verb.id, by, at },
                }
              : {
                  kind: 'source.blessed',
                  at,
                  space,
                  actor: by,
                  causedBy: source?.id ?? '',
                  payload: { source: source?.id ?? '', by, at },
                },
          ),
        ),
      ),
    );
    say(`blessed ${verb?.name ?? source?.id ?? target} into ${space}`);
    return;
  }
  const patch = current.patches.get(target);
  if (patch) {
    await blessPatch(patch, decision, sovereignOf(patch.space), at);
    return;
  }
  const bridge = current.bridges.get(target);
  if (!bridge) {
    complain(`nothing named ${target} is waiting`);
    return;
  }
  const by = sovereignOf(bridge.to);
  await run(
    Consent.pipe(Effect.flatMap((consent) => consent.resolve(bridge.id, decision, by, at))),
  );
  say(`${decision} ${bridge.node} into ${bridge.to}`);
};

const checkLine = (check: Check): string =>
  `  ${check.passed ? '✓' : '✗'} ${check.name}${check.detail ? `: ${check.detail.split('\n')[0]}` : ''}`;

/** A patch as the operator reads it before answering: what it changes,
 *  why, what it predicts, what the fabric could check, and the diff
 *  against the node as it is now. */
const patchLines = async (patch: PatchRecord): Promise<string> => {
  const now = await run(Canon.pipe(Effect.flatMap((canon) => canon.read(patch.node))));
  const before = Option.match(now, { onNone: () => '', onSome: (node) => node.text });
  const checks = patch.evaluation?.checks ?? [];
  const checkLines = checks.map(checkLine);
  return [
    `${patch.id}  ${patch.node}  from ${patch.proposedBy}  ${patch.proposedAt}`,
    `  because: ${patch.because}`,
    `  hypothesis: ${patch.hypothesis}`,
    patch.evaluation
      ? `  evaluation: ${patch.evaluation.passed ? 'passed' : 'did not pass'}`
      : '  evaluation: none yet',
    ...checkLines,
    '',
    ...unified(before, patch.body)
      .split('\n')
      .map((line) => `  ${line}`),
  ].join('\n');
};

const line = (current: FabricState, reflection: Reflection): string => {
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
  const unblessedVerbs = [...current.verbs.values()].filter(
    (verb) => verb.blessedAt === undefined && verb.retiredAt === undefined,
  );
  const unblessedSources = [...current.sources.values()].filter(
    (source) => source.blessedAt === undefined,
  );
  const sources = sourcesOf(current, OPERATOR_SPACE);
  const waiting = pendingIn(current, OPERATOR_SPACE);
  const waitingPatches = patchesPendingIn(current, OPERATOR_SPACE);
  const unmeasured = unmeasuredIn(current, OPERATOR_SPACE);
  const measure = graduation(current);
  const memory = visibleReflections(current, AGENT_SPACE)
    .toSorted((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  const blessings = [
    ...unblessedVerbs.map((verb) => `\`pnpm fabric bless ${verb.name}\``),
    ...unblessedSources.map((source) => `\`pnpm fabric bless ${source.id}\``),
  ];
  say(
    [
      '## The fabric',
      `Session ${session ?? (await readSession(root))}, acting as \`${AGENT_SPACE}\`. The log is \`fabric/spaces/\`; the description is \`fabric/README.md\`.`,
      manifest.verbs.length > 0
        ? `Manifest of \`${OPERATOR_SPACE}\`: ${manifest.verbs.map((verb) => `\`${verb.name}\` (${verb.consequence})`).join(', ')}.`
        : 'No verb is blessed yet, so the manifest is empty.',
      sources.length > 0
        ? `Sources of \`${OPERATOR_SPACE}\`: ${sources.map((source) => `${source.kind} at \`${source.path}\``).join(', ')}.`
        : `No source is blessed into \`${OPERATOR_SPACE}\` yet; its slice holds only what was blessed across.`,
      ...(blessings.length > 0
        ? [`Waiting for the operator's blessing: ${blessings.join(', ')}.`]
        : []),
      `Waiting in \`${OPERATOR_SPACE}\`: ${waiting.length} proposal(s) to carry across, ${waitingPatches.length} patch(es) to a node.`,
      ...(unmeasured.length > 0
        ? [
            'Applied since a session last looked, with the hypothesis each was proposed under. Report each through `reflect.outcomes` as confirmed or contradicted, with why:',
            ...unmeasured.map(
              (patch) => `- \`${patch.id}\` on \`${patch.node}\`: ${patch.hypothesis}`,
            ),
          ]
        : []),
      `The loop: ${measure.proposed} patch(es) proposed, ${measure.applied} applied, ${measure.confirmed} confirmed and ${measure.contradicted} contradicted in the last ${measure.window}; ${measure.graduated ? 'graduated' : 'not graduated'} against a floor of ${measure.floor}.`,
      memory.length > 0 ? 'Memory, newest first:' : 'Memory: nothing recorded yet.',
      ...memory.map((reflection) => line(current, reflection)),
      'Before ending, record what this session noticed with `reflect`. The stop hook asks once if nothing was recorded. A change a node needs is a `propose`, not a paragraph.',
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
  const patches = patchesPendingIn(current, OPERATOR_SPACE);
  const bridges = waiting.map(
    (bridge) =>
      `${bridge.id}  ${bridge.node}  from ${bridge.from}  ${bridge.proposedAt}\n  ${bridge.evidence}`,
  );
  const shown = await Promise.all(patches.map((patch) => patchLines(patch)));
  say(
    bridges.length + shown.length === 0
      ? `nothing is waiting in ${OPERATOR_SPACE}`
      : [...bridges, ...shown].join('\n\n'),
  );
};

const showLog = async (): Promise<void> => {
  const current = await state();
  const mark = (blessedAt: string | undefined): string => (blessedAt ? '' : ' (unblessed)');
  say(
    [
      `spaces: ${[...current.spaces.keys()].join(', ') || 'none'}`,
      `verbs: ${[...current.verbs.values()].map((verb) => `${verb.name}${mark(verb.blessedAt)}`).join(', ') || 'none'}`,
      `sources: ${[...current.sources.values()].map((source) => `${source.id}${mark(source.blessedAt)}`).join(', ') || 'none'}`,
      `reflections: ${current.reflections.size}`,
      `receipts: ${current.receipts.length}; refusals: ${current.refusals.length}`,
      `bridges: ${current.bridges.size} (${pendingIn(current, OPERATOR_SPACE).length} waiting)`,
      `patches: ${current.patches.size} (${patchesPendingIn(current, OPERATOR_SPACE).length} waiting, ${[...current.patches.values()].filter((patch) => patch.applied).length} applied); outcomes: ${current.outcomes.length}`,
    ].join('\n'),
  );
};

/** The three files the description becomes, as they should read now. */
const rendered = async (): Promise<readonly { readonly file: string; readonly text: string }[]> => {
  const description = describe(await state());
  const { manifest, eventsSchema, readme } = paths(root);
  return [
    { file: manifest, text: `${JSON.stringify(description, null, 2)}\n` },
    { file: eventsSchema, text: `${JSON.stringify(eventJsonSchema(), null, 2)}\n` },
    { file: readme, text: readmeFrom(description) },
  ];
};

const describeCommand = async (flag: string | undefined): Promise<void> => {
  const files = await rendered();
  if (flag === '--check') {
    const drifted = await Promise.all(
      files.map(async ({ file, text }) => {
        const current = await readFile(file, 'utf8').catch(() => '');
        const same = file.endsWith('.json')
          ? canonicalJson(JSON.parse(current || 'null')) === canonicalJson(JSON.parse(text))
          : current === text;
        return same ? [] : [path.relative(root, file)];
      }),
    );
    const names = drifted.flat();
    if (names.length > 0) {
      complain(
        `the description has drifted from the log: ${names.join(', ')}. Run \`pnpm fabric describe\`.`,
      );
      return;
    }
    say('the description matches the log');
    return;
  }
  await Promise.all(files.map(({ file, text }) => writeFile(file, text, 'utf8')));
  say(files.map(({ file }) => `wrote ${path.relative(root, file)}`).join('\n'));
};

const index = async (): Promise<void> => {
  await run(Resonance.pipe(Effect.flatMap((resonance) => resonance.refresh('all'))));
  say('the reflections are written out and qmd has updated and embedded what it could');
};

const usage = (): void => {
  say(
    [
      'fabric init                          open the spaces; propose the verbs and the sources, unblessed',
      'fabric propose source <kind> <path>  propose another source into the operator’s space',
      'fabric bless <verb|source|bridge|patch>  the operator blesses a verb or a source into his space, a proposal across, or a patch onto a node',
      'fabric reject <bridge|patch>         the operator rejects a proposal or a patch; it is kept, as data',
      'fabric pending                       what is waiting in the operator’s space: proposals, and patches as diffs',
      'fabric log                           what the log holds',
      'fabric describe [--check]            write the self-description beside the log, or check it has not drifted',
      'fabric index                         write the reflections out for qmd; update and embed the collections',
      'fabric orient                        the start hook: mark the session, print its memory',
      'fabric stop-check                    the stop hook: ask for a reflection if none was recorded',
      'fabric serve                         the Model Context Protocol server, over stdio',
    ].join('\n'),
  );
};

const commands: Record<
  string,
  (first: string | undefined, second: string | undefined) => Promise<void>
> = {
  init: () => init(),
  propose: (first, second) =>
    first === 'source'
      ? propose(second, process.argv[5])
      : Promise.resolve(complain('propose source <kind> <path>')),
  bless: (first) => bless(first, 'blessed'),
  reject: (first) => bless(first, 'rejected'),
  pending: () => showPending(),
  log: () => showLog(),
  describe: (first) => describeCommand(first),
  index: () => index(),
  orient: () => orient(),
  'stop-check': () => stopCheck(),
  serve: () => serve(root),
};

const [command, first, second] = process.argv.slice(2);
const chosen = command === undefined ? undefined : commands[command];
if (chosen) {
  await chosen(first, second);
} else {
  usage();
  process.exitCode = command === undefined ? 0 : 2;
}
