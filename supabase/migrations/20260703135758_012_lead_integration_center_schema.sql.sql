/*
# Universal Lead Integration Center Schema

1. Purpose
   Adds the database layer for a Universal Lead Integration Center that can
   ingest leads from Website Forms, Facebook Lead Ads, Google Lead Forms,
   Justdial, IndiaMART, WhatsApp, Email, API/Webhook, and Manual CSV Import.
   The architecture is designed so external platform APIs (Facebook, Google,
   Justdial, IndiaMART) can be connected later WITHOUT changing the UI or
   database — only the edge-function adapters need to be written.

2. Modified Tables
   - `leads` — adds 7 nullable columns for integration metadata:
     - `lead_source`     : high-level origin ('website_form' | 'facebook_lead_ads' | 'google_lead_form' | 'justdial' | 'indiamart' | 'whatsapp' | 'email' | 'api_webhook' | 'manual_import')
     - `platform`         : specific platform/account identifier (free text, e.g. 'facebook_page_123')
     - `campaign_name`    : campaign or form name from the source platform
     - `website_name`     : originating website / domain for website-form leads
     - `external_lead_id` : unique ID from the external platform (used for duplicate detection)
     - `sync_status`      : 'pending' | 'synced' | 'failed' | 'duplicate'
     - `imported_at`      : timestamp when the lead was ingested by the integration center
   All new columns are nullable with safe defaults so existing rows and the
   existing CRM UI continue to work unchanged.

3. New Tables
   - `lead_integrations` — one row per connected platform account.
     - `id` (uuid PK)
     - `user_id` (uuid, owner, DEFAULT auth.uid())
     - `platform` (text, e.g. 'facebook_lead_ads')
     - `connection_name` (text, human label)
     - `is_connected` (boolean, default false)
     - `credentials` (jsonb, encrypted/placeholder — no real secrets stored yet)
     - `config` (jsonb, platform-specific settings: page id, form id, etc.)
     - `last_synced_at` (timestamptz)
     - `total_leads_imported` (integer, default 0)
     - `status` (text: 'active' | 'paused' | 'error')
     - `created_at`, `updated_at` (timestamptz)
   - `lead_import_logs` — audit trail for every import/sync batch.
     - `id` (uuid PK)
     - `user_id` (uuid, owner, DEFAULT auth.uid())
     - `integration_id` (uuid FK -> lead_integrations, nullable, ON DELETE SET NULL)
     - `platform` (text)
     - `total_rows` (integer)
     - `imported_count` (integer)
     - `duplicate_count` (integer)
     - `failed_count` (integer)
     - `status` (text: 'pending' | 'completed' | 'failed' | 'partial')
     - `error_message` (text)
     - `created_at` (timestamptz)

4. Duplicate Detection
   - A unique index on (user_id, platform, external_lead_id) allows the
     edge-function adapter to use INSERT ... ON CONFLICT DO NOTHING to skip
     duplicates. NULL external_lead_id values are allowed (manual imports).

5. Security
   - RLS enabled on both new tables.
   - Owner-scoped CRUD (4 policies each) TO authenticated using auth.uid().
   - Existing leads policies are NOT modified — the new nullable columns are
     covered by the existing owner/admin/manager predicates.

6. Notes
   - No real API credentials are stored. The `credentials` jsonb column is a
     placeholder for future encrypted storage when real APIs are connected.
   - The webhook edge function (deployed separately) will insert into `leads`
     using the service role key, bypassing RLS, and will set the new columns.
*/

-- =========================================================
-- 1. Add integration columns to leads
-- =========================================================
DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN lead_source TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN platform TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN campaign_name TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN website_name TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN external_lead_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'duplicate'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN imported_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Partial unique index for duplicate detection (NULLs allowed, so manual
-- imports without an external ID are never blocked).
CREATE UNIQUE INDEX IF NOT EXISTS leads_external_lead_id_uniq
  ON leads (user_id, platform, external_lead_id)
  WHERE external_lead_id IS NOT NULL;

-- =========================================================
-- 2. lead_integrations table
-- =========================================================
CREATE TABLE IF NOT EXISTS lead_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('website_form', 'facebook_lead_ads', 'google_lead_form', 'justdial', 'indiamart', 'whatsapp', 'email', 'api_webhook', 'manual_import')),
  connection_name TEXT NOT NULL DEFAULT 'Default',
  is_connected BOOLEAN NOT NULL DEFAULT false,
  credentials JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  total_leads_imported INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lead_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_integrations_select" ON lead_integrations;
CREATE POLICY "lead_integrations_select" ON lead_integrations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lead_integrations_insert" ON lead_integrations;
CREATE POLICY "lead_integrations_insert" ON lead_integrations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lead_integrations_update" ON lead_integrations;
CREATE POLICY "lead_integrations_update" ON lead_integrations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lead_integrations_delete" ON lead_integrations;
CREATE POLICY "lead_integrations_delete" ON lead_integrations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- 3. lead_import_logs table
-- =========================================================
CREATE TABLE IF NOT EXISTS lead_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES lead_integrations(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'partial')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lead_import_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_import_logs_select" ON lead_import_logs;
CREATE POLICY "lead_import_logs_select" ON lead_import_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lead_import_logs_insert" ON lead_import_logs;
CREATE POLICY "lead_import_logs_insert" ON lead_import_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lead_import_logs_update" ON lead_import_logs;
CREATE POLICY "lead_import_logs_update" ON lead_import_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lead_import_logs_delete" ON lead_import_logs;
CREATE POLICY "lead_import_logs_delete" ON lead_import_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lead_integrations_user ON lead_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_import_logs_user ON lead_import_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_imported_at ON leads(imported_at DESC);

-- =========================================================
-- 4. updated_at trigger helper for lead_integrations
-- =========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_integrations_updated ON lead_integrations;
CREATE TRIGGER trg_lead_integrations_updated
  BEFORE UPDATE ON lead_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
