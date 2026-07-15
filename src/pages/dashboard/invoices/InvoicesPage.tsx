import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Download,
  Printer,
  Eye,
  Edit,
  Trash2,
  X,
  Building2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Copy,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { invoiceService, clientsService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Invoice,
  InvoiceItem,
  Client,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  GST_RATES,
  INDIAN_STATES,
  InvoiceStatus,
  PaymentMethod,
  GSTType,
} from '../../../types';

interface InvoiceStats {
  totalAmount: number;
  totalCount: number;
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
  overdueAmount: number;
  overdueCount: number;
  draftCount: number;
  monthlyRevenue: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  count: number;
}

const ITEMS_PER_PAGE = 10;

export default function InvoicesPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'reports'>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invoicesResult, clientsResult, statsResult, revenueResult] = await Promise.all([
        invoiceService.getAll(currentPage, ITEMS_PER_PAGE, statusFilter, searchQuery),
        clientsService.getAll(),
        invoiceService.getStats(),
        invoiceService.getMonthlyRevenue(),
      ]);

      setInvoices(invoicesResult.data);
      setTotalCount(invoicesResult.count);
      setClients(clientsResult);
      setStats(statsResult);
      setMonthlyRevenue(revenueResult);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Failed to load invoices');
    }
    setLoading(false);
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchData();
    showToast('success', 'Invoice created successfully');
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedInvoice(null);
    fetchData();
    showToast('success', 'Invoice updated successfully');
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    try {
      await invoiceService.delete(selectedInvoice.id);
      setShowDeleteConfirm(false);
      setSelectedInvoice(null);
      fetchData();
      showToast('success', 'Invoice deleted successfully');
    } catch {
      showToast('error', 'Failed to delete invoice');
    }
  };

  const handleDuplicate = async (invoice: Invoice) => {
    try {
      await invoiceService.duplicate(invoice.id);
      fetchData();
      showToast('success', 'Invoice duplicated successfully');
    } catch {
      showToast('error', 'Failed to duplicate invoice');
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    fetchData();
    showToast('success', 'Payment recorded successfully');
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getStatusBadge = (status: InvoiceStatus) => (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium text-white ${INVOICE_STATUS_COLORS[status]}`}>
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );

  const statsCards = [
    { label: 'Total Invoices', value: stats?.totalCount || 0, icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Revenue', value: `₹${(stats?.totalAmount || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'from-emerald-500 to-green-500' },
    { label: 'Paid', value: stats?.paidCount || 0, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
    { label: 'Pending', value: stats?.pendingCount || 0, icon: Clock, color: 'from-yellow-500 to-orange-500' },
    { label: 'Overdue', value: stats?.overdueCount || 0, icon: AlertCircle, color: 'from-red-500 to-rose-500' },
    { label: 'Monthly Revenue', value: `₹${(stats?.monthlyRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'from-purple-500 to-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white shadow-lg flex items-center gap-2`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            Invoice Management
          </h1>
          <p className="text-gray-400 mt-1">Create, manage and track professional invoices</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['dashboard', 'list', 'reports'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-emerald-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statsCards.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-5"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Revenue Chart */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-semibold text-white mb-6">Monthly Revenue</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Invoices */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Invoices</h3>
              <button
                onClick={() => setActiveTab('list')}
                className="text-emerald-400 hover:text-emerald-300 text-sm"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <p className="text-gray-400 text-center py-4">Loading...</p>
              ) : invoices.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No invoices found</p>
              ) : (
                invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowViewModal(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{invoice.invoice_number}</p>
                        <p className="text-xs text-gray-400">{invoice.client?.company_name || 'No client'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">₹{invoice.amount.toLocaleString('en-IN')}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search invoices..."
                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white min-w-[150px]"
            >
              <option value="all" className="bg-gray-900">All Status</option>
              <option value="draft" className="bg-gray-900">Draft</option>
              <option value="sent" className="bg-gray-900">Sent</option>
              <option value="paid" className="bg-gray-900">Paid</option>
              <option value="partially_paid" className="bg-gray-900">Partially Paid</option>
              <option value="overdue" className="bg-gray-900">Overdue</option>
            </select>
          </div>

          {/* Invoice Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Invoice</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Client</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Due Date</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">No invoices found</td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{invoice.invoice_number}</p>
                              <p className="text-xs text-gray-400">{new Date(invoice.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{invoice.client?.company_name || '-'}</p>
                          <p className="text-xs text-gray-400">{invoice.client?.email || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">₹{invoice.amount.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                        <td className="px-6 py-4 text-gray-400">
                          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowViewModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-emerald-400"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowEditModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowPaymentModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-green-400"
                              title="Add Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(invoice)}
                              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-blue-400"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                <p className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm ${
                          currentPage === page
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
        </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <InvoiceReports stats={stats} monthlyRevenue={monthlyRevenue} invoices={invoices} />
      )}

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <InvoiceFormModal
            clients={clients}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </AnimatePresence>

      {/* Edit Invoice Modal */}
      <AnimatePresence>
        {showEditModal && selectedInvoice && (
          <InvoiceFormModal
            invoice={selectedInvoice}
            clients={clients}
            onClose={() => {
              setShowEditModal(false);
              setSelectedInvoice(null);
            }}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>

      {/* View Invoice Modal */}
      <AnimatePresence>
        {showViewModal && selectedInvoice && (
          <InvoiceViewModal
            invoice={selectedInvoice}
            onClose={() => {
              setShowViewModal(false);
              setSelectedInvoice(null);
            }}
            onEdit={() => {
              setShowViewModal(false);
              setShowEditModal(true);
            }}
            onPayment={() => {
              setShowViewModal(false);
              setShowPaymentModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedInvoice && (
          <PaymentModal
            invoice={selectedInvoice}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedInvoice(null);
            }}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Invoice</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete invoice <span className="font-semibold text-white">{selectedInvoice?.invoice_number}</span>? All related items and payments will also be deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Invoice Form Modal Component
function InvoiceFormModal({
  invoice,
  clients,
  onClose,
  onSuccess,
}: {
  invoice?: Invoice;
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: invoice?.client_id || '',
    due_date: invoice?.due_date?.split('T')[0] || '',
    place_of_supply: invoice?.place_of_supply || '',
    gst_type: (invoice?.gst_type || 'intra') as GSTType,
    reverse_charge: invoice?.reverse_charge || false,
    notes: invoice?.notes || '',
    terms: invoice?.terms || 'Payment is due within 15 days from the invoice date.',
  });
  const [items, setItems] = useState<Partial<InvoiceItem>[]>(
    invoice?.items?.map((i) => ({
      description: i.description,
      hsn_sac: i.hsn_sac,
      quantity: i.quantity,
      rate: i.rate,
      discount: i.discount,
      tax_rate: i.tax_rate,
      amount: i.amount,
    })) || [{ description: '', hsn_sac: '', quantity: 1, rate: 0, discount: 0, tax_rate: 18, amount: 0 }]
  );

  const selectedClient = clients.find((c) => c.id === formData.client_id);

  const addItem = () => {
    setItems([...items, { description: '', hsn_sac: '', quantity: 1, rate: 0, discount: 0, tax_rate: 18, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Calculate amount
    const item = newItems[index];
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discount = Number(item.discount) || 0;
    const amount = qty * rate - discount;
    newItems[index].amount = amount;

    setItems(newItems);
  };

  // Calculate totals - use per-item tax_rate instead of a hardcoded 18%
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  // Sum tax per item: each item's taxable amount * its own tax_rate
  const totalTaxAmount = items.reduce((sum, item) => {
    const itemAmount = Number(item.amount) || 0;
    const itemTaxRate = Number(item.tax_rate) || 0;
    return sum + (itemAmount * itemTaxRate / 100);
  }, 0);
  const cgst = formData.gst_type === 'intra' ? totalTaxAmount / 2 : 0;
  const sgst = formData.gst_type === 'intra' ? totalTaxAmount / 2 : 0;
  const igst = formData.gst_type === 'inter' ? totalTaxAmount : 0;
  const taxAmount = cgst + sgst + igst;
  const roundOff = Math.round((subtotal + taxAmount) * 100) / 100 - (subtotal + taxAmount);
  const total = subtotal + taxAmount + roundOff;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Please select a client');
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        ...formData,
        subtotal,
        tax_amount: taxAmount,
        cgst,
        sgst,
        igst,
        round_off: Math.abs(roundOff),
        amount: total,
        status: 'draft' as InvoiceStatus,
      };

      if (invoice) {
        await invoiceService.update(invoice.id, invoiceData, items);
      } else {
        await invoiceService.create(invoiceData, items);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card p-6 max-w-4xl w-full my-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{invoice ? 'Edit Invoice' : 'Create New Invoice'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client & Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Client *</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="" className="bg-gray-900">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id} className="bg-gray-900">
                    {client.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Place of Supply</label>
              <select
                value={formData.place_of_supply}
                onChange={(e) => setFormData({ ...formData, place_of_supply: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="" className="bg-gray-900">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state} className="bg-gray-900">{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">GST Type</label>
              <select
                value={formData.gst_type}
                onChange={(e) => setFormData({ ...formData, gst_type: e.target.value as GSTType })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="intra" className="bg-gray-900">Intra-State (CGST + SGST)</option>
                <option value="inter" className="bg-gray-900">Inter-State (IGST)</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reverse_charge}
                  onChange={(e) => setFormData({ ...formData, reverse_charge: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                />
                Reverse Charge Applicable
              </label>
            </div>
          </div>

          {/* Client Details Display */}
          {selectedClient && (
            <div className="glass-card p-4 bg-emerald-500/10 border-emerald-500/20">
              <p className="text-sm text-emerald-400 mb-2 font-medium">Client Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Company</p>
                  <p className="text-white">{selectedClient.company_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">GSTIN</p>
                  <p className="text-white">{selectedClient.gst_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400">PAN</p>
                  <p className="text-white">{selectedClient.pan_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">Line Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {/* Desktop header row */}
            <div className="hidden lg:grid grid-cols-12 gap-3 text-xs font-medium text-gray-400 uppercase tracking-wide px-3 mb-2">
              <div className="col-span-4">Description</div>
              <div className="col-span-2">HSN/SAC</div>
              <div className="col-span-1 text-right">Qty</div>
              <div className="col-span-2 text-right">Rate (₹)</div>
              <div className="col-span-1 text-right">Disc (₹)</div>
              <div className="col-span-1 text-right">GST %</div>
              <div className="col-span-1 text-right">Amount</div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-white/5 border border-white/10 p-3 lg:p-0 lg:bg-transparent lg:border-0"
                >
                  {/* Desktop layout */}
                  <div className="hidden lg:grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.hsn_sac || ''}
                        onChange={(e) => updateItem(index, 'hsn_sac', e.target.value)}
                        placeholder="998311"
                        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full h-10 px-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-right focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => updateItem(index, 'rate', e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-right focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={item.discount || ''}
                        onChange={(e) => updateItem(index, 'discount', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full h-10 px-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-right focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-1">
                      <select
                        value={item.tax_rate ?? 18}
                        onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                        className="w-full h-10 px-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-right focus:outline-none focus:border-emerald-500"
                      >
                        {GST_RATES.map((rate) => (
                          <option key={rate} value={rate} className="bg-gray-900">{rate}%</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <span className="text-white font-semibold text-sm whitespace-nowrap">
                        ₹{(item.amount || 0).toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Item {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">HSN/SAC</label>
                        <input
                          type="text"
                          value={item.hsn_sac || ''}
                          onChange={(e) => updateItem(index, 'hsn_sac', e.target.value)}
                          placeholder="998311"
                          className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">GST %</label>
                        <select
                          value={item.tax_rate ?? 18}
                          onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                        >
                          {GST_RATES.map((rate) => (
                            <option key={rate} value={rate} className="bg-gray-900">{rate}%</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Qty</label>
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full h-10 px-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Rate (₹)</label>
                        <input
                          type="number"
                          value={item.rate || ''}
                          onChange={(e) => updateItem(index, 'rate', e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full h-10 px-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Disc (₹)</label>
                        <input
                          type="number"
                          value={item.discount || ''}
                          onChange={(e) => updateItem(index, 'discount', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full h-10 px-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-sm text-gray-400">Amount</span>
                      <span className="text-white font-semibold">
                        ₹{(item.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="hidden md:block"></div>
            <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {formData.gst_type === 'intra' ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">CGST (9%)</span>
                      <span className="text-white font-medium">₹{cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">SGST (9%)</span>
                      <span className="text-white font-medium">₹{sgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">IGST (18%)</span>
                    <span className="text-white font-medium">₹{igst.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Round Off</span>
                  <span className="text-white font-medium">₹{Math.abs(roundOff).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-base font-bold text-white">Grand Total</span>
                  <span className="text-xl font-bold text-emerald-400">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 resize-none"
                rows={3}
                placeholder="Additional notes for the client..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Terms & Conditions</label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Invoice View Modal
function InvoiceViewModal({
  invoice,
  onClose,
  onEdit,
  onPayment,
}: {
  invoice: Invoice;
  onClose: () => void;
  onEdit: () => void;
  onPayment: () => void;
}) {
  const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = invoice.amount - totalPaid;

  const handleDownloadPDF = () => {
    // Create a printable HTML version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1a1a1a; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .invoice-details { text-align: right; }
          .section { margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background: #f5f5f5; }
          .totals { text-align: right; margin-top: 20px; }
          .totals p { margin: 5px 0; }
          .paid { color: green; }
          .balance { color: #e5a50a; font-weight: bold; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>INVOICE</h1>
            <p><strong>${invoice.invoice_number}</strong></p>
          </div>
          <div class="invoice-details">
            <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Status:</strong> ${INVOICE_STATUS_LABELS[invoice.status]}</p>
          </div>
        </div>
        <div class="section">
          <h3>Bill To:</h3>
          <p>${invoice.client?.company_name || 'N/A'}</p>
          <p>${invoice.client?.contact_person || ''}</p>
          <p>${invoice.client?.email || ''}</p>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.items || []).map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>₹${item.rate.toLocaleString('en-IN')}</td>
                <td>₹${item.amount.toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <p><strong>Subtotal:</strong> ₹${(invoice.subtotal || invoice.amount).toLocaleString('en-IN')}</p>
          ${invoice.cgst ? `<p>CGST: ₹${invoice.cgst.toLocaleString('en-IN')}</p>` : ''}
          ${invoice.sgst ? `<p>SGST: ₹${invoice.sgst.toLocaleString('en-IN')}</p>` : ''}
          ${invoice.igst ? `<p>IGST: ₹${invoice.igst.toLocaleString('en-IN')}</p>` : ''}
          <p style="font-size: 18px;"><strong>Total: ₹${invoice.amount.toLocaleString('en-IN')}</strong></p>
          ${totalPaid > 0 ? `<p class="paid">Paid: ₹${totalPaid.toLocaleString('en-IN')}</p>` : ''}
          ${balanceDue > 0 ? `<p class="balance">Balance Due: ₹${balanceDue.toLocaleString('en-IN')}</p>` : ''}
        </div>
        ${invoice.notes ? `<div class="section"><h4>Notes:</h4><p>${invoice.notes}</p></div>` : ''}
        ${invoice.terms ? `<div class="section"><h4>Terms:</h4><p>${invoice.terms}</p></div>` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrint = () => {
    handleDownloadPDF();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-900 p-8 max-w-3xl w-full my-8 rounded-2xl border border-white/10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">INVOICE</h2>
            <p className="text-emerald-400 text-lg">{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center ml-auto">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <p className="font-bold text-white mt-2">Grow With Us</p>
          </div>
        </div>

        {/* Bill To & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-sm text-gray-400 mb-2">Bill To:</p>
            <p className="font-semibold text-white text-lg">{invoice.client?.company_name || 'N/A'}</p>
            <p className="text-gray-300">{invoice.client?.contact_person}</p>
            <p className="text-gray-400">{invoice.client?.email}</p>
            <p className="text-gray-400">{invoice.client?.phone}</p>
            {invoice.client?.gst_number && (
              <p className="text-gray-400 mt-2">GSTIN: {invoice.client.gst_number}</p>
            )}
          </div>
          <div className="text-right space-y-2">
            <div className="flex justify-end gap-4">
              <span className="text-gray-400">Invoice Date:</span>
              <span className="text-white">{new Date(invoice.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="text-gray-400">Due Date:</span>
              <span className="text-white">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="text-gray-400">Status:</span>
              <span className={`px-3 py-1 rounded-lg text-white ${INVOICE_STATUS_COLORS[invoice.status]}`}>
                {INVOICE_STATUS_LABELS[invoice.status]}
              </span>
            </div>
            {invoice.place_of_supply && (
              <div className="flex justify-end gap-4">
                <span className="text-gray-400">Place of Supply:</span>
                <span className="text-white">{invoice.place_of_supply}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-sm text-gray-400">#</th>
                <th className="text-left py-3 text-sm text-gray-400">Description</th>
                <th className="text-left py-3 text-sm text-gray-400">HSN/SAC</th>
                <th className="text-right py-3 text-sm text-gray-400">Qty</th>
                <th className="text-right py-3 text-sm text-gray-400">Rate</th>
                <th className="text-right py-3 text-sm text-gray-400">GST</th>
                <th className="text-right py-3 text-sm text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-800">
                  <td className="py-3 text-gray-400">{index + 1}</td>
                  <td className="py-3 text-white">{item.description}</td>
                  <td className="py-3 text-gray-400">{item.hsn_sac || '-'}</td>
                  <td className="py-3 text-right text-white">{item.quantity}</td>
                  <td className="py-3 text-right text-white">₹{item.rate.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-gray-400">{item.tax_rate}%</td>
                  <td className="py-3 text-right text-white">₹{item.amount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-700 pt-4 space-y-2">
          <div className="flex justify-end gap-8">
            <span className="text-gray-400">Subtotal:</span>
            <span className="text-white">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
          </div>
          {invoice.gst_type === 'intra' ? (
            <>
              <div className="flex justify-end gap-8">
                <span className="text-gray-400">CGST:</span>
                <span className="text-white">₹{invoice.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-end gap-8">
                <span className="text-gray-400">SGST:</span>
                <span className="text-white">₹{invoice.sgst.toLocaleString('en-IN')}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-end gap-8">
              <span className="text-gray-400">IGST:</span>
              <span className="text-white">₹{invoice.igst.toLocaleString('en-IN')}</span>
            </div>
          )}
          {invoice.discount_amount > 0 && (
            <div className="flex justify-end gap-8">
              <span className="text-gray-400">Discount:</span>
              <span className="text-red-400">-₹{invoice.discount_amount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-end gap-8 text-lg font-bold border-t border-gray-700 pt-2">
            <span className="text-white">Total:</span>
            <span className="text-emerald-400">₹{invoice.amount.toLocaleString('en-IN')}</span>
          </div>
          {totalPaid > 0 && (
            <>
              <div className="flex justify-end gap-8">
                <span className="text-gray-400">Paid:</span>
                <span className="text-green-400">₹{totalPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-end gap-8 font-bold">
                <span className="text-white">Balance Due:</span>
                <span className={balanceDue > 0 ? 'text-yellow-400' : 'text-green-400'}>
                  ₹{balanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Payments History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-white font-semibold mb-4">Payment History</h4>
            <div className="space-y-2">
              {invoice.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white">₹{payment.amount.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-400">
                      {PAYMENT_METHOD_LABELS[payment.payment_method]} - {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  {payment.transaction_id && (
                    <p className="text-sm text-gray-400">TXN: {payment.transaction_id}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoice.notes && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Notes:</p>
                <p className="text-sm text-gray-300">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Terms & Conditions:</p>
                <p className="text-sm text-gray-300">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={onPayment}
            className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-500 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Record Payment
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button onClick={handleDownloadPDF} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handlePrint} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Payment Modal
function PaymentModal({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: invoice.amount - (invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0),
    payment_method: 'bank_transfer' as PaymentMethod,
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    notes: '',
  });

  const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = invoice.amount - totalPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await invoiceService.payments.add(invoice.id, formData);
      onSuccess();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to record payment');
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card p-6 max-w-md w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Record Payment</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-white/5 rounded-xl">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Invoice Total:</span>
            <span className="text-white font-semibold">₹{invoice.amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Already Paid:</span>
            <span className="text-green-400">₹{totalPaid.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span className="text-gray-300">Balance Due:</span>
            <span className="text-emerald-400">₹{balanceDue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              min="0"
              max={balanceDue}
              step="0.01"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method *</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="cash" className="bg-gray-900">Cash</option>
              <option value="bank_transfer" className="bg-gray-900">Bank Transfer</option>
              <option value="upi" className="bg-gray-900">UPI</option>
              <option value="cheque" className="bg-gray-900">Cheque</option>
              <option value="card" className="bg-gray-900">Card</option>
              <option value="other" className="bg-gray-900">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Date *</label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Transaction ID</label>
            <input
              type="text"
              value={formData.transaction_id}
              onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
              placeholder="Optional reference number"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Record Payment
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Invoice Reports Component
function InvoiceReports({
  stats,
  monthlyRevenue,
  invoices,
}: {
  stats: InvoiceStats | null;
  monthlyRevenue: MonthlyData[];
  invoices: Invoice[];
}) {
  const [reportType, setReportType] = useState<'revenue' | 'pending' | 'paid'>('revenue');

  const exportCSV = () => {
    const data = invoices.map((inv) => ({
      'Invoice Number': inv.invoice_number,
      'Client': inv.client?.company_name || '',
      'Amount': inv.amount,
      'Status': inv.status,
      'Due Date': inv.due_date || '',
      'Created': inv.created_at.split('T')[0],
    }));

    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map((row) => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Report Type Tabs */}
      <div className="flex gap-2">
        {(['revenue', 'pending', 'paid'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              reportType === type
                ? 'bg-emerald-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {type === 'revenue' ? 'Revenue Summary' : type === 'pending' ? 'Pending Payments' : 'Paid Invoices'}
          </button>
        ))}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportCSV}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Revenue Summary */}
      {reportType === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-semibold text-white mb-6">Revenue Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-400">₹{(stats?.totalAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-400">Collected</p>
                <p className="text-2xl font-bold text-green-400">₹{(stats?.paidAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">₹{(stats?.pendingAmount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-red-400">₹{(stats?.overdueAmount || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-6">Monthly Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="rgba(16, 185, 129, 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pending Payments */}
      {reportType === 'pending' && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-6">
            Pending Invoices ({invoices.filter((i) => i.status === 'sent' || i.status === 'partially_paid' || i.status === 'overdue').length})
          </h3>
          <div className="space-y-3">
            {invoices
              .filter((i) => i.status === 'sent' || i.status === 'partially_paid' || i.status === 'overdue')
              .map((invoice) => {
                const paid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                const due = invoice.amount - paid;
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="font-medium text-white">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-400">{invoice.client?.company_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-yellow-400">₹{due.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">
                        Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* Paid Invoices */}
      {reportType === 'paid' && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-6">
            Paid Invoices ({invoices.filter((i) => i.status === 'paid').length})
          </h3>
          <div className="space-y-3">
            {invoices
              .filter((i) => i.status === 'paid')
              .map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="font-medium text-white">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-400">{invoice.client?.company_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400">₹{invoice.amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">
                      Paid: {invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
