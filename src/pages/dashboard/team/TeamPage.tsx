import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, UserCheck,
  Edit3, Trash2, Mail, Phone, Search, X,
  Briefcase, CheckCircle, AlertCircle, BarChart3,
  RefreshCw, Shield,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole, ROLE_LABELS } from '../../../types';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
}

interface NewMemberForm {
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  department: string;
  password: string;
}

const DEPARTMENTS = ['All', 'Marketing', 'Sales', 'Finance', 'Operations', 'Content', 'Technology', 'HR'];
const ALL_ROLES: UserRole[] = ['admin', 'telecaller', 'accountant', 'client'];

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  telecaller: 'bg-green-500/20 text-green-400 border-green-500/30',
  accountant: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  client: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const CHART_TOOLTIP_STYLE = { backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' };

export default function TeamPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('team');

  const [tab, setTab] = useState<'members' | 'performance' | 'roles'>('members');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [newForm, setNewForm] = useState<NewMemberForm>({ email: '', full_name: '', role: 'telecaller', phone: '', department: '', password: '' });

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, user_id, email, full_name, role, phone, department, is_active, created_at')
      .order('full_name');
    if (!err && data) setMembers(data as TeamMember[]);
    setLoading(false);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Call the invite-user Edge Function
      const { data, error: functionErr } = await supabase.functions.invoke('invite-user', {
        body: {
          email: newForm.email,
          full_name: newForm.full_name,
          role: newForm.role,
          phone: newForm.phone || null,
          department: newForm.department || null,
        }
      });

      if (functionErr) throw functionErr;
      if (data?.error) throw new Error(data.error);

      setSuccess(`Team member invited to ${newForm.email}. An invitation email has been sent.`);
      setShowAddModal(false);
      setNewForm({ email: '', full_name: '', role: 'telecaller', phone: '', department: '', password: '' });
      await loadMembers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setSaving(false);
      setTimeout(() => { setError(''); setSuccess(''); }, 4000);
    }
  }

  async function handleUpdateMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editMember) return;
    setSaving(true);
    const { error: err } = await supabase.from('profiles').update({
      full_name: editMember.full_name,
      role: editMember.role,
      phone: editMember.phone,
      department: editMember.department,
      is_active: editMember.is_active,
    }).eq('id', editMember.id);
    if (!err) {
      setSuccess('Team member updated successfully.');
      setEditMember(null);
      await loadMembers();
    } else {
      setError(err.message);
    }
    setSaving(false);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  }

  async function handleDeleteMember() {
    if (!deleteTarget) return;
    setSaving(true);
    const { error: err } = await supabase.from('profiles').delete().eq('id', deleteTarget.id);
    if (!err) {
      setSuccess('Team member removed.');
      setDeleteTarget(null);
      await loadMembers();
    } else {
      setError(err.message);
    }
    setSaving(false);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  }

  async function toggleActive(member: TeamMember) {
    await supabase.from('profiles').update({ is_active: !member.is_active }).eq('id', member.id);
    setMembers(ms => ms.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m));
  }

  const filtered = members.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (m.full_name || '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.department || '').toLowerCase().includes(q);
    const matchDept = deptFilter === 'All' || m.department === deptFilter;
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchDept && matchRole;
  });

  const activeCount = members.filter(m => m.is_active).length;
  const roleBreakdown: ChartPoint[] = Object.entries(
    members.reduce((acc, m) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([role, count]) => ({ role: ROLE_LABELS[role as UserRole] || role, count }));

  const deptBreakdown: ChartPoint[] = Object.entries(
    members.filter(m => m.department).reduce((acc, m) => { const d = m.department!; acc[d] = (acc[d] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([dept, count]) => ({ dept, count }));

  interface ChartPoint { [key: string]: string | number }

  const tabs = [
    { id: 'members', label: 'Team Members', icon: Users },
    { id: 'performance', label: 'Analytics', icon: BarChart3 },
    { id: 'roles', label: 'Roles', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Team Management
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Manage team members, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadMembers} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}
      {success && <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm">{success}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Team', value: members.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Active Members', value: activeCount, icon: UserCheck, color: 'from-green-500 to-emerald-500' },
          { label: 'Inactive', value: members.length - activeCount, icon: AlertCircle, color: 'from-yellow-500 to-orange-500' },
          { label: 'Departments', value: new Set(members.map(m => m.department).filter(Boolean)).size, icon: Briefcase, color: 'from-purple-500 to-pink-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4 md:p-5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            {loading ? <div className="h-7 w-12 bg-white/10 rounded animate-pulse mb-1" /> : <p className="text-2xl font-bold text-white">{stat.value}</p>}
            <p className="text-sm text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search team members…"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm min-w-[140px] focus:outline-none">
                {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
              </select>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm min-w-[140px] focus:outline-none">
                <option value="All" className="bg-gray-900">All Roles</option>
                {ALL_ROLES.map(r => <option key={r} value={r} className="bg-gray-900">{ROLE_LABELS[r] || r}</option>)}
              </select>
            </div>

            {/* Members Grid */}
            {loading
              ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="glass-card h-48 animate-pulse" />)}</div>
              : filtered.length === 0
              ? (
                <div className="text-center py-16 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No team members found</p>
                  {canManage && <button onClick={() => setShowAddModal(true)} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">Add first member</button>}
                </div>
              )
              : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(member => (
                    <motion.div key={member.id} layout className="glass-card p-4 md:p-5 group hover:border-blue-500/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {(member.full_name || member.email)[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{member.full_name || 'No name'}</p>
                            <p className="text-xs text-gray-400 truncate">{member.department || 'No department'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canManage && (
                            <>
                              <button onClick={() => setEditMember({ ...member })} className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setDeleteTarget(member)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-gray-400 text-xs"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{member.email}</span></div>
                        {member.phone && <div className="flex items-center gap-2 text-gray-400 text-xs"><Phone className="w-3.5 h-3.5" />{member.phone}</div>}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${ROLE_COLORS[member.role] || ROLE_COLORS.client}`}>
                            {ROLE_LABELS[member.role] || member.role}
                          </span>
                          <button onClick={() => canManage && toggleActive(member)}
                            className={`flex items-center gap-1 text-xs font-medium transition-colors ${member.is_active ? 'text-green-400' : 'text-gray-500'} ${canManage ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>
                            {member.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            }
            {filtered.length > 0 && <p className="text-xs text-gray-500 text-right">{filtered.length} of {members.length} members</p>}
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {tab === 'performance' && (
          <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" />Members by Role</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="role" stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="count" fill="rgba(59,130,246,0.7)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-purple-400" />Members by Department</h3>
                <div className="h-64">
                  {deptBreakdown.length === 0
                    ? <div className="h-full flex items-center justify-center text-gray-500 text-sm">No department data</div>
                    : <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="dept" stroke="#6b7280" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="count" fill="rgba(168,85,247,0.7)" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  }
                </div>
              </div>
            </div>
            {/* Member list with status */}
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>{['Name','Email','Role','Department','Status'].map(h => <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium">{m.full_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{m.email}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${ROLE_COLORS[m.role] || ROLE_COLORS.client}`}>{ROLE_LABELS[m.role] || m.role}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-400">{m.department || '—'}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-medium ${m.is_active ? 'text-green-400' : 'text-gray-500'}`}>{m.is_active ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ROLES TAB */}
        {tab === 'roles' && (
          <motion.div key="roles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_ROLES.map(role => {
                const count = members.filter(m => m.role === role).length;
                return (
                  <div key={role} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm border ${ROLE_COLORS[role] || ROLE_COLORS.client}`}>{ROLE_LABELS[role] || role}</span>
                      <span className="text-2xl font-bold text-white">{count}</span>
                    </div>
                    <p className="text-xs text-gray-500">{count === 1 ? '1 member' : `${count} members`} with this role</p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500/60" style={{ width: members.length > 0 ? `${(count / members.length) * 100}%` : '0%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}>
            <motion.div className="glass-card p-6 w-full max-w-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-400" />Add Team Member</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleAddMember} className="space-y-4">
                {[
                  { key: 'full_name', label: 'Full Name *', type: 'text', placeholder: 'Full name' },
                  { key: 'email', label: 'Email *', type: 'email', placeholder: 'email@example.com' },
                  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
                  { key: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Sales, Finance' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">{f.label}</label>
                    <input type={f.type} required={f.label.endsWith('*')} value={newForm[f.key as keyof NewMemberForm]}
                      onChange={e => setNewForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      placeholder={f.placeholder} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Role *</label>
                  <select value={newForm.role} onChange={e => setNewForm(p => ({ ...p, role: e.target.value as UserRole }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500">
                    {ALL_ROLES.map(r => <option key={r} value={r} className="bg-gray-900">{ROLE_LABELS[r] || r}</option>)}
                  </select>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm hover:bg-white/15 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50">{saving ? 'Adding…' : 'Add Member'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editMember && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditMember(null)}>
            <motion.div className="glass-card p-6 w-full max-w-md" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-400" />Edit Member</h3>
                <button onClick={() => setEditMember(null)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleUpdateMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                  <input type="text" value={editMember.full_name || ''} onChange={e => setEditMember(m => m ? { ...m, full_name: e.target.value } : m)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
                  <input type="tel" value={editMember.phone || ''} onChange={e => setEditMember(m => m ? { ...m, phone: e.target.value } : m)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Department</label>
                  <input type="text" value={editMember.department || ''} onChange={e => setEditMember(m => m ? { ...m, department: e.target.value } : m)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
                  <select value={editMember.role} onChange={e => setEditMember(m => m ? { ...m, role: e.target.value as UserRole } : m)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500">
                    {ALL_ROLES.map(r => <option key={r} value={r} className="bg-gray-900">{ROLE_LABELS[r] || r}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" checked={editMember.is_active} onChange={e => setEditMember(m => m ? { ...m, is_active: e.target.checked } : m)} className="w-4 h-4 accent-blue-500" />
                  <label htmlFor="is_active" className="text-sm text-gray-300">Active member</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditMember(null)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm hover:bg-white/15 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)}>
            <motion.div className="glass-card p-6 w-full max-w-sm" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0"><Trash2 className="w-6 h-6 text-red-400" /></div>
                <div>
                  <h3 className="font-semibold text-white">Remove Team Member</h3>
                  <p className="text-sm text-gray-400 mt-1">Remove <strong className="text-white">{deleteTarget.full_name || deleteTarget.email}</strong>? This removes their profile from the system.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-sm hover:bg-white/15 transition-colors">Cancel</button>
                <button onClick={handleDeleteMember} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50">{saving ? 'Removing…' : 'Remove'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
