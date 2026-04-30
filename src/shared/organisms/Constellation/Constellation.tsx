import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { ConstellationFilters } from '@/shared/atoms/ConstellationFilters/ConstellationFilters';
import { Daystar } from '@/shared/atoms/Daystar/Daystar';
import { Firmament } from '@/shared/atoms/Firmament/Firmament';
import { Polestar } from '@/shared/atoms/Polestar/Polestar';
import { Star } from '@/shared/atoms/Star/Star';
import { Thread } from '@/shared/atoms/Thread/Thread';
import { useInternalLinkDelegation } from '@/shared/hooks/useInternalLinkDelegation';
import { useConstellationParallax } from '@/shared/hooks/useConstellationParallax';
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

export function Constellation({ graph, className }: ConstellationProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const onSkyClick = useInternalLinkDelegation<SVGSVGElement>();
  const parallaxRef = useConstellationParallax<SVGSVGElement>();
  const positioned = buildPositionedMap(graph);
  const edges = resolveEdges(graph.edges, positioned);
  const nodes = buildRenderableNodes(graph.nodes, positioned);
  const titleId = 'constellation-title';

  const handleActivate = (e: SyntheticEvent<Element>) => {
    const handle = (e.target as Element).closest('[data-node-key]');
    if (!handle) return;
    setActiveKey(handle.getAttribute('data-node-key'));
  };
  const handleMouseLeave = () => setActiveKey(null);
  const handleBlur = (e: React.FocusEvent<SVGGElement>) => {
    const next = e.relatedTarget as Element | null;
    if (next?.closest('[data-node-key]')) return;
    setActiveKey(null);
  };

  return (
    <nav aria-labelledby={titleId} className={cn('constellation-frame', className)}>
      <h2 id={titleId} className="sr-only">
        {skyTitle(graph.nodes.length)}
      </h2>
      <svg
        ref={parallaxRef}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        onClick={onSkyClick}
        className="constellation block w-full"
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
                    href={`/${node.room}/${node.slug}`}
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
