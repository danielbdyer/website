import { useRef } from 'react';
import type { FocusEvent, MouseEvent, PointerEvent, RefObject, SyntheticEvent } from 'react';
import { useMatch } from '@tanstack/react-router';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { bearingsOf, type Place } from '@/shared/content/skyWalk';
import { useInternalLinkDelegation } from '@/shared/hooks/useInternalLinkDelegation';
import type { SkyWalk } from '@/shared/hooks/useSkyWalk';
import type { StageInteractions } from './Stage';
import { useSkyAttention } from './useSkyAttention';
import { clickTargetOf, farEndOf, starKeyOf } from './walk';

// The sky's input, in one place (CONSTELLATION_WALK.md §"Input"):
//
//   click a star you are not at   → travel to it
//   click the star you are at     → open it (the anchor's own link)
//   click a thread                → travel along it to its far end
//   focus a star (Tab)            → travel to it; Enter then opens it
//   hover a star / thread / name  → the halo claims / the figure lights
//   click a name at the rim       → take that bearing
//
// Modified clicks (new tab, etc.) are left to the browser.
//
// Hover never renders. It is written to the page by dom/skyAttention
// and to the atmosphere by state/skyHover: one star and its few threads
// change, not a tree of hundreds.

interface UseSkyInteractionsArgs {
  readonly graph: ConstellationGraph;
  readonly walk: SkyWalk;
  readonly travel: {
    readonly travelTo: (place: Place, alongEdgeId?: string) => void;
    readonly beginScrub: (e: PointerEvent<SVGSVGElement>) => void;
  };
  /** The camera group the marks are written into. */
  readonly cameraRef: RefObject<SVGGElement | null>;
  /** The threads that meet each star, by key (layout.adjacencyOf). */
  readonly adjacency: ReadonlyMap<string, readonly string[]>;
}

const isPlainClick = (e: MouseEvent): boolean =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

// Focus that arrives with a pointer press belongs to the click; only
// keyboard focus travels (a Tab is a step, a press is a choice).
const POINTER_FOCUS_WINDOW_MS = 500;

export function useSkyInteractions({
  graph,
  walk,
  travel,
  cameraRef,
  adjacency,
}: UseSkyInteractionsArgs) {
  const { travelTo, beginScrub } = travel;
  const delegate = useInternalLinkDelegation<SVGSVGElement>();
  const { attend, attendAxis, attendThread } = useSkyAttention({ graph, cameraRef, adjacency });
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
      const bearing = bearingsOf(graph, walk.here).find((b) => b.axis === named);
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

  const onStarFocus = (e: FocusEvent<Element>) => {
    const key = starKeyOf(e.target);
    attend(key);
    if (Date.now() - lastPointerDown.current < POINTER_FOCUS_WINDOW_MS) return;
    if (key && key !== walk.here) travelTo(key);
  };

  const onStarBlur = (e: FocusEvent<Element>) => {
    if (e.relatedTarget?.closest('[data-node-key]')) return;
    attend(null);
  };

  // Over the threads and the names at the rim: the thread under the
  // pointer lights, and so does its whole figure.
  const onAxisHover = (e: SyntheticEvent<Element>) => {
    const target = e.target as Element;
    const axis = target.closest<SVGElement>('[data-axis]')?.dataset.axis;
    attendAxis(axis ?? null);
    attendThread(target.closest('[data-thread]'));
  };
  const onAxisLeave = () => {
    attendAxis(null);
    attendThread(null);
  };

  const stage: StageInteractions = {
    onStarHover: (e) => attend(starKeyOf(e.target as Element)),
    onStarLeave: () => attend(null),
    onStarFocus,
    onStarBlur,
    onAxisHover,
    onAxisLeave,
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
