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

const BODY_ROSE = { facet: 'body', hue: 'rose' } as const;

describe('Thread atom', () => {
  test('renders a line between two endpoints', () => {
    const { container } = render(
      withSvg(
        <Thread
          id="garden/small-weather|study/note|relation"
          figure={{ facet: 'relation', hue: 'gold' }}
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

  test('exposes its id, facet, and hue as data attributes for the organism to hook', () => {
    const { container } = render(
      withSvg(
        <Thread
          id="a|b|relation"
          figure={{ facet: 'relation', hue: 'violet' }}
          endpoints={endpoints({ x2: 50, y2: 50 })}
        />,
      ),
    );
    const group = container.querySelector<SVGGElement>('g[data-thread]');
    expect(group?.dataset.thread).toBe('a|b|relation');
    expect(group?.dataset.facet).toBe('relation');
    expect(group?.dataset.hue).toBe('violet');
  });

  test('is aria-hidden — threads carry information, not the site’s navigation', () => {
    const { container } = render(
      withSvg(<Thread id="x|y|z" figure={BODY_ROSE} endpoints={endpoints()} />),
    );
    expect(container.querySelector('g[data-thread]')?.getAttribute('aria-hidden')).toBe('true');
  });

  test('is a path: a wide transparent twin carries hover and click, the hairline stays inert', () => {
    const { container } = render(
      withSvg(
        <Thread id="x|y|z" figure={{ facet: 'body', hue: 'warm' }} endpoints={endpoints()} />,
      ),
    );
    const visible = container.querySelector('line[data-thread-id]');
    expect(visible?.getAttribute('class')).toMatch(/pointer-events-none/);
    const hit = container.querySelector<SVGLineElement>('line[data-thread-hit]');
    expect(hit?.dataset.threadHit).toBe('x|y|z');
    expect(hit?.getAttribute('stroke')).toBe('transparent');
    expect(Number(hit?.getAttribute('stroke-width'))).toBeGreaterThan(8);
    expect(hit?.getAttribute('x2')).toBe('1');
  });

  test('at rest, applies no filter and reads as a quiet wisp', () => {
    const { container } = render(
      withSvg(<Thread id="x|y|z" figure={BODY_ROSE} endpoints={endpoints()} />),
    );
    const line = container.querySelector('line[data-thread-id]');
    expect(line?.getAttribute('filter')).toBeNull();
    expect(container.querySelector<SVGGElement>('g[data-thread]')?.dataset.active).toBeUndefined();
    expect(line?.getAttribute('stroke-width')).toBe('0.55');
  });

  test('when active, applies the vespers bloom filter and a wider stroke', () => {
    const { container } = render(
      withSvg(
        <Thread id="x|y|z" figure={BODY_ROSE} endpoints={endpoints()} walk={{ active: true }} />,
      ),
    );
    const line = container.querySelector('line[data-thread-id]');
    expect(line?.getAttribute('filter')).toBe('url(#cn-vespers-bloom)');
    expect(container.querySelector<SVGGElement>('g[data-thread]')?.dataset.active).toBe('true');
    expect(line?.getAttribute('stroke-width')).toBe('1.1');
  });

  test('names its facet at the midpoint, addressable for the projector', () => {
    const { container } = render(
      withSvg(
        <Thread
          id="a|b|relation"
          figure={{ facet: 'relation', hue: 'gold' }}
          endpoints={{ x1: 10, y1: 20, x2: 30, y2: 60 }}
        />,
      ),
    );
    const name = container.querySelector<SVGTextElement>('text[data-thread-name]');
    expect(name?.textContent).toBe('relation');
    expect(name?.dataset.threadName).toBe('a|b|relation');
    expect(name?.getAttribute('x')).toBe('20');
    expect(name?.getAttribute('y')).toBe('40');
    expect(name?.getAttribute('class')).toMatch(/pointer-events-none/);
  });

  test('a travel that follows it marks it as the track for the crossing', () => {
    const { container } = render(
      withSvg(
        <Thread id="x|y|z" figure={BODY_ROSE} endpoints={endpoints()} walk={{ traveling: true }} />,
      ),
    );
    const group = container.querySelector<SVGGElement>('g[data-thread]');
    expect(group?.dataset.traveling).toBe('true');
    expect(group?.dataset.active).toBeUndefined();
  });

  test('a trace is its own mark, apart from the bloom: only a traced thread names itself', () => {
    const { container } = render(
      withSvg(
        <Thread
          id="x|y|z"
          figure={BODY_ROSE}
          endpoints={endpoints()}
          walk={{ active: true, traced: true }}
        />,
      ),
    );
    const group = container.querySelector<SVGGElement>('g[data-thread]');
    expect(group?.dataset.traced).toBe('true');
    expect(group?.dataset.active).toBe('true');
  });

  test('remembers being walked and lights with its figure', () => {
    const { container } = render(
      withSvg(
        <Thread
          id="x|y|z"
          figure={BODY_ROSE}
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
