import { useState } from 'react';
import type { LayoutId } from '@/types';
import { LAYOUTS } from '@/lib/layouts';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Camera } from 'lucide-react';

interface Props {
  onPick: (layout: LayoutId) => void;
  onBack: () => void;
}

export function LayoutPicker({ onPick, onBack }: Props) {
  const [selected, setSelected] = useState<LayoutId>('strip');

  return (
    <div className="flex min-h-screen flex-col bg-romance">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <h1 className="font-display text-lg text-pink-600">Choose your layout</h1>
        <div className="w-16" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <p className="mb-8 max-w-md text-center text-stone-500">
          Pick a frame style for your photo session. You can change this later, but each layout
          gives you a different vibe.
        </p>

        <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-3">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelected(l.id)}
              className={
                'group relative rounded-3xl bg-white/70 p-6 text-center shadow-sm ring-2 transition-all hover:shadow-lg ' +
                (selected === l.id
                  ? 'ring-pink-400 scale-[1.02]'
                  : 'ring-pink-100 hover:ring-pink-200')
              }
            >
              <div className="mb-4 flex h-40 items-center justify-center">
                <LayoutPreview id={l.id} />
              </div>
              <h3 className="font-display text-lg text-pink-600">{l.label}</h3>
              <p className="mt-1 text-xs text-stone-400">{l.description}</p>
              <p className="mt-2 text-xs font-bold text-pink-400">
                {l.slots} photo{l.slots > 1 ? 's' : ''}
              </p>
              {selected === l.id && (
                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg">
                  <Camera size={14} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-10">
          <Button size="lg" onClick={() => onPick(selected)} className="text-base">
            <Camera size={20} /> Start capturing <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function LayoutPreview({ id }: { id: LayoutId }) {
  if (id === 'strip') {
    return (
      <div className="flex h-36 w-24 flex-col gap-1 rounded-md bg-white p-1.5 shadow-md ring-1 ring-stone-200">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 rounded-sm bg-gradient-to-br from-pink-100 to-pink-200" />
        ))}
      </div>
    );
  }
  if (id === 'polaroid') {
    return (
      <div className="flex h-36 w-32 flex-col rounded-md bg-white p-2 shadow-md ring-1 ring-stone-200">
        <div className="flex-1 rounded-sm bg-gradient-to-br from-pink-100 to-pink-200" />
        <div className="mt-2 h-5 rounded bg-stone-100" />
      </div>
    );
  }
  return (
    <div className="grid h-32 w-32 grid-cols-2 gap-1 rounded-md bg-white p-1.5 shadow-md ring-1 ring-stone-200">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-sm bg-gradient-to-br from-pink-100 to-pink-200" />
      ))}
    </div>
  );
}
