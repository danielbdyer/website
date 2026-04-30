import { cn } from '@/shared/utils/cn';
import { Diamond } from '@/shared/atoms/Diamond/Diamond';

interface OrnamentProps {
  className?: string;
}

export function Ornament({ className }: OrnamentProps) {
  return (
    <div className={cn('my-6 flex items-center gap-2.5', className)}>
      <span className="bg-border h-px flex-1" />
      <Diamond size={5} className="text-text-3 opacity-50" />
      <span className="bg-border h-px flex-1" />
    </div>
  );
}
