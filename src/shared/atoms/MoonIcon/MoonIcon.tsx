import { cn } from '@/shared/utils/cn';

interface MoonIconProps {
  size?: number;
  className?: string;
}

export function MoonIcon({ size = 14, className }: MoonIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={cn(className)}
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
