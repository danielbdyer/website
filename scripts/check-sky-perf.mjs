#!/usr/bin/env node
// Constellation perf probe.
//
// Boots packages/sky's harness (the standalone Vite app that mounts
// `<Constellation />` against a synthetic graph), drives Chromium
// against it for a measurement window, and reports frame interval +
// long-task counts. Exits non-zero when the surface misses its
// frame budget — so this can run in CI as a regression guard.
//
// Defaults probe the `production` fixture (≈16 stars, the density
// observed on the deployed /sky during the perf hunt). Override
// with PROBE_FIXTURE=heavy to stress the surface harder.
//
// Caveat about xvfb: when run inside `xvfb-run` (CI / sandbox),
// Chromium has no GPU acceleration and frame intervals run roughly
// 2–4× worse than on a real desktop. A 24ms frame avg under xvfb
// often corresponds to a 6–8ms frame avg native. Treat the
// threshold breaches as relative regressions, not absolute speed
// numbers, when running under xvfb.
//
// Thresholds are explicit and editable below — they're the floor
// the surface should clear, not aspirations. Tightening them is
// good; loosening them needs a comment explaining why.

import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from '@playwright/test';

// ── Thresholds ────────────────────────────────────────────────────
//
// `frameAvgMs` — the average time between RAF callbacks across
// the measurement window. <16ms means the surface is keeping up
// with a 60Hz display.
//
// `frameP95Ms` — the 95th-percentile frame interval. A surface
// can have a great average and still feel janky if it occasionally
// drops a 50ms frame; p95 catches that.
//
// `longTaskCount` / `longTaskTotalMs` — main-thread blocks ≥50ms
// observed by `PerformanceObserver`. Any long task during the
// rotation animation is a defect; we allow a small budget for
// startup work happening inside the measurement window.

const THRESHOLDS = {
  frameAvgMs: 16,
  frameP95Ms: 24,
  longTaskCount: 2,
  longTaskTotalMs: 200,
};

const HARNESS_PORT = 5180;
const HARNESS_URL = `http://localhost:${String(HARNESS_PORT)}/`;
const MEASURE_WINDOW_MS = 5000;
const FIXTURE = process.env.PROBE_FIXTURE ?? 'production';
const FIXTURE_KEYS = { small: '1', production: '2', heavy: '3', extreme: '4' };

async function main() {
  const harness = await bootHarness();
  let browser;
  try {
    // Wait for vite's "ready" log line — this is more reliable than
    // polling the port, which would happily 200 against a stale
    // dev-server that another developer left running.
    await waitForHarnessReady(harness, 30_000);
    await waitForUrl(HARNESS_URL, 5_000);
    browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const page = await ctx.newPage();
    await page.goto(HARNESS_URL, { waitUntil: 'networkidle' });

    // Switch to the requested fixture via the keyboard shortcut
    // the harness wires (1..4 → small/production/heavy/extreme).
    const key = FIXTURE_KEYS[FIXTURE];
    if (!key) throw new Error(`Unknown fixture "${FIXTURE}"`);
    await page.keyboard.press(key);
    await page.waitForSelector('.constellation-star', { timeout: 5000 });
    // Settle: let the arrival animation + initial layout finish
    // before we start measuring. The arrival CSS class ramps over
    // ~700ms; 1.2s is enough buffer.
    await page.waitForTimeout(1200);

    const stats = await page.evaluate(async (windowMs) => {
      // The harness's PerfOverlay computes the same numbers but
      // we re-run the measurement in-page so the probe is
      // independent of the overlay's flush cadence.
      const samples = [];
      const longTasks = { count: 0, totalMs: 0 };
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks.count += 1;
          longTasks.totalMs += entry.duration;
        }
      });
      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        /* longtask not supported in this UA */
      }

      const start = performance.now();
      let last = start;
      await new Promise((resolve) => {
        function frame(now) {
          samples.push(now - last);
          last = now;
          if (now - start >= windowMs) {
            resolve();
            return;
          }
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
      observer.disconnect();

      const sorted = [...samples].sort((a, b) => a - b);
      const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? avg;
      const stars = document.querySelectorAll('.constellation-star').length;
      const threads = document.querySelectorAll('[data-thread-id]').length;
      return {
        frameAvgMs: avg,
        frameP95Ms: p95,
        longTaskCount: longTasks.count,
        longTaskTotalMs: longTasks.totalMs,
        starCount: stars,
        threadCount: threads,
        sampleCount: samples.length,
      };
    }, MEASURE_WINDOW_MS);

    report(stats);
    const failed = checkThresholds(stats);
    process.exitCode = failed ? 1 : 0;
  } finally {
    await browser?.close();
    // Kill the whole process group so pnpm + the underlying vite
    // both go down. Without the negative pid, only pnpm receives
    // SIGTERM and vite outlives the script.
    try {
      process.kill(-harness.pid, 'SIGTERM');
    } catch {
      /* harness already gone */
    }
  }
}

function bootHarness() {
  // `pnpm --filter @dby/sky harness` boots the dev server; the dev
  // server includes React refresh + sourcemaps so the perf numbers
  // here are slightly worse than a production build. That's the
  // right side of the bias — pass in dev means pass in prod.
  //
  // `detached: true` makes the child a process-group leader, so
  // `process.kill(-pid)` later takes down pnpm AND the underlying
  // vite. Without it, SIGTERM only reaches pnpm and vite leaks.
  const child = spawn('pnpm', ['--filter', '@dby/sky', 'harness'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: new URL('../', import.meta.url).pathname,
    detached: true,
  });
  child.__buffer = '';
  child.stdout?.on('data', (chunk) => {
    const s = String(chunk);
    child.__buffer += s;
    process.stderr.write(`[harness] ${s}`);
  });
  child.stderr?.on('data', (chunk) => {
    const s = String(chunk);
    child.__buffer += s;
    process.stderr.write(`[harness] ${s}`);
  });
  return Promise.resolve(child);
}

async function waitForHarnessReady(child, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (/ready in/i.test(child.__buffer)) return;
    if (/Port \d+ is in use/i.test(child.__buffer)) {
      throw new Error(`Harness port already in use — kill the stale vite before re-running.`);
    }
    if (child.exitCode !== null) {
      throw new Error(`Harness exited early (code ${String(child.exitCode)})`);
    }
    await wait(150);
  }
  throw new Error(`Harness never logged "ready" within ${String(timeoutMs)}ms`);
}

async function waitForUrl(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      /* not up yet */
    }
    await wait(250);
  }
  throw new Error(`Harness did not respond at ${url} within ${String(timeoutMs)}ms`);
}

function report(stats) {
  process.stdout.write('\n');
  process.stdout.write(`Constellation perf probe (fixture=${FIXTURE})\n`);
  process.stdout.write(`  stars:           ${String(stats.starCount)}\n`);
  process.stdout.write(`  threads:         ${String(stats.threadCount)}\n`);
  process.stdout.write(`  samples:         ${String(stats.sampleCount)}\n`);
  process.stdout.write(`  frame avg:       ${stats.frameAvgMs.toFixed(2)}ms\n`);
  process.stdout.write(`  frame p95:       ${stats.frameP95Ms.toFixed(2)}ms\n`);
  process.stdout.write(`  long tasks:      ${String(stats.longTaskCount)}\n`);
  process.stdout.write(`  long-task total: ${stats.longTaskTotalMs.toFixed(0)}ms\n`);
  process.stdout.write('\n');
}

function checkThresholds(stats) {
  const failures = [];
  if (stats.frameAvgMs > THRESHOLDS.frameAvgMs) {
    failures.push(`frameAvgMs ${stats.frameAvgMs.toFixed(2)} > ${String(THRESHOLDS.frameAvgMs)}`);
  }
  if (stats.frameP95Ms > THRESHOLDS.frameP95Ms) {
    failures.push(`frameP95Ms ${stats.frameP95Ms.toFixed(2)} > ${String(THRESHOLDS.frameP95Ms)}`);
  }
  if (stats.longTaskCount > THRESHOLDS.longTaskCount) {
    failures.push(
      `longTaskCount ${String(stats.longTaskCount)} > ${String(THRESHOLDS.longTaskCount)}`,
    );
  }
  if (stats.longTaskTotalMs > THRESHOLDS.longTaskTotalMs) {
    failures.push(
      `longTaskTotalMs ${stats.longTaskTotalMs.toFixed(0)} > ${String(THRESHOLDS.longTaskTotalMs)}`,
    );
  }
  if (failures.length === 0) {
    process.stdout.write('Within thresholds.\n');
    return false;
  }
  process.stdout.write('FAILED:\n');
  for (const f of failures) {
    process.stdout.write(`  - ${f}\n`);
  }
  return true;
}

main().catch((err) => {
  process.stderr.write(`\n${String(err?.stack ?? err)}\n`);
  process.exit(1);
});
