import { useState } from 'react';
import type { AlbumPage } from '@/types';
import { renderToDataURL } from '@/lib/render';
import { Trash2, BookOpen, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-pink-100">
          <BookOpen className="text-pink-400" size={40} />
        </div>
        <div>
          <h2 className="font-display text-2xl text-pink-600">Your album is empty</h2>
          <p className="mt-1 text-stone-500">
            Take your first photobooth strip and add it here to start your scrapbook.
          </p>
        </div>
        <Button size="lg" onClick={onNew}>
          <Plus size={20} /> Start a photobooth
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-3xl text-pink-600">Our Album</h2>
        <Button size="sm" onClick={onNew}>
          <Plus size={16} /> New page
        </Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((p, idx) => (
          <AlbumCard key={p.id} page={p} index={idx} onDelete={onDelete} onView={onView} />
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
      className={clsx('page-in group relative rounded-2xl p-4 shadow-lg ring-1 ring-pink-100', paperBg)}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button onClick={() => onView(page)} className="block w-full text-left">
        <div className="overflow-hidden rounded-lg ring-1 ring-stone-200/60">
          {url ? (
            <img src={url} alt={page.title} className="w-full" />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center text-stone-300">
              <BookOpen size={28} />
            </div>
          )}
        </div>
        <div className="mt-3">
          <h3 className="font-script text-xl text-stone-700">{page.title || 'Untitled memory'}</h3>
          {page.section && (
            <p className="text-xs font-semibold text-pink-500">{page.section}</p>
          )}
          <p className="mt-1 flex items-center gap-1 text-xs text-stone-400">
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
        className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 text-stone-400 opacity-0 shadow ring-1 ring-pink-100 transition-all hover:text-red-500 group-hover:opacity-100"
        aria-label="Delete page"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
