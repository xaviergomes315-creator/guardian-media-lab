import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { CreditCard, CheckCircle, Clock, AlertCircle, IndianRupee, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OutletContext { portalClient: { id: string; client_id: string } }

interface Payment {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  paid_date: string | null;
  due_date: string | null;
  created_at: string;
}

const fmtCurrency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PortalPayments() {
  const { portalClient } = useOutletContext<OutletContext>();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { if (portalClient?.client_id) loadPayments(); }, [portalClient]);

  async function loadPayments() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, status, paid_date, due_date, created_at')
      .eq('client_id', portalClient.client_id)
      .order('created_at', { ascending: false });
    if (err) setError('Failed to load payment data');
    else setPayments(data || []);
    setLoading(false);
  }

  const paid = payments.filter(p => p.status === 'paid');
  const pending = payments.filter(p => ['sent','partial'].includes(p.status));
  const overdue = payments.filter(p => p.status === 'overdue');

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.invoice_number.toLowerCase().includes(q);
    return matchSearch && (filter === 'all' || p.status === filter);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-gray-400">Track your payment history and outstanding dues</p>
      </motion.div>

      {error && <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Paid', value: fmtCurrency(paid.reduce((s,p) => s + p.amount, 0)), icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
          { label: 'Pending', value: fmtCurrency(pending.reduce((s,p) => s + p.amount, 0)), icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
          { label: 'Overdue', value: fmtCurrency(overdue.reduce((s,p) => s + p.amount, 0)), icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
          { label: 'Total Invoiced', value: fmtCurrency(payments.reduce((s,p) => s + p.amount, 0)), icon: IndianRupee, color: 'text-blue-400', bg: 'bg-blue-500/20' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
            <div><p className={`font-bold ${stat.color} text-sm md:text-base`}>{stat.value}</p><p className="text-xs text-gray-400">{stat.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by invoice number…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
          <option value="all" className="bg-gray-900">All</option>
          <option value="paid" className="bg-gray-900">Paid</option>
          <option value="sent" className="bg-gray-900">Pending</option>
          <option value="overdue" className="bg-gray-900">Overdue</option>
          <option value="partial" className="bg-gray-900">Partial</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {filtered.length === 0
          ? <div className="p-12 text-center text-gray-500"><CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>{payments.length === 0 ? 'No payment records found' : 'No matching records'}</p></div>
          : <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>{['Invoice #','Amount','Status','Due Date','Paid Date'].map(h => <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => {
                  const isOverdue = p.status !== 'paid' && p.due_date && new Date(p.due_date) < new Date();
                  const statusLabel = isOverdue ? 'Overdue' : p.status.charAt(0).toUpperCase() + p.status.slice(1);
                  const statusClass = isOverdue ? 'text-red-400 bg-red-500/20' : p.status === 'paid' ? 'text-green-400 bg-green-500/20' : 'text-yellow-400 bg-yellow-500/20';
                  return (
                    <tr key={p.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-white">{p.invoice_number}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-white">{fmtCurrency(p.amount)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusClass}`}>{statusLabel}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(p.due_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(p.paid_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}
