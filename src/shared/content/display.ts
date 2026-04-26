import type { Facet, Room } from '@/shared/types/common';
import type { DisplayWork } from '@/shared/content/preview';
import { getPreviewWork, getPreviewWorksByRoom } from '@/shared/content/preview-data';
import { getWorkSync, getWorksByRoomSync } from '@/shared/content/loader';

// Room order across cross-room surfaces. Mirrors the nav rhythm in
// INFORMATION_ARCHITECTURE.md §"The four room links": professional →
// poetic → reflective → aesthetic. The Foyer is excluded because it
// does not hold works.
const FACET_ROOM_ORDER: readonly Room[] = ['studio', 'garden', 'study', 'salon'];

export function getDisplayWorksByRoomSync(room: Room): DisplayWork[] {
  const authoredWorks = getWorksByRoomSync(room);
  if (authoredWorks.length > 0) return authoredWorks;
  return getPreviewWorksByRoom(room);
}

export function getDisplayWorkSync(room: Room, slug: string): DisplayWork | undefined {
  const authoredWorks = getWorksByRoomSync(room);
  if (authoredWorks.length > 0) return getWorkSync(room, slug);
  return getPreviewWork(room, slug);
}

// Cross-room view: every display work that carries the given facet,
// grouped by room in the nav order. Reuses getDisplayWorksByRoomSync so
// rooms without authored work still surface previews — the same rule
// that governs the room landings, applied to the facet thread.
export function getDisplayWorksByFacetGroupedSync(
  facet: Facet,
): { room: Room; works: DisplayWork[] }[] {
  return FACET_ROOM_ORDER.map((room) => ({
    room,
    works: getDisplayWorksByRoomSync(room).filter((work) => work.facets.includes(facet)),
  })).filter((group) => group.works.length > 0);
}
