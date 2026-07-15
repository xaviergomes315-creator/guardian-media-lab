import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { FileCheck, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { GST_RETURN_STATUS_LABELS, GST_RETURN_STATUS_COLORS, GST_RETURN_TYPE_LABELS, GSTReturnType } from '../../types';

interface OutletContext { portalClient: { id: string; client_id: string; gst_number?: string } }

interface GSTReturn {
  id: string;
  return_type: GSTReturnType;
  filing_period: string;
  due_date: string;
  filing_date: string | null;
  status: string;
  acknowledgement_number: string | null;
  remarks: string | null;
}

export default function PortalGSTReturns() {
  const { portalClient } = useOutletContext<OutletContext>();
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<GSTReturn[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { if (portalClient?.client_id) loadReturns(); }, [portalClient]);

  async function loadReturns() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('gst_returns')
      .select('*')
      .eq('client_id', portalClient.client_id)
      .order('created_at', { ascending: false });
    if (err) setError('Failed to load GST returns');
    else setReturns(data || []);
    setLoading(false);
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const filtered = returns.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || r.filing_period.toLowerCase().includes(q) || r.return_type.toLowerCase().includes(q);
    return matchSearch && (statusFilter === 'all' || r.status === statusFilter);
  });

  const filed = returns.filter(r => r.status === 'filed').length;
  const pending = returns.filter(r => r.status === 'pending').length;
  const overdue = returns.filter(r => r.status === 'overdue').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">GST Returns</h1>
        <p className="text-gray-400">View your GST return filing status</p>
      </motion.div>

      {error && <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Filed', value: filed, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
          { label: 'Pending', value: pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
          { label: 'Overdue', value: overdue, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
            <div><p className="text-2xl font-bold text-white">{stat.value}</p><p className="text-sm text-gray-400">{stat.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search returns…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
          <option value="all" className="bg-gray-900">All Status</option>
          <option value="filed" className="bg-gray-900">Filed</option>
          <option value="pending" className="bg-gray-900">Pending</option>
          <option value="overdue" className="bg-gray-900">Overdue</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {filtered.length === 0
          ? <div className="p-12 text-center text-gray-500"><FileCheck className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>{returns.length === 0 ? 'No GST returns found' : 'No matches for your search'}</p></div>
          : <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>{['Return Type','Period','Due Date','Filed Date','Ack. Number','Status'].map(h => <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-white">{GST_RETURN_TYPE_LABELS[r.return_type as GSTReturnType] || r.return_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{r.filing_period}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{fmtDate(r.due_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{fmtDate(r.filing_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">{r.acknowledgement_number || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${GST_RETURN_STATUS_COLORS[r.status as keyof typeof GST_RETURN_STATUS_COLORS] || 'text-gray-400 bg-gray-500/20'}`}>
                        {GST_RETURN_STATUS_LABELS[r.status as keyof typeof GST_RETURN_STATUS_LABELS] || r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}
