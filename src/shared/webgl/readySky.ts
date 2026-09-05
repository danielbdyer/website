import { getConstellationGraph } from '@/shared/content/constellation';
import { warmDaystarMagic } from '@/shared/hooks/useDaystarMagic';
import { atmosphereDpr } from '@/shared/hooks/useWebGLFirmament';
import { buildAtmosphericScene } from './atmosphereScene';
import { buildSkyPalette } from './palette';
import { prepareAtmosphere, shouldRenderWebGL } from './warmAtmosphere';

// Make the sky ahead of its mount (hooks/useSkyReadiness.ts): the
// graph, its scene, and the atmosphere prepared for it — context,
// programs, and all — plus the magic's chunk. Fetched lazily itself,
// so the Foyer's own path carries none of this.

export async function readySky(): Promise<void> {
  warmDaystarMagic();
  if (!shouldRenderWebGL()) return;
  const graph = await getConstellationGraph();
  const scene = buildAtmosphericScene(graph);
  const root = document.documentElement;
  const readToken = (token: string) => getComputedStyle(root).getPropertyValue(token);
  const palette = buildSkyPalette(readToken, root.classList.contains('dk'));
  await prepareAtmosphere(scene, palette, atmosphereDpr());
}
