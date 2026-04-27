import { Link, createFileRoute } from '@tanstack/react-router';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { Constellation } from '@/shared/organisms/Constellation/Constellation';
import { getConstellationGraph } from '@/shared/content/constellation';

// The constellation route. The graph view this site wants is a sky —
// a second way the Foyer offers itself, reached today by a small
// "look up" link from the Foyer (the held scroll-up gesture and the
// theme-toggle ascension wait their own conversation).
//
// Per CONSTELLATION.md, this is the first form: pure SVG, accessible,
// addressable, prerendered. The atmospheric layer (WebGL parallax,
// watercolor weather, the rolling carpet, the daystar's ascent) is
// held; the structural layer is built in full so the surface is
// honest with one work and grows organically as more arrive.

export const Route = createFileRoute('/sky')({
  loader: async () => {
    const graph = await getConstellationGraph();
    return { graph };
  },
  head: () => ({
    meta: [
      { title: 'The constellation — Danny Dyer' },
      {
        name: 'description',
        content:
          'The site as a sky: each work a star, each shared facet a faint thread between two stars.',
      },
    ],
  }),
  component: SkyPage,
});

function SkyPage() {
  const { graph } = Route.useLoaderData();
  return (
    <Reveal>
      <h1 className="mt-6 mb-4 font-heading text-display leading-display font-normal tracking-display text-text">
        The constellation
      </h1>
      <p className="mb-10 max-w-deck font-body text-body leading-body italic text-text-2 sm:mb-14">
        The site as a sky. Each work is a star. Each shared facet is a faint thread between two
        stars — wisps at rest, blooming as you approach.
      </p>
      <Constellation graph={graph} className="my-8" />
      <div className="mt-12 mb-4 max-w-deck font-body text-list leading-body italic text-text-2">
        <Link
          to="/"
          className="no-underline transition-colors duration-200 hover:text-text"
          viewTransition={false}
        >
          ↓ Return to the Foyer
        </Link>
      </div>
    </Reveal>
  );
}
