import matter from 'gray-matter';
import { marked } from 'marked';
import type { Room } from '@/shared/types/common';
import {
  isPublished,
  roomSchema,
  workFrontmatterSchema,
  type Work,
} from '@/shared/content/schema';

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
  // Path looks like /src/content/{room}/{slug}.md or /src/content/{room}/{slug}.mdx
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
    throw new Error(
      `Frontmatter validation failed for ${path}:\n${frontmatter.error.message}`,
    );
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

// Vite resolves this at build time; see CONTENT_SCHEMA.md.
// Empty today — src/content/ does not exist yet. The glob is harmless
// when no files match; it returns {} and produces an empty Works set.
const rawFiles = import.meta.glob('/src/content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const allWorks: Work[] = Object.entries(rawFiles).map(([path, raw]) => parseWork(path, raw));

const isProduction = import.meta.env.PROD;

export function getAllWorks(): Work[] {
  if (isProduction) {
    return allWorks.filter((w) => isPublished(w));
  }
  return allWorks;
}

export function getWorksByRoom(room: Room): Work[] {
  return getAllWorks()
    .filter((w) => w.room === room)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getWork(room: Room, slug: string): Work | undefined {
  return getAllWorks().find((w) => w.room === room && w.slug === slug);
}
