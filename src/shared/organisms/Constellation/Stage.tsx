import type { KeyboardEvent, PointerEvent, SyntheticEvent, FocusEvent } from 'react';
import { Polestar } from '@/shared/atoms/Polestar/Polestar';
import { Star } from '@/shared/atoms/Star/Star';
import { Thread } from '@/shared/atoms/Thread/Thread';
import { ROOM_LABEL, type RenderableNode, type ResolvedEdge } from './layout';

// The inside of the navigation camera. Extracted from Constellation
// so the JSX depth at each layer fits the project's max-4 ceiling
// without flattening the structural meaning of the tree (Polestar
// alongside the rotates layer, threads and stars as sibling groups
// inside it).

interface DragHandlers {
  onPointerDown: (e: PointerEvent<SVGGElement>) => void;
  onPointerMove: (e: PointerEvent<SVGGElement>) => void;
  onPointerUp: (e: PointerEvent<SVGGElement>) => void;
  onPointerCancel: (e: PointerEvent<SVGGElement>) => void;
}

interface StageProps {
  edges: readonly ResolvedEdge[];
  nodes: readonly RenderableNode[];
  activeKey: string | null;
  isThreadActive: (activeKey: string | null, sourceKey: string, targetKey: string) => boolean;
  onActivate: (e: SyntheticEvent<Element>) => void;
  onMouseLeave: () => void;
  onBlur: (e: FocusEvent<Element>) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onKeyUp: (e: KeyboardEvent) => void;
  dragHandlers: DragHandlers;
}

export function Stage({
  edges,
  nodes,
  activeKey,
  isThreadActive,
  onActivate,
  onMouseLeave,
  onBlur,
  onKeyDown,
  onKeyUp,
  dragHandlers,
}: StageProps) {
  return (
    <>
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
          onMouseOver={onActivate}
          onMouseLeave={onMouseLeave}
          onFocus={onActivate}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          {...dragHandlers}
        >
          {nodes.map(({ node, pos, key }) => (
            <g key={key} data-node-key={key}>
              <Star
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
    </>
  );
}
