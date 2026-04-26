import { Link } from '@tanstack/react-router';
import type { Facet } from '@/shared/types/common';

interface FacetChipProps {
  facet: Facet;
}

// A facet chip is a thread you can pull. Renders as a real link to
// /facet/{facet} so chips are honest navigation, not decoration. Hover
// brightens the tag chrome — the thread becomes visible. The chip is
// designed to compose *outside* a row-level <Link> wrapper; WorkEntry
// and WorkRow lift their chip rows out of the title-link so anchor
// nesting stays valid HTML.
export function FacetChip({ facet }: FacetChipProps) {
  return (
    <Link
      to="/facet/$facet"
      params={{ facet }}
      className="inline-block rounded-[2px] bg-tag-bg px-[9px] py-[2px] font-body text-chip tracking-meta text-tag-text no-underline transition-colors duration-200 hover:bg-border-lt hover:text-text"
    >
      {facet}
    </Link>
  );
}
