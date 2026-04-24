import matter from 'gray-matter';
import { marked } from 'marked';
import type { Room } from '@/shared/types/common';
import { isPublished, roomSchema, workFrontmatterSchema, type Work } from '@/shared/content/schema';

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

  const parsed = matter(raw);
  const frontmatter = workFrontmatterSchema.safeParse(parsed.data);
  if (!frontmatter.success) {
    throw new Error(`Frontmatter validation failed for ${path}:\n${frontmatter.error.message}`);
  }

  const body = parsed.content;
  const html = marked.parse(body, { async: false });

  return {
    ...frontmatter.data,
    room: room.data,
    slug: slug!,
    body,
    html,
  };
}

// Module-level glob + parse. Runs once per server build. This module is
// SERVER-ONLY BY CONVENTION — imports `marked` and `gray-matter` at the
// top level, which would land in any client chunk that transitively
// imports from here. The client never does: `server-fns.ts` wraps the
// three public functions in `createServerFn`, and the handler bodies
// (the only place this file is referenced) are tree-shaken out of the
// client bundle. Do not import from this file on the client.
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
