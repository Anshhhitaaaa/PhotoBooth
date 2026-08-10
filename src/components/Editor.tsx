import { useState, useEffect } from 'react';
import type { Composition, LayoutId, Sticker as StickerType } from '@/types';
import { layoutById } from '@/lib/layouts';
import { StickerCanvas } from '@/components/StickerCanvas';
import { ControlPanel } from '@/components/ControlPanel';
import { StickerDrawer } from '@/components/StickerDrawer';
import { Photobooth } from '@/components/Photobooth';
import { renderToDataURL } from '@/lib/render';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Sticker, Camera, Check } from 'lucide-react';

interface Props {
  initial?: Composition;
  initialLayout?: LayoutId;
  names?: string;
  onSave: (title: string, section: string, comp: Composition) => void;
  onBack: () => void;
}

type Stage = 'capture' | 'edit';

function makeComp(defaultNames: string = ''): Composition {
  return {
    layout: 'strip',
    photos: [],
    filter: 'none',
    adjustments: { brightness: 1, contrast: 1, saturate: 1 },
    border: 'polaroid',
    stickers: [],
    caption: '',
    names: defaultNames,
    paper: 'cream',
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

export function Editor({ initial, initialLayout, names, onSave, onBack }: Props) {
  const [comp, setComp] = useState<Composition>(() => {
    const base = initial ?? makeComp(names ?? '');
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

  useEffect(() => {
    if (comp.photos.length > layout.slots) {
      setComp({ ...comp, photos: comp.photos.slice(0, layout.slots) });
    }
  }, [comp.layout]); // eslint-disable-line

  const addSticker = (glyph: string) => {
    const newS: StickerType = {
      id: Math.random().toString(36).slice(2),
      glyph,
      x: 360 + (Math.random() - 0.5) * 100,
      y: 360 + (Math.random() - 0.5) * 100,
      size: 48,
      rotation: (Math.random() - 0.5) * 0.5,
      behind: false,
    };
    setComp({ ...comp, stickers: [...comp.stickers, newS] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const thumb = await renderToDataURL(comp, 0.5);
      const compWithThumb = { ...comp };
      onSave(title || 'Untitled memory', section, compWithThumb);
      void thumb;
    } finally {
      setSaving(false);
    }
  };

  const previewScale = typeof window !== 'undefined' && window.innerWidth < 640 ? 0.65 : 0.85;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fdfbf7] text-[#5c4a52]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-pink-100/60 bg-[#fdfbf7]/85 px-4 py-3 backdrop-blur">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-semibold text-[#5c4a52] hover:text-[#ff4d79] transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h2 className="font-script text-2xl font-bold text-[#ff4d79]">
          {stage === 'capture' ? 'Capture Booth' : 'Decoration Studio'}
        </h2>
        <div className="flex gap-2">
          {stage === 'edit' && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#ffeef4] text-[#ff4d79] px-4 py-1.5 text-xs font-bold transition-all hover:bg-pink-100"
            >
              <Sticker size={15} /> Stickers & Emojis
            </button>
          )}
        </div>
      </div>

      {stage === 'capture' && (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8 soft-in">
            <div className="mb-6 text-center">
              <h1 className="font-serif text-3xl font-bold text-[#2b1820]">Let's take some photos</h1>
              <p className="mt-1 text-sm text-[#7c6670]">
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
              <div className="rounded-2xl bg-white p-4 ring-1 ring-pink-100 shadow-sm">
                <p className="mb-2 text-xs font-bold text-[#ff4d79]">Quick filter (live preview)</p>
                <div className="flex flex-wrap gap-2">
                  {['none', 'vintage', 'warm', 'dreamy', 'bw', 'sepia'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setComp({ ...comp, filter: f as Composition['filter'] })}
                      className={
                        'rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all ' +
                        (comp.filter === f
                          ? 'bg-[#ff4d79] text-white shadow-sm'
                          : 'bg-[#ffeef4] text-[#ff4d79] hover:bg-pink-100')
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
          <div className="flex-1 overflow-y-auto bg-[#fdfbf7] px-6 py-6">
            <div className="flex flex-col items-center gap-4">
              {comp.photos.length === 0 && (
                <div className="rounded-2xl bg-white px-4 py-2 text-center text-sm text-[#8c7680] ring-1 ring-pink-100 shadow-sm">
                  No photos yet — add stickers or go back to capture
                </div>
              )}
              <StickerCanvas composition={comp} onChange={setComp} previewScale={previewScale} />
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setStage('capture')}
                  className="flex items-center gap-1.5 rounded-full border-2 border-[#ff4d79] bg-white text-[#ff4d79] font-bold text-xs px-4 py-2 transition-all hover:bg-pink-50"
                >
                  <Camera size={16} /> Retake
                </button>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold text-xs px-5 py-2 shadow-md shadow-pink-200 transition-all hover:scale-105"
                >
                  <Sticker size={16} /> Add stickers
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — scrollable controls panel */}
          <div className="w-80 shrink-0 overflow-y-auto border-l border-pink-100/60 bg-white/70 px-4 py-5 backdrop-blur">
            <ControlPanel comp={comp} onChange={setComp} />

            <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-pink-100 shadow-sm">
              <label className="mb-1 block text-xs font-bold text-[#ff4d79]">Page title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Our First Video Call"
                className="font-script mb-3 w-full rounded-xl border-2 border-pink-100 px-3 py-2 text-xl text-[#2b1820] focus:border-[#ff4d79] focus:outline-none"
              />
              <label className="mb-1 block text-xs font-bold text-[#ff4d79]">Section / theme</label>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Anniversary Week"
                className="mb-3 w-full rounded-xl border-2 border-pink-100 px-3 py-2 text-sm text-[#2b1820] focus:border-[#ff4d79] focus:outline-none"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold py-3 shadow-md shadow-pink-200 transition-all disabled:opacity-50"
              >
                <Save size={18} /> {saving ? 'Saving…' : 'Save to album'}
              </button>
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
