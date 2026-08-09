import { supabase, genRoomCode } from './supabase';
import type { Composition } from '@/types';

export interface Room {
  id: string;
  code: string;
  partner1_name: string;
  partner2_name: string | null;
  names: string;
  created_at: string;
}

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

/** Create a new room — returns the room + a "you are partner 1" identity. */
export async function createRoom(partnerName: string): Promise<{ room: Room; identity: 'p1' | 'p2' }> {
  const code = genRoomCode();
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      code,
      partner1_name: partnerName || 'Partner 1',
      names: partnerName || '',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { room: data as Room, identity: 'p1' };
}

/** Join an existing room by code. Returns the room + which partner you are. */
export async function joinRoom(
  code: string,
  partnerName: string,
): Promise<{ room: Room; identity: 'p1' | 'p2' }> {
  const { data: room, error } = await supabase
    .from('rooms')
    .select()
    .eq('code', code.toUpperCase().trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!room) throw new Error('Room not found. Check the code and try again.');

  // If partner2 slot is empty and we're not partner1, claim it.
  if (!room.partner2_name && partnerName && partnerName !== room.partner1_name) {
    const names = `${room.partner1_name} & ${partnerName}`;
    const { data: updated, error: ue } = await supabase
      .from('rooms')
      .update({ partner2_name: partnerName, names })
      .eq('id', room.id)
      .select()
      .single();
    if (ue) throw new Error(ue.message);
    return { room: updated as Room, identity: 'p2' };
  }

  // Returning partner2
  if (partnerName === room.partner2_name) {
    return { room: room as Room, identity: 'p2' };
  }
  // Returning partner1
  return { room: room as Room, identity: 'p1' };
}

/** Load all pages for a room, newest first. */
export async function loadRoomPages(roomId: string): Promise<RoomPage[]> {
  const { data, error } = await supabase
    .from('room_pages')
    .select('id, room_id, title, section, composition, thumb, author, created_at')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoomPage[];
}

/** Add a page to the shared room album. */
export async function addRoomPage(
  roomId: string,
  author: string,
  title: string,
  section: string,
  composition: Composition,
  thumb: string,
): Promise<RoomPage> {
  const { data, error } = await supabase
    .from('room_pages')
    .insert({
      room_id: roomId,
      author,
      title: title || 'Untitled memory',
      section: section || '',
      composition: composition as any,
      thumb,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RoomPage;
}

/** Delete a page from the room album. */
export async function deleteRoomPage(pageId: string): Promise<void> {
  const { error } = await supabase.from('room_pages').delete().eq('id', pageId);
  if (error) throw new Error(error.message);
}

/** Subscribe to realtime changes on a room's pages. Returns an unsubscribe fn. */
export function subscribeRoomPages(
  roomId: string,
  onChange: (payload: { eventType: string; newPage?: RoomPage; oldPage?: RoomPage }) => void,
): () => void {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_pages', filter: `room_id=eq.${roomId}` },
      (payload: any) => {
        onChange({
          eventType: payload.eventType,
          newPage: payload.new as RoomPage | undefined,
          oldPage: payload.old as RoomPage | undefined,
        });
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload: any) => {
        // room metadata changed (e.g. partner2 joined)
        onChange({ eventType: 'room_update', newPage: payload.new as any });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Store the current room + identity in localStorage so it survives reloads. */
export function saveRoomSession(room: Room, identity: 'p1' | 'p2') {
  localStorage.setItem('lovebooth:room', JSON.stringify({ room, identity }));
}

export function loadRoomSession(): { room: Room; identity: 'p1' | 'p2' } | null {
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
