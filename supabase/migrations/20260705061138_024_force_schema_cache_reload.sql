-- Force schema cache reload by making a no-op change to the table
-- This ensures PostgREST picks up the table

-- Add and immediately remove a temporary column to force schema cache update
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS _temp_schema_reload INTEGER DEFAULT 0;
ALTER TABLE service_catalog DROP COLUMN IF EXISTS _temp_schema_reload;

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON service_catalog TO authenticated;

-- Drop and recreate all policies for service_catalog
DROP POLICY IF EXISTS service_catalog_select ON service_catalog;
DROP POLICY IF EXISTS service_catalog_anon_select ON service_catalog;
DROP POLICY IF EXISTS service_catalog_insert ON service_catalog;
DROP POLICY IF EXISTS service_catalog_update ON service_catalog;
DROP POLICY IF EXISTS service_catalog_delete ON service_catalog;

-- Create fresh policies
CREATE POLICY service_catalog_select ON service_catalog
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
    OR is_active = true);

CREATE POLICY service_catalog_anon_select ON service_catalog
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY service_catalog_insert ON service_catalog
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

CREATE POLICY service_catalog_update ON service_catalog
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

CREATE POLICY service_catalog_delete ON service_catalog
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- Force NOTIFY
NOTIFY pgrst, 'reload schema';