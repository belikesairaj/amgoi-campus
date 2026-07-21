
-- Create public bucket for room images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
);

-- Allow anyone to read room images (public bucket)
CREATE POLICY "Public read access for room images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-images');

-- Allow authenticated uploads (admin only in practice via app logic)
CREATE POLICY "Allow image uploads to room-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'room-images');

-- Allow image updates
CREATE POLICY "Allow image updates in room-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'room-images');

-- Allow image deletes
CREATE POLICY "Allow image deletes in room-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'room-images');
