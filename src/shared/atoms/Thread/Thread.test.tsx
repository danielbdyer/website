import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Thread, type ThreadEndpoints, type ThreadStroke } from './Thread';

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

const stroke = (overrides: Partial<ThreadStroke> = {}): ThreadStroke => ({
  axis: 'body',
  hue: 'rose',
  origin: 'emergent',
  dotted: false,
  ...overrides,
});

describe('Thread atom', () => {
  test('renders a line between two endpoints', () => {
    const { container } = render(
      withSvg(
        <Thread
          id="garden/small-weather|study/note|relation"
          stroke={stroke({ axis: 'relation', hue: 'gold' })}
          endpoints={{ x1: 10, y1: 20, x2: 80, y2: 70 }}
        />,
      ),
    );
    const line = container.querySelector('line[data-thread-id]');
    expect(line).not.toBeNull();
    expect(line?.getAttribute('x1')).toBe('10');
    expect(line?.getAttribute('y1')).toBe('20');
    expect(line?.getAttribute('x2')).toBe('80');
    expect(line?.getAttribute('y2')).toBe('70');
  });

  test('exposes its id, axis, origin, and hue as data attributes for the organism to hook', () => {
    const { container } = render(
      withSvg(
        <Thread
          id="a|b|relation"
          stroke={stroke({ axis: 'relation', hue: 'violet' })}
          endpoints={endpoints({ x2: 50, y2: 50 })}
        />,
      ),
    );
    const group = container.querySelector<SVGGElement>('g[data-thread]');
    expect(group?.dataset.thread).toBe('a|b|relation');
    expect(group?.dataset.axis).toBe('relation');
    expect(group?.dataset.origin).toBe('emergent');
    expect(group?.dataset.hue).toBe('violet');
  });

  test('is aria-hidden — threads carry information, not the site’s navigation', () => {
    const { container } = render(
      withSvg(<Thread id="x|y|z" stroke={stroke()} endpoints={endpoints()} />),
    );
    expect(container.querySelector('g[data-thread]')?.getAttribute('aria-hidden')).toBe('true');
  });

  test('is a path: a wide transparent twin carries hover and click, the hairline stays inert', () => {
    const { container } = render(
      withSvg(<Thread id="x|y|z" stroke={stroke({ hue: 'warm' })} endpoints={endpoints()} />),
    );
    const visible = container.querySelector('line[data-thread-id]');
    expect(visible?.getAttribute('class')).toMatch(/pointer-events-none/);
    const hit = container.querySelector<SVGLineElement>('line[data-thread-hit]');
    expect(hit?.dataset.threadHit).toBe('x|y|z');
    expect(hit?.getAttribute('stroke')).toBe('transparent');
    expect(Number(hit?.getAttribute('stroke-width'))).toBeGreaterThan(8);
    expect(hit?.getAttribute('x2')).toBe('1');
  });

  test('at rest, a figure applies no filter and reads as a quiet hairline in its hue', () => {
    const { container } = render(
      withSvg(<Thread id="x|y|z" stroke={stroke()} endpoints={endpoints()} />),
    );
    const line = container.querySelector('line[data-thread-id]');
    expect(line?.getAttribute('filter')).toBeNull();
    expect(container.querySelector<SVGGElement>('g[data-thread]')?.dataset.active).toBeUndefined();
    expect(line?.getAttribute('stroke-width')).toBe('0.55');
    expect(line?.getAttribute('stroke')).toBe('var(--accent-rose)');
    expect(line?.getAttribute('stroke-dasharray')).toBeNull();
  });

  test('a dotted axis draws its figure in a dotted hairline', () => {
    const { container } = render(
      withSvg(<Thread id="x|y|z" stroke={stroke({ dotted: true })} endpoints={endpoints()} />),
    );
    expect(container.querySelector('line[data-thread-id]')?.getAttribute('stroke-dasharray')).toBe(
      '2.4 3.6',
    );
  });

  test("a declared relation draws solid in the page's ink, a little heavier; a discovered one dotted", () => {
    const declared = render(
      withSvg(
        <Thread
          id="a|b|references"
          stroke={{ axis: null, hue: null, origin: 'declared', dotted: false }}
          endpoints={endpoints()}
        />,
      ),
    );
    const line = declared.container.querySelector('line[data-thread-id]');
    expect(line?.getAttribute('stroke')).toBe('var(--text-3)');
    expect(line?.getAttribute('stroke-width')).toBe('0.8');
    expect(line?.getAttribute('stroke-dasharray')).toBeNull();
    expect(
      declared.container.querySelector<SVGGElement>('g[data-thread]')?.dataset.axis,
    ).toBeUndefined();
    const discovered = render(
      withSvg(
        <Thread
          id="a|b|resonates"
          stroke={{ axis: null, hue: null, origin: 'discovered', dotted: false }}
          endpoints={endpoints()}
        />,
      ),
    );
    expect(
      discovered.container.querySelector('line[data-thread-id]')?.getAttribute('stroke-dasharray'),
    ).toBe('2.4 3.6');
  });

  test('when active, applies the vespers bloom filter and a wider stroke', () => {
    const { container } = render(
      withSvg(
        <Thread id="x|y|z" stroke={stroke()} endpoints={endpoints()} walk={{ active: true }} />,
      ),
    );
    const line = container.querySelector('line[data-thread-id]');
    expect(line?.getAttribute('filter')).toBe('url(#cn-vespers-bloom)');
    expect(container.querySelector<SVGGElement>('g[data-thread]')?.dataset.active).toBe('true');
    expect(line?.getAttribute('stroke-width')).toBe('1.1');
  });

  test('remembers being walked and lights with its figure', () => {
    const { container } = render(
      withSvg(
        <Thread
          id="x|y|z"
          stroke={stroke()}
          endpoints={endpoints()}
          walk={{ walked: true, lit: true }}
        />,
      ),
    );
    const group = container.querySelector<SVGGElement>('g[data-thread]');
    expect(group?.dataset.walked).toBe('true');
    expect(group?.dataset.lit).toBe('true');
  });
});
