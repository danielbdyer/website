import { useState } from 'react';
import type { FocusEvent, SyntheticEvent } from 'react';

/**
 * Hover/focus state for a list of stars in the constellation.
 *
 * Encapsulates the event-delegation pattern so the consumer doesn't
 * carry the closure over `setActiveKey` and the relatedTarget check
 * inside the render. The handlers are stable per render of the hook
 * (the React Compiler memoizes them); the organism composes the
 * returned values into one parent group.
 *
 * Pattern (consumer side):
 *
 * ```tsx
 * const { activeKey, handleActivate, handleMouseLeave, handleBlur } = useStarHoverState();
 *
 * <g
 *   onMouseOver={handleActivate}
 *   onMouseLeave={handleMouseLeave}
 *   onFocus={handleActivate}
 *   onBlur={handleBlur}
 * >
 *   {nodes.map(({ key }) => (
 *     <g key={key} data-node-key={key}>
 *       <Star ... />
 *     </g>
 *   ))}
 * </g>
 * ```
 *
 * The blur handler's `relatedTarget` check keeps moving focus from
 * one star to another from briefly clearing the active key — care
 * at the seam where state transitions live.
 */
export function useStarHoverState(initialKey: string | null = null) {
  const [activeKey, setActiveKey] = useState<string | null>(initialKey);

  const handleActivate = (e: SyntheticEvent<Element>) => {
    const handle = (e.target as Element).closest<HTMLElement | SVGElement>('[data-node-key]');
    if (!handle) return;
    setActiveKey(handle.dataset.nodeKey ?? null);
  };

  const handleMouseLeave = () => {
    setActiveKey(null);
  };

  const handleBlur = (e: FocusEvent<Element>) => {
    const next = e.relatedTarget;
    if (next?.closest('[data-node-key]')) return;
    setActiveKey(null);
  };

  return { activeKey, handleActivate, handleMouseLeave, handleBlur, setActiveKey };
}
