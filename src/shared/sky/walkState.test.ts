import { describe, expect, test } from 'vitest';
import { POLE_KEY } from '@/shared/content/skyWalk';
import { initialWalk, walkReducer } from './walkState';

describe('walkReducer', () => {
  test('opens at the pole with nothing visited, or at a star already visited', () => {
    expect(initialWalk(POLE_KEY).visited.size).toBe(0);
    expect([...initialWalk('garden/a').visited]).toEqual(['garden/a']);
  });

  test('arriving moves here, remembers the star and the thread, and clears the aim', () => {
    const aimed = walkReducer(initialWalk(POLE_KEY), { kind: 'aimed', place: 'garden/a' });
    expect(aimed.intent).toBe('garden/a');
    const arrived = walkReducer(aimed, { kind: 'arrived', place: 'garden/a', alongEdgeId: 'e' });
    expect(arrived.here).toBe('garden/a');
    expect(arrived.intent).toBeNull();
    expect([...arrived.visited]).toEqual(['garden/a']);
    expect([...arrived.walked]).toEqual(['e']);
  });

  test('arriving at the pole is not a visit', () => {
    const state = walkReducer(initialWalk('garden/a'), { kind: 'arrived', place: POLE_KEY });
    expect(state.here).toBe(POLE_KEY);
    expect([...state.visited]).toEqual(['garden/a']);
  });

  test('attending a facet lights it; the same event twice is the same state', () => {
    const lit = walkReducer(initialWalk(POLE_KEY), { kind: 'attended', facet: 'body' });
    expect(lit.litFacet).toBe('body');
    expect(walkReducer(lit, { kind: 'attended', facet: 'body' })).toBe(lit);
    expect(walkReducer(lit, { kind: 'attended', facet: null }).litFacet).toBeNull();
  });

  test('never mutates the state it is given', () => {
    const before = initialWalk('garden/a');
    walkReducer(before, { kind: 'arrived', place: 'garden/b', alongEdgeId: 'e' });
    expect(before.here).toBe('garden/a');
    expect(before.walked.size).toBe(0);
  });
});
