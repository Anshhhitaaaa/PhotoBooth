import type { AlbumPage } from '@/types';

const KEY = 'lovebooth:album:v1';
const FAV_KEY = 'lovebooth:favstickers:v1';

export function loadAlbum(): AlbumPage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as AlbumPage[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveAlbum(pages: AlbumPage[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(pages));
  } catch {
    // storage may be full with data URLs; fail silently
  }
}

export function loadFavoriteStickers(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return ['❤️', '💕', '✈️', '🌙', '🌸', '🥰'];
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveFavoriteStickers(glyphs: string[]) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(glyphs));
  } catch {
    // ignore
  }
}
