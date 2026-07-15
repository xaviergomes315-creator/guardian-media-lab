import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Facebook,
  Chrome,
  Phone,
  ShoppingBag,
  MessageCircle,
  Mail,
  Webhook,
  Upload,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Bell,
  Users,
  TrendingUp,
  Zap,
  FileSpreadsheet,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import {
  leadIntegrationService,
  LEAD_PLATFORMS,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_COLORS,
  SYNC_STATUS_LABELS,
  SYNC_STATUS_COLORS,
  parseCSV,
  type UniversalLead,
  type CSVImportResult,
} from '../../../services/leadIntegrations';
import type { LeadIntegration, LeadImportLog, LeadSourceType, LeadSyncStatus, Profile } from '../../../types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Facebook,
  Chrome,
  Phone,
  ShoppingBag,
  MessageCircle,
  Mail,
  Webhook,
  Upload,
};

type Tab = 'dashboard' | 'inbox' | 'import_logs';

export default function LeadIntegrationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [integrations, setIntegrations] = useState<LeadIntegration[]>([]);
  const [leads, setLeads] = useState<UniversalLead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<LeadSourceType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [team, setTeam] = useState<Profile[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showConnectModal, setShowConnectModal] = useState<LeadSourceType | null>(null);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<UniversalLead | null>(null);
  const [importLogs, setImportLogs] = useState<LeadImportLog[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchIntegrations = useCallback(async () => {
    try {
      const data = await leadIntegrationService.getIntegrations();
      const fullIntegrations = LEAD_PLATFORMS.map((p) => {
        const existing = data.find((d) => d.platform === p.id);
        return existing || ({
          id: '',
          user_id: '',
          platform: p.id,
          connection_name: p.label,
          is_connected: false,
          credentials: {},
          config: {},
          last_synced_at: null,
          total_leads_imported: 0,
          status: 'active' as const,
          created_at: '',
          updated_at: '',
        } as LeadIntegration);
      });
      setIntegrations(fullIntegrations);
    } catch (err) {
      showToast('error', 'Failed to load integrations');
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const { leads: data, total } = await leadIntegrationService.getUniversalLeads({
        page: currentPage,
        pageSize,
        search: searchQuery,
        sourceFilter,
        statusFilter,
        sortBy: 'imported_at',
      });
      setLeads(data);
      setTotalLeads(total);
    } catch (err) {
      showToast('error', 'Failed to load leads');
    }
  }, [currentPage, pageSize, searchQuery, sourceFilter, statusFilter]);

  const fetchTeam = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'employee', 'telecaller'])
        .eq('is_active', true)
        .order('full_name', { ascending: true });
      if (error) throw error;
      setTeam((data || []) as Profile[]);
    } catch (err) {
      // silent
    }
  }, []);

  const fetchImportLogs = useCallback(async () => {
    try {
      const data = await leadIntegrationService.getImportLogs(20);
      setImportLogs(data);
    } catch (err) {
      // silent
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchIntegrations(), fetchLeads(), fetchTeam(), fetchImportLogs()]);
    setLoading(false);
  }, [fetchIntegrations, fetchLeads, fetchTeam, fetchImportLogs]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (activeTab === 'inbox') fetchLeads();
  }, [activeTab, fetchLeads]);

  // Poll for new leads every 30s when on inbox tab
  useEffect(() => {
    if (activeTab === 'inbox') {
      pollingRef.current = setInterval(() => {
        fetchLeads();
      }, 30000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeTab, fetchLeads]);

  const handleConnect = async (platform: LeadSourceType, connectionName: string) => {
    try {
      await leadIntegrationService.connectIntegration(platform, connectionName);
      await fetchIntegrations();
      setShowConnectModal(null);
      showToast('success', `${LEAD_SOURCE_LABELS[platform]} connected successfully`);
    } catch (err) {
      showToast('error', 'Failed to connect integration');
    }
  };

  const handleDisconnect = async (id: string, platform: LeadSourceType) => {
    try {
      await leadIntegrationService.disconnectIntegration(id);
      await fetchIntegrations();
      showToast('info', `${LEAD_SOURCE_LABELS[platform]} disconnected`);
    } catch (err) {
      showToast('error', 'Failed to disconnect');
    }
  };

  const handleSync = async (id: string) => {
    try {
      await leadIntegrationService.syncIntegration(id);
      await fetchIntegrations();
      showToast('success', 'Sync completed');
    } catch (err) {
      showToast('error', 'Sync failed');
    }
  };

  const handleAssign = async (leadId: string, telecallerId: string) => {
    try {
      await leadIntegrationService.assignTelecaller(leadId, telecallerId);
      await fetchLeads();
      setShowAssignModal(null);
      showToast('success', 'Telecaller assigned');
    } catch (err) {
      showToast('error', 'Failed to assign telecaller');
    }
  };

  const totalPages = Math.ceil(totalLeads / pageSize);

  const connectedCount = integrations.filter((i) => i.is_connected).length;
  const totalImported = integrations.reduce((sum, i) => sum + (i.total_leads_imported || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-2 md:gap-3">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-blue-400 flex-shrink-0" />
            Lead Integration Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Connect lead sources, manage universal inbox, and import leads
          </p>
        </div>
        <button
          onClick={() => setShowCSVModal(true)}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 px-6"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Connected Sources" value={connectedCount} color="blue" />
        <StatCard icon={TrendingUp} label="Total Leads Imported" value={totalImported} color="emerald" />
        <StatCard icon={Users} label="Universal Inbox" value={totalLeads} color="violet" />
        <StatCard icon={Clock} label="Pending Sync" value={integrations.filter((i) => i.is_connected && !i.last_synced_at).length} color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto">
        {([
          { id: 'dashboard' as const, label: 'Integration Dashboard', icon: Globe },
          { id: 'inbox' as const, label: 'Universal Lead Inbox', icon: Users },
          { id: 'import_logs' as const, label: 'Import Logs', icon: FileSpreadsheet },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {integrations.map((integration) => {
              const platformInfo = LEAD_PLATFORMS.find((p) => p.id === integration.platform)!;
              const Icon = ICON_MAP[platformInfo.icon] || Globe;
              return (
                <div
                  key={integration.platform}
                  className="glass-card p-5 hover-glow transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${platformInfo.color}-500/20`}>
                        <Icon className={`w-5 h-5 text-${platformInfo.color}-400`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{platformInfo.label}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{platformInfo.description}</p>
                      </div>
                    </div>
                    {integration.is_connected ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        Not Connected
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="bg-white/5 rounded-lg p-2.5">
                      <p className="text-gray-400">Last Sync</p>
                      <p className="text-white font-medium mt-0.5">
                        {integration.last_synced_at
                          ? new Date(integration.last_synced_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2.5">
                      <p className="text-gray-400">Leads Imported</p>
                      <p className="text-white font-medium mt-0.5">{integration.total_leads_imported || 0}</p>
                    </div>
                  </div>

                  {integration.is_connected && (
                    <div className="mt-2 mb-4 bg-white/5 rounded-lg p-2.5 space-y-2 text-[10px] text-left">
                      <div>
                        <p className="text-gray-400 font-semibold">Webhook Target URL</p>
                        <p className="text-blue-300 select-all font-mono break-all mt-0.5">
                          {`${window.location.origin}/functions/v1/lead-webhook`}
                        </p>
                      </div>
                      {(integration.config as any)?.api_token && (
                        <div>
                          <p className="text-gray-400 font-semibold">API Auth Token</p>
                          <p className="text-emerald-300 select-all font-mono break-all mt-0.5">
                            {(integration.config as any).api_token}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {integration.is_connected ? (
                      <>
                        <button
                          onClick={() => handleSync(integration.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg py-2 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Sync Now
                        </button>
                        <button
                          onClick={() => handleDisconnect(integration.id, integration.platform)}
                          className="flex items-center justify-center gap-1.5 text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg py-2 px-3 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowConnectModal(integration.platform)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg py-2 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Connect {platformInfo.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="glass-card p-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search by name, email, phone, campaign..."
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={sourceFilter}
                    onChange={(e) => { setSourceFilter(e.target.value as LeadSourceType | 'all'); setCurrentPage(1); }}
                    className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="all" className="bg-gray-900">All Sources</option>
                    {LEAD_PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id} className="bg-gray-900">{p.label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="all" className="bg-gray-900">All Status</option>
                    <option value="new" className="bg-gray-900">New</option>
                    <option value="contacted" className="bg-gray-900">Contacted</option>
                    <option value="follow_up" className="bg-gray-900">Follow Up</option>
                    <option value="interested" className="bg-gray-900">Interested</option>
                    <option value="won" className="bg-gray-900">Won</option>
                    <option value="lost" className="bg-gray-900">Lost</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Leads Table - Desktop */}
            <div className="glass-card overflow-hidden hidden lg:block">
              <div className="overflow-x-auto">
          <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Source</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Lead Info</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Website / Campaign</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Telecaller</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Sync</th>
                      <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading leads...</td></tr>
                    ) : leads.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-400">No leads found. Connect a source or import a CSV to get started.</td></tr>
                    ) : (
                      leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${LEAD_SOURCE_COLORS[lead.lead_source as LeadSourceType] || 'bg-white/5 text-gray-300 border-white/10'}`}>
                              {LEAD_SOURCE_LABELS[lead.lead_source as LeadSourceType] || lead.lead_source || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-white">{lead.contact_person}</p>
                            <p className="text-xs text-gray-400">{lead.company_name}</p>
                            <p className="text-xs text-gray-500">{lead.email} {lead.phone && `• ${lead.phone}`}</p>
                          </td>
                          <td className="px-4 py-3">
                            {lead.website_name && <p className="text-sm text-white">{lead.website_name}</p>}
                            {lead.campaign_name && <p className="text-xs text-gray-400">{lead.campaign_name}</p>}
                            {!lead.website_name && !lead.campaign_name && <p className="text-xs text-gray-500">—</p>}
                          </td>
                          <td className="px-4 py-3">
                            {lead.assigned_telecaller_name ? (
                              <span className="text-sm text-white">{lead.assigned_telecaller_name}</span>
                            ) : (
                              <span className="text-xs text-gray-500">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-300 capitalize">{lead.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${SYNC_STATUS_COLORS[lead.sync_status as LeadSyncStatus] || 'bg-white/5 text-gray-400 border-white/10'}`}>
                              {SYNC_STATUS_LABELS[lead.sync_status as LeadSyncStatus] || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setShowAssignModal(lead)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-1.5 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leads Cards - Mobile */}
            <div className="lg:hidden space-y-3">
              {loading ? (
                <div className="text-center py-12 text-gray-400 glass-card">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12 text-gray-400 glass-card">No leads found.</div>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="glass-card p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{lead.contact_person}</p>
                        <p className="text-xs text-gray-400">{lead.company_name}</p>
                      </div>
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${LEAD_SOURCE_COLORS[lead.lead_source as LeadSourceType] || 'bg-white/5 text-gray-300 border-white/10'}`}>
                        {LEAD_SOURCE_LABELS[lead.lead_source as LeadSourceType] || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>{lead.email} {lead.phone && `• ${lead.phone}`}</p>
                      {lead.website_name && <p>Website: {lead.website_name}</p>}
                      {lead.campaign_name && <p>Campaign: {lead.campaign_name}</p>}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-300 capitalize">{lead.status}</span>
                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${SYNC_STATUS_COLORS[lead.sync_status as LeadSyncStatus] || 'bg-white/5 text-gray-400 border-white/10'}`}>
                          {SYNC_STATUS_LABELS[lead.sync_status as LeadSyncStatus] || '—'}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowAssignModal(lead)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {lead.assigned_telecaller_name || 'Assign'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between glass-card px-4 py-3">
                <p className="text-xs text-gray-400">
                  Page {currentPage} of {totalPages} • {totalLeads} total leads
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'import_logs' && (
          <motion.div
            key="import_logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
          <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Platform</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Total</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Imported</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Duplicates</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Failed</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {importLogs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No import logs yet.</td></tr>
                  ) : (
                    importLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">
                          {new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {LEAD_SOURCE_LABELS[log.platform as LeadSourceType] || log.platform}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-white">{log.total_rows}</td>
                        <td className="px-4 py-3 text-sm text-right text-emerald-300">{log.imported_count}</td>
                        <td className="px-4 py-3 text-sm text-right text-orange-300">{log.duplicate_count}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-300">{log.failed_count}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            log.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            log.status === 'partial' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            log.status === 'failed' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' :
              toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-200' :
              'bg-blue-500/20 border-blue-500/30 text-blue-200'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <ConnectModal
            platform={showConnectModal}
            onClose={() => setShowConnectModal(null)}
            onConnect={handleConnect}
          />
        )}
      </AnimatePresence>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showCSVModal && (
          <CSVImportModal
            onClose={() => setShowCSVModal(false)}
            onImported={async () => { await loadAll(); }}
          />
        )}
      </AnimatePresence>

      {/* Assign Telecaller Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <AssignModal
            lead={showAssignModal}
            team={team}
            onClose={() => setShowAssignModal(null)}
            onAssign={handleAssign}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/20`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-xl font-bold text-white">{value.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}

function ConnectModal({ platform, onClose, onConnect }: { platform: LeadSourceType; onClose: () => void; onConnect: (platform: LeadSourceType, name: string) => void }) {
  const [connectionName, setConnectionName] = useState(LEAD_SOURCE_LABELS[platform]);
  const platformInfo = LEAD_PLATFORMS.find((p) => p.id === platform)!;
  const Icon = ICON_MAP[platformInfo.icon] || Globe;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="glass-card p-6 max-w-md w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${platformInfo.color}-500/20`}>
              <Icon className={`w-5 h-5 text-${platformInfo.color}-400`} />
            </div>
            <h2 className="text-lg font-bold text-white">Connect {platformInfo.label}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
          <p className="text-sm text-blue-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            This is a placeholder connection. Real API credentials will be configured when the platform integration is activated. The database and UI architecture is production-ready.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Connection Name</label>
            <input
              type="text"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Webhook URL (for future use)</label>
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/functions/v1/lead-webhook`}
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">
            Cancel
          </button>
          <button
            onClick={() => onConnect(platform, connectionName)}
            className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Connect
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CSVImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed.slice(0, 5));
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text).map((r) => ({
        company_name: r.company_name || r.company || r.name || '',
        contact_person: r.contact_person || r.contact || r.person || '',
        email: r.email || r.email_address || '',
        phone: r.phone || r.phone_number || r.mobile || '',
        campaign_name: r.campaign_name || r.campaign || '',
        website_name: r.website_name || r.website || '',
        external_lead_id: r.external_lead_id || r.lead_id || '',
      }));
      const res = await leadIntegrationService.importCSVLeads(rows, 'manual_import');
      setResult(res);
      if (res.imported > 0) {
        onImported();
      }
    } catch (err) {
      setResult({ totalRows: 0, imported: 0, duplicates: 0, failed: 1, errors: [(err as Error).message] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="glass-card p-6 max-w-2xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Import Leads from CSV
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">Expected columns (header row, case-insensitive):</p>
          <div className="flex flex-wrap gap-2">
            {['company_name', 'contact_person', 'email', 'phone', 'campaign_name', 'website_name', 'external_lead_id'].map((col) => (
              <span key={col} className="text-xs font-mono text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                {col}
              </span>
            ))}
          </div>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          {file ? (
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB • Click to change</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-white">Click to upload CSV file</p>
              <p className="text-xs text-gray-400 mt-1">Max 10MB • .csv format only</p>
            </div>
          )}
        </div>

        {preview.length > 0 && !result && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Preview (first 5 rows):</p>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/5">
                  <tr>
                    {Object.keys(preview[0]).map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-2 text-gray-300">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-lg font-bold text-white">{result.totalRows}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
              <p className="text-xs text-emerald-400">Imported</p>
              <p className="text-lg font-bold text-emerald-300">{result.imported}</p>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 text-center">
              <p className="text-xs text-orange-400">Duplicates</p>
              <p className="text-lg font-bold text-orange-300">{result.duplicates}</p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 text-center">
              <p className="text-xs text-red-400">Failed</p>
              <p className="text-lg font-bold text-red-300">{result.failed}</p>
            </div>
          </div>
        )}

        {result && result.errors.length > 0 && (
          <div className="mt-3 max-h-32 overflow-y-auto bg-red-500/5 border border-red-500/20 rounded-lg p-3">
            {result.errors.slice(0, 10).map((err, i) => (
              <p key={i} className="text-xs text-red-300">{err}</p>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importing...' : 'Import Leads'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AssignModal({ lead, team, onClose, onAssign }: { lead: UniversalLead; team: Profile[]; onClose: () => void; onAssign: (leadId: string, telecallerId: string) => void }) {
  const [selected, setSelected] = useState(lead.assigned_to || '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="glass-card p-6 max-w-md w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            Assign Telecaller
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-white">{lead.contact_person}</p>
          <p className="text-xs text-gray-400">{lead.company_name} • {lead.email}</p>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {team.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No team members available to assign.</p>
          ) : (
            team.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelected(member.user_id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  selected === member.user_id
                    ? 'bg-blue-500/20 border-blue-500/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">
                      {member.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{member.full_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                </div>
                {selected === member.user_id && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
              </button>
            ))
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
          <button
            onClick={() => selected && onAssign(lead.id, selected)}
            disabled={!selected}
            className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
