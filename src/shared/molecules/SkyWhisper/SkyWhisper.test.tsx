import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { axe } from '@/test/axe';
import type { Bearing } from '@/shared/content/skyWalk';
import { SkyWhisper } from './SkyWhisper';

const BEARINGS: readonly Bearing[] = [
  { facet: 'body', hue: 'warm', to: 'study/spanda', edgeId: 'a|study/spanda|body' },
  { facet: 'language', hue: 'rose', to: null, edgeId: null },
  {
    facet: 'relation',
    hue: 'gold',
    to: 'studio/containers',
    edgeId: 'a|studio/containers|relation',
  },
];

const HERE = { title: 'small weather', room: 'the Garden' };

describe('SkyWhisper molecule', () => {
  test('says where you are: title and room, in second voice', () => {
    render(
      <SkyWhisper place={HERE} bearings={BEARINGS} onBearing={() => {}} onAttend={() => {}} />,
    );
    expect(screen.getByText('small weather')).toBeInTheDocument();
    expect(screen.getByText('the Garden')).toBeInTheDocument();
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

  test('taking a bearing reports the star and the thread; hovering attends its facet', async () => {
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

  test('names the work in concordance and travels to it on click', async () => {
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
});
