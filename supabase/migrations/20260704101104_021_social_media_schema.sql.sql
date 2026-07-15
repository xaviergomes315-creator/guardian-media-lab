/*
# Social Media Management Schema

This migration creates tables for managing social media posts, including:
- Social posts (draft, scheduled, published)
- Media attachments (images, videos)
- Connected social accounts

## New Tables

### social_posts
Main table for social media posts.
- `id` (uuid, primary key)
- `user_id` (uuid, FK to auth.users) - Creator
- `content` (text) - Post content
- `platforms` (text[]) - Target platforms
- `status` (text) - draft, scheduled, published, failed
- `media_type` (text) - image, video, none
- `scheduled_at` (timestamptz) - When to publish
- `published_at` (timestamptz) - When actually published
- `platform_post_ids` (jsonb) - Platform-specific post IDs after publishing
- `error_message` (text) - Error if publishing failed
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### social_post_media
Media attachments for posts.

### social_accounts
Connected social media accounts (shared across organization).

## Security
- RLS enabled on all tables
- Users can only access their own posts
- Only super_admin/admin can manage social accounts

## Indexes
- Foreign keys and frequently queried columns indexed
*/

-- Social Posts Table
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  media_type TEXT CHECK (media_type IN ('image', 'video', 'none')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_ids JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social Post Media Table
CREATE TABLE IF NOT EXISTS social_post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  filename TEXT,
  size INTEGER,
  mime_type TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Social Accounts Table (shared organization accounts, no user_id required)
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok')),
  account_name TEXT,
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  followers INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform)
);

-- Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Social Posts Policies
DROP POLICY IF EXISTS "social_posts_select" ON social_posts;
CREATE POLICY "social_posts_select" ON social_posts FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

DROP POLICY IF EXISTS "social_posts_insert" ON social_posts;
CREATE POLICY "social_posts_insert" ON social_posts FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "social_posts_update" ON social_posts;
CREATE POLICY "social_posts_update" ON social_posts FOR UPDATE
  TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "social_posts_delete" ON social_posts;
CREATE POLICY "social_posts_delete" ON social_posts FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Social Post Media Policies
DROP POLICY IF EXISTS "social_post_media_select" ON social_post_media;
CREATE POLICY "social_post_media_select" ON social_post_media FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM social_posts WHERE social_posts.id = social_post_media.post_id AND (
      social_posts.user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
    ))
  );

DROP POLICY IF EXISTS "social_post_media_insert" ON social_post_media;
CREATE POLICY "social_post_media_insert" ON social_post_media FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM social_posts WHERE social_posts.id = social_post_media.post_id AND social_posts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "social_post_media_delete" ON social_post_media;
CREATE POLICY "social_post_media_delete" ON social_post_media FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM social_posts WHERE social_posts.id = social_post_media.post_id AND social_posts.user_id = auth.uid())
  );

-- Social Accounts Policies (everyone can read, only admin can edit)
DROP POLICY IF EXISTS "social_accounts_select" ON social_accounts;
CREATE POLICY "social_accounts_select" ON social_accounts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "social_accounts_insert" ON social_accounts;
CREATE POLICY "social_accounts_insert" ON social_accounts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin'))
  );

DROP POLICY IF EXISTS "social_accounts_update" ON social_accounts;
CREATE POLICY "social_accounts_update" ON social_accounts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin'))
  );

DROP POLICY IF EXISTS "social_accounts_delete" ON social_accounts;
CREATE POLICY "social_accounts_delete" ON social_accounts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin'))
  );

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_platforms ON social_posts USING GIN(platforms);

CREATE INDEX IF NOT EXISTS idx_social_post_media_post ON social_post_media(post_id);

CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);

-- Insert default social accounts
INSERT INTO social_accounts (platform, account_name, followers, is_connected)
VALUES
  ('facebook', 'Grow with Us', 15420, true),
  ('instagram', '@growwithus', 8932, true),
  ('twitter', '@GrowWithUs_Digital', 5231, true),
  ('linkedin', 'Grow with Us', 3456, false),
  ('youtube', 'Grow with Us', 12890, true)
ON CONFLICT DO NOTHING;
