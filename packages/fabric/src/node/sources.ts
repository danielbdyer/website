import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import type { Axis, SliceEdge, SliceNode } from '@dbd/slice';
import type { SliceParts } from '../graph';
import type { Source, SourceKind } from '../schema';

// ─── The sources, read from disk ──────────────────────────────────
//
// Three adapters, one per source kind, each a function from a path to
// the parts of a slice: axes, nodes, edges. They read markdown with
// frontmatter and wikilinks — the one shape the vault, the house, and
// the skills already share — and they invent nothing: an edge is drawn
// only when both ends are in the parts. The composite in the graph
// module merges parts into a slice.

export const emptyParts: SliceParts = { axes: [], nodes: [], edges: [] };

interface Document {
  readonly file: string;
  readonly front: Record<string, unknown>;
  readonly body: string;
}

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** Frontmatter and body, or an empty frontmatter when there is none. */
export function parseDocument(file: string, text: string): Document {
  const match = FRONT.exec(text);
  const front = match ? yaml.load(match[1] ?? '') : undefined;
  return {
    file,
    front: typeof front === 'object' && front !== null ? (front as Record<string, unknown>) : {},
    body: match ? (match[2] ?? '') : text,
  };
}

const WIKILINK = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;

/** The targets a body links to, as written inside the brackets. */
export const wikilinks = (body: string): readonly string[] =>
  [...body.matchAll(WIKILINK)].flatMap((match) => (match[1] ? [match[1].trim()] : []));

const asStrings = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.flatMap((entry) => (typeof entry === 'string' ? [entry] : [])) : [];

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const unwrap = (link: string): string => link.replace(/^\[\[/, '').replace(/\]\]$/, '').trim();

const byId = (a: { readonly id: string }, b: { readonly id: string }): number =>
  a.id.localeCompare(b.id);

const spread = (ids: readonly string[]): readonly Axis[] =>
  ids.map((id, index) => ({ id, name: id, azimuthDeg: (index * 360) / Math.max(ids.length, 1) }));

const readMarkdown = async (dir: string, deep: boolean): Promise<readonly Document[]> => {
  const entries = await readdir(dir, { withFileTypes: true, recursive: deep }).catch(() => []);
  const files = entries.flatMap((entry) =>
    entry.isFile() && entry.name.endsWith('.md') ? [path.join(entry.parentPath, entry.name)] : [],
  );
  return Promise.all(files.map(async (file) => parseDocument(file, await readFile(file, 'utf8'))));
};

/** Edges from wikilinks, kept only between nodes both in the parts. */
const linkEdges = (
  documents: readonly { readonly id: string; readonly links: readonly string[] }[],
  resolve: (link: string) => string,
): readonly SliceEdge[] => {
  const known = new Set(documents.map((document) => document.id));
  return documents.flatMap((document) =>
    document.links.flatMap((link) => {
      const object = resolve(link);
      return known.has(object) && object !== document.id
        ? [
            {
              subject: document.id,
              predicate: 'references' as const,
              object,
              origin: 'declared' as const,
            },
          ]
        : [];
    }),
  );
};

// ─── vault: a folder of claims, one proposition per file ──────────

const VAULT_NODE = 'vault/';

/** The vault's claims: the filename is the claim, `description` the
 *  summary, `category` or `type` the kind, `topics` the axes, `state`
 *  the metabolic status. Wikilinks between claims are declared edges. */
export const readVault = async (root: string, asOf: string): Promise<SliceParts> => {
  const documents = await readMarkdown(path.join(root, 'notes'), false);
  const entries = documents.map((document) => {
    const title = path.basename(document.file, '.md');
    const topics = asStrings(document.front.topics).map(unwrap);
    return {
      id: `${VAULT_NODE}${title}`,
      title,
      kind: asString(document.front.category) ?? asString(document.front.type) ?? 'claim',
      axes: [...topics],
      summary: asString(document.front.description),
      status: asString(document.front.state),
      links: wikilinks(document.body),
    };
  });
  const axes = spread([...new Set(entries.flatMap((entry) => entry.axes))].toSorted());
  const nodes: readonly SliceNode[] = entries
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      kind: entry.kind,
      axes: [...entry.axes],
      ...(entry.summary === undefined ? {} : { summary: entry.summary }),
      createdAt: asOf,
      ...(isStatus(entry.status) ? { status: entry.status } : {}),
      group: 'vault',
    }))
    .toSorted(byId);
  return { axes, nodes, edges: linkEdges(entries, (link) => `${VAULT_NODE}${link}`) };
};

const STATUSES = new Set(['nascent', 'privated', 'full', 'flourishing', 'composting']);
const isStatus = (value: string | undefined): value is SliceNode['status'] & string =>
  value !== undefined && STATUSES.has(value);

// ─── works: the house's rooms ─────────────────────────────────────

/** The eight facets in the order the domain model names them. The
 *  sky's adapter is authoritative for azimuths and hues; this one gives
 *  a navigable compass, evenly spread, and nothing more. */
export const FACETS = [
  'craft',
  'consciousness',
  'language',
  'leadership',
  'beauty',
  'becoming',
  'relation',
  'body',
] as const;

/** The site's works: `<room>/<slug>` from the path, `title`, `date`,
 *  `type`, `facets` from the frontmatter, wikilinks as declared edges. */
export const readWorks = async (root: string, asOf: string): Promise<SliceParts> => {
  const documents = await readMarkdown(root, true);
  const entries = documents.flatMap((document) => {
    const relative = path.relative(root, document.file).replace(/\.md$/, '');
    const [room, slug] = relative.split(path.sep);
    if (!room || !slug || document.front.draft === true) return [];
    const date = document.front.date;
    const createdAt = date instanceof Date ? date.toISOString() : (asString(date) ?? asOf);
    return [
      {
        id: `${room}/${slug}`,
        title: asString(document.front.title) ?? slug,
        kind: asString(document.front.type) ?? 'work',
        axes: [...asStrings(document.front.facets)],
        summary: asString(document.front.summary),
        createdAt,
        href: `/${room}/${slug}`,
        group: room,
        links: wikilinks(document.body),
      },
    ];
  });
  const nodes: readonly SliceNode[] = entries
    .map(({ links: _links, summary, ...node }) => ({
      ...node,
      ...(summary === undefined ? {} : { summary }),
    }))
    .toSorted(byId);
  return {
    axes: FACETS.map((facet, index) => ({ id: facet, name: facet, azimuthDeg: index * 45 })),
    nodes,
    edges: linkEdges(entries, (link) => link),
  };
};

// ─── skills: the outcomes the agent loads by name ─────────────────

/** The skills: one `SKILL.md` per folder, `name` and `description` in
 *  the frontmatter. A skill is a node so a change to it can be cited
 *  and, later, proposed. */
export const readSkills = async (root: string, asOf: string): Promise<SliceParts> => {
  const documents = await readMarkdown(root, true);
  const nodes: readonly SliceNode[] = documents
    .flatMap((document) => {
      const name = asString(document.front.name);
      if (!name || path.basename(document.file) !== 'SKILL.md') return [];
      const description = asString(document.front.description);
      return [
        {
          id: `skill/${name}`,
          title: name,
          kind: 'skill',
          axes: [],
          ...(description === undefined ? {} : { summary: description }),
          createdAt: asOf,
          href: path.relative(root, document.file),
          group: 'skills',
        },
      ];
    })
    .toSorted(byId);
  return { axes: [], nodes, edges: [] };
};

const readers: Readonly<Record<SourceKind, (root: string, asOf: string) => Promise<SliceParts>>> = {
  vault: readVault,
  works: readWorks,
  skills: readSkills,
};

/** One blessed source, read. A path that is not there yields nothing
 *  rather than an error: a sibling may simply not be checked out. */
export const readSource = (
  workspaceRoot: string,
  source: Source,
  asOf: string,
): Promise<SliceParts> =>
  readers[source.kind](path.resolve(workspaceRoot, source.path), asOf).catch(() => emptyParts);
