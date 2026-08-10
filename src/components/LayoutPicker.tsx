import { useState } from 'react';
import type { LayoutId } from '@/types';
import { LAYOUTS } from '@/lib/layouts';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Camera, Check } from 'lucide-react';
import { clsx } from '@/lib/utils';

interface Props {
  onPick: (layout: LayoutId) => void;
  onBack: () => void;
  isRoom?: boolean;
}

export function LayoutPicker({ onPick, onBack, isRoom = false }: Props) {
  const [selected, setSelected] = useState<LayoutId>('strip');

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfbf7] text-[#5c4a52] pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-pink-100/60 bg-[#fdfbf7]/80 backdrop-blur">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#5c4a52] hover:text-[#ff4d79] transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="font-script text-3xl font-bold text-[#ff4d79]">Choose Your Layout</h1>
        <div className="w-16" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pt-6">
        <p className="mb-8 max-w-md text-center text-sm text-[#7c6670]">
          Select a frame layout for your photobooth session.{isRoom ? ' Every layout features dual split-screen frames!' : ''}
        </p>

        {/* BENTO MASONRY GRID LAYOUT */}
        <div className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* LEFT COLUMN: TALL PHOTO STRIP (Spans 6 cols, full height) */}
          <button
            type="button"
            onClick={() => setSelected('strip')}
            className={clsx(
              'group relative md:col-span-6 flex flex-col items-center justify-between rounded-3xl bg-white p-6 text-center shadow-lg shadow-pink-100/50 ring-2 transition-all hover:shadow-xl',
              selected === 'strip'
                ? 'ring-[#ff4d79] scale-[1.01] bg-[#ffeef4]/30'
                : 'ring-pink-100 hover:ring-pink-200'
            )}
          >
            {selected === 'strip' && (
              <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#ff4d79] text-white shadow-md">
                <Check size={16} />
              </div>
            )}
            <div className="my-auto flex h-60 items-center justify-center py-2">
              <LayoutPreview id="strip" isRoom={isRoom} />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#2b1820]">Photo Strip</h3>
              <p className="mt-1 text-xs text-[#7c6670]">Classic 4-photo vertical strip layout</p>
              <p className="mt-2 text-xs font-bold text-[#ff4d79]">
                {isRoom ? '4 Dual Split Shots (Tall)' : '4 Solo Shots (Tall)'}
              </p>
            </div>
          </button>

          {/* RIGHT COLUMN: STACKED POLAROID & 2x2 GRID (Spans 6 cols) */}
          <div className="md:col-span-6 flex flex-col gap-5 justify-between">
            {/* Top Right: Polaroid */}
            <button
              type="button"
              onClick={() => setSelected('polaroid')}
              className={clsx(
                'group relative flex-1 flex items-center gap-5 rounded-3xl bg-white p-5 text-left shadow-lg shadow-pink-100/50 ring-2 transition-all hover:shadow-xl',
                selected === 'polaroid'
                  ? 'ring-[#ff4d79] scale-[1.01] bg-[#ffeef4]/30'
                  : 'ring-pink-100 hover:ring-pink-200'
              )}
            >
              {selected === 'polaroid' && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#ff4d79] text-white shadow-md">
                  <Check size={14} />
                </div>
              )}
              <div className="flex h-32 w-28 shrink-0 items-center justify-center">
                <LayoutPreview id="polaroid" isRoom={isRoom} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#2b1820]">Polaroid Snap</h3>
                <p className="mt-1 text-xs text-[#7c6670]">Retro single frame with caption text</p>
                <p className="mt-2 text-xs font-bold text-[#ff4d79]">
                  {isRoom ? '1 Dual Split Shot' : '1 Solo Shot'}
                </p>
              </div>
            </button>

            {/* Bottom Right: 2x2 Grid */}
            <button
              type="button"
              onClick={() => setSelected('grid')}
              className={clsx(
                'group relative flex-1 flex items-center gap-5 rounded-3xl bg-white p-5 text-left shadow-lg shadow-pink-100/50 ring-2 transition-all hover:shadow-xl',
                selected === 'grid'
                  ? 'ring-[#ff4d79] scale-[1.01] bg-[#ffeef4]/30'
                  : 'ring-pink-100 hover:ring-pink-200'
              )}
            >
              {selected === 'grid' && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#ff4d79] text-white shadow-md">
                  <Check size={14} />
                </div>
              )}
              <div className="flex h-32 w-28 shrink-0 items-center justify-center">
                <LayoutPreview id="grid" isRoom={isRoom} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#2b1820]">2x2 Square Grid</h3>
                <p className="mt-1 text-xs text-[#7c6670]">Modern 4-frame grid collage layout</p>
                <p className="mt-2 text-xs font-bold text-[#ff4d79]">
                  {isRoom ? '4 Dual Split Shots (Square Grid)' : '4 Solo Shots (Square Grid)'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-10">
          <button
            onClick={() => onPick(selected)}
            className="flex items-center gap-2 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold text-base px-8 py-3.5 shadow-lg shadow-pink-200 transition-all hover:scale-105"
          >
            <Camera size={20} /> Start Capturing <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LayoutPreview({ id, isRoom }: { id: LayoutId; isRoom?: boolean }) {
  if (id === 'strip') {
    return (
      <div className="flex h-56 w-20 flex-col gap-1.5 rounded-xl bg-white p-2 shadow-md ring-2 ring-pink-200">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 rounded bg-gradient-to-r from-pink-200 via-rose-100 to-pink-300 relative overflow-hidden">
            {isRoom && <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80" />}
          </div>
        ))}
      </div>
    );
  }
  if (id === 'polaroid') {
    return (
      <div className="flex h-28 w-24 flex-col rounded-xl bg-white p-2 shadow-md ring-2 ring-pink-200">
        <div className="flex-1 rounded bg-gradient-to-r from-pink-200 via-rose-100 to-pink-300 relative overflow-hidden">
          {isRoom && <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80" />}
        </div>
        <div className="mt-1.5 h-3 rounded bg-stone-100" />
      </div>
    );
  }
  return (
    <div className="grid h-28 w-24 grid-cols-2 gap-1 rounded-xl bg-white p-1.5 shadow-md ring-2 ring-pink-200">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded bg-gradient-to-r from-pink-200 via-rose-100 to-pink-300 relative overflow-hidden">
          {isRoom && <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80" />}
        </div>
      ))}
    </div>
  );
}
