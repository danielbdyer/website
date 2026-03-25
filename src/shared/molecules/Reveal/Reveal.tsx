import { cn } from '@/shared/utils/cn';
import { useReveal } from '@/shared/hooks/use-reveal';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const [ref, visible] = useReveal();

  return (
    <div
      ref={ref}
      className={cn('reveal', visible && 'revealed', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
