import type { KeyboardEvent, SyntheticEvent, FocusEvent } from 'react';
import type { ConstellationHue } from '@/shared/content/constellation';
import { Polestar } from '@/shared/atoms/Polestar/Polestar';
import { Thread } from '@/shared/atoms/Thread/Thread';
import { Star, type StarWork } from '@/shared/molecules/Star/Star';
import { skyStarTransitionName } from '@/shared/utils/view-transition-names';
import { SPHERE_VIEWBOX_RADIUS_FACTOR } from '@/shared/dom/skyProjector';
import { ROOM_LABEL, type RenderableNode, type ResolvedEdge, VIEWBOX } from './layout';

// The inside of the navigation camera. Extracted from Constellation
// so the JSX depth at each layer fits the project's max-4 ceiling
// without flattening the structural meaning of the tree (Polestar
// alongside the rotates layer, threads and stars as sibling groups
// inside it).
//
// Drag handlers DO NOT live on Stage's inner star group — they live
// on a transparent capture surface at the SVG root, sibling of the
// rotating layer. Putting them inside the rotating compositor layer
// expanded the layer's bounding box (the transparent capture rect
// has to fill the viewport so empty-space gestures register) and
// re-rasterized that whole region every frame, doubling the per-
// frame paint cost on small fixtures. Stage keeps only the
// hover/focus handlers — those naturally fire on per-star elements
// where the rotating layer is the right home.

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

/** Interaction handlers Stage forwards to its inner star group —
 *  hover and focus only. Drag handlers live at the SVG root on a
 *  separate transparent capture surface, not here. */
export interface StageInteractions {
  readonly onActivate: (e: SyntheticEvent<Element>) => void;
  readonly onMouseLeave: () => void;
  readonly onBlur: (e: FocusEvent<Element>) => void;
  readonly onKeyDown: (e: KeyboardEvent) => void;
  readonly onKeyUp: (e: KeyboardEvent) => void;
}

interface StageProps {
  world: ConstellationWorld;
  interactions: StageInteractions;
}

/** A thread is "active" when one of its endpoints is the star the
 *  camera has settled on (nearest to screen center after motion
 *  stops). CSS uses data-active to drive the vespers bloom; the
 *  predicate is pure and stays at module scope rather than as a
 *  Stage prop. */
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

export function Stage({ world, interactions }: StageProps) {
  const { edges, nodes, activeKey, activeHue, overlayKey } = world;
  const { onActivate, onMouseLeave, onBlur, onKeyDown, onKeyUp } = interactions;
  // activeHue still rides through Stage so the polestar wash can take
  // a faint tint from the active facet — kept as data-attribute on
  // the rotates layer, where CSS can read it without re-rendering.
  const sphereRadius = VIEWBOX * SPHERE_VIEWBOX_RADIUS_FACTOR;
  return (
    <>
      {/* Watercolor wash — soft halo of paper-warm light around
          the polestar. CONSTELLATION_DESIGN.md §"Materials"
          commits to washes around the polestar; the gradient
          lives in ConstellationFilters as `cn-polestar-wash` and
          renders as a large fill-only circle behind the
          geometric figure. The wash sits inside the SVG so the
          firmament's noise composes through it; a CSS overlay
          would sit on top instead and read as chrome. */}
      <circle
        cx={500}
        cy={500}
        r={sphereRadius * 0.85}
        fill="url(#cn-polestar-wash)"
        aria-hidden="true"
        className="constellation-polestar-wash pointer-events-none"
      />
      {/* Sphere boundary ring — a faint stroke-only circle at the
          sphere's projected silhouette radius. Marks the backing
          shape so rotating stars read as orbiting a globe rather
          than as scattered points moving through space. Static
          (the sphere doesn't move under camera rotation; only the
          stars do), so the ring stays at a fixed viewbox radius. */}
      <circle
        cx={500}
        cy={500}
        r={sphereRadius}
        fill="none"
        stroke="var(--star-halo)"
        strokeWidth="0.6"
        strokeOpacity="0.22"
        aria-hidden="true"
        className="constellation-sphere-edge pointer-events-none"
      />
      <Polestar cx={500} cy={500} />
      <g className="constellation-rotates" data-active-hue={activeHue ?? 'warm'}>
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
        >
          {nodes.map(({ node, pos, key }) => (
            // Wrapping group's transform places the star at its
            // projected viewbox position. The hook overwrites this
            // attribute each RAF tick when the camera orbits, also
            // applying a depth-driven scale so the back hemisphere
            // recedes; the initial value here is the static
            // projection so first paint matches the rest of the
            // scene before the loop wakes up.
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
