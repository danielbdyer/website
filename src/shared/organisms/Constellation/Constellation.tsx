import { useRef } from 'react';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { ConstellationFilters } from '@/shared/atoms/ConstellationFilters/ConstellationFilters';
import { Daystar } from '@/shared/atoms/Daystar/Daystar';
import { Firmament } from '@/shared/atoms/Firmament/Firmament';
import { WebGLFirmament } from '@/shared/molecules/WebGLFirmament/WebGLFirmament';
import { useInternalLinkDelegation } from '@/shared/hooks/useInternalLinkDelegation';
import { useConstellationParallax } from '@/shared/hooks/useConstellationParallax';
import { useStarHoverState } from '@/shared/hooks/useStarHoverState';
import { useConstellationNavigation } from '@/shared/hooks/useConstellationNavigation';
import { cn } from '@/shared/utils/cn';
import { Stage } from './Stage';
import {
  STAGE_CAMERA,
  VIEWBOX,
  buildPositionedMap,
  buildRenderableNodes,
  resolveEdges,
  skyTitle,
} from './layout';
import { cameraBasis } from '@/shared/geometry/camera';

const STAGE_BASIS = cameraBasis(STAGE_CAMERA);

interface ConstellationProps {
  graph: ConstellationGraph;
  /** When true, the SVG fills the frame via `xMidYMid slice` (cover-
   *  fit) so the constellation occupies every available pixel rather
   *  than being letterboxed inside a column. */
  fullViewport?: boolean;
  className?: string;
}

const isThreadActive = (activeKey: string | null, sourceKey: string, targetKey: string): boolean =>
  activeKey === sourceKey || activeKey === targetKey;

export function Constellation({ graph, fullViewport = false, className }: ConstellationProps) {
  const onSkyClick = useInternalLinkDelegation<SVGSVGElement>();
  const parallaxRef = useConstellationParallax<SVGSVGElement>();
  const cameraRef = useRef<SVGGElement | null>(null);
  const glyphRef = useRef<SVGCircleElement | null>(null);
  const positioned = buildPositionedMap(graph);
  const edges = resolveEdges(graph.edges, positioned);
  const nodes = buildRenderableNodes(graph.nodes, positioned);
  const titleId = 'constellation-title';
  const { activeKey, handleActivate, handleMouseLeave, handleBlur, setActiveKey } =
    useStarHoverState(null);
  const navigableNodes = nodes.map(({ key, node }) => ({ key, unitPos: node.unitPosition }));
  const { dragHandlers, onKeyDown, onKeyUp } = useConstellationNavigation({
    nodes: navigableNodes,
    camera: STAGE_CAMERA,
    basis: STAGE_BASIS,
    viewboxSize: VIEWBOX,
    setActiveKey,
    cameraRef,
    glyphRef,
  });

  return (
    <nav
      aria-labelledby={titleId}
      className={cn('constellation-frame relative isolate overflow-hidden', className)}
    >
      <h2 id={titleId} className="sr-only">
        {skyTitle(graph.nodes.length)}
      </h2>
      <WebGLFirmament />
      <svg
        ref={parallaxRef}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        preserveAspectRatio={fullViewport ? 'xMidYMid slice' : 'xMidYMid meet'}
        onClick={onSkyClick}
        className={cn('constellation relative block w-full', fullViewport && 'h-full')}
      >
        <ConstellationFilters />
        <g className="constellation-parallax--firmament">
          <Firmament size={VIEWBOX} />
          <Daystar cx={500} cy={240} />
        </g>
        <g className="constellation-parallax--sky">
          <g ref={cameraRef} className="constellation-camera">
            <Stage
              edges={edges}
              nodes={nodes}
              activeKey={activeKey}
              isThreadActive={isThreadActive}
              onActivate={handleActivate}
              onMouseLeave={handleMouseLeave}
              onBlur={handleBlur}
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
              dragHandlers={dragHandlers}
              glyphRef={glyphRef}
            />
          </g>
        </g>
      </svg>
    </nav>
  );
}
