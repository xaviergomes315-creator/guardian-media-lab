-- Lead Tracking Extensions Migration

-- Add UTM parameters and campaign sub-categories to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS adset_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ad_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tracking_data JSONB DEFAULT '{}'::jsonb;
