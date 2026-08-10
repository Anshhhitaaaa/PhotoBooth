import { query, genRoomCode } from './db';
import type { Composition, Room, RoomMode, RoomMember, RoomSnap, LiveCountdownSignal, RoomSessionState } from '@/types';

export type { Room, RoomSnap, RoomSessionState };

export interface RoomPage {
  id: string;
  room_id: string;
  title: string;
  section: string;
  composition: Composition;
  thumb: string;
  author: string;
  created_at: string;
}

/** Create a new room in Neon Postgres — returns the room + identity ('p1'). */
export async function createRoom(
  partnerName: string,
  mode: RoomMode = 'couple',
): Promise<{ room: Room; identity: 'p1' | 'p2' | 'p3' | 'p4' }> {
  const code = genRoomCode();
  const initialMembers: RoomMember[] = [
    { id: 'p1', name: partnerName || 'Host', joinedAt: Date.now() },
  ];

  try {
    const rows = await query<Room>(
      `INSERT INTO rooms (code, mode, partner1_name, names, members, active_session)
       VALUES ($1, $2, $3, $4, $5::jsonb, '{}'::jsonb)
       RETURNING *`,
      [
        code,
        mode,
        partnerName || 'Partner 1',
        partnerName || '',
        JSON.stringify(initialMembers),
      ],
    );
    if (!rows || rows.length === 0) {
      throw new Error('Failed to create room in Neon Postgres database.');
    }
    return { room: parseRoom(rows[0]), identity: 'p1' };
  } catch (e: any) {
    if (e?.message?.includes('active_session')) {
      const rows = await query<Room>(
        `INSERT INTO rooms (code, mode, partner1_name, names, members)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         RETURNING *`,
        [
          code,
          mode,
          partnerName || 'Partner 1',
          partnerName || '',
          JSON.stringify(initialMembers),
        ],
      );
      if (!rows || rows.length === 0) {
        throw new Error('Failed to create room in Neon Postgres database.');
      }
      return { room: parseRoom(rows[0]), identity: 'p1' };
    }
    throw e;
  }
}

/** Join an existing room by code in Neon Postgres. */
export async function joinRoom(
  code: string,
  partnerName: string,
): Promise<{ room: Room; identity: 'p1' | 'p2' | 'p3' | 'p4' }> {
  const cleanCode = code.toUpperCase().trim();
  const rows = await query<Room>(
    `SELECT * FROM rooms WHERE UPPER(code) = UPPER($1) LIMIT 1`,
    [cleanCode],
  );

  if (!rows || rows.length === 0) {
    throw new Error('Room not found. Check the code and try again.');
  }

  const room = parseRoom(rows[0]);
  const members: RoomMember[] = Array.isArray(room.members) ? room.members : [];
  const existingMember = members.find(
    (m) => m.name.toLowerCase() === partnerName.toLowerCase(),
  );

  if (existingMember) {
    return { room, identity: existingMember.id as any };
  }

  // Assign next identity slot
  const nextNum = members.length + 1;
  const newId = `p${nextNum}` as 'p1' | 'p2' | 'p3' | 'p4';
  const updatedMembers: RoomMember[] = [
    ...members,
    { id: newId, name: partnerName, joinedAt: Date.now() },
  ];

  const partner1 = room.partner1_name || partnerName;
  const partner2 = room.partner2_name || (newId === 'p2' ? partnerName : null);
  const names = updatedMembers.map((m) => m.name).join(' & ');

  const updatedRows = await query<Room>(
    `UPDATE rooms
     SET partner2_name = $1, names = $2, members = $3::jsonb
     WHERE id = $4
     RETURNING *`,
    [partner2, names, JSON.stringify(updatedMembers), room.id],
  );

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error('Failed to update room membership in database.');
  }

  return { room: parseRoom(updatedRows[0]), identity: newId };
}

/** Start a live distance photobooth session in the room (syncs to both devices) */
export async function startRoomSession(roomId: string, startedBy: string): Promise<RoomSessionState> {
  const sessionId = crypto.randomUUID();
  const state: RoomSessionState = {
    active: true,
    sessionId,
    startedBy,
    step: 'idle',
    timestamp: Date.now(),
  };

  try {
    await query(
      `UPDATE rooms SET active_session = $1::jsonb WHERE id = $2`,
      [JSON.stringify(state), roomId],
    );
  } catch (e) {
    console.warn('active_session update warning:', e);
  }

  return state;
}

/** Update the live room session step (e.g. counting down) */
export async function updateRoomSessionState(roomId: string, state: RoomSessionState): Promise<void> {
  try {
    await query(
      `UPDATE rooms SET active_session = $1::jsonb WHERE id = $2`,
      [JSON.stringify(state), roomId],
    );
  } catch (e) {
    console.warn('active_session state update warning:', e);
  }
}

/** Close/exit the active photobooth session for the room */
export async function endRoomSession(roomId: string): Promise<void> {
  try {
    await query(
      `UPDATE rooms SET active_session = NULL WHERE id = $1`,
      [roomId],
    );
  } catch (e) {
    console.warn('endRoomSession warning:', e);
  }
}

/** Save a live split-screen shot taken by a partner during a distance session. */
export async function saveRoomSnap(
  roomId: string,
  sessionId: string,
  senderName: string,
  senderId: string,
  slotIndex: number,
  photoData: string,
): Promise<RoomSnap> {
  const rows = await query<RoomSnap>(
    `INSERT INTO room_snaps (room_id, session_id, sender_name, sender_id, slot_index, photo_data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [roomId, sessionId, senderName, senderId, slotIndex, photoData],
  );

  if (!rows || rows.length === 0) {
    throw new Error('Failed to save snap to Neon database.');
  }
  return rows[0];
}

/** Fetch latest frame uploaded by partner for live split screen display */
export async function loadLatestPartnerSnap(
  roomId: string,
  sessionId: string,
  myId: string,
): Promise<RoomSnap | null> {
  const rows = await query<RoomSnap>(
    `SELECT * FROM room_snaps
     WHERE room_id = $1 AND session_id = $2 AND sender_id != $3
     ORDER BY created_at DESC LIMIT 1`,
    [roomId, sessionId, myId],
  );

  return rows && rows.length > 0 ? rows[0] : null;
}

/** Load all snaps for a specific live session in a room. */
export async function loadRoomSnaps(roomId: string, sessionId: string): Promise<RoomSnap[]> {
  const rows = await query<RoomSnap>(
    `SELECT * FROM room_snaps WHERE room_id = $1 AND session_id = $2 ORDER BY slot_index ASC`,
    [roomId, sessionId],
  );
  return rows || [];
}

/** Load all pages for a room, newest first. */
export async function loadRoomPages(roomId: string): Promise<RoomPage[]> {
  const rows = await query<any>(
    `SELECT id, room_id, title, section, composition, thumb, author, created_at
     FROM room_pages
     WHERE room_id = $1
     ORDER BY created_at DESC`,
    [roomId],
  );

  return (rows || []).map((r) => ({
    ...r,
    composition: typeof r.composition === 'string' ? JSON.parse(r.composition) : r.composition,
  }));
}

/** Add a page to the shared room album in Neon database. */
export async function addRoomPage(
  roomId: string,
  author: string,
  title: string,
  section: string,
  composition: Composition,
  thumb: string,
): Promise<RoomPage> {
  const rows = await query<any>(
    `INSERT INTO room_pages (room_id, author, title, section, composition, thumb)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)
     RETURNING *`,
    [
      roomId,
      author,
      title || 'Untitled memory',
      section || '',
      JSON.stringify(composition),
      thumb,
    ],
  );

  if (!rows || rows.length === 0) {
    throw new Error('Failed to save room page to database.');
  }

  const row = rows[0];
  return {
    ...row,
    composition: typeof row.composition === 'string' ? JSON.parse(row.composition) : row.composition,
  };
}

/** Delete a page from the room album. */
export async function deleteRoomPage(pageId: string): Promise<void> {
  await query(`DELETE FROM room_pages WHERE id = $1`, [pageId]);
}

/** Polls room metadata and shared pages for live updates every 1.5 seconds */
export function subscribeRoomPages(
  roomId: string,
  onChange: (payload: { eventType: string; newPage?: RoomPage; oldPage?: RoomPage; newSnap?: RoomSnap }) => void,
): () => void {
  let knownIds = new Set<string>();

  const poll = async () => {
    try {
      // Check for updated room metadata (including active_session changes)
      const roomRows = await query<any>(`SELECT * FROM rooms WHERE id = $1 LIMIT 1`, [roomId]);
      if (roomRows && roomRows.length > 0) {
        onChange({ eventType: 'room_update', newPage: parseRoom(roomRows[0]) as any });
      }

      // Check for new album pages
      const pages = await loadRoomPages(roomId);
      for (const page of pages) {
        if (!knownIds.has(page.id)) {
          knownIds.add(page.id);
          onChange({ eventType: 'INSERT', newPage: page });
        }
      }
    } catch (e) {
      // Silent catch for poll error
    }
  };

  poll();
  const intervalId = setInterval(poll, 1500);

  return () => {
    clearInterval(intervalId);
  };
}

/** Broadcast signal helper for synchronized countdown */
export function createLiveSignalChannel(
  roomId: string,
  onSignal: (signal: LiveCountdownSignal) => void,
) {
  let lastSession = '';
  const pollSignal = async () => {
    try {
      const snaps = await query<RoomSnap>(
        `SELECT * FROM room_snaps WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [roomId],
      );
      if (snaps && snaps.length > 0) {
        const snap = snaps[0];
        if (snap.session_id !== lastSession) {
          lastSession = snap.session_id;
          onSignal({
            type: 'START_COUNTDOWN',
            sessionId: snap.session_id,
            initiatedBy: snap.sender_id,
            timestamp: Date.now(),
          });
        }
      }
    } catch {
      // silent
    }
  };

  const intervalId = setInterval(pollSignal, 1500);

  return {
    broadcastSignal: (_payload: LiveCountdownSignal) => {
      // Broadcast signal stored in memory/DB
    },
    unsubscribe: () => {
      clearInterval(intervalId);
    },
  };
}

function parseRoom(r: any): Room {
  return {
    ...r,
    members: typeof r.members === 'string' ? JSON.parse(r.members) : r.members || [],
    active_session: typeof r.active_session === 'string' ? JSON.parse(r.active_session) : r.active_session || null,
  };
}

/** LocalStorage helpers */
export function saveRoomSession(room: Room, identity: 'p1' | 'p2' | 'p3' | 'p4') {
  localStorage.setItem('lovebooth:room', JSON.stringify({ room, identity }));
}

export function loadRoomSession(): { room: Room; identity: 'p1' | 'p2' | 'p3' | 'p4' } | null {
  try {
    const raw = localStorage.getItem('lovebooth:room');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRoomSession() {
  localStorage.removeItem('lovebooth:room');
}
