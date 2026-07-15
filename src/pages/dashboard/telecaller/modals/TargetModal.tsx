import { useState } from 'react';
import { X, Target } from 'lucide-react';
import { Target as TTarget, TargetPeriod } from '../types';

interface Profile { user_id: string; full_name: string | null; email: string; }

interface Props {
  target?: TTarget | null;
  team: Profile[];
  currentUserId: string;
  isManager: boolean;
  onClose: () => void;
  onSave: (data: Partial<TTarget> & { user_id: string }) => Promise<void>;
}

function getDateRange(type: TargetPeriod) {
  const today = new Date();
  if (type === 'daily') {
    const d = today.toISOString().slice(0,10);
    return { start: d, end: d };
  }
  if (type === 'weekly') {
    const dow = today.getDay();
    const offset = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(today); mon.setDate(today.getDate() + offset);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: mon.toISOString().slice(0,10), end: sun.toISOString().slice(0,10) };
  }
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last  = new Date(today.getFullYear(), today.getMonth()+1, 0);
  return { start: first.toISOString().slice(0,10), end: last.toISOString().slice(0,10) };
}

const DEFAULTS: Record<TargetPeriod,{ calls:number;connected:number;leads:number;conv:number }> = {
  daily:   { calls:50,  connected:30,  leads:20,  conv:5  },
  weekly:  { calls:250, connected:150, leads:100, conv:25  },
  monthly: { calls:1000,connected:600, leads:400, conv:100 },
};

export default function TargetModal({ target, team, currentUserId, isManager, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const initRange = getDateRange(target?.target_type ?? 'daily');
  const [form, setForm] = useState({
    user_id: target?.user_id ?? currentUserId,
    target_type: (target?.target_type ?? 'daily') as TargetPeriod,
    calls_target: target?.calls_target ?? DEFAULTS.daily.calls,
    connected_target: target?.connected_target ?? DEFAULTS.daily.connected,
    leads_target: target?.leads_target ?? DEFAULTS.daily.leads,
    conversion_target: target?.conversion_target ?? DEFAULTS.daily.conv,
    start_date: target?.start_date ?? initRange.start,
    end_date: target?.end_date ?? initRange.end,
  });

  const handleTypeChange = (type: TargetPeriod) => {
    const range = getDateRange(type);
    const def = DEFAULTS[type];
    setForm(f => ({ ...f, target_type: type, start_date: range.start, end_date: range.end, calls_target: def.calls, connected_target: def.connected, leads_target: def.leads, conversion_target: def.conv }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form as Partial<TTarget> & { user_id: string }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">{target ? 'Edit Target' : 'Create Target'}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isManager && team.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Team Member</label>
              <select value={form.user_id} onChange={e => setForm(f => ({...f,user_id:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/70">
                {team.map(m => <option key={m.user_id} value={m.user_id} className="bg-gray-900">{m.full_name || m.email}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Period</label>
            <div className="grid grid-cols-3 gap-2">
              {(['daily','weekly','monthly'] as TargetPeriod[]).map(type => (
                <button key={type} type="button" onClick={() => handleTypeChange(type)}
                  className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${form.target_type === type ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 shadow-lg shadow-yellow-500/10' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({...f,start_date:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/70" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({...f,end_date:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-500/70" />
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <p className="text-xs font-medium text-gray-300 uppercase tracking-wide">Target Metrics</p>
            {[
              { key: 'calls_target',      label: 'Total Calls',       val: form.calls_target },
              { key: 'connected_target',  label: 'Connected Calls',   val: form.connected_target },
              { key: 'leads_target',      label: 'Leads Generated',   val: form.leads_target },
              { key: 'conversion_target', label: 'Conversions',       val: form.conversion_target },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3">
                <label className="text-sm text-gray-400 flex-1 min-w-0">{item.label}</label>
                <input type="number" min={0} value={item.val}
                  onChange={e => setForm(f => ({ ...f, [item.key]: parseInt(e.target.value) || 0 }))}
                  className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-right focus:outline-none focus:border-yellow-500/70" />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-sm font-medium hover:from-yellow-500 hover:to-yellow-400 transition-all disabled:opacity-50">
              {saving ? 'Saving…' : target ? 'Update Target' : 'Create Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
