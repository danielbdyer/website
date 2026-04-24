import { describe, it, expect } from 'vitest';
import { parseWork } from './loader';

describe('parseWork', () => {
  it('parses valid frontmatter and body into a Work', () => {
    const raw = `---
title: A Poem
date: 2026-03-14
---

The first line.
The second line.
`;
    const work = parseWork('/src/content/garden/a-poem.md', raw);

    expect(work.title).toBe('A Poem');
    expect(work.date).toEqual(new Date('2026-03-14'));
    expect(work.room).toBe('garden');
    expect(work.slug).toBe('a-poem');
    expect(work.draft).toBe(false);
    expect(work.facets).toEqual([]);
    expect(work.body).toContain('The first line.');
    expect(work.html).toContain('<p>');
    expect(work.html).toContain('The first line.');
  });

  it('includes optional fields when present', () => {
    const raw = `---
title: An Essay
date: 2026-04-01
summary: A short line.
facets: [craft, language]
type: essay
draft: true
---

Body.
`;
    const work = parseWork('/src/content/study/an-essay.md', raw);

    expect(work.summary).toBe('A short line.');
    expect(work.facets).toEqual(['craft', 'language']);
    expect(work.type).toBe('essay');
    expect(work.draft).toBe(true);
  });

  it('accepts .mdx paths as well as .md', () => {
    const raw = `---
title: Salon Piece
date: 2026-02-01
---

With an embed.
`;
    const work = parseWork('/src/content/salon/salon-piece.mdx', raw);
    expect(work.slug).toBe('salon-piece');
    expect(work.room).toBe('salon');
  });

  it('throws when the path does not match the expected shape', () => {
    const raw = `---
title: x
date: 2026-01-01
---
body`;
    expect(() =>
      parseWork('/elsewhere/something.md', raw),
    ).toThrow(/unexpected path/);
  });

  it('throws when the room is unknown', () => {
    const raw = `---
title: x
date: 2026-01-01
---
body`;
    expect(() =>
      parseWork('/src/content/ballroom/a-piece.md', raw),
    ).toThrow(/unknown room/);
  });

  it('throws when frontmatter is missing required fields', () => {
    const raw = `---
title: Only title
---
body`;
    expect(() =>
      parseWork('/src/content/garden/no-date.md', raw),
    ).toThrow(/Frontmatter validation failed/);
  });

  it('throws when the date is unparseable', () => {
    const raw = `---
title: Bad date
date: not-a-real-date
---
body`;
    expect(() =>
      parseWork('/src/content/garden/bad-date.md', raw),
    ).toThrow(/Frontmatter validation failed/);
  });

  it('throws when a facet is unknown', () => {
    const raw = `---
title: x
date: 2026-01-01
facets: [craft, imaginary-facet]
---
body`;
    expect(() =>
      parseWork('/src/content/garden/unknown-facet.md', raw),
    ).toThrow(/Frontmatter validation failed/);
  });

  it('throws when a type is unknown', () => {
    const raw = `---
title: x
date: 2026-01-01
type: pamphlet
---
body`;
    expect(() =>
      parseWork('/src/content/studio/bad-type.md', raw),
    ).toThrow(/Frontmatter validation failed/);
  });
});
