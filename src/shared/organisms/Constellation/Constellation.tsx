import type { ConstellationGraph } from '@/shared/content/constellation';
import { ConstellationFilters } from '@/shared/atoms/ConstellationFilters/ConstellationFilters';
import { Daystar } from '@/shared/atoms/Daystar/Daystar';
import { Firmament } from '@/shared/atoms/Firmament/Firmament';
import { Polestar } from '@/shared/atoms/Polestar/Polestar';
import { Star } from '@/shared/atoms/Star/Star';
import { Thread } from '@/shared/atoms/Thread/Thread';
import { WebGLFirmament } from '@/shared/molecules/WebGLFirmament/WebGLFirmament';
import { useInternalLinkDelegation } from '@/shared/hooks/useInternalLinkDelegation';
import { useConstellationParallax } from '@/shared/hooks/useConstellationParallax';
import { useStarHoverState } from '@/shared/hooks/useStarHoverState';
import { cn } from '@/shared/utils/cn';
import {
  ROOM_LABEL,
  VIEWBOX,
  buildPositionedMap,
  buildRenderableNodes,
  resolveEdges,
  skyTitle,
} from './layout';

interface ConstellationProps {
  graph: ConstellationGraph;
  /** When true, the SVG fills the frame via `xMidYMid slice` (cover-
   *  fit) so the constellation occupies every available pixel rather
   *  than being letterboxed inside a column. The frame's sizing is
   *  the consumer's responsibility — passing a `className` like
   *  `h-dvh w-screen` makes the surface a true full-viewport sky. */
  fullViewport?: boolean;
  className?: string;
}

// The full sky surface. Pure composition over precomputed data —
// `resolveEdges` and `buildRenderableNodes` (in layout.ts) take the
// graph and produce the exact shapes the renderer iterates, so the
// JSX is a thin map from data to elements with no per-render
// lookups. Hover state is event-delegated through `data-node-key` on
// the per-star group: one handler set serves every star, no per-node
// closures, no per-render allocation. Internal anchor clicks
// delegate through TanStack via useInternalLinkDelegation; cursor
// parallax updates CSS variables on the SVG via
// useConstellationParallax (reduced-motion-honest).

const isThreadActive = (activeKey: string | null, sourceKey: string, targetKey: string): boolean =>
  activeKey === sourceKey || activeKey === targetKey;

export function Constellation({ graph, fullViewport = false, className }: ConstellationProps) {
  const { activeKey, handleActivate, handleMouseLeave, handleBlur } = useStarHoverState();
  const onSkyClick = useInternalLinkDelegation<SVGSVGElement>();
  const parallaxRef = useConstellationParallax<SVGSVGElement>();
  const positioned = buildPositionedMap(graph);
  const edges = resolveEdges(graph.edges, positioned);
  const nodes = buildRenderableNodes(graph.nodes, positioned);
  const titleId = 'constellation-title';

  return (
    <nav
      aria-labelledby={titleId}
      // Containment for the layered surface: `relative` mounts the
      // absolutely-positioned WebGLFirmament in the nav's coordinate
      // space; `isolate` creates a stacking context so mix-blend-mode
      // composites against the nav alone (never leaking up); and
      // `overflow-hidden` clips SVG filter regions, sub-pixel canvas-
      // size mismatch, and the parallax translates so no edge can
      // extend the document's scrollWidth past the viewport on real
      // devices.
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
          <Polestar cx={500} cy={500} />
          <g className="constellation-rotates">
            <g aria-hidden="true">
              {edges.map((edge) => (
                <Thread
                  key={edge.id}
                  id={edge.id}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  hue={edge.hue}
                  active={isThreadActive(activeKey, edge.sourceKey, edge.targetKey)}
                />
              ))}
            </g>
            <g
              onMouseOver={handleActivate}
              onMouseLeave={handleMouseLeave}
              onFocus={handleActivate}
              onBlur={handleBlur}
            >
              {nodes.map(({ node, pos, key }) => (
                <g key={key} data-node-key={key}>
                  <Star
                    // Stars open as overlays at /sky/{room}/{slug} —
                    // an addressable URL where the constellation
                    // continues to paint behind a takeover panel.
                    // The work-page at /{room}/{slug} remains
                    // independently addressable for direct-link and
                    // SEO; the overlay is *the sky's way of opening
                    // a work*, not a replacement.
                    href={`/sky/${node.room}/${node.slug}`}
                    label={`${node.title} — ${ROOM_LABEL[node.room]}`}
                    cx={pos.x}
                    cy={pos.y}
                    hue={node.hue}
                    isPreview={node.isPreview}
                    twinkleDelay={node.twinklePhase}
                  />
                </g>
              ))}
            </g>
          </g>
        </g>
      </svg>
    </nav>
  );
}
