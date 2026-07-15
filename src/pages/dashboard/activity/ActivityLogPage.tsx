import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  FileText,
  CreditCard,
  LogIn,
  LogOut,
  Upload,
  Bell,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Calendar,
  Building2,
  FolderPlus,
  ListPlus,
  UserCheck,
  MoreHorizontal,
  FileDown,
  Clock,
  User,
  Layers,
} from 'lucide-react';
import { activityLogsService, profileService } from '../../../services/api';
import {
  ActivityLog,
  ActivityLogFilters,
  ActivityModule,
  Profile,
  ACTIVITY_MODULE_LABELS,
  ACTIVITY_MODULE_COLORS,
} from '../../../types';
import { format, subDays } from 'date-fns';

const getActivityIcon = (action: string) => {
  const iconMap: Record<string, React.ElementType> = {
    'New Lead Created': UserPlus,
    'Lead Assigned': UserCheck,
    'Lead Status Changed': RefreshCw,
    'Follow-up Added': Calendar,
    'Client Created': Building2,
    'Client Updated': Building2,
    'Invoice Created': FileText,
    'Invoice Paid': CreditCard,
    'Invoice Updated': FileText,
    'GST Record Added': FileText,
    'GST Record Filed': CheckCircle,
    'AI Generated Content': Sparkles,
    'User Login': LogIn,
    'User Logout': LogOut,
    'Document Uploaded': Upload,
    'Notification Sent': Bell,
    'Task Created': ListPlus,
    'Task Completed': CheckCircle,
    'Project Created': FolderPlus,
    'Project Updated': FolderPlus,
  };
  return iconMap[action] || MoreHorizontal;
};

const MODULE_OPTIONS: { value: ActivityModule | ''; label: string }[] = [
  { value: '', label: 'All Modules' },
  { value: 'leads', label: 'Leads' },
  { value: 'clients', label: 'Clients' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'gst', label: 'GST' },
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'team', label: 'Team' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'portal', label: 'Portal' },
  { value: 'ai', label: 'AI Assistant' },
  { value: 'settings', label: 'Settings' },
  { value: 'auth', label: 'Authentication' },
  { value: 'documents', label: 'Documents' },
  { value: 'notifications', label: 'Notifications' },
];

const DATE_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
];

export default function ActivityLogPage() {
  useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  const [filters, setFilters] = useState<ActivityLogFilters>({
    search: '',
    user_id: '',
    module: undefined,
    action: '',
    date_from: '',
    date_to: '',
  });

  const [datePreset, setDatePreset] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await profileService.getTeamMembers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const appliedFilters: ActivityLogFilters = { ...filters };

      if (datePreset) {
        const today = new Date();
        let dateFrom: Date | null = null;

        switch (datePreset) {
          case 'today':
            dateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            break;
          case 'yesterday': {
            dateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
            const dateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            appliedFilters.date_to = dateTo.toISOString();
            break;
          }
          case '7days':
            dateFrom = subDays(today, 7);
            break;
          case '30days':
            dateFrom = subDays(today, 30);
            break;
          case '90days':
            dateFrom = subDays(today, 90);
            break;
        }

        if (dateFrom) {
          appliedFilters.date_from = dateFrom.toISOString();
        }
      }

      const { data, count } = await activityLogsService.getAll(currentPage, pageSize, appliedFilters);
      setActivities(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, datePreset]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleFilterChange = (key: keyof ActivityLogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleDatePresetChange = (value: string) => {
    setDatePreset(value);
    setFilters((prev) => ({ ...prev, date_from: '', date_to: '' }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      user_id: '',
      module: undefined,
      action: '',
      date_from: '',
      date_to: '',
    });
    setDatePreset('');
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.user_id ||
      filters.module ||
      filters.action ||
      filters.date_from ||
      filters.date_to ||
      datePreset
    );
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const data = await activityLogsService.exportCSV(filters);

      const headers = ['Date', 'User', 'Role', 'Module', 'Action', 'Details', 'IP Address'];
      const rows = data.map((log) => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_name,
        log.user_role || '',
        log.module,
        log.action,
        JSON.stringify(log.details),
        log.ip_address || '',
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
          <p className="text-gray-400 mt-1">Track all system activities and user actions</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={exporting || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl transition-colors"
        >
          {exporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search activities by user, action, or module..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
            showFilters ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/20'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters() && (
            <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Filter Activities</h3>
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">User</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={filters.user_id}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Module Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Module</label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={filters.module || ''}
                  onChange={(e) => handleFilterChange('module', e.target.value || '')}
                  className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50"
                >
                  {MODULE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Preset Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Date Range</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={datePreset}
                  onChange={(e) => handleDatePresetChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500/50"
                >
                  {DATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1.5">From</label>
                <input
                  type="date"
                  value={filters.date_from ? filters.date_from.split('T')[0] : ''}
                  onChange={(e) => {
                    setDatePreset('');
                    handleFilterChange('date_from', e.target.value ? new Date(e.target.value).toISOString() : '');
                  }}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1.5">To</label>
                <input
                  type="date"
                  value={filters.date_to ? filters.date_to.split('T')[0] : ''}
                  onChange={(e) => {
                    setDatePreset('');
                    handleFilterChange('date_to', e.target.value ? new Date(e.target.value).toISOString() : '');
                  }}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Activities Table */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-2">No activities found</h3>
            <p className="text-gray-400 text-sm">
              {hasActiveFilters()
                ? 'Try adjusting your filters to see more results'
                : 'Activities will appear here as actions are performed'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.action);
                    const color = ACTIVITY_MODULE_COLORS[activity.module as keyof typeof ACTIVITY_MODULE_COLORS] || 'bg-gray-500';

                    return (
                      <motion.tr
                        key={activity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white font-medium">{activity.action}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white text-sm">{activity.user_name}</p>
                            {activity.user_role && (
                              <p className="text-gray-500 text-xs capitalize">{activity.user_role.replace('_', ' ')}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color} text-white`}>
                            {ACTIVITY_MODULE_LABELS[activity.module as keyof typeof ACTIVITY_MODULE_LABELS] || activity.module}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white text-sm">{format(new Date(activity.created_at), 'MMM dd, yyyy')}</p>
                            <p className="text-gray-500 text-xs">{format(new Date(activity.created_at), 'hh:mm a')}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {activity.details && Object.keys(activity.details).length > 0 ? (
                            <div className="max-w-xs">
                              <p className="text-gray-400 text-sm truncate" title={JSON.stringify(activity.details)}>
                                {activity.details.lead_name || activity.details.client_name || activity.details.invoice_number || '-'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} activities
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
