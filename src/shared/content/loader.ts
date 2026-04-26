import yaml from 'js-yaml';
import { marked } from 'marked';
import type { Room } from '@/shared/types/common';
import { isPublished, roomSchema, workFrontmatterSchema, type Work } from '@/shared/content/schema';

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

/**
 * Parse a raw markdown file into a Work.
 *
 * Pure function — given a path and the raw file contents, returns a validated
 * Work or throws a descriptive error. Exported primarily so the parsing logic
 * is directly testable with fixture strings, without needing a Vite context.
 *
 * See CONTENT_SCHEMA.md for the trust stance on markdown rendering:
 * the source is the trusted repo, so marked output is not sanitized.
 */
export function parseWork(path: string, raw: string): Work {
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

  const body = parsed.content;
  // Poems are carried by their line breaks. Default markdown collapses single
  // newlines into spaces; for poems, every newline is a `<br>`. Other types
  // keep CommonMark's default paragraph behavior, where line breaks within a
  // paragraph are soft wraps and a blank line begins a new paragraph.
  const breaks = frontmatter.data.type === 'poem';
  const html = marked.parse(body, { async: false, breaks });

  return {
    ...frontmatter.data,
    room: room.data,
    slug: slug!,
    body,
    html,
  };
}

// Module-level glob + parse. Runs once per environment that imports
// this module — Node during prerender, the browser after hydration when
// a client-side route loader needs data the SSR cache doesn't have.
// Both `marked` and `js-yaml` are browser-safe; the parse is fast on
// the small content set today. Bundle weight is held in BACKLOG ("Move
// `marked` and `gray-matter` back off the client bundle") for the day
// it earns the migration to a build-time JSON manifest.
const rawFiles = import.meta.glob('/src/content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const allWorks: Work[] = Object.entries(rawFiles).map(([path, raw]) => parseWork(path, raw));

const isProduction = import.meta.env.PROD;

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
