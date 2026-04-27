import { createFileRoute, notFound } from '@tanstack/react-router';
import { FACET_META, facetSchema, getDisplayWorksByFacets, isPreviewWork } from '@/shared/content';
import type { Facet } from '@/shared/types/common';
import { Reveal } from '@/shared/molecules/Reveal/Reveal';
import { FacetMasonry } from '@/shared/molecules/FacetMasonry/FacetMasonry';
import { FacetToggleBar } from '@/shared/molecules/FacetToggleBar/FacetToggleBar';

// Canonical facet order — the toggle bar always emits selected facets in
// this order so two URLs ("/facet/beauty,body" and "/facet/body,beauty")
// don't both reach the same view.
const FACET_ORDER: readonly Facet[] = [
  'craft',
  'consciousness',
  'language',
  'leadership',
  'beauty',
  'becoming',
  'relation',
  'body',
];

function parseFacetParam(raw: string): Facet[] {
  // Comma-separated multi-facet, deduplicated and ordered canonically so
  // the URL is the source of truth and the order in it doesn't matter.
  const tokens = raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const valid = tokens
    .map((t) => facetSchema.safeParse(t))
    .filter((r): r is { success: true; data: Facet } => r.success)
    .map((r) => r.data);
  const unique = new Set(valid);
  return FACET_ORDER.filter((f) => unique.has(f));
}

export const Route = createFileRoute('/facet/$facet')({
  loader: async ({ params }) => {
    const selected = parseFacetParam(params.facet);
    if (selected.length === 0) throw notFound();
    const works = await getDisplayWorksByFacets(selected);
    return { selected, works };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { selected, works } = loaderData;
    const meta = headFor(selected);
    const hasPreview = works.some(isPreviewWork);
    return {
      meta: [
        { title: `${meta.label} — Danny Dyer` },
        { name: 'description', content: meta.description },
        ...(hasPreview ? [{ name: 'robots', content: 'noindex, nofollow' as const }] : []),
      ],
    };
  },
  component: FacetPage,
});

function headFor(selected: readonly Facet[]) {
  if (selected.length === 1) return FACET_META[selected[0]!];
  return {
    label: selected.map((f) => FACET_META[f].label).join(' · '),
    description: `Works carrying every thread: ${selected.map((f) => FACET_META[f].label.toLowerCase()).join(', ')}.`,
  };
}

function FacetPage() {
  const { selected, works } = Route.useLoaderData();
  const meta = headFor(selected);

  return (
    <Reveal>
      <h1 className="font-heading text-display leading-display tracking-display text-text mt-6 mb-4 font-normal">
        {meta.label}
      </h1>
      <p className="max-w-deck font-body text-body leading-body text-text-2 mb-10 italic sm:mb-14">
        {meta.description}
      </p>
      <FacetToggleBar facets={FACET_ORDER} selected={selected} />
      {works.length === 0 ? (
        // Per VOICE_AND_COPY.md §"Empty facet pages" — name the absence
        // quietly. The thread (or intersection of threads) exists; no
        // work currently carries it.
        <p className="font-body text-list text-text-3 italic">
          {selected.length === 1
            ? 'No works currently carry this thread.'
            : 'No works currently carry every selected thread.'}
        </p>
      ) : (
        <FacetMasonry works={works} scopedFacets={selected} />
      )}
    </Reveal>
  );
}
