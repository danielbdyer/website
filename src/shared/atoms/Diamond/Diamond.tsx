import { cn } from '@/shared/utils/cn';

interface DiamondProps {
  size?: number;
  className?: string;
}

export function Diamond({ size = 6, className }: DiamondProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      className={cn('text-accent transition-colors duration-200', className)}
    >
      <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" />
    </svg>
  );
}
