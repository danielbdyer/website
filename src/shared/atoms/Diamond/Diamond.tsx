import { cn } from '@/shared/utils/cn';

interface DiamondProps {
  size?: number;
  className?: string;
}

export function Diamond({ size = 6, className }: DiamondProps) {
  // Diamond is decorative everywhere it appears — wordmark glyph next to
  // visible "Danny Dyer" text, ornament bullet between hairlines.
  // ACCESSIBILITY.md commits to aria-hidden on decorative SVGs; default
  // to it here so every callsite inherits the right behavior without
  // having to remember.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      className={cn('text-accent transition-colors duration-200', className)}
      aria-hidden="true"
    >
      <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" />
    </svg>
  );
}
