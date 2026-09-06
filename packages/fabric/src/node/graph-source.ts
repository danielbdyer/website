import { Effect, Layer } from 'effect';
import { mergeParts, sliceFromState, type SliceParts } from '../graph';
import { project, sourcesOf, type FabricState } from '../log';
import { EventLog, GraphSource, type EventLogService, type GraphSourceService } from '../ports';
import { readSource } from './sources';

// ─── The composite graph source ───────────────────────────────────
//
// One `GraphSource` for the whole fabric. A viewer's own space is the
// fold, whole. Another space is what its sovereign has disclosed: the
// blessed sources, read by a reader the shell supplies, and the
// reflections he has blessed across (INV-FAB-006), merged into one
// grounded slice. Time is the aperture's `asOf`; the clock is never
// read here.

export type PartsReader = (
  state: FabricState,
  space: string,
  asOf: string,
) => Promise<readonly SliceParts[]>;

/** The source over any reader of parts. A test reads nothing. */
export const graphSourceOver = (
  read: PartsReader,
): Layer.Layer<GraphSourceService, never, EventLogService> =>
  Layer.effect(
    GraphSource,
    EventLog.pipe(
      Effect.map((log) => ({
        slice: (space, aperture) =>
          Effect.gen(function* () {
            const state = project(yield* log.read());
            const asOf = aperture.asOf ?? '1970-01-01T00:00:00.000Z';
            const own = sliceFromState(state, space, asOf);
            if (aperture.viewer === space) return own;
            const parts = yield* Effect.promise(() => read(state, space, asOf));
            return mergeParts(space, asOf, own.pending, [own, ...parts]);
          }),
      })),
    ),
  );

/** The blessed sources of a space, read from disk under the root. */
export const diskParts =
  (root: string): PartsReader =>
  (state, space, asOf) =>
    Promise.all(sourcesOf(state, space).map((source) => readSource(root, source, asOf)));

export const graphSourceFor = (
  root: string,
): Layer.Layer<GraphSourceService, never, EventLogService> => graphSourceOver(diskParts(root));
