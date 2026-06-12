import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { diskToHemisphere } from '@/shared/geometry/sphere';
import { WebGLFirmament } from './WebGLFirmament';

const GRAPH: ConstellationGraph = {
  facetHues: {
    craft: 'warm',
    body: 'warm',
    beauty: 'rose',
    language: 'rose',
    consciousness: 'violet',
    becoming: 'violet',
    leadership: 'gold',
    relation: 'gold',
  },
  nodes: [
    {
      room: 'garden',
      slug: 'small-weather',
      title: 'small weather',
      date: new Date('2026-04-24'),
      facets: ['relation'],
      posture: undefined,
      isPreview: false,
      angleDeg: 135,
      radius: 0.6,
      unitPosition: diskToHemisphere(0.6, (135 * Math.PI) / 180),
      hue: 'gold',
      twinklePhase: 1.2,
    },
  ],
  edges: [],
};

describe('WebGLFirmament molecule', () => {
  test('mounts a positioned container the hook can fill', () => {
    const { container } = render(<WebGLFirmament graph={GRAPH} activeKey={null} />);
    const node = container.querySelector('.webgl-firmament');
    expect(node).not.toBeNull();
  });

  test('is aria-hidden — decorative paint, never navigation', () => {
    const { container } = render(<WebGLFirmament graph={GRAPH} activeKey={null} />);
    expect(container.querySelector('.webgl-firmament')?.getAttribute('aria-hidden')).toBe('true');
  });

  test('does not capture pointer events and fills its frame', () => {
    const { container } = render(<WebGLFirmament graph={GRAPH} activeKey={null} />);
    const cls = container.querySelector('.webgl-firmament')?.getAttribute('class') ?? '';
    expect(cls).toMatch(/pointer-events-none/);
    expect(cls).toMatch(/absolute/);
    expect(cls).toMatch(/inset-0/);
  });

  test('stays an empty fallback shell when WebGL is unavailable', () => {
    // happy-dom has no WebGL context; the hook's probe bails before
    // ogl loads and the container stays empty — the SVG firmament
    // behind it remains the firmament.
    const { container } = render(<WebGLFirmament graph={GRAPH} activeKey={null} />);
    expect(container.querySelector('canvas')).toBeNull();
  });

  test('honors a custom className passed by the consumer', () => {
    const { container } = render(
      <WebGLFirmament graph={GRAPH} activeKey={null} className="extra-class" />,
    );
    expect(container.querySelector('.webgl-firmament')?.classList.contains('extra-class')).toBe(
      true,
    );
  });
});
