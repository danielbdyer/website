import { useRef } from 'react';
import type { FocusEvent, MouseEvent, PointerEvent, SyntheticEvent } from 'react';
import { useMatch } from '@tanstack/react-router';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { bearingsOf, type Place } from '@/shared/content/skyWalk';
import type { Facet } from '@/shared/types/common';
import { useInternalLinkDelegation } from '@/shared/hooks/useInternalLinkDelegation';
import type { SkyWalk } from '@/shared/hooks/useSkyWalk';
import type { StageInteractions } from './Stage';
import { clickTargetOf, farEndOf, starKeyOf, threadIdOf } from './walk';

// The sky's input, in one place (CONSTELLATION_WALK.md §"Input"):
//
//   click a star you are not at   → travel to it
//   click the star you are at     → open it (the anchor's own link)
//   click a thread                → travel along it to its far end
//   focus a star (Tab)            → travel to it; Enter then opens it
//   hover a star                  → the halo claims
//   hover a thread                → it lights end to end, its ends light,
//                                   its facet is named and its figure lit
//   hover / click a name at the rim → the figure lights / take the bearing
//
// Every hover and trace is an event to the walk's reducer, which
// refuses them while the sky is under way — so a star streaming past
// the pointer never claims (CONSTELLATION_STORYBOARD.md §"Scene 3").
// Modified clicks (new tab, etc.) are left to the browser.

interface UseSkyInteractionsArgs {
  readonly graph: ConstellationGraph;
  readonly walk: SkyWalk;
  readonly travel: {
    readonly travelTo: (place: Place, alongEdgeId?: string) => void;
    readonly beginScrub: (e: PointerEvent<SVGSVGElement>) => void;
  };
}

const isPlainClick = (e: MouseEvent): boolean =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

// Focus that arrives with a pointer press belongs to the click; only
// keyboard focus travels (a Tab is a step, a press is a choice).
const POINTER_FOCUS_WINDOW_MS = 500;

const facetOf = (target: Element): Facet | null =>
  (target.closest<SVGElement>('[data-facet]')?.dataset.facet as Facet | undefined) ?? null;

export function useSkyInteractions({ graph, walk, travel }: UseSkyInteractionsArgs) {
  const { travelTo, beginScrub } = travel;
  const delegate = useInternalLinkDelegation<SVGSVGElement>();
  const lastPointerDown = useRef(0);
  // A press stamps the time (so the focus it causes is not a step) and
  // may begin a scrub along a thread.
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    lastPointerDown.current = Date.now();
    beginScrub(e);
  };

  const onSkyClick = (e: MouseEvent<SVGSVGElement>) => {
    const named = isPlainClick(e)
      ? (e.target as Element).closest<SVGElement>('[data-compass]')?.dataset.compass
      : undefined;
    if (named) {
      const bearing = bearingsOf(graph, walk.here).find((b) => b.facet === named);
      if (bearing?.to) travelTo(bearing.to, bearing.edgeId ?? undefined);
      return;
    }
    const target = isPlainClick(e) ? clickTargetOf(e.target as Element) : null;
    if (target?.kind === 'star' && target.key !== walk.here) {
      e.preventDefault();
      travelTo(target.key);
      return;
    }
    if (target?.kind === 'thread') {
      const far = farEndOf(graph, target.id, walk.here);
      if (far) travelTo(far, target.id);
      return;
    }
    delegate(e);
  };

  const onStarHover = (e: SyntheticEvent<Element>) => {
    const key = starKeyOf(e.target as Element);
    if (key) walk.hover(key);
  };

  const onStarFocus = (e: FocusEvent<Element>) => {
    onStarHover(e);
    if (Date.now() - lastPointerDown.current < POINTER_FOCUS_WINDOW_MS) return;
    const key = starKeyOf(e.target);
    if (key && key !== walk.here) travelTo(key);
  };

  // Focus moving from one star to the next never blinks the claim off
  // between them — care at the seam where state transitions live.
  const onStarBlur = (e: FocusEvent<Element>) => {
    if (e.relatedTarget?.closest('[data-node-key]')) return;
    walk.hover(null);
  };

  const onFacetHover = (e: SyntheticEvent<Element>) => {
    const target = e.target as Element;
    walk.attendFacet(facetOf(target));
    walk.trace(threadIdOf(target));
  };

  const onFacetLeave = () => {
    walk.attendFacet(null);
    walk.trace(null);
  };

  const stage: StageInteractions = {
    onStarHover,
    onStarLeave: () => walk.hover(null),
    onStarFocus,
    onStarBlur,
    onFacetHover,
    onFacetLeave,
  };

  return { onSkyClick, onPointerDown, stage };
}

/** The open overlay's star, as `room/slug`, or null when /sky stands
 *  alone. That star drops its viewTransitionName so the panel owns
 *  the name across snapshots (star → panel on Open, back on Close).
 *  shouldThrow:false — the overlay is optional. */
export function useOverlayKey(): string | null {
  const match = useMatch({ from: '/sky/$room/$slug', shouldThrow: false });
  return match ? `${match.params.room}/${match.params.slug}` : null;
}
