import { useRef } from 'react';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { useConstellationParallax } from '@/shared/hooks/useConstellationParallax';
import { useSkyTravel } from '@/shared/hooks/useSkyTravel';
import { useSkyWalk } from '@/shared/hooks/useSkyWalk';
import { VIEWBOX, buildPositionedMap, buildRenderableNodes, resolveEdges } from './layout';
import { useOverlayKey, useSkyInteractions } from './useSkyInteractions';
import { buildWorld, initialHere, namedOrder, navigableEdges, navigableNodes } from './walk';

interface UseSkySceneArgs {
  readonly graph: ConstellationGraph;
  readonly fullViewport: boolean;
  readonly focusKey: string | undefined;
}

// Everything the constellation organism composes, wired once: the
// graph laid out, the walk's state, the travel shell around the
// motion core, the input grammar, and the world the Stage paints.
// The organism itself is then only markup — the frame, the firmament,
// the camera, the whisper. CONSTELLATION_ARCHITECTURE.md §"The Layers".

export function useSkyScene({ graph, fullViewport, focusKey }: UseSkySceneArgs) {
  const parallaxRef = useConstellationParallax<SVGSVGElement>();
  const cameraRef = useRef<SVGGElement | null>(null);
  const glyphRef = useRef<SVGCircleElement | null>(null);
  const positioned = buildPositionedMap(graph);
  const edges = resolveEdges(graph.edges, positioned);
  const nodes = buildRenderableNodes(graph.nodes, positioned);
  const walk = useSkyWalk(initialHere(graph, focusKey));
  const travel = useSkyTravel({
    graph,
    nodes: navigableNodes(nodes),
    edges: navigableEdges(edges, positioned),
    viewboxSize: VIEWBOX,
    fit: fullViewport ? 'cover' : 'contain',
    walk,
    namedKeys: namedOrder(graph, walk.here),
    cameraRef,
    glyphRef,
  });
  const interactions = useSkyInteractions({ graph, walk, travel });
  const overlayKey = useOverlayKey();
  const world = buildWorld(graph, { edges, nodes, walk, overlayKey });
  return { parallaxRef, cameraRef, glyphRef, walk, travel, interactions, world };
}
