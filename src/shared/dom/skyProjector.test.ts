import { describe, expect, test } from 'vitest';
import { cameraBasis } from '@/shared/geometry/camera';
import type { Camera } from '@/shared/geometry/camera';
import { sphericalToUnit } from '@/shared/geometry/sphere';
import { clientToNormalized, projectStars, projectThreads, projectToViewbox } from './skyProjector';
import type { NavigableEdge, SkyFrame } from './skyProjector';
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

  test('given the present set, only those stars move', () => {
    const group = makeGroup();
    const a = addStarEl(group, 'a');
    const b = addStarEl(group, 'b');
    const nodes: NavigableNode[] = [
      { key: 'a', unitPos: sphericalToUnit({ theta: 0.4, phi: 0.5 }) },
      { key: 'b', unitPos: sphericalToUnit({ theta: 0.7, phi: 2.5 }) },
    ];
    projectStars(group, nodes, CAMERA, BASIS, 1000, new Set(['b']));
    expect(a.getAttribute('transform')).toBeNull();
    expect(b.getAttribute('transform')).toMatch(/^translate\(/);
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

  test('the hit twin beside a present thread moves with it, found as its sibling', () => {
    const group = makeGroup();
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.dataset.threadId = 'a|b|craft';
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hit.dataset.threadHit = 'a|b|craft';
    group.append(line, hit);
    const edge: NavigableEdge = {
      id: 'a|b|craft',
      sourcePos: sphericalToUnit({ theta: 0.4, phi: 0.5 }),
      targetPos: sphericalToUnit({ theta: 0.7, phi: 2.5 }),
    };
    projectThreads(group, [edge], CAMERA, BASIS, 1000);
    expect(hit.getAttribute('x1')).toBe(line.getAttribute('x1'));
    expect(hit.getAttribute('y2')).toBe(line.getAttribute('y2'));
  });

  test('under the atmosphere a hairline moves only while lit; its hit twin always does', () => {
    const group = makeGroup();
    const thread = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    thread.dataset.thread = 'a|b|craft';
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.dataset.threadId = 'a|b|craft';
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hit.dataset.threadHit = 'a|b|craft';
    thread.append(line, hit);
    group.append(thread);
    const edge: NavigableEdge = {
      id: 'a|b|craft',
      sourcePos: sphericalToUnit({ theta: 0.4, phi: 0.5 }),
      targetPos: sphericalToUnit({ theta: 0.7, phi: 2.5 }),
    };
    projectThreads(group, [edge], CAMERA, BASIS, 1000, null, true);
    expect(line.getAttribute('x1')).toBeNull();
    expect(hit.getAttribute('x1')).not.toBeNull();
    thread.dataset.hover = 'true';
    projectThreads(group, [edge], CAMERA, BASIS, 1000, null, true);
    expect(line.getAttribute('x1')).toBe(hit.getAttribute('x1'));
  });

  test('given the present set, only those threads move', () => {
    const group = makeGroup();
    const lines = ['a|b|craft', 'b|c|craft'].map((id) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.dataset.threadId = id;
      group.append(line);
      return line;
    });
    const edges: NavigableEdge[] = ['a|b|craft', 'b|c|craft'].map((id) => ({
      id,
      sourcePos: sphericalToUnit({ theta: 0.4, phi: 0.5 }),
      targetPos: sphericalToUnit({ theta: 0.7, phi: 2.5 }),
    }));
    projectThreads(group, edges, CAMERA, BASIS, 1000, new Set(['b|c|craft']));
    expect(lines[0]!.getAttribute('x1')).toBeNull();
    expect(lines[1]!.getAttribute('x1')).not.toBeNull();
  });
});

describe('clientToNormalized', () => {
  // A landscape frame with the square viewbox cover-fit into it: the
  // viewbox scales to the width (1.44 px/unit) and is cropped top and
  // bottom by 270px. The old bounds-based normalization stretched x
  // and squeezed y; this mapping is the projector's own, inverted.
  const frame: SkyFrame = { left: 0, top: 0, width: 1440, height: 900, fit: 'cover' };

  test('the frame center is the image center', () => {
    expect(clientToNormalized(720, 450, frame, 1000)).toEqual({ x: 0, y: -0 });
  });

  test('round-trips the projector: a projected star is found under its own pixel', () => {
    const point = sphericalToUnit({ theta: 0.5, phi: 1.1 });
    const proj = projectToViewbox(point, CAMERA, BASIS, 1000);
    const scale = 1440 / 1000;
    const offsetY = (900 - 1000 * scale) / 2;
    const clientX = proj.x * scale;
    const clientY = proj.y * scale + offsetY;
    const n = clientToNormalized(clientX, clientY, frame, 1000);
    // Undo the viewbox mapping by hand to compare normalized coords.
    expect(n?.x).toBeCloseTo((proj.x - 500) / 440, 9);
    expect(n?.y).toBeCloseTo(-(proj.y - 500) / 440, 9);
  });

  test('the frustum edge sits at 440 viewbox units, not at the box edge', () => {
    // x = +1 normalized → viewbox 940 → 940 × 1.44 = 1353.6px, inside the
    // 1440px box. Normalizing over the box width would have put +1 at 1440.
    const n = clientToNormalized(940 * 1.44, 450, frame, 1000);
    expect(n?.x).toBeCloseTo(1, 9);
  });

  test('a contain fit letterboxes instead of cropping', () => {
    const contain: SkyFrame = { left: 0, top: 0, width: 1440, height: 900, fit: 'contain' };
    // Scale is 0.9; the 900px-wide viewbox is centered with 270px bars left and right.
    const n = clientToNormalized(270 + 500 * 0.9, 450, contain, 1000);
    expect(n?.x).toBeCloseTo(0, 9);
    expect(n?.y).toBeCloseTo(0, 9);
  });

  test('an empty frame yields null', () => {
    expect(clientToNormalized(10, 10, { ...frame, width: 0 }, 1000)).toBeNull();
  });
});
