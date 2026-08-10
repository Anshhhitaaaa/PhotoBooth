-- Neon Postgres Database Schema for Photobooth (Couple & Friends)

-- 1. Create rooms table with active session sync support
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  mode VARCHAR(20) NOT NULL DEFAULT 'couple',
  partner1_name TEXT NOT NULL DEFAULT 'Partner 1',
  partner2_name TEXT,
  names TEXT NOT NULL DEFAULT '',
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_session JSONB DEFAULT '{}'::jsonb, -- active room photobooth session state
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure active_session column exists if table was already created
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS active_session JSONB DEFAULT '{}'::jsonb;

-- 2. Create room_snaps table for live distance split screen captures
CREATE TABLE IF NOT EXISTS room_snaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL DEFAULT '',
  sender_name TEXT NOT NULL,
  sender_id TEXT NOT NULL DEFAULT 'p1',
  slot_index INT NOT NULL DEFAULT 0,
  photo_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create room_pages table for completed photo strips & polaroids
CREATE TABLE IF NOT EXISTS room_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled memory',
  section TEXT NOT NULL DEFAULT '',
  composition JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumb TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Partner 1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_pages_room ON room_pages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_snaps_session ON room_snaps(room_id, session_id);
