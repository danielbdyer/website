import { useRef } from 'react';
import { useMatch } from '@tanstack/react-router';
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
import { useSkyInteractions } from './useSkyInteractions';
import { buildWorld, initialHere, navigableEdges, navigableNodes, whisperPlaceOf } from './walk';

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
// bearing, a thread, an arrow — is the only thing that moves it.

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
    here: walk.here,
    onArrive: walk.arrive,
    cameraRef,
    glyphRef,
  });
  const { hoverKey, onSkyClick, onPointerDown, stage } = useSkyInteractions({
    graph,
    walk,
    travelTo: travel.travelTo,
  });
  // The open overlay's star drops its viewTransitionName so the panel
  // owns the name across snapshots (star → panel on Open, back on
  // Close). shouldThrow:false — /sky alone is a valid state.
  const overlayMatch = useMatch({ from: '/sky/$room/$slug', shouldThrow: false });
  const overlayKey = overlayMatch
    ? `${overlayMatch.params.room}/${overlayMatch.params.slug}`
    : null;
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
      <WebGLFirmament graph={graph} activeKey={hoverKey ?? hereKey} fullViewport={fullViewport} />
      <svg
        ref={parallaxRef}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        preserveAspectRatio={fullViewport ? 'xMidYMid slice' : 'xMidYMid meet'}
        onClick={onSkyClick}
        onPointerDown={onPointerDown}
        onKeyDown={travel.onKeyDown}
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
            <Stage world={world} interactions={stage} glyphRef={glyphRef} />
          </g>
        </g>
      </svg>
      <SkyWhisper
        place={whisperPlaceOf(graph, walk.here)}
        bearings={bearingsOf(graph, walk.here)}
        onBearing={travel.travelTo}
        onAttend={walk.attendFacet}
        className="absolute right-6 bottom-16 left-6 z-10 sm:right-auto sm:bottom-6"
      />
    </nav>
  );
}
