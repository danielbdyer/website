import { useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import type { DisplayWork } from '@/shared/content';
import { FacetChip } from '@/shared/atoms/FacetChip/FacetChip';
import { skyStarTransitionName } from '@/shared/utils/view-transition-names';

// The sky's way of opening a work. *An iframe-but-not-an-iframe.*
//
// CONSTELLATION.md committed: "you should be able to interact with
// the stars and have some sort of takeover overlay modal that shows
// the content which can collapse back down into the firmament or the
// ocean." This molecule is that overlay. The full work content
// renders here — title, prose body, facets, outward invitation —
// inside a panel that occupies most of the viewport, leaving the
// firmament visible at the edges so the visitor remains *in the sky
// looking at this work*, not relocated to a different room.
//
// Accessibility:
//   - aria-modal + role="dialog" so screen readers announce the
//     surface as a modal-shaped takeover.
//   - aria-labelledby points to the work's H1.
//   - Focus moves to the panel on mount, returns to whatever held
//     focus before on unmount (the focus-return pattern).
//   - Escape key closes (handled at this molecule's level; the
//     parent's useReturnGesture also handles down-arrow / scroll-
//     down / swipe-down, but Escape is the modal-shaped instinct).
//   - Click outside the panel (on the backdrop) closes via the
//     `closeHref` Link.
//
// Arrival is a paired view-transition morph from the clicked star
// into the overlay's center, with reverse-Open on close. The
// panel and the matching Star anchor both carry the same
// `skyStarTransitionName` for the work's room+slug; the
// Constellation organism suppresses the active star's name while
// the overlay is open so the morph is unambiguous (a name on two
// elements in one snapshot is undefined behavior). The browser
// orchestrates the morph in both directions; navigation runs
// through the router's defaultViewTransition global (router.tsx).
// Behind the panel, the constellation continues at ~30% opacity
// (CSS `:has(.work-overlay)` rule in tokens.css) — the world is
// veiled, never replaced. Reduced-motion collapses the morph to
// the global ~80ms fade.

interface WorkOverlayProps {
  work: DisplayWork;
  /** The href the close button and backdrop click navigate to.
   *  Always `/sky` — this is the sky's overlay, not a free-floating
   *  modal. Wired explicitly rather than computed so the consumer
   *  can override (a future scoped sub-sky might want to return to
   *  a different parent). */
  closeHref: string;
}

export function WorkOverlay({ work, closeHref }: WorkOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `work-overlay-title-${work.room}-${work.slug}`;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      previousFocus?.focus?.();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="work-overlay fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop — click to close. Semi-transparent so the
          firmament reads through; click-through to the close link
          via a covering anchor. */}
      <Link
        to={closeHref}
        aria-label="Close work overlay and return to the constellation"
        className="bg-bg/55 absolute inset-0 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{ viewTransitionName: skyStarTransitionName(work.room, work.slug) }}
        className="work-overlay__panel bg-bg-card border-border relative max-h-[85dvh] w-[min(92vw,640px)] overflow-y-auto rounded-sm border px-8 py-10 shadow-lg focus:outline-none sm:px-12 sm:py-14"
      >
        <Link
          to={closeHref}
          aria-label="Close"
          className="text-text-3 hover:text-text-2 absolute top-3 right-4 text-2xl leading-none italic transition-colors duration-200"
        >
          ×
        </Link>
        <p className="text-kicker text-text-2 mb-4 italic">
          From {ROOM_LABEL[work.room as keyof typeof ROOM_LABEL]}
        </p>
        <h1
          id={titleId}
          className="font-heading text-title leading-title tracking-display text-text mb-4 font-normal"
        >
          {work.title}
        </h1>
        <p className="text-meta text-text-3 mb-8 italic">
          {work.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div
          className={`prose ${work.type === 'poem' ? 'prose-poem' : ''}`}
          dangerouslySetInnerHTML={{ __html: work.html }}
        />
        {work.facets.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {work.facets.map((facet) => (
              <FacetChip key={facet} facet={facet} />
            ))}
          </div>
        )}
        <p className="text-list text-text-2 mt-12 italic">
          <Link
            to={closeHref}
            className="hover:text-text no-underline transition-colors duration-200"
          >
            ↓ Back into the sky
          </Link>
        </p>
      </div>
    </div>
  );
}

const ROOM_LABEL = {
  studio: 'The Studio',
  garden: 'The Garden',
  study: 'The Study',
  salon: 'The Salon',
} as const;
