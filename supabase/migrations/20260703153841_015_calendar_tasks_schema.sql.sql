-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'event' CHECK (event_type IN ('event', 'meeting', 'follow_up', 'reminder', 'task')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  color TEXT DEFAULT 'blue',
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  reminder_minutes INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings Table (detailed meeting info)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT DEFAULT 'general' CHECK (meeting_type IN ('general', 'client', 'team', 'lead', 'follow_up', 'review', 'other')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  meeting_link TEXT,
  attendee_ids UUID[] DEFAULT '{}',
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  notes TEXT,
  agenda TEXT,
  action_items TEXT[],
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  reminder_sent BOOLEAN DEFAULT false,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting Attendees Table (for many-to-many relationship)
CREATE TABLE IF NOT EXISTS meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'accepted', 'declined', 'tentative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for calendar events
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_at ON calendar_events(end_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_lead_id ON calendar_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client_id ON calendar_events(client_id);

-- Create indexes for meetings
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_at ON meetings(start_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);

-- Create indexes for meeting attendees
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON meeting_attendees(user_id);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "calendar_events_select_authenticated" ON calendar_events FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "calendar_events_insert_authenticated" ON calendar_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_events_update_authenticated" ON calendar_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_events_delete_authenticated" ON calendar_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for meetings
CREATE POLICY "meetings_select_authenticated" ON meetings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "meetings_insert_authenticated" ON meetings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meetings_update_authenticated" ON meetings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR user_id = ANY(attendee_ids)) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meetings_delete_authenticated" ON meetings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for meeting_attendees
CREATE POLICY "meeting_attendees_select_authenticated" ON meeting_attendees FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "meeting_attendees_insert_authenticated" ON meeting_attendees FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "meeting_attendees_update_authenticated" ON meeting_attendees FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "meeting_attendees_delete_authenticated" ON meeting_attendees FOR DELETE
  TO authenticated USING (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add time and telecaller info to follow_ups
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS follow_up_time TIME;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS assigned_telecaller UUID REFERENCES auth.users(id);
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS lead_source TEXT;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE calendar_events IS 'Calendar events for scheduling and tracking activities';
COMMENT ON TABLE meetings IS 'Detailed meeting information with notes and attendees';
COMMENT ON TABLE meeting_attendees IS 'Meeting attendees with response status';
