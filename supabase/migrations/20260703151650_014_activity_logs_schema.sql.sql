-- Activity Logs Table for Universal Activity Timeline
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "select_activity_logs_authenticated" ON activity_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_activity_logs_authenticated" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_user_name TEXT,
  p_user_role TEXT,
  p_module TEXT,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activity_logs (
    user_id, user_name, user_role, module, action,
    entity_type, entity_id, details, ip_address, device_info
  )
  VALUES (
    p_user_id, p_user_name, p_user_role, p_module, p_action,
    p_entity_type, p_entity_id, p_details, p_ip_address, p_device_info
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to auto-log lead creation
CREATE OR REPLACE FUNCTION auto_log_lead_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id, user_name, user_role, module, action,
    entity_type, entity_id, details
  )
  SELECT
    NEW.created_by,
    COALESCE(p.full_name, 'System'),
    p.role,
    'leads',
    'New Lead Created',
    'lead',
    NEW.id,
    jsonb_build_object(
      'lead_name', NEW.name,
      'lead_email', NEW.email,
      'lead_source', NEW.source
    )
  FROM profiles p
  WHERE p.id = NEW.created_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lead assignment
CREATE OR REPLACE FUNCTION auto_log_lead_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO activity_logs (
      user_id, user_name, user_role, module, action,
      entity_type, entity_id, details
    )
    SELECT
      NEW.assigned_to,
      COALESCE(p.full_name, 'System'),
      p.role,
      'leads',
      'Lead Assigned',
      'lead',
      NEW.id,
      jsonb_build_object(
        'lead_name', NEW.name,
        'assigned_by', OLD.assigned_to
      )
    FROM profiles p
    WHERE p.id = NEW.assigned_to;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lead status change
CREATE OR REPLACE FUNCTION auto_log_lead_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO activity_logs (
      user_id, user_name, user_role, module, action,
      entity_type, entity_id, details
    )
    SELECT
      NEW.updated_by,
      COALESCE(p.full_name, 'System'),
      p.role,
      'leads',
      'Lead Status Changed',
      'lead',
      NEW.id,
      jsonb_build_object(
        'lead_name', NEW.name,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    FROM profiles p
    WHERE p.id = NEW.updated_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_lead_created_log ON leads;
DROP TRIGGER IF EXISTS on_lead_updated_log ON leads;

-- Create triggers for leads
CREATE TRIGGER on_lead_created_log
  AFTER INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION auto_log_lead_created();

CREATE TRIGGER on_lead_updated_log
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION auto_log_lead_status_changed();

COMMENT ON TABLE activity_logs IS 'Universal activity log for tracking all system events';
COMMENT ON FUNCTION log_activity IS 'Helper function to log activities programmatically';
