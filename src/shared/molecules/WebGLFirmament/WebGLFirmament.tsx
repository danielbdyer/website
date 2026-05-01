import { useRef } from 'react';
import { useWebGLFirmament } from '@/shared/hooks/useWebGLFirmament';

// The shader-painted atmospheric layer — capability the SVG firmament
// cannot deliver. Continuous procedural noise that breathes (rather
// than feTurbulence's frozen pattern), a cursor-following luminous
// pool of attention, theme-aware tone that crossfades on toggle.
//
// Renders a positioned `<div>` that the hook fills with a `<canvas>`
// when WebGL is available and the visitor's preferences allow. If
// any fallback gate is active (Save-Data, reduced-motion, WebGL
// context creation failure, missing JS), the div stays empty and the
// SVG firmament behind it remains the firmament — the surface is
// still complete.
//
// Composited via `mix-blend-mode: soft-light` so the WebGL paint
// deepens the SVG layer additively rather than replacing it. The
// blend keeps the contribution subtle: the visitor doesn't see "two
// layers"; they see a richer single sky.

interface WebGLFirmamentProps {
  className?: string;
}

export function WebGLFirmament({ className }: WebGLFirmamentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useWebGLFirmament(containerRef);
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={[
        'webgl-firmament pointer-events-none absolute inset-0 mix-blend-soft-light',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
