import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Download,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit,
  Trash2,
  Eye,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  GSTClient,
  GSTClientStatus,
  GSTClientType,
  GST_CLIENT_STATUS_COLORS,
  GST_CLIENT_STATUS_LABELS,
  GST_TYPE_LABELS,
  INDIAN_STATES,
} from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

export default function GSTClientsPage() {
  const [clients, setClients] = useState<GSTClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GSTClientStatus | 'all'>('all');
  const [gstTypeFilter, setGstTypeFilter] = useState<GSTClientType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<GSTClient | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<GSTClient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(9);
  const [toast, setToast] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { profile } = useAuth();

  const [newClient, setNewClient] = useState({
    company_name: '',
    gst_number: '',
    pan_number: '',
    contact_person: '',
    mobile: '',
    email: '',
    address: '',
    state: '',
    gst_type: 'regular' as GSTClientType,
    registration_date: '',
    status: 'active' as GSTClientStatus,
    notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const validateGSTNumber = (gst: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst.toUpperCase());
  };

  const validatePANNumber = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return !pan || panRegex.test(pan.toUpperCase());
  };

  const validateForm = (client: typeof newClient): boolean => {
    const errors: Record<string, string> = {};

    if (!client.company_name.trim()) errors.company_name = 'Company name is required';
    if (!client.gst_number.trim()) {
      errors.gst_number = 'GST number is required';
    } else if (!validateGSTNumber(client.gst_number)) {
      errors.gst_number = 'Invalid GST number format';
    }
    if (!client.contact_person.trim()) errors.contact_person = 'Contact person is required';
    if (client.pan_number && !validatePANNumber(client.pan_number)) {
      errors.pan_number = 'Invalid PAN number format';
    }
    if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
      errors.email = 'Invalid email format';
    }
    if (client.mobile && !/^\d{10}$/.test(client.mobile.replace(/\D/g, ''))) {
      errors.mobile = 'Invalid mobile number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gst_clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching GST clients:', error);
      showToast('Error loading clients');
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleAddClient = async () => {
    if (!validateForm(newClient)) return;

    const { error } = await supabase.from('gst_clients').insert([
      {
        ...newClient,
        gst_number: newClient.gst_number.toUpperCase(),
        pan_number: newClient.pan_number?.toUpperCase() || null,
        user_id: profile?.user_id,
      },
    ]);

    if (error) {
      if (error.code === '23505') {
        showToast('GST number already exists');
      } else {
        showToast('Error adding client');
      }
    } else {
      showToast('Client added successfully');
      fetchClients();
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient || !validateForm({
      company_name: selectedClient.company_name,
      gst_number: selectedClient.gst_number,
      pan_number: selectedClient.pan_number || '',
      contact_person: selectedClient.contact_person,
      mobile: selectedClient.mobile || '',
      email: selectedClient.email || '',
      address: selectedClient.address || '',
      state: selectedClient.state || '',
      gst_type: selectedClient.gst_type,
      registration_date: selectedClient.registration_date || '',
      status: selectedClient.status,
      notes: selectedClient.notes || '',
    })) return;

    const { error } = await supabase
      .from('gst_clients')
      .update({
        company_name: selectedClient.company_name,
        gst_number: selectedClient.gst_number.toUpperCase(),
        pan_number: selectedClient.pan_number?.toUpperCase() || null,
        contact_person: selectedClient.contact_person,
        mobile: selectedClient.mobile,
        email: selectedClient.email,
        address: selectedClient.address,
        state: selectedClient.state,
        gst_type: selectedClient.gst_type,
        registration_date: selectedClient.registration_date,
        status: selectedClient.status,
        notes: selectedClient.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedClient.id);

    if (error) {
      if (error.code === '23505') {
        showToast('GST number already exists');
      } else {
        showToast('Error updating client');
      }
    } else {
      showToast('Client updated successfully');
      fetchClients();
      setShowEditModal(false);
      setSelectedClient(null);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    const { error } = await supabase
      .from('gst_clients')
      .delete()
      .eq('id', clientToDelete.id);

    if (error) {
      showToast('Error deleting client');
    } else {
      showToast('Client deleted successfully');
      fetchClients();
      setShowDeleteModal(false);
      setClientToDelete(null);
    }
  };

  const resetForm = () => {
    setNewClient({
      company_name: '',
      gst_number: '',
      pan_number: '',
      contact_person: '',
      mobile: '',
      email: '',
      address: '',
      state: '',
      gst_type: 'regular',
      registration_date: '',
      status: 'active',
      notes: '',
    });
    setFormErrors({});
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.gst_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_person.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesType = gstTypeFilter === 'all' || client.gst_type === gstTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const escapeCsvValue = (value: string | number | null | undefined): string => {
    const str = value == null ? '' : String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExport = () => {
    if (filteredClients.length === 0) {
      showToast('No data available to export.');
      return;
    }

    const headers = [
      'Company Name', 'GST Number', 'PAN Number', 'Contact Person', 'Mobile', 'Email',
      'Address', 'State', 'GST Type', 'Registration Date', 'Status', 'Created Date',
    ];

    const rows = filteredClients.map((c) => [
      escapeCsvValue(c.company_name),
      escapeCsvValue(c.gst_number),
      escapeCsvValue(c.pan_number),
      escapeCsvValue(c.contact_person),
      escapeCsvValue(c.mobile),
      escapeCsvValue(c.email),
      escapeCsvValue(c.address),
      escapeCsvValue(c.state),
      escapeCsvValue(c.gst_type),
      escapeCsvValue(c.registration_date),
      escapeCsvValue(c.status),
      escapeCsvValue(new Date(c.created_at).toLocaleDateString('en-CA')),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gst-clients-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Clients exported successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">GST Clients</h1>
          <p className="text-gray-400">Manage GST registered clients</p>
        </div>
        <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, GST number, or contact..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GSTClientStatus | 'all')}
          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 min-w-[140px]"
        >
          <option value="all" className="bg-gray-900">All Status</option>
          <option value="active" className="bg-gray-900">Active</option>
          <option value="inactive" className="bg-gray-900">Inactive</option>
          <option value="suspended" className="bg-gray-900">Suspended</option>
        </select>
        <select
          value={gstTypeFilter}
          onChange={(e) => setGstTypeFilter(e.target.value as GSTClientType | 'all')}
          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 min-w-[140px]"
        >
          <option value="all" className="bg-gray-900">All Types</option>
          <option value="regular" className="bg-gray-900">Regular</option>
          <option value="composition" className="bg-gray-900">Composition</option>
          <option value="unregistered" className="bg-gray-900">Unregistered</option>
        </select>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading clients...</div>
        ) : currentClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">No GST clients found. Add your first client!</div>
        ) : (
          currentClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-6 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{client.company_name}</h3>
                    <p className="text-sm text-gray-400">{client.gst_number}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${GST_CLIENT_STATUS_COLORS[client.status]} text-white`}>
                  {GST_CLIENT_STATUS_LABELS[client.status]}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  <span>{client.contact_person}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.mobile && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{client.mobile}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-gray-500">{GST_TYPE_LABELS[client.gst_type]}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedClient(client); setShowClientDetails(true); }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedClient(client); setFormErrors({}); setShowEditModal(true); }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setClientToDelete(client); setShowDeleteModal(true); }}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {indexOfFirstClient + 1} to {Math.min(indexOfLastClient, filteredClients.length)} of {filteredClients.length} clients
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Add GST Client</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleAddClient(); }}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={newClient.company_name}
                      onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.company_name && <p className="text-red-400 text-xs mt-1">{formErrors.company_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">GST Number *</label>
                    <input
                      type="text"
                      value={newClient.gst_number}
                      onChange={(e) => setNewClient({ ...newClient, gst_number: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 uppercase"
                      maxLength={15}
                    />
                    {formErrors.gst_number && <p className="text-red-400 text-xs mt-1">{formErrors.gst_number}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={newClient.pan_number}
                      onChange={(e) => setNewClient({ ...newClient, pan_number: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 uppercase"
                      maxLength={10}
                    />
                    {formErrors.pan_number && <p className="text-red-400 text-xs mt-1">{formErrors.pan_number}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person *</label>
                    <input
                      type="text"
                      value={newClient.contact_person}
                      onChange={(e) => setNewClient({ ...newClient, contact_person: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.contact_person && <p className="text-red-400 text-xs mt-1">{formErrors.contact_person}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mobile</label>
                    <input
                      type="tel"
                      value={newClient.mobile}
                      onChange={(e) => setNewClient({ ...newClient, mobile: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.mobile && <p className="text-red-400 text-xs mt-1">{formErrors.mobile}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                    <select
                      value={newClient.state}
                      onChange={(e) => setNewClient({ ...newClient, state: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="" className="bg-gray-900">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s} className="bg-gray-900">{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">GST Type</label>
                    <select
                      value={newClient.gst_type}
                      onChange={(e) => setNewClient({ ...newClient, gst_type: e.target.value as GSTClientType })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="regular" className="bg-gray-900">Regular</option>
                      <option value="composition" className="bg-gray-900">Composition</option>
                      <option value="unregistered" className="bg-gray-900">Unregistered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={newClient.status}
                      onChange={(e) => setNewClient({ ...newClient, status: e.target.value as GSTClientStatus })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="active" className="bg-gray-900">Active</option>
                      <option value="inactive" className="bg-gray-900">Inactive</option>
                      <option value="suspended" className="bg-gray-900">Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Registration Date</label>
                  <input
                    type="date"
                    value={newClient.registration_date}
                    onChange={(e) => setNewClient({ ...newClient, registration_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={newClient.notes}
                    onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Add Client</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Client Modal */}
      <AnimatePresence>
        {showEditModal && selectedClient && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Edit GST Client</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleEditClient(); }}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={selectedClient.company_name}
                      onChange={(e) => setSelectedClient({ ...selectedClient, company_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.company_name && <p className="text-red-400 text-xs mt-1">{formErrors.company_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">GST Number *</label>
                    <input
                      type="text"
                      value={selectedClient.gst_number}
                      onChange={(e) => setSelectedClient({ ...selectedClient, gst_number: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 uppercase"
                      maxLength={15}
                    />
                    {formErrors.gst_number && <p className="text-red-400 text-xs mt-1">{formErrors.gst_number}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={selectedClient.pan_number || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, pan_number: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 uppercase"
                      maxLength={10}
                    />
                    {formErrors.pan_number && <p className="text-red-400 text-xs mt-1">{formErrors.pan_number}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person *</label>
                    <input
                      type="text"
                      value={selectedClient.contact_person}
                      onChange={(e) => setSelectedClient({ ...selectedClient, contact_person: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.contact_person && <p className="text-red-400 text-xs mt-1">{formErrors.contact_person}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mobile</label>
                    <input
                      type="tel"
                      value={selectedClient.mobile || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, mobile: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.mobile && <p className="text-red-400 text-xs mt-1">{formErrors.mobile}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={selectedClient.email || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    value={selectedClient.address || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                    <select
                      value={selectedClient.state || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, state: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="" className="bg-gray-900">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s} className="bg-gray-900">{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">GST Type</label>
                    <select
                      value={selectedClient.gst_type}
                      onChange={(e) => setSelectedClient({ ...selectedClient, gst_type: e.target.value as GSTClientType })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="regular" className="bg-gray-900">Regular</option>
                      <option value="composition" className="bg-gray-900">Composition</option>
                      <option value="unregistered" className="bg-gray-900">Unregistered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={selectedClient.status}
                      onChange={(e) => setSelectedClient({ ...selectedClient, status: e.target.value as GSTClientStatus })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="active" className="bg-gray-900">Active</option>
                      <option value="inactive" className="bg-gray-900">Inactive</option>
                      <option value="suspended" className="bg-gray-900">Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Registration Date</label>
                  <input
                    type="date"
                    value={selectedClient.registration_date || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, registration_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={selectedClient.notes || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                  />
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

      {/* Client Details Modal */}
      <AnimatePresence>
        {showClientDetails && selectedClient && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClientDetails(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedClient.company_name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-medium ${GST_CLIENT_STATUS_COLORS[selectedClient.status]} text-white`}>
                      {GST_CLIENT_STATUS_LABELS[selectedClient.status]}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowClientDetails(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">GST Number</span>
                    </div>
                    <p className="text-white font-medium">{selectedClient.gst_number}</p>
                  </div>
                  {selectedClient.pan_number && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm">PAN Number</span>
                      </div>
                      <p className="text-white font-medium">{selectedClient.pan_number}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Contact Person</span>
                    </div>
                    <p className="text-white font-medium">{selectedClient.contact_person}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">GST Type</span>
                    </div>
                    <p className="text-white font-medium">{GST_TYPE_LABELS[selectedClient.gst_type]}</p>
                  </div>
                </div>
              </div>

              {(selectedClient.email || selectedClient.mobile) && (
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {selectedClient.email && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">Email</span>
                      </div>
                      <a href={`mailto:${selectedClient.email}`} className="text-blue-400 hover:underline">{selectedClient.email}</a>
                    </div>
                  )}
                  {selectedClient.mobile && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">Mobile</span>
                      </div>
                      <a href={`tel:${selectedClient.mobile}`} className="text-blue-400 hover:underline">{selectedClient.mobile}</a>
                    </div>
                  )}
                </div>
              )}

              {selectedClient.address && (
                <div className="p-4 rounded-xl bg-white/5 mb-6">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Address</span>
                  </div>
                  <p className="text-white">{selectedClient.address}{selectedClient.state ? `, ${selectedClient.state}` : ''}</p>
                </div>
              )}

              {selectedClient.notes && (
                <div className="p-4 rounded-xl bg-white/5 mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Notes</h4>
                  <p className="text-white">{selectedClient.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => { setShowClientDetails(false); setFormErrors({}); setShowEditModal(true); }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && clientToDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Client</h3>
                  <p className="text-sm text-gray-400">{clientToDelete.company_name}</p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">Are you sure you want to delete this client? This action cannot be undone.</p>

              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={handleDeleteClient} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-8 rounded-xl transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
