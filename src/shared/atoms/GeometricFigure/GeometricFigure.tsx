import { useEffect, useRef } from 'react';
import { cn } from '@/shared/utils/cn';

interface GeometricFigureProps {
  className?: string;
}

// 60-second rotation per INTERACTION_DESIGN.md — meant to teach that
// this is a room you can sit in. The animation pauses when the figure
// is off-screen so a long study session doesn't keep an unseen GPU
// composition alive on every paint frame.
export function GeometricFigure({ className }: GeometricFigureProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      el.style.animationPlayState = entry?.isIntersecting ? 'running' : 'paused';
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 120 120"
      className={cn('h-full w-full animate-[geo-spin_60s_linear_infinite]', className)}
      aria-hidden="true"
    >
      <rect
        x="10"
        y="10"
        width="100"
        height="100"
        rx="2"
        fill="none"
        strokeWidth="0.5"
        stroke="var(--geo-color)"
      />
      <rect
        x="25"
        y="25"
        width="70"
        height="70"
        rx="1"
        fill="none"
        strokeWidth="0.3"
        stroke="var(--geo-color)"
      />
      <line x1="10" y1="10" x2="25" y2="25" strokeWidth="0.3" stroke="var(--geo-color)" />
      <line x1="110" y1="10" x2="95" y2="25" strokeWidth="0.3" stroke="var(--geo-color)" />
      <line x1="10" y1="110" x2="25" y2="95" strokeWidth="0.3" stroke="var(--geo-color)" />
      <line x1="110" y1="110" x2="95" y2="95" strokeWidth="0.3" stroke="var(--geo-color)" />
      <circle cx="60" cy="60" r="20" fill="none" strokeWidth="0.3" stroke="var(--geo-accent)" />
    </svg>
  );
}
