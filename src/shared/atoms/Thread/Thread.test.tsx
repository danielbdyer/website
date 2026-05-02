import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Thread, type ThreadEndpoints } from './Thread';

function withSvg(node: React.ReactNode) {
  return <svg viewBox="0 0 100 100">{node}</svg>;
}

const endpoints = (overrides: Partial<ThreadEndpoints> = {}): ThreadEndpoints => ({
  x1: 0,
  y1: 0,
  x2: 1,
  y2: 1,
  ...overrides,
});

describe('Thread atom', () => {
  test('renders a line between two endpoints', () => {
    const { container } = render(
      withSvg(
        <Thread
          id="garden/small-weather|study/note|relation"
          endpoints={{ x1: 10, y1: 20, x2: 80, y2: 70 }}
          hue="gold"
        />,
      ),
    );
    const line = container.querySelector('line');
    expect(line).not.toBeNull();
    expect(line?.getAttribute('x1')).toBe('10');
    expect(line?.getAttribute('y1')).toBe('20');
    expect(line?.getAttribute('x2')).toBe('80');
    expect(line?.getAttribute('y2')).toBe('70');
  });

  test('exposes its id and hue as data attributes for the molecule to hook', () => {
    const { container } = render(
      withSvg(<Thread id="a|b|relation" endpoints={endpoints({ x2: 50, y2: 50 })} hue="violet" />),
    );
    const line = container.querySelector('line');
    expect(line?.dataset.threadId).toBe('a|b|relation');
    expect(line?.dataset.hue).toBe('violet');
  });

  test('is aria-hidden — threads carry information, not navigation', () => {
    const { container } = render(withSvg(<Thread id="x|y|z" endpoints={endpoints()} hue="rose" />));
    expect(container.querySelector('line')?.getAttribute('aria-hidden')).toBe('true');
  });

  test('is not pointer-clickable (only stars are addressable)', () => {
    const { container } = render(withSvg(<Thread id="x|y|z" endpoints={endpoints()} hue="warm" />));
    const line = container.querySelector('line');
    expect(line?.className.baseVal ?? line?.getAttribute('class')).toMatch(/pointer-events-none/);
  });

  test('at rest, applies no filter and reads as a quiet wisp', () => {
    const { container } = render(withSvg(<Thread id="x|y|z" endpoints={endpoints()} hue="rose" />));
    const line = container.querySelector('line');
    expect(line?.getAttribute('filter')).toBeNull();
    expect(line?.dataset.active).toBeUndefined();
    expect(line?.getAttribute('stroke-width')).toBe('0.45');
  });

  test('when active, applies the vespers bloom filter and a wider stroke', () => {
    const { container } = render(
      withSvg(<Thread id="x|y|z" endpoints={endpoints()} hue="rose" active />),
    );
    const line = container.querySelector('line');
    expect(line?.getAttribute('filter')).toBe('url(#cn-vespers-bloom)');
    expect(line?.dataset.active).toBe('true');
    expect(line?.getAttribute('stroke-width')).toBe('1.1');
  });
});
