import { describe, expect, test } from 'vitest';
import { sky, star } from '@/test/sky-graph';
import { REST_DISTANCE } from '@/shared/content/skyWalk';
import { meanInView, starsInView, walkDistanceFor, VIEW_TARGET } from './dial';

const FRAME = { width: 1440, height: 900 };

/** A cap of `count` stars spread evenly over the populated dome. */
function crowd(count: number) {
  return sky(
    Array.from({ length: count }, (_, i) =>
      star(`c/${i}`, ['craft'], (i * 137.508) % 360, 0.18 + 0.6 * Math.sqrt(i / count)),
    ),
    [],
  );
}

describe('starsInView', () => {
  test('from the overview the whole populated dome is in frame', () => {
    const graph = crowd(40);
    const at = graph.nodes[0]!.unitPosition;
    expect(
      starsInView(
        graph.nodes.map((n) => n.unitPosition),
        at,
        REST_DISTANCE,
        FRAME,
      ),
    ).toBe(40);
  });

  test('from the center only the patch overhead is in frame', () => {
    const graph = crowd(200);
    const at = graph.nodes[0]!.unitPosition;
    const seen = starsInView(
      graph.nodes.map((n) => n.unitPosition),
      at,
      0,
      FRAME,
    );
    expect(seen).toBeGreaterThan(0);
    expect(seen).toBeLessThan(120);
  });
});

describe('walkDistanceFor', () => {
  test('a small sky rests at the overview: sixteen works do not change', () => {
    expect(walkDistanceFor(crowd(16), REST_DISTANCE, FRAME)).toBe(REST_DISTANCE);
  });

  test('a crowded sky brings the visitor in until about the target is in view', () => {
    const graph = crowd(120);
    const walk = walkDistanceFor(graph, REST_DISTANCE, FRAME);
    expect(walk).toBeLessThan(REST_DISTANCE);
    expect(walk).toBeGreaterThanOrEqual(0);
    expect(meanInView(graph, walk, FRAME)).toBeLessThanOrEqual(VIEW_TARGET);
    // A step farther out is over the target: the search stopped at the edge.
    const step = walk + REST_DISTANCE / 64;
    expect(meanInView(graph, step, FRAME)).toBeGreaterThan(VIEW_TARGET * 0.8);
  });

  test('a sky too crowded even at the center rests there: the dome is the floor', () => {
    const graph = crowd(300);
    expect(meanInView(graph, 0, FRAME)).toBeGreaterThan(VIEW_TARGET);
    expect(walkDistanceFor(graph, REST_DISTANCE, FRAME)).toBe(0);
  });

  test('the view grows with the distance', () => {
    const graph = crowd(300);
    const near = meanInView(graph, 0.2, FRAME);
    const mid = meanInView(graph, 1.5, FRAME);
    const far = meanInView(graph, REST_DISTANCE, FRAME);
    expect(near).toBeLessThan(mid);
    expect(mid).toBeLessThanOrEqual(far);
  });

  test('an empty sky rests at the overview', () => {
    expect(walkDistanceFor(sky([], []), REST_DISTANCE, FRAME)).toBe(REST_DISTANCE);
  });
});
