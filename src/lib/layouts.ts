import type { LayoutId, BorderId } from '@/types';

export interface LayoutDef {
  id: LayoutId;
  label: string;
  /** max number of photos this layout uses */
  slots: number;
  /** aspect (w/h) of the export canvas */
  aspect: number;
  description: string;
}

export const LAYOUTS: LayoutDef[] = [
  {
    id: 'strip',
    label: 'Photo Strip',
    slots: 4,
    aspect: 0.36,
    description: 'Classic vertical 4-photo strip',
  },
  {
    id: 'polaroid',
    label: 'Polaroid',
    slots: 1,
    aspect: 0.96,
    description: 'Single instant-camera print with caption',
  },
  {
    id: 'grid',
    label: 'Contact Sheet',
    slots: 4,
    aspect: 1.0,
    description: '2×2 grid contact-sheet style',
  },
];

export const layoutById = (id: LayoutId) => LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];

export const BORDERS: { id: BorderId; label: string }[] = [
  { id: 'polaroid', label: 'Polaroid White' },
  { id: 'filmstrip', label: 'Filmstrip' },
  { id: 'scalloped', label: 'Scalloped Edge' },
  { id: 'washi', label: 'Washi Tape' },
];
