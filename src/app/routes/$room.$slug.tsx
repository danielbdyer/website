import { createFileRoute, notFound } from '@tanstack/react-router';
import { getDisplayWork, isPreviewWork, roomSchema } from '@/shared/content';
import { WorkView } from '@/shared/organisms/WorkView/WorkView';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { breadcrumbSchema, JsonLd, workSchema } from '@/shared/seo';

export const Route = createFileRoute('/$room/$slug')({
  loader: async ({ params }) => {
    const roomResult = roomSchema.safeParse(params.room);
    if (!roomResult.success) throw notFound();
    const work = await getDisplayWork(roomResult.data, params.slug);
    if (!work) throw notFound();
    return { work };
  },
  head: ({ loaderData }) => {
    const work = loaderData?.work;
    if (!work) return {};
    const title = `${work.title} — Danny Dyer`;
    const description = work.summary ?? `${work.title}, by Danny Dyer.`;
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        ...(isPreviewWork(work) ? [{ name: 'robots', content: 'noindex, nofollow' as const }] : []),
      ],
    };
  },
  component: WorkPage,
});

function WorkPage() {
  const { work } = Route.useLoaderData();
  const preview = isPreviewWork(work);
  return (
    <>
      {!preview && <JsonLd data={[workSchema(work), breadcrumbSchema(work)]} />}
      <Reveal>
        <WorkView work={work} />
      </Reveal>
    </>
  );
}
