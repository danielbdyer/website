import { describe, it, expect } from 'vitest';
import { breadcrumbSchema, personSchema, SITE_URL, websiteSchema, workSchema } from './schema-org';
import type { Work } from '@/shared/content/schema';

function makeWork(overrides: Partial<Work> = {}): Work {
  return {
    title: 'A Poem',
    date: new Date('2026-03-14'),
    facets: [],
    feature: false,
    draft: false,
    backlinks: [],
    room: 'garden',
    slug: 'a-poem',
    body: 'Line one.\nLine two.',
    html: '<p>Line one.<br>Line two.</p>',
    ...overrides,
  };
}

describe('schema.org builders', () => {
  it('personSchema emits the canonical Person node with @id', () => {
    const schema = personSchema();
    expect(schema['@type']).toBe('Person');
    expect(schema.name).toBe('Danny Dyer');
    expect(schema.url).toBe(SITE_URL);
    expect(schema['@id']).toBe(`${SITE_URL}#person`);
  });

  it('websiteSchema emits a WebSite with author as nested Person referencing the canonical @id', () => {
    const schema = websiteSchema();
    expect(schema['@type']).toBe('WebSite');
    expect(schema['@id']).toBe(`${SITE_URL}#site`);
    const author = schema.author as { '@type': string; '@id': string; name: string };
    expect(author['@type']).toBe('Person');
    expect(author['@id']).toBe(`${SITE_URL}#person`);
    expect(author.name).toBe('Danny Dyer');
  });

  it('workSchema maps poem type to Poem', () => {
    const schema = workSchema(makeWork({ type: 'poem' }));
    expect(schema['@type']).toBe('Poem');
    expect(schema.headline).toBe('A Poem');
    expect(schema.url).toBe(`${SITE_URL}/garden/a-poem`);
    expect(schema['@id']).toBe(`${SITE_URL}/garden/a-poem#work`);
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

  it('workSchema sets isPartOf with the canonical room @id', () => {
    const schema = workSchema(makeWork({ room: 'salon' }));
    expect(schema.isPartOf).toEqual({ '@id': `${SITE_URL}/salon#room` });
  });

  it('workSchema attaches an ImageObject and a primaryImageOfPage @id reference', () => {
    const schema = workSchema(
      makeWork({
        image: {
          src: '/images/salon/klimt.jpg',
          alt: 'Detail of the Stoclet Frieze',
          caption: 'Klimt — Stoclet Frieze',
          credit: 'Gustav Klimt, 1911',
        },
      }),
    );
    const image = schema.image as Record<string, unknown>;
    expect(image['@type']).toBe('ImageObject');
    expect(image['@id']).toBe(`${SITE_URL}/garden/a-poem#image`);
    expect(image.url).toBe(`${SITE_URL}/images/salon/klimt.jpg`);
    expect(image.contentUrl).toBe(`${SITE_URL}/images/salon/klimt.jpg`);
    expect(image.caption).toBe('Klimt — Stoclet Frieze');
    expect(image.creditText).toBe('Gustav Klimt, 1911');
    expect(schema.primaryImageOfPage).toEqual({ '@id': `${SITE_URL}/garden/a-poem#image` });
  });

  it('workSchema preserves an absolute image URL as-is', () => {
    const schema = workSchema(
      makeWork({
        image: {
          src: 'https://cdn.example.com/img.jpg',
          alt: 'Remote image',
        },
      }),
    );
    const image = schema.image as Record<string, unknown>;
    expect(image.url).toBe('https://cdn.example.com/img.jpg');
  });

  it('workSchema models a music-composition referent as MusicComposition with composer', () => {
    const schema = workSchema(
      makeWork({
        room: 'salon',
        slug: 'bach',
        referent: {
          type: 'music-composition',
          name: 'Cello Suite No. 1',
          creator: { name: 'Johann Sebastian Bach' },
          year: 1717,
        },
      }),
    );
    const about = schema.about as Record<string, unknown>;
    expect(about['@type']).toBe('MusicComposition');
    expect(about['@id']).toBe(`${SITE_URL}/salon/bach#about`);
    expect(about.name).toBe('Cello Suite No. 1');
    expect(about.dateCreated).toBe('1717');
    const composer = about.composer as Record<string, unknown>;
    expect(composer['@type']).toBe('Person');
    expect(composer.name).toBe('Johann Sebastian Bach');
    expect(schema.mentions).toEqual({ '@id': `${SITE_URL}/salon/bach#about` });
  });

  it('workSchema models a visual-artwork referent as VisualArtwork with creator', () => {
    const schema = workSchema(
      makeWork({
        room: 'salon',
        slug: 'klimt',
        referent: {
          type: 'visual-artwork',
          name: 'Stoclet Frieze',
          creator: { name: 'Gustav Klimt' },
          year: 1911,
        },
      }),
    );
    const about = schema.about as Record<string, unknown>;
    expect(about['@type']).toBe('VisualArtwork');
    const creator = about.creator as Record<string, unknown>;
    expect(creator.name).toBe('Gustav Klimt');
    expect(about.composer).toBeUndefined();
    expect(about.author).toBeUndefined();
  });

  it('workSchema models a book referent as Book with author', () => {
    const schema = workSchema(
      makeWork({
        room: 'salon',
        slug: 'a-bigger-book',
        referent: {
          type: 'book',
          name: 'A Bigger Book',
          creator: { name: 'David Hockney' },
          year: 2016,
        },
      }),
    );
    const about = schema.about as Record<string, unknown>;
    expect(about['@type']).toBe('Book');
    const author = about.author as Record<string, unknown>;
    expect(author['@type']).toBe('Person');
    expect(author.name).toBe('David Hockney');
    expect(about.creator).toBeUndefined();
  });

  it('workSchema omits about and mentions when no referent is set', () => {
    const schema = workSchema(makeWork());
    expect(schema.about).toBeUndefined();
    expect(schema.mentions).toBeUndefined();
  });

  it('breadcrumbSchema produces a three-item trail with Home, Room, Work', () => {
    const schema = breadcrumbSchema(makeWork());
    const items = schema.itemListElement as { position: number; name: string; item: string }[];
    expect(items).toHaveLength(3);
    expect(items[0]!.name).toBe('Home');
    expect(items[0]!.item).toBe(SITE_URL);
    expect(items[1]!.name).toBe('The Garden');
    expect(items[1]!.item).toBe(`${SITE_URL}/garden`);
    expect(items[2]!.name).toBe('A Poem');
    expect(items[2]!.item).toBe(`${SITE_URL}/garden/a-poem`);
  });
});
