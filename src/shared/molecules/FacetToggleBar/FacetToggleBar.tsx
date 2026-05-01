import type { Facet } from '@/shared/types/common';
import { Link } from '@tanstack/react-router';
import { cn } from '@/shared/utils/cn';

const MAX_DEPTH = 2;

// Pure helper for the chip's variant class — extracted to keep the
// per-chip render a flat composition rather than nesting a ternary
// inside a ternary inside a `cn()` call. Read top-down: on (active)
// → warm tint; off + disabled (max depth reached, this off-chip can't
// be added) → muted; off + enabled → neutral.
function chipVariant(isOn: boolean, isDisabled: boolean): string {
  if (isOn) return 'bg-accent-warm/15 text-text ring-1 ring-accent-warm/40 hover:bg-accent-warm/20';
  if (isDisabled) return 'bg-tag-bg/50 text-text-3 cursor-not-allowed';
  return 'bg-tag-bg text-tag-text hover:bg-border-lt hover:text-text';
}

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
//
// **Depth cap.** When `MAX_DEPTH` (2) facets are already selected,
// off-chips are disabled rather than linking to a depth-3 URL. The
// prerender filter (vite.config.ts) skips depth-3+ paths; emitting
// links to those paths from the UI would invite 404s in production.
// Active chips remain clickable (clicking them removes that facet,
// which is always a downward move in depth).
export function FacetToggleBar({ facets, selected }: FacetToggleBarProps) {
  const selectedSet = new Set(selected);
  const atMaxDepth = selected.length >= MAX_DEPTH;

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
        const isDisabled = !isOn && atMaxDepth;
        const className = cn(
          'inline-block rounded-[2px] px-2.5 py-1 font-body text-chip tracking-meta no-underline transition-colors duration-200',
          chipVariant(isOn, isDisabled),
        );

        if (isDisabled) {
          return (
            <span
              key={facet}
              aria-disabled="true"
              title="Two threads at a time — remove one to add another."
              className={className}
            >
              {facet}
            </span>
          );
        }

        if (next.length === 0) {
          return (
            <Link key={facet} to="/" aria-pressed={isOn} className={className}>
              {facet}
            </Link>
          );
        }

        return (
          <Link
            key={facet}
            to="/facet/$facet"
            params={{ facet: next.join(',') }}
            aria-pressed={isOn}
            className={className}
          >
            {facet}
          </Link>
        );
      })}
    </nav>
  );
}
