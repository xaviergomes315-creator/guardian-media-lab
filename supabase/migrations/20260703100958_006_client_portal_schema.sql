-- Client Portal Tables

-- Portal Clients table (extends clients with login credentials)
CREATE TABLE IF NOT EXISTS portal_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  company_name TEXT,
  gst_number TEXT,
  pan_number TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  profile_photo TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_portal_email UNIQUE (email)
);

-- Portal Documents table
CREATE TABLE IF NOT EXISTS portal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'gst', 'itr', 'invoice', 'legal', 'financial', 'other')),
  document_type TEXT,
  url TEXT,
  size INTEGER,
  description TEXT,
  is_client_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Portal Notifications table
CREATE TABLE IF NOT EXISTS portal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'reminder')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Portal Activities table
CREATE TABLE IF NOT EXISTS portal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Portal ITR (Income Tax Returns) table
CREATE TABLE IF NOT EXISTS portal_itr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
  assessment_year TEXT NOT NULL,
  itr_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'review', 'filed', 'acknowledged', 'rejected')),
  filing_date DATE,
  acknowledgement_number TEXT,
  taxable_income NUMERIC DEFAULT 0,
  tax_payable NUMERIC DEFAULT 0,
  refund_amount NUMERIC DEFAULT 0,
  notes TEXT,
  documents TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Portal Tasks table (for client-specific tasks)
CREATE TABLE IF NOT EXISTS portal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on Portal tables
ALTER TABLE portal_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_itr ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_tasks ENABLE ROW LEVEL SECURITY;

-- Portal Clients policies
CREATE POLICY "portal_clients_select" ON portal_clients FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "portal_clients_insert" ON portal_clients FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

CREATE POLICY "portal_clients_update" ON portal_clients FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "portal_clients_delete" ON portal_clients FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- Portal Documents policies
CREATE POLICY "portal_documents_select" ON portal_documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.id = portal_documents.portal_client_id AND (pc.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))))
  );

CREATE POLICY "portal_documents_insert" ON portal_documents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
    OR EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.user_id = auth.uid() AND pc.id = portal_documents.portal_client_id)
  );

CREATE POLICY "portal_documents_update" ON portal_documents FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.id = portal_documents.portal_client_id AND (pc.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))))
  );

CREATE POLICY "portal_documents_delete" ON portal_documents FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.id = portal_documents.portal_client_id AND (pc.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))))
  );

-- Portal Notifications policies
CREATE POLICY "portal_notifications_select" ON portal_notifications FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.id = portal_notifications.portal_client_id AND pc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "portal_notifications_insert" ON portal_notifications FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

CREATE POLICY "portal_notifications_update" ON portal_notifications FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.id = portal_notifications.portal_client_id AND pc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "portal_notifications_delete" ON portal_notifications FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 from portal_clients pc WHERE pc.id = portal_notifications.portal_client_id AND pc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin'))
  );

-- Portal Activities policies
CREATE POLICY "portal_activities_select" ON portal_activities FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.id = portal_activities.portal_client_id AND pc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "portal_activities_insert" ON portal_activities FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

-- Portal ITR policies
CREATE POLICY "portal_itr_select" ON portal_itr FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.id = portal_itr.portal_client_id AND pc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "portal_itr_insert" ON portal_itr FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

CREATE POLICY "portal_itr_update" ON portal_itr FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

CREATE POLICY "portal_itr_delete" ON portal_itr FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- Portal Tasks policies
CREATE POLICY "portal_tasks_select" ON portal_tasks FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.id = portal_tasks.portal_client_id AND pc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "portal_tasks_insert" ON portal_tasks FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

CREATE POLICY "portal_tasks_update" ON portal_tasks FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM portal_clients pc WHERE pc.id = portal_tasks.portal_client_id AND pc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "portal_tasks_delete" ON portal_tasks FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

-- Create indexes for Portal tables
CREATE INDEX IF NOT EXISTS idx_portal_clients_client_id ON portal_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_clients_user_id ON portal_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_clients_email ON portal_clients(email);
CREATE INDEX IF NOT EXISTS idx_portal_documents_client_id ON portal_documents(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_portal_documents_category ON portal_documents(category);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_client_id ON portal_notifications(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_read ON portal_notifications(read);
CREATE INDEX IF NOT EXISTS idx_portal_activities_client_id ON portal_activities(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_portal_itr_client_id ON portal_itr(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_portal_tasks_client_id ON portal_tasks(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_portal_tasks_status ON portal_tasks(status);