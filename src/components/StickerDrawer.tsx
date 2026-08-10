import { useState } from 'react';
import { Star, StarOff, X } from 'lucide-react';
import { STICKER_CATEGORIES, ALL_STICKERS } from '@/lib/stickers';
import { loadFavoriteStickers, saveFavoriteStickers } from '@/lib/storage';
import { clsx } from '@/lib/utils';

interface Props {
  onAdd: (glyph: string) => void;
  onClose: () => void;
}

export function StickerDrawer({ onAdd, onClose }: Props) {
  const [active, setActive] = useState<string>(STICKER_CATEGORIES[0].category);
  const [favorites, setFavorites] = useState<string[]>(() => loadFavoriteStickers());
  const [showFav, setShowFav] = useState(false);

  const toggleFav = (g: string) => {
    const next = favorites.includes(g)
      ? favorites.filter((x) => x !== g)
      : [...favorites, g];
    setFavorites(next);
    saveFavoriteStickers(next);
  };

  const glyphs = showFav
    ? favorites
    : STICKER_CATEGORIES.find((c) => c.category === active)?.glyphs ?? [];

  return (
    <div className="soft-in flex h-full w-full flex-col bg-[#fdfbf7]/95 backdrop-blur text-[#5c4a52] shadow-2xl">
      <div className="flex items-center justify-between border-b border-pink-100/60 px-4 py-3">
        <h3 className="font-script text-2xl font-bold text-[#ff4d79]">Stickers & Emojis</h3>
        <button onClick={onClose} className="rounded-full p-1.5 text-[#8c7680] hover:bg-[#ffeef4] hover:text-[#ff4d79]">
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto px-3 py-2.5 no-scrollbar border-b border-pink-100/40">
        <button
          onClick={() => setShowFav(true)}
          className={clsx(
            'flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
            showFav ? 'bg-amber-100 text-amber-600' : 'text-[#7c6670] hover:bg-pink-50',
          )}
        >
          <Star size={12} className="fill-amber-400 text-amber-400" /> Favorites
        </button>
        {STICKER_CATEGORIES.map((c) => (
          <button
            key={c.category}
            onClick={() => {
              setActive(c.category);
              setShowFav(false);
            }}
            className={clsx(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
              !showFav && active === c.category
                ? 'bg-[#ff4d79] text-white shadow-sm'
                : 'text-[#7c6670] hover:bg-[#ffeef4]',
            )}
          >
            {c.category}
          </button>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-6 gap-1 overflow-y-auto p-3 sm:grid-cols-8">
        {glyphs.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-2 py-10 text-[#8c7680]">
            <StarOff size={28} />
            <p className="text-sm">No favorites yet — tap the star on any sticker</p>
          </div>
        )}
        {glyphs.map((g) => (
          <div key={g} className="group relative">
            <button
              onClick={() => onAdd(g)}
              className="flex h-12 w-full items-center justify-center rounded-xl text-2xl transition-all hover:scale-110 hover:bg-[#ffeef4] active:scale-95"
            >
              {g}
            </button>
            <button
              onClick={() => toggleFav(g)}
              className={clsx(
                'absolute right-0 top-0 rounded-full p-0.5 transition-opacity',
                favorites.includes(g)
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100',
              )}
            >
              <Star
                size={11}
                className={favorites.includes(g) ? 'fill-amber-400 text-amber-400' : 'text-stone-400'}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-pink-100/60 p-3">
        <button
          onClick={onClose}
          className="w-full rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold py-2.5 text-sm transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
}
