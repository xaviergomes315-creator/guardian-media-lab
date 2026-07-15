import { useState, useEffect, useCallback } from 'react';
import {
  Phone, PhoneCall, PhoneMissed,
  Calendar, Target, TrendingUp, BarChart3, Users, UserPlus,
  Bell, Search, Plus, Download, Edit, Trash2,
  RefreshCw, CheckCircle, Clock, Mic,
  Medal, Trophy, AlertCircle,
  FileText, Activity, Settings, Star,
  Building2, Mail, X,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import {
  CallLog, TelecallerLead, FollowUp, Target as TTarget,
  DailyReport, TelecallerNotification, TelecallerProfile, PerformanceSummary,
  CALL_STATUS_CFG, OUTCOME_CFG, LEAD_STATUS_CFG, PRIORITY_CFG, STAGE_CFG, CALL_TYPE_CFG, FU_STATUS_CFG,
  fmtDuration, fmtDate, fmtDateTime, pct, progressGradient, isOverdue, isSoon,
  CallStatus, CallType, TelecallerLeadStatus,
} from './types';
import CallModal from './modals/CallModal';
import LeadModal from './modals/LeadModal';
import FollowUpModal from './modals/FollowUpModal';
import TargetModal from './modals/TargetModal';
import ConfirmModal from './modals/ConfirmModal';

// ─────────────────────────────────────────────
// UTILITY HOOKS
// ─────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 300): T {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return dv;
}

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string|number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="glass-card p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white font-sora">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────
function ProgressBar({ actual, target, label, color }: { actual: number; target: number; label: string; color?: string }) {
  const p = pct(actual, target);
  const grad = color ?? progressGradient(p);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{actual}/{target} <span className="text-gray-500">({p}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-500`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT HELPERS
// ─────────────────────────────────────────────
function exportCSV(data: Record<string,unknown>[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(data: unknown[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
type Tab = 'dashboard' | 'calls' | 'leads' | 'followups' | 'targets' | 'performance' | 'reports' | 'manager' | 'notifications';

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function TelecallerPage() {
  const { user, profile } = useAuth();
  const isManager = profile?.role === 'super_admin' || profile?.role === 'admin';

  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const debouncedSearch = useDebounce(globalSearch, 300);

  // ── DATA ──
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [leads, setLeads] = useState<TelecallerLead[]>([]);
  const [allLeads, setAllLeads] = useState<{id:string;company_name:string;contact_person:string;email:string;phone:string|null;source:string;status:string;estimated_value:number;notes:string|null;}[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [targets, setTargets] = useState<TTarget[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [notifications, setNotifications] = useState<TelecallerNotification[]>([]);
  const [team, setTeam] = useState<TelecallerProfile[]>([]);
  const [performance, setPerformance] = useState<PerformanceSummary[]>([]);

  // ── FILTERS ──
  const [callFilter, setCallFilter] = useState({ type: '', status: '', outcome: '', search: '', dateFrom: '', dateTo: '', userId: '' });
  const [leadFilter, setLeadFilter] = useState({ stage: '', priority: '', status: '', search: '', userId: '' });
  const [fuFilter, setFuFilter] = useState({ status: '', type: '', priority: '', search: '', dateFrom: '', dateTo: '' });
  const [targetFilter, setTargetFilter] = useState({ period: '', userId: '' });
  const [reportFilter, setReportFilter] = useState({ dateFrom: '', dateTo: '', userId: '' });

  // ── MODALS ──
  const [callModal, setCallModal] = useState<{ open: boolean; call?: CallLog | null }>({ open: false });
  const [leadModal, setLeadModal] = useState<{ open: boolean; lead?: TelecallerLead | null; mode: 'create'|'edit'|'assign'|'reassign' }>({ open: false, mode: 'create' });
  const [fuModal, setFuModal] = useState<{ open: boolean; fu?: FollowUp | null; defaultContact?: string; defaultPhone?: string }>({ open: false });
  const [targetModal, setTargetModal] = useState<{ open: boolean; target?: TTarget | null }>({ open: false });
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => Promise<void> }>({ open: false, title: '', message: '', onConfirm: async () => {} });
  const [reportModal, setReportModal] = useState<{ open: boolean; report?: DailyReport | null }>({ open: false });

  // ── FETCH ──
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchCalls(), fetchLeads(), fetchFollowUps(), fetchTargets(),
        fetchReports(), fetchNotifications(), fetchTeam(),
      ]);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-mark missed follow-ups
  useEffect(() => {
    const markMissed = async () => {
      if (!user) return;
      const now = new Date().toISOString();
      await supabase.from('telecaller_follow_ups')
        .update({ status: 'missed' })
        .eq('user_id', user.id).eq('status', 'pending').lt('scheduled_at', now);
    };
    markMissed();
    const interval = setInterval(markMissed, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Auto-generate notifications for today's follow-ups
  useEffect(() => {
    const checkNotifs = async () => {
      if (!user) return;
      const upcoming = followUps.filter(fu =>
        fu.status === 'pending' && isSoon(fu.scheduled_at, 60) && !isOverdue(fu.scheduled_at)
      );
      for (const fu of upcoming) {
        await supabase.from('telecaller_notifications').upsert({
          user_id: user.id,
          type: 'follow_up_due',
          title: 'Follow-up Due Soon',
          message: `Follow-up with ${fu.contact_name} is scheduled at ${fmtDateTime(fu.scheduled_at)}`,
          entity_type: 'follow_up',
          entity_id: fu.id,
        }, { onConflict: 'user_id,entity_id,type', ignoreDuplicates: true });
      }
    };
    if (followUps.length) checkNotifs();
  }, [followUps, user]);

  async function fetchCalls() {
    if (!user) return;
    let q = supabase.from('telecaller_call_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (!isManager) q = q.eq('user_id', user.id);
    const { data } = await q;
    if (data) setCalls(data.map(c => ({ ...c, tags: c.tags || [], call_type: c.call_type || 'outgoing' })));
  }

  async function fetchLeads() {
    if (!user) return;
    let q = supabase.from('telecaller_leads')
      .select('*, lead:leads(id,company_name,contact_person,email,phone,status,source,notes,estimated_value,created_at,assigned_to)')
      .order('updated_at', { ascending: false }).limit(200);
    if (!isManager) q = q.eq('assigned_to', user.id);
    const { data } = await q;
    if (data) setLeads(data.map(l => ({
      ...l,
      lead_priority: l.lead_priority || 'medium',
      lead_stage: l.lead_stage || 'new',
    })));

    // Also fetch unassigned leads for assignment
    if (isManager) {
      const { data: rawLeads } = await supabase
        .from('leads').select('id,company_name,contact_person,email,phone,source,status,estimated_value,notes')
        .order('created_at', { ascending: false }).limit(100);
      if (rawLeads) setAllLeads(rawLeads);
    }
  }

  async function fetchFollowUps() {
    if (!user) return;
    let q = supabase.from('telecaller_follow_ups').select('*').order('scheduled_at', { ascending: true }).limit(200);
    if (!isManager) q = q.eq('user_id', user.id);
    const { data } = await q;
    if (data) setFollowUps(data);
  }

  async function fetchTargets() {
    if (!user) return;
    let q = supabase.from('telecaller_targets')
      .select('*')
      .order('start_date', { ascending: false }).limit(100);
    if (!isManager) q = q.eq('user_id', user.id);
    const { data } = await q;
    if (data) setTargets(data);
  }

  async function fetchReports() {
    if (!user) return;
    let q = supabase.from('daily_reports')
      .select('*')
      .order('date', { ascending: false }).limit(100);
    if (!isManager) q = q.eq('user_id', user.id);
    const { data } = await q;
    if (data) setReports(data);
  }

  async function fetchNotifications() {
    if (!user) return;
    const { data } = await supabase.from('telecaller_notifications')
      .select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (data) setNotifications(data);
  }

  async function fetchTeam() {
    const { data } = await supabase.from('profiles')
      .select('id,user_id,full_name,email,role,phone,is_active')
      .in('role', ['telecaller', 'admin', 'super_admin']).eq('is_active', true).order('full_name');
    if (data) setTeam(data);
  }

  // Enrich targets + reports with profile info from team
  const enrichedTargets: TTarget[] = targets.map(t => ({
    ...t,
    profile: team.find(m => m.user_id === t.user_id) ? { full_name: team.find(m => m.user_id === t.user_id)!.full_name, email: team.find(m => m.user_id === t.user_id)!.email } : undefined,
  }));

  const enrichedReports: DailyReport[] = reports.map(r => ({
    ...r,
    profile: team.find(m => m.user_id === r.user_id) ? { full_name: team.find(m => m.user_id === r.user_id)!.full_name, email: team.find(m => m.user_id === r.user_id)!.email } : undefined,
  }));
  useEffect(() => {
    if (!calls.length && !team.length) return;
    const map = new Map<string, PerformanceSummary>();
    const targetTeam = isManager ? team : team.filter(m => m.user_id === user?.id);

    for (const m of targetTeam) {
      map.set(m.user_id, {
        user_id: m.user_id, profile: m,
        total_calls: 0, connected_calls: 0, total_converted: 0,
        total_interested: 0, total_follow_ups: 0,
        avg_duration: 0, conversion_rate: 0, connection_rate: 0, fcr_rate: 0,
      });
    }

    const durationSums = new Map<string, { sum: number; count: number }>();
    for (const c of calls) {
      const uid = c.user_id;
      if (!map.has(uid)) continue;
      const s = map.get(uid)!;
      s.total_calls++;
      if (c.call_status === 'connected') s.connected_calls++;
      if (c.outcome === 'converted') s.total_converted++;
      if (c.outcome === 'interested') s.total_interested++;
      if (c.outcome === 'follow_up') s.total_follow_ups++;
      if (c.duration_seconds) {
        const d = durationSums.get(uid) || { sum: 0, count: 0 };
        d.sum += c.duration_seconds; d.count++;
        durationSums.set(uid, d);
      }
      map.set(uid, s);
    }

    const result: PerformanceSummary[] = [];
    for (const [uid, s] of map) {
      const d = durationSums.get(uid);
      s.avg_duration = d ? Math.round(d.sum / d.count) : 0;
      s.conversion_rate = s.total_calls > 0 ? Math.round((s.total_converted / s.total_calls) * 100) : 0;
      s.connection_rate = s.total_calls > 0 ? Math.round((s.connected_calls / s.total_calls) * 100) : 0;
      s.fcr_rate = s.connected_calls > 0 ? Math.round((s.total_converted / s.connected_calls) * 100) : 0;
      result.push(s);
    }

    result.sort((a, b) => b.total_converted - a.total_converted || b.total_calls - a.total_calls);
    result.forEach((s, i) => s.rank = i + 1);
    setPerformance(result);
  }, [calls, team, isManager, user]);

  // ── CALL CRUD ──
  async function saveCall(data: Partial<CallLog>) {
    if (!user) return;
    if (callModal.call) {
      await supabase.from('telecaller_call_logs').update(data).eq('id', callModal.call.id);
    } else {
      await supabase.from('telecaller_call_logs').insert({ ...data, user_id: user.id });
      // Auto update lead status if linked
      if (data.telecaller_lead_id && data.outcome) {
        const statusMap: Record<string,TelecallerLeadStatus> = {
          interested: 'interested', follow_up: 'follow_up', converted: 'converted', lost: 'lost',
        };
        const newStatus = statusMap[data.outcome as string];
        const currentLead = leads.find(l => l.id === data.telecaller_lead_id);
        if (newStatus) {
          await supabase.from('telecaller_leads').update({ call_status: newStatus, last_call_at: new Date().toISOString(), total_calls: (currentLead?.total_calls ?? 0) + 1 }).eq('id', data.telecaller_lead_id);
        }
        // Auto create follow-up if outcome is follow_up
        if (data.outcome === 'follow_up' && data.scheduled_follow_up) {
          await supabase.from('telecaller_follow_ups').insert({
            user_id: user.id, telecaller_lead_id: data.telecaller_lead_id,
            contact_name: data.contact_name || '', phone: data.phone,
            follow_up_type: 'call', scheduled_at: data.scheduled_follow_up,
            notes: `Auto-created from call on ${fmtDate(new Date().toISOString())}`,
            status: 'pending', priority: 'medium', reminder_minutes: 30,
          });
        }
      }
    }
    await fetchCalls(); await fetchLeads(); await fetchFollowUps();
    setCallModal({ open: false });
  }

  async function deleteCall(id: string) {
    await supabase.from('telecaller_call_logs').delete().eq('id', id);
    await fetchCalls();
  }

  // ── LEAD CRUD ──
  async function saveLead(data: Record<string, unknown>) {
    if (!user) return;
    if (leadModal.mode === 'create') {
      // 1. create in leads table
      const { data: newLead, error } = await supabase.from('leads').insert({
        user_id: user.id,
        contact_person: data.contact_person, company_name: data.company_name,
        email: data.email, phone: data.phone, source: data.source || 'Cold Call',
        status: 'new', estimated_value: data.estimated_value || 0,
        notes: data.notes, assigned_to: data.assigned_to || user.id,
      }).select().maybeSingle();
      if (error || !newLead) return;
      // 2. create telecaller_lead record
      await supabase.from('telecaller_leads').insert({
        lead_id: newLead.id, assigned_to: data.assigned_to || user.id,
        user_id: user.id, priority: 3,
        lead_priority: data.lead_priority || 'medium',
        lead_stage: data.lead_stage || 'new',
        lead_source: data.source || 'Cold Call',
        call_status: 'pending',
      });
      // 3. Notification
      await supabase.from('telecaller_notifications').insert({
        user_id: data.assigned_to || user.id,
        type: 'new_assignment', title: 'New Lead Assigned',
        message: `Lead "${data.contact_person}" has been assigned to you.`,
        entity_type: 'lead',
      });
    } else if (leadModal.mode === 'assign') {
      const existing = await supabase.from('telecaller_leads').select('id').eq('lead_id', data.lead_id).maybeSingle();
      if (existing.data) {
        await supabase.from('telecaller_leads').update({
          assigned_to: data.assigned_to || user.id,
          lead_priority: data.lead_priority, lead_stage: data.lead_stage,
        }).eq('id', existing.data.id);
      } else {
        await supabase.from('telecaller_leads').insert({
          lead_id: data.lead_id, assigned_to: data.assigned_to || user.id,
          user_id: user.id, priority: 3,
          lead_priority: data.lead_priority || 'medium',
          lead_stage: data.lead_stage || 'new',
          call_status: 'pending',
        });
      }
      // Update leads table
      await supabase.from('leads').update({ assigned_to: data.assigned_to || user.id }).eq('id', data.lead_id as string);
    } else if (leadModal.lead) {
      await supabase.from('telecaller_leads').update({
        lead_priority: data.lead_priority, lead_stage: data.lead_stage,
        lead_source: data.lead_source, call_status: data.call_status,
        assigned_to: data.assigned_to, notes: data.notes,
        next_follow_up: data.next_follow_up,
      }).eq('id', leadModal.lead.id);
    }
    await fetchLeads();
    setLeadModal({ open: false, mode: 'create' });
  }

  async function deleteLead(id: string) {
    await supabase.from('telecaller_leads').delete().eq('id', id);
    await fetchLeads();
  }

  // ── FOLLOW-UP CRUD ──
  async function saveFollowUp(data: Partial<FollowUp>) {
    if (!user) return;
    if (fuModal.fu) {
      const updates: Record<string,unknown> = { ...data };
      if (data.status === 'completed') updates.completed_at = new Date().toISOString();
      await supabase.from('telecaller_follow_ups').update(updates).eq('id', fuModal.fu.id);
      // If recurring, create next follow-up
      if (fuModal.fu.is_recurring && fuModal.fu.recurrence_rule && data.status === 'completed') {
        const nextDate = new Date(fuModal.fu.scheduled_at);
        const rule = fuModal.fu.recurrence_rule;
        if (rule === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (rule === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (rule === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
        else if (rule === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        await supabase.from('telecaller_follow_ups').insert({
          ...fuModal.fu, id: undefined, created_at: undefined, updated_at: undefined,
          scheduled_at: nextDate.toISOString(), status: 'pending', completed_at: null, outcome: null,
        });
      }
    } else {
      await supabase.from('telecaller_follow_ups').insert({ ...data, user_id: user.id });
      // Notification
      await supabase.from('telecaller_notifications').insert({
        user_id: user.id, type: 'follow_up_due', title: 'New Follow-up Scheduled',
        message: `Follow-up with ${data.contact_name} scheduled for ${fmtDateTime(data.scheduled_at as string)}`,
        entity_type: 'follow_up',
      });
    }
    await fetchFollowUps();
    setFuModal({ open: false });
  }

  async function deleteFollowUp(id: string) {
    await supabase.from('telecaller_follow_ups').delete().eq('id', id);
    await fetchFollowUps();
  }

  async function completeFollowUp(fu: FollowUp) {
    await supabase.from('telecaller_follow_ups').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', fu.id);
    await fetchFollowUps();
  }

  // ── TARGET CRUD ──
  async function saveTarget(data: Partial<TTarget> & { user_id: string }) {
    if (!user) return;
    if (targetModal.target) {
      await supabase.from('telecaller_targets').update(data).eq('id', targetModal.target.id);
    } else {
      await supabase.from('telecaller_targets').insert(data);
    }
    await fetchTargets();
    setTargetModal({ open: false });
  }

  async function deleteTarget(id: string) {
    await supabase.from('telecaller_targets').delete().eq('id', id);
    await fetchTargets();
  }

  // ── REPORT CRUD ──
  async function saveReport(data: Partial<DailyReport>) {
    if (!user) return;
    if (reportModal.report) {
      await supabase.from('daily_reports').update(data).eq('id', reportModal.report.id);
    } else {
      // Auto-calculate from call logs if no data provided
      const today = new Date().toISOString().slice(0,10);
      const todayCalls = calls.filter(c => c.created_at.slice(0,10) === today && c.user_id === user.id);
      await supabase.from('daily_reports').insert({
        user_id: user.id,
        date: data.date || today,
        total_calls: data.total_calls ?? todayCalls.length,
        connected_calls: data.connected_calls ?? todayCalls.filter(c => c.call_status === 'connected').length,
        interested_count: data.interested_count ?? todayCalls.filter(c => c.outcome === 'interested').length,
        follow_up_count: data.follow_up_count ?? todayCalls.filter(c => c.outcome === 'follow_up').length,
        converted_count: data.converted_count ?? todayCalls.filter(c => c.outcome === 'converted').length,
        lost_count: data.lost_count ?? todayCalls.filter(c => c.outcome === 'lost').length,
        summary: data.summary,
      });
    }
    await fetchReports();
    setReportModal({ open: false });
  }

  async function approveReport(id: string, review: string) {
    if (!user) return;
    await supabase.from('daily_reports').update({ manager_review: review, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    await fetchReports();
  }

  async function markNotifRead(id: string) {
    await supabase.from('telecaller_notifications').update({ read: true }).eq('id', id);
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  }

  async function markAllNotifRead() {
    if (!user) return;
    await supabase.from('telecaller_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  }

  // ── COMPUTED ──
  const unreadCount = notifications.filter(n => !n.read).length;
  const todayStr = new Date().toISOString().slice(0,10);
  const todayCalls = calls.filter(c => c.created_at.slice(0,10) === todayStr && (!isManager || c.user_id === user?.id));
  const pendingFUs = followUps.filter(fu => fu.status === 'pending');
  const overdueFUs = followUps.filter(fu => fu.status === 'pending' && isOverdue(fu.scheduled_at));
  const todayTargets = targets.filter(t => t.target_type === 'daily' && t.start_date === todayStr && (!isManager ? t.user_id === user?.id : true));

  // ── FILTERED CALLS ──
  const filteredCalls = calls.filter(c => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch = !s || c.contact_name.toLowerCase().includes(s) || (c.phone && c.phone.includes(s)) || (c.notes && c.notes.toLowerCase().includes(s));
    const matchType = !callFilter.type || c.call_type === callFilter.type;
    const matchStatus = !callFilter.status || c.call_status === callFilter.status;
    const matchOutcome = !callFilter.outcome || c.outcome === callFilter.outcome;
    const matchUser = !callFilter.userId || c.user_id === callFilter.userId;
    const matchFrom = !callFilter.dateFrom || c.created_at >= callFilter.dateFrom;
    const matchTo = !callFilter.dateTo || c.created_at <= callFilter.dateTo + 'T23:59:59';
    return matchSearch && matchType && matchStatus && matchOutcome && matchUser && matchFrom && matchTo;
  });

  const filteredLeads = leads.filter(l => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch = !s || (l.lead?.contact_person || '').toLowerCase().includes(s) || (l.lead?.company_name || '').toLowerCase().includes(s) || (l.lead?.phone || '').includes(s) || (l.lead?.email || '').toLowerCase().includes(s);
    const matchStage = !leadFilter.stage || l.lead_stage === leadFilter.stage;
    const matchPriority = !leadFilter.priority || l.lead_priority === leadFilter.priority;
    const matchStatus = !leadFilter.status || l.call_status === leadFilter.status;
    const matchUser = !leadFilter.userId || l.assigned_to === leadFilter.userId;
    return matchSearch && matchStage && matchPriority && matchStatus && matchUser;
  });

  const filteredFUs = followUps.filter(fu => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch = !s || fu.contact_name.toLowerCase().includes(s) || (fu.phone && fu.phone.includes(s)) || (fu.notes && fu.notes.toLowerCase().includes(s));
    const matchStatus = !fuFilter.status || fu.status === fuFilter.status;
    const matchType = !fuFilter.type || fu.follow_up_type === fuFilter.type;
    const matchPriority = !fuFilter.priority || fu.priority === fuFilter.priority;
    const matchFrom = !fuFilter.dateFrom || fu.scheduled_at >= fuFilter.dateFrom;
    const matchTo = !fuFilter.dateTo || fu.scheduled_at <= fuFilter.dateTo + 'T23:59:59';
    return matchSearch && matchStatus && matchType && matchPriority && matchFrom && matchTo;
  });

  const filteredTargets = enrichedTargets.filter(t => {
    const matchPeriod = !targetFilter.period || t.target_type === targetFilter.period;
    const matchUser = !targetFilter.userId || t.user_id === targetFilter.userId;
    return matchPeriod && matchUser;
  });

  const filteredReports = enrichedReports.filter(r => {
    const matchUser = !reportFilter.userId || r.user_id === reportFilter.userId;
    const matchFrom = !reportFilter.dateFrom || r.date >= reportFilter.dateFrom;
    const matchTo = !reportFilter.dateTo || r.date <= reportFilter.dateTo;
    return matchUser && matchFrom && matchTo;
  });

  // ── TABS CONFIG ──
  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard',     label: 'Dashboard',     icon: Activity },
    { id: 'calls',         label: 'Calls',          icon: Phone },
    { id: 'leads',         label: 'Leads',          icon: Users },
    { id: 'followups',     label: 'Follow-ups',     icon: Calendar, badge: pendingFUs.length || undefined },
    { id: 'targets',       label: 'Targets',        icon: Target },
    { id: 'performance',   label: 'Performance',    icon: TrendingUp },
    { id: 'reports',       label: 'Reports',        icon: BarChart3 },
    ...(isManager ? [{ id: 'manager' as Tab, label: 'Manager', icon: Settings }] : []),
    { id: 'notifications', label: 'Notifications',  icon: Bell, badge: unreadCount || undefined },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-sora">Telecaller CRM</h1>
              <p className="text-xs text-gray-500">Enterprise Call Management</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Global Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
                  placeholder="Search calls, leads, follow-ups…"
                  className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500/50 w-64"
                />
              </div>
              <button onClick={fetchAll} disabled={loading}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setTab('notifications')}
                className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          {/* Mobile Search */}
          <div className="sm:hidden relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50" />
          </div>
          {/* Tabs */}
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${tab === t.id ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <t.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {t.badge > 9 ? '9+' : t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto">
        {/* ══════ DASHBOARD ══════ */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Today's Calls" value={todayCalls.length} sub={`${todayCalls.filter(c=>c.call_status==='connected').length} connected`} icon={Phone} color="bg-blue-500/20 text-blue-400" />
              <StatCard label="Pending Follow-ups" value={pendingFUs.length} sub={overdueFUs.length > 0 ? `${overdueFUs.length} overdue!` : 'All on schedule'} icon={Calendar} color="bg-cyan-500/20 text-cyan-400" />
              <StatCard label="Leads Assigned" value={leads.length} sub={`${leads.filter(l=>l.call_status==='converted').length} converted`} icon={Users} color="bg-green-500/20 text-green-400" />
              <StatCard label="Today's Targets" value={todayTargets.length > 0 ? `${pct(todayCalls.length, todayTargets[0]?.calls_target || 50)}%` : 'N/A'} sub={todayTargets.length > 0 ? `${todayCalls.length}/${todayTargets[0]?.calls_target} calls` : 'No target set'} icon={Target} color="bg-yellow-500/20 text-yellow-400" />
            </div>

            {/* Alerts */}
            {overdueFUs.length > 0 && (
              <div className="glass-card p-4 border border-red-500/30 bg-red-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white text-sm">Overdue Follow-ups ({overdueFUs.length})</p>
                    <p className="text-xs text-gray-400 mt-0.5">You have missed follow-ups that need immediate attention.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {overdueFUs.slice(0,4).map(fu => (
                        <span key={fu.id} className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs border border-red-500/20">
                          {fu.contact_name} · {fmtDateTime(fu.scheduled_at)}
                        </span>
                      ))}
                      {overdueFUs.length > 4 && <span className="px-2 py-1 rounded-lg bg-white/10 text-gray-400 text-xs">+{overdueFUs.length - 4} more</span>}
                    </div>
                  </div>
                  <button onClick={() => setTab('followups')} className="ml-auto text-xs text-orange-400 hover:text-orange-300 flex-shrink-0 whitespace-nowrap">View All →</button>
                </div>
              </div>
            )}

            {/* Today's Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Call breakdown */}
              <div className="glass-card p-4">
                <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2"><Phone className="w-4 h-4 text-orange-400" />Today's Call Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Connected', val: todayCalls.filter(c=>c.call_status==='connected').length, color: 'from-green-500 to-emerald-400' },
                    { label: 'Not Connected', val: todayCalls.filter(c=>c.call_status==='not_connected').length, color: 'from-red-500 to-pink-400' },
                    { label: 'Busy', val: todayCalls.filter(c=>c.call_status==='busy').length, color: 'from-yellow-500 to-orange-400' },
                    { label: 'Interested', val: todayCalls.filter(c=>c.outcome==='interested').length, color: 'from-purple-500 to-violet-400' },
                    { label: 'Converted', val: todayCalls.filter(c=>c.outcome==='converted').length, color: 'from-emerald-500 to-teal-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-28 flex-shrink-0">{item.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: todayCalls.length > 0 ? `${(item.val/todayCalls.length)*100}%` : '0%' }} />
                      </div>
                      <span className="text-sm font-semibold text-white w-6 text-right">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming follow-ups */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-400" />Upcoming Follow-ups</h3>
                  <button onClick={() => setTab('followups')} className="text-xs text-orange-400 hover:text-orange-300">View All</button>
                </div>
                {pendingFUs.length === 0
                  ? <p className="text-center text-gray-500 text-sm py-6">No pending follow-ups</p>
                  : <div className="space-y-2">
                    {pendingFUs.slice(0,5).map(fu => (
                      <div key={fu.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${isOverdue(fu.scheduled_at) ? 'bg-red-500/10 border border-red-500/20' : isSoon(fu.scheduled_at) ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{fu.contact_name}</p>
                          <p className="text-xs text-gray-400">{fmtDateTime(fu.scheduled_at)} · {fu.follow_up_type}</p>
                        </div>
                        {isOverdue(fu.scheduled_at) && <span className="text-xs text-red-400 font-medium flex-shrink-0">Overdue</span>}
                        {isSoon(fu.scheduled_at) && !isOverdue(fu.scheduled_at) && <span className="text-xs text-yellow-400 font-medium flex-shrink-0">Soon</span>}
                        <button onClick={() => completeFollowUp(fu)} className="p-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex-shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                }
              </div>
            </div>

            {/* Recent calls */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" />Recent Calls</h3>
                <button onClick={() => setTab('calls')} className="text-xs text-orange-400 hover:text-orange-300">View All</button>
              </div>
              {calls.length === 0
                ? <p className="text-center text-gray-500 text-sm py-6">No calls logged yet</p>
                : <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Contact','Phone','Type','Status','Outcome','Duration','Time'].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-gray-500 py-2 pr-4 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {calls.slice(0,8).map(c => {
                        const sc = CALL_STATUS_CFG[c.call_status];
                        const oc = c.outcome ? OUTCOME_CFG[c.outcome] : null;
                        const tc = CALL_TYPE_CFG[c.call_type || 'outgoing'];
                        return (
                          <tr key={c.id} className="hover:bg-white/3 transition-colors">
                            <td className="py-2 pr-4 font-medium text-white">{c.contact_name}</td>
                            <td className="py-2 pr-4 text-gray-400">{c.phone || '—'}</td>
                            <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${tc.bg} ${tc.color}`}>{tc.label}</span></td>
                            <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                            <td className="py-2 pr-4">{oc ? <span className={`px-2 py-0.5 rounded-full text-xs ${oc.bg} ${oc.color}`}>{oc.label}</span> : <span className="text-gray-600">—</span>}</td>
                            <td className="py-2 pr-4 text-gray-400">{fmtDuration(c.duration_seconds)}</td>
                            <td className="py-2 pr-4 text-gray-500 text-xs">{fmtDateTime(c.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        )}

        {/* ══════ CALLS ══════ */}
        {tab === 'calls' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-2 flex-1">
                <select value={callFilter.type} onChange={e => setCallFilter(f => ({...f,type:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-orange-500/50">
                  <option value="">All Types</option>
                  {(['incoming','outgoing','missed','follow_up','scheduled'] as CallType[]).map(t => <option key={t} value={t} className="bg-gray-900">{CALL_TYPE_CFG[t].label}</option>)}
                </select>
                <select value={callFilter.status} onChange={e => setCallFilter(f => ({...f,status:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-orange-500/50">
                  <option value="">All Statuses</option>
                  {(Object.keys(CALL_STATUS_CFG) as CallStatus[]).map(s => <option key={s} value={s} className="bg-gray-900">{CALL_STATUS_CFG[s].label}</option>)}
                </select>
                <select value={callFilter.outcome} onChange={e => setCallFilter(f => ({...f,outcome:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-orange-500/50">
                  <option value="">All Outcomes</option>
                  {Object.entries(OUTCOME_CFG).map(([k,v]) => <option key={k} value={k} className="bg-gray-900">{v.label}</option>)}
                </select>
                {isManager && (
                  <select value={callFilter.userId} onChange={e => setCallFilter(f => ({...f,userId:e.target.value}))}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-orange-500/50">
                    <option value="">All Agents</option>
                    {team.map(m => <option key={m.user_id} value={m.user_id} className="bg-gray-900">{m.full_name || m.email}</option>)}
                  </select>
                )}
                <input type="date" value={callFilter.dateFrom} onChange={e => setCallFilter(f => ({...f,dateFrom:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-orange-500/50" />
                <input type="date" value={callFilter.dateTo} onChange={e => setCallFilter(f => ({...f,dateTo:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-orange-500/50" />
                {(callFilter.type || callFilter.status || callFilter.outcome || callFilter.userId || callFilter.dateFrom) && (
                  <button onClick={() => setCallFilter({ type:'',status:'',outcome:'',search:'',dateFrom:'',dateTo:'',userId:'' })}
                    className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors">Clear</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportCSV(filteredCalls as unknown as Record<string, unknown>[], `calls_${todayStr}.csv`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-white hover:bg-white/10 transition-colors">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => setCallModal({ open: true })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Log Call
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Calls" value={filteredCalls.length} icon={Phone} color="bg-blue-500/20 text-blue-400" />
              <StatCard label="Connected" value={filteredCalls.filter(c=>c.call_status==='connected').length} icon={PhoneCall} color="bg-green-500/20 text-green-400" />
              <StatCard label="Missed" value={filteredCalls.filter(c=>c.call_type==='missed').length} icon={PhoneMissed} color="bg-red-500/20 text-red-400" />
              <StatCard label="Converted" value={filteredCalls.filter(c=>c.outcome==='converted').length} icon={CheckCircle} color="bg-emerald-500/20 text-emerald-400" />
            </div>

            {/* Call Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      {['Contact','Phone','Type','Status','Outcome','Duration','Notes','Tags','Time','Actions'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCalls.length === 0
                      ? <tr><td colSpan={10} className="text-center text-gray-500 py-12">No calls found</td></tr>
                      : filteredCalls.map(c => {
                        const sc = CALL_STATUS_CFG[c.call_status];
                        const oc = c.outcome ? OUTCOME_CFG[c.outcome] : null;
                        const tc = CALL_TYPE_CFG[c.call_type || 'outgoing'];
                        return (
                          <tr key={c.id} className="hover:bg-white/3 transition-colors group">
                            <td className="px-4 py-3">
                              <p className="font-medium text-white text-sm">{c.contact_name}</p>
                              {c.recording_url && <a href={c.recording_url} target="_blank" rel="noreferrer" className="text-xs text-orange-400 flex items-center gap-1 mt-0.5"><Mic className="w-3 h-3" />Recording</a>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">{c.phone || '—'}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${tc.bg} ${tc.color}`}>{tc.label}</span></td>
                            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                            <td className="px-4 py-3">{oc ? <span className={`px-2 py-0.5 rounded-full text-xs ${oc.bg} ${oc.color}`}>{oc.label}</span> : <span className="text-gray-600 text-sm">—</span>}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{fmtDuration(c.duration_seconds)}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 max-w-[150px] truncate">{c.notes || '—'}</td>
                            <td className="px-4 py-3">
                              {c.tags?.length > 0
                                ? <div className="flex flex-wrap gap-1">{c.tags.slice(0,2).map(t => <span key={t} className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs">{t}</span>)}{c.tags.length > 2 && <span className="text-gray-600 text-xs">+{c.tags.length-2}</span>}</div>
                                : <span className="text-gray-600 text-sm">—</span>
                              }
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(c.created_at)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setCallModal({ open:true, call:c })}
                                  className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"><Edit className="w-3 h-3" /></button>
                                <button onClick={() => setConfirmModal({ open:true, title:'Delete Call', message:'This action cannot be undone.', onConfirm:async()=>deleteCall(c.id) })}
                                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {filteredCalls.length > 0 && <div className="px-4 py-2 border-t border-white/10 text-xs text-gray-500">{filteredCalls.length} calls</div>}
            </div>
          </div>
        )}

        {/* ══════ LEADS ══════ */}
        {tab === 'leads' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-2 flex-1">
                <select value={leadFilter.stage} onChange={e => setLeadFilter(f => ({...f,stage:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-blue-500/50">
                  <option value="">All Stages</option>
                  {Object.entries(STAGE_CFG).map(([k,v]) => <option key={k} value={k} className="bg-gray-900">{v.label}</option>)}
                </select>
                <select value={leadFilter.priority} onChange={e => setLeadFilter(f => ({...f,priority:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-blue-500/50">
                  <option value="">All Priorities</option>
                  {Object.entries(PRIORITY_CFG).map(([k,v]) => <option key={k} value={k} className="bg-gray-900">{v.label}</option>)}
                </select>
                <select value={leadFilter.status} onChange={e => setLeadFilter(f => ({...f,status:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-blue-500/50">
                  <option value="">All Statuses</option>
                  {Object.entries(LEAD_STATUS_CFG).map(([k,v]) => <option key={k} value={k} className="bg-gray-900">{v.label}</option>)}
                </select>
                {isManager && (
                  <select value={leadFilter.userId} onChange={e => setLeadFilter(f => ({...f,userId:e.target.value}))}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-blue-500/50">
                    <option value="">All Agents</option>
                    {team.map(m => <option key={m.user_id} value={m.user_id} className="bg-gray-900">{m.full_name || m.email}</option>)}
                  </select>
                )}
                {(leadFilter.stage || leadFilter.priority || leadFilter.status || leadFilter.userId) && (
                  <button onClick={() => setLeadFilter({ stage:'',priority:'',status:'',search:'',userId:'' })}
                    className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors">Clear</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportCSV(filteredLeads.map(l => ({ name: l.lead?.contact_person, company: l.lead?.company_name, email: l.lead?.email, phone: l.lead?.phone, stage: l.lead_stage, priority: l.lead_priority, status: l.call_status, calls: l.total_calls })), `leads_${todayStr}.csv`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-white hover:bg-white/10 transition-colors">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                {isManager && (
                  <button onClick={() => setLeadModal({ open:true, mode:'assign' })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-300 text-xs hover:text-white hover:bg-white/15 transition-colors">
                    <UserPlus className="w-3.5 h-3.5" /> Assign Lead
                  </button>
                )}
                <button onClick={() => setLeadModal({ open:true, mode:'create' })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> New Lead
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Leads" value={filteredLeads.length} icon={Users} color="bg-blue-500/20 text-blue-400" />
              <StatCard label="Interested" value={filteredLeads.filter(l=>l.call_status==='interested').length} icon={Star} color="bg-purple-500/20 text-purple-400" />
              <StatCard label="Follow-up" value={filteredLeads.filter(l=>l.call_status==='follow_up').length} icon={Calendar} color="bg-cyan-500/20 text-cyan-400" />
              <StatCard label="Converted" value={filteredLeads.filter(l=>l.call_status==='converted').length} icon={Trophy} color="bg-green-500/20 text-green-400" />
            </div>

            {/* Leads Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLeads.length === 0
                ? <div className="col-span-full text-center py-16 text-gray-500">No leads found. <button onClick={() => setLeadModal({ open:true, mode:'create' })} className="text-orange-400 hover:text-orange-300 ml-1">Create one</button></div>
                : filteredLeads.map(l => {
                  const sc = LEAD_STATUS_CFG[l.call_status];
                  const pc = PRIORITY_CFG[l.lead_priority || 'medium'];
                  const sgc = STAGE_CFG[l.lead_stage || 'new'];
                  return (
                    <div key={l.id} className="glass-card p-4 group hover:border-blue-500/30 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{l.lead?.contact_person || 'Unknown'}</p>
                          <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3 flex-shrink-0" />{l.lead?.company_name || '—'}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${pc.bg} ${pc.color}`}>{pc.label}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setLeadModal({ open:true, lead:l, mode:'edit' })} className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"><Edit className="w-3 h-3" /></button>
                            {isManager && <button onClick={() => setLeadModal({ open:true, lead:l, mode:'reassign' })} className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"><Users className="w-3 h-3" /></button>}
                            <button onClick={() => setConfirmModal({ open:true, title:'Remove Lead', message:'Remove this lead from your list?', onConfirm:async()=>deleteLead(l.id) })} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        {l.lead?.phone && <div className="flex items-center gap-1.5 text-gray-400"><Phone className="w-3 h-3 flex-shrink-0" />{l.lead.phone}</div>}
                        {l.lead?.email && <div className="flex items-center gap-1.5 text-gray-400"><Mail className="w-3 h-3 flex-shrink-0" />{l.lead.email}</div>}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className={`px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                          <span className={`px-2 py-0.5 rounded-full ${sgc.bg} ${sgc.color}`}>{sgc.label}</span>
                          <span className="text-gray-500">{l.total_calls} calls</span>
                        </div>
                        {l.next_follow_up && (
                          <div className={`flex items-center gap-1.5 ${isOverdue(l.next_follow_up) ? 'text-red-400' : 'text-cyan-400'}`}>
                            <Calendar className="w-3 h-3" />
                            Next: {fmtDateTime(l.next_follow_up)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                        <button onClick={() => setCallModal({ open:true, call: null })}
                          className="flex-1 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-1">
                          <Phone className="w-3 h-3" /> Log Call
                        </button>
                        <button onClick={() => setFuModal({ open:true, defaultContact: l.lead?.contact_person, defaultPhone: l.lead?.phone || undefined })}
                          className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3" /> Follow-up
                        </button>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ══════ FOLLOW-UPS ══════ */}
        {tab === 'followups' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-2 flex-1">
                <select value={fuFilter.status} onChange={e => setFuFilter(f => ({...f,status:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-cyan-500/50">
                  <option value="">All Statuses</option>
                  {Object.entries(FU_STATUS_CFG).map(([k,v]) => <option key={k} value={k} className="bg-gray-900">{v.label}</option>)}
                </select>
                <select value={fuFilter.type} onChange={e => setFuFilter(f => ({...f,type:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-cyan-500/50">
                  <option value="">All Types</option>
                  {['call','email','whatsapp','meeting','other'].map(t => <option key={t} value={t} className="bg-gray-900 capitalize">{t}</option>)}
                </select>
                <select value={fuFilter.priority} onChange={e => setFuFilter(f => ({...f,priority:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-cyan-500/50">
                  <option value="">All Priorities</option>
                  {Object.entries(PRIORITY_CFG).map(([k,v]) => <option key={k} value={k} className="bg-gray-900">{v.label}</option>)}
                </select>
                <input type="date" value={fuFilter.dateFrom} onChange={e => setFuFilter(f => ({...f,dateFrom:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-cyan-500/50" />
                <input type="date" value={fuFilter.dateTo} onChange={e => setFuFilter(f => ({...f,dateTo:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-cyan-500/50" />
                {(fuFilter.status || fuFilter.type || fuFilter.priority || fuFilter.dateFrom) && (
                  <button onClick={() => setFuFilter({ status:'',type:'',priority:'',search:'',dateFrom:'',dateTo:'' })}
                    className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors">Clear</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportCSV(filteredFUs.map(fu => ({ contact: fu.contact_name, phone: fu.phone, type: fu.follow_up_type, scheduled: fu.scheduled_at, status: fu.status, priority: fu.priority, notes: fu.notes })), `followups_${todayStr}.csv`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-white hover:bg-white/10 transition-colors">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => setFuModal({ open:true })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> New Follow-up
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total" value={filteredFUs.length} icon={Calendar} color="bg-cyan-500/20 text-cyan-400" />
              <StatCard label="Pending" value={filteredFUs.filter(f=>f.status==='pending').length} icon={Clock} color="bg-yellow-500/20 text-yellow-400" />
              <StatCard label="Completed" value={filteredFUs.filter(f=>f.status==='completed').length} icon={CheckCircle} color="bg-green-500/20 text-green-400" />
              <StatCard label="Missed" value={filteredFUs.filter(f=>f.status==='missed').length} icon={AlertCircle} color="bg-red-500/20 text-red-400" />
            </div>

            <div className="space-y-2">
              {filteredFUs.length === 0
                ? <div className="text-center py-16 text-gray-500">No follow-ups found. <button onClick={() => setFuModal({open:true})} className="text-orange-400 hover:text-orange-300 ml-1">Create one</button></div>
                : filteredFUs.map(fu => {
                  const sc = FU_STATUS_CFG[fu.status];
                  const pc = PRIORITY_CFG[fu.priority || 'medium'];
                  const overdue = fu.status === 'pending' && isOverdue(fu.scheduled_at);
                  const soon = fu.status === 'pending' && isSoon(fu.scheduled_at);
                  return (
                    <div key={fu.id} className={`glass-card p-4 group transition-all hover:border-cyan-500/20 ${overdue ? 'border-red-500/30' : soon ? 'border-yellow-500/30' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-red-500/20' : soon ? 'bg-yellow-500/20' : 'bg-cyan-500/20'}`}>
                          <Calendar className={`w-4 h-4 ${overdue ? 'text-red-400' : soon ? 'text-yellow-400' : 'text-cyan-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white">{fu.contact_name}</p>
                            {fu.phone && <span className="text-xs text-gray-400">{fu.phone}</span>}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${sc.bg} ${sc.color}`}>{sc.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${pc.bg} ${pc.color}`}>{pc.label}</span>
                            {fu.is_recurring && <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400 flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5" /> Recurring</span>}
                            {overdue && <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 font-medium">OVERDUE</span>}
                            {soon && !overdue && <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 font-medium">SOON</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDateTime(fu.scheduled_at)}</span>
                            <span className="capitalize">{fu.follow_up_type}</span>
                            {fu.reminder_minutes > 0 && <span className="flex items-center gap-1"><Bell className="w-3 h-3" />{fu.reminder_minutes}min reminder</span>}
                          </div>
                          {fu.notes && <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{fu.notes}</p>}
                          {fu.outcome && <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Outcome: {fu.outcome}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {fu.status === 'pending' && (
                            <button onClick={() => completeFollowUp(fu)}
                              className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors" title="Mark Complete">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setFuModal({ open:true, fu })}
                            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setConfirmModal({ open:true, title:'Delete Follow-up', message:'This follow-up will be permanently deleted.', onConfirm:async()=>deleteFollowUp(fu.id) })}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ══════ TARGETS ══════ */}
        {tab === 'targets' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-2 flex-1">
                <select value={targetFilter.period} onChange={e => setTargetFilter(f => ({...f,period:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-yellow-500/50">
                  <option value="">All Periods</option>
                  <option value="daily" className="bg-gray-900">Daily</option>
                  <option value="weekly" className="bg-gray-900">Weekly</option>
                  <option value="monthly" className="bg-gray-900">Monthly</option>
                </select>
                {isManager && (
                  <select value={targetFilter.userId} onChange={e => setTargetFilter(f => ({...f,userId:e.target.value}))}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-yellow-500/50">
                    <option value="">All Members</option>
                    {team.map(m => <option key={m.user_id} value={m.user_id} className="bg-gray-900">{m.full_name || m.email}</option>)}
                  </select>
                )}
              </div>
              <button onClick={() => setTargetModal({ open:true })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium transition-colors self-start">
                <Plus className="w-3.5 h-3.5" /> Create Target
              </button>
            </div>

            {/* Leaderboard (manager only) */}
            {isManager && performance.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" />Performance Leaderboard</h3>
                <div className="space-y-2">
                  {performance.slice(0,5).map((p, i) => (
                    <div key={p.user_id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : i === 1 ? 'bg-gray-400/5 border border-white/10' : i === 2 ? 'bg-orange-700/10 border border-orange-700/20' : 'bg-white/3'}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{p.profile.full_name || p.profile.email}</p>
                        <p className="text-xs text-gray-400">{p.total_calls} calls · {p.total_converted} converted · {p.conversion_rate}% rate</p>
                      </div>
                      {i === 0 && <Medal className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTargets.length === 0
                ? <div className="col-span-full text-center py-16 text-gray-500">No targets found. <button onClick={() => setTargetModal({ open:true })} className="text-orange-400 hover:text-orange-300 ml-1">Create one</button></div>
                : filteredTargets.map(t => {
                  const callPct = pct(t.actual_calls, t.calls_target);
                  const connPct = pct(t.actual_connected, t.connected_target);
                  const leadPct = pct(t.actual_leads, t.leads_target);
                  const convPct = pct(t.actual_conversions, t.conversion_target);
                  const overall = Math.round((callPct + connPct + leadPct + convPct) / 4);
                  const memberName = t.profile?.full_name || t.profile?.email || 'You';
                  return (
                    <div key={t.id} className="glass-card p-4 group hover:border-yellow-500/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${t.target_type === 'daily' ? 'bg-blue-500/20 text-blue-400' : t.target_type === 'weekly' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}>{t.target_type}</span>
                            <span className={`text-2xl font-bold font-sora ${overall >= 100 ? 'text-green-400' : overall >= 75 ? 'text-blue-400' : overall >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{overall}%</span>
                          </div>
                          {isManager && <p className="text-xs text-gray-400 mt-1">{memberName}</p>}
                          <p className="text-xs text-gray-500">{fmtDate(t.start_date)} – {fmtDate(t.end_date)}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setTargetModal({ open:true, target:t })} className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => setConfirmModal({ open:true, title:'Delete Target', message:'This target will be permanently deleted.', onConfirm:async()=>deleteTarget(t.id) })} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <ProgressBar actual={t.actual_calls} target={t.calls_target} label="Total Calls" />
                        <ProgressBar actual={t.actual_connected} target={t.connected_target} label="Connected" />
                        <ProgressBar actual={t.actual_leads} target={t.leads_target} label="Leads" />
                        <ProgressBar actual={t.actual_conversions} target={t.conversion_target} label="Conversions" />
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ══════ PERFORMANCE ══════ */}
        {tab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Calls" value={calls.filter(c => !isManager ? c.user_id === user?.id : true).length} icon={Phone} color="bg-blue-500/20 text-blue-400" />
              <StatCard label="Connected" value={calls.filter(c => (!isManager ? c.user_id === user?.id : true) && c.call_status === 'connected').length} icon={PhoneCall} color="bg-green-500/20 text-green-400" />
              <StatCard label="Converted" value={calls.filter(c => (!isManager ? c.user_id === user?.id : true) && c.outcome === 'converted').length} icon={Trophy} color="bg-yellow-500/20 text-yellow-400" />
              <StatCard
                label="Avg Duration"
                value={fmtDuration((() => { const my = calls.filter(c => (!isManager ? c.user_id === user?.id : true) && c.duration_seconds); return my.length > 0 ? Math.round(my.reduce((s,c) => s + (c.duration_seconds||0), 0) / my.length) : 0; })())}
                icon={Clock} color="bg-purple-500/20 text-purple-400"
              />
            </div>

            {/* Performance Table */}
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" />Agent Performance</h3>
                <button onClick={() => exportCSV(performance.map(p => ({ rank: p.rank, name: p.profile.full_name||p.profile.email, total_calls: p.total_calls, connected: p.connected_calls, converted: p.total_converted, interested: p.total_interested, avg_duration_s: p.avg_duration, conversion_rate_pct: p.conversion_rate, connection_rate_pct: p.connection_rate, fcr_pct: p.fcr_rate })), `performance_${todayStr}.csv`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-white hover:bg-white/10 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      {['Rank','Agent','Total Calls','Connected','Converted','Interested','Avg Duration','Conv. Rate','Conn. Rate','FCR'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {performance.length === 0
                      ? <tr><td colSpan={10} className="text-center text-gray-500 py-12">No performance data available</td></tr>
                      : performance.map((p, i) => (
                        <tr key={p.user_id} className={`hover:bg-white/3 transition-colors ${i === 0 ? 'bg-yellow-500/5' : ''}`}>
                          <td className="px-4 py-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-white/10 text-gray-400'}`}>{p.rank}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {i === 0 && <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                              <div>
                                <p className="font-medium text-white text-sm">{p.profile.full_name || p.profile.email}</p>
                                {i === 0 && <p className="text-xs text-yellow-400">Top Performer</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white font-semibold">{p.total_calls}</td>
                          <td className="px-4 py-3 text-green-400">{p.connected_calls}</td>
                          <td className="px-4 py-3 text-emerald-400 font-semibold">{p.total_converted}</td>
                          <td className="px-4 py-3 text-purple-400">{p.total_interested}</td>
                          <td className="px-4 py-3 text-gray-400">{fmtDuration(p.avg_duration)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${progressGradient(p.conversion_rate)}`} style={{ width: `${p.conversion_rate}%` }} />
                              </div>
                              <span className="text-sm text-white font-medium">{p.conversion_rate}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className={`h-full rounded-full bg-gradient-to-r ${progressGradient(p.connection_rate)}`} style={{ width: `${p.connection_rate}%` }} />
                              </div>
                              <span className="text-sm text-white font-medium">{p.connection_rate}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-cyan-400">{p.fcr_rate}%</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════ REPORTS ══════ */}
        {tab === 'reports' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-2 flex-1">
                {isManager && (
                  <select value={reportFilter.userId} onChange={e => setReportFilter(f => ({...f,userId:e.target.value}))}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-blue-500/50">
                    <option value="">All Agents</option>
                    {team.map(m => <option key={m.user_id} value={m.user_id} className="bg-gray-900">{m.full_name || m.email}</option>)}
                  </select>
                )}
                <input type="date" value={reportFilter.dateFrom} onChange={e => setReportFilter(f => ({...f,dateFrom:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-blue-500/50" />
                <input type="date" value={reportFilter.dateTo} onChange={e => setReportFilter(f => ({...f,dateTo:e.target.value}))}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:border-blue-500/50" />
                {(reportFilter.userId || reportFilter.dateFrom) && (
                  <button onClick={() => setReportFilter({ dateFrom:'',dateTo:'',userId:'' })}
                    className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors">Clear</button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportCSV(filteredReports.map(r => ({ agent: r.profile?.full_name||r.profile?.email, date: r.date, total: r.total_calls, connected: r.connected_calls, interested: r.interested_count, follow_ups: r.follow_up_count, converted: r.converted_count, lost: r.lost_count, summary: r.summary, manager_review: r.manager_review })), `reports_${todayStr}.csv`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-white hover:bg-white/10 transition-colors">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => exportJSON(filteredReports, `reports_${todayStr}.json`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-white hover:bg-white/10 transition-colors">
                  <Download className="w-3.5 h-3.5" /> JSON
                </button>
                <button onClick={() => setReportModal({ open:true })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Generate Report
                </button>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      {[...(isManager?['Agent']:[]),'Date','Total Calls','Connected','Interested','Follow-up','Converted','Lost','Summary','Status','Actions'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredReports.length === 0
                      ? <tr><td colSpan={12} className="text-center text-gray-500 py-12">No reports found</td></tr>
                      : filteredReports.map(r => (
                        <tr key={r.id} className="hover:bg-white/3 transition-colors group">
                          {isManager && <td className="px-4 py-3 text-sm text-white font-medium">{r.profile?.full_name || r.profile?.email || '—'}</td>}
                          <td className="px-4 py-3 text-sm text-white">{fmtDate(r.date)}</td>
                          <td className="px-4 py-3 text-sm text-white font-semibold">{r.total_calls}</td>
                          <td className="px-4 py-3 text-sm text-green-400">{r.connected_calls}</td>
                          <td className="px-4 py-3 text-sm text-purple-400">{r.interested_count}</td>
                          <td className="px-4 py-3 text-sm text-blue-400">{r.follow_up_count}</td>
                          <td className="px-4 py-3 text-sm text-emerald-400 font-semibold">{r.converted_count}</td>
                          <td className="px-4 py-3 text-sm text-red-400">{r.lost_count}</td>
                          <td className="px-4 py-3 text-xs text-gray-400 max-w-[150px] truncate">{r.summary || '—'}</td>
                          <td className="px-4 py-3">
                            {r.reviewed_at
                              ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">Reviewed</span>
                              : <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">Pending</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isManager && !r.reviewed_at && (
                                <button onClick={() => { const review = window.prompt('Manager review:'); if(review) approveReport(r.id, review); }}
                                  className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"><CheckCircle className="w-3 h-3" /></button>
                              )}
                              <button onClick={() => setReportModal({ open:true, report:r })}
                                className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"><Edit className="w-3 h-3" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════ MANAGER ══════ */}
        {tab === 'manager' && isManager && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Team Members" value={team.length} icon={Users} color="bg-blue-500/20 text-blue-400" />
              <StatCard label="Total Leads" value={leads.length} icon={UserPlus} color="bg-green-500/20 text-green-400" />
              <StatCard label="Pending Reports" value={reports.filter(r => !r.reviewed_at).length} icon={FileText} color="bg-yellow-500/20 text-yellow-400" />
              <StatCard label="All Follow-ups" value={followUps.length} icon={Calendar} color="bg-cyan-500/20 text-cyan-400" />
            </div>

            {/* Team Overview */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" />Team Overview</h3>
                <button onClick={() => setLeadModal({ open:true, mode:'assign' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
                  <UserPlus className="w-3.5 h-3.5" /> Assign Lead
                </button>
              </div>
              <div className="space-y-3">
                {team.filter(m => m.role === 'telecaller').map(m => {
                  const memberCalls = calls.filter(c => c.user_id === m.user_id);
                  const memberLeads = leads.filter(l => l.assigned_to === m.user_id);
                  const memberFUs = followUps.filter(f => f.user_id === m.user_id && f.status === 'pending');
                  const memberPerf = performance.find(p => p.user_id === m.user_id);
                  return (
                    <div key={m.user_id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                        {(m.full_name || m.email)[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{m.full_name || m.email}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-xs">
                        <div className="text-center"><p className="font-semibold text-white">{memberCalls.length}</p><p className="text-gray-500">Calls</p></div>
                        <div className="text-center"><p className="font-semibold text-white">{memberLeads.length}</p><p className="text-gray-500">Leads</p></div>
                        <div className="text-center"><p className="font-semibold text-cyan-400">{memberFUs.length}</p><p className="text-gray-500">Follow-ups</p></div>
                        <div className="text-center"><p className="font-semibold text-green-400">{memberPerf?.conversion_rate ?? 0}%</p><p className="text-gray-500">Conv. Rate</p></div>
                      </div>
                    </div>
                  );
                })}
                {team.filter(m => m.role === 'telecaller').length === 0 && (
                  <p className="text-center text-gray-500 py-8 text-sm">No telecaller team members</p>
                )}
              </div>
            </div>

            {/* Pending reports to review */}
            {reports.filter(r => !r.reviewed_at).length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-yellow-400" />Reports Awaiting Review</h3>
                <div className="space-y-2">
                  {reports.filter(r => !r.reviewed_at).map(r => (
                    <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{r.profile?.full_name || r.profile?.email}</p>
                        <p className="text-xs text-gray-400">{fmtDate(r.date)} · {r.total_calls} calls · {r.converted_count} converted</p>
                      </div>
                      <button onClick={() => { const review = window.prompt('Enter manager review:'); if(review) approveReport(r.id, review); }}
                        className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors">
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ NOTIFICATIONS ══════ */}
        {tab === 'notifications' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-orange-400" />Notifications</h2>
              {unreadCount > 0 && (
                <button onClick={markAllNotifRead} className="text-xs text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 transition-colors">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0
              ? <div className="text-center py-16 text-gray-500">No notifications</div>
              : <div className="space-y-2">
                {notifications.map(n => {
                  const typeColors: Record<string,string> = {
                    follow_up_due: 'text-cyan-400 bg-cyan-500/20',
                    follow_up_missed: 'text-red-400 bg-red-500/20',
                    target_achieved: 'text-green-400 bg-green-500/20',
                    target_missed: 'text-red-400 bg-red-500/20',
                    new_lead: 'text-blue-400 bg-blue-500/20',
                    new_assignment: 'text-purple-400 bg-purple-500/20',
                    call_reminder: 'text-orange-400 bg-orange-500/20',
                    report_due: 'text-yellow-400 bg-yellow-500/20',
                  };
                  const cls = typeColors[n.type] || 'text-gray-400 bg-gray-500/20';
                  return (
                    <div key={n.id}
                      className={`flex gap-3 p-4 rounded-xl border transition-all cursor-pointer ${n.read ? 'bg-white/3 border-white/5 opacity-60' : 'bg-white/5 border-white/10 hover:bg-white/8'}`}
                      onClick={() => !n.read && markNotifRead(n.id)}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>
                          <span className="text-xs text-gray-500 flex-shrink-0">{fmtDateTime(n.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-orange-400 mt-1 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}
      </div>

      {/* ── REPORT MODAL ── */}
      {reportModal.open && <ReportModal report={reportModal.report} onClose={() => setReportModal({ open:false })} onSave={saveReport} />}

      {/* ── MODALS ── */}
      {callModal.open && (
        <CallModal call={callModal.call} onClose={() => setCallModal({ open:false })} onSave={saveCall} />
      )}
      {leadModal.open && (
        <LeadModal lead={leadModal.lead} mode={leadModal.mode} availableLeads={allLeads} team={team} currentUserId={user?.id || ''} isManager={isManager} onClose={() => setLeadModal({ open:false, mode:'create' })} onSave={saveLead} />
      )}
      {fuModal.open && (
        <FollowUpModal followUp={fuModal.fu} defaultContactName={fuModal.defaultContact} defaultPhone={fuModal.defaultPhone} onClose={() => setFuModal({ open:false })} onSave={saveFollowUp} />
      )}
      {targetModal.open && (
        <TargetModal target={targetModal.target} team={team} currentUserId={user?.id || ''} isManager={isManager} onClose={() => setTargetModal({ open:false })} onSave={saveTarget} />
      )}
      {confirmModal.open && (
        <ConfirmModal title={confirmModal.title} message={confirmModal.message} onClose={() => setConfirmModal(s => ({...s,open:false}))} onConfirm={async () => { await confirmModal.onConfirm(); setConfirmModal(s => ({...s,open:false})); }} />
      )}
    </div>
  );
}

// ── INLINE REPORT MODAL ──
function ReportModal({ report, onClose, onSave }: { report?: DailyReport|null; onClose: ()=>void; onSave: (d:Partial<DailyReport>)=>Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: report?.date ?? new Date().toISOString().slice(0,10),
    total_calls: report?.total_calls ?? 0,
    connected_calls: report?.connected_calls ?? 0,
    interested_count: report?.interested_count ?? 0,
    follow_up_count: report?.follow_up_count ?? 0,
    converted_count: report?.converted_count ?? 0,
    lost_count: report?.lost_count ?? 0,
    summary: report?.summary ?? '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><FileText className="w-5 h-5 text-green-400" /></div>
            <h3 className="text-lg font-semibold text-white">{report ? 'Edit Report' : 'Generate Report'}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({...f,date:e.target.value}))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/70" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key:'total_calls',label:'Total Calls',val:form.total_calls },
              { key:'connected_calls',label:'Connected',val:form.connected_calls },
              { key:'interested_count',label:'Interested',val:form.interested_count },
              { key:'follow_up_count',label:'Follow-ups',val:form.follow_up_count },
              { key:'converted_count',label:'Converted',val:form.converted_count },
              { key:'lost_count',label:'Lost',val:form.lost_count },
            ].map(item => (
              <div key={item.key}>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{item.label}</label>
                <input type="number" min={0} value={item.val} onChange={e => setForm(f => ({...f,[item.key]:parseInt(e.target.value)||0}))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/70" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Summary</label>
            <textarea value={form.summary} rows={3} onChange={e => setForm(f => ({...f,summary:e.target.value}))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/70 resize-none"
              placeholder="Daily summary, key highlights..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium hover:from-green-500 hover:to-green-400 transition-all disabled:opacity-50">
              {saving ? 'Saving…' : report ? 'Update Report' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

