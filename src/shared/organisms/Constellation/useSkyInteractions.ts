import { useRef } from 'react';
import type { FocusEvent, MouseEvent, SyntheticEvent } from 'react';
import type { ConstellationGraph } from '@/shared/content/constellation';
import type { Place } from '@/shared/content/skyWalk';
import type { Facet } from '@/shared/types/common';
import { useInternalLinkDelegation } from '@/shared/hooks/useInternalLinkDelegation';
import { useStarHoverState } from '@/shared/hooks/useStarHoverState';
import type { SkyWalk } from '@/shared/hooks/useSkyWalk';
import type { StageInteractions } from './Stage';
import { clickTargetOf, farEndOf, starKeyOf } from './walk';

// The sky's input, in one place (CONSTELLATION_WALK.md §"Input"):
//
//   click a star you are not at   → travel to it
//   click the star you are at     → open it (the anchor's own link)
//   click a thread                → travel along it to its far end
//   focus a star (Tab)            → travel to it; Enter then opens it
//   hover a star / thread         → the halo claims / the figure lights
//
// Modified clicks (new tab, etc.) are left to the browser.

interface UseSkyInteractionsArgs {
  readonly graph: ConstellationGraph;
  readonly walk: SkyWalk;
  readonly travelTo: (place: Place, alongEdgeId?: string) => void;
}

const isPlainClick = (e: MouseEvent): boolean =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

// Focus that arrives with a pointer press belongs to the click; only
// keyboard focus travels (a Tab is a step, a press is a choice).
const POINTER_FOCUS_WINDOW_MS = 500;

export function useSkyInteractions({ graph, walk, travelTo }: UseSkyInteractionsArgs) {
  const delegate = useInternalLinkDelegation<SVGSVGElement>();
  const hover = useStarHoverState(null);
  const lastPointerDown = useRef(0);
  const onPointerDown = () => {
    lastPointerDown.current = Date.now();
  };

  const onSkyClick = (e: MouseEvent<SVGSVGElement>) => {
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

  const onStarFocus = (e: FocusEvent<Element>) => {
    hover.handleActivate(e);
    if (Date.now() - lastPointerDown.current < POINTER_FOCUS_WINDOW_MS) return;
    const key = starKeyOf(e.target);
    if (key && key !== walk.here) travelTo(key);
  };

  const onThreadHover = (e: SyntheticEvent<Element>) => {
    const facet = (e.target as Element).closest<SVGGElement>('[data-thread]')?.dataset.facet;
    walk.attendFacet((facet as Facet | undefined) ?? null);
  };

  const stage: StageInteractions = {
    onStarHover: hover.handleActivate,
    onStarLeave: hover.handleMouseLeave,
    onStarFocus,
    onStarBlur: hover.handleBlur,
    onThreadHover,
    onThreadLeave: () => walk.attendFacet(null),
  };

  return { hoverKey: hover.activeKey, onSkyClick, onPointerDown, stage };
}
