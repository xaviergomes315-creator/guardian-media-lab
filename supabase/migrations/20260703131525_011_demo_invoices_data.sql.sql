-- Insert demo clients for invoices (using the auth.users id from profiles)
INSERT INTO clients (id, user_id, company_name, contact_person, email, phone, address, gst_number, status, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111001', 'a7552db8-5108-4e86-978f-2fcea0cb8c6a', 'Sharma Traders', 'Rahul Sharma', 'rahul@sharmatraders.com', '+91 9876543210', 'A-123, Hazratganj, Lucknow, UP - 226001', '09ABCDE1234F1Z5', 'active', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111002', 'a7552db8-5108-4e86-978f-2fcea0cb8c6a', 'Royal Enterprises', 'Vikram Singh', 'vikram@royalenterprises.com', '+91 9876543211', 'B-45, Mall Road, Kanpur, UP - 208001', '09PQRSX5678K1Z2', 'active', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111003', 'a7552db8-5108-4e86-978f-2fcea0cb8c6a', 'Verma Industries', 'Amit Verma', 'amit@vermaindustries.com', '+91 9876543212', 'C-78, Gomti Nagar, Lucknow, UP - 226010', '09LMNOP9876Q1Z8', 'active', NOW(), NOW());

-- Insert demo invoices
-- Invoice 1: INV-2026-001, Sharma Traders, Paid, Total ₹31,860
INSERT INTO invoices (id, user_id, client_id, invoice_number, amount, subtotal, cgst, sgst, igst, tax_amount, status, due_date, paid_date, items, notes, created_at, updated_at, gst_type, place_of_supply)
VALUES (
  '22222222-2222-2222-2222-222222222001',
  'a7552db8-5108-4e86-978f-2fcea0cb8c6a',
  '11111111-1111-1111-1111-111111111001',
  'INV-2026-001',
  31860,
  27000,
  2430,
  2430,
  0,
  4860,
  'paid',
  '2026-07-10',
  '2026-07-03',
  '[{"description":"Social Media Management","quantity":1,"rate":15000,"amount":15000},{"description":"Meta Ads Campaign","quantity":1,"rate":12000,"amount":12000}]'::jsonb,
  'Payment received via UPI',
  NOW(),
  NOW(),
  'intra',
  'Uttar Pradesh'
);

-- Invoice 2: INV-2026-002, Royal Enterprises, Pending, Total ₹44,840
INSERT INTO invoices (id, user_id, client_id, invoice_number, amount, subtotal, cgst, sgst, igst, tax_amount, status, due_date, items, notes, created_at, updated_at, gst_type, place_of_supply)
VALUES (
  '22222222-2222-2222-2222-222222222002',
  'a7552db8-5108-4e86-978f-2fcea0cb8c6a',
  '11111111-1111-1111-1111-111111111002',
  'INV-2026-002',
  44840,
  38000,
  3420,
  3420,
  0,
  6840,
  'sent',
  '2026-07-15',
  '[{"description":"Website Development","quantity":1,"rate":35000,"amount":35000},{"description":"Hosting (Annual)","quantity":1,"rate":3000,"amount":3000}]'::jsonb,
  'Net banking payment expected',
  NOW(),
  NOW(),
  'intra',
  'Uttar Pradesh'
);

-- Invoice 3: INV-2026-003, Verma Industries, Partial Payment, Total ₹44,840
INSERT INTO invoices (id, user_id, client_id, invoice_number, amount, subtotal, cgst, sgst, igst, tax_amount, status, due_date, items, notes, created_at, updated_at, gst_type, place_of_supply)
VALUES (
  '22222222-2222-2222-2222-222222222003',
  'a7552db8-5108-4e86-978f-2fcea0cb8c6a',
  '11111111-1111-1111-1111-111111111003',
  'INV-2026-003',
  44840,
  38000,
  3420,
  3420,
  0,
  6840,
  'partially_paid',
  '2026-07-20',
  '[{"description":"SEO Package","quantity":1,"rate":18000,"amount":18000},{"description":"Google Ads Management","quantity":1,"rate":20000,"amount":20000}]'::jsonb,
  'Partial payment of ₹20000 received',
  NOW(),
  NOW(),
  'intra',
  'Uttar Pradesh'
);
