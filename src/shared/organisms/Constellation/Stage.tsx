import type { RefObject, SyntheticEvent, FocusEvent } from 'react';
import type { ConstellationHue } from '@/shared/content/constellation';
import type { Facet } from '@/shared/types/common';
import { Polestar } from '@/shared/atoms/Polestar/Polestar';
import { Thread, type ThreadWalk } from '@/shared/atoms/Thread/Thread';
import { Star, type StarWalk, type StarWork } from '@/shared/molecules/Star/Star';
import { TRAIL_LENGTH } from '@/shared/dom/skyProjector';
import { skyStarTransitionName } from '@/shared/utils/view-transition-names';
import { ROOM_LABEL, type RenderableNode, type ResolvedEdge } from './layout';

// The inside of the travel camera. Extracted from Constellation so the
// JSX depth at each layer fits the project's max-4 ceiling without
// flattening the structural meaning of the tree (the pole, the
// companion, threads and stars as sibling layers).

/** The constellation's observable world — what Stage paints. The
 *  edges + nodes are the structural graph; the rest is the walk:
 *  where the visitor stands (hereKey; null at the pole), what they
 *  hover, what is named within a stroke of here, what they have
 *  visited and walked, and which figure is lit by attention.
 *  CONSTELLATION_WALK.md. Held in one shape so the organism's prop
 *  count fits the ≤7 ceiling (REACT_NORTH_STAR.md §"Organisms"). */
export interface ConstellationWorld {
  readonly edges: readonly ResolvedEdge[];
  readonly nodes: readonly RenderableNode[];
  readonly hereKey: string | null;
  readonly hoverKey: string | null;
  readonly activeHue: ConstellationHue | null;
  readonly overlayKey: string | null;
  readonly named: ReadonlySet<string>;
  readonly visited: ReadonlySet<string>;
  readonly walked: ReadonlySet<string>;
  readonly litFacet: Facet | null;
}

/** Interaction handlers Stage forwards to its layers — the hover and
 *  focus sets for stars and threads. Clicks and keys attach at the svg
 *  level in the organism. */
export interface StageInteractions {
  readonly onStarHover: (e: SyntheticEvent<Element>) => void;
  readonly onStarLeave: () => void;
  readonly onStarFocus: (e: FocusEvent<Element>) => void;
  readonly onStarBlur: (e: FocusEvent<Element>) => void;
  readonly onThreadHover: (e: SyntheticEvent<Element>) => void;
  readonly onThreadLeave: () => void;
}

interface StageProps {
  world: ConstellationWorld;
  interactions: StageInteractions;
  /** The companion glyph — the visitor's body in the sky. The travel
   *  hook updates its cx/cy each tick through the same camera the
   *  stars project through, so it turns with the heavens as they do. */
  glyphRef: RefObject<SVGCircleElement | null>;
}

function threadWalkOf(world: ConstellationWorld, edge: ResolvedEdge): ThreadWalk {
  const attended = world.hoverKey ?? world.hereKey;
  return {
    active: attended === edge.sourceKey || attended === edge.targetKey,
    walked: world.walked.has(edge.id),
    lit: world.litFacet === edge.facet,
  };
}

function starWalkOf(world: ConstellationWorld, key: string): StarWalk {
  return {
    active: key === world.hoverKey || key === world.hereKey,
    here: key === world.hereKey,
    named: world.named.has(key),
    visited: world.visited.has(key),
  };
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

// The pole. The geometric figure and its watercolor wash sit at the
// world's north pole — the still point the heavens turn about — and
// the travel hook projects this group there each tick
// (skyProjector.projectPole). The prerendered transform is the pole's
// position under the default camera, which is the center. The wash
// lives inside the SVG so the firmament's noise composes through it.
function PoleGroup() {
  return (
    <g data-polestar="true" transform="translate(500 500)">
      <circle
        cx={0}
        cy={0}
        r={220}
        fill="url(#cn-polestar-wash)"
        aria-hidden="true"
        className="constellation-polestar-wash pointer-events-none"
      />
      <Polestar cx={0} cy={0} />
    </g>
  );
}

interface CompanionGroupProps {
  glyphRef: RefObject<SVGCircleElement | null>;
  activeHue: ConstellationHue | null;
}

// The visitor's surface position plus its ghost-decay trail. Trail
// circles render before the glyph so the live mark paints on top.
// The travel hook positions each per tick via data-companion /
// data-companion-trail queries; CSS handles the visual register
// (paper-amber by default, mixed toward the active facet hue by
// --companion-claim, ghosts modulated by --trail-strength).
// aria-hidden because keyboard / screen-reader focus moves through the
// addressable star anchors, not this visual marker.
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
  const { edges, nodes, activeHue, overlayKey } = world;
  return (
    <>
      <PoleGroup />
      <CompanionGroup glyphRef={glyphRef} activeHue={activeHue} />
      <g className="constellation-rotates">
        {/* Threads first so stars paint above them and win the hit test. */}
        <g
          aria-hidden="true"
          onMouseOver={interactions.onThreadHover}
          onMouseLeave={interactions.onThreadLeave}
        >
          {edges.map((edge) => (
            <Thread
              key={edge.id}
              id={edge.id}
              figure={{ facet: edge.facet, hue: edge.hue }}
              endpoints={{ x1: edge.x1, y1: edge.y1, x2: edge.x2, y2: edge.y2 }}
              walk={threadWalkOf(world, edge)}
            />
          ))}
        </g>
        <g
          onMouseOver={interactions.onStarHover}
          onMouseLeave={interactions.onStarLeave}
          onFocus={interactions.onStarFocus}
          onBlur={interactions.onStarBlur}
        >
          {nodes.map(({ node, pos, key }) => (
            // The wrapping group's transform places the star at its
            // projected viewbox position; the travel hook overwrites it
            // each tick. The initial value is the resting camera's
            // static projection so first paint matches the hydrated
            // scene before the loop wakes.
            <g key={key} data-node-key={key} transform={`translate(${pos.x} ${pos.y})`}>
              <Star
                work={starWorkFor(node)}
                twinkleDelay={node.twinklePhase}
                walk={starWalkOf(world, key)}
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
