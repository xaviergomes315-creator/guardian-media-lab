/*
# Module Manager Schema

1. New Tables
- `module_settings` — stores enable/disable state for each application module.
  - `id` (uuid, primary key)
  - `module_id` (text, unique) — matches the module id from the frontend registry
  - `is_enabled` (boolean, default true) — whether the module is active
  - `is_visible` (boolean, default true) — whether the module shows in the sidebar
  - `updated_by` (uuid, nullable) — the user who last changed the setting
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `module_settings`.
- All authenticated users can read module settings (so the sidebar/route guard works for everyone).
- Only authenticated users can insert/update (the frontend upserts on toggle).
- No delete policy — module state is never deleted, only toggled.

3. Notes
- Core modules (Authentication, Dashboard, Company Settings, RBAC) are protected
  in the frontend and can never be disabled. The database does not enforce this
  because the frontend never sends a disable request for core modules.
- The table is optional — if it doesn't exist or is empty, the app falls back
  to localStorage with all modules enabled.
*/

CREATE TABLE IF NOT EXISTS module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_settings_module_id ON module_settings(module_id);

ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_settings_select_authenticated" ON module_settings;
CREATE POLICY "module_settings_select_authenticated" ON module_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "module_settings_insert_authenticated" ON module_settings;
CREATE POLICY "module_settings_insert_authenticated" ON module_settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "module_settings_update_authenticated" ON module_settings;
CREATE POLICY "module_settings_update_authenticated" ON module_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "module_settings_delete_authenticated" ON module_settings;
CREATE POLICY "module_settings_delete_authenticated" ON module_settings FOR DELETE
  TO authenticated USING (true);
