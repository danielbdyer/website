// The bestiary's painter: one 2D canvas, the whole picture per frame.
//
// The frame (scale/frame.ts) is data — seven strands in stage units,
// where the treadmill stands, how far the page is being left. This
// module owns the writes: fitting the stage to the canvas, the pale
// matte ground, the flat black objects of scale tiling past at the
// true rate, and the straws — a two-tone matte tube with a flat
// shadow on the ground and ribs where it bends. Nothing here decides
// anything; the director and the frame decided. Hot path: the loops
// and in-place canvas state are the runtime under the surface
// (eslint.config.js §"Hot-path exemption"). OBJECTS_OF_SCALE.md
// §"Visual language".

import type { Frame, Strand } from '@/shared/scale/frame';
import { STAGE, type SpeedRecord, type Silhouette } from '@/shared/scale/records';
import { turnAt, type Vec2 } from '@/shared/scale/tubes';

export interface Surface {
  readonly ctx: CanvasRenderingContext2D;
  /** CSS pixels. */
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

/** The stage band: the top part of the surface where things move.
 *  Motion stays inside it and never runs full-bleed. */
export const STAGE_BAND = 0.7;
const MAX_DPR = 2;
/** A straw bent past this, per sample, shows the ribs of its elbow. */
const ELBOW_RAD = 0.22;
const STAGE_COLOR = '#eeebe4';
const INK = '#161616';

/** Size the canvas to its CSS box at the device's pixel ratio (capped)
 *  and hand back a surface to paint on. Null while the canvas has no
 *  box or no 2D context. */
export function fitSurface(canvas: HTMLCanvasElement): Surface | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, MAX_DPR);
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d');
  return ctx ? { ctx, width: rect.width, height: rect.height, dpr } : null;
}

/** How stage units map to the surface: the stage box fits the band by
 *  its shorter side, centered, its floor on the band's floor. */
export interface Fit {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
}

export function fitStage(surface: Surface): Fit {
  const bandHeight = surface.height * STAGE_BAND;
  const scale = Math.min(surface.width / STAGE.width, bandHeight / STAGE.height);
  return {
    scale,
    x: (surface.width - STAGE.width * scale) / 2,
    y: bandHeight - STAGE.height * scale,
  };
}

const shades = new Map<string, string>();

/** The tube's shade: the same hue, about a fifth darker. */
function shadeOf(color: string): string {
  const cached = shades.get(color);
  if (cached) return cached;
  const channel = (i: number): string =>
    Math.round(Number.parseInt(color.slice(1 + i * 2, 3 + i * 2), 16) * 0.8)
      .toString(16)
      .padStart(2, '0');
  const shade = `#${channel(0)}${channel(1)}${channel(2)}`;
  shades.set(color, shade);
  return shade;
}

// ─── The ground and its objects ────────────────────────────────────

function tracePath(ctx: CanvasRenderingContext2D, points: readonly Vec2[]): void {
  ctx.beginPath();
  for (const [i, p] of points.entries()) {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
}

/** A football field seen from the sideline: a baseline the field's
 *  length, a yard line every ten yards, a goalpost at each end. */
function paintField(ctx: CanvasRenderingContext2D, x: number, width: number, ground: number): void {
  ctx.fillRect(x, ground - 3, width, 3);
  const yard = width / 12;
  for (let i = 1; i < 12; i++) {
    ctx.fillRect(x + yard * i - 1, ground - 16, 2, 16);
  }
  for (const post of [x + yard, x + width - yard]) {
    ctx.fillRect(post - 1.5, ground - 56, 3, 56);
    ctx.fillRect(post - 14, ground - 56, 28, 3);
    ctx.fillRect(post - 14, ground - 74, 3, 18);
    ctx.fillRect(post + 11, ground - 74, 3, 18);
  }
}

/** A banana lying on the ground, its ends up. */
function paintBanana(
  ctx: CanvasRenderingContext2D,
  x: number,
  width: number,
  ground: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + width * 0.04, ground - 30);
  ctx.quadraticCurveTo(x + width / 2, ground + 16, x + width * 0.96, ground - 30);
  ctx.quadraticCurveTo(x + width / 2, ground - 8, x + width * 0.04, ground - 30);
  ctx.closePath();
  ctx.fill();
}

type Paint = (ctx: CanvasRenderingContext2D, x: number, w: number, g: number) => void;
const SILHOUETTES: Readonly<Record<Silhouette, Paint>> = { field: paintField, banana: paintBanana };

/** The treadmill: the object of scale tiled end to end along the
 *  ground and slid past at the true rate. The ground line runs the
 *  surface's whole width; each copy sits at its index times the unit
 *  width, less where the treadmill stands. */
function paintTreadmill(surface: Surface, fit: Fit, record: SpeedRecord, treadmill: number): void {
  const { ctx } = surface;
  const width = record.unit.screenWidth * STAGE.width * fit.scale;
  const ground = fit.y + STAGE.ground * fit.scale;
  const paint = SILHOUETTES[record.unit.silhouette];
  ctx.fillStyle = INK;
  ctx.fillRect(0, ground, surface.width, 1.5);
  ctx.save();
  ctx.scale(fit.scale, fit.scale);
  const first = -treadmill * width - width;
  for (let x = first; x < surface.width + width; x += width) {
    paint(ctx, x / fit.scale, width / fit.scale, ground / fit.scale);
  }
  ctx.restore();
}

// ─── The straws ────────────────────────────────────────────────────

/** A strand's shadow, flattened onto the ground at eight percent. */
function paintShadow(ctx: CanvasRenderingContext2D, strand: Strand, ground: number): void {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.translate(0, ground);
  ctx.scale(1, 0.14);
  ctx.translate(0, -ground);
  ctx.strokeStyle = INK;
  ctx.lineWidth = strand.radius * 2;
  tracePath(ctx, strand.points);
  ctx.stroke();
  ctx.restore();
}

/** The ribs of an elbow: short lines across the tube where it bends. */
function paintRibs(ctx: CanvasRenderingContext2D, strand: Strand): void {
  const { points, radius } = strand;
  ctx.strokeStyle = shadeOf(strand.color);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 1; i < points.length - 1; i++) {
    if (turnAt(points, i) < ELBOW_RAD) continue;
    const before = points[i - 1]!;
    const after = points[i + 1]!;
    const here = points[i]!;
    const angle = Math.atan2(after.y - before.y, after.x - before.x) + Math.PI / 2;
    const dx = Math.cos(angle) * radius * 0.92;
    const dy = Math.sin(angle) * radius * 0.92;
    ctx.moveTo(here.x - dx, here.y - dy);
    ctx.lineTo(here.x + dx, here.y + dy);
  }
  ctx.stroke();
}

/** A straw: matte, constant diameter, round caps; a two-tone ramp —
 *  the shade full width, the lit color a little narrower and higher. */
function paintStrand(ctx: CanvasRenderingContext2D, strand: Strand): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  tracePath(ctx, strand.points);
  ctx.strokeStyle = shadeOf(strand.color);
  ctx.lineWidth = strand.radius * 2;
  ctx.stroke();
  ctx.save();
  ctx.translate(0, -strand.radius * 0.24);
  ctx.strokeStyle = strand.color;
  ctx.lineWidth = strand.radius * 1.5;
  ctx.stroke();
  ctx.restore();
  paintRibs(ctx, strand);
}

/** Paint one frame: the stage, the treadmill, then every strand in
 *  its draw order, all within the stage band. */
export function paintFrame(surface: Surface, record: SpeedRecord, frame: Frame): void {
  const { ctx } = surface;
  const fit = fitStage(surface);
  ctx.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0);
  ctx.fillStyle = STAGE_COLOR;
  ctx.fillRect(0, 0, surface.width, surface.height);
  paintTreadmill(surface, fit, record, frame.treadmill);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, surface.width, surface.height * STAGE_BAND);
  ctx.clip();
  ctx.translate(fit.x, fit.y);
  ctx.scale(fit.scale, fit.scale);
  const ordered = frame.strands.toSorted((a, b) => a.z - b.z);
  for (const strand of ordered) paintShadow(ctx, strand, STAGE.ground);
  for (const strand of ordered) paintStrand(ctx, strand);
  ctx.restore();
}
