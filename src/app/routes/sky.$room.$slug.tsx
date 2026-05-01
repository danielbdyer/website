import { createFileRoute, notFound } from '@tanstack/react-router';
import { WorkOverlay } from '@/shared/molecules/WorkOverlay/WorkOverlay';
import { getDisplayWork } from '@/shared/content';
import { roomSchema } from '@/shared/content';

// The sky's overlay route. Addressable URL (/sky/{room}/{slug}) so
// the overlay state is shareable and back-button-recoverable. Renders
// inside the /sky parent's <Outlet /> as a fixed-position takeover
// over the constellation; the parent's firmament continues to paint
// behind, so the visitor stays in the sky while reading the work.
//
// The work is loaded via the same async barrel the work-page route
// uses — there is one canonical work loader, two surfaces that
// consume it. Direct loading /sky/{room}/{slug} cold renders the
// overlay state from prerendered HTML; closing returns to /sky.

export const Route = createFileRoute('/sky/$room/$slug')({
  loader: async ({ params }) => {
    const roomResult = roomSchema.safeParse(params.room);
    if (!roomResult.success) throw notFound();
    const work = await getDisplayWork(roomResult.data, params.slug);
    if (!work) throw notFound();
    return { work };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.work.title} — in the sky` : 'In the sky' },
      {
        name: 'description',
        content:
          loaderData?.work.summary ??
          'A work in the constellation, opened as an overlay over the firmament.',
      },
    ],
  }),
  component: SkyWorkOverlayPage,
});

function SkyWorkOverlayPage() {
  const { work } = Route.useLoaderData();
  return <WorkOverlay work={work} closeHref="/sky" />;
}
