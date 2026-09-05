import type { ConstellationGraph } from '@/shared/content/constellation';
import { concordantFrom, presentFrom } from '@/shared/content/presence';
import {
  POLE_KEY,
  bearingsOf,
  findNode,
  namedRanks,
  neighborsOf,
  placePosition,
  type Place,
} from '@/shared/content/skyWalk';
import type { NavigableEdge } from '@/shared/dom/skyProjector';
import type { NavigableNode } from '@/shared/geometry/wellPhysics';
import { geodesicDistance } from '@/shared/geometry/sphere';
import type { WalkState } from '@/shared/sky/walkState';
import type { WhisperConcordant, WhisperPlace } from '@/shared/molecules/SkyWhisper/SkyWhisper';
import {
  ROOM_LABEL,
  activeHueOf,
  compassPoints,
  type PositionedNode,
  type RenderableNode,
  type ResolvedEdge,
} from './layout';
import type { ConstellationWorld } from './Stage';

// Pure helpers between the walk's state and the Stage's world — no
// React, no DOM writes. The organism stays a thin composition.

/** Where the visitor stands when the sky opens: the star a look-up
 *  jumped to, if it exists, else the pole. The session's remembered
 *  place is applied after mount (useSkyTravel) because prerendered
 *  markup cannot know it. */
export function initialHere(graph: ConstellationGraph, focusKey?: string): Place {
  return focusKey && findNode(graph, focusKey) ? focusKey : POLE_KEY;
}

export function whisperPlaceOf(graph: ConstellationGraph, here: Place): WhisperPlace | null {
  const node = findNode(graph, here);
  return node ? { title: node.title, room: ROOM_LABEL[node.room] } : null;
}

export function whisperConcordantOf(
  graph: ConstellationGraph,
  here: Place,
): WhisperConcordant | null {
  const concordant = concordantFrom(graph, here);
  const node = concordant ? findNode(graph, concordant.key) : null;
  return concordant && node ? { key: concordant.key, title: node.title } : null;
}

/** The labels visible at rest, in the priority the layout honors:
 *  here, then its neighbors along the figures, then the stars its
 *  bearings lead to. */
export function namedOrder(graph: ConstellationGraph, here: Place): readonly string[] {
  const ordered = [
    ...(findNode(graph, here) ? [here] : []),
    ...neighborsOf(graph, here).map((n) => n.key),
    ...bearingsOf(graph, here).flatMap((b) => (b.to ? [b.to] : [])),
  ];
  return [...new Set(ordered)];
}

export type ClickTarget =
  | { readonly kind: 'star'; readonly key: string }
  | { readonly kind: 'thread'; readonly id: string }
  | null;

/** What a pointer landed on: a star's wrapper, a thread's group, or
 *  the open sky. */
export function clickTargetOf(target: Element): ClickTarget {
  const star = target.closest<SVGGElement>('[data-node-key]');
  if (star) return { kind: 'star', key: star.dataset.nodeKey ?? '' };
  const thread = target.closest<SVGGElement>('[data-thread]');
  if (thread) return { kind: 'thread', id: thread.dataset.thread ?? '' };
  return null;
}

export function starKeyOf(target: Element): string | null {
  return target.closest<SVGGElement>('[data-node-key]')?.dataset.nodeKey ?? null;
}

export function threadIdOf(target: Element): string | null {
  return target.closest<SVGGElement>('[data-thread]')?.dataset.thread ?? null;
}

/** Where walking a thread takes you: its other end when you stand at
 *  one; otherwise its farther end, so the crossing passes the nearer
 *  star on the way. Null for a malformed id. */
export function farEndOf(graph: ConstellationGraph, threadId: string, here: Place): string | null {
  const [source, target] = threadId.split('|');
  if (!source || !target) return null;
  if (here === source) return target;
  if (here === target) return source;
  const from = placePosition(graph, here);
  const toSource = geodesicDistance(from, placePosition(graph, source));
  const toTarget = geodesicDistance(from, placePosition(graph, target));
  return toSource >= toTarget ? source : target;
}

export const navigableNodes = (nodes: readonly RenderableNode[]): NavigableNode[] =>
  nodes.map(({ key, node }) => ({ key, unitPos: node.unitPosition }));

export function navigableEdges(
  edges: readonly ResolvedEdge[],
  positioned: ReadonlyMap<string, PositionedNode>,
): NavigableEdge[] {
  return edges.flatMap((edge) => {
    const source = positioned.get(edge.sourceKey);
    const target = positioned.get(edge.targetKey);
    if (!source || !target) return [];
    return [{ id: edge.id, sourcePos: source.unitPosition, targetPos: target.unitPosition }];
  });
}

// ─── One attention ─────────────────────────────────────────────────
//
// The sky claims one thing at a time, in a fixed order. The pure rules
// live here so the organism's world is a derivation and the seams —
// a hover during a glide, a hand aiming past a hover — are decided in
// one place and tested with values. CONSTELLATION_STORYBOARD.md
// §"The Hybrid".

/** A place as a star key; the pole is no star. */
const starKey = (place: Place | null): string | null =>
  place === null || place === POLE_KEY ? null : place;

/** The star the sky's attention is on — what the atmosphere's halo
 *  crescendos toward: the one under the pointer, else the one a hand
 *  aims at, else the one the sky is bound for, else here. */
export function attentionKeyOf(walk: WalkState): string | null {
  return walk.hovered ?? walk.intent ?? starKey(walk.heading) ?? starKey(walk.here);
}

/** Where the visitor's body is, or is going — what the companion glyph
 *  wears the hue of. A hover is a glance, not a step; it never colors
 *  the body. */
export function bodyPlaceOf(walk: WalkState): string | null {
  return walk.intent ?? starKey(walk.heading) ?? starKey(walk.here);
}

/** The two ends of a traced thread, lit while the pointer rests on it;
 *  empty when no thread is traced. */
export function litEndsOf(
  edges: readonly ResolvedEdge[],
  tracedThread: string | null,
): ReadonlySet<string> {
  const edge = edges.find((e) => e.id === tracedThread);
  return new Set(edge ? [edge.sourceKey, edge.targetKey] : []);
}

interface WorldInputs {
  readonly edges: readonly ResolvedEdge[];
  readonly nodes: readonly RenderableNode[];
  readonly walk: WalkState;
  readonly overlayKey: string | null;
}

export function buildWorld(
  graph: ConstellationGraph,
  { edges, nodes, walk, overlayKey }: WorldInputs,
): ConstellationWorld {
  const hereFacets = findNode(graph, walk.here)?.facets ?? [];
  return {
    edges,
    nodes,
    hereKey: starKey(walk.here),
    hoverKey: walk.hovered,
    intentKey: walk.intent,
    headingKey: starKey(walk.heading),
    headingEdgeId: walk.headingEdgeId,
    tracedThreadId: walk.tracedThread,
    litEnds: litEndsOf(edges, walk.tracedThread),
    overlayKey,
    bodyHue: activeHueOf(nodes, bodyPlaceOf(walk)),
    named: namedRanks(graph, walk.here),
    present: presentFrom(graph, walk.here),
    visited: walk.visited,
    walked: walk.walked,
    litFacet: walk.litFacet,
    attended: new Set([...hereFacets, ...(walk.litFacet ? [walk.litFacet] : [])]),
    compass: compassPoints(graph),
  };
}
