import { useEffect, useState } from 'react';
import type { AlbumPage } from '@/types';
import { renderToDataURL } from '@/lib/render';
import { X, Download, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  page: AlbumPage;
  onClose: () => void;
  onExport: (page: AlbumPage) => void;
}

export function PageViewer({ page, onClose, onExport }: Props) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    renderToDataURL(page.composition, 1).then(setUrl).catch(() => {});
  }, [page]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="soft-in flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-pink-100 px-5 py-3">
          <h3 className="font-script text-2xl text-stone-700">{page.title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-pink-100">
            <X size={18} />
          </button>
        </div>
        <div className="flex justify-center overflow-y-auto bg-cream-100 p-5">
          {url ? (
            <img src={url} alt={page.title} className="max-h-[60vh] rounded-lg shadow-lg" />
          ) : (
            <div className="flex h-64 items-center justify-center text-stone-300">Loading…</div>
          )}
        </div>
        <div className="border-t border-pink-100 px-5 py-3">
          {page.section && (
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-pink-500">
              <Tag size={13} /> {page.section}
            </p>
          )}
          <p className="mb-3 flex items-center gap-1.5 text-xs text-stone-400">
            <Calendar size={12} />
            {new Date(page.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <Button className="w-full" onClick={() => onExport(page)}>
            <Download size={16} /> Export this page
          </Button>
        </div>
      </div>
    </div>
  );
}
