import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createMemoryHistory,
} from '@tanstack/react-router';
import { Constellation } from '@dby/sky';
import type { ConstellationGraph } from '@dby/sky';

import { buildHarnessGraph, productionScaleGraph, heavyGraph } from './fixtures';
import { PerfOverlay } from './PerfOverlay';

// The host's tokens.css carries the custom properties the
// constellation reads (umber palette, hue values, motion
// preferences). The harness pulls it in directly so the surface
// matches production paint.
import '../../../src/styles/tokens.css';

type FixtureKey = 'small' | 'production' | 'heavy' | 'extreme';

const FIXTURES: Readonly<Record<FixtureKey, ConstellationGraph>> = {
  small: buildHarnessGraph(6),
  production: productionScaleGraph,
  heavy: heavyGraph,
  extreme: buildHarnessGraph(80),
};

function HarnessApp() {
  const [fixtureKey, setFixtureKey] = useState<FixtureKey>('production');

  // Number keys 1..4 swap fixtures so a contributor can scrub
  // through density without reloading.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, FixtureKey> = {
        '1': 'small',
        '2': 'production',
        '3': 'heavy',
        '4': 'extreme',
      };
      const next = map[e.key];
      if (next) setFixtureKey(next);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const graph = FIXTURES[fixtureKey];

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      <Constellation graph={graph} fullViewport className="h-full w-full" />
      <PerfOverlay />
      <FixtureSwitch current={fixtureKey} onChange={setFixtureKey} />
    </div>
  );
}

function FixtureSwitch(props: {
  readonly current: FixtureKey;
  readonly onChange: (k: FixtureKey) => void;
}) {
  const items: readonly FixtureKey[] = ['small', 'production', 'heavy', 'extreme'];
  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 1000,
        background: 'rgba(15, 12, 9, 0.85)',
        color: '#ece7df',
        padding: '6px 8px',
        borderRadius: 4,
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        fontSize: 11,
        display: 'flex',
        gap: 4,
      }}
    >
      {items.map((k, i) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            props.onChange(k);
          }}
          style={{
            padding: '2px 6px',
            background: props.current === k ? '#4a3f33' : 'transparent',
            color: '#ece7df',
            border: '1px solid #3a3025',
            borderRadius: 2,
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          {String(i + 1)} · {k}
        </button>
      ))}
    </div>
  );
}

// Mount inside an in-memory TanStack Router so Constellation's
// `<Link>` and `useMatch` calls have a context to bind to. The
// harness does not exercise actual route navigation; the router
// is purely the context the surface expects.
const rootRoute = createRootRoute({ component: HarnessApp });
const router = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory({ initialEntries: ['/'] }),
});

const container = document.querySelector('#root');
if (!container) throw new Error('harness #root missing');

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
