/*
# Company Settings Schema

1. New Table
- `company_settings` - Single row table for company configuration

2. Fields
- Company identification (name, logo, GST, PAN)
- Contact information (address, email, phone, website)
- Invoice settings (prefix, currency, financial year)
- Localization (timezone)
- Audit fields (created_at, updated_at)

3. Security
- RLS enabled with admin-only access
- Single row constraint (only one company setting allowed)
*/

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Identity
  company_name TEXT NOT NULL DEFAULT 'Guardian Media Lab',
  company_logo_url TEXT,
  tagline TEXT,
  
  -- Registration Details
  gst_number TEXT,
  pan_number TEXT,
  cin_number TEXT,
  msme_number TEXT,
  
  -- Contact Information
  address TEXT,
  city TEXT DEFAULT 'Mumbai',
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT,
  country TEXT DEFAULT 'India',
  
  email TEXT,
  phone TEXT,
  alternate_phone TEXT,
  website TEXT,
  
  -- Invoice Settings
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_suffix_start INTEGER DEFAULT 1,
  quote_prefix TEXT DEFAULT 'QUO',
  
  -- Financial Settings
  currency TEXT DEFAULT 'INR',
  currency_symbol TEXT DEFAULT '₹',
  financial_year_start INTEGER DEFAULT 4, -- April
  financial_year_month INTEGER DEFAULT 1, -- Starts from April 1st
  
  -- Localization
  timezone TEXT DEFAULT 'Asia/Kolkata',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  
  -- Bank Details
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_branch TEXT,
  upi_id TEXT,
  
  -- Terms & Conditions
  default_terms TEXT,
  default_notes TEXT,
  
  -- Social Media
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure only one row exists
  CONSTRAINT single_row_constraint CHECK (id IS NOT NULL)
);

-- Create unique index to enforce single row
CREATE UNIQUE INDEX IF NOT EXISTS one_row_only ON company_settings ((id IS NOT NULL));

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "company_settings_select" ON company_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "company_settings_insert" ON company_settings FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

CREATE POLICY "company_settings_update" ON company_settings FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

CREATE POLICY "company_settings_delete" ON company_settings FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin'));

-- Insert default row
INSERT INTO company_settings (
  company_name, address, city, state, pincode, country, email, phone, website
) VALUES (
  'Guardian Media Lab',
  'Office No. 201, 2nd Floor, XYZ Business Park',
  'Mumbai',
  'Maharashtra',
  '400001',
  'India',
  'info@guardianmedialab.com',
  '+91 98765 43210',
  'https://guardianmedialab.com'
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_settings_updated_at ON company_settings;
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
