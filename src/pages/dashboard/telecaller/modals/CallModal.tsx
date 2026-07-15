import { useState } from 'react';
import { X, Phone, Clock, Tag, Mic, Plus } from 'lucide-react';
import { CallLog, CallStatus, CallOutcome, CallType } from '../types';

interface Props {
  call?: CallLog | null;
  defaultContactName?: string;
  defaultPhone?: string;
  defaultLeadId?: string;
  defaultTelecallerLeadId?: string;
  onClose: () => void;
  onSave: (data: Partial<CallLog>) => Promise<void>;
}

const CALL_TYPES: { v: CallType; l: string }[] = [
  { v: 'outgoing', l: 'Outgoing' }, { v: 'incoming', l: 'Incoming' },
  { v: 'missed', l: 'Missed' }, { v: 'follow_up', l: 'Follow Up' }, { v: 'scheduled', l: 'Scheduled' },
];
const CALL_STATUSES: { v: CallStatus; l: string }[] = [
  { v: 'connected', l: 'Connected' }, { v: 'not_connected', l: 'Not Connected' },
  { v: 'busy', l: 'Busy' }, { v: 'switched_off', l: 'Switched Off' }, { v: 'invalid', l: 'Invalid' },
];
const OUTCOMES: { v: CallOutcome; l: string }[] = [
  { v: 'interested', l: 'Interested' }, { v: 'follow_up', l: 'Follow Up' }, { v: 'converted', l: 'Converted' },
  { v: 'lost', l: 'Lost' }, { v: 'callback', l: 'Callback' }, { v: 'no_answer', l: 'No Answer' },
];

export default function CallModal({ call, defaultContactName = '', defaultPhone = '', defaultLeadId, defaultTelecallerLeadId, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({
    contact_name: call?.contact_name ?? defaultContactName,
    phone: call?.phone ?? defaultPhone,
    call_type: (call?.call_type ?? 'outgoing') as CallType,
    call_status: (call?.call_status ?? 'connected') as CallStatus,
    outcome: (call?.outcome ?? '') as CallOutcome | '',
    duration_seconds: call?.duration_seconds ?? 0,
    notes: call?.notes ?? '',
    recording_url: call?.recording_url ?? '',
    scheduled_follow_up: call?.scheduled_follow_up ? call.scheduled_follow_up.slice(0, 16) : '',
    tags: call?.tags ?? [] as string[],
    lead_id: call?.lead_id ?? defaultLeadId ?? '',
    telecaller_lead_id: call?.telecaller_lead_id ?? defaultTelecallerLeadId ?? '',
  });

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact_name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        outcome: (form.outcome as string) === '' ? null : form.outcome as CallOutcome,
        duration_seconds: form.duration_seconds || null,
        notes: form.notes || null,
        recording_url: form.recording_url || null,
        scheduled_follow_up: form.scheduled_follow_up || null,
        lead_id: form.lead_id || null,
        telecaller_lead_id: form.telecaller_lead_id || null,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">{call ? 'Edit Call' : 'Log Call'}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Contact Name *</label>
              <input type="text" required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/70 transition-colors"
                placeholder="Contact name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/70 transition-colors"
                placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Call Type</label>
              <select value={form.call_type} onChange={e => setForm(f => ({ ...f, call_type: e.target.value as CallType }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/70">
                {CALL_TYPES.map(t => <option key={t.v} value={t.v} className="bg-gray-900">{t.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Call Status</label>
              <select value={form.call_status} onChange={e => setForm(f => ({ ...f, call_status: e.target.value as CallStatus }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/70">
                {CALL_STATUSES.map(s => <option key={s.v} value={s.v} className="bg-gray-900">{s.l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Outcome</label>
              <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value as CallOutcome | '' }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/70">
                <option value="" className="bg-gray-900">Select outcome</option>
                {OUTCOMES.map(o => <option key={o.v} value={o.v} className="bg-gray-900">{o.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (seconds)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="number" min={0} value={form.duration_seconds}
                  onChange={e => setForm(f => ({ ...f, duration_seconds: parseInt(e.target.value) || 0 }))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/70" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Schedule Follow-up</label>
            <input type="datetime-local" value={form.scheduled_follow_up} onChange={e => setForm(f => ({ ...f, scheduled_follow_up: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/70" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea value={form.notes} rows={3} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/70 resize-none"
              placeholder="Call notes, summary, key points..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
              <Mic className="w-3 h-3" /> Recording URL
            </label>
            <input type="url" value={form.recording_url} onChange={e => setForm(f => ({ ...f, recording_url: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/70"
              placeholder="https://..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/70"
                placeholder="Type tag + Enter" />
              <button type="button" onClick={addTag}
                className="px-3 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs">
                    {tag}
                    <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))} className="hover:text-white ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-medium hover:from-orange-500 hover:to-orange-400 transition-all disabled:opacity-50">
              {saving ? 'Saving…' : call ? 'Update Call' : 'Log Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
