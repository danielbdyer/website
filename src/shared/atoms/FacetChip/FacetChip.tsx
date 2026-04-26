import type { Facet } from '@/shared/types/common';

interface FacetChipProps {
  facet: Facet;
}

// Lowercase single-word thread. Renders as a <span> rather than an <a>
// so chips compose safely inside a row-level <a> without a nested-anchor
// warning.
export function FacetChip({ facet }: FacetChipProps) {
  return (
    <span className="rounded-[2px] bg-tag-bg px-[9px] py-[2px] font-body text-chip tracking-[0.02em] text-tag-text">
      {facet}
    </span>
  );
}
