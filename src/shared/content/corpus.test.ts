import { describe, it, expect } from 'vitest';
import { parseWorks } from './loader';

// The corpus guard. `CONTENT_SCHEMA.md` commits that the filesystem is
// the schema and that the build catches errors loudly; `GRAPH_AND_LINKING.md`
// commits that an unresolved wikilink fails the build. Both promises
// were only kept at build time. This test keeps them at commit time:
// lint-staged runs it whenever a file under `src/content/` is staged
// (see `lint-staged.config.js`), so a malformed date, an unknown facet,
// a slug with a capital in it, or a `[[link]]` to a work that does not
// exist surfaces before the commit lands rather than on the next deploy.
//
// It reads the real corpus through its own glob — the same pattern the
// loader uses — and runs the production pipeline (`isProd = true`), the
// strictest of the two modes. Every failure names the file.

const rawFiles: Record<string, string> = import.meta.glob('/src/content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

// `CONTENT_SCHEMA.md` §"The filename is the slug": lowercase kebab-case,
// no spaces, no underscores, no capitals.
const KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugOf = (path: string): string => path.replace(/^.*\//, '').replace(/\.mdx?$/, '');

const paths = Object.keys(rawFiles).toSorted();

describe('the corpus on disk', () => {
  it('has at least one work', () => {
    expect(paths.length).toBeGreaterThan(0);
  });

  it.each(paths)('%s is named in lowercase kebab-case', (path) => {
    expect(slugOf(path)).toMatch(KEBAB_SLUG);
  });

  it('parses under production strictness: frontmatter valid, every wikilink resolved', () => {
    // parseWorks throws with the offending path in the message; letting
    // the throw surface keeps the failure legible in the commit output.
    const works = parseWorks(rawFiles, true);
    expect(works).toHaveLength(paths.length);
  });

  it('holds no two works at the same room/slug address', () => {
    const addresses = paths.map((p) => p.replace(/^\/src\/content\//, '').replace(/\.mdx?$/, ''));
    expect(new Set(addresses).size).toBe(addresses.length);
  });
});
