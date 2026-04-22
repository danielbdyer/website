import { describe, it, expect } from 'vitest';
import {
  breadcrumbSchema,
  personSchema,
  SITE_URL,
  websiteSchema,
  workSchema,
} from './schema-org';
import type { Work } from '@/shared/content/schema';

function makeWork(overrides: Partial<Work> = {}): Work {
  return {
    title: 'A Poem',
    date: new Date('2026-03-14'),
    facets: [],
    draft: false,
    room: 'garden',
    slug: 'a-poem',
    body: 'Line one.\nLine two.',
    ...overrides,
  };
}

describe('schema.org builders', () => {
  it('personSchema emits the canonical Person node', () => {
    const schema = personSchema();
    expect(schema['@type']).toBe('Person');
    expect(schema.name).toBe('Danny Dyer');
    expect(schema.url).toBe(SITE_URL);
  });

  it('websiteSchema emits a WebSite with author as nested Person', () => {
    const schema = websiteSchema();
    expect(schema['@type']).toBe('WebSite');
    expect(schema.name).toBe('Danny Dyer');
    expect(schema.url).toBe(SITE_URL);
    const author = schema.author as { '@type': string; name: string };
    expect(author['@type']).toBe('Person');
    expect(author.name).toBe('Danny Dyer');
  });

  it('workSchema maps poem type to Poem', () => {
    const schema = workSchema(makeWork({ type: 'poem' }));
    expect(schema['@type']).toBe('Poem');
    expect(schema.headline).toBe('A Poem');
    expect(schema.url).toBe(`${SITE_URL}/garden/a-poem`);
  });

  it('workSchema maps essay/case-study/note to Article', () => {
    expect(workSchema(makeWork({ type: 'essay' }))['@type']).toBe('Article');
    expect(workSchema(makeWork({ type: 'case-study' }))['@type']).toBe('Article');
    expect(workSchema(makeWork({ type: 'note' }))['@type']).toBe('Article');
  });

  it('workSchema falls back to CreativeWork when type is unset', () => {
    const schema = workSchema(makeWork({ type: undefined }));
    expect(schema['@type']).toBe('CreativeWork');
  });

  it('workSchema includes datePublished as ISO string', () => {
    const schema = workSchema(makeWork());
    expect(schema.datePublished).toBe('2026-03-14T00:00:00.000Z');
  });

  it('workSchema includes description only when summary is present', () => {
    expect(workSchema(makeWork()).description).toBeUndefined();
    expect(workSchema(makeWork({ summary: 'A line.' })).description).toBe('A line.');
  });

  it('workSchema joins facets as comma-separated keywords', () => {
    const schema = workSchema(makeWork({ facets: ['craft', 'language'] }));
    expect(schema.keywords).toBe('craft, language');
  });

  it('workSchema omits keywords when facets are empty', () => {
    const schema = workSchema(makeWork({ facets: [] }));
    expect(schema.keywords).toBeUndefined();
  });

  it('breadcrumbSchema produces a three-item trail with Home, Room, Work', () => {
    const schema = breadcrumbSchema(makeWork());
    const items = schema.itemListElement as Array<{ position: number; name: string; item: string }>;
    expect(items).toHaveLength(3);
    expect(items[0]!.name).toBe('Home');
    expect(items[0]!.item).toBe(SITE_URL);
    expect(items[1]!.name).toBe('The Garden');
    expect(items[1]!.item).toBe(`${SITE_URL}/garden`);
    expect(items[2]!.name).toBe('A Poem');
    expect(items[2]!.item).toBe(`${SITE_URL}/garden/a-poem`);
  });
});
