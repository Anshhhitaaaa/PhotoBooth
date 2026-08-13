import { neon } from '@neondatabase/serverless';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const databaseUrl =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  '';

export let supabaseClient: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-supabase')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error('Failed to init Supabase client:', e);
  }
}

/** Returns Neon SQL client instance if Neon URL is provided, otherwise null */
export function getDb() {
  if (databaseUrl && databaseUrl.includes('.neon.tech') && !databaseUrl.includes('your-neon-database-url')) {
    try {
      return neon(databaseUrl);
    } catch (err) {
      console.error('Failed to initialize Neon Postgres client:', err);
      return null;
    }
  }
  return null;
}

/** Execute SQL query using Supabase SDK or Neon driver */
export async function query<T = any>(
  queryString: string,
  params: any[] = [],
): Promise<T[]> {
  const sql = getDb();
  
  // 1. If Neon driver is active (Neon URL provided)
  if (sql) {
    try {
      const result = await sql(queryString, params);
      return (result as T[]) || [];
    } catch (error: any) {
      const errMsg = String(error?.message || error || '');
      if (errMsg.includes('402') || errMsg.includes('quota') || errMsg.includes('Data Transfer')) {
        console.warn('Neon Postgres quota reached.');
        return [];
      }
      console.error('Neon Query Error:', errMsg);
      throw new Error(errMsg);
    }
  }

  // 2. If Supabase client is active
  if (supabaseClient) {
    try {
      return await executeSupabaseQuery<T>(supabaseClient, queryString, params);
    } catch (err: any) {
      console.error('Supabase Query Error:', err);
      return [];
    }
  }

  console.warn('No active DB configured. Operating in local fallback mode.');
  return [];
}

async function executeSupabaseQuery<T>(
  supabase: SupabaseClient,
  sql: string,
  params: any[],
): Promise<T[]> {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');

  // Ignore CREATE TABLE / ALTER TABLE (tables are managed in Supabase SQL Editor)
  if (cleanSql.toUpperCase().startsWith('CREATE TABLE') || cleanSql.toUpperCase().startsWith('ALTER TABLE')) {
    return [];
  }

  // 1. INSERT INTO rooms
  if (cleanSql.includes('INSERT INTO rooms')) {
    const members = typeof params[4] === 'string' ? safeJsonParse(params[4], []) : params[4];
    const active_session = typeof params[5] === 'string' ? safeJsonParse(params[5], {}) : params[5] || {};
    const { data, error } = await supabase.from('rooms').insert({
      code: params[0],
      mode: params[1],
      partner1_name: params[2],
      names: params[3],
      members,
      active_session,
    }).select();
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 2. SELECT * FROM rooms WHERE UPPER(code) = UPPER($1)
  if (cleanSql.includes('FROM rooms') && cleanSql.includes('UPPER(code)')) {
    const { data, error } = await supabase.from('rooms').select('*').ilike('code', params[0]).limit(1);
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 3. SELECT * FROM rooms WHERE id = $1
  if (cleanSql.includes('FROM rooms') && cleanSql.includes('WHERE id =')) {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', params[0]).limit(1);
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 4. UPDATE rooms SET partner2_name = $1...
  if (cleanSql.includes('UPDATE rooms SET partner2_name')) {
    const members = typeof params[2] === 'string' ? safeJsonParse(params[2], []) : params[2];
    const { data, error } = await supabase.from('rooms').update({
      partner2_name: params[0],
      names: params[1],
      members,
    }).eq('id', params[3]).select();
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 5. UPDATE rooms SET active_session = $1...
  if (cleanSql.includes('UPDATE rooms SET active_session = $1')) {
    const active_session = typeof params[0] === 'string' ? safeJsonParse(params[0], null) : params[0];
    const { data, error } = await supabase.from('rooms').update({ active_session }).eq('id', params[1]).select();
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 6. UPDATE rooms SET active_session = NULL
  if (cleanSql.includes('UPDATE rooms SET active_session = NULL')) {
    const { data, error } = await supabase.from('rooms').update({ active_session: null }).eq('id', params[0]).select();
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 7. INSERT INTO room_snaps
  if (cleanSql.includes('INSERT INTO room_snaps')) {
    const { data, error } = await supabase.from('room_snaps').insert({
      room_id: params[0],
      session_id: params[1],
      sender_name: params[2],
      sender_id: params[3],
      slot_index: params[4],
      photo_data: params[5],
    }).select();
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 8. SELECT * FROM room_snaps WHERE room_id = $1 AND session_id = $2 AND sender_id != $3
  if (cleanSql.includes('FROM room_snaps') && cleanSql.includes('sender_id !=')) {
    const { data, error } = await supabase.from('room_snaps').select('*')
      .eq('room_id', params[0])
      .eq('session_id', params[1])
      .neq('sender_id', params[2])
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 9. SELECT * FROM room_snaps WHERE room_id = $1 AND session_id = $2 AND slot_index >= 0
  if (cleanSql.includes('FROM room_snaps') && cleanSql.includes('slot_index >= 0')) {
    const { data, error } = await supabase.from('room_snaps').select('*')
      .eq('room_id', params[0])
      .eq('session_id', params[1])
      .gte('slot_index', 0)
      .order('slot_index', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 10. SELECT * FROM room_snaps WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1
  if (cleanSql.includes('FROM room_snaps') && cleanSql.includes('WHERE room_id = $1')) {
    const { data, error } = await supabase.from('room_snaps').select('*')
      .eq('room_id', params[0])
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 11. SELECT FROM room_pages
  if (cleanSql.includes('FROM room_pages') && cleanSql.includes('WHERE room_id =')) {
    const { data, error } = await supabase.from('room_pages').select('*')
      .eq('room_id', params[0])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 12. INSERT INTO room_pages
  if (cleanSql.includes('INSERT INTO room_pages')) {
    const composition = typeof params[4] === 'string' ? safeJsonParse(params[4], {}) : params[4];
    const { data, error } = await supabase.from('room_pages').insert({
      room_id: params[0],
      author: params[1],
      title: params[2],
      section: params[3],
      composition,
      thumb: params[5],
    }).select();
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 13. DELETE FROM room_pages
  if (cleanSql.includes('DELETE FROM room_pages')) {
    const { data, error } = await supabase.from('room_pages').delete().eq('id', params[0]);
    if (error) throw error;
    return [] as T[];
  }

  // 14. SELECT * FROM solo_pages
  if (cleanSql.includes('FROM solo_pages') && cleanSql.includes('SELECT')) {
    const { data, error } = await supabase.from('solo_pages').select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 15. INSERT INTO solo_pages
  if (cleanSql.includes('INSERT INTO solo_pages')) {
    const composition = typeof params[2] === 'string' ? safeJsonParse(params[2], {}) : params[2];
    const { data, error } = await supabase.from('solo_pages').insert({
      title: params[0],
      section: params[1],
      composition,
      thumb: params[3],
      paper: params[4],
    }).select();
    if (error) throw error;
    return (data as T[]) || [];
  }

  // 16. DELETE FROM solo_pages
  if (cleanSql.includes('DELETE FROM solo_pages')) {
    const { data, error } = await supabase.from('solo_pages').delete().eq('id', params[0]);
    if (error) throw error;
    return [] as T[];
  }

  console.warn('Unhandled SQL query for Supabase:', sql);
  return [];
}

function safeJsonParse(val: any, fallback: any) {
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function genRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
