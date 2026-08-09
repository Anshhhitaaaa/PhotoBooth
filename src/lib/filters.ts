import type { FilterId, Adjustments } from '@/types';

interface FilterDef {
  id: FilterId;
  label: string;
  /** CSS filter string applied to the live <video> and to canvas draws */
  css: (a: Adjustments) => string;
}

export const FILTERS: FilterDef[] = [
  {
    id: 'none',
    label: 'Original',
    css: (a) => `brightness(${a.brightness}) contrast(${a.contrast}) saturate(${a.saturate})`,
  },
  {
    id: 'vintage',
    label: 'Vintage Film',
    css: (a) =>
      `sepia(0.35) saturate(${a.saturate * 1.1}) contrast(${a.contrast * 1.05}) brightness(${a.brightness * 0.96}) hue-rotate(-8deg)`,
  },
  {
    id: 'bw',
    label: 'Black & White',
    css: (a) => `grayscale(1) brightness(${a.brightness}) contrast(${a.contrast * 1.1})`,
  },
  {
    id: 'warm',
    label: 'Warm Glow',
    css: (a) =>
      `sepia(0.22) saturate(${a.saturate * 1.25}) brightness(${a.brightness * 1.05}) contrast(${a.contrast}) hue-rotate(-12deg)`,
  },
  {
    id: 'dreamy',
    label: 'Dreamy Soft',
    css: (a) =>
      `saturate(${a.saturate * 1.15}) brightness(${a.brightness * 1.08}) contrast(${a.contrast * 0.92}) blur(0.4px)`,
  },
  {
    id: 'sepia',
    label: 'Sepia',
    css: (a) => `sepia(0.85) brightness(${a.brightness}) contrast(${a.contrast})`,
  },
  {
    id: 'polaroid',
    label: 'Polaroid Fade',
    css: (a) =>
      `saturate(${a.saturate * 0.92}) brightness(${a.brightness * 1.06}) contrast(${a.contrast * 0.95}) sepia(0.18)`,
  },
];

export const filterById = (id: FilterId) => FILTERS.find((f) => f.id === id) ?? FILTERS[0];

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 1,
  contrast: 1,
  saturate: 1,
};
