import { mkdir, readdir, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { Effect, Layer } from 'effect';
import { EventLog, LogRejected, type EventLogService } from '../ports';
import { parseEvent, type FabricEvent } from '../schema';

// ─── The log as JSON lines in git ─────────────────────────────────
//
// One file per tenant, one event per line, appended and never
// rewritten. Git is the vessel (CATHEDRALS.md): the commit that carries
// a session's lines is its provenance. `read` returns every tenant's
// log in file order; steps are per tenant, assigned at append from the
// tenant's own line count, so a replay is exact.

const fileOf = (dir: string, space: string): string => path.join(dir, `${space}.jsonl`);

const reasonOf = (cause: unknown): string =>
  cause instanceof Error ? cause.message : JSON.stringify(cause);

const lines = (text: string): readonly string[] =>
  text.split('\n').filter((line) => line.trim().length > 0);

const readSpace = (dir: string, file: string): Effect.Effect<readonly FabricEvent[], LogRejected> =>
  Effect.tryPromise({
    try: async () =>
      lines(await readFile(path.join(dir, file), 'utf8')).map((line) =>
        parseEvent(JSON.parse(line)),
      ),
    catch: (cause) => LogRejected({ reason: `could not read ${file}: ${reasonOf(cause)}` }),
  });

const listFiles = (dir: string): Effect.Effect<readonly string[], LogRejected> =>
  Effect.tryPromise({
    try: async () => {
      await mkdir(dir, { recursive: true });
      const names = await readdir(dir);
      return names.filter((name) => name.endsWith('.jsonl')).toSorted();
    },
    catch: (cause) => LogRejected({ reason: `could not list ${dir}: ${reasonOf(cause)}` }),
  });

const readAll = (dir: string): Effect.Effect<readonly FabricEvent[], LogRejected> =>
  listFiles(dir).pipe(
    Effect.flatMap(Effect.forEach((file) => readSpace(dir, file))),
    Effect.map((perSpace) => perSpace.flat()),
  );

const countIn = (dir: string, space: string): Effect.Effect<number, LogRejected> =>
  Effect.tryPromise({
    try: async () => {
      await mkdir(dir, { recursive: true });
      return lines(await readFile(fileOf(dir, space), 'utf8').catch(() => '')).length;
    },
    catch: (cause) => LogRejected({ reason: `could not count ${space}: ${reasonOf(cause)}` }),
  });

/** The file-backed log. `dir` holds one `<space>.jsonl` per tenant.
 *  Appends take turns through one permit, so two calls in flight can
 *  never count the same step. */
export const fileEventLog = (dir: string): Layer.Layer<EventLogService> =>
  Layer.effect(
    EventLog,
    Effect.map(Effect.makeSemaphore(1), (turn) => ({
      append: (event) => turn.withPermits(1)(appendTo(dir, event)),
      // A log that cannot be read is an empty log with a reason lost; the
      // shell surfaces the reason before anything is appended.
      read: () => Effect.orElseSucceed(readAll(dir), () => []),
    })),
  );

const appendTo = (
  dir: string,
  event: Omit<FabricEvent, 'step'>,
): Effect.Effect<FabricEvent, LogRejected> =>
  countIn(dir, event.space).pipe(
    Effect.flatMap((step) => {
      const stamped = parseEvent({ ...event, step });
      return Effect.tryPromise({
        try: async () => {
          await appendFile(fileOf(dir, event.space), `${JSON.stringify(stamped)}\n`, 'utf8');
          return stamped;
        },
        catch: (cause) =>
          LogRejected({ reason: `could not append to ${event.space}: ${reasonOf(cause)}` }),
      });
    }),
  );
