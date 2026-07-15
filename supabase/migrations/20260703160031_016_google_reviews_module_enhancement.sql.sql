/*
# Google Reviews Module Enhancement

1. Overview
   Extends the existing google_reviews module with reply templates and review settings tables
   to support a full review management workflow (reply management, saved templates, settings).

2. New Tables
   - `google_review_templates`: Saved reply templates for quick responses to reviews.
     - id (uuid, PK)
     - user_id (uuid, owner, defaults to auth.uid())
     - name (text, template label)
     - content (text, template body, supports {name} placeholder)
     - category (text: positive | neutral | negative | general)
     - is_default (boolean, seeded system templates)
     - created_at, updated_at (timestamptz)
   - `google_review_settings`: Per-user review module settings (connection, sync, notifications).
     - id (uuid, PK)
     - user_id (uuid, unique, owner, defaults to auth.uid())
     - is_connected (boolean, placeholder for future Google Business API connection)
     - business_name (text)
     - location (text)
     - auto_sync (boolean)
     - sync_interval (text: hourly | daily | weekly)
     - notify_new_reviews (boolean)
     - notify_negative_reviews (boolean)
     - notify_pending_replies (boolean)
     - last_synced_at (timestamptz)
     - created_at, updated_at (timestamptz)

3. Security
   - Enable RLS on both new tables.
   - Owner-scoped CRUD policies (TO authenticated, auth.uid() = user_id) for both tables.
   - user_id columns default to auth.uid() so inserts omitting user_id succeed.

4. Notes
   - No live Google Business API connection is made; is_connected is a placeholder flag.
   - Seed default reply templates for existing users on first settings row creation (handled in app).
   - Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
*/

-- Reply Templates Table
CREATE TABLE IF NOT EXISTS google_review_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('positive', 'neutral', 'negative', 'general')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_templates_user_id ON google_review_templates(user_id);

ALTER TABLE google_review_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_review_templates" ON google_review_templates;
CREATE POLICY "select_own_review_templates" ON google_review_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_review_templates" ON google_review_templates;
CREATE POLICY "insert_own_review_templates" ON google_review_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_review_templates" ON google_review_templates;
CREATE POLICY "update_own_review_templates" ON google_review_templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_review_templates" ON google_review_templates;
CREATE POLICY "delete_own_review_templates" ON google_review_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Review Settings Table
CREATE TABLE IF NOT EXISTS google_review_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_connected BOOLEAN DEFAULT FALSE,
  business_name TEXT,
  location TEXT,
  auto_sync BOOLEAN DEFAULT FALSE,
  sync_interval TEXT DEFAULT 'daily' CHECK (sync_interval IN ('hourly', 'daily', 'weekly')),
  notify_new_reviews BOOLEAN DEFAULT TRUE,
  notify_negative_reviews BOOLEAN DEFAULT TRUE,
  notify_pending_replies BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE google_review_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_review_settings" ON google_review_settings;
CREATE POLICY "select_own_review_settings" ON google_review_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_review_settings" ON google_review_settings;
CREATE POLICY "insert_own_review_settings" ON google_review_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_review_settings" ON google_review_settings;
CREATE POLICY "update_own_review_settings" ON google_review_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_review_settings" ON google_review_settings;
CREATE POLICY "delete_own_review_settings" ON google_review_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
