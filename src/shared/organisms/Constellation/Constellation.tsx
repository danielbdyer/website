import { useRef } from 'react';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { POLE_KEY, bearingsOf } from '@/shared/content/skyWalk';
import { ConstellationFilters } from '@/shared/atoms/ConstellationFilters/ConstellationFilters';
import { Daystar } from '@/shared/atoms/Daystar/Daystar';
import { Firmament } from '@/shared/atoms/Firmament/Firmament';
import { WebGLFirmament } from '@/shared/molecules/WebGLFirmament/WebGLFirmament';
import { SkyWhisper } from '@/shared/molecules/SkyWhisper/SkyWhisper';
import { useConstellationParallax } from '@/shared/hooks/useConstellationParallax';
import { useSkyTravel } from '@/shared/hooks/useSkyTravel';
import { useSkyWalk } from '@/shared/hooks/useSkyWalk';
import { cn } from '@/shared/utils/cn';
import { Stage } from './Stage';
import {
  VIEWBOX,
  buildPositionedMap,
  buildRenderableNodes,
  resolveEdges,
  skyTitle,
} from './layout';
import { useOverlayKey, useSkyInteractions } from './useSkyInteractions';
import {
  buildWorld,
  initialHere,
  namedOrder,
  navigableEdges,
  navigableNodes,
  whisperConcordantOf,
  whisperPlaceOf,
} from './walk';

interface ConstellationProps {
  graph: ConstellationGraph;
  /** When true, the SVG fills the frame via `xMidYMid slice` (cover-
   *  fit) so the constellation occupies every available pixel rather
   *  than being letterboxed inside a column. */
  fullViewport?: boolean;
  /** A node key (`{room}/{slug}`) to open standing at — the look-up
   *  jump from a work lands on its star. Null/absent opens at the pole
   *  (or the session's remembered place).
   *  CONSTELLATION_PARALLEL.md §"The Orientation Contract." */
  focusKey?: string | undefined;
  className?: string;
}

// The sky as a walk (CONSTELLATION_WALK.md): the visitor is always
// somewhere; the camera rests there; a named destination — a star, a
// bearing, a thread, an arrow, a drag along a thread — is the only
// thing that moves it.

export function Constellation({
  graph,
  fullViewport = false,
  focusKey,
  className,
}: ConstellationProps) {
  const parallaxRef = useConstellationParallax<SVGSVGElement>();
  const cameraRef = useRef<SVGGElement | null>(null);
  const glyphRef = useRef<SVGCircleElement | null>(null);
  const positioned = buildPositionedMap(graph);
  const edges = resolveEdges(graph.edges, positioned);
  const nodes = buildRenderableNodes(graph.nodes, positioned);
  const titleId = 'constellation-title';
  const walk = useSkyWalk(initialHere(graph, focusKey));
  const travel = useSkyTravel({
    graph,
    nodes: navigableNodes(nodes),
    edges: navigableEdges(edges, positioned),
    viewboxSize: VIEWBOX,
    fit: fullViewport ? 'cover' : 'contain',
    here: walk.here,
    namedKeys: namedOrder(graph, walk.here),
    onArrive: walk.arrive,
    cameraRef,
    glyphRef,
  });
  const interactions = useSkyInteractions({ graph, walk, travel });
  const overlayKey = useOverlayKey();
  const { hoverKey } = interactions;
  const world = buildWorld(graph, { edges, nodes, walk, hoverKey, overlayKey });
  const hereKey = walk.here === POLE_KEY ? null : walk.here;

  return (
    <nav
      aria-labelledby={titleId}
      className={cn('constellation-frame relative isolate overflow-hidden', className)}
    >
      <h2 id={titleId} className="sr-only">
        {skyTitle(graph.nodes.length)}
      </h2>
      <WebGLFirmament
        graph={graph}
        activeKey={hoverKey ?? hereKey}
        present={world.present}
        fullViewport={fullViewport}
      />
      <svg
        ref={parallaxRef}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        preserveAspectRatio={fullViewport ? 'xMidYMid slice' : 'xMidYMid meet'}
        onClick={interactions.onSkyClick}
        onKeyDown={travel.onKeyDown}
        onPointerDown={interactions.onPointerDown}
        {...travel.pointerHandlers}
        className={cn('constellation relative block w-full', fullViewport && 'h-full')}
      >
        <ConstellationFilters />
        <g className="constellation-parallax--firmament">
          <Firmament size={VIEWBOX} />
          <Daystar cx={500} cy={240} />
        </g>
        <g className="constellation-parallax--sky">
          <g ref={cameraRef} className="constellation-camera">
            <Stage world={world} interactions={interactions.stage} glyphRef={glyphRef} />
          </g>
        </g>
      </svg>
      <SkyWhisper
        place={whisperPlaceOf(graph, walk.here)}
        bearings={bearingsOf(graph, walk.here)}
        concordant={whisperConcordantOf(graph, walk.here)}
        onBearing={travel.travelTo}
        onAttend={walk.attendFacet}
        className="absolute right-6 bottom-16 left-6 z-10 sm:right-auto sm:bottom-6"
      />
    </nav>
  );
}
