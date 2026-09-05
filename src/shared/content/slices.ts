import { parseSlice, type Slice } from '@dbd/slice';
import type { Room } from '@/shared/types/common';
import type { DisplayWork } from './preview';
import { getDisplayWorksByRoomSync } from './display';
import { sliceFromWorks } from './slice';

// ─── Where the sky's slice comes from ──────────────────────────────
//
// The composition root of the GraphSource port (CATHEDRALS.md
// §"Dependency injection, without a container"): the build picks the
// source. By default the sky is cut from the site's own works. When
// the build names another slice — `VITE_SKY_SLICE=book` — the sky is
// cut from `src/content/slices/book.json`, a slice some other source
// emitted (the engine, a vault reader). The sky does not know which;
// it reads a slice.
//
// Slice files are data, not code, and the ones cut from private
// sources stay out of the repository (.gitignore) until Danny says
// otherwise. CATHEDRALS.md §"Held" — the workspace's visibility.

// The Foyer is the ground we look up from, not a region of the sky.
const SKY_ROOMS: readonly Exclude<Room, 'foyer'>[] = ['studio', 'garden', 'study', 'salon'];

/** A slice, and the words the concordance is built from: the slice
 *  carries titles and summaries, never bodies; a source that has the
 *  bodies at hand may lend them for the concordance alone. */
export interface SliceSource {
  readonly slice: Slice;
  readonly texts: ReadonlyMap<string, string>;
}

const sliceFiles = import.meta.glob('/src/content/slices/*.json', {
  eager: true,
  import: 'default',
});

const workText = (work: DisplayWork): string => `${work.title} ${work.summary ?? ''} ${work.body}`;

/** The site's own works as the sky's source. */
export function worksSliceSource(now: Date = new Date()): SliceSource {
  const works = SKY_ROOMS.flatMap((room) => getDisplayWorksByRoomSync(room));
  return {
    slice: sliceFromWorks(works, now),
    texts: new Map(works.map((work) => [`${work.room}/${work.slug}`, workText(work)])),
  };
}

/** A slice file by name (`book` → `src/content/slices/book.json`),
 *  parsed through the schema of record; null when no such file was
 *  built in. */
export function namedSliceSource(name: string): SliceSource | null {
  const entry = Object.entries(sliceFiles).find(([path]) => path.endsWith(`/${name}.json`));
  if (!entry) return null;
  const slice = parseSlice(entry[1]);
  return {
    slice,
    texts: new Map(slice.nodes.map((node) => [node.id, `${node.title} ${node.summary ?? ''}`])),
  };
}

/** The source the build chose. */
export function pickSliceSource(): SliceSource {
  const named: unknown = import.meta.env.VITE_SKY_SLICE;
  const name = typeof named === 'string' && named.length > 0 ? named : null;
  return (name ? namedSliceSource(name) : null) ?? worksSliceSource();
}
