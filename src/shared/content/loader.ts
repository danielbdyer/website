import yaml from 'js-yaml';
import { Marked } from 'marked';
import type { Room } from '@/shared/types/common';
import {
  isPublished,
  roomSchema,
  workFrontmatterSchema,
  type BacklinkRef,
  type Work,
  type WorkFrontmatter,
} from '@/shared/content/schema';
import {
  invertOutboundGraph,
  resolveWikilink,
  scanWikilinks,
  slugIndexKey,
  type SlugIndex,
  type WikilinkTarget,
} from '@/shared/content/wikilinks';
import { wikilinkExtension } from '@/shared/content/wikilink-marked';

// Tiny browser-safe frontmatter splitter. Replaces `gray-matter`, which
// reaches for Node's `Buffer` internally and crashes the loader as soon
// as it runs in a browser bundle. The format is well-defined (a leading
// `---\n…\n---\n` block followed by the body); js-yaml handles the YAML
// parse and is itself browser-safe.
function splitFrontmatter(raw: string): { data: unknown; content: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, content: raw };
  const [, frontmatterText, body] = match;
  const data = yaml.load(frontmatterText!) ?? {};
  return { data, content: body ?? '' };
}

interface RawWork {
  path: string;
  frontmatter: WorkFrontmatter;
  room: Room;
  slug: string;
  body: string;
}

// Parse a raw markdown file into the staged shape (no HTML, no
// backlinks). Pure: given a path and raw contents, returns the
// frontmatter + body or throws a descriptive error.
function parseRaw(path: string, raw: string): RawWork {
  const match = /\/src\/content\/([^/]+)\/([^/]+)\.mdx?$/.exec(path);
  if (!match) {
    throw new Error(`Content file at unexpected path: ${path}`);
  }
  const [, roomCandidate, slug] = match;
  const room = roomSchema.safeParse(roomCandidate);
  if (!room.success) {
    throw new Error(`Content file ${path} is in an unknown room: ${roomCandidate}`);
  }
  const parsed = splitFrontmatter(raw);
  const frontmatter = workFrontmatterSchema.safeParse(parsed.data);
  if (!frontmatter.success) {
    throw new Error(`Frontmatter validation failed for ${path}:\n${frontmatter.error.message}`);
  }
  return {
    path,
    frontmatter: frontmatter.data,
    room: room.data,
    slug: slug!,
    body: parsed.content,
  };
}

// Build a slug index from staged works. Each work registers under
// `${room}/${slug}` with its title, the shape wikilink resolution
// expects.
function buildSlugIndex(staged: readonly RawWork[]): SlugIndex {
  const index = new Map<string, WikilinkTarget>();
  for (const w of staged) {
    index.set(slugIndexKey(w.room, w.slug), {
      room: w.room,
      slug: w.slug,
      title: w.frontmatter.title,
    });
  }
  return index;
}

// Render a work's body to HTML, resolving wikilinks against the index.
// Throws on unresolved wikilinks — `GRAPH_AND_LINKING.md` §"Link
// Resolution" commits to loud-fail at build time.
function renderHtml(staged: RawWork, slugIndex: SlugIndex): string {
  const breaks = staged.frontmatter.type === 'poem';
  const m = new Marked();
  m.use(
    wikilinkExtension({
      currentRoom: staged.room,
      resolve: (token) => resolveWikilink(token, staged.room, slugIndex),
      sourceLabel: `${staged.room}/${staged.slug}`,
    }),
  );
  return m.parse(staged.body, { async: false, breaks });
}

// Compute backlinks for the staged corpus. For each source work, scan
// its body for resolved wikilinks; record the outbound graph; invert
// it. Returns a map keyed by `${room}/${slug}`. Drafts are excluded
// from the inversion in production builds — a draft cannot produce a
// published backlink.
function computeBacklinks(
  staged: readonly RawWork[],
  slugIndex: SlugIndex,
  isProd: boolean,
): ReadonlyMap<string, readonly BacklinkRef[]> {
  const outbound = new Map<string, WikilinkTarget[]>();
  for (const w of staged) {
    if (isProd && w.frontmatter.draft) continue;
    const tokens = scanWikilinks(w.body);
    const resolvedTargets: WikilinkTarget[] = [];
    for (const token of tokens) {
      const resolved = resolveWikilink(token, w.room, slugIndex);
      if (resolved) resolvedTargets.push(resolved.target);
    }
    if (resolvedTargets.length > 0) {
      outbound.set(slugIndexKey(w.room, w.slug), resolvedTargets);
    }
  }
  const dateLookup = (key: string): Date => {
    const parts = key.split('/');
    const w = staged.find((s) => s.room === parts[0] && s.slug === parts[1]);
    return w?.frontmatter.date ?? new Date(0);
  };
  return invertOutboundGraph(outbound, slugIndex, dateLookup);
}

// The full pipeline: stage all files, build the slug index, render
// HTML, compute backlinks, and assemble the Work[]. Pure given the
// input map. Used both by the eager glob and by tests that want to
// exercise the full pipeline.
export function parseWorks(files: Record<string, string>, isProd = false): Work[] {
  const staged = Object.entries(files).map(([path, raw]) => parseRaw(path, raw));
  const slugIndex = buildSlugIndex(staged);
  const backlinkMap = computeBacklinks(staged, slugIndex, isProd);
  return staged.map((w) => ({
    ...w.frontmatter,
    room: w.room,
    slug: w.slug,
    body: w.body,
    html: renderHtml(w, slugIndex),
    backlinks: backlinkMap.get(slugIndexKey(w.room, w.slug)) ?? [],
  }));
}

// Single-work parse for tests and ad-hoc use. Wikilinks fail-soft when
// no slug index is provided — the link renders as plain text fallback
// so a unit test of frontmatter doesn't have to construct a full
// corpus. Production loader uses `parseWorks` instead, which has the
// real strictness.
export function parseWork(path: string, raw: string): Work {
  const staged = parseRaw(path, raw);
  const slugIndex = buildSlugIndex([staged]);
  return {
    ...staged.frontmatter,
    room: staged.room,
    slug: staged.slug,
    body: staged.body,
    html: renderHtml(staged, slugIndex),
    backlinks: [],
  };
}

// Module-level glob + parse. Runs once per environment that imports
// this module — Node during prerender, the browser after hydration when
// a client-side route loader needs data the SSR cache doesn't have.
// Both `marked` and `js-yaml` are browser-safe; the parse is fast on
// the small content set today. Bundle weight is held in BACKLOG ("Move
// `marked` and `gray-matter` back off the client bundle") for the day
// it earns the migration to a build-time JSON manifest.
// Vite's `import.meta.glob` returns `Record<string, unknown>` despite the
// `import: 'default'` option promising `string` content; the explicit
// type annotation narrows it.
const rawFiles: Record<string, string> = import.meta.glob('/src/content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const isProduction = import.meta.env.PROD;
const allWorks: Work[] = parseWorks(rawFiles, isProduction);

export function getAllWorksSync(): Work[] {
  if (isProduction) return allWorks.filter((w) => isPublished(w));
  return allWorks;
}

export function getWorksByRoomSync(room: Room): Work[] {
  return getAllWorksSync()
    .filter((w) => w.room === room)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getWorkSync(room: Room, slug: string): Work | undefined {
  return getAllWorksSync().find((w) => w.room === room && w.slug === slug);
}
