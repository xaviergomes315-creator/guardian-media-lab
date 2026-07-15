/*
# Dynamic Services Catalog System

This migration creates a comprehensive services management system that replaces
the hardcoded GST-only portal with a dynamic, category-based service catalog.

## New Tables

### service_catalog
Admin-managed service templates that can be assigned to clients.
- `id` (uuid, primary key)
- `name` (text, not null) - Service name
- `category` (text, not null) - Service category
- `description` (text) - Service description
- `is_active` (boolean, default true) - Whether service is available
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### client_services
Services assigned to specific portal clients.
- `id` (uuid, primary key)
- `portal_client_id` (uuid, FK to portal_clients) - Client receiving service
- `service_catalog_id` (uuid, FK to service_catalog) - Reference service template
- `client_id` (uuid, FK to clients) - CRM client link
- `name` (text, not null) - Service name (can override template)
- `category` (text, not null) - Service category
- `description` (text) - Service-specific description
- `status` (text) - pending, in_progress, completed, on_hold, cancelled
- `priority` (text) - low, medium, high, urgent
- `progress` (integer, 0-100) - Completion percentage
- `start_date` (date) - When service started
- `due_date` (date) - Expected completion date
- `completed_at` (timestamptz) - Actual completion timestamp
- `assigned_team` (text[]) - Array of team member user_ids
- `invoice_id` (uuid, FK to invoices) - Linked invoice
- `notes` (text) - Internal notes
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### client_service_tasks
Tasks associated with client services.
- `id` (uuid, primary key)
- `client_service_id` (uuid, FK to client_services)
- `title` (text, not null)
- `description` (text)
- `status` (text) - pending, in_progress, completed
- `due_date` (date)
- `completed_at` (timestamptz)
- `created_at` (timestamptz)

### client_service_documents
Documents associated with client services.
- `id` (uuid, primary key)
- `client_service_id` (uuid, FK to client_services)
- `name` (text, not null)
- `url` (text)
- `type` (text)
- `size` (integer)
- `is_client_visible` (boolean, default true)
- `created_at` (timestamptz)

### client_service_activities
Activity timeline for client services.
- `id` (uuid, primary key)
- `client_service_id` (uuid, FK to client_services)
- `type` (text) - status_change, progress_update, note_added, document_added, task_completed
- `description` (text, not null)
- `user_id` (uuid) - Who performed the action
- `user_name` (text)
- `metadata` (jsonb) - Additional context
- `created_at` (timestamptz)

## Categories (ENUM-like via CHECK constraint)
- Tax & Compliance
- Digital Marketing
- Website & Software
- Branding & Design
- Media Production
- Business Consulting
- Custom Services

## Security
- RLS enabled on all tables
- Admin/Manager can manage service_catalog
- Admin/Manager can CRUD client_services
- Portal clients can only view their own assigned services
- Portal clients can view their own service tasks, documents, and activities

## Indexes
- Foreign keys and frequently queried columns indexed
*/

-- Service Catalog Table (Admin managed templates)
CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Tax & Compliance',
    'Digital Marketing',
    'Website & Software',
    'Branding & Design',
    'Media Production',
    'Business Consulting',
    'Custom Services'
  )),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client Services Table (Services assigned to portal clients)
CREATE TABLE IF NOT EXISTS client_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
  service_catalog_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Tax & Compliance',
    'Digital Marketing',
    'Website & Software',
    'Branding & Design',
    'Media Production',
    'Business Consulting',
    'Custom Services'
  )),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  assigned_team TEXT[] DEFAULT '{}',
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client Service Tasks Table
CREATE TABLE IF NOT EXISTS client_service_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_service_id UUID NOT NULL REFERENCES client_services(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client Service Documents Table
CREATE TABLE IF NOT EXISTS client_service_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_service_id UUID NOT NULL REFERENCES client_services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  type TEXT,
  size INTEGER,
  is_client_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client Service Activities Table
CREATE TABLE IF NOT EXISTS client_service_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_service_id UUID NOT NULL REFERENCES client_services(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('status_change', 'progress_update', 'note_added', 'document_added', 'task_completed', 'created', 'assigned')),
  description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_service_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_service_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_service_activities ENABLE ROW LEVEL SECURITY;

-- Service Catalog Policies (Admin/Manager only)
DROP POLICY IF EXISTS "service_catalog_select" ON service_catalog;
CREATE POLICY "service_catalog_select" ON service_catalog FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
    OR is_active = true
  );

DROP POLICY IF EXISTS "service_catalog_insert" ON service_catalog;
CREATE POLICY "service_catalog_insert" ON service_catalog FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "service_catalog_update" ON service_catalog;
CREATE POLICY "service_catalog_update" ON service_catalog FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "service_catalog_delete" ON service_catalog;
CREATE POLICY "service_catalog_delete" ON service_catalog FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- Client Services Policies (Admin/Manager CRUD, Portal Client Read Own)
DROP POLICY IF EXISTS "client_services_select" ON client_services;
CREATE POLICY "client_services_select" ON client_services FOR SELECT
  TO authenticated USING (
    portal_client_id IN (SELECT id FROM portal_clients WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
  );

DROP POLICY IF EXISTS "client_services_insert" ON client_services;
CREATE POLICY "client_services_insert" ON client_services FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "client_services_update" ON client_services;
CREATE POLICY "client_services_update" ON client_services FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "client_services_delete" ON client_services;
CREATE POLICY "client_services_delete" ON client_services FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- Client Service Tasks Policies
DROP POLICY IF EXISTS "client_service_tasks_select" ON client_service_tasks;
CREATE POLICY "client_service_tasks_select" ON client_service_tasks FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_tasks.client_service_id AND (
      cs.portal_client_id IN (SELECT id FROM portal_clients WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
    ))
  );

DROP POLICY IF EXISTS "client_service_tasks_insert" ON client_service_tasks;
CREATE POLICY "client_service_tasks_insert" ON client_service_tasks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_tasks.client_service_id
      AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')))
  );

DROP POLICY IF EXISTS "client_service_tasks_update" ON client_service_tasks;
CREATE POLICY "client_service_tasks_update" ON client_service_tasks FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_tasks.client_service_id
      AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')))
  );

DROP POLICY IF EXISTS "client_service_tasks_delete" ON client_service_tasks;
CREATE POLICY "client_service_tasks_delete" ON client_service_tasks FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_tasks.client_service_id
      AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')))
  );

-- Client Service Documents Policies
DROP POLICY IF EXISTS "client_service_documents_select" ON client_service_documents;
CREATE POLICY "client_service_documents_select" ON client_service_documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_documents.client_service_id AND (
      (cs.portal_client_id IN (SELECT id FROM portal_clients WHERE user_id = auth.uid()) AND client_service_documents.is_client_visible = true)
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
    ))
  );

DROP POLICY IF EXISTS "client_service_documents_insert" ON client_service_documents;
CREATE POLICY "client_service_documents_insert" ON client_service_documents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_documents.client_service_id
      AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')))
  );

DROP POLICY IF EXISTS "client_service_documents_update" ON client_service_documents;
CREATE POLICY "client_service_documents_update" ON client_service_documents FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_documents.client_service_id
      AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')))
  );

DROP POLICY IF EXISTS "client_service_documents_delete" ON client_service_documents;
CREATE POLICY "client_service_documents_delete" ON client_service_documents FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_documents.client_service_id
      AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')))
  );

-- Client Service Activities Policies
DROP POLICY IF EXISTS "client_service_activities_select" ON client_service_activities;
CREATE POLICY "client_service_activities_select" ON client_service_activities FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_activities.client_service_id AND (
      cs.portal_client_id IN (SELECT id FROM portal_clients WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager'))
    ))
  );

DROP POLICY IF EXISTS "client_service_activities_insert" ON client_service_activities;
CREATE POLICY "client_service_activities_insert" ON client_service_activities FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM client_services cs WHERE cs.id = client_service_activities.client_service_id
      AND EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')))
  );

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON service_catalog(category);
CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON service_catalog(is_active);

CREATE INDEX IF NOT EXISTS idx_client_services_portal_client ON client_services(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_client ON client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_status ON client_services(status);
CREATE INDEX IF NOT EXISTS idx_client_services_category ON client_services(category);
CREATE INDEX IF NOT EXISTS idx_client_services_due_date ON client_services(due_date);

CREATE INDEX IF NOT EXISTS idx_client_service_tasks_service ON client_service_tasks(client_service_id);
CREATE INDEX IF NOT EXISTS idx_client_service_tasks_status ON client_service_tasks(status);

CREATE INDEX IF NOT EXISTS idx_client_service_documents_service ON client_service_documents(client_service_id);

CREATE INDEX IF NOT EXISTS idx_client_service_activities_service ON client_service_activities(client_service_id);
CREATE INDEX IF NOT EXISTS idx_client_service_activities_type ON client_service_activities(type);

-- Insert default service catalog entries
INSERT INTO service_catalog (name, category, description, is_active) VALUES
('GST Registration', 'Tax & Compliance', 'Goods and Services Tax registration and compliance services', true),
('GST Return Filing', 'Tax & Compliance', 'Monthly, quarterly, and annual GST return filing', true),
('ITR Filing', 'Tax & Compliance', 'Income Tax Return filing for individuals and businesses', true),
('TDS Compliance', 'Tax & Compliance', 'Tax Deducted at Source compliance and filing', true),
('Tax Planning & Advisory', 'Tax & Compliance', 'Strategic tax planning and advisory services', true),
('SEO Services', 'Digital Marketing', 'Search Engine Optimization to improve online visibility', true),
('Social Media Marketing', 'Digital Marketing', 'Social media management and advertising campaigns', true),
('PPC Advertising', 'Digital Marketing', 'Pay-per-click advertising on Google, Facebook, etc.', true),
('Content Marketing', 'Digital Marketing', 'Content creation and marketing strategy', true),
('Email Marketing', 'Digital Marketing', 'Email campaign design and automation', true),
('Website Development', 'Website & Software', 'Custom website design and development', true),
('E-commerce Development', 'Website & Software', 'Online store and e-commerce platform development', true),
('Web Application', 'Website & Software', 'Custom web application development', true),
('Mobile App Development', 'Website & Software', 'iOS and Android mobile application development', true),
('Software Maintenance', 'Website & Software', 'Ongoing software support and maintenance', true),
('Logo Design', 'Branding & Design', 'Professional logo and brand identity design', true),
('Brand Guidelines', 'Branding & Design', 'Comprehensive brand style guide creation', true),
('Marketing Collateral', 'Branding & Design', 'Brochures, flyers, and marketing materials', true),
('Video Production', 'Media Production', 'Professional video content creation', true),
('Photography', 'Media Production', 'Product and corporate photography services', true),
('Animation', 'Media Production', '2D and 3D animation services', true),
('Business Consulting', 'Business Consulting', 'Strategic business planning and advisory', true),
('Financial Planning', 'Business Consulting', 'Financial analysis and planning services', true),
('Process Optimization', 'Business Consulting', 'Business process improvement and automation', true)
ON CONFLICT DO NOTHING;
