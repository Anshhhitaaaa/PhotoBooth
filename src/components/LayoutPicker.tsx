import { useState } from 'react';
import type { LayoutId } from '@/types';
import { LAYOUTS } from '@/lib/layouts';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Camera, Check } from 'lucide-react';
import { clsx } from '@/lib/utils';

interface Props {
  onPick: (layout: LayoutId) => void;
  onBack: () => void;
}

export function LayoutPicker({ onPick, onBack }: Props) {
  const [selected, setSelected] = useState<LayoutId>('strip');

  return (
    <div className="flex min-h-screen flex-col bg-romance pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <h1 className="font-display text-xl text-pink-600">Choose Your Layout</h1>
        <div className="w-16" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <p className="mb-8 max-w-md text-center text-sm text-stone-500">
          Select a frame layout for your photobooth session. Every layout features dual split-screen frames!
        </p>

        {/* BENTO MASONRY GRID LAYOUT (Matching exact user drawing) */}
        <div className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* LEFT COLUMN: TALL PHOTO STRIP (Spans 6 cols, full height) */}
          <button
            type="button"
            onClick={() => setSelected('strip')}
            className={clsx(
              'group relative md:col-span-6 flex flex-col items-center justify-between rounded-3xl bg-white/80 p-6 text-center shadow-md ring-2 transition-all hover:shadow-xl',
              selected === 'strip'
                ? 'ring-pink-500 scale-[1.01] bg-pink-50/50'
                : 'ring-pink-100 hover:ring-pink-300'
            )}
          >
            {selected === 'strip' && (
              <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-pink-500 text-white shadow-md">
                <Check size={16} />
              </div>
            )}
            <div className="my-auto flex h-60 items-center justify-center py-2">
              <LayoutPreview id="strip" />
            </div>
            <div>
              <h3 className="font-display text-xl text-pink-600">Photo Strip</h3>
              <p className="mt-1 text-xs text-stone-500">Classic 4-photo vertical strip layout</p>
              <p className="mt-2 text-xs font-bold text-pink-500">4 Dual Split Shots (Tall)</p>
            </div>
          </button>

          {/* RIGHT COLUMN: STACKED POLAROID & 2x2 GRID (Spans 6 cols) */}
          <div className="md:col-span-6 flex flex-col gap-5 justify-between">
            {/* Top Right: Polaroid */}
            <button
              type="button"
              onClick={() => setSelected('polaroid')}
              className={clsx(
                'group relative flex-1 flex items-center gap-5 rounded-3xl bg-white/80 p-5 text-left shadow-md ring-2 transition-all hover:shadow-xl',
                selected === 'polaroid'
                  ? 'ring-pink-500 scale-[1.01] bg-pink-50/50'
                  : 'ring-pink-100 hover:ring-pink-300'
              )}
            >
              {selected === 'polaroid' && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-md">
                  <Check size={14} />
                </div>
              )}
              <div className="flex h-32 w-28 shrink-0 items-center justify-center">
                <LayoutPreview id="polaroid" />
              </div>
              <div>
                <h3 className="font-display text-lg text-pink-600">Polaroid Snap</h3>
                <p className="mt-1 text-xs text-stone-500">Retro single frame with caption text</p>
                <p className="mt-2 text-xs font-bold text-pink-500">1 Dual Split Shot</p>
              </div>
            </button>

            {/* Bottom Right: 2x2 Grid */}
            <button
              type="button"
              onClick={() => setSelected('grid')}
              className={clsx(
                'group relative flex-1 flex items-center gap-5 rounded-3xl bg-white/80 p-5 text-left shadow-md ring-2 transition-all hover:shadow-xl',
                selected === 'grid'
                  ? 'ring-pink-500 scale-[1.01] bg-pink-50/50'
                  : 'ring-pink-100 hover:ring-pink-300'
              )}
            >
              {selected === 'grid' && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white shadow-md">
                  <Check size={14} />
                </div>
              )}
              <div className="flex h-32 w-28 shrink-0 items-center justify-center">
                <LayoutPreview id="grid" />
              </div>
              <div>
                <h3 className="font-display text-lg text-pink-600">2x2 Square Grid</h3>
                <p className="mt-1 text-xs text-stone-500">Modern 4-frame grid collage layout</p>
                <p className="mt-2 text-xs font-bold text-pink-500">4 Dual Split Shots (Square Grid)</p>
              </div>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-10">
          <Button
            size="lg"
            onClick={() => onPick(selected)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg text-base px-8 py-3"
          >
            <Camera size={20} /> Start Capturing <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function LayoutPreview({ id }: { id: LayoutId }) {
  if (id === 'strip') {
    return (
      <div className="flex h-56 w-20 flex-col gap-1.5 rounded-xl bg-white p-2 shadow-md ring-2 ring-pink-200">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 rounded bg-gradient-to-r from-pink-200 via-rose-100 to-pink-300 relative overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80" />
          </div>
        ))}
      </div>
    );
  }
  if (id === 'polaroid') {
    return (
      <div className="flex h-28 w-24 flex-col rounded-xl bg-white p-2 shadow-md ring-2 ring-pink-200">
        <div className="flex-1 rounded bg-gradient-to-r from-pink-200 via-rose-100 to-pink-300 relative overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80" />
        </div>
        <div className="mt-1.5 h-3 rounded bg-stone-100" />
      </div>
    );
  }
  return (
    <div className="grid h-28 w-24 grid-cols-2 gap-1 rounded-xl bg-white p-1.5 shadow-md ring-2 ring-pink-200">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded bg-gradient-to-r from-pink-200 via-rose-100 to-pink-300 relative overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80" />
        </div>
      ))}
    </div>
  );
}
