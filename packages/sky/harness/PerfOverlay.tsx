import { useEffect, useRef, useState } from 'react';

// Tiny perf readout for the harness — RAF-driven frame interval
// + PerformanceObserver for long tasks. Renders fixed top-left so
// the constellation underneath is unobstructed.
//
// What we measure:
//   • Frame interval (ms) — exponential moving average across the
//     last ~60 frames. Target <16ms (60fps); >16ms means the surface
//     is missing frames and the visitor will perceive it as stutter.
//   • Long tasks — main-thread blocks ≥50ms surfaced via the
//     PerformanceObserver longtask entry. Counter + total ms over
//     the last second.
//   • Star/thread counts — read from the live DOM, so the readout
//     matches whatever fixture is mounted.

interface PerfStats {
  readonly frameAvgMs: number;
  readonly frameP95Ms: number;
  readonly longTaskCount: number;
  readonly longTaskTotalMs: number;
  readonly starCount: number;
  readonly threadCount: number;
}

const INITIAL_STATS: PerfStats = {
  frameAvgMs: 0,
  frameP95Ms: 0,
  longTaskCount: 0,
  longTaskTotalMs: 0,
  starCount: 0,
  threadCount: 0,
};

export function PerfOverlay() {
  const [stats, setStats] = useState<PerfStats>(INITIAL_STATS);
  // Hot-path mutable refs — not React state on purpose. The RAF
  // loop runs at display refresh; setState every frame would
  // dominate the very thing we're measuring.
  const frameSamples = useRef<number[]>([]);
  const lastFrameTime = useRef<number>(performance.now());
  const longTasks = useRef<{ count: number; totalMs: number }>({
    count: 0,
    totalMs: 0,
  });

  useEffect(() => {
    let rafId = 0;
    let lastFlush = performance.now();

    function frame(now: number) {
      const dt = now - lastFrameTime.current;
      lastFrameTime.current = now;
      const samples = frameSamples.current;
      samples.push(dt);
      if (samples.length > 120) samples.shift();

      // Flush stats to React ~4× per second so the readout updates
      // without dominating the budget we're trying to measure.
      if (now - lastFlush >= 250) {
        const sorted = [...samples].sort((a, b) => a - b);
        const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
        const p95Index = Math.floor(sorted.length * 0.95);
        const p95 = sorted[p95Index] ?? avg;
        const stars = document.querySelectorAll('.constellation-star').length;
        const threads = document.querySelectorAll('[data-thread-id]').length;
        setStats({
          frameAvgMs: avg,
          frameP95Ms: p95,
          longTaskCount: longTasks.current.count,
          longTaskTotalMs: longTasks.current.totalMs,
          starCount: stars,
          threadCount: threads,
        });
        lastFlush = now;
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    let observer: PerformanceObserver | undefined;
    if (typeof PerformanceObserver !== 'undefined') {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks.current.count += 1;
          longTasks.current.totalMs += entry.duration;
        }
      });
      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        observer = undefined;
      }
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, []);

  const avgColor = colorFor(stats.frameAvgMs, 16, 24);
  const p95Color = colorFor(stats.frameP95Ms, 20, 33);

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 1000,
        background: 'rgba(15, 12, 9, 0.85)',
        color: '#ece7df',
        padding: '8px 12px',
        borderRadius: 4,
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        fontSize: 11,
        lineHeight: 1.5,
        minWidth: 180,
        pointerEvents: 'none',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ color: avgColor }}>frame avg: {stats.frameAvgMs.toFixed(1)}ms</div>
      <div style={{ color: p95Color }}>frame p95: {stats.frameP95Ms.toFixed(1)}ms</div>
      <div>
        long tasks: {stats.longTaskCount} ({stats.longTaskTotalMs.toFixed(0)}ms)
      </div>
      <div style={{ marginTop: 4, color: '#a09c92' }}>
        stars: {stats.starCount} · threads: {stats.threadCount}
      </div>
    </div>
  );
}

function colorFor(ms: number, good: number, warn: number): string {
  if (ms < good) return '#7fb069';
  if (ms < warn) return '#e6b35f';
  return '#e07a5f';
}
