import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from '@/test/axe';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders as a <footer> landmark', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('contains the ornament (a Diamond between two hairlines)', () => {
    const { container } = render(<Footer />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders the identity lines', () => {
    render(<Footer />);
    expect(screen.getByText('Danny Dyer')).toBeInTheDocument();
    expect(screen.getByText('danielbdyer.com')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Footer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
