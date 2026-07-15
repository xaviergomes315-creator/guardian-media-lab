/*
# Role-Based Access Control (RBAC) Enhancement

1. Updates profiles role enum to: super_admin, admin, telecaller, accountant, client
2. Creates role_permissions table for granular permission management
3. Creates user_permissions table for user-specific overrides
4. Creates audit_log table for permission changes
5. Updates RLS policies for role-based access

This migration enhances the existing RBAC system with:
- Granular permissions per role
- User-specific permission overrides
- Audit trail for security events
*/

-- Drop existing constraints and update profiles role enum
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'telecaller', 'accountant', 'client'));

-- Create role_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'telecaller', 'accountant', 'client')),
  permission TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission)
);

-- Create user_permissions table for user-specific overrides
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Create audit_log table for security events
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Role permissions policies
CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_insert" ON role_permissions FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));
CREATE POLICY "role_permissions_update" ON role_permissions FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));
CREATE POLICY "role_permissions_delete" ON role_permissions FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- User permissions policies
CREATE POLICY "user_permissions_select" ON user_permissions FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));
CREATE POLICY "user_permissions_insert" ON user_permissions FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));
CREATE POLICY "user_permissions_update" ON user_permissions FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));
CREATE POLICY "user_permissions_delete" ON user_permissions FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- Audit log policies
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default role permissions
-- Super Admin: Full access to everything
INSERT INTO role_permissions (role, permission, resource, action) VALUES
  ('super_admin', 'all', '*', 'manage'),
  ('super_admin', 'users', 'users', 'manage'),
  ('super_admin', 'roles', 'roles', 'manage'),
  ('super_admin', 'settings', 'settings', 'manage'),
  ('super_admin', 'audit', 'audit_log', 'read')
ON CONFLICT (role, permission) DO NOTHING;

-- Admin: Most permissions except super admin functions
INSERT INTO role_permissions (role, permission, resource, action) VALUES
  ('admin', 'dashboard', 'dashboard', 'read'),
  ('admin', 'crm', 'leads', 'manage'),
  ('admin', 'crm', 'clients', 'manage'),
  ('admin', 'projects', 'projects', 'manage'),
  ('admin', 'team', 'profiles', 'read'),
  ('admin', 'tasks', 'tasks', 'manage'),
  ('admin', 'social', 'social', 'manage'),
  ('admin', 'whatsapp', 'whatsapp', 'manage'),
  ('admin', 'reviews', 'reviews', 'manage'),
  ('admin', 'invoices', 'invoices', 'manage'),
  ('admin', 'reports', 'reports', 'read'),
  ('admin', 'gst', 'gst', 'manage'),
  ('admin', 'telecaller', 'telecaller', 'manage'),
  ('admin', 'notifications', 'notifications', 'manage'),
  ('admin', 'ai', 'ai', 'manage'),
  ('admin', 'portal', 'portal_clients', 'manage'),
  ('admin', 'settings', 'settings', 'update')
ON CONFLICT (role, permission) DO NOTHING;

-- Telecaller: Limited to telecaller and lead management
INSERT INTO role_permissions (role, permission, resource, action) VALUES
  ('telecaller', 'dashboard', 'dashboard', 'read'),
  ('telecaller', 'telecaller', 'telecaller', 'manage'),
  ('telecaller', 'crm', 'leads', 'read'),
  ('telecaller', 'crm', 'leads', 'create'),
  ('telecaller', 'crm', 'leads', 'update'),
  ('telecaller', 'clients', 'clients', 'read'),
  ('telecaller', 'notifications', 'notifications', 'manage'),
  ('telecaller', 'tasks', 'tasks', 'read'),
  ('telecaller', 'tasks', 'tasks', 'update')
ON CONFLICT (role, permission) DO NOTHING;

-- Accountant: Financial and GST modules
INSERT INTO role_permissions (role, permission, resource, action) VALUES
  ('accountant', 'dashboard', 'dashboard', 'read'),
  ('accountant', 'invoices', 'invoices', 'manage'),
  ('accountant', 'gst', 'gst', 'manage'),
  ('accountant', 'reports', 'reports', 'read'),
  ('accountant', 'clients', 'clients', 'read'),
  ('accountant', 'notifications', 'notifications', 'manage'),
  ('accountant', 'tasks', 'tasks', 'read')
ON CONFLICT (role, permission) DO NOTHING;

-- Client: Portal access only
INSERT INTO role_permissions (role, permission, resource, action) VALUES
  ('client', 'dashboard', 'dashboard', 'read'),
  ('client', 'notifications', 'notifications', 'manage')
ON CONFLICT (role, permission) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Create function to check user permission
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_has_override BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM profiles WHERE user_id = p_user_id LIMIT 1;
  
  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Super admin has all permissions
  IF v_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check role permissions
  IF EXISTS (SELECT 1 FROM role_permissions WHERE role = v_role AND (permission = p_permission OR permission = 'all')) THEN
    -- Check for user-specific deny
    SELECT EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = p_user_id AND permission = p_permission AND granted = false
      AND (expires_at IS NULL OR expires_at > now())
    ) INTO v_has_override;
    
    RETURN NOT v_has_override;
  END IF;
  
  -- Check for user-specific grant
  SELECT EXISTS (
    SELECT 1 FROM user_permissions 
    WHERE user_id = p_user_id AND permission = p_permission AND granted = true
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_has_override;
  
  RETURN v_has_override;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, resource_type, resource_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit trigger to profiles table for role changes
DROP TRIGGER IF EXISTS profiles_audit_trigger ON profiles;
CREATE TRIGGER profiles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
