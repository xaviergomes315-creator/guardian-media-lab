-- 1. Restructure RLS select policy on activity_logs
DROP POLICY IF EXISTS "select_activity_logs_authenticated" ON activity_logs;
CREATE POLICY "select_activity_logs_authenticated" ON activity_logs FOR SELECT
  TO authenticated USING (
    (auth.uid() = user_id) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'telecaller', 'accountant'))
  );

-- 2. Update RLS policies on google_reviews to allow administrators
DROP POLICY IF EXISTS "google_reviews_select" ON google_reviews;
CREATE POLICY "google_reviews_select" ON google_reviews FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
  );

DROP POLICY IF EXISTS "google_reviews_update" ON google_reviews;
CREATE POLICY "google_reviews_update" ON google_reviews FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
  );

DROP POLICY IF EXISTS "google_reviews_delete" ON google_reviews;
CREATE POLICY "google_reviews_delete" ON google_reviews FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- 3. Update RLS delete policy for the social-media storage bucket to validate owner
DROP POLICY IF EXISTS "users_delete_own_files" ON storage.objects;
CREATE POLICY "users_delete_own_files" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'social-media' AND 
    owner = auth.uid()
  );
