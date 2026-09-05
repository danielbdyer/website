import { useRef } from 'react';
import type { RefObject } from 'react';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { hoverAxis, hoverStar, hoverThread } from '@/shared/dom/skyAttention';
import { setSkyHoverIndex } from '@/shared/state/skyHover';
import { activeStarIndex, buildAtmosphericScene } from '@/shared/webgl/atmosphereScene';

// The pointer's attention, kept out of React. A hover is a change of
// attention, not a change of the sky: it is written to the page
// (dom/skyAttention) and to the atmosphere (state/skyHover), and the
// tree of hundreds of stars and a thousand threads never re-renders for
// it (CONSTELLATION_ARCHITECTURE.md §"The shell"). The refs remember
// what is lit so the next change can put it back.

interface UseSkyAttentionArgs {
  readonly graph: ConstellationGraph;
  /** The camera group the marks are written into. */
  readonly cameraRef: RefObject<SVGGElement | null>;
  /** The threads that meet each star, by key (layout.adjacencyOf). */
  readonly adjacency: ReadonlyMap<string, readonly string[]>;
}

export function useSkyAttention({ graph, cameraRef, adjacency }: UseSkyAttentionArgs) {
  const hovered = useRef<string | null>(null);
  const litAxis = useRef<string | null>(null);
  const hoveredThread = useRef<Element | null>(null);

  /** The star under the pointer or the keyboard's focus, or none. */
  const attend = (next: string | null) => {
    const group = cameraRef.current;
    if (!group) return;
    hoverStar(group, adjacency, hovered.current, next);
    hovered.current = next;
    setSkyHoverIndex(next === null ? -1 : activeStarIndex(buildAtmosphericScene(graph), next));
  };

  /** The axis under the pointer — a thread's figure or a name at the
   *  rim — or none. */
  const attendAxis = (next: string | null) => {
    const group = cameraRef.current;
    if (!group) return;
    hoverAxis(group, litAxis.current, next);
    litAxis.current = next;
  };

  /** The thread group under the pointer, or none. */
  const attendThread = (next: Element | null) => {
    hoverThread(hoveredThread.current, next);
    hoveredThread.current = next;
  };

  return { attend, attendAxis, attendThread };
}
