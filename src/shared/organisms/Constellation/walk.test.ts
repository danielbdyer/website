import { describe, expect, test } from 'vitest';
import { POLE_KEY } from '@/shared/content/skyWalk';
import { initialWalk, walkReducer, type WalkEvent, type WalkState } from '@/shared/sky/walkState';
import { canonicalSkyGraph } from '@/test/sky-fixtures';
import { buildPositionedMap, buildRenderableNodes, resolveEdges } from './layout';
import { attentionKeyOf, bodyPlaceOf, buildWorld, litEndsOf } from './walk';

// The sky's one attention, as values. These rules decide the seams —
// a hover during a glide, a hand aiming past a hover, a traced thread
// lighting its ends — before any DOM is involved.
// CONSTELLATION_STORYBOARD.md §"The Hybrid".

const graph = canonicalSkyGraph;
const positioned = buildPositionedMap(graph);
const edges = resolveEdges(graph.edges, positioned);
const nodes = buildRenderableNodes(graph.nodes, positioned);
const LANGUAGE = 'garden/small-weather|studio/a-second-work|language';

const fold = (state: WalkState, ...events: readonly WalkEvent[]): WalkState =>
  events.reduce(walkReducer, state);

const world = (walk: WalkState) => buildWorld(graph, { edges, nodes, walk, overlayKey: null });

describe('attentionKeyOf — what the atmosphere crescendos toward', () => {
  test('at the pole with nothing attended there is no attention', () => {
    expect(attentionKeyOf(initialWalk(POLE_KEY))).toBeNull();
  });

  test('here is the attention at rest; a heading takes it during a travel', () => {
    const at = initialWalk('garden/small-weather');
    expect(attentionKeyOf(at)).toBe('garden/small-weather');
    const bound = walkReducer(at, { kind: 'departed', place: 'studio/a-second-work' });
    expect(attentionKeyOf(bound)).toBe('studio/a-second-work');
  });

  test('a hover outranks the aim, the aim outranks the heading', () => {
    const at = initialWalk('garden/small-weather');
    const hovered = walkReducer(at, { kind: 'hovered', place: 'study/a-third-work' });
    expect(attentionKeyOf(hovered)).toBe('study/a-third-work');
    const aimed = fold(at, { kind: 'held' }, { kind: 'aimed', place: 'studio/a-second-work' });
    expect(attentionKeyOf(aimed)).toBe('studio/a-second-work');
    // A hover cannot land while the sky is held, so the aim stands.
    expect(
      attentionKeyOf(walkReducer(aimed, { kind: 'hovered', place: 'study/a-third-work' })),
    ).toBe('studio/a-second-work');
  });
});

describe('bodyPlaceOf — the hue the companion wears', () => {
  test('follows where the body stands or is bound, never a glance', () => {
    const at = initialWalk('garden/small-weather');
    expect(bodyPlaceOf(at)).toBe('garden/small-weather');
    expect(bodyPlaceOf(walkReducer(at, { kind: 'hovered', place: 'study/a-third-work' }))).toBe(
      'garden/small-weather',
    );
    expect(bodyPlaceOf(walkReducer(at, { kind: 'departed', place: 'study/a-third-work' }))).toBe(
      'study/a-third-work',
    );
    const aimed = fold(at, { kind: 'held' }, { kind: 'aimed', place: 'studio/a-second-work' });
    expect(bodyPlaceOf(aimed)).toBe('studio/a-second-work');
    expect(bodyPlaceOf(initialWalk(POLE_KEY))).toBeNull();
  });
});

describe('buildWorld — the seams decided as data', () => {
  test('a traced thread lights exactly its two ends', () => {
    expect([...litEndsOf(edges, LANGUAGE)].toSorted()).toEqual([
      'garden/small-weather',
      'studio/a-second-work',
    ]);
    expect(litEndsOf(edges, null).size).toBe(0);
    expect(litEndsOf(edges, 'not|a|thread').size).toBe(0);
    const traced = walkReducer(initialWalk(POLE_KEY), { kind: 'traced', thread: LANGUAGE });
    const w = world(traced);
    expect(w.tracedThreadId).toBe(LANGUAGE);
    expect(w.litEnds.has('study/a-third-work')).toBe(false);
  });

  test('a travel frames its destination and the thread it follows; hover is not carried', () => {
    const bound = fold(
      initialWalk('garden/small-weather'),
      { kind: 'hovered', place: 'study/a-third-work' },
      { kind: 'departed', place: 'studio/a-second-work', alongEdgeId: LANGUAGE },
    );
    const w = world(bound);
    expect(w.hereKey).toBe('garden/small-weather');
    expect(w.headingKey).toBe('studio/a-second-work');
    expect(w.headingEdgeId).toBe(LANGUAGE);
    expect(w.hoverKey).toBeNull();
    // The body already wears the destination's hue: a-second-work is rose.
    expect(w.bodyHue).toBe('rose');
  });

  test('the pole is no star: here, heading, and the body are null there', () => {
    const w = world(initialWalk(POLE_KEY));
    expect(w.hereKey).toBeNull();
    expect(w.headingKey).toBeNull();
    expect(w.bodyHue).toBeNull();
    expect(w.present.size).toBe(3);
  });
});
