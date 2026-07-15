// Existing types
export type UserRole = 'super_admin' | 'admin' | 'telecaller' | 'accountant' | 'client';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  department: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'interested' | 'proposal_sent' | 'won' | 'lost';

export type LeadSourceType =
  | 'website_form'
  | 'facebook_lead_ads'
  | 'google_lead_form'
  | 'justdial'
  | 'indiamart'
  | 'whatsapp'
  | 'email'
  | 'api_webhook'
  | 'manual_import';

export type LeadSyncStatus = 'pending' | 'synced' | 'failed' | 'duplicate';

export interface LeadIntegration {
  id: string;
  user_id: string;
  platform: LeadSourceType;
  connection_name: string;
  is_connected: boolean;
  credentials: Record<string, unknown>;
  config: Record<string, unknown>;
  last_synced_at: string | null;
  total_leads_imported: number;
  status: 'active' | 'paused' | 'error';
  created_at: string;
  updated_at: string;
}

export interface LeadImportLog {
  id: string;
  user_id: string;
  integration_id: string | null;
  platform: string;
  total_rows: number;
  imported_count: number;
  duplicate_count: number;
  failed_count: number;
  status: 'pending' | 'completed' | 'failed' | 'partial';
  error_message: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  source: string;
  status: LeadStatus;
  estimated_value: number;
  notes: string | null;
  assigned_to: string | null;
  assigned_at?: string | null;
  created_at: string;
  updated_at: string;
  lead_source?: LeadSourceType | null;
  platform?: string | null;
  campaign_name?: string | null;
  website_name?: string | null;
  external_lead_id?: string | null;
  sync_status?: LeadSyncStatus | null;
  imported_at?: string | null;
}

export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  address: string | null;
  gst_number: string | null;
  pan_number: string | null;
  services: string[];
  status: 'active' | 'inactive' | 'pending';
  total_revenue: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  tasks?: Task[];
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'other';
export type GSTType = 'intra' | 'inter';

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string;
  invoice_number_prefix?: string;
  invoice_number_suffix?: number;
  amount: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  round_off: number;
  status: InvoiceStatus;
  due_date?: string | null;
  paid_date?: string | null;
  notes?: string;
  terms?: string;
  pdf_url?: string;
  email_sent?: boolean;
  email_sent_at?: string;
  place_of_supply?: string;
  reverse_charge?: boolean;
  gst_type: GSTType;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  hsn_sac?: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_rate: number;
  amount: number;
  created_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string | null;
  type: string;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  user_id: string;
  type: 'call' | 'email' | 'meeting' | 'other';
  notes: string | null;
  scheduled_at: string | null;
  completed: boolean;
  created_at: string;
}

export interface CallHistory {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  user_id: string;
  contact_name: string;
  phone: string | null;
  duration_seconds: number | null;
  notes: string | null;
  outcome: string | null;
  created_at: string;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  user_id: string;
  name: string;
  type: string | null;
  url: string | null;
  size: number | null;
  created_at: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ['all'],
  admin: ['dashboard', 'crm', 'leads', 'clients', 'projects', 'team', 'tasks', 'social', 'whatsapp', 'reviews', 'invoices', 'reports', 'settings', 'telecaller', 'notifications', 'gst', 'ai', 'portal', 'lead_integrations'],
  telecaller: ['dashboard', 'telecaller', 'leads', 'clients', 'notifications', 'tasks', 'lead_integrations'],
  accountant: ['dashboard', 'invoices', 'gst', 'reports', 'clients', 'notifications', 'tasks'],
  client: ['dashboard', 'notifications'],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  telecaller: 'Telecaller',
  accountant: 'Accountant',
  client: 'Client',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-yellow-500',
  follow_up: 'bg-orange-500',
  interested: 'bg-purple-500',
  proposal_sent: 'bg-cyan-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow-up',
  interested: 'Interested',
  proposal_sent: 'Proposal Sent',
  won: 'Won',
  lost: 'Lost',
};

// WhatsApp Types
export type WhatsAppContactStatus = 'active' | 'blocked' | 'inactive';
export type WhatsAppMediaType = 'text' | 'image' | 'video' | 'document';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'cancelled';
export type MessageStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  variables: Record<string, string>;
  group_ids: string[];
  status: WhatsAppContactStatus;
  labels: string[];
  notes?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppGroup {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
  media_type?: WhatsAppMediaType;
  media_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppCampaign {
  id: string;
  user_id: string;
  name: string;
  template_id?: string;
  group_ids: string[];
  message_content: string;
  media_type?: WhatsAppMediaType;
  media_url?: string;
  media_caption?: string;
  scheduled_at?: string;
  status: CampaignStatus;
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  pending_count: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface WhatsAppMessage {
  id: string;
  campaign_id?: string;
  contact_id?: string;
  user_id: string;
  phone: string;
  message: string;
  media_type?: WhatsAppMediaType;
  media_url?: string;
  status: MessageStatus;
  error_message?: string;
  external_message_id?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export type ConversationStatus = 'open' | 'closed' | 'pending';

export interface WhatsAppConversation {
  id: string;
  contact_id: string;
  user_id: string;
  assigned_to?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  labels: string[];
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  contact?: WhatsAppContact;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id?: string;
  sender_type: 'contact' | 'user' | 'system';
  message: string;
  media_type?: string;
  media_url?: string;
  read: boolean;
  created_at: string;
}

export interface WhatsAppAutoReply {
  id: string;
  user_id: string;
  trigger_keyword: string;
  reply_message: string;
  is_active: boolean;
  created_at: string;
}

// WhatsApp Status Constants
export const WHATSAPP_CONTACT_STATUS_COLORS: Record<WhatsAppContactStatus, string> = {
  active: 'bg-green-500',
  blocked: 'bg-red-500',
  inactive: 'bg-gray-500',
};

export const WHATSAPP_CONTACT_STATUS_LABELS: Record<WhatsAppContactStatus, string> = {
  active: 'Active',
  blocked: 'Blocked',
  inactive: 'Inactive',
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-gray-500',
  scheduled: 'bg-yellow-500',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  paused: 'bg-orange-500',
  cancelled: 'bg-red-500',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  running: 'Running',
  completed: 'Completed',
  paused: 'Paused',
  cancelled: 'Cancelled',
};

export const MESSAGE_STATUS_COLORS: Record<MessageStatus, string> = {
  pending: 'bg-gray-500',
  queued: 'bg-yellow-500',
  sent: 'bg-blue-500',
  delivered: 'bg-green-500',
  read: 'bg-cyan-500',
  failed: 'bg-red-500',
};

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Pending',
  queued: 'Queued',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
};

// Google Review Types
export type ReviewStatus = 'new' | 'replied' | 'pending_reply';
export type ReviewTemplateCategory = 'positive' | 'neutral' | 'negative' | 'general';
export type ReviewSyncInterval = 'hourly' | 'daily' | 'weekly';

export interface GoogleReview {
  id: string;
  user_id: string;
  google_review_id?: string;
  reviewer_name: string;
  reviewer_photo?: string;
  rating: number;
  review_text?: string;
  reply_text?: string;
  replied_at?: string;
  replied_by?: string;
  review_date: string;
  status: ReviewStatus;
  location_name?: string;
  starred: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewReplyTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  category: ReviewTemplateCategory;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewSettings {
  id: string;
  user_id: string;
  is_connected: boolean;
  business_name: string | null;
  location: string | null;
  auto_sync: boolean;
  sync_interval: ReviewSyncInterval;
  notify_new_reviews: boolean;
  notify_negative_reviews: boolean;
  notify_pending_replies: boolean;
  last_synced_at: string | null;
  total_reviews_synced?: number;
  sync_status?: string;
  sync_error?: string | null;
  created_at: string;
  updated_at: string;
}

export const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  replied: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending_reply: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  new: 'New',
  replied: 'Replied',
  pending_reply: 'Pending Reply',
};

export const REVIEW_TEMPLATE_CATEGORY_COLORS: Record<ReviewTemplateCategory, string> = {
  positive: 'bg-green-500/20 text-green-400 border-green-500/30',
  neutral: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  negative: 'bg-red-500/20 text-red-400 border-red-500/30',
  general: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const REVIEW_TEMPLATE_CATEGORY_LABELS: Record<ReviewTemplateCategory, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  general: 'General',
};

export const REVIEW_SYNC_INTERVAL_LABELS: Record<ReviewSyncInterval, string> = {
  hourly: 'Every Hour',
  daily: 'Daily',
  weekly: 'Weekly',
};

// Telecaller Types
export type CallOutcome = 'interested' | 'follow_up' | 'converted' | 'lost' | 'callback' | 'no_answer';
export type CallStatus = 'pending' | 'connected' | 'not_connected' | 'busy' | 'switched_off' | 'interested' | 'follow_up' | 'converted' | 'lost';
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave';

export interface TelecallerLead {
  id: string;
  lead_id: string;
  assigned_to: string;
  priority: number;
  call_status: CallStatus;
  last_call_at?: string;
  total_calls: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  lead?: Lead;
}

export interface TelecallerCallLog {
  id: string;
  user_id: string;
  lead_id?: string;
  telecaller_lead_id?: string;
  contact_name: string;
  phone: string;
  call_status: 'connected' | 'not_connected' | 'busy' | 'switched_off' | 'invalid';
  outcome?: CallOutcome;
  duration_seconds?: number;
  notes?: string;
  recording_url?: string;
  scheduled_follow_up?: string;
  created_at: string;
}

export interface TelecallerTarget {
  id: string;
  user_id: string;
  target_type: 'daily' | 'weekly' | 'monthly';
  calls_target: number;
  connected_target: number;
  leads_target: number;
  conversion_target: number;
  actual_calls: number;
  actual_connected: number;
  actual_leads: number;
  actual_conversions: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface TelecallerAttendance {
  id: string;
  user_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: AttendanceStatus;
  total_calls: number;
  total_connected: number;
  working_hours: number;
  notes?: string;
  created_at: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  total_calls: number;
  connected_calls: number;
  interested_count: number;
  follow_up_count: number;
  converted_count: number;
  lost_count: number;
  summary?: string;
  manager_review?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export const CALL_STATUS_COLORS: Record<CallStatus, string> = {
  pending: 'bg-gray-500',
  connected: 'bg-green-500',
  not_connected: 'bg-red-500',
  busy: 'bg-yellow-500',
  switched_off: 'bg-orange-500',
  interested: 'bg-purple-500',
  follow_up: 'bg-blue-500',
  converted: 'bg-emerald-500',
  lost: 'bg-red-600',
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  pending: 'Pending',
  connected: 'Connected',
  not_connected: 'Not Connected',
  busy: 'Busy',
  switched_off: 'Switched Off',
  interested: 'Interested',
  follow_up: 'Follow-up',
  converted: 'Converted',
  lost: 'Lost',
};

// Social Media Types (canonical definitions at line ~1262 below)
export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';

export interface ContentCalendar {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  posts: string[];
  created_at: string;
  updated_at: string;
}

// Team Types
export interface TeamMember {
  id: string;
  user_id: string;
  profile: Profile;
  department: string;
  designation: string;
  reporting_to?: string;
  join_date: string;
  salary?: number;
  skills: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: AttendanceStatus;
  working_hours: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetric {
  id: string;
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  tasks_completed: number;
  tasks_assigned: number;
  leads_generated: number;
  leads_converted: number;
  revenue_generated: number;
  client_satisfaction: number;
  created_at: string;
}

// Agency Settings Types
export interface AgencySettings {
  id: string;
  user_id: string;
  agency_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  pan_number?: string;
  website?: string;
  social_links?: Record<string, string>;
  invoice_prefix: string;
  invoice_terms?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  lead_alerts: boolean;
  task_reminders: boolean;
  invoice_alerts: boolean;
  weekly_reports: boolean;
  marketing_emails: boolean;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  password_expiry_days: number;
  login_alerts: boolean;
  ip_whitelist: string[];
}

export const SOCIAL_PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  tiktok: '#000000',
};

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

// GST Types
export type GSTClientStatus = 'active' | 'inactive' | 'suspended';
export type GSTClientType = 'regular' | 'composition' | 'unregistered';
export type GSTReturnType = 'GSTR1' | 'GSTR3B' | 'GSTR9' | 'GSTR4' | 'GSTR5' | 'GSTR6' | 'GSTR7' | 'GSTR8' | 'GSTR9C' | 'GSTR10';
export type GSTReturnStatus = 'pending' | 'filed' | 'overdue' | 'cancelled';

export interface GSTClient {
  id: string;
  user_id: string;
  company_name: string;
  gst_number: string;
  pan_number: string | null;
  contact_person: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  state: string | null;
  gst_type: GSTClientType;
  registration_date: string | null;
  status: GSTClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GSTReturn {
  id: string;
  user_id: string;
  client_id: string;
  return_type: GSTReturnType;
  filing_period: string;
  due_date: string;
  filing_date: string | null;
  status: GSTReturnStatus;
  remarks: string | null;
  acknowledgement_number: string | null;
  created_at: string;
  updated_at: string;
  client?: GSTClient;
}

export interface GSTDocument {
  id: string;
  user_id: string;
  client_id: string | null;
  return_id: string | null;
  name: string;
  document_type: string | null;
  url: string | null;
  size: number | null;
  description: string | null;
  created_at: string;
  client?: GSTClient;
}

export const GST_CLIENT_STATUS_COLORS: Record<GSTClientStatus, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  suspended: 'bg-red-500',
};

export const GST_CLIENT_STATUS_LABELS: Record<GSTClientStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

export const GST_TYPE_LABELS: Record<GSTClientType, string> = {
  regular: 'Regular',
  composition: 'Composition',
  unregistered: 'Unregistered',
};

export const GST_RETURN_TYPE_LABELS: Record<GSTReturnType, string> = {
  GSTR1: 'GSTR-1 (Outward Supplies)',
  GSTR3B: 'GSTR-3B (Summary Return)',
  GSTR9: 'GSTR-9 (Annual Return)',
  GSTR4: 'GSTR-4 (Composition)',
  GSTR5: 'GSTR-5 (Non-Resident)',
  GSTR6: 'GSTR-6 (Input Service Distributor)',
  GSTR7: 'GSTR-7 (TDS)',
  GSTR8: 'GSTR-8 (E-commerce)',
  GSTR9C: 'GSTR-9C (Reconciliation)',
  GSTR10: 'GSTR-10 (Final Return)',
};

export const GST_RETURN_STATUS_COLORS: Record<GSTReturnStatus, string> = {
  pending: 'bg-yellow-500',
  filed: 'bg-green-500',
  overdue: 'bg-red-500',
  cancelled: 'bg-gray-500',
};

export const GST_RETURN_STATUS_LABELS: Record<GSTReturnStatus, string> = {
  pending: 'Pending',
  filed: 'Filed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep', 'Puducherry'
];

// Invoice Status
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-500',
  sent: 'bg-blue-500',
  paid: 'bg-green-500',
  partially_paid: 'bg-yellow-500',
  overdue: 'bg-red-500',
  cancelled: 'bg-gray-600',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  partially_paid: 'Partially Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  card: 'Card',
  other: 'Other',
};

export const GST_RATES = [0, 5, 12, 18, 28];

// Client Portal Types
export type PortalClientStatus = 'active' | 'inactive';
export type PortalDocumentCategory = 'general' | 'gst' | 'itr' | 'invoice' | 'legal' | 'financial' | 'other';
export type PortalNotificationType = 'info' | 'warning' | 'success' | 'error' | 'reminder';
export type PortalITRStatus = 'pending' | 'preparing' | 'review' | 'filed' | 'acknowledged' | 'rejected';
export type PortalTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PortalTaskPriority = 'low' | 'medium' | 'high';

export interface PortalClient {
  id: string;
  client_id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  company_name: string | null;
  gst_number: string | null;
  pan_number: string | null;
  mobile: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  profile_photo: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface PortalDocument {
  id: string;
  portal_client_id: string;
  uploaded_by: string | null;
  name: string;
  category: PortalDocumentCategory;
  document_type: string | null;
  url: string | null;
  size: number | null;
  description: string | null;
  is_client_visible: boolean;
  created_at: string;
  updated_at: string;
  portal_client?: PortalClient;
}

export interface PortalNotification {
  id: string;
  portal_client_id: string;
  title: string;
  message: string;
  type: PortalNotificationType;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface PortalActivity {
  id: string;
  portal_client_id: string;
  type: string;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PortalITR {
  id: string;
  portal_client_id: string;
  assessment_year: string;
  itr_type: string | null;
  status: PortalITRStatus;
  filing_date: string | null;
  acknowledgement_number: string | null;
  taxable_income: number;
  tax_payable: number;
  refund_amount: number;
  notes: string | null;
  documents: string[] | null;
  created_at: string;
  updated_at: string;
  portal_client?: PortalClient;
}

export interface PortalTask {
  id: string;
  portal_client_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: PortalTaskStatus;
  priority: PortalTaskPriority;
  assigned_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  portal_client?: PortalClient;
}

// Client Portal Constants
export const PORTAL_DOCUMENT_CATEGORY_COLORS: Record<PortalDocumentCategory, string> = {
  general: 'bg-gray-500',
  gst: 'bg-blue-500',
  itr: 'bg-green-500',
  invoice: 'bg-yellow-500',
  legal: 'bg-red-500',
  financial: 'bg-purple-500',
  other: 'bg-orange-500',
};

export const PORTAL_DOCUMENT_CATEGORY_LABELS: Record<PortalDocumentCategory, string> = {
  general: 'General',
  gst: 'GST',
  itr: 'ITR',
  invoice: 'Invoice',
  legal: 'Legal',
  financial: 'Financial',
  other: 'Other',
};

export const PORTAL_NOTIFICATION_TYPE_COLORS: Record<PortalNotificationType, string> = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
  reminder: 'bg-purple-500',
};

export const PORTAL_ITR_STATUS_COLORS: Record<PortalITRStatus, string> = {
  pending: 'bg-gray-500',
  preparing: 'bg-blue-500',
  review: 'bg-yellow-500',
  filed: 'bg-cyan-500',
  acknowledged: 'bg-green-500',
  rejected: 'bg-red-500',
};

export const PORTAL_ITR_STATUS_LABELS: Record<PortalITRStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  review: 'Under Review',
  filed: 'Filed',
  acknowledged: 'Acknowledged',
  rejected: 'Rejected',
};

export const PORTAL_TASK_STATUS_COLORS: Record<PortalTaskStatus, string> = {
  pending: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
};

export const PORTAL_TASK_STATUS_LABELS: Record<PortalTaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Service Catalog Types
export type ServiceCategory =
  | 'Tax & Compliance'
  | 'Digital Marketing'
  | 'Website & Software'
  | 'Branding & Design'
  | 'Media Production'
  | 'Business Consulting'
  | 'Custom Services';

export type ClientServiceStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
export type ClientServicePriority = 'low' | 'medium' | 'high' | 'urgent';
export type ServiceTaskStatus = 'pending' | 'in_progress' | 'completed';
export type ServiceActivityType = 'status_change' | 'progress_update' | 'note_added' | 'document_added' | 'task_completed' | 'created' | 'assigned';

export interface ServiceCatalog {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientService {
  id: string;
  portal_client_id: string;
  service_catalog_id: string | null;
  client_id: string | null;
  name: string;
  category: ServiceCategory;
  description: string | null;
  status: ClientServiceStatus;
  priority: ClientServicePriority;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  assigned_team: string[];
  invoice_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  portal_client?: PortalClient;
  service_catalog?: ServiceCatalog;
  client?: Client;
  invoice?: Invoice;
  tasks?: ClientServiceTask[];
  documents?: ClientServiceDocument[];
  activities?: ClientServiceActivity[];
}

export interface ClientServiceTask {
  id: string;
  client_service_id: string;
  title: string;
  description: string | null;
  status: ServiceTaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ClientServiceDocument {
  id: string;
  client_service_id: string;
  name: string;
  url: string | null;
  type: string | null;
  size: number | null;
  is_client_visible: boolean;
  created_at: string;
}

export interface ClientServiceActivity {
  id: string;
  client_service_id: string;
  type: ServiceActivityType;
  description: string;
  user_id: string | null;
  user_name: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

// Service Catalog Constants
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Tax & Compliance',
  'Digital Marketing',
  'Website & Software',
  'Branding & Design',
  'Media Production',
  'Business Consulting',
  'Custom Services',
];

export const SERVICE_CATEGORY_COLORS: Record<ServiceCategory, string> = {
  'Tax & Compliance': 'bg-blue-500',
  'Digital Marketing': 'bg-pink-500',
  'Website & Software': 'bg-purple-500',
  'Branding & Design': 'bg-orange-500',
  'Media Production': 'bg-red-500',
  'Business Consulting': 'bg-green-500',
  'Custom Services': 'bg-gray-500',
};

export const CLIENT_SERVICE_STATUS_COLORS: Record<ClientServiceStatus, string> = {
  pending: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  on_hold: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

export const CLIENT_SERVICE_STATUS_LABELS: Record<ClientServiceStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

export const CLIENT_SERVICE_PRIORITY_COLORS: Record<ClientServicePriority, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export const CLIENT_SERVICE_PRIORITY_LABELS: Record<ClientServicePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Social Media Types (already defined above around line 800)
export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type SocialMediaType = 'image' | 'video' | 'none';

export interface SocialPost {
  id: string;
  user_id: string;
  content: string | null;
  platforms: SocialPlatform[];
  status: SocialPostStatus;
  media_type: SocialMediaType | null;
  scheduled_at: string | null;
  published_at: string | null;
  platform_post_ids: Record<string, string>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  media?: SocialPostMedia[];
}

export interface SocialPostMedia {
  id: string;
  post_id: string;
  type: 'image' | 'video';
  url: string;
  filename: string | null;
  size: number | null;
  mime_type: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  account_name: string | null;
  account_id: string | null;
  followers: number;
  is_connected: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export const SOCIAL_POST_STATUS_COLORS: Record<SocialPostStatus, string> = {
  draft: 'bg-yellow-500',
  scheduled: 'bg-blue-500',
  published: 'bg-green-500',
  failed: 'bg-red-500',
};

export const SOCIAL_POST_STATUS_LABELS: Record<SocialPostStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
};

export const PORTAL_TASK_PRIORITY_COLORS: Record<PortalTaskPriority, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-red-500',
};

export const PORTAL_TASK_PRIORITY_LABELS: Record<PortalTaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

// AI Assistant Types
export type AIPromptCategory = 'marketing' | 'sales' | 'gst' | 'income_tax' | 'legal' | 'whatsapp' | 'email' | 'social_media' | 'general';
export type AITemplateType = 'social_post' | 'facebook_ad' | 'google_ad' | 'email' | 'whatsapp' | 'sales_proposal' | 'gst_reply' | 'legal_notice' | 'blog' | 'invoice_description';
export type AIProvider = 'placeholder' | 'openai' | 'anthropic' | 'google';

export interface AIPrompt {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  category: AIPromptCategory;
  tags: string[];
  is_favorite: boolean;
  variables: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AITemplate {
  id: string;
  user_id: string | null;
  name: string;
  template_type: AITemplateType;
  content: string;
  variables: string[];
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIHistory {
  id: string;
  user_id: string;
  prompt_id: string | null;
  template_id: string | null;
  input_text: string;
  output_text: string;
  provider: string;
  model: string | null;
  tokens_used: number;
  category: string | null;
  created_at: string;
}

export interface AISettings {
  id: string;
  user_id: string;
  default_provider: AIProvider;
  temperature: number;
  max_tokens: number;
  language: string;
  auto_save_history: boolean;
  created_at: string;
  updated_at: string;
}

// RBAC Types
export interface RolePermission {
  id: string;
  role: UserRole;
  permission: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
  granted: boolean;
  granted_by: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Role display colors
export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-red-500',
  admin: 'bg-blue-500',
  telecaller: 'bg-green-500',
  accountant: 'bg-purple-500',
  client: 'bg-gray-500',
};

// Permission action labels
export const ACTION_LABELS: Record<string, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  manage: 'Full Access',
};

// Sidebar menu items with required permissions
export interface SidebarMenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  permission?: string;
  children?: SidebarMenuItem[];
}

// AI Constants
export const AI_PROMPT_CATEGORY_COLORS: Record<AIPromptCategory, string> = {
  marketing: 'bg-pink-500',
  sales: 'bg-green-500',
  gst: 'bg-blue-500',
  income_tax: 'bg-yellow-500',
  legal: 'bg-red-500',
  whatsapp: 'bg-emerald-500',
  email: 'bg-cyan-500',
  social_media: 'bg-purple-500',
  general: 'bg-gray-500',
};

export const AI_PROMPT_CATEGORY_LABELS: Record<AIPromptCategory, string> = {
  marketing: 'Marketing',
  sales: 'Sales',
  gst: 'GST',
  income_tax: 'Income Tax',
  legal: 'Legal',
  whatsapp: 'WhatsApp',
  email: 'Email',
  social_media: 'Social Media',
  general: 'General',
};

export const AI_TEMPLATE_TYPE_COLORS: Record<AITemplateType, string> = {
  social_post: 'bg-purple-500',
  facebook_ad: 'bg-blue-500',
  google_ad: 'bg-green-500',
  email: 'bg-cyan-500',
  whatsapp: 'bg-emerald-500',
  sales_proposal: 'bg-orange-500',
  gst_reply: 'bg-indigo-500',
  legal_notice: 'bg-red-500',
  blog: 'bg-pink-500',
  invoice_description: 'bg-yellow-500',
};

export const AI_TEMPLATE_TYPE_LABELS: Record<AITemplateType, string> = {
  social_post: 'Social Media Post',
  facebook_ad: 'Facebook Ad',
  google_ad: 'Google Ad',
  email: 'Email',
  whatsapp: 'WhatsApp Message',
  sales_proposal: 'Sales Proposal',
  gst_reply: 'GST Reply',
  legal_notice: 'Legal Notice',
  blog: 'Blog Post',
  invoice_description: 'Invoice Description',
};

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  placeholder: 'Not Configured',
  openai: 'OpenAI (GPT-4)',
  anthropic: 'Anthropic (Claude)',
  google: 'Google (Gemini)',
};

// Company Settings Type
export interface CompanySettings {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  tagline: string | null;
  gst_number: string | null;
  pan_number: string | null;
  cin_number: string | null;
  msme_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  alternate_phone: string | null;
  website: string | null;
  invoice_prefix: string | null;
  invoice_suffix_start: number | null;
  quote_prefix: string | null;
  currency: string | null;
  currency_symbol: string | null;
  financial_year_start: number | null;
  financial_year_month: number | null;
  timezone: string | null;
  date_format: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  bank_branch: string | null;
  upi_id: string | null;
  default_terms: string | null;
  default_notes: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  created_at: string;
  updated_at: string;
}

// Currency options
export const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'AED', label: 'UAE Dirham (د.إ)', symbol: 'د.إ' },
  { value: 'SGD', label: 'Singapore Dollar (S$)', symbol: 'S$' },
];

// Timezone options
export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
];

// Date format options
export const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)' },
];

// Auto Assignment Types
export type AssignmentMethod = 'round_robin' | 'fixed' | 'manual';

export interface AutoAssignmentSettings {
  id: string;
  is_enabled: boolean;
  assignment_method: AssignmentMethod;
  fixed_telecaller_id: string | null;
  notify_admin_on_unassigned: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadAssignmentQueue {
  id: string;
  lead_id: string;
  status: 'pending' | 'assigned' | 'cancelled';
  assigned_to: string | null;
  assigned_at: string | null;
  created_at: string;
  lead?: Lead;
}

export interface TelecallerAssignmentCounter {
  id: string;
  last_telecaller_id: string | null;
  assignment_count: number;
  updated_at: string;
}

export interface TelecallerWithStats extends Profile {
  total_assigned: number;
  pending_leads: number;
  completed_leads: number;
}

export const ASSIGNMENT_METHOD_LABELS: Record<AssignmentMethod, string> = {
  round_robin: 'Round Robin (Equal Distribution)',
  fixed: 'Fixed Telecaller',
  manual: 'Manual Assignment',
};

// Activity Log Types
export type ActivityModule =
  | 'leads'
  | 'clients'
  | 'invoices'
  | 'gst'
  | 'projects'
  | 'tasks'
  | 'team'
  | 'whatsapp'
  | 'portal'
  | 'ai'
  | 'settings'
  | 'auth'
  | 'documents'
  | 'notifications';

export type ActivityAction =
  | 'New Lead Created'
  | 'Lead Assigned'
  | 'Lead Status Changed'
  | 'Follow-up Added'
  | 'Client Created'
  | 'Client Updated'
  | 'Invoice Created'
  | 'Invoice Paid'
  | 'Invoice Updated'
  | 'GST Record Added'
  | 'GST Record Filed'
  | 'AI Generated Content'
  | 'User Login'
  | 'User Logout'
  | 'Document Uploaded'
  | 'Notification Sent'
  | 'Task Created'
  | 'Task Completed'
  | 'Project Created'
  | 'Project Updated';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  user_role: string | null;
  module: ActivityModule;
  action: ActivityAction | string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  device_info: string | null;
  created_at: string;
}

export interface ActivityLogFilters {
  search?: string;
  user_id?: string;
  module?: ActivityModule;
  action?: string;
  date_from?: string;
  date_to?: string;
}

export const ACTIVITY_MODULE_LABELS: Record<ActivityModule, string> = {
  leads: 'Leads',
  clients: 'Clients',
  invoices: 'Invoices',
  gst: 'GST',
  projects: 'Projects',
  tasks: 'Tasks',
  team: 'Team',
  whatsapp: 'WhatsApp',
  portal: 'Portal',
  ai: 'AI Assistant',
  settings: 'Settings',
  auth: 'Authentication',
  documents: 'Documents',
  notifications: 'Notifications',
};

export const ACTIVITY_MODULE_COLORS: Record<ActivityModule, string> = {
  leads: 'bg-blue-500',
  clients: 'bg-green-500',
  invoices: 'bg-yellow-500',
  gst: 'bg-purple-500',
  projects: 'bg-cyan-500',
  tasks: 'bg-orange-500',
  team: 'bg-pink-500',
  whatsapp: 'bg-emerald-500',
  portal: 'bg-indigo-500',
  ai: 'bg-violet-500',
  settings: 'bg-gray-500',
  auth: 'bg-red-500',
  documents: 'bg-amber-500',
  notifications: 'bg-teal-500',
};

export const ACTIVITY_ACTION_ICONS: Record<string, string> = {
  'New Lead Created': 'user-plus',
  'Lead Assigned': 'user-check',
  'Lead Status Changed': 'refresh-cw',
  'Follow-up Added': 'calendar-plus',
  'Client Created': 'building-2',
  'Client Updated': 'building',
  'Invoice Created': 'file-plus',
  'Invoice Paid': 'check-circle',
  'Invoice Updated': 'file-edit',
  'GST Record Added': 'file-text',
  'GST Record Filed': 'file-check',
  'AI Generated Content': 'sparkles',
  'User Login': 'log-in',
  'User Logout': 'log-out',
  'Document Uploaded': 'upload',
  'Notification Sent': 'bell',
  'Task Created': 'list-plus',
  'Task Completed': 'check-square',
  'Project Created': 'folder-plus',
  'Project Updated': 'folder',
};

// Calendar Types
export type CalendarViewType = 'day' | 'week' | 'month' | 'agenda';
export type EventType = 'event' | 'meeting' | 'follow_up' | 'reminder' | 'task';
export type EventStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type MeetingType = 'general' | 'client' | 'team' | 'lead' | 'follow_up' | 'review' | 'other';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type AttendeeResponseStatus = 'pending' | 'accepted' | 'declined' | 'tentative';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  location: string | null;
  color: string;
  lead_id: string | null;
  client_id: string | null;
  task_id: string | null;
  reminder_minutes: number | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  client?: Client;
  task?: Task;
}

export interface Meeting {
  id: string;
  user_id: string;
  calendar_event_id: string | null;
  title: string;
  description: string | null;
  meeting_type: MeetingType;
  start_at: string;
  end_at: string | null;
  location: string | null;
  meeting_link: string | null;
  attendee_ids: string[];
  lead_id: string | null;
  client_id: string | null;
  notes: string | null;
  agenda: string | null;
  action_items: string[] | null;
  status: MeetingStatus;
  reminder_sent: boolean;
  follow_up_required: boolean;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  attendees?: MeetingAttendee[];
  lead?: Lead;
  client?: Client;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  response_status: AttendeeResponseStatus;
  created_at: string;
  profile?: Profile;
}

export interface FollowUpExtended extends FollowUp {
  follow_up_time: string | null;
  assigned_telecaller: string | null;
  client_name: string | null;
  lead_source: string | null;
  reminder_sent: boolean;
  updated_at: string;
  lead?: Lead;
  telecaller?: Profile;
}

export interface CalendarFilters {
  user_id?: string;
  event_type?: EventType;
  status?: EventStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Calendar Event Colors
export const EVENT_COLORS = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  event: 'Event',
  meeting: 'Meeting',
  follow_up: 'Follow Up',
  reminder: 'Reminder',
  task: 'Task',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  event: 'bg-blue-500',
  meeting: 'bg-purple-500',
  follow_up: 'bg-green-500',
  reminder: 'bg-yellow-500',
  task: 'bg-cyan-500',
};

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  general: 'General',
  client: 'Client Meeting',
  team: 'Team Meeting',
  lead: 'Lead Discussion',
  follow_up: 'Follow Up',
  review: 'Review',
  other: 'Other',
};

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-gray-500',
};

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const ATTENDEE_RESPONSE_COLORS: Record<AttendeeResponseStatus, string> = {
  pending: 'bg-gray-500',
  accepted: 'bg-green-500',
  declined: 'bg-red-500',
  tentative: 'bg-yellow-500',
};

export const ATTENDEE_RESPONSE_LABELS: Record<AttendeeResponseStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  tentative: 'Tentative',
};
