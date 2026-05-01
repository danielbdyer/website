import { describe, expect, test } from 'vitest';
import { chooseNearestNode } from './useConstellationDragSelect';

const NODES = [
  { key: 'a', pos: { x: 100, y: 100 } },
  { key: 'b', pos: { x: 120, y: 100 } },
  { key: 'c', pos: { x: 240, y: 100 } },
];

describe('chooseNearestNode', () => {
  test('chooses geometric nearest node when no active key', () => {
    const nearest = chooseNearestNode({
      nodes: NODES,
      adjacency: new Map(),
      activeKey: null,
      x: 118,
      y: 100,
    });
    expect(nearest?.key).toBe('b');
  });

  test('applies sticky bias to the current active node', () => {
    const nearest = chooseNearestNode({
      nodes: NODES,
      adjacency: new Map([['a', new Set(['b'])]]),
      activeKey: 'a',
      x: 109,
      y: 100,
    });
    expect(nearest?.key).toBe('a');
  });
});
