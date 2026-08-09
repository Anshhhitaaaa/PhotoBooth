import type { Composition, FilterId, BorderId, LayoutId, Adjustments } from '@/types';
import { FILTERS, DEFAULT_ADJUSTMENTS } from '@/lib/filters';
import { LAYOUTS, BORDERS } from '@/lib/layouts';
import { clsx } from '@/lib/utils';
import { Sun, Contrast, Droplets, RotateCcw, Type, Palette, Layout, Frame, Sliders, type LucideIcon } from 'lucide-react';

interface Props {
  comp: Composition;
  onChange: (c: Composition) => void;
}

export function ControlPanel({ comp, onChange }: Props) {
  const set = <K extends keyof Composition>(k: K, v: Composition[K]) =>
    onChange({ ...comp, [k]: v });

  const setAdj = (k: keyof Adjustments, v: number) =>
    onChange({ ...comp, adjustments: { ...comp.adjustments, [k]: v } });

  const resetAdj = () => onChange({ ...comp, adjustments: DEFAULT_ADJUSTMENTS });

  return (
    <div className="flex flex-col gap-5">
      {/* Layout */}
      <Section icon={Layout} title="Layout">
        <div className="grid grid-cols-3 gap-2">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => set('layout', l.id as LayoutId)}
              className={clsx(
                'rounded-xl border-2 px-2 py-2 text-center text-xs font-semibold transition-all',
                comp.layout === l.id
                  ? 'border-pink-400 bg-pink-50 text-pink-700'
                  : 'border-stone-200 text-stone-500 hover:border-pink-200',
              )}
            >
              <LayoutThumb id={l.id} />
              {l.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Filter */}
      <Section icon={Palette} title="Filter">
        <div className="grid grid-cols-4 gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => set('filter', f.id as FilterId)}
              className={clsx(
                'rounded-xl border-2 px-1 py-2 text-center text-[11px] font-semibold transition-all',
                comp.filter === f.id
                  ? 'border-pink-400 bg-pink-50 text-pink-700'
                  : 'border-stone-200 text-stone-500 hover:border-pink-200',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Adjustments */}
      <Section icon={Sliders} title="Adjust">
        <div className="space-y-3">
          <SliderRow icon={Sun} label="Brightness" value={comp.adjustments.brightness} min={0.5} max={1.5} step={0.01} onChange={(v) => setAdj('brightness', v)} />
          <SliderRow icon={Contrast} label="Contrast" value={comp.adjustments.contrast} min={0.5} max={1.5} step={0.01} onChange={(v) => setAdj('contrast', v)} />
          <SliderRow icon={Droplets} label="Saturation" value={comp.adjustments.saturate} min={0} max={2} step={0.01} onChange={(v) => setAdj('saturate', v)} />
          <button
            onClick={resetAdj}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-pink-600"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </Section>

      {/* Border */}
      <Section icon={Frame} title="Border">
        <div className="grid grid-cols-2 gap-2">
          {BORDERS.map((b) => (
            <button
              key={b.id}
              onClick={() => set('border', b.id as BorderId)}
              className={clsx(
                'rounded-xl border-2 px-2 py-2 text-xs font-semibold transition-all',
                comp.border === b.id
                  ? 'border-pink-400 bg-pink-50 text-pink-700'
                  : 'border-stone-200 text-stone-500 hover:border-pink-200',
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Paper */}
      <Section icon={Palette} title="Paper">
        <div className="flex gap-2">
          {(['cream', 'rose', 'mint', 'sky'] as const).map((p) => (
            <button
              key={p}
              onClick={() => set('paper', p)}
              className={clsx(
                'h-10 w-10 rounded-full ring-2 transition-all',
                comp.paper === p ? 'ring-pink-500 scale-110' : 'ring-stone-200',
                p === 'cream' && 'bg-[#fffdf9]',
                p === 'rose' && 'bg-[#fff1f3]',
                p === 'mint' && 'bg-[#f0fdf4]',
                p === 'sky' && 'bg-[#f0f9ff]',
              )}
              aria-label={p}
            />
          ))}
        </div>
      </Section>

      {/* Caption & names */}
      <Section icon={Type} title="Text">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">Caption</label>
            <input
              value={comp.caption}
              onChange={(e) => set('caption', e.target.value)}
              placeholder="Write something sweet…"
              maxLength={80}
              className="font-script w-full rounded-xl border-2 border-stone-200 px-3 py-2 text-lg text-stone-700 focus:border-pink-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">Names (for strip header)</label>
            <input
              value={comp.names}
              onChange={(e) => set('names', e.target.value)}
              placeholder="Alex & Sam"
              maxLength={30}
              className="w-full rounded-xl border-2 border-stone-200 px-3 py-2 text-sm text-stone-700 focus:border-pink-400 focus:outline-none"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-pink-100">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-pink-600">
        <Icon size={15} />
        {title}
      </div>
      {children}
    </div>
  );
}

function SliderRow({
  icon: Icon,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
          <Icon size={13} /> {label}
        </span>
        <span className="text-xs tabular-nums text-stone-400">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function LayoutThumb({ id }: { id: LayoutId }) {
  return (
    <div className="mx-auto mb-1 flex h-8 w-6 items-center justify-center">
      {id === 'strip' && (
        <div className="flex h-8 w-5 flex-col gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 rounded-[2px] bg-stone-300" />
          ))}
        </div>
      )}
      {id === 'polaroid' && (
        <div className="h-8 w-7 rounded-sm bg-stone-300 ring-1 ring-stone-400" />
      )}
      {id === 'grid' && (
        <div className="grid h-7 w-7 grid-cols-2 gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-[2px] bg-stone-300" />
          ))}
        </div>
      )}
    </div>
  );
}
