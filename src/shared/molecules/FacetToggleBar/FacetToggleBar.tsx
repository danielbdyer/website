import { Link } from '@tanstack/react-router';
import type { Facet } from '@/shared/types/common';
import { cn } from '@/shared/utils/cn';

interface FacetToggleBarProps {
  /** All facets to render as toggles. */
  facets: readonly Facet[];
  /** The facets currently active (selected). Order is preserved when
   *  composing the URL so the path is stable across rerenders. */
  selected: readonly Facet[];
}

// Multi-select facet toggle row. Each chip is a link whose href is the
// facet path *with this chip toggled* — selected chips link to the path
// without themselves; unselected chips link to the path with themselves
// added. Clicking is the toggle; the URL is the source of truth.
//
// Encoded as comma-separated path segments (`/facet/beauty,body`) so the
// route shape stays a single dynamic param and the URL is human-readable.
// An order-stable composition keeps the canonical form of the same
// selection independent of click order: `/facet/beauty,body` and
// `/facet/body,beauty` aren't both reachable — the bar always emits
// the schema-ordered tuple.
export function FacetToggleBar({ facets, selected }: FacetToggleBarProps) {
  const selectedSet = new Set(selected);

  return (
    <nav
      aria-label="Filter by facet"
      className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-2 sm:mb-14"
    >
      {facets.map((facet) => {
        const isOn = selectedSet.has(facet);
        const next = isOn
          ? facets.filter((f) => f !== facet && selectedSet.has(f))
          : facets.filter((f) => f === facet || selectedSet.has(f));
        const path = next.length > 0 ? `/facet/${next.join(',')}` : '/';

        return (
          <Link
            key={facet}
            to={path}
            aria-pressed={isOn}
            className={cn(
              'inline-block rounded-[2px] px-2.5 py-1 font-body text-chip tracking-meta no-underline transition-colors duration-200',
              isOn
                ? 'bg-accent-warm/15 text-text ring-1 ring-accent-warm/40 hover:bg-accent-warm/20'
                : 'bg-tag-bg text-tag-text hover:bg-border-lt hover:text-text',
            )}
          >
            {facet}
          </Link>
        );
      })}
    </nav>
  );
}
