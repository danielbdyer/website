import { z } from 'zod';
import type { Room, Facet, Posture, ReferentType } from '@/shared/types/common';

const ROOMS = ['foyer', 'studio', 'garden', 'study', 'salon'] as const satisfies readonly Room[];

const FACETS = [
  'craft',
  'consciousness',
  'language',
  'leadership',
  'beauty',
  'becoming',
  'relation',
  'body',
] as const satisfies readonly Facet[];

const TYPES = ['poem', 'essay', 'case-study', 'note'] as const;

const POSTURES = ['listening', 'looking', 'reading'] as const satisfies readonly Posture[];

const REFERENT_TYPES = [
  'visual-artwork',
  'music-composition',
  'music-album',
  'music-recording',
  'book',
  'article',
  'movie',
] as const satisfies readonly ReferentType[];

export type WorkType = (typeof TYPES)[number];

export const roomSchema = z.enum(ROOMS);
export const facetSchema = z.enum(FACETS);
export const workTypeSchema = z.enum(TYPES);
export const postureSchema = z.enum(POSTURES);
export const referentTypeSchema = z.enum(REFERENT_TYPES);

// A person referenced in the structured-data graph — the creator of an
// external referent (Klimt for a Stoclet frieze entry, Bach for a Suite
// entry). Distinct from the site's `Person` (Danny), which is built into
// the JSON-LD pipeline rather than authored.
export const personRefSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
});

// The external creative work a salon entry is *about* — the artwork,
// composition, book, or article whose encounter the entry documents.
// Carries enough structure for Schema.org `about` to render relationally
// (referent → creator → role-aware property like `composer`/`author`).
export const referentSchema = z.object({
  type: referentTypeSchema,
  name: z.string().min(1),
  creator: personRefSchema.optional(),
  year: z.number().int().optional(),
  url: z.string().url().optional(),
});

// A single image attached to a work. Optional — most works have none.
// `caption` carries human-visible attribution ("Klimt — Stoclet frieze");
// `credit` carries machine-visible attribution for Schema.org `creditText`.
// The two are intentionally separate; a caption can be evocative where a
// credit must be exact.
export const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

export const workFrontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), {
    message: 'Invalid date — expected a parseable date string',
  }),
  summary: z.string().optional(),
  facets: z.array(facetSchema).default([]),
  type: workTypeSchema.optional(),
  // Posture is meaningful on Salon works. The schema does not refuse it
  // elsewhere (no per-room frontmatter constraints today), but content
  // outside the Salon should not carry it. See DOMAIN_MODEL.md §Postures.
  posture: postureSchema.optional(),
  image: imageSchema.optional(),
  referent: referentSchema.optional(),
  // Authorial flag: when true, the facet-page masonry treats this work
  // as a hero interjection — a larger card that breaks the descending
  // rhythm. Default off; curated, not inferred.
  feature: z.boolean().default(false),
  draft: z.boolean().default(false),
});

export type WorkFrontmatter = z.infer<typeof workFrontmatterSchema>;
export type WorkImage = z.infer<typeof imageSchema>;
export type WorkReferent = z.infer<typeof referentSchema>;

export interface Work extends WorkFrontmatter {
  room: Room;
  slug: string;
  /** Raw markdown body, for syndication feeds and for re-rendering if needed. */
  body: string;
  /** Pre-rendered HTML, computed at load time so WorkView does not re-parse per render. */
  html: string;
}

export function isPublished(work: Work, now: Date = new Date()): boolean {
  return !work.draft && work.date <= now;
}
