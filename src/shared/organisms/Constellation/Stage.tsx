import type { KeyboardEvent, PointerEvent, RefObject, SyntheticEvent, FocusEvent } from 'react';
import type { ConstellationHue } from '@/shared/content/constellation';
import { Polestar } from '@/shared/atoms/Polestar/Polestar';
import { Thread } from '@/shared/atoms/Thread/Thread';
import { Star, type StarWork } from '@/shared/molecules/Star/Star';
import { skyStarTransitionName } from '@/shared/utils/view-transition-names';
import { ROOM_LABEL, type RenderableNode, type ResolvedEdge } from './layout';

// The inside of the navigation camera. Extracted from Constellation
// so the JSX depth at each layer fits the project's max-4 ceiling
// without flattening the structural meaning of the tree (Polestar
// alongside the rotates layer, threads and stars as sibling groups
// inside it).

interface DragHandlers {
  readonly onPointerDown: (e: PointerEvent<SVGGElement>) => void;
  readonly onPointerMove: (e: PointerEvent<SVGGElement>) => void;
  readonly onPointerUp: (e: PointerEvent<SVGGElement>) => void;
  readonly onPointerCancel: (e: PointerEvent<SVGGElement>) => void;
}

/** The constellation's observable world — what Stage paints. The
 *  edges + nodes are the structural graph; activeKey + activeHue
 *  + overlayKey are the visitor's place in it. Held in one shape
 *  so the organism's prop count fits the ≤7 ceiling
 *  (REACT_NORTH_STAR.md §"Organisms"). */
export interface ConstellationWorld {
  readonly edges: readonly ResolvedEdge[];
  readonly nodes: readonly RenderableNode[];
  readonly activeKey: string | null;
  readonly activeHue: ConstellationHue | null;
  readonly overlayKey: string | null;
}

/** Interaction handlers Stage forwards to its inner star group.
 *  Each comes from the hover-state hook or the navigation hook;
 *  Stage doesn't own any of them. */
export interface StageInteractions {
  readonly onActivate: (e: SyntheticEvent<Element>) => void;
  readonly onMouseLeave: () => void;
  readonly onBlur: (e: FocusEvent<Element>) => void;
  readonly onKeyDown: (e: KeyboardEvent) => void;
  readonly onKeyUp: (e: KeyboardEvent) => void;
  readonly dragHandlers: DragHandlers;
}

interface StageProps {
  world: ConstellationWorld;
  interactions: StageInteractions;
  /** The companion glyph — a small mote at the cursor's projected
   *  screen position. The navigation hook updates its cx/cy each
   *  RAF tick. Sibling of the rotates layer so the slow background
   *  rotation doesn't drag it around. */
  glyphRef: RefObject<SVGCircleElement | null>;
}

/** A thread is "active" when one of its endpoints is the cursor's
 *  current basin claim. CSS uses data-active to drive the
 *  vespers bloom; the predicate is pure and stays at module scope
 *  rather than as a Stage prop. */
function isThreadActive(activeKey: string | null, sourceKey: string, targetKey: string): boolean {
  return activeKey === sourceKey || activeKey === targetKey;
}

/** Build the StarWork shape from a renderable node — pure projection. */
function starWorkFor(node: RenderableNode['node']): StarWork {
  return {
    href: `/sky/${node.room}/${node.slug}`,
    label: `${node.title} — ${ROOM_LABEL[node.room]}`,
    visibleLabel: node.title,
    hue: node.hue,
    isPreview: node.isPreview,
  };
}

// Number of ghost positions trailing the cursor. Mirrors TRAIL_LENGTH
// in useConstellationNavigation; the hook positions each ghost's
// cx/cy by querying [data-companion-trail="N"] each frame.
const TRAIL_LENGTH = 4;

interface CompanionGroupProps {
  glyphRef: RefObject<SVGCircleElement | null>;
  activeHue: ConstellationHue | null;
}

// The visitor's surface position plus its ghost-decay trail. Trail
// circles render before the glyph so the live mark paints on top.
// The navigation hook positions each per RAF tick via data-companion
// / data-companion-trail queries; CSS handles the visual register
// (paper-amber by default, mixed toward the active facet hue by
// --companion-claim, ghosts modulated by --trail-strength).
// aria-hidden because keyboard / screen-reader focus moves through
// the addressable star anchors, not this visual marker.
function CompanionGroup({ glyphRef, activeHue }: CompanionGroupProps) {
  return (
    <g
      data-companion-group
      data-active-hue={activeHue ?? 'warm'}
      aria-hidden="true"
      className="constellation-companion-group"
    >
      {Array.from({ length: TRAIL_LENGTH }, (_, i) => (
        <circle
          key={i}
          data-companion-trail={i}
          cx={500}
          cy={500}
          r={3.5}
          className={`constellation-companion-trail constellation-companion-trail--${i}`}
        />
      ))}
      <circle
        ref={glyphRef}
        cx={500}
        cy={500}
        r={3.5}
        className="constellation-companion"
        data-companion="true"
      />
    </g>
  );
}

export function Stage({ world, interactions, glyphRef }: StageProps) {
  const { edges, nodes, activeKey, activeHue, overlayKey } = world;
  const { onActivate, onMouseLeave, onBlur, onKeyDown, onKeyUp, dragHandlers } = interactions;
  return (
    <>
      <Polestar cx={500} cy={500} />
      <CompanionGroup glyphRef={glyphRef} activeHue={activeHue} />
      <g className="constellation-rotates">
        <g aria-hidden="true">
          {edges.map((edge) => (
            <Thread
              key={edge.id}
              id={edge.id}
              endpoints={{ x1: edge.x1, y1: edge.y1, x2: edge.x2, y2: edge.y2 }}
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
                work={starWorkFor(node)}
                twinkleDelay={node.twinklePhase}
                isActive={key === activeKey}
                {...(key === overlayKey
                  ? {}
                  : { viewTransitionName: skyStarTransitionName(node.room, node.slug) })}
              />
            </g>
          ))}
        </g>
      </g>
    </>
  );
}
