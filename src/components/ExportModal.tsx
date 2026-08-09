import { useState } from 'react';
import { Download, Share2, X, Printer, Loader2 } from 'lucide-react';
import type { Composition } from '@/types';
import { renderToBlob, renderToDataURL } from '@/lib/render';
import { Button } from '@/components/ui/Button';
import { clsx } from '@/lib/utils';

interface Props {
  comp: Composition;
  onClose: () => void;
}

export function ExportModal({ comp, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  const download = async (scale: number, name: string) => {
    setBusy(true);
    try {
      const blob = await renderToBlob(comp, scale);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await renderToBlob(comp, 2);
      const file = new File([blob], 'lovebooth.png', { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Our Love Booth photo' });
      } else {
        // fallback: copy image to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {
      // user cancelled or unsupported — fall back to download
      await download(2, 'lovebooth');
    } finally {
      setBusy(false);
    }
  };

  const printIt = async () => {
    setBusy(true);
    try {
      const url = await renderToDataURL(comp, 2);
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`
        <html><head><title>Print — Love Booth</title>
        <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}img{max-width:100%;max-height:100vh}@media print{img{max-height:90vh}}</style>
        </head><body><img src="${url}" onload="window.focus();window.print()"/></body></html>
      `);
      w.document.close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="soft-in w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-pink-100">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-pink-600">Export your photo</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-pink-100">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 overflow-hidden rounded-2xl ring-1 ring-pink-100">
          <Preview comp={comp} />
        </div>

        <div className="space-y-2.5">
          <Button className="w-full" size="lg" onClick={() => download(2, 'lovebooth-hd')} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Download HD PNG
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="soft" onClick={printIt} disabled={busy}>
              <Printer size={16} /> Print
            </Button>
            <Button variant="soft" onClick={share} disabled={busy}>
              <Share2 size={16} /> {shared ? 'Copied!' : 'Share'}
            </Button>
          </div>
          <button
            onClick={() => download(4, 'lovebooth-print')}
            disabled={busy}
            className={clsx(
              'w-full text-center text-xs font-semibold text-stone-400 hover:text-pink-500',
              busy && 'opacity-40',
            )}
          >
            Download super hi-res (print-ready)
          </button>
        </div>
      </div>
    </div>
  );
}

function Preview({ comp }: { comp: Composition }) {
  const [url, setUrl] = useState<string>('');
  if (!url) {
    renderToDataURL(comp, 1).then(setUrl).catch(() => {});
  }
  return url ? (
    <img src={url} alt="Preview" className="mx-auto max-h-64" />
  ) : (
    <div className="flex h-48 items-center justify-center text-sm text-stone-400">
      <Loader2 className="animate-spin" size={20} />
    </div>
  );
}
