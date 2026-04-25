import type { Room } from '@/shared/types/common';
import type { DisplayWork } from '@/shared/content/preview';
import { getPreviewWork, getPreviewWorksByRoom } from '@/shared/content/preview-data';
import { getWorkSync, getWorksByRoomSync } from '@/shared/content/loader';

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
