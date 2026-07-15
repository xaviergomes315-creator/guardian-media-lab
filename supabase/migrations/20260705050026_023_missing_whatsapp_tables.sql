-- Create whatsapp_conversations table
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message TEXT,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound',
  status TEXT DEFAULT 'sent',
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_conversations
CREATE POLICY "whatsapp_conversations_select_authenticated" ON whatsapp_conversations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "whatsapp_conversations_insert_authenticated" ON whatsapp_conversations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "whatsapp_conversations_update_authenticated" ON whatsapp_conversations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "whatsapp_conversations_delete_authenticated" ON whatsapp_conversations
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for chat_messages
CREATE POLICY "chat_messages_select_authenticated" ON chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "chat_messages_insert_authenticated" ON chat_messages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "chat_messages_update_authenticated" ON chat_messages
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "chat_messages_delete_authenticated" ON chat_messages
  FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_id ON whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact_id ON whatsapp_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);