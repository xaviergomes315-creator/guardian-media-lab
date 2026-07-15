import { useState } from 'react';
import { X, Users, Building2, Phone, Mail, DollarSign, MapPin } from 'lucide-react';
import { TelecallerLead, LeadPriority, LeadStage, TelecallerLeadStatus } from '../types';

interface Profile { user_id: string; full_name: string | null; email: string; }
interface RawLead { id: string; company_name: string; contact_person: string; email: string; phone: string | null; source: string; status: string; estimated_value: number; notes: string | null; }

interface Props {
  lead?: TelecallerLead | null;
  availableLeads?: RawLead[];
  team: Profile[];
  currentUserId: string;
  isManager: boolean;
  mode: 'create' | 'edit' | 'assign' | 'reassign';
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}

const SOURCES = ['Website','Facebook Ads','Google Ads','JustDial','IndiaMart','WhatsApp','Email','Referral','Cold Call','Other'];
const PRIORITIES: { v: LeadPriority; l: string }[] = [{ v:'low',l:'Low' },{ v:'medium',l:'Medium' },{ v:'high',l:'High' },{ v:'urgent',l:'Urgent' }];
const STAGES: { v: LeadStage; l: string }[] = [{ v:'new',l:'New' },{ v:'contacted',l:'Contacted' },{ v:'interested',l:'Interested' },{ v:'negotiation',l:'Negotiation' },{ v:'converted',l:'Converted' },{ v:'lost',l:'Lost' }];
const STATUSES: { v: TelecallerLeadStatus; l: string }[] = [
  { v:'pending',l:'Pending' },{ v:'connected',l:'Connected' },{ v:'not_connected',l:'Not Connected' },
  { v:'busy',l:'Busy' },{ v:'switched_off',l:'Switched Off' },{ v:'interested',l:'Interested' },
  { v:'follow_up',l:'Follow Up' },{ v:'converted',l:'Converted' },{ v:'lost',l:'Lost' },
];

export default function LeadModal({ lead, availableLeads = [], team, currentUserId, isManager, mode, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [form, setForm] = useState({
    lead_priority: lead?.lead_priority ?? 'medium' as LeadPriority,
    lead_stage: lead?.lead_stage ?? 'new' as LeadStage,
    lead_source: lead?.lead_source ?? '',
    call_status: lead?.call_status ?? 'pending' as TelecallerLeadStatus,
    assigned_to: lead?.assigned_to ?? currentUserId,
    notes: lead?.notes ?? '',
    next_follow_up: lead?.next_follow_up ? lead.next_follow_up.slice(0,16) : '',
    contact_person: '', company_name: '', email: '', phone: '', estimated_value: 0, lead_notes: '',
  });

  const filtered = availableLeads.filter(l =>
    l.contact_person.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.company_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.phone && l.phone.includes(leadSearch))
  ).slice(0, 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'assign' && !selectedLeadId) return;
    setSaving(true);
    try {
      if (mode === 'assign') {
        await onSave({ lead_id: selectedLeadId, assigned_to: form.assigned_to, lead_priority: form.lead_priority, lead_stage: form.lead_stage });
      } else if (mode === 'create') {
        await onSave({ contact_person: form.contact_person, company_name: form.company_name, email: form.email, phone: form.phone, estimated_value: form.estimated_value, source: form.lead_source || 'Cold Call', notes: form.lead_notes, lead_priority: form.lead_priority, lead_stage: form.lead_stage, assigned_to: form.assigned_to });
      } else {
        await onSave({ lead_priority: form.lead_priority, lead_stage: form.lead_stage, lead_source: form.lead_source, call_status: form.call_status, assigned_to: form.assigned_to, notes: form.notes, next_follow_up: form.next_follow_up || null });
      }
    } finally { setSaving(false); }
  };

  const titles = { create: 'Create Lead', edit: 'Edit Lead', assign: 'Assign Lead', reassign: 'Reassign Lead' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">{titles[mode]}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'assign' && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Search Available Lead</label>
              <input type="text" value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/70 mb-2"
                placeholder="Search by name, company, phone..." />
              <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl bg-white/3 p-1">
                {filtered.length === 0
                  ? <p className="text-center text-gray-500 py-4 text-sm">No unassigned leads</p>
                  : filtered.map(l => (
                    <div key={l.id} onClick={() => setSelectedLeadId(l.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedLeadId === l.id ? 'bg-blue-500/20 border-blue-500/40 text-white' : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{l.contact_person}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{l.company_name} · {l.phone || l.email}</p>
                        </div>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{l.source}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {mode === 'create' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Contact Person *</label>
                  <div className="relative"><Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input type="text" required value={form.contact_person} onChange={e => setForm(f => ({...f,contact_person:e.target.value}))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/70" placeholder="Full name" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Company Name</label>
                  <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input type="text" value={form.company_name} onChange={e => setForm(f => ({...f,company_name:e.target.value}))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/70" placeholder="Company" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
                  <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/70" placeholder="email@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
                  <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input type="text" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/70" placeholder="+91 98765 43210" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Est. Value (₹)</label>
                  <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input type="number" min={0} value={form.estimated_value} onChange={e => setForm(f => ({...f,estimated_value:parseFloat(e.target.value)||0}))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/70" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Lead Source</label>
                  <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <select value={form.lead_source} onChange={e => setForm(f => ({...f,lead_source:e.target.value}))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/70">
                      <option value="" className="bg-gray-900">Select source</option>
                      {SOURCES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
                <textarea value={form.lead_notes} rows={2} onChange={e => setForm(f => ({...f,lead_notes:e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/70 resize-none" placeholder="Lead notes..." />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority</label>
              <select value={form.lead_priority} onChange={e => setForm(f => ({...f,lead_priority:e.target.value as LeadPriority}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/70">
                {PRIORITIES.map(p => <option key={p.v} value={p.v} className="bg-gray-900">{p.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Stage</label>
              <select value={form.lead_stage} onChange={e => setForm(f => ({...f,lead_stage:e.target.value as LeadStage}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/70">
                {STAGES.map(s => <option key={s.v} value={s.v} className="bg-gray-900">{s.l}</option>)}
              </select>
            </div>
          </div>

          {(mode === 'edit' || mode === 'reassign') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Call Status</label>
                  <select value={form.call_status} onChange={e => setForm(f => ({...f,call_status:e.target.value as TelecallerLeadStatus}))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/70">
                    {STATUSES.map(s => <option key={s.v} value={s.v} className="bg-gray-900">{s.l}</option>)}
                  </select>
                </div>
                {(isManager || mode === 'reassign') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Assign To</label>
                    <select value={form.assigned_to} onChange={e => setForm(f => ({...f,assigned_to:e.target.value}))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/70">
                      {team.map(m => <option key={m.user_id} value={m.user_id} className="bg-gray-900">{m.full_name || m.email}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Next Follow-up</label>
                <input type="datetime-local" value={form.next_follow_up} onChange={e => setForm(f => ({...f,next_follow_up:e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/70" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
                <textarea value={form.notes} rows={3} onChange={e => setForm(f => ({...f,notes:e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/70 resize-none" placeholder="Lead notes..." />
              </div>
            </>
          )}

          {mode === 'assign' && isManager && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Assign To</label>
              <select value={form.assigned_to} onChange={e => setForm(f => ({...f,assigned_to:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/70">
                {team.map(m => <option key={m.user_id} value={m.user_id} className="bg-gray-900">{m.full_name || m.email}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/15 transition-colors">Cancel</button>
            <button type="submit" disabled={saving || (mode === 'assign' && !selectedLeadId)}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50">
              {saving ? 'Saving…' : { create:'Create Lead',edit:'Save Changes',assign:'Assign Lead',reassign:'Reassign' }[mode]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
