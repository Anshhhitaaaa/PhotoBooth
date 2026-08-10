import { useState } from 'react';
import type { AlbumPage } from '@/types';
import { renderToDataURL } from '@/lib/render';
import { Trash2, BookOpen, Plus, Calendar, Heart } from 'lucide-react';
import { clsx } from '@/lib/utils';

interface Props {
  pages: AlbumPage[];
  onDelete: (id: string) => void;
  onNew: () => void;
  onView: (page: AlbumPage) => void;
}

export function AlbumView({ pages, onDelete, onNew, onView }: Props) {
  if (pages.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ffeef4] text-[#ff4d79]">
          <Heart size={36} className="fill-[#ff4d79]" />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#2b1820]">Your shared album is empty</h2>
          <p className="mt-2 text-sm text-[#7c6670] max-w-sm">
            Take your first split-screen photobooth strip with your partner or friends to start building your memory scrapbook!
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold text-base px-8 py-3.5 shadow-lg shadow-pink-200 transition-all hover:scale-105"
        >
          <Plus size={20} /> Start a Photobooth
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 bg-[#fdfbf7] text-[#5c4a52]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#2b1820]">Our Album Scrapbook</h2>
          <p className="font-script text-xl text-[#ff4d79] mt-0.5">Captured split-screen moments & shared memories</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white text-xs font-bold px-5 py-2.5 shadow-md shadow-pink-200 transition-all hover:scale-105"
        >
          <Plus size={16} /> New Photobooth
        </button>
      </div>

      {/* MASONRY BENTO GRID LAYOUT FOR VARIED STRIP AND POLAROID HEIGHTS */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {pages.map((p, idx) => (
          <div key={p.id} className="break-inside-avoid">
            <AlbumCard page={p} index={idx} onDelete={onDelete} onView={onView} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AlbumCard({
  page,
  index,
  onDelete,
  onView,
}: {
  page: AlbumPage;
  index: number;
  onDelete: (id: string) => void;
  onView: (page: AlbumPage) => void;
}) {
  const [url, setUrl] = useState<string>('');
  if (!url) {
    renderToDataURL(page.composition, 0.5).then(setUrl).catch(() => {});
  }
  const paperBg = {
    cream: 'bg-[#fffdf9]',
    rose: 'bg-[#fff1f3]',
    mint: 'bg-[#f0fdf4]',
    sky: 'bg-[#f0f9ff]',
  }[page.paper];

  return (
    <div
      className={clsx(
        'page-in group relative rounded-3xl p-4 shadow-lg ring-1 ring-pink-100 transition-all hover:shadow-xl hover:scale-[1.01]',
        paperBg
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button onClick={() => onView(page)} className="block w-full text-left">
        <div className="overflow-hidden rounded-2xl ring-1 ring-stone-200/60 bg-white/50">
          {url ? (
            <img src={url} alt={page.title} className="w-full object-contain" />
          ) : (
            <div className="flex min-h-[220px] items-center justify-center text-stone-300">
              <BookOpen size={28} />
            </div>
          )}
        </div>
        <div className="mt-3">
          <h3 className="font-script text-2xl text-[#2b1820]">{page.title || 'Untitled memory'}</h3>
          {page.section && (
            <p className="text-xs font-bold text-[#ff4d79]">{page.section}</p>
          )}
          <p className="mt-1 flex items-center gap-1 text-xs text-[#8c7680]">
            <Calendar size={11} />
            {new Date(page.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </button>
      <button
        onClick={() => onDelete(page.id)}
        className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-stone-400 opacity-0 shadow ring-1 ring-pink-100 transition-all hover:text-red-500 group-hover:opacity-100"
        aria-label="Delete page"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
