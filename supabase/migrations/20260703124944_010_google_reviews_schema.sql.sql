-- Google Reviews Management Schema

-- Create google_reviews table
CREATE TABLE IF NOT EXISTS google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_review_id TEXT,
  reviewer_name TEXT NOT NULL,
  reviewer_photo TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id),
  review_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'pending_reply')),
  location_name TEXT,
  starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_google_reviews_user_id ON google_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_google_reviews_status ON google_reviews(status);
CREATE INDEX IF NOT EXISTS idx_google_reviews_rating ON google_reviews(rating);

-- Enable RLS
ALTER TABLE google_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "google_reviews_select" ON google_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "google_reviews_insert" ON google_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "google_reviews_update" ON google_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "google_reviews_delete" ON google_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
