/*
# Auto Lead Assignment Schema

1. New Tables
- `auto_assignment_settings` - Stores auto-assignment configuration
  - `id` (uuid, primary key)
  - `is_enabled` (boolean, default true) - Enable/disable auto-assignment
  - `assignment_method` (text) - 'round_robin', 'fixed', 'manual'
  - `fixed_telecaller_id` (uuid, nullable) - Fixed telecaller for 'fixed' method
  - `notify_admin_on_unassigned` (boolean, default true) - Notify admin when no telecaller available
  - `created_at`, `updated_at` (timestamps)

- `lead_assignment_queue` - Tracks unassigned leads waiting for telecaller
  - `id` (uuid, primary key)
  - `lead_id` (uuid, references leads) - The unassigned lead
  - `status` (text) - 'pending', 'assigned', 'cancelled'
  - `assigned_to` (uuid, nullable) - Telecaller eventually assigned
  - `assigned_at` (timestamptz, nullable) - When assignment happened
  - `created_at` (timestamp)

- `telecaller_assignment_counter` - Round-robin counter for fair distribution
  - `id` (uuid, primary key)
  - `last_telecaller_id` (uuid) - Last telecaller assigned in round-robin
  - `assignment_count` (integer) - Total assignments made
  - `updated_at` (timestamp)

2. Modified Tables
- `leads` - Add `assigned_at` column to track when lead was assigned

3. Database Functions
- `auto_assign_lead()` - Trigger function for automatic lead assignment
- `get_next_telecaller()` - Get next telecaller using round-robin
- `get_active_telecallers()` - Get list of active telecallers

4. Triggers
- `on_lead_created_auto_assign` - Trigger on lead insert for auto-assignment

5. Security
- Enable RLS on all new tables
- Admin-only access for settings
- Telecallers can view their own assignments
*/

-- Create auto_assignment_settings table
CREATE TABLE IF NOT EXISTS auto_assignment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT true,
  assignment_method TEXT DEFAULT 'round_robin' CHECK (assignment_method IN ('round_robin', 'fixed', 'manual')),
  fixed_telecaller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notify_admin_on_unassigned BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create lead_assignment_queue table
CREATE TABLE IF NOT EXISTS lead_assignment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'cancelled')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create telecaller_assignment_counter table for round-robin
CREATE TABLE IF NOT EXISTS telecaller_assignment_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_telecaller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignment_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add assigned_at column to leads if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_at') THEN
    ALTER TABLE leads ADD COLUMN assigned_at TIMESTAMPTZ;
  END IF;
END $$;

-- Insert default settings if not exists
INSERT INTO auto_assignment_settings (is_enabled, assignment_method)
SELECT true, 'round_robin'
WHERE NOT EXISTS (SELECT 1 FROM auto_assignment_settings);

-- Insert default counter if not exists
INSERT INTO telecaller_assignment_counter (assignment_count)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM telecaller_assignment_counter);

-- Enable RLS on new tables
ALTER TABLE auto_assignment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE telecaller_assignment_counter ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auto_assignment_settings
DROP POLICY IF EXISTS "settings_select" ON auto_assignment_settings;
CREATE POLICY "settings_select" ON auto_assignment_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_insert" ON auto_assignment_settings;
CREATE POLICY "settings_insert" ON auto_assignment_settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "settings_update" ON auto_assignment_settings;
CREATE POLICY "settings_update" ON auto_assignment_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- RLS Policies for lead_assignment_queue
DROP POLICY IF EXISTS "queue_select" ON lead_assignment_queue;
CREATE POLICY "queue_select" ON lead_assignment_queue FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "queue_insert" ON lead_assignment_queue;
CREATE POLICY "queue_insert" ON lead_assignment_queue FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "queue_update" ON lead_assignment_queue;
CREATE POLICY "queue_update" ON lead_assignment_queue FOR UPDATE TO authenticated USING (true);

-- RLS Policies for telecaller_assignment_counter
DROP POLICY IF EXISTS "counter_select" ON telecaller_assignment_counter;
CREATE POLICY "counter_select" ON telecaller_assignment_counter FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "counter_update" ON telecaller_assignment_counter;
CREATE POLICY "counter_update" ON telecaller_assignment_counter FOR UPDATE TO authenticated USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lead_assignment_queue_lead_id ON lead_assignment_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignment_queue_status ON lead_assignment_queue(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_at ON leads(assigned_at);

-- Function to get active telecallers
CREATE OR REPLACE FUNCTION get_active_telecallers()
RETURNS TABLE(user_id UUID, full_name TEXT, email TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.user_id, p.full_name, p.email
  FROM profiles p
  WHERE p.role = 'telecaller' 
    AND p.is_active = true
  ORDER BY p.created_at ASC;
$$;

-- Function to get next telecaller using round-robin
CREATE OR REPLACE FUNCTION get_next_telecaller()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_telecallers UUID[];
  v_last_telecaller UUID;
  v_next_index INTEGER;
  v_next_telecaller UUID;
  v_counter_id UUID;
BEGIN
  -- Get all active telecallers
  SELECT array_agg(user_id) INTO v_telecallers
  FROM get_active_telecallers();
  
  -- If no telecallers, return NULL
  IF v_telecallers IS NULL OR array_length(v_telecallers, 1) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- If only one telecaller, return that one
  IF array_length(v_telecallers, 1) = 1 THEN
    RETURN v_telecallers[1];
  END IF;
  
  -- Get the last assigned telecaller from counter
  SELECT id, last_telecaller_id INTO v_counter_id, v_last_telecaller
  FROM telecaller_assignment_counter
  LIMIT 1;
  
  -- Find next telecaller in round-robin
  IF v_last_telecaller IS NULL THEN
    -- First assignment, use first telecaller
    v_next_telecaller := v_telecallers[1];
    v_next_index := 1;
  ELSE
    -- Find position of last telecaller
    FOR v_next_index IN 1..array_length(v_telecallers, 1) LOOP
      IF v_telecallers[v_next_index] = v_last_telecaller THEN
        EXIT;
      END IF;
    END LOOP;
    
    -- Move to next (wrap around if at end)
    v_next_index := v_next_index + 1;
    IF v_next_index > array_length(v_telecallers, 1) THEN
      v_next_index := 1;
    END IF;
    
    v_next_telecaller := v_telecallers[v_next_index];
  END IF;
  
  -- Update counter
  UPDATE telecaller_assignment_counter
  SET last_telecaller_id = v_next_telecaller,
      assignment_count = assignment_count + 1,
      updated_at = now()
  WHERE id = v_counter_id;
  
  RETURN v_next_telecaller;
END;
$$;

-- Function to auto-assign lead (triggered on insert)
CREATE OR REPLACE FUNCTION auto_assign_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_assigned_to UUID;
  v_telecaller_name TEXT;
  v_lead_source TEXT;
BEGIN
  -- Get settings
  SELECT * INTO v_settings FROM auto_assignment_settings LIMIT 1;
  
  -- If auto-assignment is disabled or method is manual, skip
  IF NOT v_settings.is_enabled OR v_settings.assignment_method = 'manual' THEN
    -- Add to queue as pending
    INSERT INTO lead_assignment_queue (lead_id, status)
    VALUES (NEW.id, 'pending');
    RETURN NEW;
  END IF;
  
  -- Get telecaller based on method
  IF v_settings.assignment_method = 'fixed' AND v_settings.fixed_telecaller_id IS NOT NULL THEN
    -- Fixed telecaller assignment
    v_assigned_to := v_settings.fixed_telecaller_id;
  ELSIF v_settings.assignment_method = 'round_robin' THEN
    -- Round-robin assignment
    v_assigned_to := get_next_telecaller();
  END IF;
  
  -- If no telecaller available, add to queue and notify admin
  IF v_assigned_to IS NULL THEN
    INSERT INTO lead_assignment_queue (lead_id, status)
    VALUES (NEW.id, 'pending');
    
    -- Notify admin if setting is enabled
    IF v_settings.notify_admin_on_unassigned THEN
      -- Get first admin
      SELECT p.user_id INTO v_assigned_to
      FROM profiles p
      WHERE p.role IN ('super_admin', 'admin')
        AND p.is_active = true
      LIMIT 1;
      
      IF v_assigned_to IS NOT NULL THEN
        -- Get readable source name
        v_lead_source := COALESCE(NEW.source, 'Unknown');
        
        INSERT INTO notifications (user_id, title, message, type, action_url)
        VALUES (
          v_assigned_to,
          'Unassigned Lead Alert',
          'A new lead from ' || v_lead_source || ' could not be auto-assigned. No active telecaller available.',
          'lead',
          '/leads'
        );
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Get telecaller name for notification
  SELECT full_name INTO v_telecaller_name
  FROM profiles
  WHERE user_id = v_assigned_to;
  
  -- Get readable source name
  v_lead_source := COALESCE(NEW.source, 'Unknown');
  
  -- Assign lead to telecaller
  UPDATE leads
  SET assigned_to = v_assigned_to,
      assigned_at = now(),
      status = 'new',
      updated_at = now()
  WHERE id = NEW.id;
  
  -- Create activity log
  INSERT INTO activities (type, description, entity_type, entity_id, metadata)
  VALUES (
    'lead_assigned',
    'Lead auto-assigned to ' || COALESCE(v_telecaller_name, 'Telecaller'),
    'lead',
    NEW.id,
    jsonb_build_object('assigned_to', v_assigned_to, 'source', v_lead_source, 'method', v_settings.assignment_method)
  );
  
  -- Create telecaller_leads entry
  INSERT INTO telecaller_leads (lead_id, assigned_to, call_status, priority)
  VALUES (NEW.id, v_assigned_to, 'pending', 3);
  
  -- Send notification to assigned telecaller
  INSERT INTO notifications (user_id, title, message, type, action_url)
  VALUES (
    v_assigned_to,
    'New Lead Assigned',
    'A new lead from ' || v_lead_source || ' has been assigned to you: ' || NEW.company_name,
    'lead',
    '/telecaller'
  );
  
  -- Update queue if exists
  INSERT INTO lead_assignment_queue (lead_id, status, assigned_to, assigned_at)
  VALUES (NEW.id, 'assigned', v_assigned_to, now())
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-assignment
DROP TRIGGER IF EXISTS on_lead_created_auto_assign ON leads;
CREATE TRIGGER on_lead_created_auto_assign
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_lead();