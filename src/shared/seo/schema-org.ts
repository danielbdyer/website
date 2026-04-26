import type { Work, WorkImage, WorkReferent } from '@/shared/content/schema';
import type { ReferentType, Room } from '@/shared/types/common';

export const SITE_URL = 'https://danielbdyer.com';
export const SITE_NAME = 'Danny Dyer';

// Stable @id anchors — the JSON-LD graph is built relationally. Every
// node that appears more than once in a page's payload is referenced via
// `@id` rather than re-inlined, so a crawler can resolve "Danny" once
// and link the WebSite, every Work, and every breadcrumb to the same
// canonical Person node.
const PERSON_ID = `${SITE_URL}#person`;
const SITE_ID = `${SITE_URL}#site`;
const workId = (work: Work) => `${SITE_URL}/${work.room}/${work.slug}#work`;
const imageId = (work: Work) => `${SITE_URL}/${work.room}/${work.slug}#image`;
const referentId = (work: Work) => `${SITE_URL}/${work.room}/${work.slug}#about`;
const roomId = (room: Room) => `${SITE_URL}/${room}#room`;

const ROOM_LABELS: Record<Room, string> = {
  foyer: 'Home',
  studio: 'The Studio',
  garden: 'The Garden',
  study: 'The Study',
  salon: 'The Salon',
};

const WORK_TYPE_TO_SCHEMA = {
  poem: 'Poem',
  essay: 'Article',
  'case-study': 'Article',
  note: 'Article',
} as const;

// Each referent type maps to a Schema.org class. The mapping is canonical
// per Schema.org's CreativeWork hierarchy; a `book` is `Book`, a
// `music-composition` is `MusicComposition`, etc.
const REFERENT_TYPE_TO_SCHEMA: Record<ReferentType, string> = {
  'visual-artwork': 'VisualArtwork',
  'music-composition': 'MusicComposition',
  'music-album': 'MusicAlbum',
  'music-recording': 'MusicRecording',
  book: 'Book',
  article: 'Article',
  movie: 'Movie',
};

// Schema.org uses different property names for the creator depending on
// the referent type. A book's creator is `author`; a composition's
// creator is `composer`; a recording's `byArtist`; a film's `director`.
// Falling back to `creator` is always valid and is what we use for
// VisualArtwork (Klimt is the artwork's creator, not its "author").
function creatorPropertyFor(type: ReferentType): string {
  switch (type) {
    case 'book':
    case 'article':
      return 'author';
    case 'music-composition':
      return 'composer';
    case 'music-album':
    case 'music-recording':
      return 'byArtist';
    case 'movie':
      return 'director';
    case 'visual-artwork':
      return 'creator';
  }
}

export interface SchemaOrgNode {
  '@context'?: 'https://schema.org';
  '@type': string;
  '@id'?: string;
  [key: string]: unknown;
}

interface PersonNode extends SchemaOrgNode {
  '@type': 'Person';
  name: string;
  url: string;
}

function personNode(opts: { withId?: boolean } = {}): PersonNode {
  const node: PersonNode = {
    '@type': 'Person',
    name: SITE_NAME,
    url: SITE_URL,
  };
  if (opts.withId) node['@id'] = PERSON_ID;
  return node;
}

export function personSchema(): SchemaOrgNode {
  return {
    '@context': 'https://schema.org',
    ...personNode({ withId: true }),
  };
}

export function websiteSchema(): SchemaOrgNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    author: personNode({ withId: true }),
  };
}

function imageObjectNode(work: Work, image: WorkImage): SchemaOrgNode {
  const url = image.src.startsWith('http') ? image.src : `${SITE_URL}${image.src}`;
  const node: SchemaOrgNode = {
    '@type': 'ImageObject',
    '@id': imageId(work),
    url,
    contentUrl: url,
    name: image.alt,
  };
  if (image.caption) node.caption = image.caption;
  if (image.credit) node.creditText = image.credit;
  return node;
}

function referentNode(work: Work, referent: WorkReferent): SchemaOrgNode {
  const node: SchemaOrgNode = {
    '@type': REFERENT_TYPE_TO_SCHEMA[referent.type],
    '@id': referentId(work),
    name: referent.name,
  };
  if (referent.year !== undefined) node.dateCreated = String(referent.year);
  if (referent.url) node.url = referent.url;
  if (referent.creator) {
    const property = creatorPropertyFor(referent.type);
    const creatorNode: SchemaOrgNode = {
      '@type': 'Person',
      name: referent.creator.name,
    };
    if (referent.creator.url) creatorNode.url = referent.creator.url;
    node[property] = creatorNode;
  }
  return node;
}

export function workSchema(work: Work): SchemaOrgNode {
  const url = `${SITE_URL}/${work.room}/${work.slug}`;
  const schemaType = work.type ? WORK_TYPE_TO_SCHEMA[work.type] : 'CreativeWork';
  const node: SchemaOrgNode & Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': workId(work),
    headline: work.title,
    name: work.title,
    datePublished: work.date.toISOString(),
    author: personNode({ withId: true }),
    url,
    inLanguage: 'en',
    isPartOf: { '@id': roomId(work.room) },
  };
  if (work.summary) node.description = work.summary;
  if (work.facets.length > 0) node.keywords = work.facets.join(', ');
  if (work.image) {
    node.image = imageObjectNode(work, work.image);
    node.primaryImageOfPage = { '@id': imageId(work) };
  }
  if (work.referent) {
    node.about = referentNode(work, work.referent);
    node.mentions = { '@id': referentId(work) };
  }
  return node;
}

export function breadcrumbSchema(work: Work): SchemaOrgNode {
  const roomLabel = ROOM_LABELS[work.room];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: roomLabel,
        item: `${SITE_URL}/${work.room}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: work.title,
        item: `${SITE_URL}/${work.room}/${work.slug}`,
      },
    ],
  };
}
