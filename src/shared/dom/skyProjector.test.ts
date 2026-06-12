import { describe, expect, test } from 'vitest';
import { cameraBasis } from '@/shared/geometry/camera';
import type { Camera } from '@/shared/geometry/camera';
import { sphericalToUnit } from '@/shared/geometry/sphere';
import { projectStars, projectThreads } from './skyProjector';
import type { NavigableEdge } from './skyProjector';
import type { NavigableNode } from '@/shared/geometry/wellPhysics';

// The projector caches element lookups per camera group (the
// navigation tick was spending its budget on ~100 querySelector
// walks per frame). These tests pin the cache's contract: repeated
// projections keep writing the same elements, and a remounted
// element (React swapping a node) is picked up again because the
// cache revalidates by isConnected.

const CAMERA: Camera = {
  position: { x: 0, y: 0, z: -2.5 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fovY: Math.PI / 4,
  near: 0.1,
  far: 10,
};
const BASIS = cameraBasis(CAMERA);

function makeGroup(): SVGGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.append(group);
  document.body.append(svg);
  return group;
}

function addStarEl(group: SVGGElement, key: string): SVGGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  el.dataset.nodeKey = key;
  group.append(el);
  return el;
}

const NODE: NavigableNode = {
  key: 'garden/small-weather',
  unitPos: sphericalToUnit({ theta: 0.5, phi: 1.2 }),
};

describe('skyProjector element cache', () => {
  test('repeated projections keep writing the cached element', () => {
    const group = makeGroup();
    const el = addStarEl(group, NODE.key);
    projectStars(group, [NODE], CAMERA, BASIS, 1000);
    const first = el.getAttribute('transform');
    expect(first).toMatch(/^translate\(/);
    projectStars(group, [NODE], CAMERA, BASIS, 1000);
    expect(el.getAttribute('transform')).toBe(first);
  });

  test('a remounted element is re-resolved (isConnected revalidation)', () => {
    const group = makeGroup();
    const stale = addStarEl(group, NODE.key);
    projectStars(group, [NODE], CAMERA, BASIS, 1000);
    stale.remove();
    const fresh = addStarEl(group, NODE.key);
    projectStars(group, [NODE], CAMERA, BASIS, 1000);
    expect(fresh.getAttribute('transform')).toMatch(/^translate\(/);
  });

  test('thread endpoints project through the cache', () => {
    const group = makeGroup();
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.dataset.threadId = 'a|b|craft';
    group.append(line);
    const edge: NavigableEdge = {
      id: 'a|b|craft',
      sourcePos: sphericalToUnit({ theta: 0.4, phi: 0.5 }),
      targetPos: sphericalToUnit({ theta: 0.7, phi: 2.5 }),
    };
    projectThreads(group, [edge], CAMERA, BASIS, 1000);
    expect(Number.parseFloat(line.getAttribute('x1') ?? '')).toBeGreaterThan(0);
    expect(Number.parseFloat(line.getAttribute('y2') ?? '')).toBeGreaterThan(0);
  });
});
