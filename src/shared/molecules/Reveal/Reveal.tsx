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
      className={cn(
        'transition-[opacity,transform] duration-[600ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-[14px] opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
