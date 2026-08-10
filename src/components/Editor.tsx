import { useState, useEffect } from 'react';
import type { Composition, LayoutId } from '@/types';
import { DEFAULT_ADJUSTMENTS } from '@/lib/filters';
import { layoutById } from '@/lib/layouts';
import { renderToDataURL } from '@/lib/render';
import { Photobooth } from '@/components/Photobooth';
import { StickerCanvas } from '@/components/StickerCanvas';
import { ControlPanel } from '@/components/ControlPanel';
import { StickerDrawer } from '@/components/StickerDrawer';
import { Button } from '@/components/ui/Button';
import { Camera, Sticker, Save, ArrowLeft, Download, Sparkles } from 'lucide-react';

interface Props {
  initial?: Composition;
  initialLayout?: LayoutId;
  onSave: (title: string, section: string, comp: Composition) => void;
  onBack: () => void;
  names?: string;
}

type Stage = 'capture' | 'edit';

function makeComp(): Composition {
  return {
    layout: 'strip',
    photos: [],
    filter: 'none',
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    border: 'polaroid',
    stickers: [],
    caption: '',
    names: '',
    paper: 'cream',
    date: new Date().toISOString(),
  };
}

export function Editor({ initial, initialLayout, onSave, onBack, names }: Props) {
  const [comp, setComp] = useState<Composition>(() => {
    const base = initial ?? makeComp();
    if (initialLayout) base.layout = initialLayout;
    if (names && !base.names) base.names = names;
    return base;
  });
  const [stage, setStage] = useState<Stage>(initial ? 'edit' : 'capture');
  const [drawerOpen, setDrawerOpen] = useState(initial ? true : false);
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('');
  const [saving, setSaving] = useState(false);

  const layout = layoutById(comp.layout);

  // If layout changes and we have more photos than slots, trim
  useEffect(() => {
    if (comp.photos.length > layout.slots) {
      setComp({ ...comp, photos: comp.photos.slice(0, layout.slots) });
    }
  }, [comp.layout]); // eslint-disable-line

  const addSticker = (glyph: string) => {
    const w = 720;
    const h = 720 / layout.aspect;
    const sticker = {
      id: crypto.randomUUID(),
      glyph,
      x: w / 2,
      y: h / 2,
      size: 48,
      rotation: 0,
      behind: false,
    };
    setComp({ ...comp, stickers: [...comp.stickers, sticker] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const thumb = await renderToDataURL(comp, 0.5);
      const compWithThumb = { ...comp };
      onSave(title || 'Untitled memory', section, compWithThumb);
      // store thumb separately handled by parent via composition render
      void thumb;
    } finally {
      setSaving(false);
    }
  };

  const previewScale = Math.min(0.62, (typeof window !== 'undefined' ? window.innerWidth : 800) / 1200);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-romance">
      {/* top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-pink-100 bg-cream-100/80 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <h2 className="font-display text-lg text-pink-600">
          {stage === 'capture' ? 'Capture' : 'Decorate'}
        </h2>
        <div className="flex gap-2">
          {stage === 'edit' && (
            <Button size="sm" onClick={() => setDrawerOpen(true)}>
              <Sticker size={15} /> Stickers
            </Button>
          )}
        </div>
      </div>

      {stage === 'capture' && (
        <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 soft-in">
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl text-pink-600">Let's take some photos</h1>
            <p className="mt-1 text-stone-500">
              Hit capture and we'll snap {layout.slots} in a row with a countdown.
            </p>
          </div>
          <Photobooth
            slots={layout.slots}
            filter={comp.filter}
            adjustments={comp.adjustments}
            onComplete={(photos) => {
              setComp({ ...comp, photos });
              setStage('edit');
            }}
            onCancel={onBack}
          />
          <div className="mx-auto mt-6 max-w-md">
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-pink-100">
              <p className="mb-2 text-xs font-bold text-pink-600">Quick filter (live preview)</p>
              <div className="flex flex-wrap gap-2">
                {['none', 'vintage', 'warm', 'dreamy', 'bw', 'sepia'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setComp({ ...comp, filter: f as Composition['filter'] })}
                    className={
                      'rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ' +
                      (comp.filter === f
                        ? 'bg-pink-500 text-white'
                        : 'bg-pink-50 text-pink-600 hover:bg-pink-100')
                    }
                  >
                    {f === 'bw' ? 'B&W' : f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {stage === 'edit' && (
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* LEFT — scrollable photo canvas */}
          <div className="flex-1 overflow-y-auto bg-romance px-6 py-6">
            <div className="flex flex-col items-center gap-4">
              {comp.photos.length === 0 && (
                <div className="rounded-2xl bg-white/70 px-4 py-2 text-center text-sm text-stone-400 ring-1 ring-coral-100">
                  No photos yet — add stickers or go back to capture
                </div>
              )}
              <StickerCanvas composition={comp} onChange={setComp} previewScale={previewScale} />
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="soft" onClick={() => setStage('capture')}>
                  <Camera size={16} /> Retake
                </Button>
                <Button onClick={() => setDrawerOpen(true)}>
                  <Sticker size={16} /> Add stickers
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT — scrollable controls panel */}
          <div className="w-80 shrink-0 overflow-y-auto border-l border-pink-100 bg-cream-100/90 px-4 py-5">
            <ControlPanel comp={comp} onChange={setComp} />

            <div className="mt-4 rounded-2xl bg-white/70 p-4 ring-1 ring-pink-100">
              <label className="mb-1 block text-xs font-bold text-pink-600">Page title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Our First Video Call"
                className="font-script mb-3 w-full rounded-xl border-2 border-stone-200 px-3 py-2 text-lg focus:border-pink-400 focus:outline-none"
              />
              <label className="mb-1 block text-xs font-bold text-pink-600">Section / theme</label>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Anniversary Week"
                className="mb-3 w-full rounded-xl border-2 border-stone-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
              />
              <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
                <Save size={18} /> {saving ? 'Saving…' : 'Save to album'}
              </Button>
            </div>

            <div className="h-8" />
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-40 sm:inset-0 sm:top-0">
          <div className="absolute inset-0 bg-stone-900/30 sm:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 h-[70vh] sm:inset-y-0 sm:right-0 sm:h-full sm:w-96">
            <StickerDrawer onAdd={addSticker} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
