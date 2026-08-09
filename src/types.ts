export type FilterId =
  | 'none'
  | 'vintage'
  | 'bw'
  | 'warm'
  | 'dreamy'
  | 'sepia'
  | 'polaroid';

export type BorderId = 'polaroid' | 'filmstrip' | 'scalloped' | 'washi';

export type LayoutId = 'strip' | 'polaroid' | 'grid';

export interface Sticker {
  id: string;
  /** emoji glyph used as the sticker */
  glyph: string;
  /** center x in canvas px */
  x: number;
  /** center y in canvas px */
  y: number;
  /** base font size in canvas px */
  size: number;
  /** radians */
  rotation: number;
  /** 0..1, drawn under photos */
  behind: boolean;
  color?: string;
}

export interface Adjustments {
  brightness: number; // 1 = normal
  contrast: number;
  saturate: number;
}

export interface Composition {
  layout: LayoutId;
  /** data URLs of captured photos (up to 4) */
  photos: string[];
  filter: FilterId;
  adjustments: Adjustments;
  border: BorderId;
  stickers: Sticker[];
  caption: string;
  /** couple names for the strip header */
  names: string;
  /** paper theme for the album page */
  paper: 'cream' | 'rose' | 'mint' | 'sky';
  date: string;
}

export interface AlbumPage {
  id: string;
  title: string;
  section: string;
  createdAt: number;
  paper: Composition['paper'];
  /** rendered thumbnail (data URL) */
  thumb: string;
  /** full composition for re-edit / view */
  composition: Composition;
}
