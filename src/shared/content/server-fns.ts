import { createServerFn } from '@tanstack/react-start';
import { roomSchema, type Work } from '@/shared/content/schema';
import type { DisplayWork } from '@/shared/content/preview';
import { z } from 'zod';

// Server-only wrappers over loader.ts. `createServerFn` places each
// handler body on the server side of the SSG build. During prerender
// the calls are direct, in-process function invocations. On the
// client, the caller becomes a stub that would fetch the handler via
// HTTP — which for the current static deploy only ever runs if a
// route was not prerendered (none today; every work route prerenders
// once content exists via `crawlLinks`).
//
// The win: `marked` and `gray-matter` only live in loader.ts, which
// is only imported by these handler bodies. Neither parser ends up
// in the client chunk.

const roomSlugInput = z.object({
  room: roomSchema,
  slug: z.string(),
});

const roomInput = z.object({ room: roomSchema });

export const getAllWorks = createServerFn({ method: 'GET' }).handler(async (): Promise<Work[]> => {
  const { getAllWorksSync } = await import('@/shared/content/loader');
  return getAllWorksSync();
});

export const getWorksByRoom = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => roomInput.parse(data))
  .handler(async ({ data }): Promise<Work[]> => {
    const { getWorksByRoomSync } = await import('@/shared/content/loader');
    return getWorksByRoomSync(data.room);
  });

export const getDisplayWorksByRoom = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => roomInput.parse(data))
  .handler(async ({ data }): Promise<DisplayWork[]> => {
    const { getDisplayWorksByRoomSync } = await import('@/shared/content/display');
    return getDisplayWorksByRoomSync(data.room);
  });

export const getWork = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => roomSlugInput.parse(data))
  .handler(async ({ data }): Promise<Work | undefined> => {
    const { getWorkSync } = await import('@/shared/content/loader');
    return getWorkSync(data.room, data.slug);
  });

export const getDisplayWork = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => roomSlugInput.parse(data))
  .handler(async ({ data }): Promise<DisplayWork | undefined> => {
    const { getDisplayWorkSync } = await import('@/shared/content/display');
    return getDisplayWorkSync(data.room, data.slug);
  });
