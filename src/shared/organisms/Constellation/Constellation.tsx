import { useState } from 'react';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { ConstellationFilters } from '@/shared/atoms/ConstellationFilters/ConstellationFilters';
import { Firmament } from '@/shared/atoms/Firmament/Firmament';
import { Star } from '@/shared/atoms/Star/Star';
import { Thread } from '@/shared/atoms/Thread/Thread';
import { useInternalLinkDelegation } from '@/shared/hooks/useInternalLinkDelegation';
import { cn } from '@/shared/utils/cn';
import {
  ROOM_LABEL,
  VIEWBOX,
  buildPositionedMap,
  nodeKey,
  presentationOrder,
  skyTitle,
} from './layout';

interface ConstellationProps {
  graph: ConstellationGraph;
  className?: string;
}

// The full sky surface. Composes the firmament, every thread between
// facet-related works, and every work as a star. A hovered or focused
// star blooms its connected threads — the active-key state is the
// only piece of local state in the surface.
//
// Internal links delegate to TanStack Router via
// useInternalLinkDelegation, so SVG anchors navigate without a full
// reload. The visible empty Foyer is honored: the constellation lists
// works from Studio, Garden, Study, Salon. Foyer works do not exist
// in the data layer and the surface honestly shows what it has.

export function Constellation({ graph, className }: ConstellationProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const onSkyClick = useInternalLinkDelegation<SVGSVGElement>();
  const positioned = buildPositionedMap(graph);
  const orderedNodes = presentationOrder(graph.nodes);
  const titleId = 'constellation-title';

  return (
    <nav aria-labelledby={titleId} className={cn('constellation-frame', className)}>
      <h2 id={titleId} className="sr-only">
        {skyTitle(graph.nodes.length)}
      </h2>
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        onClick={onSkyClick}
        className="constellation block w-full"
      >
        <ConstellationFilters />
        <Firmament size={VIEWBOX} />

        <g aria-hidden="true">
          {graph.edges.map((edge) => {
            const source = positioned.get(`${edge.source.room}/${edge.source.slug}`);
            const target = positioned.get(`${edge.target.room}/${edge.target.slug}`);
            if (!source || !target) return null;
            const id = `${nodeKey(source)}|${nodeKey(target)}|${edge.facet}`;
            const active = activeKey === nodeKey(source) || activeKey === nodeKey(target);
            return (
              <Thread
                key={id}
                id={id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                hue={edge.hue}
                active={active}
              />
            );
          })}
        </g>

        <g>
          {orderedNodes.map((node) => {
            const pos = positioned.get(nodeKey(node));
            if (!pos) return null;
            const key = nodeKey(node);
            const setActive = () => setActiveKey(key);
            const clearActive = () => setActiveKey((current) => (current === key ? null : current));
            return (
              <g
                key={key}
                onMouseEnter={setActive}
                onMouseLeave={clearActive}
                onFocus={setActive}
                onBlur={clearActive}
              >
                <Star
                  href={`/${node.room}/${node.slug}`}
                  label={`${node.title} — ${ROOM_LABEL[node.room]}`}
                  cx={pos.x}
                  cy={pos.y}
                  hue={node.hue}
                  isPreview={node.isPreview}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </nav>
  );
}
