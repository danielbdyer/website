import { useRef } from 'react';
import type { ConstellationGraph } from '@/shared/content/constellation';
import { activeStarIndex, buildAtmosphericScene } from '@/shared/webgl/atmosphereScene';
import { useWebGLFirmament } from '@/shared/hooks/useWebGLFirmament';
import { cn } from '@/shared/utils/cn';

// The shader-painted atmospheric layer — CONSTELLATION_HORIZON.md's
// Layer 1 in its full form. A camera-aware WebGL firmament: the
// pole-anchored sky gradient, the domain-warped watercolor wash,
// the deep micro-starfield, the room quadrants' atmospheres, star
// halos that twinkle beneath their structural anchors, drifting
// motes, the cursor's pool of attention — all projected through
// the same pinhole camera the SVG stars are.
//
// Renders a positioned `<div>` the hook fills with a `<canvas>`
// when WebGL is available and the visitor's preferences allow.
// When the layer goes live, the constellation frame gains
// data-atmosphere="webgl" and the SVG firmament crossfades out;
// on context loss (or any fallback gate) the attribute lifts and
// the SVG firmament is the firmament again. The structural layer
// is never touched — every star stays a real anchor either way.

interface WebGLFirmamentProps {
  graph: ConstellationGraph;
  /** The star whose well currently claims the cursor (or hover /
   *  focus), as `room/slug`. Drives the halo crescendo. */
  activeKey: string | null;
  /** Mirrors the SVG's preserveAspectRatio so the canvas and the
   *  structural layer share one viewbox mapping. */
  fullViewport?: boolean;
  className?: string;
}

export function WebGLFirmament({
  graph,
  activeKey,
  fullViewport = false,
  className,
}: WebGLFirmamentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scene = buildAtmosphericScene(graph);
  useWebGLFirmament(
    containerRef,
    scene,
    activeStarIndex(scene, activeKey),
    fullViewport ? 'cover' : 'contain',
  );
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('webgl-firmament pointer-events-none absolute inset-0', className)}
    />
  );
}
