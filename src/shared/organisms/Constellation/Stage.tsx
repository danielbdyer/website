import type { KeyboardEvent, PointerEvent, RefObject, SyntheticEvent, FocusEvent } from 'react';
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
  /** The companion glyph — a small mote at the cursor's projected
   *  screen position. The navigation hook updates its cx/cy each
   *  RAF tick. Sibling of the rotates layer so the slow background
   *  rotation doesn't drag it around. */
  glyphRef: RefObject<SVGCircleElement | null>;
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
  glyphRef,
}: StageProps) {
  return (
    <>
      <Polestar cx={500} cy={500} />
      {/* Companion glyph — the visitor's surface position. Begins
          at the polestar (image center on first paint); the hook
          re-positions it each frame as the cursor moves on the
          sphere. aria-hidden because keyboard / screen-reader
          focus moves through the addressable star anchors, not
          this visual marker. */}
      <circle
        ref={glyphRef}
        cx={500}
        cy={500}
        r={3.5}
        className="constellation-companion"
        aria-hidden="true"
        data-companion="true"
      />
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
            // Wrapping group's transform places the star at its
            // projected viewbox position. The hook overwrites this
            // attribute each RAF tick when the camera orbits; the
            // initial value here is the Phase B static projection
            // so first paint matches the rest of the scene before
            // the loop wakes up.
            <g key={key} data-node-key={key} transform={`translate(${pos.x} ${pos.y})`}>
              <Star
                href={`/sky/${node.room}/${node.slug}`}
                label={`${node.title} — ${ROOM_LABEL[node.room]}`}
                cx={0}
                cy={0}
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
