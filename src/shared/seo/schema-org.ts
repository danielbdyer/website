import type { Work } from '@/shared/content/schema';
import type { Room } from '@/shared/types/common';

export const SITE_URL = 'https://danielbdyer.com';
export const SITE_NAME = 'Danny Dyer';

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

export interface SchemaOrgNode {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

interface PersonNode {
  '@type': 'Person';
  name: string;
  url: string;
}

function personNode(): PersonNode {
  return {
    '@type': 'Person',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function personSchema(): SchemaOrgNode {
  return {
    '@context': 'https://schema.org',
    ...personNode(),
  };
}

export function websiteSchema(): SchemaOrgNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    author: personNode(),
  };
}

export function workSchema(work: Work): SchemaOrgNode {
  const schemaType = work.type ? WORK_TYPE_TO_SCHEMA[work.type] : 'CreativeWork';
  const base: SchemaOrgNode = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: work.title,
    name: work.title,
    datePublished: work.date.toISOString(),
    author: personNode(),
    url: `${SITE_URL}/${work.room}/${work.slug}`,
  };
  if (work.summary) base.description = work.summary;
  if (work.facets.length > 0) base.keywords = work.facets.join(', ');
  return base;
}

export function breadcrumbSchema(work: Work): SchemaOrgNode {
  const roomLabel = ROOM_LABELS[work.room];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: roomLabel, item: `${SITE_URL}/${work.room}` },
      {
        '@type': 'ListItem',
        position: 3,
        name: work.title,
        item: `${SITE_URL}/${work.room}/${work.slug}`,
      },
    ],
  };
}
