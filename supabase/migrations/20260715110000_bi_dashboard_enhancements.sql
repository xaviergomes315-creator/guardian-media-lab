-- Business Intelligence Dashboard Layouts Migration

-- Create dashboard_layouts table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Owner-scoped policies for dashboard_layouts
DROP POLICY IF EXISTS "layouts_select_own" ON dashboard_layouts;
CREATE POLICY "layouts_select_own" ON dashboard_layouts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "layouts_upsert_own" ON dashboard_layouts;
CREATE POLICY "layouts_upsert_own" ON dashboard_layouts FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
