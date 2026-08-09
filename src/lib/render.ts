import type { Composition, Sticker, BorderId, LayoutId } from '@/types';
import { filterById } from './filters';
import { layoutById } from './layouts';

/** Base export width; height derived from layout aspect. */
const BASE_W = 720;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawScallopedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  scallop: number,
) {
  ctx.beginPath();
  // top
  for (let i = 0; i <= w; i += scallop * 2) {
    ctx.arc(x + i + scallop, y, scallop, Math.PI, 0, false);
  }
  // right
  for (let i = 0; i <= h; i += scallop * 2) {
    ctx.arc(x + w, y + i + scallop, scallop, -Math.PI / 2, Math.PI / 2, false);
  }
  // bottom
  for (let i = w; i >= 0; i -= scallop * 2) {
    ctx.arc(x + i - scallop, y + h, scallop, 0, Math.PI, false);
  }
  // left
  for (let i = h; i >= 0; i -= scallop * 2) {
    ctx.arc(x, y + i - scallop, scallop, Math.PI / 2, -Math.PI / 2, false);
  }
  ctx.closePath();
}

function drawFilmstrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(x, y, w, h);
  // sprocket holes
  ctx.fillStyle = '#fafaf9';
  const holeW = 14;
  const holeH = 8;
  const gap = 16;
  const topY = y + 6;
  const botY = y + h - 6 - holeH;
  for (let sx = x + 10; sx + holeW < x + w - 10; sx += holeW + gap) {
    ctx.fillRect(sx, topY, holeW, holeH);
    ctx.fillRect(sx, botY, holeW, holeH);
  }
}

function drawWashiCorners(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const tape = (tx: number, ty: number, rot: number, color: string) => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.fillRect(-55, -13, 110, 26);
    // pattern lines
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let i = -50; i < 50; i += 12) {
      ctx.beginPath();
      ctx.moveTo(i, -13);
      ctx.lineTo(i + 8, 13);
      ctx.stroke();
    }
    ctx.restore();
  };
  tape(40, 26, -0.35, 'rgba(255, 167, 188, 0.85)');
  tape(0, 0, 0, 'transparent');
  tape(w - 40, 26, 0.35, 'rgba(252, 211, 77, 0.85)');
  tape(40, h - 18, 0.3, 'rgba(186, 230, 253, 0.85)');
  tape(w - 40, h - 18, -0.3, 'rgba(187, 247, 208, 0.85)');
}

/** Draw a single photo into a target rect with object-fit: cover. */
function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  radius = 4,
) {
  const ir = img.width / img.height;
  const tr = dw / dh;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > tr) {
    sh = img.height;
    sw = sh * tr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / tr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.save();
  roundRect(ctx, dx, dy, dw, dh, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

/** Returns the photo slot rects for a given layout within the printable area. */
function photoRects(layout: LayoutId, pw: number, ph: number, border: BorderId) {
  const pad = border === 'polaroid' ? 28 : 18;
  const innerX = pad;
  const innerY = pad;
  const innerW = pw - pad * 2;
  const innerH = ph - pad * 2;
  const gap = 10;
  if (layout === 'strip') {
    const slotH = (innerH - gap * 3) / 4;
    return Array.from({ length: 4 }, (_, i) => ({
      x: innerX,
      y: innerY + i * (slotH + gap),
      w: innerW,
      h: slotH,
    }));
  }
  if (layout === 'grid') {
    const slotW = (innerW - gap) / 2;
    const slotH = (innerH - gap) / 2;
    return [
      { x: innerX, y: innerY, w: slotW, h: slotH },
      { x: innerX + slotW + gap, y: innerY, w: slotW, h: slotH },
      { x: innerX, y: innerY + slotH + gap, w: slotW, h: slotH },
      { x: innerX + slotW + gap, y: innerY + slotH + gap, w: slotW, h: slotH },
    ];
  }
  // polaroid single
  return [{ x: innerX, y: innerY, w: innerW, h: innerH - 56 }];
}

function drawBorder(
  ctx: CanvasRenderingContext2D,
  border: BorderId,
  pw: number,
  ph: number,
) {
  ctx.save();
  if (border === 'polaroid') {
    ctx.fillStyle = '#fffdf9';
    roundRect(ctx, 0, 0, pw, ph, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,113,108,0.12)';
    ctx.lineWidth = 1;
    roundRect(ctx, 0.5, 0.5, pw - 1, ph - 1, 10);
    ctx.stroke();
  } else if (border === 'filmstrip') {
    drawFilmstrip(ctx, 0, 0, pw, ph);
  } else if (border === 'scalloped') {
    ctx.fillStyle = '#fffdf9';
    drawScallopedRect(ctx, 0, 0, pw, ph, 12);
    ctx.fill();
  } else if (border === 'washi') {
    ctx.fillStyle = '#fffdf9';
    roundRect(ctx, 0, 0, pw, ph, 8);
    ctx.fill();
    drawWashiCorners(ctx, pw, ph);
  }
  ctx.restore();
}

function drawSticker(ctx: CanvasRenderingContext2D, s: Sticker, scale: number) {
  ctx.save();
  ctx.translate(s.x * scale, s.y * scale);
  ctx.rotate(s.rotation);
  ctx.font = `${s.size * scale}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (s.color) {
    ctx.fillStyle = s.color;
    ctx.fillText(s.glyph, 0, 0);
  }
  ctx.fillText(s.glyph, 0, 0);
  ctx.restore();
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  caption: string,
  layout: LayoutId,
  pw: number,
  ph: number,
) {
  if (!caption.trim()) return;
  ctx.save();
  ctx.fillStyle = '#57534e';
  const size = layout === 'polaroid' ? 30 : 20;
  ctx.font = `${size}px "Caveat","Segoe UI Emoji",cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = pw / 2;
  const cy = layout === 'polaroid' ? ph - 34 : ph - 14;
  // wrap simply
  ctx.fillText(caption, cx, cy, pw - 40);
  ctx.restore();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  names: string,
  layout: LayoutId,
  pw: number,
  ph: number,
) {
  if (layout === 'strip') {
    ctx.save();
    ctx.fillStyle = '#fffdf9';
    ctx.fillRect(0, 0, pw, 26);
    ctx.fillStyle = '#e11d63';
    ctx.font = `16px "Pacifico",cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${names} ❤ Photobooth`, pw / 2, 14);
    ctx.restore();
  }
}

export interface RenderOptions {
  /** scale factor relative to BASE_W; 1 = screen preview, 2 = hi-res export */
  scale?: number;
  /** when true, draws selection-free image (for export) */
  forExport?: boolean;
}

/** Render a composition to a canvas. Returns the canvas. */
export async function renderComposition(
  canvas: HTMLCanvasElement,
  comp: Composition,
  opts: RenderOptions = {},
): Promise<HTMLCanvasElement> {
  const scale = opts.scale ?? 1;
  const layout = layoutById(comp.layout);
  const pw = Math.round(BASE_W * scale);
  const ph = Math.round((BASE_W / layout.aspect) * scale);
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, pw, ph);

  // background paper
  const paperColors: Record<string, string> = {
    cream: '#fffdf9',
    rose: '#fff1f3',
    mint: '#f0fdf4',
    sky: '#f0f9ff',
  };
  ctx.fillStyle = paperColors[comp.paper] ?? paperColors.cream;
  ctx.fillRect(0, 0, pw, ph);

  drawBorder(ctx, comp.border, pw, ph);

  const rects = photoRects(comp.layout, pw, ph, comp.border);
  const filter = filterById(comp.filter);
  const cssFilter = filter.css(comp.adjustments);
  ctx.save();
  ctx.filter = cssFilter;

  const images = await Promise.all(
    comp.photos.map((p) => loadImage(p).catch(() => null)),
  );
  const validImages = images.filter((i): i is HTMLImageElement => i !== null);
  ctx.restore();

  // behind stickers
  comp.stickers
    .filter((s) => s.behind)
    .forEach((s) => drawSticker(ctx, s, scale));

  // photos
  ctx.save();
  ctx.filter = cssFilter;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const img = validImages[i];
    if (img) {
      drawPhotoCover(ctx, img, r.x, r.y, r.w, r.h, comp.border === 'scalloped' ? 0 : 4);
    } else {
      // empty slot placeholder
      ctx.save();
      ctx.filter = 'none';
      ctx.fillStyle = '#f7e9dc';
      roundRect(ctx, r.x, r.y, r.w, r.h, 4);
      ctx.fill();
      ctx.fillStyle = '#a8a29e';
      ctx.font = `${16 * scale}px "Quicksand",sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Photo ${i + 1}`, r.x + r.w / 2, r.y + r.h / 2);
      ctx.restore();
    }
  }
  ctx.restore();

  // front stickers
  comp.stickers
    .filter((s) => !s.behind)
    .forEach((s) => drawSticker(ctx, s, scale));

  drawCaption(ctx, comp.caption, comp.layout, pw, ph);
  drawHeader(ctx, comp.names, comp.layout, pw, ph);

  return canvas;
}

/** Render to a data URL (PNG). */
export async function renderToDataURL(
  comp: Composition,
  scale = 2,
): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderComposition(canvas, comp, { scale, forExport: true });
  return canvas.toDataURL('image/png');
}

/** Render to a Blob (for download / share). */
export async function renderToBlob(
  comp: Composition,
  scale = 2,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderComposition(canvas, comp, { scale, forExport: true });
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png'),
  );
}
