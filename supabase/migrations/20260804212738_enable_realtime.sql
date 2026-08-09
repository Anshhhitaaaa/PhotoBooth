/*
# Enable realtime on rooms and room_pages

Adds both tables to the supabase_realtime publication so the frontend
can subscribe to INSERT/UPDATE/DELETE events for live two-person sync.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_pages;
