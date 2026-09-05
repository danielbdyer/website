import { describe, expect, test } from 'vitest';
import { hoverAxis, hoverStar, hoverThread } from './skyAttention';

const SVG = 'http://www.w3.org/2000/svg';

function el(tag: string, attributes: Record<string, string>): SVGElement {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

/** Two stars joined by a craft thread, a second craft thread onward,
 *  and the craft name at the rim. */
function build() {
  const group = el('g', {});
  const starA = el('a', { class: 'constellation-star' });
  const wrapA = el('g', { 'data-node-key': 'a' });
  wrapA.append(starA);
  const starB = el('a', { class: 'constellation-star' });
  const wrapB = el('g', { 'data-node-key': 'b' });
  wrapB.append(starB);
  const ab = el('g', { 'data-thread': 'a|b|craft', 'data-axis': 'craft' });
  const bc = el('g', { 'data-thread': 'b|c|craft', 'data-axis': 'craft' });
  const name = el('text', { 'data-compass': 'craft' });
  group.append(wrapA, wrapB, ab, bc, name);
  const adjacency = new Map([
    ['a', ['a|b|craft']],
    ['b', ['a|b|craft', 'b|c|craft']],
  ]);
  return { group, starA, starB, ab, bc, name, adjacency };
}

describe('hoverStar', () => {
  test('lights the star and the threads that meet it; moving on clears them', () => {
    const { group, starA, starB, ab, bc, adjacency } = build();
    hoverStar(group, adjacency, null, 'a');
    expect(starA.dataset.hover).toBe('true');
    expect(ab.dataset.hover).toBe('true');
    expect(Object.hasOwn(bc.dataset, 'hover')).toBe(false);
    hoverStar(group, adjacency, 'a', 'b');
    expect(Object.hasOwn(starA.dataset, 'hover')).toBe(false);
    expect(starB.dataset.hover).toBe('true');
    expect(ab.dataset.hover).toBe('true');
    expect(bc.dataset.hover).toBe('true');
    hoverStar(group, adjacency, 'b', null);
    expect(group.querySelectorAll('[data-hover]')).toHaveLength(0);
  });
});

describe('hoverAxis', () => {
  test("lights the axis's figure and its name at the rim", () => {
    const { group, ab, bc, name } = build();
    hoverAxis(group, null, 'craft');
    expect(ab.dataset.lit).toBe('true');
    expect(bc.dataset.lit).toBe('true');
    expect(name.dataset.attended).toBe('true');
    hoverAxis(group, 'craft', null);
    expect(group.querySelectorAll('[data-lit], [data-attended]')).toHaveLength(0);
  });

  test('a mark remembers what React wrote and puts it back', () => {
    const { group, ab, name } = build();
    ab.dataset.lit = 'true';
    name.dataset.attended = 'true';
    hoverAxis(group, null, 'craft');
    hoverAxis(group, 'craft', null);
    expect(ab.dataset.lit).toBe('true');
    expect(name.dataset.attended).toBe('true');
  });
});

describe('hoverThread', () => {
  test('marks the thread under the pointer and clears the one before', () => {
    const { ab, bc } = build();
    hoverThread(null, ab);
    expect(ab.dataset.hover).toBe('true');
    hoverThread(ab, bc);
    expect(ab.dataset.hover).toBeUndefined();
    expect(bc.dataset.hover).toBe('true');
    hoverThread(bc, null);
    expect(bc.dataset.hover).toBeUndefined();
  });
});
