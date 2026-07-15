import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Key,
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
} from 'lucide-react';
import { portalService, clientsService } from '../../../services/api';
import { PortalClient, Client } from '../../../types';
import { supabase } from '../../../lib/supabase';

export default function AdminPortalClientsPage() {
  const [portalClients, setPortalClients] = useState<PortalClient[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<PortalClient | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    email: '',
    full_name: '',
    company_name: '',
    gst_number: '',
    pan_number: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    is_active: true,
    generate_portal_access: true,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [clientCreationMode, setClientCreationMode] = useState<'select' | 'create'>('select');
  const [newClientData, setNewClientData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    gst_number: '',
    pan_number: '',
    address: '',
    services: [] as string[],
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [pagination.page, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [portalData, clientsData] = await Promise.all([
        portalService.clients.getAll(pagination.page, pagination.pageSize, searchQuery, statusFilter),
        clientsService.getAll(),
      ]);
      setPortalClients(portalData.data);
      setPagination(prev => ({ ...prev, total: portalData.count }));
      setAllClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadData();
  };

  const handleAddClient = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    setValidationErrors([]);

    const errors: string[] = [];

    if (clientCreationMode === 'select') {
      // Validate for existing client selection mode
      if (!formData.client_id) {
        errors.push('Please select a CRM client');
      }
      if (!formData.email) {
        errors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Please enter a valid email address');
      }
      if (!formData.full_name) {
        errors.push('Full name is required');
      }

      // Check for duplicate email in portal clients
      if (formData.email) {
        const existingPortalClient = portalClients.find(
          c => c.email.toLowerCase() === formData.email.toLowerCase()
        );
        if (existingPortalClient) {
          errors.push('A portal client with this email already exists');
        }
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setSaving(false);
        return;
      }

      try {
        const portalClientData = {
          client_id: formData.client_id,
          email: formData.email.toLowerCase(),
          full_name: formData.full_name,
          company_name: formData.company_name || null,
          gst_number: formData.gst_number || null,
          pan_number: formData.pan_number || null,
          mobile: formData.mobile || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          pincode: formData.pincode || null,
          is_active: formData.generate_portal_access,
        };

        await portalService.clients.create(portalClientData);
        setMessage({ type: 'success', text: 'Portal client created successfully!' });
        setShowAddModal(false);
        resetForm();
        loadData();
      } catch (error: unknown) {
        console.error('Error creating portal client:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to create portal client';
        setMessage({ type: 'error', text: errorMsg });
        setValidationErrors([errorMsg]);
      } finally {
        setSaving(false);
      }
    } else {
      // Validate for new client creation mode
      if (!newClientData.company_name) {
        errors.push('Company name is required');
      }
      if (!newClientData.contact_person) {
        errors.push('Contact person name is required');
      }
      if (!newClientData.email) {
        errors.push('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientData.email)) {
        errors.push('Please enter a valid email address');
      }
      if (!newClientData.phone) {
        errors.push('Mobile number is required');
      }

      // Check for duplicate email in CRM clients
      if (newClientData.email) {
        const existingCrmClient = allClients.find(
          c => c.email.toLowerCase() === newClientData.email.toLowerCase()
        );
        if (existingCrmClient) {
          errors.push('A CRM client with this email already exists');
        }
      }

      // Check for duplicate email in portal clients
      if (newClientData.email) {
        const existingPortalClient = portalClients.find(
          c => c.email.toLowerCase() === newClientData.email.toLowerCase()
        );
        if (existingPortalClient) {
          errors.push('A portal client with this email already exists');
        }
      }

      // Check for duplicate phone in CRM clients
      if (newClientData.phone) {
        const existingPhoneClient = allClients.find(
          c => c.phone === newClientData.phone
        );
        if (existingPhoneClient) {
          errors.push('A CRM client with this phone number already exists');
        }
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setSaving(false);
        return;
      }

      try {
        // Step 1: Create CRM Client first
        const crmClientData = {
          company_name: newClientData.company_name,
          contact_person: newClientData.contact_person,
          email: newClientData.email.toLowerCase(),
          phone: newClientData.phone,
          gst_number: newClientData.gst_number || null,
          pan_number: newClientData.pan_number || null,
          address: newClientData.address || null,
          services: newClientData.services,
          notes: newClientData.notes || null,
          status: 'active' as const,
        };

        const createdCrmClient = await clientsService.create(crmClientData);

        if (!createdCrmClient || !createdCrmClient.id) {
          throw new Error('Failed to create CRM client - no ID returned');
        }

        // Step 2: Create Portal Client linked to the new CRM client
        const portalClientData = {
          client_id: createdCrmClient.id,
          email: newClientData.email.toLowerCase(),
          full_name: newClientData.contact_person,
          company_name: newClientData.company_name,
          gst_number: newClientData.gst_number || null,
          pan_number: newClientData.pan_number || null,
          mobile: newClientData.phone,
          address: newClientData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          pincode: formData.pincode || null,
          is_active: formData.generate_portal_access,
        };

        await portalService.clients.create(portalClientData);

        setMessage({ type: 'success', text: 'CRM client and Portal access created successfully!' });
        setShowAddModal(false);
        resetForm();
        loadData();
      } catch (error: unknown) {
        console.error('Error creating client:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to create client';
        setMessage({ type: 'error', text: errorMsg });
        setValidationErrors([errorMsg]);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    setValidationErrors([]);

    // Validate required fields
    const errors: string[] = [];
    if (!formData.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    if (!formData.full_name) {
      errors.push('Full name is required');
    }

    // Check for duplicate email (excluding current client)
    if (formData.email) {
      const existingClient = portalClients.find(
        c => c.email.toLowerCase() === formData.email.toLowerCase() && c.id !== selectedClient.id
      );
      if (existingClient) {
        errors.push('A portal client with this email already exists');
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setSaving(false);
      return;
    }

    try {
      const portalClientData = {
        email: formData.email.toLowerCase(),
        full_name: formData.full_name,
        company_name: formData.company_name || null,
        gst_number: formData.gst_number || null,
        pan_number: formData.pan_number || null,
        mobile: formData.mobile || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        is_active: formData.is_active,
      };

      await portalService.clients.update(selectedClient.id, portalClientData);
      setMessage({ type: 'success', text: 'Portal client updated successfully!' });
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (error: unknown) {
      console.error('Error updating portal client:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update portal client';
      setMessage({ type: 'error', text: errorMsg });
      setValidationErrors([errorMsg]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portal client?')) return;

    try {
      await portalService.clients.delete(id);
      setMessage({ type: 'success', text: 'Portal client deleted successfully!' });
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete portal client';
      setMessage({ type: 'error', text: message });
    }
  };

  const handleToggleActive = async (client: PortalClient) => {
    try {
      if (client.is_active) {
        await portalService.clients.deactivate(client.id);
      } else {
        await portalService.clients.activate(client.id);
      }
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      setMessage({ type: 'error', text: message });
    }
  };

  const handleResetPassword = async (client: PortalClient) => {
    if (!confirm(`Reset password for ${client.email}?`)) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(client.email, {
        redirectTo: `${window.location.origin}/portal/reset-password`,
      });
      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to send reset email' });
      } else {
        setMessage({ type: 'success', text: 'Password reset email sent successfully!' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email';
      setMessage({ type: 'error', text: message });
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      email: '',
      full_name: '',
      company_name: '',
      gst_number: '',
      pan_number: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      is_active: true,
      generate_portal_access: true,
    });
    setNewClientData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      gst_number: '',
      pan_number: '',
      address: '',
      services: [],
      notes: '',
    });
    setValidationErrors([]);
    setClientCreationMode('select');
  };

  const openEditModal = (client: PortalClient) => {
    setSelectedClient(client);
    setFormData({
      client_id: client.client_id,
      email: client.email,
      full_name: client.full_name,
      company_name: client.company_name || '',
      gst_number: client.gst_number || '',
      pan_number: client.pan_number || '',
      mobile: client.mobile || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      pincode: client.pincode || '',
      is_active: client.is_active,
      generate_portal_access: true,
    });
    setValidationErrors([]);
    setShowEditModal(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Portal Clients</h1>
          <p className="text-gray-400">Manage client portal access and accounts</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Portal Client
        </button>
      </motion.div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Search by name, email, or company..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Client</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Company</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Last Login</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : portalClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No portal clients found
                  </td>
                </tr>
              ) : (
                portalClients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {client.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{client.full_name}</p>
                          <p className="text-sm text-gray-500">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{client.company_name || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="w-4 h-4" />
                        {client.mobile || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(client)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          client.is_active
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {client.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {formatDate(client.last_login)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(client)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
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
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} clients
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl my-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6">
              {showAddModal ? 'Add Portal Client' : 'Edit Portal Client'}
            </h2>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Please fix the following errors:</p>
                      <ul className="mt-1 text-sm text-red-300 list-disc list-inside">
                        {validationErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Creation Mode Toggle */}
              {showAddModal && (
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setClientCreationMode('select');
                      setValidationErrors([]);
                    }}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      clientCreationMode === 'select'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Select Existing CRM Client
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClientCreationMode('create');
                      setFormData(prev => ({ ...prev, client_id: '' }));
                      setValidationErrors([]);
                    }}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      clientCreationMode === 'create'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Create New CRM Client
                  </button>
                </div>
              )}

              {/* Select Existing CRM Client */}
              {showAddModal && clientCreationMode === 'select' && (
                <div className={`p-4 rounded-lg ${!formData.client_id ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/5'}`}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Existing CRM Client <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => {
                      const selectedClient = allClients.find(c => c.id === e.target.value);
                      if (selectedClient) {
                        setFormData({
                          ...formData,
                          client_id: selectedClient.id,
                          email: selectedClient.email,
                          full_name: selectedClient.contact_person,
                          company_name: selectedClient.company_name,
                          gst_number: selectedClient.gst_number || '',
                          pan_number: selectedClient.pan_number || '',
                          mobile: selectedClient.phone || '',
                          address: selectedClient.address || '',
                        });
                      } else {
                        setFormData({ ...formData, client_id: e.target.value });
                      }
                      setValidationErrors([]);
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg bg-white/5 border text-white focus:outline-none ${
                      !formData.client_id ? 'border-amber-500' : 'border-white/10 focus:border-blue-500'
                    }`}
                  >
                    <option value="" className="bg-gray-900">-- Select a CRM Client --</option>
                    {allClients.map(c => (
                      <option key={c.id} value={c.id} className="bg-gray-900">{c.company_name} - {c.contact_person}</option>
                    ))}
                  </select>
                  {!formData.client_id && (
                    <p className="mt-2 text-sm text-amber-400">Select an existing CRM client to create portal access</p>
                  )}
                </div>
              )}

              {/* Create New CRM Client Form */}
              {showAddModal && clientCreationMode === 'create' && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-4">
                  <p className="text-sm text-blue-300 mb-4">Create a new CRM client and automatically link portal access.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Company Name <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={newClientData.company_name}
                        onChange={(e) => setNewClientData({ ...newClientData, company_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={newClientData.contact_person}
                        onChange={(e) => setNewClientData({ ...newClientData, contact_person: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter contact person name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email <span className="text-red-400">*</span></label>
                      <input
                        type="email"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Mobile <span className="text-red-400">*</span></label>
                      <input
                        type="tel"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter mobile number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">GST Number</label>
                      <input
                        type="text"
                        value={newClientData.gst_number}
                        onChange={(e) => setNewClientData({ ...newClientData, gst_number: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 uppercase"
                        placeholder="GSTIN (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                      <input
                        type="text"
                        value={newClientData.pan_number}
                        onChange={(e) => setNewClientData({ ...newClientData, pan_number: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 uppercase"
                        placeholder="PAN (optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      value={newClientData.address}
                      onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Services</label>
                    <div className="flex flex-wrap gap-2">
                      {['GST', 'ITR', 'Accounting', 'Auditing', 'Tax Planning', 'Business Advisory'].map(service => (
                        <label key={service} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10">
                          <input
                            type="checkbox"
                            checked={newClientData.services.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewClientData({ ...newClientData, services: [...newClientData.services, service] });
                              } else {
                                setNewClientData({ ...newClientData, services: newClientData.services.filter(s => s !== service) });
                              }
                            }}
                            className="w-4 h-4 rounded bg-white/5 border-white/10 text-blue-600"
                          />
                          <span className="text-sm text-gray-300">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                    <textarea
                      value={newClientData.notes}
                      onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                      rows={2}
                      placeholder="Additional notes (optional)"
                    />
                  </div>
                </div>
              )}

              {/* Portal Client Fields - Show only when editing or when in select mode with a client selected */}
              {(showEditModal || (showAddModal && clientCreationMode === 'select' && formData.client_id)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mobile</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">GST Number</label>
                    <input
                      type="text"
                      value={formData.gst_number}
                      onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={formData.pan_number}
                      onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 uppercase"
                    />
                  </div>
                </div>
              )}

              {/* Address Fields - Show when editing or in select mode with client selected */}
              {(showEditModal || (showAddModal && clientCreationMode === 'select' && formData.client_id)) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Portal Access Toggle - Show for both modes when adding */}
              {showAddModal && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="generate_portal_access"
                      checked={formData.generate_portal_access}
                      onChange={(e) => setFormData({ ...formData, generate_portal_access: e.target.checked, is_active: e.target.checked })}
                      className="w-5 h-5 rounded bg-white/5 border-white/10 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                    />
                    <div>
                      <label htmlFor="generate_portal_access" className="text-sm font-medium text-emerald-300">
                        Enable Portal Access
                      </label>
                      <p className="text-xs text-emerald-400/70 mt-1">
                        {clientCreationMode === 'create'
                          ? 'When enabled, both CRM client and Portal access will be created. The portal account will be Active.'
                          : 'When enabled, the client will be able to log in to the portal immediately. Their portal account will be created as Active.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!showAddModal && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-300">Active (can login to portal)</label>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleAddClient : handleUpdateClient}
                disabled={
                  saving ||
                  (showAddModal && clientCreationMode === 'select' && !formData.client_id) ||
                  (showAddModal && clientCreationMode === 'select' && (!formData.email || !formData.full_name)) ||
                  (showAddModal && clientCreationMode === 'create' && (!newClientData.company_name || !newClientData.contact_person || !newClientData.email || !newClientData.phone)) ||
                  (showEditModal && (!formData.email || !formData.full_name))
                }
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  showAddModal
                    ? (clientCreationMode === 'create' ? 'Create CRM + Portal Client' : 'Add Portal Client')
                    : 'Save Changes'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
