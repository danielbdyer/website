import type { ConstellationGraph } from '@/shared/content/constellation';
import { concordantFrom, presentFrom } from '@/shared/content/presence';
import {
  POLE_KEY,
  bearingsOf,
  findNode,
  namedRanks,
  namesAt,
  type NamedRank,
  neighborsOf,
  placePosition,
  type Place,
} from '@/shared/content/skyWalk';
import type { NavigableEdge } from '@/shared/dom/skyProjector';
import type { NavigableNode } from '@/shared/geometry/wellPhysics';
import { geodesicDistance } from '@/shared/geometry/sphere';
import type { SkyWalk } from '@/shared/hooks/useSkyWalk';
import type { WhisperConcordant, WhisperPlace } from '@/shared/molecules/SkyWhisper/SkyWhisper';
import {
  activeHueOf,
  compassPoints,
  adjacencyOf,
  groupLabelOf,
  threadPresent,
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
  return node
    ? {
        title: node.title,
        group: groupLabelOf(node.group),
        summary: node.href === null ? node.summary : null,
      }
    : null;
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
 *  here, then its neighbors along the threads, then the stars its
 *  bearings lead to. */
export function namedOrder(graph: ConstellationGraph, here: Place): readonly string[] {
  if (!namesAt(graph, here)) return [];
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

/** The threads present from here (layout.threadPresent), by id: the
 *  ones the projector moves every frame. The rest — a vault's receded
 *  mesh — are painted when the sky settles. */
export function presentEdgeIds(
  edges: readonly ResolvedEdge[],
  present: ReadonlySet<string>,
  named: ReadonlyMap<string, unknown>,
): ReadonlySet<string> {
  return new Set(edges.flatMap((edge) => (threadPresent(present, named, edge) ? [edge.id] : [])));
}

/** Everything the organism derives from where the visitor stands:
 *  presence and names (once per place, not per render), the present
 *  threads the projector moves each frame, and the threads that meet
 *  each star for the hover to light. */
export function placeContext(
  graph: ConstellationGraph,
  edges: readonly ResolvedEdge[],
  here: Place,
): {
  readonly present: ReadonlySet<string>;
  readonly named: ReadonlyMap<string, NamedRank>;
  readonly presentEdges: ReadonlySet<string>;
  readonly adjacency: ReadonlyMap<string, readonly string[]>;
} {
  const present = presentFrom(graph, here);
  const named = namedRanks(graph, here);
  return {
    present,
    named,
    presentEdges: presentEdgeIds(edges, present, named),
    adjacency: adjacencyOf(edges),
  };
}

interface WorldInputs {
  readonly edges: readonly ResolvedEdge[];
  readonly nodes: readonly RenderableNode[];
  readonly walk: SkyWalk;
  readonly overlayKey: string | null;
  /** Presence and names from here (presence.presentFrom,
   *  skyWalk.namedRanks), computed once per place by the organism so a
   *  hover's render does not recompute them for hundreds of stars. */
  readonly present: ReadonlySet<string>;
  readonly named: ReadonlyMap<string, NamedRank>;
}

export function buildWorld(
  graph: ConstellationGraph,
  { edges, nodes, walk, overlayKey, present, named }: WorldInputs,
): ConstellationWorld {
  const hereKey = walk.here === POLE_KEY ? null : walk.here;
  const hereAxes = findNode(graph, walk.here)?.axes ?? [];
  return {
    edges,
    nodes,
    hereKey,
    intentKey: walk.intent,
    overlayKey,
    activeHue: activeHueOf(nodes, walk.intent ?? hereKey),
    named,
    present,
    visited: walk.visited,
    walked: walk.walked,
    litAxis: walk.litAxis,
    attended: new Set([...hereAxes, ...(walk.litAxis ? [walk.litAxis] : [])]),
    compass: compassPoints(graph),
  };
}
