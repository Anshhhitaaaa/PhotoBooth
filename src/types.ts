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
  paper: 'cream' | 'rose' | 'mint' | 'sky' | 'lavender' | 'strawberry' | 'midnight' | 'coquette';
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

export type RoomMode = 'couple' | 'friends';

export interface RoomMember {
  id: string; // e.g. 'p1', 'p2', 'p3'
  name: string;
  joinedAt?: number;
}

export interface RoomSessionState {
  active: boolean;
  sessionId: string;
  startedBy: string;
  step: 'layout-picker' | 'camera' | 'counting' | 'review' | 'editor';
  pickedLayout?: LayoutId;
  count?: number | null;
  slotIndex?: number;
  timestamp: number;
}

export interface Room {
  id: string;
  code: string;
  mode: RoomMode;
  partner1_name: string;
  partner2_name: string | null;
  names: string;
  members: RoomMember[];
  active_session?: RoomSessionState | null;
  created_at: string;
}

export interface RoomSnap {
  id: string;
  room_id: string;
  session_id: string;
  sender_name: string;
  sender_id: string;
  slot_index: number;
  photo_data: string;
  created_at: string;
}

export interface LiveCountdownSignal {
  type: 'START_COUNTDOWN' | 'SNAP_SHOT' | 'CANCEL_SESSION';
  sessionId: string;
  initiatedBy: string;
  slotIndex?: number;
  timestamp: number;
}
