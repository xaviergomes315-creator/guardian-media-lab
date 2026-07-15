import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  XCircle,
  Briefcase,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { clientServicesService, serviceCatalogService, portalService } from '../../../services/api';
import {
  ClientService,
  ServiceCatalog,
  PortalClient,
  ServiceCategory,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_COLORS,
  CLIENT_SERVICE_STATUS_COLORS,
  CLIENT_SERVICE_STATUS_LABELS,
  CLIENT_SERVICE_PRIORITY_LABELS,
  ClientServiceStatus,
  ClientServicePriority,
} from '../../../types';

export default function ClientServicesPage() {
  const [services, setServices] = useState<ClientService[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalog[]>([]);
  const [portalClients, setPortalClients] = useState<PortalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ClientService | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    portal_client_id: '',
    service_catalog_id: '',
    name: '',
    category: 'Tax & Compliance' as ServiceCategory,
    description: '',
    status: 'pending' as ClientServiceStatus,
    priority: 'medium' as ClientServicePriority,
    progress: 0,
    start_date: '',
    due_date: '',
    assigned_team: [] as string[],
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesData, catalogData, portalData] = await Promise.all([
        clientServicesService.getAll(1, 100, {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }),
        serviceCatalogService.getAll(true),
        portalService.clients.getAll(1, 1000),
      ]);
      setServices(servicesData.data);
      setServiceCatalog(catalogData);
      setPortalClients(portalData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const openAddModal = () => {
    setFormData({
      portal_client_id: '',
      service_catalog_id: '',
      name: '',
      category: 'Tax & Compliance',
      description: '',
      status: 'pending',
      priority: 'medium',
      progress: 0,
      start_date: '',
      due_date: '',
      assigned_team: [],
      notes: '',
    });
    setValidationErrors([]);
    setShowModal(true);
  };

  const openEditModal = (service: ClientService) => {
    setSelectedService(service);
    setFormData({
      portal_client_id: service.portal_client_id,
      service_catalog_id: service.service_catalog_id || '',
      name: service.name,
      category: service.category,
      description: service.description || '',
      status: service.status,
      priority: service.priority,
      progress: service.progress,
      start_date: service.start_date || '',
      due_date: service.due_date || '',
      assigned_team: service.assigned_team,
      notes: service.notes || '',
    });
    setValidationErrors([]);
    setShowModal(true);
  };

  const openDetailsModal = async (service: ClientService) => {
    try {
      const detailedService = await clientServicesService.getWithDetails(service.id);
      setSelectedService(detailedService);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading service details:', error);
    }
  };

  const handleServiceCatalogChange = (catalogId: string) => {
    const selected = serviceCatalog.find(s => s.id === catalogId);
    if (selected) {
      setFormData({
        ...formData,
        service_catalog_id: catalogId,
        name: selected.name,
        category: selected.category,
        description: selected.description || '',
      });
    } else {
      setFormData({
        ...formData,
        service_catalog_id: '',
      });
    }
  };

  const handlePortalClientChange = (portalClientId: string) => {
    const selected = portalClients.find(p => p.id === portalClientId);
    if (selected) {
      setFormData({
        ...formData,
        portal_client_id: portalClientId,
      });
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    setValidationErrors([]);

    const errors: string[] = [];
    if (!formData.portal_client_id) {
      errors.push('Please select a portal client');
    }
    if (!formData.name.trim()) {
      errors.push('Service name is required');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setSaving(false);
      return;
    }

    try {
      const serviceData = {
        portal_client_id: formData.portal_client_id,
        service_catalog_id: formData.service_catalog_id || null,
        client_id: portalClients.find(p => p.id === formData.portal_client_id)?.client_id || null,
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        progress: formData.progress,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        assigned_team: formData.assigned_team,
        notes: formData.notes || null,
      };

      if (selectedService) {
        await clientServicesService.update(selectedService.id, serviceData);
        setMessage({ type: 'success', text: 'Service updated successfully!' });
      } else {
        await clientServicesService.create(serviceData);
        setMessage({ type: 'success', text: 'Service assigned successfully!' });
      }
      setShowModal(false);
      loadData();
    } catch (error: unknown) {
      console.error('Error saving service:', error);
      const message = error instanceof Error ? error.message : 'Failed to save service';
      setMessage({ type: 'error', text: message });
      setValidationErrors([message]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await clientServicesService.delete(id);
      setMessage({ type: 'success', text: 'Service deleted successfully!' });
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete service';
      setMessage({ type: 'error', text: message });
    }
  };

  const getStatusIcon = (status: ClientServiceStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'on_hold':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-gray-500';
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
          <h1 className="text-2xl font-bold text-white">Client Services</h1>
          <p className="text-gray-400">Assign and manage services for clients</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Assign Service
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
              placeholder="Search services..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all" className="bg-gray-900">All Status</option>
            {Object.entries(CLIENT_SERVICE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-gray-900">{label}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all" className="bg-gray-900">All Categories</option>
            {SERVICE_CATEGORIES.map(cat => (
              <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </motion.div>

      {/* Services List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
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
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Client</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Progress</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Due Date</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No services found
                    </td>
                  </tr>
                ) : (
                  services.map(service => (
                    <tr key={service.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-white">{service.name}</p>
                            {service.description && (
                              <p className="text-sm text-gray-400 truncate max-w-[200px]">{service.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{service.portal_client?.full_name || '-'}</p>
                        <p className="text-sm text-gray-400">{service.portal_client?.company_name || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                          SERVICE_CATEGORY_COLORS[service.category] || 'bg-gray-500'
                        }/20 text-white`}>
                          <div className={`w-2 h-2 rounded-full ${SERVICE_CATEGORY_COLORS[service.category] || 'bg-gray-500'}`} />
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(service.status)}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            CLIENT_SERVICE_STATUS_COLORS[service.status]
                          }/20 text-white`}>
                            {CLIENT_SERVICE_STATUS_LABELS[service.status]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(service.progress)} transition-all`}
                              style={{ width: `${service.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400">{service.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {service.due_date ? (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(service.due_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailsModal(service)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(service)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
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
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl my-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6">
              {selectedService ? 'Edit Service' : 'Assign Service'}
            </h2>

            {validationErrors.length > 0 && (
              <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <ul className="text-sm text-red-300 list-disc list-inside">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Select Portal Client */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Portal Client *</label>
                <select
                  value={formData.portal_client_id}
                  onChange={(e) => handlePortalClientChange(e.target.value)}
                  disabled={!!selectedService}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="" className="bg-gray-900">Select Portal Client</option>
                  {portalClients.map(pc => (
                    <option key={pc.id} value={pc.id} className="bg-gray-900">
                      {pc.full_name} - {pc.company_name || pc.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Service from Catalog */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Service from Catalog (Optional)</label>
                <select
                  value={formData.service_catalog_id}
                  onChange={(e) => handleServiceCatalogChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-gray-900">-- Select from Catalog or Enter Custom --</option>
                  {serviceCatalog.filter(s => s.is_active).map(sc => (
                    <option key={sc.id} value={sc.id} className="bg-gray-900">
                      {sc.category} - {sc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Service name"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                >
                  {SERVICE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder="Service description"
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientServiceStatus })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(CLIENT_SERVICE_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value} className="bg-gray-900">{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as ClientServicePriority })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(CLIENT_SERVICE_PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value} className="bg-gray-900">{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Progress: {formData.progress}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder="Internal notes"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !formData.portal_client_id || !formData.name}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  selectedService ? 'Save Changes' : 'Assign Service'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedService && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold text-white mb-6">{selectedService.name}</h2>

            {/* Service Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400">Client</p>
                <p className="text-white font-medium">{selectedService.portal_client?.full_name}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(selectedService.status)}
                  <span className="text-white">{CLIENT_SERVICE_STATUS_LABELS[selectedService.status]}</span>
                </div>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400">Progress</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(selectedService.progress)}`}
                      style={{ width: `${selectedService.progress}%` }}
                    />
                  </div>
                  <span className="text-white">{selectedService.progress}%</span>
                </div>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-gray-400">Due Date</p>
                <p className="text-white">{selectedService.due_date ? new Date(selectedService.due_date).toLocaleDateString() : 'Not set'}</p>
              </div>
            </div>

            {/* Tasks */}
            {selectedService.tasks && selectedService.tasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Tasks</h3>
                <div className="space-y-2">
                  {selectedService.tasks.map(task => (
                    <div key={task.id} className="glass-card p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {task.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-white">{task.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {selectedService.documents && selectedService.documents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Documents</h3>
                <div className="space-y-2">
                  {selectedService.documents.map(doc => (
                    <div key={doc.id} className="glass-card p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{doc.name}</span>
                      </div>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            {selectedService.activities && selectedService.activities.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Activity Timeline</h3>
                <div className="space-y-3">
                  {selectedService.activities.slice(0, 10).map((activity, idx) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {idx < selectedService.activities!.length - 1 && (
                          <div className="w-0.5 h-full bg-white/10" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-white text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.user_name} - {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
