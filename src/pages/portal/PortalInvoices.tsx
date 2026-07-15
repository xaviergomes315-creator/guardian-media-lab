import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Download, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OutletContext { portalClient: { id: string; client_id: string } }

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-gray-400 bg-gray-500/20',
  sent: 'text-blue-400 bg-blue-500/20',
  paid: 'text-green-400 bg-green-500/20',
  partial: 'text-yellow-400 bg-yellow-500/20',
  overdue: 'text-red-400 bg-red-500/20',
  cancelled: 'text-red-400 bg-red-500/20',
};

const fmtCurrency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PortalInvoices() {
  const { portalClient } = useOutletContext<OutletContext>();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { if (portalClient?.client_id) loadInvoices(); }, [portalClient]);

  async function loadInvoices() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, status, due_date, paid_date, notes, created_at')
      .eq('client_id', portalClient.client_id)
      .order('created_at', { ascending: false });
    if (err) setError('Failed to load invoices');
    else setInvoices(data || []);
    setLoading(false);
  }

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q || inv.invoice_number.toLowerCase().includes(q);
    return matchSearch && (statusFilter === 'all' || inv.status === statusFilter);
  });

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = invoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.amount || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <p className="text-gray-400">View and track all your invoices</p>
      </motion.div>

      {error && <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Invoices', value: invoices.length, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/20' },
          { label: 'Total Paid', value: fmtCurrency(totalPaid), icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
          { label: 'Pending Amount', value: fmtCurrency(totalPending), icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
            <div><p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p><p className="text-sm text-gray-400">{stat.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
          <option value="all" className="bg-gray-900">All Status</option>
          {['draft','sent','paid','partial','overdue','cancelled'].map(s => <option key={s} value={s} className="bg-gray-900 capitalize">{s}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {filtered.length === 0
          ? <div className="p-12 text-center text-gray-500"><FileText className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>{invoices.length === 0 ? 'No invoices found' : 'No matching invoices'}</p></div>
          : <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>{['Invoice #','Amount','Status','Due Date','Paid Date','Actions'].map(h => <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-white">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-white font-semibold">{fmtCurrency(inv.amount)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_COLORS[inv.status] || 'text-gray-400 bg-gray-500/20'}`}>{inv.status}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(inv.paid_date)}</td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors" title="Download"><Download className="w-3.5 h-3.5" /></button>
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
