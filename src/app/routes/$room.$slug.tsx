import { createFileRoute, notFound } from '@tanstack/react-router';
import { getWork, roomSchema } from '@/shared/content';
import { WorkView } from '@/shared/organisms/WorkView/WorkView';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { breadcrumbSchema, JsonLd, workSchema } from '@/shared/seo';

export const Route = createFileRoute('/$room/$slug')({
  loader: ({ params }) => {
    const roomResult = roomSchema.safeParse(params.room);
    if (!roomResult.success) throw notFound();
    const work = getWork(roomResult.data, params.slug);
    if (!work) throw notFound();
    return { work };
  },
  component: WorkPage,
});

function WorkPage() {
  const { work } = Route.useLoaderData();
  return (
    <>
      <JsonLd data={[workSchema(work), breadcrumbSchema(work)]} />
      <Reveal>
        <WorkView work={work} />
      </Reveal>
    </>
  );
}
