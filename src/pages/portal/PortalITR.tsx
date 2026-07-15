import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { FileText, Clock, CheckCircle, IndianRupee, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OutletContext { portalClient: { id: string; client_id: string } }

interface PortalITR {
  id: string;
  assessment_year: string;
  itr_type: string;
  status: string;
  filing_date: string | null;
  acknowledgement_number: string | null;
  taxable_income: number | null;
  tax_payable: number | null;
  refund_amount: number | null;
  notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  filed: 'text-green-400 bg-green-500/20',
  acknowledged: 'text-blue-400 bg-blue-500/20',
  pending: 'text-yellow-400 bg-yellow-500/20',
  rejected: 'text-red-400 bg-red-500/20',
};

const fmtCurrency = (n: number | null) => n == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PortalITR() {
  const { portalClient } = useOutletContext<OutletContext>();
  const [loading, setLoading] = useState(true);
  const [itrs, setItrs] = useState<PortalITR[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (portalClient?.id) loadITRs(); }, [portalClient]);

  async function loadITRs() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('portal_itr')
      .select('*')
      .eq('portal_client_id', portalClient.id)
      .order('assessment_year', { ascending: false });
    if (err) setError('Failed to load ITR data');
    else setItrs(data || []);
    setLoading(false);
  }

  const filtered = itrs.filter(i => {
    const q = search.toLowerCase();
    return !q || i.assessment_year.includes(q) || i.itr_type.toLowerCase().includes(q) || i.status.includes(q);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Income Tax Returns</h1>
        <p className="text-gray-400">View your ITR filing status and history</p>
      </motion.div>

      {error && <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Filed', value: itrs.filter(i => i.status === 'filed' || i.status === 'acknowledged').length, color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
          { label: 'Pending', value: itrs.filter(i => i.status === 'pending').length, color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
          { label: 'Total Refund', value: fmtCurrency(itrs.reduce((s,i) => s + (i.refund_amount || 0), 0)), color: 'text-blue-400', bg: 'bg-blue-500/20', icon: IndianRupee },
          { label: 'Total Tax Paid', value: fmtCurrency(itrs.reduce((s,i) => s + (i.tax_payable || 0), 0)), color: 'text-purple-400', bg: 'bg-purple-500/20', icon: FileText },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
            <div><p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p><p className="text-xs text-gray-400">{stat.label}</p></div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by year, type, status…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0
          ? <div className="text-center py-12 text-gray-500"><FileText className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>{itrs.length === 0 ? 'No ITR records found' : 'No matching records'}</p></div>
          : filtered.map(itr => (
            <div key={itr.id} className="glass-card p-4 md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{itr.itr_type} — {itr.assessment_year}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[itr.status] || 'text-gray-400 bg-gray-500/20'}`}>
                      {itr.status.charAt(0).toUpperCase() + itr.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-2">
                    {itr.filing_date && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Filed: {fmtDate(itr.filing_date)}</span>}
                    {itr.acknowledgement_number && <span className="font-mono">Ack: {itr.acknowledgement_number}</span>}
                    {itr.taxable_income != null && <span>Income: {fmtCurrency(itr.taxable_income)}</span>}
                    {itr.tax_payable != null && <span>Tax: {fmtCurrency(itr.tax_payable)}</span>}
                    {itr.refund_amount != null && itr.refund_amount > 0 && <span className="text-green-400">Refund: {fmtCurrency(itr.refund_amount)}</span>}
                  </div>
                  {itr.notes && <p className="text-xs text-gray-500 mt-2">{itr.notes}</p>}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
