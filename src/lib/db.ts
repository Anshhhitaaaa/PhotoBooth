import { neon } from '@neondatabase/serverless';

const DEFAULT_DATABASE_URL =
  'postgresql://neondb_owner:npg_kBYfVhTP0uC1@ep-noisy-snow-aygvifcg-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const databaseUrl =
  import.meta.env.VITE_NEON_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  DEFAULT_DATABASE_URL;

/** Returns Neon SQL client instance or null if unconfigured */
export function getDb() {
  if (!databaseUrl || databaseUrl.includes('your-neon-database-url')) {
    return null;
  }
  try {
    return neon(databaseUrl);
  } catch (err) {
    console.error('Failed to initialize Neon Postgres client:', err);
    return null;
  }
}

/** Execute SQL query with parameters using Neon Serverless HTTP driver */
export async function query<T = any>(
  queryString: string,
  params: any[] = [],
): Promise<T[]> {
  const sql = getDb();
  if (!sql) {
    console.warn('Neon DB not configured. Using local fallback mode.');
    return [];
  }
  try {
    const result = await sql(queryString, params);
    return (result as T[]) || [];
  } catch (error: any) {
    const errMsg = String(error?.message || error || '');
    if (errMsg.includes('402') || errMsg.includes('quota') || errMsg.includes('Data Transfer')) {
      console.warn('Neon Postgres data transfer quota reached. Operating in seamless local cache mode.');
      return [];
    }
    console.error('Neon Query Error:', errMsg);
    throw new Error(errMsg);
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
