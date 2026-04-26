import { describe, it, expect } from 'vitest';
import {
  invertOutboundGraph,
  parseWikilinkInner,
  resolveWikilink,
  scanWikilinks,
  slugIndexKey,
  type SlugIndex,
  type WikilinkTarget,
} from './wikilinks';

describe('parseWikilinkInner', () => {
  it('parses a bare slug', () => {
    expect(parseWikilinkInner('a-poem')).toEqual({
      room: undefined,
      slug: 'a-poem',
      display: undefined,
    });
  });

  it('parses a room/slug', () => {
    expect(parseWikilinkInner('garden/a-poem')).toEqual({
      room: 'garden',
      slug: 'a-poem',
      display: undefined,
    });
  });

  it('parses an override display segment', () => {
    expect(parseWikilinkInner('garden/a-poem|that morning')).toEqual({
      room: 'garden',
      slug: 'a-poem',
      display: 'that morning',
    });
  });

  it('returns null for unknown rooms', () => {
    expect(parseWikilinkInner('unknown/slug')).toBeNull();
  });

  it('returns null for empty inner', () => {
    expect(parseWikilinkInner('')).toBeNull();
    expect(parseWikilinkInner('   ')).toBeNull();
  });

  it('returns null for too-deep paths', () => {
    expect(parseWikilinkInner('a/b/c')).toBeNull();
  });
});

describe('scanWikilinks', () => {
  it('finds every [[...]] in a body', () => {
    const body = 'See [[a]] and also [[garden/b]] for more, with [[c|display]].';
    const tokens = scanWikilinks(body);
    expect(tokens).toHaveLength(3);
    expect(tokens[0]?.slug).toBe('a');
    expect(tokens[1]?.room).toBe('garden');
    expect(tokens[2]?.display).toBe('display');
  });

  it('skips invalid wikilinks silently', () => {
    const body = 'Bad [[]] and [[unknown/slug]] and good [[ok]].';
    const tokens = scanWikilinks(body);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.slug).toBe('ok');
  });
});

describe('resolveWikilink', () => {
  const target: WikilinkTarget = { room: 'garden', slug: 'a-poem', title: 'A Poem' };
  const index: SlugIndex = new Map([[slugIndexKey('garden', 'a-poem'), target]]);

  it('resolves a bare slug against the current room', () => {
    const resolved = resolveWikilink(
      { room: undefined, slug: 'a-poem', display: undefined },
      'garden',
      index,
    );
    expect(resolved?.target).toEqual(target);
    expect(resolved?.display).toBe('A Poem');
  });

  it('resolves a cross-room reference', () => {
    const resolved = resolveWikilink(
      { room: 'garden', slug: 'a-poem', display: undefined },
      'studio',
      index,
    );
    expect(resolved?.target).toEqual(target);
  });

  it('returns null when the bare slug does not exist in the current room', () => {
    const resolved = resolveWikilink(
      { room: undefined, slug: 'a-poem', display: undefined },
      'studio',
      index,
    );
    expect(resolved).toBeNull();
  });

  it('honors override display text', () => {
    const resolved = resolveWikilink(
      { room: undefined, slug: 'a-poem', display: 'that poem' },
      'garden',
      index,
    );
    expect(resolved?.display).toBe('that poem');
  });
});

describe('invertOutboundGraph', () => {
  it('inverts edges and sorts backlinks newest-first', () => {
    const a: WikilinkTarget = { room: 'studio', slug: 'a', title: 'A' };
    const b: WikilinkTarget = { room: 'studio', slug: 'b', title: 'B' };
    const c: WikilinkTarget = { room: 'studio', slug: 'c', title: 'C' };
    const sources = new Map([
      [slugIndexKey('studio', 'a'), a],
      [slugIndexKey('studio', 'b'), b],
      [slugIndexKey('studio', 'c'), c],
    ]);
    const outbound = new Map([
      [slugIndexKey('studio', 'a'), [c]],
      [slugIndexKey('studio', 'b'), [c]],
    ]);
    const dates = new Map<string, Date>([
      [slugIndexKey('studio', 'a'), new Date('2024-01-01')],
      [slugIndexKey('studio', 'b'), new Date('2025-06-15')],
      [slugIndexKey('studio', 'c'), new Date('2026-03-01')],
    ]);
    const inverted = invertOutboundGraph(outbound, sources, (k) => dates.get(k) ?? new Date(0));
    const cBacklinks = inverted.get(slugIndexKey('studio', 'c'));
    expect(cBacklinks).toBeDefined();
    expect(cBacklinks).toHaveLength(2);
    // newest-first: b (2025) before a (2024)
    expect(cBacklinks?.[0]?.slug).toBe('b');
    expect(cBacklinks?.[1]?.slug).toBe('a');
  });
});
