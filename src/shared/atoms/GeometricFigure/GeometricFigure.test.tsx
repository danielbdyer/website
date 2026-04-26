import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GeometricFigure } from './GeometricFigure';

describe('GeometricFigure', () => {
  it('renders an SVG marked aria-hidden', () => {
    const { container } = render(<GeometricFigure />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('carries the spin animation class by default', () => {
    const { container } = render(<GeometricFigure />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('animate-[geo-spin_60s_linear_infinite]');
  });

  it('renders the nested rectangles and the central circle', () => {
    const { container } = render(<GeometricFigure />);
    const rects = container.querySelectorAll('rect');
    const circles = container.querySelectorAll('circle');
    expect(rects).toHaveLength(2);
    expect(circles).toHaveLength(1);
  });

  it('forwards a custom className', () => {
    const { container } = render(<GeometricFigure className="extra" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain('extra');
  });
});
