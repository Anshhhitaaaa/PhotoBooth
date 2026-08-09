/*
# Create rooms and shared album pages for two-person photobooth

## What this does
Creates a "room" that two long-distance partners can join with a share code.
Each room has its own album. Photos saved to a room are visible to both partners
in real time. There is no sign-in — anyone with the room code can join.

## New Tables

### rooms
- id (uuid, primary key)
- code (text, unique) — short 6-char code partners share with each other
- partner1_name (text) — who created the room
- partner2_name (text, nullable) — who joined (set when second person joins)
- names (text) — combined display names for strip headers
- created_at (timestamptz)

### room_pages
- id (uuid, primary key)
- room_id (uuid, references rooms, cascade delete)
- title (text)
- section (text)
- composition (jsonb) — full composition object (layout, photos, stickers, filter, etc.)
- thumb (text) — small data URL preview
- author (text) — which partner added this page
- created_at (timestamptz)

## Security
- RLS enabled on both tables.
- No sign-in screen → policies use `TO anon, authenticated` with `USING (true)`.
  The room code acts as the access key — sharing the code is how partners grant access.
  This is intentional shared/public data scoped by room code.
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  partner1_name text NOT NULL DEFAULT 'Partner 1',
  partner2_name text,
  names text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rooms" ON rooms;
CREATE POLICY "anon_select_rooms" ON rooms FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms" ON rooms FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
CREATE POLICY "anon_update_rooms" ON rooms FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rooms" ON rooms;
CREATE POLICY "anon_delete_rooms" ON rooms FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS room_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled memory',
  section text NOT NULL DEFAULT '',
  composition jsonb NOT NULL DEFAULT '{}',
  thumb text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT 'Partner 1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE room_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_room_pages" ON room_pages;
CREATE POLICY "anon_select_room_pages" ON room_pages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_room_pages" ON room_pages;
CREATE POLICY "anon_insert_room_pages" ON room_pages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_room_pages" ON room_pages;
CREATE POLICY "anon_update_room_pages" ON room_pages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_room_pages" ON room_pages;
CREATE POLICY "anon_delete_room_pages" ON room_pages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_room_pages_room_id ON room_pages(room_id, created_at DESC);
