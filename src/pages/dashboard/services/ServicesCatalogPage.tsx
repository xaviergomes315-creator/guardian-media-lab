import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight,
  Loader2, XCircle, Package, X,
} from 'lucide-react';
import { serviceCatalogService } from '../../../services/api';
import { ServiceCatalog, ServiceCategory, SERVICE_CATEGORIES, SERVICE_CATEGORY_COLORS } from '../../../types';

export default function ServicesCatalogPage() {
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Tax & Compliance' as ServiceCategory,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadServices();
  }, [categoryFilter]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await serviceCatalogService.getAll(true);
      let filtered = data;
      if (categoryFilter !== 'all') {
        filtered = data.filter(s => s.category === categoryFilter);
      }
      if (searchQuery) {
        filtered = filtered.filter(s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setServices(filtered);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadServices();
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category: 'Tax & Compliance',
      description: '',
      is_active: true,
    });
    setValidationErrors([]);
    setShowModal(true);
  };

  const openEditModal = (service: ServiceCatalog) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description || '',
      is_active: service.is_active,
    });
    setValidationErrors([]);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    setValidationErrors([]);

    const errors: string[] = [];
    if (!formData.name.trim()) {
      errors.push('Service name is required');
    }
    if (!formData.category) {
      errors.push('Category is required');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setSaving(false);
      return;
    }

    try {
      if (editingService) {
        await serviceCatalogService.update(editingService.id, formData);
        setMessage({ type: 'success', text: 'Service updated successfully!' });
      } else {
        await serviceCatalogService.create(formData);
        setMessage({ type: 'success', text: 'Service created successfully!' });
      }
      setShowModal(false);
      loadServices();
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
      await serviceCatalogService.delete(id);
      setMessage({ type: 'success', text: 'Service deleted successfully!' });
      loadServices();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete service';
      setMessage({ type: 'error', text: message });
    }
  };

  const handleToggleActive = async (service: ServiceCatalog) => {
    try {
      await serviceCatalogService.toggleActive(service.id, !service.is_active);
      setMessage({ type: 'success', text: `Service ${service.is_active ? 'disabled' : 'enabled'} successfully!` });
      loadServices();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update service';
      setMessage({ type: 'error', text: message });
    }
  };

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceCatalog[]>);

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Services Catalog</h1>
          <p className="page-description">Manage service templates for client assignments</p>
        </div>
        <button onClick={openAddModal} className="btn-primary btn">
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Message Toast */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 h-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              placeholder="Search services..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 text-sm appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0a0a0a]">All Categories</option>
            {SERVICE_CATEGORIES.map(cat => (
              <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat}</option>
            ))}
          </select>
          <button onClick={handleSearch} className="btn btn-secondary">
            Search
          </button>
        </div>
      </div>

      {/* Services by Category */}
      {loading ? (
        <div className="loading-state">
          <Loader2 className="loading-spinner" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-4 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${SERVICE_CATEGORY_COLORS[category as ServiceCategory]}`} />
                  <h2 className="text-base font-semibold text-white">{category}</h2>
                  <span className="text-sm text-gray-500">({categoryServices.length})</span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {categoryServices.map(service => (
                  <div
                    key={service.id}
                    className={`px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors ${
                      !service.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{service.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${service.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleActive(service)}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title={service.is_active ? 'Disable' : 'Enable'}
                      >
                        {service.is_active ? (
                          <ToggleRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
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
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {services.length === 0 && (
            <div className="empty-state glass-card py-12">
              <Package className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-400">No services found</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.15 }}
              className="modal-content sm:max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingService ? 'Edit Service' : 'Add Service'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="modal-close"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="modal-body space-y-4">
                {validationErrors.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <ul className="text-sm text-red-300 space-y-1">
                        {validationErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Service Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="Enter service name"
                  />
                </div>

                <div>
                  <label className="form-label">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                    className="form-select appearance-none cursor-pointer"
                  >
                    {SERVICE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                    rows={3}
                    placeholder="Service description (optional)"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-blue-600 focus:ring-blue-500/50"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !formData.name}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingService ? 'Save Changes' : 'Add Service'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
