import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/utils/cn';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

// Progressive enhancement: content renders visible from the SSR shell so
// no-JS visitors and pre-hydration paint see the prose immediately. After
// hydration, only content below the fold is hidden and animated in when
// it scrolls into view — above-the-fold content stays as it was painted,
// with no flicker waiting on the IntersectionObserver to fire.
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'static' | 'pre-enter' | 'entered'>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Above or at the fold — leave visible. Animating here would mean
    // briefly hiding content the visitor can already see.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

    setPhase('pre-enter');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPhase('entered');
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-[600ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        phase === 'pre-enter'
          ? 'translate-y-[14px] opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
          : 'translate-y-0 opacity-100',
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
