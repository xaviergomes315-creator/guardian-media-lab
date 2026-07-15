import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { GSTReturn, GST_RETURN_STATUS_COLORS, GST_RETURN_STATUS_LABELS } from '../../../types';

interface ReportStats {
  totalReturns: number;
  pendingReturns: number;
  filedReturns: number;
  overdueReturns: number;
  totalClients: number;
  activeClients: number;
}

export default function GSTReportsPage() {
  const [stats, setStats] = useState<ReportStats>({
    totalReturns: 0,
    pendingReturns: 0,
    filedReturns: 0,
    overdueReturns: 0,
    totalClients: 0,
    activeClients: 0,
  });
  const [monthlyReturns, setMonthlyReturns] = useState<GSTReturn[]>([]);
  const [pendingReturns, setPendingReturns] = useState<GSTReturn[]>([]);
  const [filedReturns, setFiledReturns] = useState<GSTReturn[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [filterMonth]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [clientsRes, returnsRes] = await Promise.all([
        supabase.from('gst_clients').select('*'),
        supabase.from('gst_returns').select('*, client:gst_clients(id, company_name, gst_number)').order('due_date', { ascending: true }),
      ]);

      const clients = clientsRes.data || [];
      const returns = returnsRes.data || [];
      const now = new Date();

      const clientStats: ReportStats = {
        totalClients: clients.length,
        activeClients: clients.filter((c) => c.status === 'active').length,
        totalReturns: returns.length,
        pendingReturns: returns.filter((r) => r.status === 'pending' && new Date(r.due_date) >= now).length,
        filedReturns: returns.filter((r) => r.status === 'filed').length,
        overdueReturns: returns.filter((r) => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < now)).length,
      };

      setStats(clientStats);
      setPendingReturns(returns.filter((r) => r.status === 'pending' || r.status === 'overdue'));
      setFiledReturns(returns.filter((r) => r.status === 'filed'));

      const monthStart = new Date(filterMonth + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const monthReturns = returns.filter((r) => {
        const dueDate = new Date(r.due_date);
        return dueDate >= monthStart && dueDate <= monthEnd;
      });
      setMonthlyReturns(monthReturns);
    } catch (error) {
      console.error('Error fetching report data:', error);
      showToast('Error loading report data');
    }
    setLoading(false);
  };

  const escapeCsvValue = (value: string | number | null | undefined): string => {
    const str = value == null ? '' : String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportMonthly = () => {
    if (monthlyReturns.length === 0) {
      showToast('No data available to export.');
      return;
    }

    const headers = ['Company Name', 'GST Number', 'Return Type', 'Filing Period', 'Due Date', 'Filing Date', 'Status', 'Remarks'];
    const rows = monthlyReturns.map((r) => [
      escapeCsvValue(r.client?.company_name),
      escapeCsvValue(r.client?.gst_number),
      escapeCsvValue(r.return_type),
      escapeCsvValue(r.filing_period),
      escapeCsvValue(r.due_date),
      escapeCsvValue(r.filing_date),
      escapeCsvValue(r.status),
      escapeCsvValue(r.remarks),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gst-monthly-report-${filterMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Monthly report exported successfully.');
  };

  const handleExportPending = () => {
    if (pendingReturns.length === 0) {
      showToast('No pending returns to export.');
      return;
    }

    const headers = ['Company Name', 'GST Number', 'Return Type', 'Filing Period', 'Due Date', 'Days Overdue', 'Status'];
    const now = new Date();
    const rows = pendingReturns.map((r) => {
      const dueDate = new Date(r.due_date);
      const daysOverdue = dueDate < now ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return [
        escapeCsvValue(r.client?.company_name),
        escapeCsvValue(r.client?.gst_number),
        escapeCsvValue(r.return_type),
        escapeCsvValue(r.filing_period),
        escapeCsvValue(r.due_date),
        escapeCsvValue(daysOverdue),
        escapeCsvValue(r.status),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gst-pending-returns-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Pending returns exported successfully.');
  };

  const handleExportFiled = () => {
    if (filedReturns.length === 0) {
      showToast('No filed returns to export.');
      return;
    }

    const headers = ['Company Name', 'GST Number', 'Return Type', 'Filing Period', 'Due Date', 'Filing Date', 'Acknowledgement Number', 'Remarks'];
    const rows = filedReturns.map((r) => [
      escapeCsvValue(r.client?.company_name),
      escapeCsvValue(r.client?.gst_number),
      escapeCsvValue(r.return_type),
      escapeCsvValue(r.filing_period),
      escapeCsvValue(r.due_date),
      escapeCsvValue(r.filing_date),
      escapeCsvValue(r.acknowledgement_number),
      escapeCsvValue(r.remarks),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gst-filed-returns-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Filed returns exported successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">GST Reports</h1>
          <p className="text-gray-400">Generate and export GST compliance reports</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleExportMonthly} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Monthly
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 text-center">
          <Building2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
          <p className="text-sm text-gray-400">Total Clients</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 text-center">
          <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.activeClients}</p>
          <p className="text-sm text-gray-400">Active Clients</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 text-center">
          <FileText className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalReturns}</p>
          <p className="text-sm text-gray-400">Total Returns</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.filedReturns}</p>
          <p className="text-sm text-gray-400">Filed</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4 text-center">
          <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.pendingReturns}</p>
          <p className="text-sm text-gray-400">Pending</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.overdueReturns}</p>
          <p className="text-sm text-gray-400">Overdue</p>
        </motion.div>
      </div>

      {/* Monthly Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">
              Monthly Summary - {new Date(filterMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <button onClick={handleExportMonthly} className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading...</p>
        ) : monthlyReturns.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No returns for the selected month</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Client</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Return Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Period</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Due Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReturns.map((r) => {
                  const isOverdue = r.status === 'pending' && new Date(r.due_date) < new Date();
                  return (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-white">{r.client?.company_name || 'Unknown'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs bg-blue-500/20 text-blue-400">{r.return_type}</span></td>
                      <td className="px-4 py-3 text-white">{r.filing_period}</td>
                      <td className="px-4 py-3 text-white">{new Date(r.due_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${GST_RETURN_STATUS_COLORS[isOverdue ? 'overdue' : r.status]} text-white`}>
                          {isOverdue ? 'Overdue' : GST_RETURN_STATUS_LABELS[r.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
                    </div>
        )}
      </motion.div>

      {/* Pending Returns */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Pending Returns</h3>
            <span className="px-2 py-1 rounded-lg text-xs bg-yellow-500/20 text-yellow-400">{pendingReturns.length}</span>
          </div>
          <button onClick={handleExportPending} className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {pendingReturns.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No pending returns</p>
        ) : (
          <div className="space-y-3">
            {pendingReturns.slice(0, 10).map((r) => {
              const isOverdue = r.status === 'pending' && new Date(r.due_date) < new Date();
              const daysOverdue = isOverdue ? Math.ceil((new Date().getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
              return (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{r.client?.company_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">{r.return_type} - {r.filing_period}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                      Due: {new Date(r.due_date).toLocaleDateString()}
                    </p>
                    {isOverdue && <p className="text-xs text-red-400">{daysOverdue} days overdue</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Filed Returns */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Filed Returns</h3>
            <span className="px-2 py-1 rounded-lg text-xs bg-green-500/20 text-green-400">{filedReturns.length}</span>
          </div>
          <button onClick={handleExportFiled} className="btn-secondary text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {filedReturns.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No filed returns</p>
        ) : (
          <div className="space-y-3">
            {filedReturns.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{r.client?.company_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-400">{r.return_type} - {r.filing_period}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Filed: {r.filing_date ? new Date(r.filing_date).toLocaleDateString() : 'N/A'}</p>
                  {r.acknowledgement_number && <p className="text-xs text-blue-400">{r.acknowledgement_number}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Toast */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: toast ? 1 : 0, y: toast ? 0 : 40 }}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg pointer-events-none"
      >
        {toast}
      </motion.div>
    </div>
  );
}
