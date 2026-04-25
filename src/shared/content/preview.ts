import type { Work } from './schema';

export const SAMPLE_ROOM_NOTE =
  '[Sample preview entries fill this room until authored works arrive.]';

export const SAMPLE_WORK_NOTE =
  '[Sample preview only. It disappears as soon as this room has authored work.]';

export interface PreviewMeta {
  kind: 'sample';
  roomNote: string;
  workNote: string;
  thumbLabel?: string;
  kicker?: string;
}

export type DisplayWork = Work & {
  preview?: PreviewMeta;
};

export function isPreviewWork(work: DisplayWork): work is DisplayWork & { preview: PreviewMeta } {
  return work.preview?.kind === 'sample';
}
