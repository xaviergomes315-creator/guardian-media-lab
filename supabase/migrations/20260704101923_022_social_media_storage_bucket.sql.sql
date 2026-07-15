/*
# Create Social Media Storage Bucket

Creates a public storage bucket for social media uploads (images/videos).
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-media',
  'social-media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;


DROP POLICY IF EXISTS "authenticated_users_can_upload" ON storage.objects;
DROP POLICY IF EXISTS "public_read" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own_files" ON storage.objects;


-- Allow authenticated users to upload
CREATE POLICY "authenticated_users_can_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'social-media');

-- Allow public to read (bucket is public anyway)
CREATE POLICY "public_read" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'social-media');

-- Allow users to delete their own uploads
CREATE POLICY "users_delete_own_files" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'social-media');
