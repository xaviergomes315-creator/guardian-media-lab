import { useState } from 'react';
import { X, Calendar, Phone, Bell, RefreshCw } from 'lucide-react';
import { FollowUp, FollowUpType, FollowUpStatus, LeadPriority } from '../types';

interface Props {
  followUp?: FollowUp | null;
  defaultContactName?: string;
  defaultPhone?: string;
  defaultLeadId?: string;
  defaultTelecallerLeadId?: string;
  onClose: () => void;
  onSave: (data: Partial<FollowUp>) => Promise<void>;
}

const TYPES: { v: FollowUpType; l: string }[] = [{ v:'call',l:'Call' },{ v:'email',l:'Email' },{ v:'whatsapp',l:'WhatsApp' },{ v:'meeting',l:'Meeting' },{ v:'other',l:'Other' }];
const PRIORITIES: { v: LeadPriority; l: string }[] = [{ v:'low',l:'Low' },{ v:'medium',l:'Medium' },{ v:'high',l:'High' },{ v:'urgent',l:'Urgent' }];
const STATUSES: { v: FollowUpStatus; l: string }[] = [{ v:'pending',l:'Pending' },{ v:'completed',l:'Completed' },{ v:'missed',l:'Missed' },{ v:'rescheduled',l:'Rescheduled' },{ v:'cancelled',l:'Cancelled' }];
const REMINDERS = [{ v:0,l:'No reminder' },{ v:15,l:'15 min before' },{ v:30,l:'30 min before' },{ v:60,l:'1 hour before' },{ v:120,l:'2 hours before' },{ v:1440,l:'1 day before' }];

export default function FollowUpModal({ followUp, defaultContactName='', defaultPhone='', defaultLeadId, defaultTelecallerLeadId, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contact_name: followUp?.contact_name ?? defaultContactName,
    phone: followUp?.phone ?? defaultPhone,
    follow_up_type: followUp?.follow_up_type ?? 'call' as FollowUpType,
    scheduled_at: followUp?.scheduled_at ? followUp.scheduled_at.slice(0,16) : '',
    notes: followUp?.notes ?? '',
    status: followUp?.status ?? 'pending' as FollowUpStatus,
    priority: followUp?.priority ?? 'medium' as LeadPriority,
    reminder_minutes: followUp?.reminder_minutes ?? 30,
    is_recurring: followUp?.is_recurring ?? false,
    recurrence_rule: followUp?.recurrence_rule ?? '',
    outcome: followUp?.outcome ?? '',
    lead_id: followUp?.lead_id ?? defaultLeadId ?? '',
    telecaller_lead_id: followUp?.telecaller_lead_id ?? defaultTelecallerLeadId ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact_name.trim() || !form.scheduled_at) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        notes: form.notes || null,
        outcome: form.outcome || null,
        recurrence_rule: form.recurrence_rule || null,
        lead_id: form.lead_id || null,
        telecaller_lead_id: form.telecaller_lead_id || null,
      } as Partial<FollowUp>);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">{followUp ? 'Edit Follow-up' : 'Create Follow-up'}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Contact Name *</label>
              <input type="text" required value={form.contact_name} onChange={e => setForm(f => ({...f,contact_name:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/70"
                placeholder="Contact name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="text" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/70"
                  placeholder="+91..." />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
              <select value={form.follow_up_type} onChange={e => setForm(f => ({...f,follow_up_type:e.target.value as FollowUpType}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/70">
                {TYPES.map(t => <option key={t.v} value={t.v} className="bg-gray-900">{t.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({...f,priority:e.target.value as LeadPriority}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/70">
                {PRIORITIES.map(p => <option key={p.v} value={p.v} className="bg-gray-900">{p.l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Scheduled Date & Time *</label>
            <input type="datetime-local" required value={form.scheduled_at} onChange={e => setForm(f => ({...f,scheduled_at:e.target.value}))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/70" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1"><Bell className="w-3 h-3" /> Reminder</label>
              <select value={form.reminder_minutes} onChange={e => setForm(f => ({...f,reminder_minutes:parseInt(e.target.value)}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/70">
                {REMINDERS.map(r => <option key={r.v} value={r.v} className="bg-gray-900">{r.l}</option>)}
              </select>
            </div>
            {followUp && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({...f,status:e.target.value as FollowUpStatus}))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/70">
                  {STATUSES.map(s => <option key={s.v} value={s.v} className="bg-gray-900">{s.l}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({...f,is_recurring:e.target.checked}))}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer" />
              <span className="text-sm text-gray-300 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Recurring follow-up</span>
            </label>
          </div>

          {form.is_recurring && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Frequency</label>
              <select value={form.recurrence_rule} onChange={e => setForm(f => ({...f,recurrence_rule:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/70">
                <option value="" className="bg-gray-900">Select frequency</option>
                <option value="daily" className="bg-gray-900">Daily</option>
                <option value="weekly" className="bg-gray-900">Weekly</option>
                <option value="biweekly" className="bg-gray-900">Bi-weekly</option>
                <option value="monthly" className="bg-gray-900">Monthly</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea value={form.notes} rows={3} onChange={e => setForm(f => ({...f,notes:e.target.value}))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/70 resize-none"
              placeholder="What to discuss, preparation notes..." />
          </div>

          {followUp && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Outcome (if completed)</label>
              <input type="text" value={form.outcome} onChange={e => setForm(f => ({...f,outcome:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/70"
                placeholder="What happened in this follow-up..." />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white text-sm font-medium hover:from-cyan-500 hover:to-cyan-400 transition-all disabled:opacity-50">
              {saving ? 'Saving…' : followUp ? 'Update Follow-up' : 'Create Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
