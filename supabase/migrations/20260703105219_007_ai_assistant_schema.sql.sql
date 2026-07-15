-- AI Assistant Tables

-- AI Prompts table
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('marketing', 'sales', 'gst', 'income_tax', 'legal', 'whatsapp', 'email', 'social_media', 'general')),
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  variables TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Templates table (user_id nullable for system templates)
CREATE TABLE IF NOT EXISTS ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('social_post', 'facebook_ad', 'google_ad', 'email', 'whatsapp', 'sales_proposal', 'gst_reply', 'legal_notice', 'blog', 'invoice_description')),
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI History table
CREATE TABLE IF NOT EXISTS ai_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES ai_prompts(id) ON DELETE SET NULL,
  template_id UUID REFERENCES ai_templates(id) ON DELETE SET NULL,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  provider TEXT DEFAULT 'placeholder',
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  default_provider TEXT DEFAULT 'placeholder' CHECK (default_provider IN ('placeholder', 'openai', 'anthropic', 'google')),
  temperature REAL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens >= 100 AND max_tokens <= 4000),
  language TEXT DEFAULT 'en',
  auto_save_history BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on AI tables
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- AI Prompts policies
CREATE POLICY "ai_prompts_select" ON ai_prompts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "ai_prompts_insert" ON ai_prompts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_prompts_update" ON ai_prompts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "ai_prompts_delete" ON ai_prompts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- AI Templates policies (system templates visible to all)
CREATE POLICY "ai_templates_select" ON ai_templates FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_system = true);

CREATE POLICY "ai_templates_insert" ON ai_templates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_templates_update" ON ai_templates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "ai_templates_delete" ON ai_templates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- AI History policies
CREATE POLICY "ai_history_select" ON ai_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "ai_history_insert" ON ai_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_history_delete" ON ai_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- AI Settings policies
CREATE POLICY "ai_settings_select" ON ai_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "ai_settings_insert" ON ai_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_settings_update" ON ai_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- Create indexes for AI tables
CREATE INDEX IF NOT EXISTS idx_ai_prompts_user_id ON ai_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_favorite ON ai_prompts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_ai_templates_user_id ON ai_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_templates_type ON ai_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_ai_history_user_id ON ai_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_history_created_at ON ai_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_settings_user_id ON ai_settings(user_id);

-- Insert system templates (user_id is null for system templates)
INSERT INTO ai_templates (user_id, name, template_type, content, variables, description, is_system) VALUES
(NULL, 'Social Media Post', 'social_post', 'Create a social media post for {{platform}} about {{topic}}. The tone should be {{tone}}. Include relevant hashtags.', '{"platform", "topic", "tone"}', 'Generate engaging social media posts', true),
(NULL, 'Facebook Ad', 'facebook_ad', 'Create a Facebook ad for {{product}} targeting {{audience}}. Highlight the key benefit: {{benefit}}. Include a call to action.', '{"product", "audience", "benefit"}', 'Generate Facebook ad copy', true),
(NULL, 'Google Ad', 'google_ad', 'Write a Google ad headline and description for {{product}}. Target keyword: {{keyword}}. Max 30 characters for headline, 90 for description.', '{"product", "keyword"}', 'Generate Google search ad copy', true),
(NULL, 'Professional Email', 'email', 'Write a professional email to {{recipient}} about {{subject}}. The purpose is {{purpose}}. Keep it concise and professional.', '{"recipient", "subject", "purpose"}', 'Generate professional emails', true),
(NULL, 'WhatsApp Message', 'whatsapp', 'Write a friendly WhatsApp message for {{purpose}} to {{recipient}}. Keep it conversational and under 200 characters.', '{"recipient", "purpose"}', 'Generate WhatsApp messages', true),
(NULL, 'Sales Proposal', 'sales_proposal', 'Create a sales proposal for {{client_name}} offering {{service}}. Key benefits: {{benefits}}. Pricing: {{pricing}}.', '{"client_name", "service", "benefits", "pricing"}', 'Generate sales proposals', true),
(NULL, 'GST Query Reply', 'gst_reply', 'Write a professional response to a GST query regarding {{issue_type}} for {{client_name}}. Reference: {{reference}}.', '{"issue_type", "client_name", "reference"}', 'Generate GST query responses', true),
(NULL, 'Legal Notice', 'legal_notice', 'Draft a legal notice for {{matter}} addressed to {{party_name}}. Reference number: {{ref_number}}. Keep formal and precise.', '{"matter", "party_name", "ref_number"}', 'Generate legal notices', true),
(NULL, 'Blog Post', 'blog', 'Write a blog post about {{topic}} for {{audience}}. Include an introduction, 3 key points, and a conclusion. Approx 500 words.', '{"topic", "audience"}', 'Generate blog posts', true),
(NULL, 'Invoice Description', 'invoice_description', 'Write a professional invoice description for {{service}} provided to {{client}}. Duration: {{duration}}.', '{"service", "client", "duration"}', 'Generate invoice descriptions', true);