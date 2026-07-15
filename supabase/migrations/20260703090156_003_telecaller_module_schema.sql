-- Telecaller Module Tables

-- Telecaller Leads (leads assigned to telecallers)
CREATE TABLE IF NOT EXISTS telecaller_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 3,
  call_status TEXT DEFAULT 'pending' CHECK (call_status IN ('pending', 'connected', 'not_connected', 'busy', 'switched_off', 'interested', 'follow_up', 'converted', 'lost')),
  last_call_at TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  total_calls INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Telecaller Call Logs (enhanced call_history for telecaller module)
CREATE TABLE IF NOT EXISTS telecaller_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  telecaller_lead_id UUID REFERENCES telecaller_leads(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  call_status TEXT NOT NULL CHECK (call_status IN ('connected', 'not_connected', 'busy', 'switched_off', 'invalid')),
  outcome TEXT CHECK (outcome IN ('interested', 'follow_up', 'converted', 'lost', 'callback', 'no_answer')),
  duration_seconds INTEGER,
  notes TEXT,
  recording_url TEXT,
  scheduled_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Telecaller Targets
CREATE TABLE IF NOT EXISTS telecaller_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('daily', 'weekly', 'monthly')),
  calls_target INTEGER DEFAULT 0,
  connected_target INTEGER DEFAULT 0,
  leads_target INTEGER DEFAULT 0,
  conversion_target INTEGER DEFAULT 0,
  actual_calls INTEGER DEFAULT 0,
  actual_connected INTEGER DEFAULT 0,
  actual_leads INTEGER DEFAULT 0,
  actual_conversions INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Telecaller Attendance
CREATE TABLE IF NOT EXISTS telecaller_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
  total_calls INTEGER DEFAULT 0,
  total_connected INTEGER DEFAULT 0,
  working_hours DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Reports
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  connected_calls INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0,
  follow_up_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  lost_count INTEGER DEFAULT 0,
  summary TEXT,
  manager_review TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE telecaller_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE telecaller_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telecaller_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE telecaller_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Telecaller Leads policies
DROP POLICY IF EXISTS "telecaller_leads_select" ON telecaller_leads;
CREATE POLICY "telecaller_leads_select" ON telecaller_leads FOR SELECT TO authenticated USING (auth.uid() = assigned_to OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "telecaller_leads_insert" ON telecaller_leads;
CREATE POLICY "telecaller_leads_insert" ON telecaller_leads FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "telecaller_leads_update" ON telecaller_leads;
CREATE POLICY "telecaller_leads_update" ON telecaller_leads FOR UPDATE TO authenticated USING (auth.uid() = assigned_to OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "telecaller_leads_delete" ON telecaller_leads;
CREATE POLICY "telecaller_leads_delete" ON telecaller_leads FOR DELETE TO authenticated USING (auth.uid() = assigned_to OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- Telecaller Call Logs policies
DROP POLICY IF EXISTS "telecaller_call_logs_select" ON telecaller_call_logs;
CREATE POLICY "telecaller_call_logs_select" ON telecaller_call_logs FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "telecaller_call_logs_insert" ON telecaller_call_logs;
CREATE POLICY "telecaller_call_logs_insert" ON telecaller_call_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "telecaller_call_logs_update" ON telecaller_call_logs;
CREATE POLICY "telecaller_call_logs_update" ON telecaller_call_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "telecaller_call_logs_delete" ON telecaller_call_logs;
CREATE POLICY "telecaller_call_logs_delete" ON telecaller_call_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Telecaller Targets policies
DROP POLICY IF EXISTS "telecaller_targets_select" ON telecaller_targets;
CREATE POLICY "telecaller_targets_select" ON telecaller_targets FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "telecaller_targets_insert" ON telecaller_targets;
CREATE POLICY "telecaller_targets_insert" ON telecaller_targets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "telecaller_targets_update" ON telecaller_targets;
CREATE POLICY "telecaller_targets_update" ON telecaller_targets FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "telecaller_targets_delete" ON telecaller_targets;
CREATE POLICY "telecaller_targets_delete" ON telecaller_targets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Telecaller Attendance policies
DROP POLICY IF EXISTS "telecaller_attendance_select" ON telecaller_attendance;
CREATE POLICY "telecaller_attendance_select" ON telecaller_attendance FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "telecaller_attendance_insert" ON telecaller_attendance;
CREATE POLICY "telecaller_attendance_insert" ON telecaller_attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "telecaller_attendance_update" ON telecaller_attendance;
CREATE POLICY "telecaller_attendance_update" ON telecaller_attendance FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Daily Reports policies
DROP POLICY IF EXISTS "daily_reports_select" ON daily_reports;
CREATE POLICY "daily_reports_select" ON daily_reports FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "daily_reports_insert" ON daily_reports;
CREATE POLICY "daily_reports_insert" ON daily_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_reports_update" ON daily_reports;
CREATE POLICY "daily_reports_update" ON daily_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_telecaller_leads_assigned_to ON telecaller_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_telecaller_leads_status ON telecaller_leads(call_status);
CREATE INDEX IF NOT EXISTS idx_telecaller_call_logs_user_id ON telecaller_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_telecaller_call_logs_created_at ON telecaller_call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_telecaller_targets_user_id ON telecaller_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_telecaller_attendance_user_id ON telecaller_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_telecaller_attendance_date ON telecaller_attendance(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);