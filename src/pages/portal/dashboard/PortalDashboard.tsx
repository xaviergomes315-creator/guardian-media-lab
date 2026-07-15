import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  FileText,
  Receipt,
  Bell,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  ArrowRight,
  IndianRupee,
  FolderOpen,
  ClipboardList,
  Briefcase,
} from 'lucide-react';
import { portalService, clientServicesService } from '../../../services/api';
import { PortalClient, PortalDocument, PortalTask, PortalNotification, ClientService } from '../../../types';

interface DashboardStats {
  documents: { total: number; byCategory: Record<string, number> };
  notifications: { total: number; unread: number };
  tasks: { total: number; pending: number };
  itr: { total: number; pending: number };
  gstReturns: { total: number; pending: number; filed: number };
  invoices: { total: number; paid: number; pending: number; outstanding: number };
  services?: { total: number; inProgress: number; completed: number; pending: number };
}

interface OutletContext {
  portalClient: PortalClient | null;
  unreadNotifications: number;
  refreshNotifications: () => void;
}

export default function PortalDashboard() {
  const { portalClient } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [tasks, setTasks] = useState<PortalTask[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [services, setServices] = useState<ClientService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (portalClient) {
      loadDashboardData();
    }
  }, [portalClient]);

  const loadDashboardData = async () => {
    if (!portalClient) return;
    setLoading(true);

    try {
      const [
        dashboardStats,
        documentsData,
        tasksData,
        notificationsData,
        servicesData,
      ] = await Promise.all([
        portalService.getDashboardStats(portalClient.id),
        portalService.documents.getAll(portalClient.id, 1, 5),
        portalService.tasks.getAll(portalClient.id),
        portalService.notifications.getAll(portalClient.id, 1, 5),
        clientServicesService.getAll(1, 5, { portalClientId: portalClient.id }),
      ]);

      setStats(dashboardStats);
      setDocuments(documentsData.data);
      setTasks(tasksData.filter(t => t.status !== 'completed').slice(0, 5));
      setNotifications(notificationsData.data);
      setServices(servicesData.data);

      // Calculate service stats
      const serviceStats = {
        total: servicesData.data.length,
        inProgress: servicesData.data.filter(s => s.status === 'in_progress').length,
        completed: servicesData.data.filter(s => s.status === 'completed').length,
        pending: servicesData.data.filter(s => s.status === 'pending').length,
      };
      setStats(prev => prev ? { ...prev, services: serviceStats } : null);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'My Services',
      value: stats?.services?.total || 0,
      icon: Briefcase,
      color: 'from-emerald-500 to-emerald-600',
      onClick: () => navigate('/portal/services'),
    },
    {
      label: 'Documents',
      value: stats?.documents.total || 0,
      icon: FolderOpen,
      color: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/portal/documents'),
    },
    {
      label: 'In Progress',
      value: stats?.services?.inProgress || 0,
      icon: Clock,
      color: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/portal/services'),
    },
    {
      label: 'Outstanding',
      value: stats?.invoices.outstanding || 0,
      icon: IndianRupee,
      color: 'from-orange-500 to-orange-600',
      isCurrency: true,
      onClick: () => navigate('/portal/invoices'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome back, {portalClient?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-400">
              Here's an overview of your account status
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.onClick}
            className={`glass-card p-5 cursor-pointer hover:bg-white/5 transition-colors`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stat.isCurrency
                    ? formatCurrency(stat.value)
                    : stat.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* My Services */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            My Services
          </h2>
          <button
            onClick={() => navigate('/portal/services')}
            className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {services.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No services assigned yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.services?.pending || 0}</p>
                  <p className="text-sm text-yellow-400">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.services?.inProgress || 0}</p>
                  <p className="text-sm text-blue-400">In Progress</p>
                </div>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats?.services?.completed || 0}</p>
                  <p className="text-sm text-green-400">Completed</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-400" />
              Recent Documents
            </h2>
            <a href="/portal/documents" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No documents yet</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.category.toUpperCase()}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(doc.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-400" />
              Pending Tasks
            </h2>
            <a href="/portal/documents" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending tasks</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-white">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.status}</p>
                    </div>
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-gray-500">Due: {formatDate(task.due_date)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            Recent Notifications
            {stats?.notifications.unread ? (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                {stats.notifications.unread} new
              </span>
            ) : null}
          </h2>
          <a href="/portal/notifications" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notifications</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  notification.read ? 'bg-white/5' : 'bg-emerald-500/10 border border-emerald-500/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  notification.read ? 'bg-gray-500' : 'bg-emerald-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{notification.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Invoice Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-400" />
            Invoice Summary
          </h2>
          <a href="/portal/invoices" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-2xl font-bold text-white">{stats?.invoices.paid || 0}</p>
            <p className="text-sm text-green-400">Paid</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-2xl font-bold text-white">{stats?.invoices.pending || 0}</p>
            <p className="text-sm text-yellow-400">Pending</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-2xl font-bold text-white">{formatCurrency(stats?.invoices.outstanding || 0)}</p>
            <p className="text-sm text-red-400">Outstanding</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
