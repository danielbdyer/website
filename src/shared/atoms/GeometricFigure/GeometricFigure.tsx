import { cn } from '@/shared/utils/cn';

interface GeometricFigureProps {
  className?: string;
}

export function GeometricFigure({ className }: GeometricFigureProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('w-full h-full animate-[geo-spin_60s_linear_infinite]', className)}
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
