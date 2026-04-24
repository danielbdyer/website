import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Diamond } from './Diamond';

describe('Diamond', () => {
  it('renders an SVG rotated-square path', () => {
    const { container } = render(<Diamond />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.querySelector('path')).not.toBeNull();
  });

  it('applies custom className via cn', () => {
    const { container } = render(<Diamond className="custom-class" />);
    const svg = container.querySelector('svg');
    expect(svg?.classList.contains('custom-class')).toBe(true);
  });

  it('accepts a size prop that sets width and height', () => {
    const { container } = render(<Diamond size={12} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('12');
    expect(svg?.getAttribute('height')).toBe('12');
  });

  it('defaults size to 6', () => {
    const { container } = render(<Diamond />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('6');
  });
});
