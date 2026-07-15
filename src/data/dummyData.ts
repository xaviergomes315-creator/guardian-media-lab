import {
  WhatsAppContact,
  WhatsAppGroup,
  WhatsAppTemplate,
  WhatsAppCampaign,
  WhatsAppMessage,
  WhatsAppConversation,
  WhatsAppAutoReply,
  GoogleReview,
  Invoice,
  TelecallerLead,
  TelecallerCallLog,
  TelecallerTarget,
  DailyReport,
} from '../types';

// WhatsApp Dummy Data
export const dummyWhatsAppContacts: WhatsAppContact[] = [
  { id: '1', user_id: '1', name: 'John Smith', phone: '+1 555-0101', email: 'john@techcorp.com', company: 'TechCorp Inc.', variables: { name: 'John', company: 'TechCorp' }, group_ids: ['1'], status: 'active', labels: ['VIP', 'Enterprise'], notes: 'Key decision maker', last_message_at: '2026-07-01T10:30:00Z', created_at: '2026-06-01T09:00:00Z', updated_at: '2026-07-01T10:30:00Z' },
  { id: '2', user_id: '1', name: 'Sarah Johnson', phone: '+1 555-0102', email: 'sarah@acme.com', company: 'Acme Corp', variables: { name: 'Sarah', company: 'Acme' }, group_ids: ['1', '2'], status: 'active', labels: ['Hot Lead'], notes: 'Interested in premium package', last_message_at: '2026-07-01T09:15:00Z', created_at: '2026-06-02T10:00:00Z', updated_at: '2026-07-01T09:15:00Z' },
  { id: '3', user_id: '1', name: 'Mike Chen', phone: '+1 555-0103', email: 'mike@startup.io', company: 'StartupIO', variables: { name: 'Mike', company: 'StartupIO' }, group_ids: ['2'], status: 'active', labels: [], notes: '', created_at: '2026-06-03T11:00:00Z', updated_at: '2026-06-03T11:00:00Z' },
  { id: '4', user_id: '1', name: 'Emily Davis', phone: '+1 555-0104', email: 'emily@retail.com', company: 'RetailMax', variables: { name: 'Emily', company: 'RetailMax' }, group_ids: ['3'], status: 'active', labels: ['Retail'], notes: 'Seasonal campaign contact', created_at: '2026-06-04T12:00:00Z', updated_at: '2026-06-04T12:00:00Z' },
  { id: '5', user_id: '1', name: 'David Wilson', phone: '+1 555-0105', email: 'david@finance.com', company: 'FinanceHub', variables: { name: 'David', company: 'FinanceHub' }, group_ids: ['1'], status: 'inactive', labels: ['Finance'], notes: 'Requested pause in communications', created_at: '2026-06-05T13:00:00Z', updated_at: '2026-06-20T15:00:00Z' },
];

export const dummyWhatsAppGroups: WhatsAppGroup[] = [
  { id: '1', user_id: '1', name: 'Enterprise Clients', description: 'High-value enterprise customers', contact_count: 3, created_at: '2026-06-01T08:00:00Z', updated_at: '2026-06-01T08:00:00Z' },
  { id: '2', user_id: '1', name: 'SMB Leads', description: 'Small and medium business prospects', contact_count: 2, created_at: '2026-06-02T09:00:00Z', updated_at: '2026-06-02T09:00:00Z' },
  { id: '3', user_id: '1', name: 'Retail Partners', description: 'Retail industry contacts', contact_count: 1, created_at: '2026-06-03T10:00:00Z', updated_at: '2026-06-03T10:00:00Z' },
];

export const dummyWhatsAppTemplates: WhatsAppTemplate[] = [
  { id: '1', user_id: '1', name: 'Welcome Message', content: 'Hi {{name}}! Welcome to Grow with Us. We are excited to help {{company}} grow with our AI-powered marketing solutions.', variables: ['name', 'company'], category: 'onboarding', media_type: 'text', created_at: '2026-06-01T08:00:00Z', updated_at: '2026-06-01T08:00:00Z' },
  { id: '2', user_id: '1', name: 'Campaign Follow-up', content: 'Hi {{name}}, following up on our previous conversation about digital marketing for {{company}}. Would you like to schedule a call?', variables: ['name', 'company'], category: 'follow_up', media_type: 'text', created_at: '2026-06-02T09:00:00Z', updated_at: '2026-06-02T09:00:00Z' },
  { id: '3', user_id: '1', name: 'Monthly Report', content: 'Hi {{name}}, your monthly marketing report is ready! Click here to view: {{report_link}}', variables: ['name', 'report_link'], category: 'reports', media_type: 'document', created_at: '2026-06-03T10:00:00Z', updated_at: '2026-06-03T10:00:00Z' },
 { id: '4', user_id: '1', name: 'Special Offer', content: 'Hi {{name}}! Exclusive offer for {{company}}: Get 20% off on our premium marketing package. Limited time only!', variables: ['name', 'company'], category: 'promotions', media_type: 'image', created_at: '2026-06-04T11:00:00Z', updated_at: '2026-06-04T11:00:00Z' },
];

export const dummyWhatsAppCampaigns: WhatsAppCampaign[] = [
  { id: '1', user_id: '1', name: 'June Newsletter', template_id: '1', group_ids: ['1'], message_content: 'Hi {{name}}! Welcome to Grow with Us...', scheduled_at: '2026-06-15T10:00:00Z', status: 'completed', total_contacts: 150, sent_count: 148, delivered_count: 145, read_count: 120, failed_count: 3, pending_count: 0, created_at: '2026-06-14T09:00:00Z', updated_at: '2026-06-15T11:00:00Z', completed_at: '2026-06-15T11:00:00Z' },
  { id: '2', user_id: '1', name: 'Summer Promotion', template_id: '4', group_ids: ['1', '2'], message_content: 'Exclusive summer offer...', scheduled_at: '2026-07-05T10:00:00Z', status: 'scheduled', total_contacts: 250, sent_count: 0, delivered_count: 0, read_count: 0, failed_count: 0, pending_count: 250, created_at: '2026-06-28T09:00:00Z', updated_at: '2026-06-28T09:00:00Z' },
  { id: '3', user_id: '1', name: 'Follow-up Blast', template_id: '2', group_ids: ['2'], message_content: 'Following up on our conversation...', status: 'draft', total_contacts: 80, sent_count: 0, delivered_count: 0, read_count: 0, failed_count: 0, pending_count: 0, created_at: '2026-06-29T10:00:00Z', updated_at: '2026-06-29T10:00:00Z' },
];

export const dummyWhatsAppMessages: WhatsAppMessage[] = [
  { id: '1', campaign_id: '1', contact_id: '1', user_id: '1', phone: '+1 555-0101', message: 'Hi John! Welcome to Grow with Us...', status: 'read', sent_at: '2026-06-15T10:01:00Z', delivered_at: '2026-06-15T10:02:00Z', read_at: '2026-06-15T10:15:00Z', created_at: '2026-06-15T10:01:00Z' },
  { id: '2', campaign_id: '1', contact_id: '2', user_id: '1', phone: '+1 555-0102', message: 'Hi Sarah! Welcome to Grow with Us...', status: 'delivered', sent_at: '2026-06-15T10:01:00Z', delivered_at: '2026-06-15T10:02:00Z', created_at: '2026-06-15T10:01:00Z' },
  { id: '3', campaign_id: '1', contact_id: '3', user_id: '1', phone: '+1 555-0103', message: 'Hi Mike! Welcome to Grow with Us...', status: 'failed', error_message: 'Invalid number', created_at: '2026-06-15T10:01:00Z' },
];

export const dummyWhatsAppConversations: WhatsAppConversation[] = [
  { id: '1', contact_id: '1', user_id: '1', assigned_to: '1', last_message: 'Thanks for the update!', last_message_at: '2026-07-01T10:30:00Z', unread_count: 2, labels: ['Support'], status: 'open', created_at: '2026-06-01T09:00:00Z', updated_at: '2026-07-01T10:30:00Z', contact: dummyWhatsAppContacts[0] },
  { id: '2', contact_id: '2', user_id: '1', last_message: 'When can we schedule a call?', last_message_at: '2026-07-01T09:15:00Z', unread_count: 0, labels: ['Sales'], status: 'open', created_at: '2026-06-02T10:00:00Z', updated_at: '2026-07-01T09:15:00Z', contact: dummyWhatsAppContacts[1] },
  { id: '3', contact_id: '4', user_id: '1', last_message: 'Looking forward to the campaign results', last_message_at: '2026-06-30T16:00:00Z', unread_count: 1, labels: [], status: 'pending', created_at: '2026-06-04T12:00:00Z', updated_at: '2026-06-30T16:00:00Z', contact: dummyWhatsAppContacts[3] },
];

export const dummyAutoReplies: WhatsAppAutoReply[] = [
  { id: '1', user_id: '1', trigger_keyword: 'hello', reply_message: 'Hi! Thanks for reaching out. Our team will get back to you shortly.', is_active: true, created_at: '2026-06-01T08:00:00Z' },
  { id: '2', user_id: '1', trigger_keyword: 'pricing', reply_message: 'You can find our pricing at growwithus.com/pricing or reply with "call me" to schedule a consultation.', is_active: true, created_at: '2026-06-01T08:00:00Z' },
];

// Google Reviews Dummy Data
export const dummyGoogleReviews: GoogleReview[] = [
  { id: '1', user_id: '1', google_review_id: 'gr001', reviewer_name: 'Amanda Foster', reviewer_photo: 'https://images.pexels.com/photo-7749094?w=50&h=50', rating: 5, review_text: 'Grow with Us transformed our online presence. Our leads increased by 300% in just 3 months!', reply_text: 'Thank you so much, Amanda! It has been a pleasure working with FinancePro. Your partnership means the world to us!', replied_at: '2026-06-28T14:00:00Z', replied_by: '1', review_date: '2026-06-27T10:00:00Z', status: 'replied', location_name: 'Lucknow', starred: true, created_at: '2026-06-27T10:00:00Z', updated_at: '2026-06-28T14:00:00Z' },
  { id: '2', user_id: '1', google_review_id: 'gr002', reviewer_name: 'Robert Chang', reviewer_photo: 'https://images.pexels.com/photo-2204534?w=50&h=50', rating: 4, review_text: 'Great service and responsive team. Would recommend for any business looking to scale.', reply_text: 'Thanks Robert! We appreciate your feedback and look forward to continuing our partnership.', replied_at: '2026-06-29T09:00:00Z', replied_by: '1', review_date: '2026-06-28T15:00:00Z', status: 'replied', location_name: 'Lucknow', starred: false, created_at: '2026-06-28T15:00:00Z', updated_at: '2026-06-29T09:00:00Z' },
  { id: '3', user_id: '1', google_review_id: 'gr003', reviewer_name: 'Lisa Martinez', reviewer_photo: '', rating: 5, review_text: 'Professional, knowledgeable, and results-driven. The best marketing agency we have worked with!', review_date: '2026-07-01T08:00:00Z', status: 'pending_reply', location_name: 'Lucknow', starred: true, created_at: '2026-07-01T08:00:00Z', updated_at: '2026-07-01T08:00:00Z' },
  { id: '4', user_id: '1', google_review_id: 'gr004', reviewer_name: 'James Wilson', reviewer_photo: '', rating: 3, review_text: 'Good service but communication could be improved. Took a while to get responses sometimes.', review_date: '2026-07-01T09:00:00Z', status: 'new', location_name: 'Lucknow', starred: false, created_at: '2026-07-01T09:00:00Z', updated_at: '2026-07-01T09:00:00Z' },
  { id: '5', user_id: '1', google_review_id: 'gr005', reviewer_name: 'Emily Thompson', reviewer_photo: 'https://images.pexels.com/photo-1239291?w=50&h=50', rating: 5, review_text: 'They truly understand digital marketing. Our social media engagement has never been better!', reply_text: 'Thank you, Emily! It has been amazing seeing your brand grow online. Your engagement metrics are fantastic!', replied_at: '2026-06-30T11:00:00Z', replied_by: '1', review_date: '2026-06-30T08:00:00Z', status: 'replied', location_name: 'Lucknow', starred: true, created_at: '2026-06-30T08:00:00Z', updated_at: '2026-06-30T11:00:00Z' },
  { id: '6', user_id: '1', google_review_id: 'gr006', reviewer_name: 'David Brown', reviewer_photo: '', rating: 1, review_text: 'Very disappointed with the results. Expected much more for what we paid.', review_date: '2026-06-29T16:00:00Z', status: 'new', location_name: 'Lucknow', starred: false, created_at: '2026-06-29T16:00:00Z', updated_at: '2026-06-29T16:00:00Z' },
];

// Invoice Dummy Data
export const dummyInvoices: Invoice[] = [
  { id: '1', user_id: '1', client_id: '1', invoice_number: 'INV-2026-001', invoice_number_prefix: 'INV', invoice_number_suffix: 1, amount: 15000, subtotal: 12711.86, tax_amount: 2288.14, cgst: 1144.07, sgst: 1144.07, igst: 0, discount_amount: 0, round_off: 0, status: 'paid', due_date: '2026-06-30', paid_date: '2026-06-28', notes: 'Monthly retainer for June 2026', terms: 'Payment due within 15 days', email_sent: true, email_sent_at: '2026-06-15T09:00:00Z', gst_type: 'intra', created_at: '2026-06-15T08:00:00Z', updated_at: '2026-06-28T14:00:00Z' },
  { id: '2', user_id: '1', client_id: '2', invoice_number: 'INV-2026-002', invoice_number_prefix: 'INV', invoice_number_suffix: 2, amount: 8500, subtotal: 7203.39, tax_amount: 1296.61, cgst: 648.31, sgst: 648.3, igst: 0, discount_amount: 0, round_off: 0, status: 'sent', due_date: '2026-07-15', notes: 'Website development phase 2', terms: 'Payment due within 15 days', email_sent: true, email_sent_at: '2026-06-20T10:00:00Z', gst_type: 'intra', created_at: '2026-06-20T09:00:00Z', updated_at: '2026-06-20T10:00:00Z' },
  { id: '3', user_id: '1', client_id: '3', invoice_number: 'INV-2026-003', invoice_number_prefix: 'INV', invoice_number_suffix: 3, amount: 25000, subtotal: 21186.44, tax_amount: 3813.56, cgst: 1906.78, sgst: 1906.78, igst: 0, discount_amount: 0, round_off: 0, status: 'overdue', due_date: '2026-06-25', notes: 'Annual marketing package', terms: 'Payment due within 15 days', email_sent: true, email_sent_at: '2026-06-10T08:00:00Z', gst_type: 'intra', created_at: '2026-06-10T07:00:00Z', updated_at: '2026-06-26T00:00:00Z' },
  { id: '4', user_id: '1', client_id: '4', invoice_number: 'INV-2026-004', invoice_number_prefix: 'INV', invoice_number_suffix: 4, amount: 5500, subtotal: 4661.02, tax_amount: 838.98, cgst: 419.49, sgst: 419.49, igst: 0, discount_amount: 0, round_off: 0, status: 'draft', notes: 'Social media campaign July', terms: 'Payment due within 15 days', gst_type: 'intra', created_at: '2026-07-01T08:00:00Z', updated_at: '2026-07-01T08:00:00Z' },
  { id: '5', user_id: '1', client_id: '1', invoice_number: 'INV-2026-005', invoice_number_prefix: 'INV', invoice_number_suffix: 5, amount: 12000, subtotal: 10169.49, tax_amount: 1830.51, cgst: 915.25, sgst: 915.26, igst: 0, discount_amount: 0, round_off: 0, status: 'sent', due_date: '2026-07-31', notes: 'Monthly retainer for July 2026', terms: 'Payment due within 15 days', email_sent: false, gst_type: 'intra', created_at: '2026-07-01T09:00:00Z', updated_at: '2026-07-01T09:00:00Z' },
];

// Telecaller Dummy Data
export const dummyTelecallerLeads: TelecallerLead[] = [
  { id: '1', lead_id: '1', assigned_to: '1', priority: 1, call_status: 'interested', last_call_at: '2026-07-01T10:00:00Z', total_calls: 3, notes: 'Very interested in premium package', created_at: '2026-06-01T08:00:00Z', updated_at: '2026-07-01T10:00:00Z' },
  { id: '2', lead_id: '2', assigned_to: '1', priority: 2, call_status: 'follow_up', last_call_at: '2026-06-30T14:00:00Z', total_calls: 2, notes: 'Follow-up scheduled for next week', created_at: '2026-06-02T09:00:00Z', updated_at: '2026-06-30T14:00:00Z' },
  { id: '3', lead_id: '3', assigned_to: '1', priority: 3, call_status: 'pending', total_calls: 0, notes: '', created_at: '2026-06-03T10:00:00Z', updated_at: '2026-06-03T10:00:00Z' },
  { id: '4', lead_id: '4', assigned_to: '1', priority: 1, call_status: 'converted', last_call_at: '2026-06-28T16:00:00Z', total_calls: 5, notes: 'Converted - signed contract', created_at: '2026-06-04T11:00:00Z', updated_at: '2026-06-28T16:00:00Z' },
  { id: '5', lead_id: '5', assigned_to: '1', priority: 2, call_status: 'lost', last_call_at: '2026-06-29T11:00:00Z', total_calls: 4, notes: 'Chose competitor', created_at: '2026-06-05T12:00:00Z', updated_at: '2026-06-29T11:00:00Z' },
];

export const dummyCallLogs: TelecallerCallLog[] = [
  { id: '1', user_id: '1', telecaller_lead_id: '1', contact_name: 'John Smith', phone: '+1 555-0101', call_status: 'connected', outcome: 'interested', duration_seconds: 180, notes: 'Discussed premium package - positive response', created_at: '2026-07-01T10:00:00Z' },
  { id: '2', user_id: '1', telecaller_lead_id: '2', contact_name: 'Sarah Johnson', phone: '+1 555-0102', call_status: 'connected', outcome: 'follow_up', duration_seconds: 240, notes: 'Needs more time to review proposal', scheduled_follow_up: '2026-07-08T14:00:00Z', created_at: '2026-06-30T14:00:00Z' },
  { id: '3', user_id: '1', telecaller_lead_id: '3', contact_name: 'Mike Chen', phone: '+1 555-0103', call_status: 'busy', notes: 'Line busy - callback scheduled', scheduled_follow_up: '2026-07-02T10:00:00Z', created_at: '2026-06-29T11:00:00Z' },
  { id: '4', user_id: '1', telecaller_lead_id: '4', contact_name: 'Emily Davis', phone: '+1 555-0104', call_status: 'connected', outcome: 'converted', duration_seconds: 600, notes: 'Contract signed - 12 month engagement', created_at: '2026-06-28T16:00:00Z' },
  { id: '5', user_id: '1', telecaller_lead_id: '5', contact_name: 'David Wilson', phone: '+1 555-0105', call_status: 'connected', outcome: 'lost', duration_seconds: 120, notes: 'Already signed with competitor', created_at: '2026-06-29T11:00:00Z' },
];

export const dummyTelecallerTargets: TelecallerTarget[] = [
  { id: '1', user_id: '1', target_type: 'daily', calls_target: 50, connected_target: 25, leads_target: 10, conversion_target: 2, actual_calls: 45, actual_connected: 22, actual_leads: 8, actual_conversions: 2, start_date: '2026-07-01', end_date: '2026-07-01', created_at: '2026-06-30T08:00:00Z', updated_at: '2026-07-01T15:00:00Z' },
  { id: '2', user_id: '1', target_type: 'weekly', calls_target: 250, connected_target: 125, leads_target: 50, conversion_target: 10, actual_calls: 180, actual_connected: 90, actual_leads: 35, actual_conversions: 7, start_date: '2026-06-28', end_date: '2026-07-04', created_at: '2026-06-27T08:00:00Z', updated_at: '2026-07-01T15:00:00Z' },
  { id: '3', user_id: '1', target_type: 'monthly', calls_target: 1000, connected_target: 500, leads_target: 200, conversion_target: 40, actual_calls: 150, actual_connected: 75, actual_leads: 30, actual_conversions: 6, start_date: '2026-07-01', end_date: '2026-07-31', created_at: '2026-06-30T08:00:00Z', updated_at: '2026-07-01T15:00:00Z' },
];

export const dummyDailyReports: DailyReport[] = [
  { id: '1', user_id: '1', date: '2026-07-01', total_calls: 45, connected_calls: 22, interested_count: 5, follow_up_count: 8, converted_count: 1, lost_count: 0, summary: 'Good day with positive pipeline growth', created_at: '2026-07-01T17:00:00Z' },
  { id: '2', user_id: '1', date: '2026-06-30', total_calls: 52, connected_calls: 28, interested_count: 6, follow_up_count: 10, converted_count: 2, lost_count: 1, summary: 'Exceeded daily targets', manager_review: 'Excellent performance!', reviewed_by: '2', reviewed_at: '2026-07-01T09:00:00Z', created_at: '2026-06-30T17:00:00Z' },
  { id: '3', user_id: '1', date: '2026-06-29', total_calls: 40, connected_calls: 18, interested_count: 4, follow_up_count: 5, converted_count: 0, lost_count: 2, summary: 'Average day, need improvement', created_at: '2026-06-29T17:00:00Z' },
];

// Notification Dummy Data
export const dummyNotifications = [
  { id: '1', user_id: '1', title: 'New WhatsApp Lead', message: 'John Smith sent a message via WhatsApp', type: 'whatsapp', read: false, action_url: '/dashboard/whatsapp', created_at: '2026-07-01T10:30:00Z' },
  { id: '2', user_id: '1', title: 'New Google Review', message: 'Lisa Martinez left a 5-star review', type: 'review', read: false, action_url: '/dashboard/reviews', created_at: '2026-07-01T08:00:00Z' },
  { id: '3', user_id: '1', title: 'Invoice Overdue', message: 'Invoice INV-2026-003 is 6 days overdue', type: 'invoice', read: false, action_url: '/dashboard/invoices', created_at: '2026-07-01T00:00:00Z' },
  { id: '4', user_id: '1', title: 'Follow-up Reminder', message: 'Callback scheduled with Sarah Johnson at 2:00 PM', type: 'follow_up', read: false, action_url: '/dashboard/telecaller', created_at: '2026-07-01T07:00:00Z' },
  { id: '5', user_id: '1', title: 'Campaign Completed', message: 'June Newsletter campaign finished with 96% delivery rate', type: 'whatsapp', read: true, action_url: '/dashboard/whatsapp', created_at: '2026-06-15T11:05:00Z' },
  { id: '6', user_id: '1', title: 'New Lead Assigned', message: 'TechCorp Inc. has been assigned to you', type: 'lead', read: true, action_url: '/dashboard/leads', created_at: '2026-06-28T09:00:00Z' },
];

// Report Data
export const reportData = {
  whatsapp: {
    campaignsByMonth: [
      { month: 'Jan', sent: 1200, delivered: 1150, read: 980 },
      { month: 'Feb', sent: 1500, delivered: 1420, read: 1180 },
      { month: 'Mar', sent: 1800, delivered: 1700, read: 1450 },
      { month: 'Apr', sent: 1650, delivered: 1580, read: 1320 },
      { month: 'May', sent: 2000, delivered: 1900, read: 1650 },
      { month: 'Jun', sent: 2200, delivered: 2100, read: 1890 },
    ],
    deliveryRate: 95.5,
    readRate: 82.3,
  },
  reviews: {
    reviewsByMonth: [
      { month: 'Jan', positive: 8, negative: 2 },
      { month: 'Feb', positive: 10, negative: 1 },
      { month: 'Mar', positive: 12, negative: 3 },
      { month: 'Apr', positive: 9, negative: 2 },
      { month: 'May', positive: 15, negative: 1 },
      { month: 'Jun', positive: 18, negative: 2 },
    ],
    averageRating: 4.6,
    responseRate: 92,
  },
  invoices: {
    revenueByMonth: [
      { month: 'Jan', revenue: 45000, paid: 42000 },
      { month: 'Feb', revenue: 52000, paid: 50000 },
      { month: 'Mar', revenue: 48000, paid: 45000 },
      { month: 'Apr', revenue: 61000, paid: 58000 },
      { month: 'May', revenue: 55000, paid: 52000 },
      { month: 'Jun', revenue: 67000, paid: 62000 },
    ],
    totalRevenue: 328000,
    paidInvoices: 45,
    pendingInvoices: 12,
    overdueInvoices: 3,
  },
  telecaller: {
    performanceByDay: [
      { day: 'Mon', calls: 45, connected: 22, conversions: 2 },
      { day: 'Tue', calls: 52, connected: 28, conversions: 3 },
      { day: 'Wed', calls: 48, connected: 24, conversions: 1 },
      { day: 'Thu', calls: 55, connected: 30, conversions: 2 },
      { day: 'Fri', calls: 40, connected: 20, conversions: 2 },
    ],
    conversionRate: 12.5,
    avgCallsPerDay: 48,
  },
};
