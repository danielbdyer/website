import { z } from 'zod';
import type { Room, Facet } from '@/shared/types/common';

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

export type WorkType = (typeof TYPES)[number];

export const roomSchema = z.enum(ROOMS);
export const facetSchema = z.enum(FACETS);
export const workTypeSchema = z.enum(TYPES);

export const workFrontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), {
    message: 'Invalid date — expected a parseable date string',
  }),
  summary: z.string().optional(),
  facets: z.array(facetSchema).default([]),
  type: workTypeSchema.optional(),
  draft: z.boolean().default(false),
});

export type WorkFrontmatter = z.infer<typeof workFrontmatterSchema>;

export interface Work extends WorkFrontmatter {
  room: Room;
  slug: string;
  body: string;
}

export function isPublished(work: Work, now: Date = new Date()): boolean {
  return !work.draft && work.date <= now;
}
