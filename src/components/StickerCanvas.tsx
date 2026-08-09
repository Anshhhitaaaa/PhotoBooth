import { useRef, useState, useCallback, useEffect } from 'react';
import type { Composition, Sticker as StickerType } from '@/types';
import { renderComposition } from '@/lib/render';
import { layoutById } from '@/lib/layouts';
import { Trash2, Copy, BringToFront, SendToBack, FlipVertical2, type LucideIcon } from 'lucide-react';
import { clsx } from '@/lib/utils';

interface Props {
  composition: Composition;
  onChange: (c: Composition) => void;
  /** scale of the on-screen canvas relative to 720 base */
  previewScale: number;
}

type DragMode =
  | { kind: 'move'; id: string; offsetX: number; offsetY: number }
  | { kind: 'rotate'; id: string; cx: number; cy: number; startAngle: number; startRot: number }
  | { kind: 'resize'; id: string; cx: number; cy: number; startDist: number; startSize: number }
  | null;

const MIN_SIZE = 18;

export function StickerCanvas({ composition, onChange, previewScale }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragRef = useRef<DragMode>(null);
  const [rendering, setRendering] = useState(false);

  const layout = layoutById(composition.layout);

  const draw = useCallback(async () => {
    if (!canvasRef.current) return;
    setRendering(true);
    try {
      await renderComposition(canvasRef.current, composition, { scale: previewScale });
    } finally {
      setRendering(false);
    }
  }, [composition, previewScale]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCanvasPoint = (e: React.PointerEvent | PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    // convert screen px → base 720 coordinate space
    const x = ((e.clientX - rect.left) / rect.width) * 720;
    const y = ((e.clientY - rect.top) / rect.height) * (720 / layout.aspect);
    return { x, y };
  };

  const hitSticker = (x: number, y: number): StickerType | null => {
    // front first
    const front = [...composition.stickers].reverse();
    for (const s of front) {
      const dx = x - s.x;
      const dy = y - s.y;
      const r = s.size * 0.6;
      if (dx * dx + dy * dy <= r * r) return s;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const p = getCanvasPoint(e);
    const hit = hitSticker(p.x, p.y);
    if (hit) {
      setSelectedId(hit.id);
      (e.target as Element).setPointerCapture(e.pointerId);
      if (e.shiftKey) {
        // resize
        dragRef.current = {
          kind: 'resize',
          id: hit.id,
          cx: hit.x,
          cy: hit.y,
          startDist: Math.hypot(p.x - hit.x, p.y - hit.y) || 1,
          startSize: hit.size,
        };
      } else if (e.altKey) {
        // rotate
        dragRef.current = {
          kind: 'rotate',
          id: hit.id,
          cx: hit.x,
          cy: hit.y,
          startAngle: Math.atan2(p.y - hit.y, p.x - hit.x),
          startRot: hit.rotation,
        };
      } else {
        dragRef.current = {
          kind: 'move',
          id: hit.id,
          offsetX: p.x - hit.x,
          offsetY: p.y - hit.y,
        };
      }
    } else {
      setSelectedId(null);
      dragRef.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const p = getCanvasPoint(e);
    const stickers = composition.stickers.map((s) => {
      if (s.id !== drag.id) return s;
      if (drag.kind === 'move') {
        return { ...s, x: p.x - drag.offsetX, y: p.y - drag.offsetY };
      }
      if (drag.kind === 'rotate') {
        const ang = Math.atan2(p.y - drag.cy, p.x - drag.cx);
        return { ...s, rotation: drag.startRot + (ang - drag.startAngle) };
      }
      if (drag.kind === 'resize') {
        const dist = Math.hypot(p.x - drag.cx, p.y - drag.cy);
        const ratio = dist / drag.startDist;
        return { ...s, size: Math.max(MIN_SIZE, drag.startSize * ratio) };
      }
      return s;
    });
    onChange({ ...composition, stickers });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const selected = composition.stickers.find((s) => s.id === selectedId) || null;

  const updateSelected = (patch: Partial<StickerType>) => {
    if (!selectedId) return;
    onChange({
      ...composition,
      stickers: composition.stickers.map((s) =>
        s.id === selectedId ? { ...s, ...patch } : s,
      ),
    });
  };

  const removeSelected = () => {
    if (!selectedId) return;
    onChange({ ...composition, stickers: composition.stickers.filter((s) => s.id !== selectedId) });
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy: StickerType = {
      ...selected,
      id: crypto.randomUUID(),
      x: selected.x + 24,
      y: selected.y + 24,
    };
    onChange({ ...composition, stickers: [...composition.stickers, copy] });
    setSelectedId(copy.id);
  };

  const bringToFront = () => {
    if (!selectedId) return;
    const others = composition.stickers.filter((s) => s.id !== selectedId);
    const sel = composition.stickers.find((s) => s.id === selectedId)!;
    onChange({ ...composition, stickers: [...others, sel] });
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const others = composition.stickers.filter((s) => s.id !== selectedId);
    const sel = composition.stickers.find((s) => s.id === selectedId)!;
    onChange({ ...composition, stickers: [sel, ...others] });
  };

  const toggleBehind = () => {
    if (!selected) return;
    updateSelected({ behind: !selected.behind });
  };

  const canvasW = 720 * previewScale;
  const canvasH = (720 / layout.aspect) * previewScale;
  const baseH = 720 / layout.aspect;

  // selection ring position in screen px
  const selRing =
    selected && wrapRef.current
      ? (() => {
          const rect = wrapRef.current.getBoundingClientRect();
          const scaleX = rect.width / 720;
          const scaleY = rect.height / baseH;
          const sx = selected.x * scaleX;
          const sy = selected.y * scaleY;
          const sr = selected.size * 0.62 * scaleX;
          return { sx, sy, sr };
        })()
      : null;

  const onHandleDown = (e: React.PointerEvent, kind: 'rotate' | 'resize') => {
    e.stopPropagation();
    if (!selected) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = getCanvasPoint(e);
    if (kind === 'resize') {
      dragRef.current = {
        kind: 'resize',
        id: selected.id,
        cx: selected.x,
        cy: selected.y,
        startDist: Math.hypot(p.x - selected.x, p.y - selected.y) || 1,
        startSize: selected.size,
      };
    } else {
      dragRef.current = {
        kind: 'rotate',
        id: selected.id,
        cx: selected.x,
        cy: selected.y,
        startAngle: Math.atan2(p.y - selected.y, p.x - selected.x),
        startRot: selected.rotation,
      };
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wrapRef}
        className="relative shadow-2xl shadow-pink-500/10 ring-1 ring-pink-100 rounded-2xl overflow-hidden"
        style={{ width: canvasW, maxWidth: '100%' }}
      >
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          className="block touch-none cursor-pointer"
          style={{ width: '100%', height: 'auto' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm">
            <span className="text-xs text-pink-500">Rendering…</span>
          </div>
        )}

        {/* selection ring + handles */}
        {selRing && (
          <>
            <div
              className="pointer-events-none absolute rounded-full border-2 border-dashed border-pink-500"
              style={{
                left: selRing.sx - selRing.sr,
                top: selRing.sy - selRing.sr,
                width: selRing.sr * 2,
                height: selRing.sr * 2,
                transform: `rotate(${selected!.rotation}rad)`,
                transformOrigin: 'center',
              }}
            />
            {/* resize handle (bottom-right) */}
            <button
              onPointerDown={(e) => onHandleDown(e, 'resize')}
              className="absolute z-10 h-5 w-5 cursor-se-resize rounded-full border-2 border-white bg-pink-500 shadow-md"
              style={{
                left:
                  selRing.sx +
                  Math.cos(selected!.rotation + Math.PI / 4) * selRing.sr -
                  10,
                top:
                  selRing.sy +
                  Math.sin(selected!.rotation + Math.PI / 4) * selRing.sr -
                  10,
              }}
              aria-label="Resize"
            />
            {/* rotate handle (top) */}
            <button
              onPointerDown={(e) => onHandleDown(e, 'rotate')}
              className="absolute z-10 h-5 w-5 cursor-grab rounded-full border-2 border-white bg-gold-400 shadow-md"
              style={{
                left:
                  selRing.sx + Math.cos(selected!.rotation - Math.PI / 2) * (selRing.sr + 18) - 10,
                top:
                  selRing.sy + Math.sin(selected!.rotation - Math.PI / 2) * (selRing.sr + 18) - 10,
              }}
              aria-label="Rotate"
            />
          </>
        )}
      </div>

      {/* selection toolbar */}
      {selected && (
        <div className="soft-in flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-lg ring-1 ring-pink-100 backdrop-blur">
          <span className="px-2 text-sm text-stone-500">
            Selected <span className="text-lg">{selected.glyph}</span>
          </span>
          <ToolbarBtn onClick={duplicateSelected} icon={Copy} label="Duplicate" />
          <ToolbarBtn onClick={bringToFront} icon={BringToFront} label="Front" />
          <ToolbarBtn onClick={sendToBack} icon={SendToBack} label="Back" />
          <ToolbarBtn
            onClick={toggleBehind}
            icon={FlipVertical2}
            label={selected.behind ? 'Above photo' : 'Behind photo'}
          />
          <ToolbarBtn onClick={removeSelected} icon={Trash2} label="Delete" danger />
          <div className="flex items-center gap-2 pl-2">
            <label className="text-xs text-stone-500">Size</label>
            <input
              type="range"
              min={MIN_SIZE}
              max={160}
              value={selected.size}
              onChange={(e) => updateSelected({ size: Number(e.target.value) })}
              className="w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500">Rotate</label>
            <input
              type="range"
              min={-180}
              max={180}
              value={Math.round((selected.rotation * 180) / Math.PI)}
              onChange={(e) =>
                updateSelected({ rotation: (Number(e.target.value) * Math.PI) / 180 })
              }
              className="w-24"
            />
          </div>
        </div>
      )}
      <p className="text-center text-xs text-stone-400">
        Drag a sticker to move · use the pink dot to resize · gold dot to rotate
      </p>
    </div>
  );
}

function ToolbarBtn({
  onClick,
  icon: Icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
        danger
          ? 'text-red-600 hover:bg-red-100'
          : 'text-stone-600 hover:bg-pink-100',
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
