import { useEffect } from 'react';
import type { RefObject } from 'react';

interface NodeLike {
  key: string;
  pos: { x: number; y: number };
}

interface UseConstellationCameraArgs {
  activeKey: string | null;
  nodes: readonly NodeLike[];
  svgRef: RefObject<SVGSVGElement | null>;
  viewboxSize: number;
}

export function useConstellationCamera({ activeKey, nodes, svgRef, viewboxSize }: UseConstellationCameraArgs) {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !activeKey) return;
    const node = nodes.find((candidate) => candidate.key === activeKey);
    if (!node) return;

    const nx = (node.pos.x - viewboxSize / 2) / (viewboxSize / 2);
    const ny = (node.pos.y - viewboxSize / 2) / (viewboxSize / 2);

    svg.style.setProperty('--camera-x', `${-nx * 36}px`);
    svg.style.setProperty('--camera-y', `${-ny * 24}px`);
    svg.style.setProperty('--camera-tilt-x', `${ny * 7}deg`);
    svg.style.setProperty('--camera-tilt-y', `${-nx * 11}deg`);
    svg.style.setProperty('--camera-saturation', `${1.05 + Math.min(0.1, Math.hypot(nx, ny) * 0.08)}`);
  }, [activeKey, nodes, svgRef, viewboxSize]);
}
