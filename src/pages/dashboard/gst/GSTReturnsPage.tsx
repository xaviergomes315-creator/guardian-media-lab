import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Download,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  X,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  GSTReturn,
  GSTClient,
  GSTReturnType,
  GSTReturnStatus,
  GST_RETURN_TYPE_LABELS,
  GST_RETURN_STATUS_COLORS,
  GST_RETURN_STATUS_LABELS,
} from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

const RETURN_TYPES: GSTReturnType[] = ['GSTR1', 'GSTR3B', 'GSTR9', 'GSTR4', 'GSTR5', 'GSTR6', 'GSTR7', 'GSTR8', 'GSTR9C', 'GSTR10'];

export default function GSTReturnsPage() {
  const [returns, setReturns] = useState<GSTReturn[]>([]);
  const [clients, setClients] = useState<GSTClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GSTReturnStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<GSTReturnType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<GSTReturn | null>(null);
  const [showReturnDetails, setShowReturnDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<GSTReturn | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [returnsPerPage] = useState(10);
  const [toast, setToast] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { profile } = useAuth();

  const [newReturn, setNewReturn] = useState({
    client_id: '',
    return_type: 'GSTR1' as GSTReturnType,
    filing_period: '',
    due_date: '',
    filing_date: '',
    status: 'pending' as GSTReturnStatus,
    remarks: '',
    acknowledgement_number: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [returnsRes, clientsRes] = await Promise.all([
        supabase.from('gst_returns').select('*, client:gst_clients(id, company_name, gst_number)').order('due_date', { ascending: true }),
        supabase.from('gst_clients').select('id, company_name, gst_number').order('company_name'),
      ]);

      if (returnsRes.error) throw returnsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setReturns(returnsRes.data as GSTReturn[] || []);
      setClients((clientsRes.data as GSTClient[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data');
    }
    setLoading(false);
  };

  const validateForm = (ret: typeof newReturn): boolean => {
    const errors: Record<string, string> = {};

    if (!ret.client_id) errors.client_id = 'Client is required';
    if (!ret.return_type) errors.return_type = 'Return type is required';
    if (!ret.filing_period.trim()) errors.filing_period = 'Filing period is required';
    if (!ret.due_date) errors.due_date = 'Due date is required';
    if (ret.status === 'filed' && !ret.filing_date) errors.filing_date = 'Filing date is required for filed returns';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddReturn = async () => {
    if (!validateForm(newReturn)) return;

    const { error } = await supabase.from('gst_returns').insert([
      {
        ...newReturn,
        filing_date: newReturn.status === 'filed' ? newReturn.filing_date : null,
        user_id: profile?.user_id,
      },
    ]);

    if (error) {
      showToast('Error adding return');
      console.error(error);
    } else {
      showToast('Return added successfully');
      fetchData();
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleEditReturn = async () => {
    if (!selectedReturn) return;

    if (!validateForm({
      client_id: selectedReturn.client_id,
      return_type: selectedReturn.return_type,
      filing_period: selectedReturn.filing_period,
      due_date: selectedReturn.due_date,
      filing_date: selectedReturn.filing_date || '',
      status: selectedReturn.status,
      remarks: selectedReturn.remarks || '',
      acknowledgement_number: selectedReturn.acknowledgement_number || '',
    })) return;

    const { error } = await supabase
      .from('gst_returns')
      .update({
        client_id: selectedReturn.client_id,
        return_type: selectedReturn.return_type,
        filing_period: selectedReturn.filing_period,
        due_date: selectedReturn.due_date,
        filing_date: selectedReturn.status === 'filed' ? selectedReturn.filing_date : null,
        status: selectedReturn.status,
        remarks: selectedReturn.remarks,
        acknowledgement_number: selectedReturn.acknowledgement_number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedReturn.id);

    if (error) {
      showToast('Error updating return');
    } else {
      showToast('Return updated successfully');
      fetchData();
      setShowEditModal(false);
      setSelectedReturn(null);
    }
  };

  const handleDeleteReturn = async () => {
    if (!returnToDelete) return;

    const { error } = await supabase.from('gst_returns').delete().eq('id', returnToDelete.id);

    if (error) {
      showToast('Error deleting return');
    } else {
      showToast('Return deleted successfully');
      fetchData();
      setShowDeleteModal(false);
      setReturnToDelete(null);
    }
  };

  const resetForm = () => {
    setNewReturn({
      client_id: '',
      return_type: 'GSTR1',
      filing_period: '',
      due_date: '',
      filing_date: '',
      status: 'pending',
      remarks: '',
      acknowledgement_number: '',
    });
    setFormErrors({});
  };

  const filteredReturns = returns.filter((ret) => {
    const matchesSearch =
      ret.filing_period.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.client?.gst_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
    const matchesType = typeFilter === 'all' || ret.return_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const indexOfLastReturn = currentPage * returnsPerPage;
  const indexOfFirstReturn = indexOfLastReturn - returnsPerPage;
  const currentReturns = filteredReturns.slice(indexOfFirstReturn, indexOfLastReturn);
  const totalPages = Math.ceil(filteredReturns.length / returnsPerPage);

  const escapeCsvValue = (value: string | number | null | undefined): string => {
    const str = value == null ? '' : String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExport = () => {
    if (filteredReturns.length === 0) {
      showToast('No data available to export.');
      return;
    }

    const headers = [
      'Company Name', 'GST Number', 'Return Type', 'Filing Period', 'Due Date',
      'Filing Date', 'Status', 'Acknowledgement Number', 'Remarks', 'Created Date',
    ];

    const rows = filteredReturns.map((r) => [
      escapeCsvValue(r.client?.company_name),
      escapeCsvValue(r.client?.gst_number),
      escapeCsvValue(r.return_type),
      escapeCsvValue(r.filing_period),
      escapeCsvValue(r.due_date),
      escapeCsvValue(r.filing_date),
      escapeCsvValue(r.status),
      escapeCsvValue(r.acknowledgement_number),
      escapeCsvValue(r.remarks),
      escapeCsvValue(new Date(r.created_at).toLocaleDateString('en-CA')),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gst-returns-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Returns exported successfully.');
  };

  const isOverdue = (ret: GSTReturn) => {
    return ret.status === 'pending' && new Date(ret.due_date) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">GST Returns</h1>
          <p className="text-gray-400">Manage GST return filings</p>
        </div>
        <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Return
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client or period..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GSTReturnStatus | 'all')}
          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 min-w-[140px]"
        >
          <option value="all" className="bg-gray-900">All Status</option>
          <option value="pending" className="bg-gray-900">Pending</option>
          <option value="filed" className="bg-gray-900">Filed</option>
          <option value="overdue" className="bg-gray-900">Overdue</option>
          <option value="cancelled" className="bg-gray-900">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as GSTReturnType | 'all')}
          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 min-w-[140px]"
        >
          <option value="all" className="bg-gray-900">All Types</option>
          {RETURN_TYPES.map((t) => (
            <option key={t} value={t} className="bg-gray-900">{t}</option>
          ))}
        </select>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Client</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Return Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Filing Period</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Due Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Filing Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading returns...</td></tr>
              ) : currentReturns.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No returns found. Add your first return!</td></tr>
              ) : (
                currentReturns.map((ret, index) => (
                  <motion.tr
                    key={ret.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{ret.client?.company_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-400">{ret.client?.gst_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-lg text-sm bg-blue-500/20 text-blue-400">{ret.return_type}</span>
                    </td>
                    <td className="px-6 py-4 text-white">{ret.filing_period}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={isOverdue(ret) ? 'text-red-400' : 'text-white'}>
                          {new Date(ret.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {ret.filing_date ? new Date(ret.filing_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${GST_RETURN_STATUS_COLORS[isOverdue(ret) && ret.status === 'pending' ? 'overdue' : ret.status]} text-white`}>
                        {isOverdue(ret) && ret.status === 'pending' ? 'Overdue' : GST_RETURN_STATUS_LABELS[ret.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedReturn(ret); setShowReturnDetails(true); }}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedReturn(ret); setFormErrors({}); setShowEditModal(true); }}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setReturnToDelete(ret); setShowDeleteModal(true); }}
                          className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
                  </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {indexOfFirstReturn + 1} to {Math.min(indexOfLastReturn, filteredReturns.length)} of {filteredReturns.length} returns
          </p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                  {page}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Return Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)}>
            <motion.div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Add GST Return</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleAddReturn(); }}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Client *</label>
                    <select value={newReturn.client_id} onChange={(e) => setNewReturn({ ...newReturn, client_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500">
                      <option value="" className="bg-gray-900">Select Client</option>
                      {clients.map((c) => (<option key={c.id} value={c.id} className="bg-gray-900">{c.company_name} - {c.gst_number}</option>))}
                    </select>
                    {formErrors.client_id && <p className="text-red-400 text-xs mt-1">{formErrors.client_id}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Return Type *</label>
                    <select value={newReturn.return_type} onChange={(e) => setNewReturn({ ...newReturn, return_type: e.target.value as GSTReturnType })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500">
                      {RETURN_TYPES.map((t) => (<option key={t} value={t} className="bg-gray-900">{t} - {GST_RETURN_TYPE_LABELS[t]}</option>))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Filing Period *</label>
                    <input type="text" value={newReturn.filing_period} onChange={(e) => setNewReturn({ ...newReturn, filing_period: e.target.value })} placeholder="e.g., Jan 2024" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" />
                    {formErrors.filing_period && <p className="text-red-400 text-xs mt-1">{formErrors.filing_period}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Due Date *</label>
                    <input type="date" value={newReturn.due_date} onChange={(e) => setNewReturn({ ...newReturn, due_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" />
                    {formErrors.due_date && <p className="text-red-400 text-xs mt-1">{formErrors.due_date}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select value={newReturn.status} onChange={(e) => setNewReturn({ ...newReturn, status: e.target.value as GSTReturnStatus })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500">
                      <option value="pending" className="bg-gray-900">Pending</option>
                      <option value="filed" className="bg-gray-900">Filed</option>
                      <option value="cancelled" className="bg-gray-900">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Filing Date</label>
                    <input type="date" value={newReturn.filing_date} onChange={(e) => setNewReturn({ ...newReturn, filing_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" />
                    {formErrors.filing_date && <p className="text-red-400 text-xs mt-1">{formErrors.filing_date}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Acknowledgement Number</label>
                  <input type="text" value={newReturn.acknowledgement_number} onChange={(e) => setNewReturn({ ...newReturn, acknowledgement_number: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Remarks</label>
                  <textarea value={newReturn.remarks} onChange={(e) => setNewReturn({ ...newReturn, remarks: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none" rows={3} />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Add Return</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Return Modal */}
      <AnimatePresence>
        {showEditModal && selectedReturn && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)}>
            <motion.div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Edit GST Return</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleEditReturn(); }}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Client *</label>
                    <select value={selectedReturn.client_id} onChange={(e) => setSelectedReturn({ ...selectedReturn, client_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500">
                      {clients.map((c) => (<option key={c.id} value={c.id} className="bg-gray-900">{c.company_name} - {c.gst_number}</option>))}
                    </select>
                    {formErrors.client_id && <p className="text-red-400 text-xs mt-1">{formErrors.client_id}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Return Type *</label>
                    <select value={selectedReturn.return_type} onChange={(e) => setSelectedReturn({ ...selectedReturn, return_type: e.target.value as GSTReturnType })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500">
                      {RETURN_TYPES.map((t) => (<option key={t} value={t} className="bg-gray-900">{t} - {GST_RETURN_TYPE_LABELS[t]}</option>))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Filing Period *</label>
                    <input type="text" value={selectedReturn.filing_period} onChange={(e) => setSelectedReturn({ ...selectedReturn, filing_period: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" />
                    {formErrors.filing_period && <p className="text-red-400 text-xs mt-1">{formErrors.filing_period}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Due Date *</label>
                    <input type="date" value={selectedReturn.due_date} onChange={(e) => setSelectedReturn({ ...selectedReturn, due_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" />
                    {formErrors.due_date && <p className="text-red-400 text-xs mt-1">{formErrors.due_date}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select value={selectedReturn.status} onChange={(e) => setSelectedReturn({ ...selectedReturn, status: e.target.value as GSTReturnStatus })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500">
                      <option value="pending" className="bg-gray-900">Pending</option>
                      <option value="filed" className="bg-gray-900">Filed</option>
                      <option value="overdue" className="bg-gray-900">Overdue</option>
                      <option value="cancelled" className="bg-gray-900">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Filing Date</label>
                    <input type="date" value={selectedReturn.filing_date || ''} onChange={(e) => setSelectedReturn({ ...selectedReturn, filing_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" />
                    {formErrors.filing_date && <p className="text-red-400 text-xs mt-1">{formErrors.filing_date}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Acknowledgement Number</label>
                  <input type="text" value={selectedReturn.acknowledgement_number || ''} onChange={(e) => setSelectedReturn({ ...selectedReturn, acknowledgement_number: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Remarks</label>
                  <textarea value={selectedReturn.remarks || ''} onChange={(e) => setSelectedReturn({ ...selectedReturn, remarks: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none" rows={3} />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Details Modal */}
      <AnimatePresence>
        {showReturnDetails && selectedReturn && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReturnDetails(false)}>
            <motion.div className="glass-card p-6 max-w-2xl w-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedReturn.status === 'filed' ? 'bg-green-500/20 text-green-400' : isOverdue(selectedReturn) ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedReturn.return_type}</h3>
                    <p className="text-sm text-gray-400">{selectedReturn.filing_period}</p>
                  </div>
                </div>
                <button onClick={() => setShowReturnDetails(false)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 text-gray-400 mb-2"><Building2 className="w-4 h-4" /><span className="text-sm">Client</span></div>
                  <p className="text-white font-medium">{selectedReturn.client?.company_name || 'Unknown'}</p>
                  <p className="text-sm text-gray-400">{selectedReturn.client?.gst_number}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 text-gray-400 mb-2"><Calendar className="w-4 h-4" /><span className="text-sm">Due Date</span></div>
                  <p className={`text-white font-medium ${isOverdue(selectedReturn) ? 'text-red-400' : ''}`}>{new Date(selectedReturn.due_date).toLocaleDateString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 text-gray-400 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-sm">Filing Date</span></div>
                  <p className="text-white font-medium">{selectedReturn.filing_date ? new Date(selectedReturn.filing_date).toLocaleDateString() : 'Not filed'}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 text-gray-400 mb-2"><Clock className="w-4 h-4" /><span className="text-sm">Status</span></div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${GST_RETURN_STATUS_COLORS[selectedReturn.status]} text-white`}>
                    {GST_RETURN_STATUS_LABELS[selectedReturn.status]}
                  </span>
                </div>
              </div>

              {selectedReturn.acknowledgement_number && (
                <div className="p-4 rounded-xl bg-white/5 mb-6">
                  <p className="text-sm text-gray-400 mb-1">Acknowledgement Number</p>
                  <p className="text-white font-medium">{selectedReturn.acknowledgement_number}</p>
                </div>
              )}

              {selectedReturn.remarks && (
                <div className="p-4 rounded-xl bg-white/5 mb-6">
                  <p className="text-sm text-gray-400 mb-1">Remarks</p>
                  <p className="text-white">{selectedReturn.remarks}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button onClick={() => { setShowReturnDetails(false); setFormErrors({}); setShowEditModal(true); }} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" /> Edit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && returnToDelete && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)}>
            <motion.div className="glass-card p-6 max-w-md w-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0"><Trash2 className="w-6 h-6 text-red-400" /></div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Return</h3>
                  <p className="text-sm text-gray-400">{returnToDelete.return_type} - {returnToDelete.filing_period}</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">Are you sure you want to delete this return? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={handleDeleteReturn} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-8 rounded-xl transition-all">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
