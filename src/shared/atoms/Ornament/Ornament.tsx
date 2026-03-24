import { cn } from '@/shared/utils/cn';
import { Diamond } from '@/shared/atoms/Diamond/Diamond';

interface OrnamentProps {
  className?: string;
}

export function Ornament({ className }: OrnamentProps) {
  return (
    <div className={cn('flex items-center gap-2.5 my-6', className)}>
      <span className="flex-1 h-px bg-[var(--border)]" />
      <Diamond size={5} className="text-[var(--text-3)] opacity-50" />
      <span className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}
