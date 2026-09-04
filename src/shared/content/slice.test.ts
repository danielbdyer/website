import { describe, expect, it } from 'vitest';
import { groundingIssues } from '@dby/slice';
import type { Work } from './schema';
import { facetAxes, sliceFromWorks, SITE_SPACE } from './slice';

const NOW = new Date('2026-09-03T12:00:00.000Z');

type Seed = Pick<Work, 'room' | 'slug' | 'title'> & Partial<Work>;

const work = (seed: Seed): Work => ({
  date: new Date('2026-05-01T00:00:00.000Z'),
  facets: [],
  feature: false,
  draft: false,
  body: '',
  html: '',
  backlinks: [],
  ...seed,
});

const cello = work({
  room: 'garden',
  slug: 'cello',
  title: 'The Cello',
  facets: ['body', 'beauty'],
  summary: 'A poem about practice.',
});
const enough = work({
  room: 'study',
  slug: 'enough',
  title: 'Enough',
  type: 'essay',
  facets: ['becoming'],
  backlinks: [{ room: 'garden', slug: 'cello', title: 'The Cello' }],
});
const draft = work({
  room: 'studio',
  slug: 'unfinished',
  title: 'Unfinished',
  draft: true,
  backlinks: [{ room: 'garden', slug: 'cello', title: 'The Cello' }],
});
const later = work({
  room: 'salon',
  slug: 'later',
  title: 'Later',
  date: new Date('2027-01-01T00:00:00.000Z'),
});

describe('the compass', () => {
  it('is the eight facets in bearing order, with azimuth and hue', () => {
    const axes = facetAxes();
    expect(axes.map((axis) => axis.id)).toEqual([
      'craft',
      'body',
      'beauty',
      'language',
      'consciousness',
      'becoming',
      'leadership',
      'relation',
    ]);
    expect(axes.map((axis) => axis.azimuthDeg)).toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
    expect(axes.every((axis) => axis.hue !== undefined)).toBe(true);
  });
});

describe('sliceFromWorks', () => {
  it('cuts published works as nodes, in key order, with their facets as axes', () => {
    const slice = sliceFromWorks([enough, cello], NOW);
    expect(slice.space).toBe(SITE_SPACE);
    expect(slice.asOf).toBe(NOW.toISOString());
    expect(slice.nodes.map((node) => node.id)).toEqual(['garden/cello', 'study/enough']);
    expect(slice.nodes[0]).toEqual({
      id: 'garden/cello',
      title: 'The Cello',
      kind: 'work',
      axes: ['body', 'beauty'],
      summary: 'A poem about practice.',
      createdAt: '2026-05-01T00:00:00.000Z',
      href: '/garden/cello',
      group: 'garden',
    });
    expect(slice.nodes[1]?.kind).toBe('essay');
    expect(slice.nodes[1]).not.toHaveProperty('summary');
  });

  it('carries a wikilink as a declared reference from the linking work', () => {
    const slice = sliceFromWorks([cello, enough], NOW);
    expect(slice.edges).toEqual([
      {
        subject: 'garden/cello',
        predicate: 'references',
        object: 'study/enough',
        origin: 'declared',
      },
    ]);
  });

  it('leaves drafts and future works out, and drops the links they would have carried', () => {
    const slice = sliceFromWorks([cello, enough, draft, later], NOW);
    expect(slice.nodes.map((node) => node.id)).toEqual(['garden/cello', 'study/enough']);
    expect(slice.edges).toHaveLength(1);
    expect(groundingIssues(slice)).toEqual([]);
  });

  it('drops a link from a work that is not in the slice, so every edge stays grounded', () => {
    const linkedFromDraft = work({
      ...enough,
      backlinks: [{ room: 'studio', slug: 'unfinished', title: 'Unfinished' }],
    });
    const slice = sliceFromWorks([cello, linkedFromDraft, draft], NOW);
    expect(slice.edges).toEqual([]);
    expect(groundingIssues(slice)).toEqual([]);
  });

  it('INV-SLC-004: the site proposes nothing; pending is empty', () => {
    const slice = sliceFromWorks([cello, enough], NOW);
    expect(slice.pending).toEqual({ unresolved: 0, ghosts: [] });
  });

  it('INV-SLC-005: carries relations only; the figures are the sky’s to derive', () => {
    const slice = sliceFromWorks([cello, enough], NOW);
    expect(
      slice.edges.every((edge) => edge.origin === 'declared' && edge.predicate === 'references'),
    ).toBe(true);
  });

  it('is deterministic in its input and in now', () => {
    expect(sliceFromWorks([enough, cello], NOW)).toEqual(sliceFromWorks([cello, enough], NOW));
  });
});
