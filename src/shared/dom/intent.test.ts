import { describe, expect, test } from 'vitest';
import { INTENT_RADIUS_VB, INTENT_STEP_BONUS_VB, chooseIntent } from './intent';

describe('chooseIntent', () => {
  test('nothing in reach, no intent', () => {
    expect(chooseIntent([{ key: 'a', distance: INTENT_RADIUS_VB + 1, step: false }])).toBeNull();
    expect(chooseIntent([])).toBeNull();
  });

  test('the star nearest the center is the intent', () => {
    const intent = chooseIntent([
      { key: 'far', distance: 90, step: false },
      { key: 'near', distance: 30, step: false },
    ]);
    expect(intent).toBe('near');
  });

  test('a step along the graph gets a head start, but not the whole way', () => {
    expect(
      chooseIntent([
        { key: 'stranger', distance: 40, step: false },
        { key: 'neighbor', distance: 40 + INTENT_STEP_BONUS_VB - 1, step: true },
      ]),
    ).toBe('neighbor');
    expect(
      chooseIntent([
        { key: 'stranger', distance: 20, step: false },
        { key: 'neighbor', distance: 100, step: true },
      ]),
    ).toBe('stranger');
  });

  test('the bonus can bring a step into reach', () => {
    expect(chooseIntent([{ key: 'neighbor', distance: INTENT_RADIUS_VB + 10, step: true }])).toBe(
      'neighbor',
    );
  });
});
