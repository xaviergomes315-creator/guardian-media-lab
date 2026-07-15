import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Users,
  Send,
  FileText,
  BarChart3,
  Plus,
  Search,
  Upload,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Image,
  File,
  X,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
import { whatsAppService } from '../../../services/api';
import {
  WhatsAppContact,
  WhatsAppGroup,
  WhatsAppTemplate,
  WhatsAppCampaign,
  WhatsAppMessage,
  WhatsAppMediaType,
  WhatsAppContactStatus,
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_STATUS_LABELS,
  MESSAGE_STATUS_COLORS,
  MESSAGE_STATUS_LABELS,
  WHATSAPP_CONTACT_STATUS_COLORS,
  WHATSAPP_CONTACT_STATUS_LABELS,
} from '../../../types';

type TabType = 'dashboard' | 'contacts' | 'groups' | 'templates' | 'campaigns' | 'reports';

interface WhatsAppStats {
  totalCampaigns: number;
  totalContacts: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  totalPending: number;
  draftCampaigns: number;
  scheduledCampaigns: number;
  runningCampaigns: number;
  completedCampaigns: number;
  monthlyCampaigns: number;
  monthlySent: number;
}

const ITEMS_PER_PAGE = 10;

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statsResult = await whatsAppService.campaigns.getStats();
      setStats(statsResult);
    } catch (error) {
      console.error('Error fetching WhatsApp data:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            WhatsApp Bulk Messaging
          </h1>
          <p className="text-gray-400 mt-1">Manage contacts, campaigns, and track message delivery</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs - Responsive with proper scrolling */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 5)}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'dashboard' && (
          <DashboardTab stats={stats} loading={loading} />
        )}
        {activeTab === 'contacts' && (
          <ContactsTab showToast={showToast} />
        )}
        {activeTab === 'groups' && (
          <GroupsTab showToast={showToast} />
        )}
        {activeTab === 'templates' && (
          <TemplatesTab showToast={showToast} />
        )}
        {activeTab === 'campaigns' && (
          <CampaignsTab showToast={showToast} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab stats={stats} />
        )}
      </div>
    </div>
  );
}

// Format large numbers for display
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

// Dashboard Tab
function DashboardTab({ stats, loading }: { stats: WhatsAppStats | null; loading: boolean }) {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsResult, groupsResult] = await Promise.all([
          whatsAppService.campaigns.getAll(1, 5),
          whatsAppService.groups.getAll(),
        ]);
        setCampaigns(campaignsResult.data);
        setGroups(groupsResult);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Contacts', value: stats?.totalContacts || 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Messages Sent', value: stats?.totalSent || 0, icon: Send, color: 'from-green-500 to-emerald-500' },
    { label: 'Delivered', value: stats?.totalDelivered || 0, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
    { label: 'Failed', value: stats?.totalFailed || 0, icon: XCircle, color: 'from-red-500 to-rose-500' },
    { label: 'Pending', value: stats?.totalPending || 0, icon: Clock, color: 'from-yellow-500 to-orange-500' },
    { label: 'Campaigns', value: stats?.totalCampaigns || 0, icon: BarChart3, color: 'from-purple-500 to-indigo-500' },
  ];

  const deliveryRate = stats?.totalSent ? (((stats?.totalDelivered || 0) / stats.totalSent) * 100).toFixed(1) : '0';
  const readRate = stats?.totalDelivered ? (((stats?.totalRead || 0) / stats.totalDelivered) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Stats Grid - Responsive for mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-3 sm:p-4 lg:p-5"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2 sm:mb-3`}>
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate" title={stat.value.toLocaleString()}>
              {formatNumber(stat.value)}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 truncate">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          className="glass-card p-4 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Delivery Rate</h3>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-400 shrink-0">{deliveryRate}%</div>
            <div className="flex-1 min-w-0">
              <div className="h-3 sm:h-4 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                  style={{ width: `${Math.min(parseFloat(deliveryRate), 100)}%` }}
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-2 truncate">{formatNumber(stats?.totalDelivered || 0)} of {formatNumber(stats?.totalSent || 0)} delivered</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass-card p-4 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Read Rate</h3>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-400 shrink-0">{readRate}%</div>
            <div className="flex-1 min-w-0">
              <div className="h-3 sm:h-4 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                  style={{ width: `${Math.min(parseFloat(readRate), 100)}%` }}
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-2 truncate">{formatNumber(stats?.totalRead || 0)} of {formatNumber(stats?.totalDelivered || 0)} read</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Campaigns & Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          className="glass-card p-4 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Recent Campaigns</h3>
          {loading ? (
            <p className="text-gray-400 text-center py-4">Loading...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No campaigns yet</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {campaigns.slice(0, 4).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate text-sm sm:text-base">{campaign.name}</p>
                    <p className="text-xs text-gray-400">{campaign.total_contacts} recipients</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${CAMPAIGN_STATUS_COLORS[campaign.status]} text-white shrink-0 ml-2`}>
                    {CAMPAIGN_STATUS_LABELS[campaign.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          className="glass-card p-4 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Contact Groups</h3>
          {groups.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No groups yet</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {groups.slice(0, 4).map((group) => (
                <div key={group.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate text-sm sm:text-base">{group.name}</p>
                      <p className="text-xs text-gray-400">{group.contact_count} contacts</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Contacts Tab
function ContactsTab({ showToast }: { showToast: (type: 'success' | 'error', message: string) => void }) {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await whatsAppService.contacts.getAll(
        currentPage,
        ITEMS_PER_PAGE,
        statusFilter === 'all' ? undefined : statusFilter,
        searchQuery || undefined,
        groupFilter || undefined
      );
      setContacts(result.data);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
    setLoading(false);
  }, [currentPage, statusFilter, searchQuery, groupFilter]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const result = await whatsAppService.groups.getAll();
        setGroups(result);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };
    fetchContacts();
    loadGroups();
  }, [fetchContacts]);

  const handleDelete = async () => {
    if (!selectedContact) return;
    try {
      await whatsAppService.contacts.delete(selectedContact.id);
      setShowDeleteConfirm(false);
      setSelectedContact(null);
      fetchContacts();
      showToast('success', 'Contact deleted successfully');
    } catch (error) {
      showToast('error', 'Failed to delete contact');
    }
  };

  const handleExport = async () => {
    try {
      const result = await whatsAppService.contacts.exportContacts();
      const csvContent = [
        ['Name', 'Phone', 'Email', 'Company', 'Status', 'Labels'].join(','),
        ...result.map((c) =>
          [c.name, c.phone, c.email || '', c.company || '', c.status, c.labels.join(';')].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whatsapp-contacts-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Contacts exported successfully');
    } catch (error) {
      showToast('error', 'Failed to export contacts');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      {/* Filters - Responsive layout */}
      <div className="flex flex-col gap-3">
        {/* Search row */}
        <div className="relative w-full">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search contacts..."
            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm sm:text-base"
          />
        </div>
        {/* Filter buttons row */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm min-w-[100px] sm:min-w-[120px]"
          >
            <option value="all" className="bg-gray-900">All Status</option>
            <option value="active" className="bg-gray-900">Active</option>
            <option value="blocked" className="bg-gray-900">Blocked</option>
            <option value="inactive" className="bg-gray-900">Inactive</option>
          </select>
          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm min-w-[110px] sm:min-w-[140px]"
          >
            <option value="" className="bg-gray-900">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id} className="bg-gray-900">{g.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 flex items-center gap-1.5 sm:gap-2 text-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 flex items-center gap-1.5 sm:gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-1.5 sm:gap-2 text-sm px-3 sm:px-4"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span> Contact
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Phone</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Company</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Labels</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No contacts found</td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{contact.name}</p>
                          <p className="text-xs text-gray-400">{contact.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{contact.phone}</td>
                    <td className="px-6 py-4 text-gray-300">{contact.company || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {contact.labels.slice(0, 3).map((label) => (
                          <span key={label} className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                            {label}
                          </span>
                        ))}
                        {contact.labels.length > 3 && (
                          <span className="text-xs text-gray-400">+{contact.labels.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${WHATSAPP_CONTACT_STATUS_COLORS[contact.status]} text-white`}>
                        {WHATSAPP_CONTACT_STATUS_LABELS[contact.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setShowEditModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"
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
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                return start + i;
              }).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm ${
                    currentPage === page ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <ContactFormModal
            contact={selectedContact}
            groups={groups}
            onClose={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setSelectedContact(null);
            }}
            onSuccess={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setSelectedContact(null);
              fetchContacts();
              showToast('success', selectedContact ? 'Contact updated' : 'Contact created');
            }}
          />
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportContactsModal
            groups={groups}
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              setShowImportModal(false);
              fetchContacts();
              showToast('success', 'Contacts imported successfully');
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
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
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Contact</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">{selectedContact?.name}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedContact(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300"
                >
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white">
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

// Contact Form Modal
function ContactFormModal({
  contact,
  groups,
  onClose,
  onSuccess,
}: {
  contact?: WhatsAppContact | null;
  groups: WhatsAppGroup[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    company: contact?.company || '',
    status: (contact?.status || 'active') as WhatsAppContactStatus,
    labels: contact?.labels || [],
    group_ids: contact?.group_ids || [],
    notes: contact?.notes || '',
  });
  const [newLabel, setNewLabel] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Name and phone are required');
      return;
    }

    setLoading(true);
    try {
      if (contact) {
        await whatsAppService.contacts.update(contact.id, formData);
      } else {
        await whatsAppService.contacts.create(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact');
    }
    setLoading(false);
  };

  const addLabel = () => {
    if (newLabel && !formData.labels.includes(newLabel)) {
      setFormData({ ...formData, labels: [...formData.labels, newLabel] });
      setNewLabel('');
    }
  };

  const removeLabel = (label: string) => {
    setFormData({ ...formData, labels: formData.labels.filter((l) => l !== label) });
  };

  const toggleGroup = (groupId: string) => {
    const newGroupIds = formData.group_ids.includes(groupId)
      ? formData.group_ids.filter((id) => id !== groupId)
      : [...formData.group_ids, groupId];
    setFormData({ ...formData, group_ids: newGroupIds });
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
          <h2 className="text-xl font-bold text-white">{contact ? 'Edit Contact' : 'Add Contact'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as WhatsAppContactStatus })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
            >
              <option value="active" className="bg-gray-900">Active</option>
              <option value="blocked" className="bg-gray-900">Blocked</option>
              <option value="inactive" className="bg-gray-900">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Groups</label>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    formData.group_ids.includes(group.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Labels</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add label"
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
              />
              <button type="button" onClick={addLabel} className="px-4 py-2 bg-green-600 text-white rounded-xl">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.labels.map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm flex items-center gap-1"
                >
                  {label}
                  <button type="button" onClick={() => removeLabel(label)} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {contact ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Import Contacts Modal
function ImportContactsModal({
  groups,
  onClose,
  onSuccess,
}: {
  groups: WhatsAppGroup[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map((line) => line.split(',').map((cell) => cell.trim()));
      setCsvData(lines);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (csvData.length < 2) {
      alert('No data to import');
      return;
    }

    setLoading(true);
    try {
      const contacts = csvData.slice(1).map((row) => ({
        name: row[0] || 'Unknown',
        phone: row[1] || '',
        email: row[2] || undefined,
        company: row[3] || undefined,
        status: 'active' as const,
        group_ids: selectedGroupId ? [selectedGroupId] : [],
        labels: [],
        variables: {},
      })).filter((c) => c.phone);

      if (contacts.length === 0) {
        alert('No valid contacts found');
        setLoading(false);
        return;
      }

      await whatsAppService.contacts.importContacts(contacts as Partial<WhatsAppContact>[]);
      onSuccess();
    } catch (error) {
      console.error('Error importing contacts:', error);
      alert('Failed to import contacts');
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
        className="glass-card p-6 max-w-lg w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Import Contacts</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Upload a CSV file</p>
            <p className="text-xs text-gray-500">Format: Name, Phone, Email, Company</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-500"
            >
              Select File
            </label>
          </div>

          {file && (
            <p className="text-sm text-green-400">
              Selected: {file.name} ({csvData.length - 1} contacts)
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Add to Group</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
            >
              <option value="" className="bg-gray-900">No Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-gray-900">{g.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || csvData.length < 2}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Import {csvData.length - 1} Contacts
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Groups Tab
function GroupsTab({ showToast }: { showToast: (type: 'success' | 'error', message: string) => void }) {
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const result = await whatsAppService.groups.getAll();
      setGroups(result);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleDelete = async () => {
    if (!selectedGroup) return;
    try {
      await whatsAppService.groups.delete(selectedGroup.id);
      setShowDeleteConfirm(false);
      setSelectedGroup(null);
      fetchGroups();
      showToast('success', 'Group deleted successfully');
    } catch (error) {
      showToast('error', 'Failed to delete group');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500"
          />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-400 col-span-full text-center py-8">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center py-8">No groups yet</p>
        ) : (
          groups
            .filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{group.name}</p>
                    <p className="text-sm text-gray-400">{group.contact_count} contacts</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowModal(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {group.description && <p className="text-sm text-gray-400 mt-3">{group.description}</p>}
            </motion.div>
          ))
        )}
      </div>

      {/* Group Modal */}
      <AnimatePresence>
        {showModal && (
          <GroupFormModal
            group={selectedGroup}
            onClose={() => {
              setShowModal(false);
              setSelectedGroup(null);
            }}
            onSuccess={() => {
              setShowModal(false);
              setSelectedGroup(null);
              fetchGroups();
              showToast('success', selectedGroup ? 'Group updated' : 'Group created');
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
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
              <h3 className="text-lg font-semibold text-white mb-4">Delete Group?</h3>
              <p className="text-gray-300 mb-6">Group "{selectedGroup?.name}" will be deleted. Contacts will not be removed.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedGroup(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300"
                >
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white">
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

// Group Form Modal
function GroupFormModal({
  group,
  onClose,
  onSuccess,
}: {
  group?: WhatsAppGroup | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (group) {
        await whatsAppService.groups.update(group.id, formData);
      } else {
        await whatsAppService.groups.create(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Failed to save group');
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
        <h2 className="text-xl font-bold text-white mb-6">{group ? 'Edit Group' : 'Create Group'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white resize-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : group ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Templates Tab
function TemplatesTab({ showToast }: { showToast: (type: 'success' | 'error', message: string) => void }) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await whatsAppService.templates.getAll();
      setTemplates(result);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (id: string) => {
    try {
      await whatsAppService.templates.delete(id);
      fetchTemplates();
      showToast('success', 'Template deleted');
    } catch (error) {
      showToast('error', 'Failed to delete template');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
          />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-gray-400 col-span-full text-center py-8">Loading...</p>
        ) : templates.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center py-8">No templates yet</p>
        ) : (
          templates
            .filter((template) => template.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    {template.media_type === 'image' ? (
                      <Image className="w-5 h-5 text-green-400" />
                    ) : template.media_type === 'document' ? (
                      <File className="w-5 h-5 text-green-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{template.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{template.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowModal(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2 mb-3">{template.content}</p>
              {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((v) => (
                    <span key={v} className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {showModal && (
          <TemplateFormModal
            template={selectedTemplate}
            onClose={() => {
              setShowModal(false);
              setSelectedTemplate(null);
            }}
            onSuccess={() => {
              setShowModal(false);
              setSelectedTemplate(null);
              fetchTemplates();
              showToast('success', selectedTemplate ? 'Template updated' : 'Template created');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Template Form Modal
function TemplateFormModal({
  template,
  onClose,
  onSuccess,
}: {
  template?: WhatsAppTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || '',
    content: template?.content || '',
    category: template?.category || 'general',
    media_type: (template?.media_type || 'text') as WhatsAppMediaType,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const variables: string[] = [];
      const matches = formData.content.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        matches.forEach((m) => {
          const varName = m.replace(/\{\{|\}\}/g, '');
          if (!variables.includes(varName)) variables.push(varName);
        });
      }

      if (template) {
        await whatsAppService.templates.update(template.id, { ...formData, variables });
      } else {
        await whatsAppService.templates.create({ ...formData, variables });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card p-6 max-w-lg w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
      >
        <h2 className="text-xl font-bold text-white mb-6">{template ? 'Edit Template' : 'Create Template'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
            >
              <option value="general" className="bg-gray-900">General</option>
              <option value="onboarding" className="bg-gray-900">Onboarding</option>
              <option value="follow_up" className="bg-gray-900">Follow-up</option>
              <option value="promotions" className="bg-gray-900">Promotions</option>
              <option value="reports" className="bg-gray-900">Reports</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content * (Use {`{{name}}`} for variables)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white resize-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : template ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Campaigns Tab
function CampaignsTab({ showToast }: { showToast: (type: 'success' | 'error', message: string) => void }) {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsResult, groupsResult] = await Promise.all([
        whatsAppService.campaigns.getAll(currentPage, ITEMS_PER_PAGE, statusFilter === 'all' ? undefined : statusFilter, searchQuery),
        whatsAppService.groups.getAll(),
      ]);
      setCampaigns(campaignsResult.data);
      setTotalCount(campaignsResult.count);
      setGroups(groupsResult);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
    setLoading(false);
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async () => {
    if (!selectedCampaign) return;
    try {
      await whatsAppService.campaigns.delete(selectedCampaign.id);
      setShowDeleteConfirm(false);
      setSelectedCampaign(null);
      fetchCampaigns();
      showToast('success', 'Campaign deleted');
    } catch (error) {
      showToast('error', 'Failed to delete campaign');
    }
  };

  const handleDuplicate = async (campaign: WhatsAppCampaign) => {
    try {
      await whatsAppService.campaigns.duplicate(campaign.id);
      fetchCampaigns();
      showToast('success', 'Campaign duplicated');
    } catch (error) {
      showToast('error', 'Failed to duplicate campaign');
    }
  };

  const handleCancel = async (campaign: WhatsAppCampaign) => {
    try {
      await whatsAppService.campaigns.update(campaign.id, { status: 'cancelled' });
      fetchCampaigns();
      showToast('success', 'Campaign cancelled');
    } catch (error) {
      showToast('error', 'Failed to cancel campaign');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
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
            placeholder="Search campaigns..."
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
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
          <option value="scheduled" className="bg-gray-900">Scheduled</option>
          <option value="running" className="bg-gray-900">Running</option>
          <option value="completed" className="bg-gray-900">Completed</option>
          <option value="paused" className="bg-gray-900">Paused</option>
          <option value="cancelled" className="bg-gray-900">Cancelled</option>
        </select>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Campaign</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Progress</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Stats</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Scheduled</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No campaigns found</td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer">
                    <td
                      className="px-6 py-4"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowDetailModal(true);
                      }}
                    >
                      <p className="font-medium text-white">{campaign.name}</p>
                      <p className="text-xs text-gray-400">{campaign.total_contacts} recipients</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${CAMPAIGN_STATUS_COLORS[campaign.status]} text-white`}>
                        {CAMPAIGN_STATUS_LABELS[campaign.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{campaign.sent_count}/{campaign.total_contacts}</span>
                          <span className="text-green-400">
                            {campaign.total_contacts > 0 ? Math.round((campaign.sent_count / campaign.total_contacts) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                            style={{
                              width: `${campaign.total_contacts > 0 ? (campaign.sent_count / campaign.total_contacts) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1 text-gray-400">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          {campaign.delivered_count}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Eye className="w-3 h-3 text-blue-400" />
                          {campaign.read_count}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <XCircle className="w-3 h-3 text-red-400" />
                          {campaign.failed_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowDetailModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(campaign)}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {campaign.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancel(campaign)}
                            className="p-2 rounded-lg hover:bg-orange-500/20 text-gray-400 hover:text-orange-400"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign);
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
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                return start + i;
              }).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm ${
                    currentPage === page ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CampaignFormModal
            groups={groups}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchCampaigns();
              showToast('success', 'Campaign created');
            }}
          />
        )}
      </AnimatePresence>

      {/* Campaign Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCampaign && (
          <CampaignDetailModal
            campaign={selectedCampaign}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedCampaign(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
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
              <h3 className="text-lg font-semibold text-white mb-4">Delete Campaign?</h3>
              <p className="text-gray-300 mb-6">Campaign "{selectedCampaign?.name}" will be deleted along with all messages.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedCampaign(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300"
                >
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white">
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

// Campaign Form Modal
function CampaignFormModal({
  groups,
  onClose,
  onSuccess,
}: {
  groups: WhatsAppGroup[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    group_ids: [] as string[],
    message_content: '',
    media_type: 'text' as WhatsAppMediaType,
    media_url: '',
    media_caption: '',
    scheduled_at: '',
    send_now: true,
  });

  const estimateContacts = () => {
    return groups
      .filter((g) => formData.group_ids.includes(g.id))
      .reduce((sum, g) => sum + g.contact_count, 0);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.message_content || formData.group_ids.length === 0) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const totalContacts = estimateContacts();
      await whatsAppService.campaigns.create({
        name: formData.name,
        group_ids: formData.group_ids,
        message_content: formData.message_content,
        media_type: formData.media_type,
        media_url: formData.media_url || undefined,
        media_caption: formData.media_caption || undefined,
        scheduled_at: formData.send_now ? undefined : formData.scheduled_at || undefined,
        status: formData.send_now ? 'running' : 'scheduled',
        total_contacts: totalContacts,
        pending_count: totalContacts,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
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
        className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create Campaign</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= s ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-400'
                }`}
              >
                {s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                {s === 1 ? 'Details' : s === 2 ? 'Message' : 'Schedule'}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-600' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Groups *</label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      const newGroupIds = formData.group_ids.includes(group.id)
                        ? formData.group_ids.filter((id) => id !== group.id)
                        : [...formData.group_ids, group.id];
                      setFormData({ ...formData, group_ids: newGroupIds });
                    }}
                    className={`p-3 rounded-xl text-left ${
                      formData.group_ids.includes(group.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs opacity-75">{group.contact_count} contacts</p>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">Estimated recipients: {estimateContacts()}</p>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!formData.name || formData.group_ids.length === 0}
              className="w-full btn-primary"
            >
              Next: Compose Message
            </button>
          </div>
        )}

        {/* Step 2: Message */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message Content *</label>
              <textarea
                value={formData.message_content}
                onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white resize-none"
                placeholder="Type your message here..."
              />
              <p className="text-xs text-gray-400 mt-1">Use {`{{name}}`} for personalization</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Media Type</label>
              <div className="flex gap-2">
                {['text', 'image', 'document'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, media_type: type as WhatsAppMediaType })}
                    className={`px-4 py-2 rounded-lg capitalize ${
                      formData.media_type === type ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            {formData.media_type !== 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Media URL</label>
                <input
                  type="url"
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.message_content}
                className="flex-1 btn-primary"
              >
                Next: Schedule
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">When to send?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, send_now: true })}
                  className={`p-4 rounded-xl ${formData.send_now ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-300'}`}
                >
                  <Send className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium">Send Now</p>
                  <p className="text-xs opacity-75">Start immediately</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, send_now: false })}
                  className={`p-4 rounded-xl ${!formData.send_now ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-300'}`}
                >
                  <Calendar className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium">Schedule</p>
                  <p className="text-xs opacity-75">Set date & time</p>
                </button>
              </div>
            </div>
            {!formData.send_now && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>
            )}
            {/* Summary */}
            <div className="p-4 bg-white/5 rounded-xl">
              <h4 className="font-medium text-white mb-2">Campaign Summary</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-400">Name: <span className="text-white">{formData.name}</span></p>
                <p className="text-gray-400">Groups: <span className="text-white">{formData.group_ids.length} selected</span></p>
                <p className="text-gray-400">Recipients: <span className="text-white">{estimateContacts()}</span></p>
                <p className="text-gray-400">Type: <span className="text-white capitalize">{formData.media_type}</span></p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300">
                Back
              </button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-primary">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Create Campaign'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Campaign Detail Modal
function CampaignDetailModal({
  campaign,
  onClose,
}: {
  campaign: WhatsAppCampaign;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<(WhatsAppMessage & { contact?: WhatsAppContact })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const result = await whatsAppService.messages.getByCampaign(
          campaign.id,
          1,
          50,
          statusFilter === 'all' ? undefined : statusFilter
        );
        setMessages(result.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
      setLoading(false);
    };
    fetchMessages();
  }, [campaign.id, statusFilter]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">{campaign.name}</h2>
            <span className={`px-2 py-1 rounded text-xs ${CAMPAIGN_STATUS_COLORS[campaign.status]} text-white mt-2 inline-block`}>
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center p-4 bg-white/5 rounded-xl">
            <p className="text-2xl font-bold text-white">{campaign.total_contacts}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-xl">
            <p className="text-2xl font-bold text-green-400">{campaign.sent_count}</p>
            <p className="text-xs text-gray-400">Sent</p>
          </div>
          <div className="text-center p-4 bg-emerald-500/10 rounded-xl">
            <p className="text-2xl font-bold text-emerald-400">{campaign.delivered_count}</p>
            <p className="text-xs text-gray-400">Delivered</p>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-xl">
            <p className="text-2xl font-bold text-blue-400">{campaign.read_count}</p>
            <p className="text-xs text-gray-400">Read</p>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-xl">
            <p className="text-2xl font-bold text-red-400">{campaign.failed_count}</p>
            <p className="text-xs text-gray-400">Failed</p>
          </div>
        </div>

        {/* Delivery Progress */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Delivery Progress</h4>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 h-full"
              style={{ width: `${campaign.total_contacts > 0 ? (campaign.delivered_count / campaign.total_contacts) * 100 : 0}%` }}
            />
            <div
              className="bg-blue-500 h-full"
              style={{ width: `${campaign.total_contacts > 0 ? (campaign.read_count / campaign.total_contacts) * 100 : 0}%` }}
            />
            <div
              className="bg-red-500 h-full"
              style={{ width: `${campaign.total_contacts > 0 ? (campaign.failed_count / campaign.total_contacts) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Message Content */}
        <div className="mb-6 p-4 bg-white/5 rounded-xl">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Message</h4>
          <p className="text-white">{campaign.message_content}</p>
        </div>

        {/* Messages List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-300">Messages</h4>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
            >
              <option value="all" className="bg-gray-900">All</option>
              <option value="pending" className="bg-gray-900">Pending</option>
              <option value="sent" className="bg-gray-900">Sent</option>
              <option value="delivered" className="bg-gray-900">Delivered</option>
              <option value="read" className="bg-gray-900">Read</option>
              <option value="failed" className="bg-gray-900">Failed</option>
            </select>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <p className="text-gray-400 text-center py-4">Loading...</p>
            ) : messages.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No messages</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white">{msg.contact?.name || msg.phone}</p>
                    <p className="text-xs text-gray-400">{msg.phone}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${MESSAGE_STATUS_COLORS[msg.status]} text-white`}>
                    {MESSAGE_STATUS_LABELS[msg.status]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Reports Tab
function ReportsTab({ stats }: { stats: WhatsAppStats | null }) {
  const [reportType, setReportType] = useState<'overview' | 'campaigns' | 'messages'>('overview');

  const monthlyData = [
    { month: 'Jan', sent: 1200, delivered: 1150 },
    { month: 'Feb', sent: 1500, delivered: 1420 },
    { month: 'Mar', sent: 1800, delivered: 1700 },
    { month: 'Apr', sent: 1650, delivered: 1580 },
    { month: 'May', sent: 2000, delivered: 1900 },
    { month: 'Jun', sent: 2200, delivered: 2100 },
  ];

  const exportCSV = () => {
    const csvContent = [
      ['Metric', 'Value'].join(','),
      ['Total Campaigns', stats?.totalCampaigns || 0],
      ['Total Contacts', stats?.totalContacts || 0],
      ['Messages Sent', stats?.totalSent || 0],
      ['Messages Delivered', stats?.totalDelivered || 0],
      ['Messages Read', stats?.totalRead || 0],
      ['Messages Failed', stats?.totalFailed || 0],
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tabs - Responsive */}
      <div className="flex flex-wrap gap-2">
        {['overview', 'campaigns', 'messages'].map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type as typeof reportType)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium capitalize ${
              reportType === type ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {type}
          </button>
        ))}
        <button onClick={exportCSV} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/5 text-gray-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ml-auto">
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {reportType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <motion.div className="glass-card p-4 sm:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Summary</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-400">Total Campaigns</p>
                <p className="text-lg sm:text-2xl font-bold text-white truncate" title={(stats?.totalCampaigns || 0).toLocaleString()}>
                  {formatNumber(stats?.totalCampaigns || 0)}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-400">Total Contacts</p>
                <p className="text-lg sm:text-2xl font-bold text-white truncate" title={(stats?.totalContacts || 0).toLocaleString()}>
                  {formatNumber(stats?.totalContacts || 0)}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-400">Messages Sent</p>
                <p className="text-lg sm:text-2xl font-bold text-green-400 truncate" title={(stats?.totalSent || 0).toLocaleString()}>
                  {formatNumber(stats?.totalSent || 0)}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-white/5 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-400">Delivery Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-400">
                  {stats?.totalSent ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div className="glass-card p-4 sm:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Monthly Trend</h3>
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} width={35} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="sent" stroke="#22c55e" fill="rgba(34, 197, 94, 0.2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="delivered" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {reportType === 'campaigns' && (
        <motion.div className="glass-card p-4 sm:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Campaign Status Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gray-500/10 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-gray-400" title={(stats?.draftCampaigns || 0).toLocaleString()}>
                {formatNumber(stats?.draftCampaigns || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Draft</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-yellow-500/10 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-yellow-400" title={(stats?.scheduledCampaigns || 0).toLocaleString()}>
                {formatNumber(stats?.scheduledCampaigns || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Scheduled</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-blue-500/10 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-blue-400" title={(stats?.runningCampaigns || 0).toLocaleString()}>
                {formatNumber(stats?.runningCampaigns || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Running</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-500/10 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-green-400" title={(stats?.completedCampaigns || 0).toLocaleString()}>
                {formatNumber(stats?.completedCampaigns || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Completed</p>
            </div>
          </div>
        </motion.div>
      )}

      {reportType === 'messages' && (
        <motion.div className="glass-card p-4 sm:p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Message Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gray-500/10 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-gray-400" title={(stats?.totalPending || 0).toLocaleString()}>
                {formatNumber(stats?.totalPending || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Pending</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-500/10 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-green-400" title={(stats?.totalSent || 0).toLocaleString()}>
                {formatNumber(stats?.totalSent || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Sent</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-emerald-500/10 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-emerald-400" title={(stats?.totalDelivered || 0).toLocaleString()}>
                {formatNumber(stats?.totalDelivered || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Delivered</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-blue-500/10 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-blue-400" title={(stats?.totalRead || 0).toLocaleString()}>
                {formatNumber(stats?.totalRead || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Read</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-red-500/10 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-red-400" title={(stats?.totalFailed || 0).toLocaleString()}>
                {formatNumber(stats?.totalFailed || 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Failed</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
