export type CallStatus = 'connected' | 'not_connected' | 'busy' | 'switched_off' | 'invalid';
export type CallOutcome = 'interested' | 'follow_up' | 'converted' | 'lost' | 'callback' | 'no_answer';
export type TelecallerLeadStatus = 'pending' | 'connected' | 'not_connected' | 'busy' | 'switched_off' | 'interested' | 'follow_up' | 'converted' | 'lost';
export type FollowUpStatus = 'pending' | 'completed' | 'missed' | 'rescheduled' | 'cancelled';
export type FollowUpType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'other';
export type TargetPeriod = 'daily' | 'weekly' | 'monthly';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type LeadStage = 'new' | 'contacted' | 'interested' | 'negotiation' | 'converted' | 'lost';
export type CallType = 'incoming' | 'outgoing' | 'missed' | 'follow_up' | 'scheduled';

export interface CallLog {
  id: string;
  user_id: string;
  lead_id: string | null;
  telecaller_lead_id: string | null;
  contact_name: string;
  phone: string | null;
  call_status: CallStatus;
  call_type: CallType;
  outcome: CallOutcome | null;
  duration_seconds: number | null;
  notes: string | null;
  recording_url: string | null;
  scheduled_follow_up: string | null;
  tags: string[];
  created_at: string;
}

export interface TelecallerLead {
  id: string;
  lead_id: string;
  assigned_to: string;
  user_id: string | null;
  priority: number;
  lead_priority: LeadPriority;
  lead_stage: LeadStage;
  lead_source: string | null;
  call_status: TelecallerLeadStatus;
  last_call_at: string | null;
  next_follow_up: string | null;
  total_calls: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    company_name: string;
    contact_person: string;
    email: string;
    phone: string | null;
    status: string;
    source: string;
    notes: string | null;
    estimated_value: number;
    created_at: string;
    assigned_to: string | null;
  };
  assignee?: { full_name: string | null; email: string };
}

export interface FollowUp {
  id: string;
  user_id: string;
  telecaller_lead_id: string | null;
  lead_id: string | null;
  contact_name: string;
  phone: string | null;
  follow_up_type: FollowUpType;
  scheduled_at: string;
  notes: string | null;
  status: FollowUpStatus;
  priority: LeadPriority;
  reminder_minutes: number;
  is_recurring: boolean;
  recurrence_rule: string | null;
  completed_at: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

export interface Target {
  id: string;
  user_id: string;
  target_type: TargetPeriod;
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
  profile?: { full_name: string | null; email: string };
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
  summary: string | null;
  manager_review: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profile?: { full_name: string | null; email: string };
}

export interface TelecallerNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface TelecallerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
  phone: string | null;
  is_active: boolean;
}

export interface PerformanceSummary {
  user_id: string;
  profile: TelecallerProfile;
  total_calls: number;
  connected_calls: number;
  total_converted: number;
  total_interested: number;
  total_follow_ups: number;
  avg_duration: number;
  conversion_rate: number;
  connection_rate: number;
  fcr_rate: number;
  rank?: number;
}

export const CALL_STATUS_CFG: Record<CallStatus, { label: string; color: string; bg: string; dot: string }> = {
  connected:     { label: 'Connected',     color: 'text-green-400',  bg: 'bg-green-500/20',  dot: 'bg-green-400' },
  not_connected: { label: 'Not Connected', color: 'text-red-400',    bg: 'bg-red-500/20',    dot: 'bg-red-400' },
  busy:          { label: 'Busy',          color: 'text-yellow-400', bg: 'bg-yellow-500/20', dot: 'bg-yellow-400' },
  switched_off:  { label: 'Switched Off',  color: 'text-orange-400', bg: 'bg-orange-500/20', dot: 'bg-orange-400' },
  invalid:       { label: 'Invalid',       color: 'text-gray-400',   bg: 'bg-gray-500/20',   dot: 'bg-gray-400' },
};

export const OUTCOME_CFG: Record<CallOutcome, { label: string; color: string; bg: string }> = {
  interested: { label: 'Interested', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  follow_up:  { label: 'Follow Up',  color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  converted:  { label: 'Converted',  color: 'text-green-400',  bg: 'bg-green-500/20' },
  lost:       { label: 'Lost',       color: 'text-red-400',    bg: 'bg-red-500/20' },
  callback:   { label: 'Callback',   color: 'text-cyan-400',   bg: 'bg-cyan-500/20' },
  no_answer:  { label: 'No Answer',  color: 'text-gray-400',   bg: 'bg-gray-500/20' },
};

export const LEAD_STATUS_CFG: Record<TelecallerLeadStatus, { label: string; color: string; bg: string }> = {
  pending:       { label: 'Pending',       color: 'text-gray-400',    bg: 'bg-gray-500/20' },
  connected:     { label: 'Connected',     color: 'text-green-400',   bg: 'bg-green-500/20' },
  not_connected: { label: 'Not Connected', color: 'text-red-400',     bg: 'bg-red-500/20' },
  busy:          { label: 'Busy',          color: 'text-yellow-400',  bg: 'bg-yellow-500/20' },
  switched_off:  { label: 'Switched Off',  color: 'text-orange-400',  bg: 'bg-orange-500/20' },
  interested:    { label: 'Interested',    color: 'text-purple-400',  bg: 'bg-purple-500/20' },
  follow_up:     { label: 'Follow Up',     color: 'text-blue-400',    bg: 'bg-blue-500/20' },
  converted:     { label: 'Converted',     color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  lost:          { label: 'Lost',          color: 'text-red-400',     bg: 'bg-red-500/20' },
};

export const PRIORITY_CFG: Record<LeadPriority, { label: string; color: string; bg: string; border: string }> = {
  low:    { label: 'Low',    color: 'text-gray-400',   bg: 'bg-gray-500/20',   border: 'border-gray-500/40' },
  medium: { label: 'Medium', color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/40' },
  high:   { label: 'High',   color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' },
  urgent: { label: 'Urgent', color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/40' },
};

export const STAGE_CFG: Record<LeadStage, { label: string; color: string; bg: string }> = {
  new:         { label: 'New',         color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  contacted:   { label: 'Contacted',   color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  interested:  { label: 'Interested',  color: 'text-purple-400', bg: 'bg-purple-500/20' },
  negotiation: { label: 'Negotiation', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  converted:   { label: 'Converted',   color: 'text-green-400',  bg: 'bg-green-500/20' },
  lost:        { label: 'Lost',        color: 'text-red-400',    bg: 'bg-red-500/20' },
};

export const CALL_TYPE_CFG: Record<CallType, { label: string; color: string; bg: string }> = {
  incoming:  { label: 'Incoming',  color: 'text-green-400',  bg: 'bg-green-500/20' },
  outgoing:  { label: 'Outgoing',  color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  missed:    { label: 'Missed',    color: 'text-red-400',    bg: 'bg-red-500/20' },
  follow_up: { label: 'Follow Up', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  scheduled: { label: 'Scheduled', color: 'text-cyan-400',   bg: 'bg-cyan-500/20' },
};

export const FU_STATUS_CFG: Record<FollowUpStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  completed:  { label: 'Completed',  color: 'text-green-400',  bg: 'bg-green-500/20' },
  missed:     { label: 'Missed',     color: 'text-red-400',    bg: 'bg-red-500/20' },
  rescheduled:{ label: 'Rescheduled',color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  cancelled:  { label: 'Cancelled',  color: 'text-gray-400',   bg: 'bg-gray-500/20' },
};

export function fmtDuration(s: number | null): string {
  if (!s || s === 0) return '—';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function pct(actual: number, target: number): number {
  if (!target) return 0;
  return Math.min(100, Math.round((actual / target) * 100));
}

export function progressGradient(p: number): string {
  if (p >= 100) return 'from-green-500 to-emerald-400';
  if (p >= 75)  return 'from-blue-500 to-cyan-400';
  if (p >= 50)  return 'from-orange-500 to-yellow-400';
  return 'from-red-500 to-pink-400';
}

export function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

export function isSoon(dateStr: string, minutes = 60): boolean {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < minutes * 60 * 1000;
}
