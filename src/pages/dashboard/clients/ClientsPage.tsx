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
  DollarSign,
  Edit,
  Trash2,
  Eye,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Client } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

const serviceOptions = [
  'Social Media Management',
  'Performance Marketing',
  'Facebook Ads',
  'Google Ads',
  'SEO',
  'Website Development',
  'Branding',
  'Video Editing',
  'AI Automation',
  'WhatsApp Marketing',
  'CRM Solutions',
  'Graphic Design',
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(9);
  const [exportToast, setExportToast] = useState<string | null>(null);
  useAuth();

  const [newClient, setNewClient] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    gst_number: '',
    pan_number: '',
    services: [] as string[],
    notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleAddClient = async () => {
    const { error } = await supabase.from('clients').insert([newClient]);
    if (error) {
      console.error('Error adding client:', error);
    } else {
      fetchClients();
      setShowAddModal(false);
      setNewClient({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        gst_number: '',
        pan_number: '',
        services: [],
        notes: '',
      });
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;
    const { error } = await supabase
      .from('clients')
      .update({
        company_name: selectedClient.company_name,
        contact_person: selectedClient.contact_person,
        email: selectedClient.email,
        phone: selectedClient.phone,
        address: selectedClient.address,
        gst_number: selectedClient.gst_number,
        pan_number: selectedClient.pan_number,
        services: selectedClient.services,
        notes: selectedClient.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedClient.id);

    if (error) {
      console.error('Error updating client:', error);
    } else {
      fetchClients();
      setShowEditModal(false);
      setSelectedClient(null);
    }
  };

  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleDeleteClient = async (clientId: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
      console.error('Error deleting client:', error);
      showToast('Failed to delete client');
    } else {
      fetchClients();
      showToast('Client deleted successfully');
    }
  };

  const toggleService = (service: string) => {
    setNewClient((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const toggleEditService = (service: string) => {
    if (!selectedClient) return;
    setSelectedClient({
      ...selectedClient,
      services: selectedClient.services.includes(service)
        ? selectedClient.services.filter((s) => s !== service)
        : [...selectedClient.services, service],
    });
  };

  const showToast = (msg: string) => {
    setExportToast(msg);
    setTimeout(() => setExportToast(null), 3000);
  };

  const escapeCsvValue = (value: string | number | null | undefined): string => {
    const str = value == null ? '' : String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExport = () => {
    if (filteredClients.length === 0) {
      showToast('No clients available to export.');
      return;
    }

    const headers = [
      'Company Name',
      'Contact Person',
      'Email',
      'Phone',
      'GST Number',
      'PAN Number',
      'Status',
      'Services',
      'Total Revenue',
      'Created Date',
    ];

    const rows = filteredClients.map((c) => [
      escapeCsvValue(c.company_name),
      escapeCsvValue(c.contact_person),
      escapeCsvValue(c.email),
      escapeCsvValue(c.phone),
      escapeCsvValue(c.gst_number),
      escapeCsvValue(c.pan_number),
      escapeCsvValue(c.status),
      escapeCsvValue(c.services.join(', ')),
      escapeCsvValue(c.total_revenue),
      escapeCsvValue(new Date(c.created_at).toLocaleDateString('en-CA')),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `clients-export-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Clients exported successfully.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">Client Management</h1>
          <p className="text-sm text-gray-400">Manage your client relationships and information</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search clients..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'pending');
              setCurrentPage(1);
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 min-w-[120px]"
          >
            <option value="all" className="bg-gray-900">All Status</option>
            <option value="active" className="bg-gray-900">Active</option>
            <option value="inactive" className="bg-gray-900">Inactive</option>
            <option value="pending" className="bg-gray-900">Pending</option>
          </select>
          <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2 px-4">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading clients...</div>
        ) : currentClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            No clients found. Add your first client!
          </div>
        ) : (
          currentClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-4 md:p-6 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{client.company_name}</h3>
                    <p className="text-xs md:text-sm text-gray-400 truncate">{client.contact_person}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(client.status)} text-white flex-shrink-0`}>
                  {client.status}
                </span>
              </div>

              <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 min-w-0">
                  <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                    <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {client.services.length > 0 && (
                <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                  {client.services.slice(0, 2).map((service) => (
                    <span key={service} className="px-2 py-0.5 md:py-1 rounded-lg text-xs bg-blue-500/20 text-blue-400">
                      {service}
                    </span>
                  ))}
                  {client.services.length > 2 && (
                    <span className="px-2 py-0.5 md:py-1 rounded-lg text-xs bg-white/10 text-gray-400">
                      +{client.services.length - 2}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-400">Revenue</p>
                  <p className="text-base md:text-lg font-bold text-white">${client.total_revenue.toLocaleString()}</p>
                </div>
                <div className="flex gap-1 md:gap-2">
                  <button
                    onClick={() => {
                      setSelectedClient(client);
                      setShowClientDetails(true);
                    }}
                    className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClient(client);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setClientToDelete(client)}
                    className="p-1.5 md:p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
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
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Edit Client</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={selectedClient.company_name}
                      onChange={(e) => setSelectedClient({ ...selectedClient, company_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person *</label>
                    <input
                      type="text"
                      value={selectedClient.contact_person}
                      onChange={(e) => setSelectedClient({ ...selectedClient, contact_person: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={selectedClient.email}
                      onChange={(e) => setSelectedClient({ ...selectedClient, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={selectedClient.phone || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">GST Number</label>
                    <input
                      type="text"
                      value={selectedClient.gst_number || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, gst_number: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={selectedClient.pan_number || ''}
                      onChange={(e) => setSelectedClient({ ...selectedClient, pan_number: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={selectedClient.status}
                    onChange={(e) => setSelectedClient({ ...selectedClient, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="active" className="bg-gray-900">Active</option>
                    <option value="inactive" className="bg-gray-900">Inactive</option>
                    <option value="pending" className="bg-gray-900">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Services</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {serviceOptions.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleEditService(service)}
                        className={`px-3 py-2 rounded-lg text-xs sm:text-sm text-left transition-all ${
                          selectedClient.services.includes(service)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
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

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditClient}
                    className="flex-1 btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Add New Client</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={newClient.company_name}
                      onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Company Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person *</label>
                    <input
                      type="text"
                      value={newClient.contact_person}
                      onChange={(e) => setNewClient({ ...newClient, contact_person: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    placeholder="123 Business St, City, Country"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">GST Number</label>
                    <input
                      type="text"
                      value={newClient.gst_number}
                      onChange={(e) => setNewClient({ ...newClient, gst_number: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="GSTIN12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={newClient.pan_number}
                      onChange={(e) => setNewClient({ ...newClient, pan_number: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="ABCDE1234F"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Services</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {serviceOptions.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`px-3 py-2 rounded-lg text-xs sm:text-sm text-left transition-all ${
                          newClient.services.includes(service)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={newClient.notes}
                    onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddClient}
                    className="flex-1 btn-primary"
                  >
                    Add Client
                  </button>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-white truncate">{selectedClient.company_name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(selectedClient.status)} text-white`}>
                      {selectedClient.status}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowClientDetails(false)} className="p-2 rounded-lg hover:bg-white/10 flex-shrink-0">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Contact Person</span>
                    </div>
                    <p className="text-white font-medium">{selectedClient.contact_person}</p>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email</span>
                    </div>
                    <a href={`mailto:${selectedClient.email}`} className="text-blue-400 hover:underline break-all">
                      {selectedClient.email}
                    </a>
                  </div>

                  {selectedClient.phone && (
                    <div className="p-3 sm:p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">Phone</span>
                      </div>
                      <a href={`tel:${selectedClient.phone}`} className="text-blue-400 hover:underline">
                        {selectedClient.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {selectedClient.address && (
                    <div className="p-3 sm:p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">Address</span>
                      </div>
                      <p className="text-white">{selectedClient.address}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {selectedClient.gst_number && (
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm">GST</span>
                        </div>
                        <p className="text-white text-sm truncate">{selectedClient.gst_number}</p>
                      </div>
                    )}

                    {selectedClient.pan_number && (
                      <div className="p-3 sm:p-4 rounded-xl bg-white/5">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm">PAN</span>
                        </div>
                        <p className="text-white text-sm truncate">{selectedClient.pan_number}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Total Revenue</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-white">${selectedClient.total_revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {selectedClient.services.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Services Purchased</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.services.map((service) => (
                      <span key={service} className="px-3 py-1.5 rounded-lg text-sm bg-blue-500/20 text-blue-400">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.notes && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Notes</h4>
                  <p className="text-white">{selectedClient.notes}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowClientDetails(false);
                    setShowEditModal(true);
                  }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Client
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {clientToDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setClientToDelete(null)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Client</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">{clientToDelete.company_name}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setClientToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteClient(clientToDelete.id);
                    setClientToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Toast */}
      <AnimatePresence>
        {exportToast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg"
          >
            {exportToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
