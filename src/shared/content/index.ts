import type { Facet, Room } from '@/shared/types/common';
import type { Work } from './schema';
import type { DisplayWork } from './preview';
import { getAllWorksSync, getWorksByRoomSync, getWorkSync } from './loader';
import {
  getDisplayWorksByRoomSync,
  getDisplayWorkSync,
  getDisplayWorksByFacetGroupedSync,
  getDisplayWorksByFacetsSync,
} from './display';

export {
  workFrontmatterSchema,
  roomSchema,
  facetSchema,
  workTypeSchema,
  postureSchema,
  referentTypeSchema,
  isPublished,
  type Work,
  type WorkFrontmatter,
  type WorkImage,
  type WorkReferent,
  type WorkType,
} from './schema';
export {
  SAMPLE_ROOM_NOTE,
  SAMPLE_WORK_NOTE,
  isPreviewWork,
  type DisplayWork,
  type PreviewMeta,
} from './preview';

// ─── Isomorphic content API ────────────────────────────────────────
//
// The site is pure SSG (RENDERING_STRATEGY.md §SSG Stance). There is no
// server runtime in production, so a previous experiment that wrapped
// these reads in `createServerFn` broke the moment client-side
// navigation re-ran a route loader (the client-side stub fetches the
// handler over HTTP, which 404s with no server). The fix is to drop the
// server-fn boundary and call the loader directly.
//
// **The contract is async even though the implementation is sync.**
// Route loaders `await` these functions; if the data layer ever moves
// to fetched JSON manifests (BACKLOG: bundle-weight-aware split) or a
// selective hybrid where one route reads from a CMS at request time,
// the route surface does not change. Keep it that way: never expose a
// sync content function on this barrel, even if today it returns
// instantly. The async signature is the architectural seam.
//
// `parseWork` is intentionally not re-exported — tests import it from
// `./loader` directly to avoid pulling unrelated callers into the
// loader module's eager glob.

export async function getAllWorks(): Promise<Work[]> {
  return getAllWorksSync();
}

export async function getWorksByRoom(room: Room): Promise<Work[]> {
  return getWorksByRoomSync(room);
}

export async function getWork(room: Room, slug: string): Promise<Work | undefined> {
  return getWorkSync(room, slug);
}

export async function getDisplayWorksByRoom(room: Room): Promise<DisplayWork[]> {
  return getDisplayWorksByRoomSync(room);
}

export async function getDisplayWork(room: Room, slug: string): Promise<DisplayWork | undefined> {
  return getDisplayWorkSync(room, slug);
}

export async function getDisplayWorksByFacetGrouped(
  facet: Facet,
): Promise<{ room: Room; works: DisplayWork[] }[]> {
  return getDisplayWorksByFacetGroupedSync(facet);
}

export async function getDisplayWorksByFacets(facets: readonly Facet[]): Promise<DisplayWork[]> {
  return getDisplayWorksByFacetsSync(facets);
}

export { FACET_META, type FacetMeta } from './facet-meta';
