
-- Add image_url column
ALTER TABLE public.rooms ADD COLUMN image_url text;

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "anon_select_rooms" ON public.rooms;
DROP POLICY IF EXISTS "anon_insert_rooms" ON public.rooms;
DROP POLICY IF EXISTS "anon_update_rooms" ON public.rooms;
DROP POLICY IF EXISTS "anon_delete_rooms" ON public.rooms;

-- Public read (everyone can see rooms)
CREATE POLICY "anon_select_rooms" ON public.rooms
  FOR SELECT TO anon, authenticated USING (true);

-- Admin writes use anon key (app-level password, not Supabase Auth)
CREATE POLICY "anon_insert_rooms" ON public.rooms
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_rooms" ON public.rooms
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_rooms" ON public.rooms
  FOR DELETE TO anon, authenticated USING (true);
