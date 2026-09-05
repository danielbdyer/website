import { describe, expect, test } from 'vitest';
import { POLE_KEY } from '@/shared/content/skyWalk';
import { initialWalk, isMoving, walkReducer, type WalkEvent, type WalkState } from './walkState';

const fold = (state: WalkState, ...events: readonly WalkEvent[]): WalkState =>
  events.reduce(walkReducer, state);

describe('walkReducer', () => {
  test('opens at the pole with nothing visited, or at a star already visited', () => {
    expect(initialWalk(POLE_KEY).visited.size).toBe(0);
    expect([...initialWalk('garden/a').visited]).toEqual(['garden/a']);
    expect(isMoving(initialWalk(POLE_KEY))).toBe(false);
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

describe('walkReducer — the destination framed ahead', () => {
  test('departing sets the heading and the thread it follows; arriving clears them', () => {
    const bound = walkReducer(initialWalk('garden/a'), {
      kind: 'departed',
      place: 'garden/b',
      alongEdgeId: 'garden/a|garden/b|body',
    });
    expect(bound.heading).toBe('garden/b');
    expect(bound.headingEdgeId).toBe('garden/a|garden/b|body');
    expect(bound.here).toBe('garden/a');
    expect(isMoving(bound)).toBe(true);
    const there = walkReducer(bound, {
      kind: 'arrived',
      place: 'garden/b',
      alongEdgeId: 'garden/a|garden/b|body',
    });
    expect(there.heading).toBeNull();
    expect(there.headingEdgeId).toBeNull();
    expect(there.here).toBe('garden/b');
    expect(isMoving(there)).toBe(false);
  });

  test('a change of mind mid-flight is a new heading, not a rewind', () => {
    const state = fold(
      initialWalk(POLE_KEY),
      { kind: 'departed', place: 'garden/b', alongEdgeId: 'e1' },
      { kind: 'departed', place: 'study/c' },
    );
    expect(state.heading).toBe('study/c');
    expect(state.headingEdgeId).toBeNull();
    expect(state.here).toBe(POLE_KEY);
  });
});

describe('walkReducer — one attention', () => {
  test('a hover claims at rest, and the same hover twice is the same state', () => {
    const hovered = walkReducer(initialWalk(POLE_KEY), { kind: 'hovered', place: 'garden/a' });
    expect(hovered.hovered).toBe('garden/a');
    expect(walkReducer(hovered, { kind: 'hovered', place: 'garden/a' })).toBe(hovered);
    expect(walkReducer(hovered, { kind: 'hovered', place: null }).hovered).toBeNull();
  });

  test('departing lets go of the hover and the traced thread, and hover stays quiet while heading', () => {
    const attended = fold(
      initialWalk('garden/a'),
      { kind: 'hovered', place: 'garden/b' },
      { kind: 'traced', thread: 'garden/a|garden/b|body' },
    );
    expect(attended.tracedThread).toBe('garden/a|garden/b|body');
    const bound = walkReducer(attended, { kind: 'departed', place: 'garden/b' });
    expect(bound.hovered).toBeNull();
    expect(bound.tracedThread).toBeNull();
    // A star streaming past the pointer does not claim.
    const passing = walkReducer(bound, { kind: 'hovered', place: 'study/c' });
    expect(passing).toBe(bound);
    expect(walkReducer(bound, { kind: 'traced', thread: 'x' })).toBe(bound);
    // After arrival the pointer may claim again.
    const there = walkReducer(bound, { kind: 'arrived', place: 'garden/b' });
    expect(walkReducer(there, { kind: 'hovered', place: 'study/c' }).hovered).toBe('study/c');
  });

  test('a hand taking hold lets go of the pressed star; release restores hover, arrival ends the hold', () => {
    const pressed = walkReducer(initialWalk('garden/a'), { kind: 'hovered', place: 'garden/a' });
    const held = walkReducer(pressed, { kind: 'held' });
    expect(held.held).toBe(true);
    expect(held.hovered).toBeNull();
    expect(isMoving(held)).toBe(true);
    expect(walkReducer(held, { kind: 'hovered', place: 'garden/b' })).toBe(held);
    const released = walkReducer(held, { kind: 'released' });
    expect(released.held).toBe(false);
    expect(walkReducer(released, { kind: 'hovered', place: 'garden/b' }).hovered).toBe('garden/b');
    // A release that was never held is a no-op.
    expect(walkReducer(released, { kind: 'released' })).toBe(released);
    // A settle that lands somewhere ends the hold even without a release.
    const landed = walkReducer(held, { kind: 'arrived', place: 'garden/b' });
    expect(landed.held).toBe(false);
  });

  test('the aim survives the release so the claim persists through the settle', () => {
    const state = fold(
      initialWalk('garden/a'),
      { kind: 'held' },
      { kind: 'aimed', place: 'garden/b' },
      { kind: 'released' },
    );
    expect(state.intent).toBe('garden/b');
    expect(walkReducer(state, { kind: 'arrived', place: 'garden/b' }).intent).toBeNull();
  });
});
