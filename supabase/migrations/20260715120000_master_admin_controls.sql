-- Phase 1: Master Admin Control Center Database Schema

-- 1. Create is_super_admin security helper function
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  branding JSONB DEFAULT '{"theme": "dark", "logo_url": null}'::jsonb,
  storage_limit_bytes BIGINT DEFAULT 10737418240, -- 10 GB
  api_quota_per_month INTEGER DEFAULT 50000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenants policies (Super Admin full access, Authenticated users read branding only)
CREATE POLICY "tenants_super_admin_all" ON tenants FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "tenants_auth_select_branding" ON tenants FOR SELECT
  TO authenticated USING (true);

-- 3. Tenant Subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('trial', 'monthly', 'yearly', 'lifetime')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE,
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed')),
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tenant_subscriptions
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies (Super Admin access only)
CREATE POLICY "subscriptions_super_admin_all" ON tenant_subscriptions FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- 4. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL
);

-- Enable RLS on permissions
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_super_admin_all" ON permissions FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "permissions_auth_select" ON permissions FOR SELECT
  TO authenticated USING (true);

-- 5. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role_key TEXT NOT NULL,
  UNIQUE(tenant_id, role_key)
);

-- Enable RLS on roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_super_admin_all" ON roles FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "roles_auth_select" ON roles FOR SELECT
  TO authenticated USING (true);

-- 6. Role Permissions Link
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Enable RLS on role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_super_admin_all" ON role_permissions FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "role_permissions_auth_select" ON role_permissions FOR SELECT
  TO authenticated USING (true);

-- 7. Tenant Modules Registry
CREATE TABLE IF NOT EXISTS tenant_modules (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL CHECK (module_key IN (
    'crm', 'leads', 'whatsapp', 'google_reviews', 'gst', 'telecaller', 'ai_assistant', 'reports', 'client_portal'
  )),
  enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (tenant_id, module_key)
);

-- Enable RLS on tenant_modules
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_super_admin_all" ON tenant_modules FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "modules_auth_select" ON tenant_modules FOR SELECT
  TO authenticated USING (true);

-- 8. Master Audit Logs
CREATE TABLE IF NOT EXISTS master_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on master_audit_logs
ALTER TABLE master_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_super_admin_all" ON master_audit_logs FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- 9. Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  description TEXT,
  is_globally_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  tenant_overrides JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on feature_flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_super_admin_all" ON feature_flags FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "feature_flags_auth_select" ON feature_flags FOR SELECT
  TO authenticated USING (true);

-- 10. Automation Rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  action_type TEXT NOT NULL,
  action_payload JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true
);

-- Enable RLS on automation_rules
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_rules_super_admin_all" ON automation_rules FOR ALL
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "automation_rules_auth_select" ON automation_rules FOR SELECT
  TO authenticated USING (true);
