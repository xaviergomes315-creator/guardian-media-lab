-- GST Module Tables

-- GST Clients table
CREATE TABLE IF NOT EXISTS gst_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  gst_number TEXT NOT NULL UNIQUE,
  pan_number TEXT,
  contact_person TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  address TEXT,
  state TEXT,
  gst_type TEXT DEFAULT 'regular' CHECK (gst_type IN ('regular', 'composition', 'unregistered')),
  registration_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- GST Returns table
CREATE TABLE IF NOT EXISTS gst_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES gst_clients(id) ON DELETE CASCADE,
  return_type TEXT NOT NULL CHECK (return_type IN ('GSTR1', 'GSTR3B', 'GSTR9', 'GSTR4', 'GSTR5', 'GSTR6', 'GSTR7', 'GSTR8', 'GSTR9C', 'GSTR10')),
  filing_period TEXT NOT NULL,
  due_date DATE NOT NULL,
  filing_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filed', 'overdue', 'cancelled')),
  remarks TEXT,
  acknowledgement_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- GST Documents table
CREATE TABLE IF NOT EXISTS gst_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES gst_clients(id) ON DELETE SET NULL,
  return_id UUID REFERENCES gst_returns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  document_type TEXT,
  url TEXT,
  size INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on GST tables
ALTER TABLE gst_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_documents ENABLE ROW LEVEL SECURITY;

-- GST Clients policies
DROP POLICY IF EXISTS "gst_clients_select" ON gst_clients;
CREATE POLICY "gst_clients_select" ON gst_clients FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "gst_clients_insert" ON gst_clients;
CREATE POLICY "gst_clients_insert" ON gst_clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gst_clients_update" ON gst_clients;
CREATE POLICY "gst_clients_update" ON gst_clients FOR UPDATE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "gst_clients_delete" ON gst_clients;
CREATE POLICY "gst_clients_delete" ON gst_clients FOR DELETE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- GST Returns policies
DROP POLICY IF EXISTS "gst_returns_select" ON gst_returns;
CREATE POLICY "gst_returns_select" ON gst_returns FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "gst_returns_insert" ON gst_returns;
CREATE POLICY "gst_returns_insert" ON gst_returns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gst_returns_update" ON gst_returns;
CREATE POLICY "gst_returns_update" ON gst_returns FOR UPDATE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "gst_returns_delete" ON gst_returns;
CREATE POLICY "gst_returns_delete" ON gst_returns FOR DELETE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- GST Documents policies
DROP POLICY IF EXISTS "gst_documents_select" ON gst_documents;
CREATE POLICY "gst_documents_select" ON gst_documents FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "gst_documents_insert" ON gst_documents;
CREATE POLICY "gst_documents_insert" ON gst_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gst_documents_update" ON gst_documents;
CREATE POLICY "gst_documents_update" ON gst_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gst_documents_delete" ON gst_documents;
CREATE POLICY "gst_documents_delete" ON gst_documents FOR DELETE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- Create indexes for GST tables
CREATE INDEX IF NOT EXISTS idx_gst_clients_user_id ON gst_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_gst_clients_status ON gst_clients(status);
CREATE INDEX IF NOT EXISTS idx_gst_returns_user_id ON gst_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_gst_returns_client_id ON gst_returns(client_id);
CREATE INDEX IF NOT EXISTS idx_gst_returns_status ON gst_returns(status);
CREATE INDEX IF NOT EXISTS idx_gst_returns_due_date ON gst_returns(due_date);
CREATE INDEX IF NOT EXISTS idx_gst_documents_user_id ON gst_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_gst_documents_client_id ON gst_documents(client_id);