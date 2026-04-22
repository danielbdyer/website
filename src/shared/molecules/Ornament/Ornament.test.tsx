import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Ornament } from './Ornament';

describe('Ornament', () => {
  it('composes a Diamond between two hairline spans', () => {
    const { container } = render(<Ornament />);
    const spans = container.querySelectorAll('span');
    const svg = container.querySelector('svg');
    expect(spans).toHaveLength(2);
    expect(svg).not.toBeNull();
  });

  it('passes through custom className to the wrapper', () => {
    const { container } = render(<Ornament className="my-ornament" />);
    expect(container.firstChild).toHaveClass('my-ornament');
  });
});
