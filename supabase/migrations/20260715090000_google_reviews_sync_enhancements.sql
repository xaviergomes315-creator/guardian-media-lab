-- Google Reviews Sync Enhancements Migration

-- 1. Create Locations table for Google Business accounts
CREATE TABLE IF NOT EXISTS google_review_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  location TEXT NOT NULL,
  encrypted_refresh_token TEXT, -- Encrypted refresh token for Google Business API
  encrypted_access_token TEXT,  -- Encrypted temporary access token
  access_token_expires_at TIMESTAMPTZ,
  is_connected BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  total_reviews_synced INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'idle',
  sync_error TEXT,
  consecutive_failures INTEGER DEFAULT 0, -- Dead Letter Queue tracker
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- Index user_id on locations table
CREATE INDEX IF NOT EXISTS idx_google_review_locations_user_id ON google_review_locations(user_id);

-- Enable RLS on google_review_locations
ALTER TABLE google_review_locations ENABLE ROW LEVEL SECURITY;

-- Owner-scoped policies for google_review_locations
DROP POLICY IF EXISTS "select_own_review_locations" ON google_review_locations;
CREATE POLICY "select_own_review_locations" ON google_review_locations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_review_locations" ON google_review_locations;
CREATE POLICY "insert_own_review_locations" ON google_review_locations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_review_locations" ON google_review_locations;
CREATE POLICY "update_own_review_locations" ON google_review_locations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_review_locations" ON google_review_locations;
CREATE POLICY "delete_own_review_locations" ON google_review_locations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


-- 2. Add soft-delete flag, unique index, and location relation to google_reviews
ALTER TABLE google_reviews ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE google_reviews ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES google_review_locations(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_reviews_google_review_id ON google_reviews(google_review_id);


-- 3. Add sync details to global settings
ALTER TABLE google_review_settings ADD COLUMN IF NOT EXISTS total_reviews_synced INTEGER DEFAULT 0;
ALTER TABLE google_review_settings ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'idle';
ALTER TABLE google_review_settings ADD COLUMN IF NOT EXISTS sync_error TEXT;
