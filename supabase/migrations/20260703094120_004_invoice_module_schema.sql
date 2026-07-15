/*
# Guardian Media Lab - Invoice Management Module Schema

Enhanced invoice system with:
- invoice_items - Line items for each invoice
- invoice_payments - Payment tracking
- Enhanced invoices table with GST fields
- RLS policies for all tables
*/

-- Update invoices table to add missing columns
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number_prefix TEXT DEFAULT 'INV';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number_suffix INTEGER DEFAULT 1;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cgst DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sgst DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS igst DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS round_off DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS place_of_supply TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gst_type TEXT DEFAULT 'intra' CHECK (gst_type IN ('intra', 'inter'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update invoice status to include more states
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'));

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hsn_sac TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 18,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice_payments table
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other')),
  transaction_id TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Invoice Items policies
DROP POLICY IF EXISTS "invoice_items_select" ON invoice_items;
CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id));

DROP POLICY IF EXISTS "invoice_items_insert" ON invoice_items;
CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')))));

DROP POLICY IF EXISTS "invoice_items_update" ON invoice_items;
CREATE POLICY "invoice_items_update" ON invoice_items FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')))));

DROP POLICY IF EXISTS "invoice_items_delete" ON invoice_items;
CREATE POLICY "invoice_items_delete" ON invoice_items FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')))));

-- Invoice Payments policies
DROP POLICY IF EXISTS "invoice_payments_select" ON invoice_payments;
CREATE POLICY "invoice_payments_select" ON invoice_payments FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_payments.invoice_id));

DROP POLICY IF EXISTS "invoice_payments_insert" ON invoice_payments;
CREATE POLICY "invoice_payments_insert" ON invoice_payments FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')))));

DROP POLICY IF EXISTS "invoice_payments_update" ON invoice_payments;
CREATE POLICY "invoice_payments_update" ON invoice_payments FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager')));

DROP POLICY IF EXISTS "invoice_payments_delete" ON invoice_payments;
CREATE POLICY "invoice_payments_delete" ON invoice_payments FOR DELETE TO authenticated 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('super_admin', 'admin')));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_user_id ON invoice_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT := 'INV';
  v_suffix INTEGER;
  v_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
BEGIN
  SELECT COALESCE(MAX(invoice_number_suffix), 0) + 1 
  INTO v_suffix 
  FROM invoices 
  WHERE user_id = p_user_id 
    AND invoice_number_suffix IS NOT NULL;
  
  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_suffix::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;