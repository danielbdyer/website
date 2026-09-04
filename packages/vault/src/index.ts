import {
  METABOLIC_STATES,
  parseSlice,
  type Axis,
  type Ghost,
  type MetabolicState,
  type Slice,
  type SliceEdge,
  type SliceNode,
} from '@dbd/slice';
import { load } from 'js-yaml';

// ─── @dbd/vault — an ars-contexta vault as a slice ─────────────────
//
// A vault holds single-claim notes connected by wiki links and gathered
// by topic maps (`type: moc`), with an inbox of captures the pipeline
// has not yet processed. Read as a slice: the maps are the compass, the
// claims are the stars placed by the maps they belong to, the wiki links
// between claims are declared `references`, and the inbox is pending —
// ghosts the sky may draw. The reader is pure: files in, a slice out;
// time is an argument. The CLI beside it does the reading from disk.
// CATHEDRALS.md §"The Contract"; the second adapter of the GraphSource
// port, after the site's works.
//
// What it does not carry: bodies (the body is primary and stays in the
// vault), the maps' own prose, and any relation vocabulary richer than
// `references` — the vault's "Relevant Notes" clauses are prose, and the
// closed predicate set admits nothing an adapter invents.

export interface VaultFile {
  /** Path relative to the vault root, forward-slashed: `notes/x.md`. */
  readonly path: string;
  readonly text: string;
}

export interface VaultOptions {
  readonly space: string;
  /** When the slice was cut. Time is an argument. */
  readonly asOf: string;
  /** The hub map that lists the others; never an axis. Default `index`. */
  readonly hub?: string;
}

interface Note {
  readonly id: string;
  readonly path: string;
  readonly frontmatter: Readonly<Record<string, unknown>>;
  readonly body: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const WIKILINK = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parseYaml(source: string): Readonly<Record<string, unknown>> {
  try {
    const value: unknown = load(source);
    return isRecord(value) ? value : {};
  } catch {
    // A colon in an unquoted description is the vault's own known
    // failure mode; the note still exists, without its frontmatter.
    return {};
  }
}

/** A note's frontmatter and body. Unparseable frontmatter reads as
 *  empty rather than failing the slice. */
export function splitFrontmatter(text: string): {
  readonly frontmatter: Readonly<Record<string, unknown>>;
  readonly body: string;
} {
  const match = FRONTMATTER.exec(text);
  if (!match) return { frontmatter: {}, body: text };
  return { frontmatter: parseYaml(match[1] ?? ''), body: text.slice(match[0].length) };
}

/** The targets of every `[[link]]`, `[[link|alias]]`, `[[link#heading]]`. */
export function wikilinks(text: string): readonly string[] {
  return [...text.matchAll(WIKILINK)].flatMap((match) => {
    const target = match[1]?.trim();
    return target ? [target] : [];
  });
}

const baseName = (path: string): string =>
  path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '');

const topDir = (path: string): string => path.split('/')[0] ?? '';

const noteOf = (file: VaultFile): Note => {
  const { frontmatter, body } = splitFrontmatter(file.text);
  return { id: baseName(file.path), path: file.path, frontmatter, body };
};

const stringOf = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const stringsOf = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.flatMap((item) => (typeof item === 'string' ? [item] : [])) : [];

/** The maps a note belongs to, as written in `topics` (`[[map]]`). */
const topicsOf = (note: Note): readonly string[] =>
  stringsOf(note.frontmatter.topics).flatMap((topic) => {
    const links = wikilinks(topic);
    return links.length > 0 ? links : [topic.trim()];
  });

const isMap = (note: Note): boolean => note.frontmatter.type === 'moc';

const isState = (value: unknown): value is MetabolicState =>
  typeof value === 'string' && (METABOLIC_STATES as readonly string[]).includes(value);

/** A frontmatter date as ISO: YAML reads a bare date as a Date, a
 *  quoted one as a string; either is welcome, anything else is not. */
const dateOf = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  return typeof value === 'string' ? new Date(value) : null;
};

const isoOf = (value: unknown): string | null => {
  const date = dateOf(value);
  return date === null || Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const byId = (a: { readonly id: string }, b: { readonly id: string }): number =>
  a.id.localeCompare(b.id);

/** Case-insensitive lookup from a link's text to a note's id. */
const lookup = (notes: readonly Note[]): ReadonlyMap<string, string> =>
  new Map(notes.map((note) => [note.id.toLowerCase(), note.id]));

const nodeFrom = (note: Note, maps: ReadonlyMap<string, string>, asOf: string): SliceNode => {
  const summary = stringOf(note.frontmatter.description);
  const state = note.frontmatter.state;
  return {
    id: note.id,
    // The filename is the claim, stated as a proposition.
    title: note.id,
    kind: stringOf(note.frontmatter.category) ?? 'note',
    axes: [
      ...new Set(
        topicsOf(note).flatMap((topic) => {
          const id = maps.get(topic.toLowerCase());
          return id ? [id] : [];
        }),
      ),
    ],
    ...(summary === null ? {} : { summary }),
    createdAt: isoOf(note.frontmatter.created) ?? asOf,
    ...(isState(state) ? { status: state } : {}),
  };
};

/** The declared references out of a claim: every wiki link in its body
 *  that names another claim. Links to maps are membership, not
 *  relation; links to nothing are dropped so every edge stays grounded. */
const edgesFrom = (note: Note, claims: ReadonlyMap<string, string>): readonly SliceEdge[] =>
  wikilinks(note.body).flatMap((target) => {
    const object = claims.get(target.toLowerCase());
    return object && object !== note.id
      ? [
          {
            subject: note.id,
            predicate: 'references' as const,
            object,
            origin: 'declared' as const,
          },
        ]
      : [];
  });

const edgeKey = (edge: SliceEdge): string => `${edge.subject}|${edge.object}`;

/** Cut a vault into a slice. Pure; deterministic in its input. */
export function sliceFromVault(files: readonly VaultFile[], options: VaultOptions): Slice {
  const hub = options.hub ?? 'index';
  const notes = files.flatMap((file) => (file.path.endsWith('.md') ? [noteOf(file)] : []));
  const inNotes = notes.filter((note) => topDir(note.path) === 'notes' && note.id !== hub);
  const maps = inNotes.filter((note) => isMap(note)).toSorted(byId);
  const claims = inNotes.filter((note) => !isMap(note)).toSorted(byId);
  const mapIds = lookup(maps);
  const claimIds = lookup(claims);
  const axes: Axis[] = maps.map((map, i) => ({
    id: map.id,
    name: map.id,
    azimuthDeg: (i * 360) / maps.length,
  }));
  const edges = [
    ...new Map(
      claims.flatMap((claim) => edgesFrom(claim, claimIds)).map((edge) => [edgeKey(edge), edge]),
    ).values(),
  ].toSorted((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
  const ghosts: Ghost[] = notes
    .filter((note) => topDir(note.path) === 'inbox')
    .toSorted(byId)
    .map((note) => ({ id: note.id, operation: 'create_entity' as const, title: note.id }));
  return parseSlice({
    space: options.space,
    asOf: options.asOf,
    axes,
    nodes: claims.map((claim) => nodeFrom(claim, mapIds, options.asOf)),
    edges,
    pending: { unresolved: ghosts.length, ghosts },
  });
}
