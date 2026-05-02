#!/usr/bin/env node
// Sky perf probe. Drives Chromium through the constellation's idle and
// drag phases and reports per-phase frame intervals (avg, p95, max) plus
// long-task counts. Optionally fails non-zero when frames cross a
// threshold so it can sit alongside the other lint targets.
//
// Why this lives next to the e2e perf spec rather than inside it:
// `e2e/sky-performance.spec.ts` measures **long-task delta** under the
// Playwright runner — its honest envelope is "interaction doesn't add
// blocking work beyond baseline." That envelope is robust in headless
// and CI but it's deliberately loose; it can't tell you whether the
// page is at 60fps or 24fps. This probe complements that by recording
// frame intervals directly (rAF deltas) so a developer chasing a
// regression sees the actual frame distribution. It runs as a
// standalone Node script with no test runner — easy to point at any
// URL (PROBE_URL), easy to wire as `pnpm perf:probe` / `:remote`.
//
// Threshold posture: defaults are loose because headless Chromium
// rasterizes on the CPU and produces pessimistic frame intervals. Set
// PROBE_STRICT=1 (or pass --strict) on a real-GPU machine to enforce
// idle p95 ≤ 50ms and drag p95 ≤ 25ms. Both numbers are env-overridable
// (PROBE_IDLE_P95_MAX, PROBE_DRAG_P95_MAX). Without --strict the probe
// reports and exits 0 — a measurement, not a gate.
//
// Wiring:
//   pnpm perf:probe         → probes localhost (defaults to e2e:serve port)
//   pnpm perf:probe:remote  → probes the deployed URL
//   pnpm perf:devserver     → probes against `pnpm dev` on its native port
//
// Spec ground: PERFORMANCE_BUDGET.md §"The Commitment" names INP ≤
// 100ms and TBT ≤ 150ms; this probe surfaces the per-frame work that
// drives both.

import { chromium } from '@playwright/test';

const PROBE_URL = process.env.PROBE_URL ?? 'http://127.0.0.1:4317/sky';
const IDLE_MS = Number(process.env.PROBE_IDLE_MS ?? 2500);
const DRAG_MS = Number(process.env.PROBE_DRAG_MS ?? 2500);
const SETTLE_MS = Number(process.env.PROBE_SETTLE_MS ?? 1800);
const STRICT = process.env.PROBE_STRICT === '1' || process.argv.includes('--strict');
const JSON_OUT = process.argv.includes('--json');
const IDLE_P95_MAX = Number(process.env.PROBE_IDLE_P95_MAX ?? 50);
const DRAG_P95_MAX = Number(process.env.PROBE_DRAG_P95_MAX ?? 25);
const HEADLESS = process.env.PROBE_HEADED !== '1';

// rAF / longtask harness installed in-page. Two phases: 'idle' captures
// the page at rest (firmament shader, CSS rotation, demonstration drift
// if it's still running); 'drag' captures interaction. Frame intervals
// are produced by requestAnimationFrame deltas — that's the real screen
// cadence the visitor sees. Long tasks come from PerformanceObserver
// and are partitioned by the start time of the phase, so a single
// observer covers both phases without restarting.
async function installHarness(page) {
  await page.evaluate(() => {
    const probe = {
      frames: [],
      tasks: [],
      phaseStart: performance.now(),
      lastFrameAt: 0,
      rafId: 0,
      observer: null,
    };
    probe.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        probe.tasks.push({ start: entry.startTime, duration: entry.duration });
      }
    });
    probe.observer.observe({ entryTypes: ['longtask'] });
    function tick(t) {
      if (probe.lastFrameAt > 0) probe.frames.push(t - probe.lastFrameAt);
      probe.lastFrameAt = t;
      probe.rafId = requestAnimationFrame(tick);
    }
    probe.rafId = requestAnimationFrame(tick);
    window.__probe = probe;
  });
}

async function startPhase(page) {
  await page.evaluate(() => {
    const probe = window.__probe;
    probe.frames.length = 0;
    probe.phaseStart = performance.now();
  });
}

async function readPhase(page) {
  return await page.evaluate(() => {
    const probe = window.__probe;
    const tasksInPhase = probe.tasks.filter((t) => t.start >= probe.phaseStart);
    return {
      frames: probe.frames.slice(),
      tasks: tasksInPhase.map((t) => t.duration),
    };
  });
}

function summarize(frames) {
  if (frames.length === 0) {
    return { count: 0, avg: 0, p50: 0, p95: 0, p99: 0, max: 0 };
  }
  const sorted = [...frames].sort((a, b) => a - b);
  const pick = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const total = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avg: total / sorted.length,
    p50: pick(0.5),
    p95: pick(0.95),
    p99: pick(0.99),
    max: sorted[sorted.length - 1],
  };
}

function fmt(n) {
  return `${n.toFixed(1).padStart(6)}ms`;
}

function printRow(label, s) {
  console.log(
    `  ${label.padEnd(8)} n=${String(s.count).padStart(4)}  avg=${fmt(s.avg)}  p50=${fmt(s.p50)}  p95=${fmt(s.p95)}  max=${fmt(s.max)}`,
  );
}

function sum(xs) {
  return xs.reduce((a, b) => a + b, 0);
}

async function main() {
  const browser = await chromium.launch({
    headless: HEADLESS,
    // Respect an externally-supplied browser path so the probe works in
    // sandboxes where Playwright's bundled headless-shell isn't present
    // (e.g. systems that pre-install Chromium under PLAYWRIGHT_BROWSERS_PATH
    // but ship a different version than the one @playwright/test expects).
    // Local dev with `pnpm e2e:install` already done can leave this unset.
    executablePath: process.env.PROBE_CHROME_PATH || undefined,
    args: [
      // Same set the e2e perf spec uses — let the browser produce frames
      // as fast as it can rather than capping at vsync, so the rAF deltas
      // reflect compositor cost rather than display cadence.
      '--disable-frame-rate-limit',
      '--disable-gpu-vsync',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log(`probing ${PROBE_URL}`);
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
  });

  await page.goto(PROBE_URL, { waitUntil: 'load' });
  await page.locator('svg.constellation').waitFor({ timeout: 15_000 });
  // Let the sky-arrival animation and demonstration drift settle before
  // measuring — measuring during the carpet roll-out would conflate
  // first-paint cost with steady-state cost.
  await page.waitForTimeout(SETTLE_MS);

  await installHarness(page);

  // Idle phase: the page at rest. The firmament shader, the slow camera
  // breath, any animation still running — everything that runs without
  // visitor input.
  await startPhase(page);
  await page.waitForTimeout(IDLE_MS);
  const idleData = await readPhase(page);
  const idle = summarize(idleData.frames);
  const idleLong = idleData.tasks;

  // Drag phase: a continuous arc near the center of the constellation.
  // Mirrors the e2e perf spec's gesture so the two surfaces measure the
  // same interaction.
  const box = await page.locator('svg.constellation').boundingBox();
  if (!box) throw new Error('constellation svg has no bounding box');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const radius = Math.min(box.width * 0.18, 200);

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await startPhase(page);
  const steps = 60;
  const stepDelay = Math.max(1, Math.floor(DRAG_MS / steps));
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    await page.mouse.move(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    await page.waitForTimeout(stepDelay);
  }
  const dragData = await readPhase(page);
  await page.mouse.up();
  const drag = summarize(dragData.frames);
  const dragLong = dragData.tasks;

  await browser.close();

  const report = {
    url: PROBE_URL,
    idle: { ...idle, longTasks: idleLong.length, longTaskTotalMs: sum(idleLong) },
    drag: { ...drag, longTasks: dragLong.length, longTaskTotalMs: sum(dragLong) },
    thresholds: { idleP95Max: IDLE_P95_MAX, dragP95Max: DRAG_P95_MAX, strict: STRICT },
    consoleErrors,
  };

  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('');
    console.log('frame intervals (ms):');
    printRow('idle', idle);
    printRow('drag', drag);
    console.log('');
    console.log(
      `long tasks: idle=${idleLong.length} (Σ${sum(idleLong).toFixed(0)}ms)  drag=${dragLong.length} (Σ${sum(dragLong).toFixed(0)}ms)`,
    );
    if (consoleErrors.length > 0) {
      console.log('');
      console.log(`console errors (${consoleErrors.length}):`);
      for (const e of consoleErrors) console.log(`  ${e}`);
    }
  }

  // Strict mode: enforce the thresholds. Without it the probe is a
  // measurement, not a gate — useful in CI / headless where software
  // rasterization makes absolute frame intervals meaningless.
  if (STRICT) {
    const failures = [];
    if (idle.p95 > IDLE_P95_MAX)
      failures.push(`idle p95 ${idle.p95.toFixed(1)}ms > ${IDLE_P95_MAX}ms`);
    if (drag.p95 > DRAG_P95_MAX)
      failures.push(`drag p95 ${drag.p95.toFixed(1)}ms > ${DRAG_P95_MAX}ms`);
    if (consoleErrors.length > 0)
      failures.push(`${consoleErrors.length} console error(s) during probe`);
    if (failures.length > 0) {
      console.error('');
      console.error('FAIL (strict):');
      for (const f of failures) console.error(`  - ${f}`);
      process.exit(1);
    }
    console.log('');
    console.log('OK (strict): all thresholds met');
  }
}

await main().catch((err) => {
  console.error(err);
  process.exit(1);
});
