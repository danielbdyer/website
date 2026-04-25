import type { Facet } from '@/shared/types/common';

interface FacetChipProps {
  facet: Facet;
}

// Lowercase single-word thread. The chip is the visual unit; the styling
// lives in components.css under .facet-chip. Renders as a <span> rather
// than an <a> so chips compose safely inside a row-level <a> without a
// nested-anchor warning.
export function FacetChip({ facet }: FacetChipProps) {
  return <span className="facet-chip">{facet}</span>;
}
