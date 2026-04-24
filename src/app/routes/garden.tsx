import { createFileRoute, Link } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { getWorksByRoom } from '@/shared/content';

export const Route = createFileRoute('/garden')({
  loader: async () => {
    const works = await getWorksByRoom({ data: { room: 'garden' } });
    return { works };
  },
  head: () => ({
    meta: [
      { title: 'The Garden — Danny Dyer' },
      { name: 'description', content: 'Poetry by Danny Dyer.' },
    ],
  }),
  component: GardenPage,
});

function GardenPage() {
  const { works } = Route.useLoaderData();
  return (
    <Reveal>
      <h1 className="font-heading text-[1.65rem] font-normal tracking-tight mb-7">The Garden</h1>
      <p className="text-[0.9rem] text-text-3 italic leading-relaxed mb-10">
        [Poetry. Living, growing, seasonal. Work that breathes.]
      </p>

      {works.length > 0 && (
        <ul className="list-none p-0 m-0">
          {works.map((work) => {
            const formattedDate = work.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            return (
              <li key={work.slug} className="mb-8">
                <Link
                  to="/$room/$slug"
                  params={{ room: 'garden', slug: work.slug }}
                  className="font-heading text-[1.15rem] text-text no-underline transition-colors duration-200 hover:text-accent"
                >
                  {work.title}
                </Link>
                <div className="text-[0.85rem] text-text-2 italic mt-1">
                  {import.meta.env.DEV && work.draft && (
                    <span className="text-accent-warm tracking-wider text-[0.7rem] mr-2 not-italic uppercase">
                      draft
                    </span>
                  )}
                  {formattedDate}
                </div>
                {work.summary && (
                  <p className="text-[0.95rem] text-text-2 italic leading-relaxed mt-2">
                    {work.summary}
                  </p>
                )}
                {work.facets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {work.facets.map((facet) => (
                      <span
                        key={facet}
                        className="text-[0.7rem] px-2 py-0.5 rounded bg-tag-bg text-tag-text"
                      >
                        {facet}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Reveal>
  );
}
