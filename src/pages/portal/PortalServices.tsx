import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { clientServicesService } from '../../services/api';
import {
  ClientService,
  PortalClient,
  SERVICE_CATEGORY_COLORS,
  CLIENT_SERVICE_STATUS_LABELS,
  CLIENT_SERVICE_STATUS_COLORS,
  ServiceCategory,
} from '../../types';

interface OutletContext {
  portalClient: PortalClient | null;
  unreadNotifications: number;
  refreshNotifications: () => void;
}

export default function PortalServicesPage() {
  const { portalClient } = useOutletContext<OutletContext>();
  const [services, setServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ClientService | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (portalClient) {
      loadServices();
    }
  }, [portalClient, statusFilter, categoryFilter]);

  const loadServices = async () => {
    if (!portalClient) return;
    setLoading(true);
    try {
      const { data } = await clientServicesService.getAll(1, 100, {
        portalClientId: portalClient.id,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const openServiceDetails = async (service: ClientService) => {
    try {
      const detailedService = await clientServicesService.getWithDetails(service.id);
      setSelectedService(detailedService);
    } catch (error) {
      console.error('Error loading service details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'on_hold':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ClientService[]>);

  const categories = [
    'Tax & Compliance',
    'Digital Marketing',
    'Website & Software',
    'Branding & Design',
    'Media Production',
    'Business Consulting',
    'Custom Services',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Services</h1>
            <p className="text-gray-400">View and track your assigned services</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Briefcase className="w-4 h-4" />
            {services.length} active services
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all" className="bg-gray-900">All Status</option>
            <option value="pending" className="bg-gray-900">Pending</option>
            <option value="in_progress" className="bg-gray-900">In Progress</option>
            <option value="completed" className="bg-gray-900">Completed</option>
            <option value="on_hold" className="bg-gray-900">On Hold</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all" className="bg-gray-900">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Services by Category */}
      {services.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No services assigned yet</p>
          <p className="text-sm text-gray-500 mt-2">Services will appear here when assigned to you</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="px-6 py-4 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${SERVICE_CATEGORY_COLORS[category as ServiceCategory] || 'bg-gray-500'}`} />
                  <h2 className="text-lg font-semibold text-white">{category}</h2>
                  <span className="text-sm text-gray-400">({categoryServices.length})</span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {categoryServices.map(service => (
                  <div
                    key={service.id}
                    onClick={() => openServiceDetails(service)}
                    className="px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(service.status)}
                          <h3 className="font-medium text-white">{service.name}</h3>
                        </div>
                        {service.description && (
                          <p className="text-sm text-gray-400 mb-3">{service.description}</p>
                        )}

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-white">{service.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(service.progress)} transition-all`}
                              style={{ width: `${service.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {formatDate(service.due_date)}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            CLIENT_SERVICE_STATUS_COLORS[service.status]
                          }/20 text-white`}>
                            {CLIENT_SERVICE_STATUS_LABELS[service.status]}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Service Details Modal */}
      {selectedService && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedService(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedService.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{selectedService.category}</p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status and Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Status</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedService.status)}
                  <span className="text-white font-medium">
                    {CLIENT_SERVICE_STATUS_LABELS[selectedService.status]}
                  </span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Progress</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(selectedService.progress)} transition-all`}
                      style={{ width: `${selectedService.progress}%` }}
                    />
                  </div>
                  <span className="text-white font-medium">{selectedService.progress}%</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedService.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                <p className="text-white">{selectedService.description}</p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Start Date</p>
                <p className="text-white">{formatDate(selectedService.start_date)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Due Date</p>
                <p className="text-white">{formatDate(selectedService.due_date)}</p>
              </div>
            </div>

            {/* Tasks */}
            {selectedService.tasks && selectedService.tasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Tasks</h3>
                <div className="space-y-2">
                  {selectedService.tasks.map(task => (
                    <div key={task.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {task.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-white">{task.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : task.status === 'in_progress'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {selectedService.documents && selectedService.documents.filter(d => d.is_client_visible).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Documents</h3>
                <div className="space-y-2">
                  {selectedService.documents.filter(d => d.is_client_visible).map(doc => (
                    <div key={doc.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{doc.name}</span>
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 text-sm hover:underline"
                        >
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
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        {idx < Math.min(selectedService.activities!.length, 10) - 1 && (
                          <div className="w-0.5 flex-1 bg-white/10" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-white text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setSelectedService(null)}
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
