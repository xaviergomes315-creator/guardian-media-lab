/*
# Guardian Media Lab - WhatsApp Bulk Messaging Module

Tables:
- whatsapp_contacts - Contact list for bulk messaging
- whatsapp_groups - Contact groups for segmentation
- whatsapp_campaigns - Campaign management
- whatsapp_messages - Individual message tracking
- whatsapp_templates - Message templates
- whatsapp_auto_replies - Auto reply rules
*/

-- WhatsApp Contacts table
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  variables JSONB DEFAULT '{}',
  group_ids TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'inactive')),
  labels TEXT[] DEFAULT '{}',
  notes TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_phone_per_user UNIQUE (user_id, phone)
);

-- WhatsApp Groups table
CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Templates table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  media_type TEXT DEFAULT 'text' CHECK (media_type IN ('text', 'image', 'video', 'document')),
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Campaigns table
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  group_ids TEXT[] DEFAULT '{}',
  message_content TEXT NOT NULL,
  media_type TEXT DEFAULT 'text' CHECK (media_type IN ('text', 'image', 'video', 'document')),
  media_url TEXT,
  media_caption TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled')),
  total_contacts INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- WhatsApp Messages table (individual message tracking)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  media_type TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  external_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Auto Replies table
CREATE TABLE IF NOT EXISTS whatsapp_auto_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_keyword TEXT NOT NULL,
  reply_message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_auto_replies ENABLE ROW LEVEL SECURITY;

-- WhatsApp Contacts policies
DROP POLICY IF EXISTS "whatsapp_contacts_select" ON whatsapp_contacts;
CREATE POLICY "whatsapp_contacts_select" ON whatsapp_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_contacts_insert" ON whatsapp_contacts;
CREATE POLICY "whatsapp_contacts_insert" ON whatsapp_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_contacts_update" ON whatsapp_contacts;
CREATE POLICY "whatsapp_contacts_update" ON whatsapp_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_contacts_delete" ON whatsapp_contacts;
CREATE POLICY "whatsapp_contacts_delete" ON whatsapp_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp Groups policies
DROP POLICY IF EXISTS "whatsapp_groups_select" ON whatsapp_groups;
CREATE POLICY "whatsapp_groups_select" ON whatsapp_groups FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_groups_insert" ON whatsapp_groups;
CREATE POLICY "whatsapp_groups_insert" ON whatsapp_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_groups_update" ON whatsapp_groups;
CREATE POLICY "whatsapp_groups_update" ON whatsapp_groups FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_groups_delete" ON whatsapp_groups;
CREATE POLICY "whatsapp_groups_delete" ON whatsapp_groups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp Templates policies
DROP POLICY IF EXISTS "whatsapp_templates_select" ON whatsapp_templates;
CREATE POLICY "whatsapp_templates_select" ON whatsapp_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_templates_insert" ON whatsapp_templates;
CREATE POLICY "whatsapp_templates_insert" ON whatsapp_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_templates_update" ON whatsapp_templates;
CREATE POLICY "whatsapp_templates_update" ON whatsapp_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_templates_delete" ON whatsapp_templates;
CREATE POLICY "whatsapp_templates_delete" ON whatsapp_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp Campaigns policies
DROP POLICY IF EXISTS "whatsapp_campaigns_select" ON whatsapp_campaigns;
CREATE POLICY "whatsapp_campaigns_select" ON whatsapp_campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_campaigns_insert" ON whatsapp_campaigns;
CREATE POLICY "whatsapp_campaigns_insert" ON whatsapp_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_campaigns_update" ON whatsapp_campaigns;
CREATE POLICY "whatsapp_campaigns_update" ON whatsapp_campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_campaigns_delete" ON whatsapp_campaigns;
CREATE POLICY "whatsapp_campaigns_delete" ON whatsapp_campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp Messages policies
DROP POLICY IF EXISTS "whatsapp_messages_select" ON whatsapp_messages;
CREATE POLICY "whatsapp_messages_select" ON whatsapp_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_messages_insert" ON whatsapp_messages;
CREATE POLICY "whatsapp_messages_insert" ON whatsapp_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_messages_update" ON whatsapp_messages;
CREATE POLICY "whatsapp_messages_update" ON whatsapp_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_messages_delete" ON whatsapp_messages;
CREATE POLICY "whatsapp_messages_delete" ON whatsapp_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp Auto Replies policies
DROP POLICY IF EXISTS "whatsapp_auto_replies_select" ON whatsapp_auto_replies;
CREATE POLICY "whatsapp_auto_replies_select" ON whatsapp_auto_replies FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_auto_replies_insert" ON whatsapp_auto_replies;
CREATE POLICY "whatsapp_auto_replies_insert" ON whatsapp_auto_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_auto_replies_update" ON whatsapp_auto_replies;
CREATE POLICY "whatsapp_auto_replies_update" ON whatsapp_auto_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "whatsapp_auto_replies_delete" ON whatsapp_auto_replies;
CREATE POLICY "whatsapp_auto_replies_delete" ON whatsapp_auto_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_user_id ON whatsapp_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_status ON whatsapp_contacts(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_user_id ON whatsapp_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_user_id ON whatsapp_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_user_id ON whatsapp_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_campaign_id ON whatsapp_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

-- Function to update group contact count
CREATE OR REPLACE FUNCTION update_group_contact_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE whatsapp_groups 
    SET contact_count = contact_count + 1,
        updated_at = now()
    WHERE id = ANY(NEW.group_ids) AND user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE whatsapp_groups 
    SET contact_count = GREATEST(contact_count - 1, 0),
        updated_at = now()
    WHERE id = ANY(OLD.group_ids) AND user_id = OLD.user_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove from old groups
    UPDATE whatsapp_groups 
    SET contact_count = GREATEST(contact_count - 1, 0),
        updated_at = now()
    WHERE id = ANY(OLD.group_ids) AND user_id = OLD.user_id AND id != ALL(NEW.group_ids);
    -- Add to new groups
    UPDATE whatsapp_groups 
    SET contact_count = contact_count + 1,
        updated_at = now()
    WHERE id = ANY(NEW.group_ids) AND user_id = NEW.user_id AND id != ALL(OLD.group_ids);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_group_count_trigger ON whatsapp_contacts;
CREATE TRIGGER update_group_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON whatsapp_contacts
FOR EACH ROW EXECUTE FUNCTION update_group_contact_count();