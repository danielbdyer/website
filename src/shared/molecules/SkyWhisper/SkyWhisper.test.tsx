import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { axe } from '@/test/axe';
import type { Bearing } from '@/shared/content/skyWalk';
import { SkyWhisper } from './SkyWhisper';

const BEARINGS: readonly Bearing[] = [
  { axis: 'body', name: 'body', hue: 'warm', to: 'study/spanda', edgeId: 'a|study/spanda|body' },
  { axis: 'language', name: 'language', hue: 'rose', to: null, edgeId: null },
  {
    axis: 'relation',
    name: 'relation',
    hue: 'gold',
    to: 'studio/containers',
    edgeId: 'a|studio/containers|relation',
  },
];

const HERE = { title: 'small weather', group: 'the Garden' };

describe('SkyWhisper molecule', () => {
  test('says where you are: title and group, in second voice', () => {
    render(
      <SkyWhisper place={HERE} bearings={BEARINGS} onBearing={() => {}} onAttend={() => {}} />,
    );
    expect(screen.getByText('small weather')).toBeInTheDocument();
    expect(screen.getByText('the Garden')).toBeInTheDocument();
  });

  test('a place with no group says only its title', () => {
    render(
      <SkyWhisper
        place={{ title: 'a claim stated crisply', group: null }}
        bearings={BEARINGS}
        onBearing={() => {}}
        onAttend={() => {}}
      />,
    );
    expect(screen.getByText('a claim stated crisply')).toBeInTheDocument();
    expect(screen.queryByText('·')).toBeNull();
  });

  test('at the pole it says so', () => {
    render(
      <SkyWhisper place={null} bearings={BEARINGS} onBearing={() => {}} onAttend={() => {}} />,
    );
    expect(screen.getByText('the polestar')).toBeInTheDocument();
  });

  test('each bearing is a button; one with nowhere to go is disabled', () => {
    render(
      <SkyWhisper place={HERE} bearings={BEARINGS} onBearing={() => {}} onAttend={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /travel along body/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /language: nothing yet/i })).toBeDisabled();
  });

  test('taking a bearing reports the star and the thread; hovering attends its axis', async () => {
    const user = userEvent.setup();
    const onBearing = vi.fn();
    const onAttend = vi.fn();
    render(
      <SkyWhisper place={HERE} bearings={BEARINGS} onBearing={onBearing} onAttend={onAttend} />,
    );
    const relation = screen.getByRole('button', { name: /travel along relation/i });
    await user.hover(relation);
    expect(onAttend).toHaveBeenCalledWith('relation');
    await user.click(relation);
    expect(onBearing).toHaveBeenCalledWith('studio/containers', 'a|studio/containers|relation');
    await user.unhover(relation);
    expect(onAttend).toHaveBeenLastCalledWith(null);
  });

  test('names the node in concordance and travels to it on click', async () => {
    const user = userEvent.setup();
    const onBearing = vi.fn();
    render(
      <SkyWhisper
        place={HERE}
        bearings={BEARINGS}
        concordant={{ key: 'salon/part', title: 'Arvo Pärt and the room between notes' }}
        onBearing={onBearing}
        onAttend={() => {}}
      />,
    );
    expect(screen.getByText('in concordance')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /arvo pärt/i }));
    expect(onBearing).toHaveBeenCalledWith('salon/part');
  });

  test('is silent about concordance when there is none', () => {
    render(
      <SkyWhisper place={HERE} bearings={BEARINGS} onBearing={() => {}} onAttend={() => {}} />,
    );
    expect(screen.queryByText('in concordance')).toBeNull();
  });

  test('has no axe-detectable violations', async () => {
    const { container } = render(
      <SkyWhisper
        place={HERE}
        bearings={BEARINGS}
        concordant={{ key: 'salon/part', title: 'Arvo Pärt' }}
        onBearing={() => {}}
        onAttend={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  test('a place with no page of its own reads its summary', () => {
    render(
      <SkyWhisper
        place={{
          title: 'the body decides',
          group: 'claims',
          summary: 'The body decides before the mind names it.',
        }}
        bearings={BEARINGS}
        onBearing={() => {}}
        onAttend={() => {}}
      />,
    );
    expect(screen.getByText('The body decides before the mind names it.')).toBeInTheDocument();
  });
});
