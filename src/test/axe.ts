import { configureAxe, type JestAxeConfigureOptions } from 'jest-axe';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Shared axe config for component-level accessibility tests.
// Some rules are disabled because they require a real browser (e.g., color
// contrast relies on computed styles that jsdom doesn't fully produce).
// Those are covered by Lighthouse CI against the built site.
const options: JestAxeConfigureOptions = {
  rules: {
    'color-contrast': { enabled: false },
    region: { enabled: false },
  },
};

export const axe = configureAxe(options);
