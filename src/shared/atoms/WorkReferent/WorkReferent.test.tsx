import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkReferent } from './WorkReferent';

describe('WorkReferent', () => {
  it('renders creator — name, year when all three are present', () => {
    const { container } = render(
      <WorkReferent
        referent={{
          type: 'visual-artwork',
          name: 'Stoclet Frieze',
          creator: { name: 'Gustav Klimt' },
          year: 1911,
        }}
      />,
    );
    // The text is split across child nodes; assert against the element's
    // collapsed textContent, which is what a screen reader announces.
    const collapsed = container.textContent?.replace(/\s+/g, ' ').trim();
    expect(collapsed).toBe('Gustav Klimt — Stoclet Frieze, 1911');
  });

  it('renders without creator when none is set', () => {
    render(
      <WorkReferent
        referent={{ type: 'music-composition', name: 'Spiegel im Spiegel', year: 1978 }}
      />,
    );
    expect(screen.queryByText(/—/)).not.toBeInTheDocument();
    expect(screen.getByText('Spiegel im Spiegel')).toBeInTheDocument();
  });

  it('renders without year when none is set', () => {
    render(
      <WorkReferent
        referent={{
          type: 'book',
          name: 'A Bigger Book',
          creator: { name: 'David Hockney' },
        }}
      />,
    );
    expect(screen.getByText('A Bigger Book')).toBeInTheDocument();
    expect(screen.queryByText(/, \d{4}/)).not.toBeInTheDocument();
  });

  it('renders the creator as a link when creator.url is set', () => {
    render(
      <WorkReferent
        referent={{
          type: 'music-composition',
          name: 'Cello Suite No. 1',
          creator: { name: 'Johann Sebastian Bach', url: 'https://example.com/bach' },
        }}
      />,
    );
    const link = screen.getByRole('link', { name: 'Johann Sebastian Bach' });
    expect(link).toHaveAttribute('href', 'https://example.com/bach');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders the referent name as a link when referent.url is set', () => {
    render(
      <WorkReferent
        referent={{
          type: 'visual-artwork',
          name: 'Stoclet Frieze',
          creator: { name: 'Gustav Klimt' },
          url: 'https://example.com/stoclet',
        }}
      />,
    );
    const link = screen.getByRole('link', { name: 'Stoclet Frieze' });
    expect(link).toHaveAttribute('href', 'https://example.com/stoclet');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
