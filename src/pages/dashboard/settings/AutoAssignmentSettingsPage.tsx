import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Users,
  RefreshCw,
  UserCheck,
  Hand,
  ToggleLeft,
  ToggleRight,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  ArrowRight,
  Bell,
  BellOff,
  Loader2,
  List,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { autoAssignmentService } from '../../../services/api';
import {
  AutoAssignmentSettings,
  AssignmentMethod,
  LeadAssignmentQueue,
  TelecallerWithStats,
  Profile,
  ASSIGNMENT_METHOD_LABELS,
} from '../../../types';

export default function AutoAssignmentSettingsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings state
  const [settings, setSettings] = useState<AutoAssignmentSettings | null>(null);
  const [telecallers, setTelecallers] = useState<TelecallerWithStats[]>([]);
  const [activeTelecallers, setActiveTelecallers] = useState<Profile[]>([]);
  const [pendingQueue, setPendingQueue] = useState<LeadAssignmentQueue[]>([]);
  const [queueStats, setQueueStats] = useState({ total: 0, pending: 0, assigned: 0, cancelled: 0 });

  // UI state
  const [activeTab, setActiveTab] = useState<'settings' | 'queue' | 'telecallers'>('settings');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<LeadAssignmentQueue | null>(null);
  const [selectedTelecaller, setSelectedTelecaller] = useState<string>('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSettings(),
        fetchTelecallers(),
        fetchQueue(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await autoAssignmentService.settings.get();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast('error', 'Failed to load auto-assignment settings');
    }
  };

  const fetchTelecallers = async () => {
    try {
      const [all, active] = await Promise.all([
        autoAssignmentService.telecallers.getAll(),
        autoAssignmentService.telecallers.getActive(),
      ]);
      setTelecallers(all);
      setActiveTelecallers(active);
    } catch (error) {
      console.error('Error fetching telecallers:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      const [items, stats] = await Promise.all([
        autoAssignmentService.queue.getPending(),
        autoAssignmentService.queue.getStats(),
      ]);
      setPendingQueue(items);
      setQueueStats(stats);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await autoAssignmentService.settings.update({
        is_enabled: settings.is_enabled,
        assignment_method: settings.assignment_method,
        fixed_telecaller_id: settings.fixed_telecaller_id,
        notify_admin_on_unassigned: settings.notify_admin_on_unassigned,
      });
      showToast('success', 'Auto-assignment settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedQueueItem || !selectedTelecaller) return;

    setSaving(true);
    try {
      await autoAssignmentService.queue.assignManually(selectedQueueItem.id, selectedTelecaller);
      showToast('success', 'Lead assigned successfully');
      setShowAssignModal(false);
      setSelectedQueueItem(null);
      setSelectedTelecaller('');
      fetchQueue();
      fetchTelecallers();
    } catch (error) {
      console.error('Error assigning lead:', error);
      showToast('error', 'Failed to assign lead');
    } finally {
      setSaving(false);
    }
  };

  const canManageSettings = profile?.role === 'super_admin' || profile?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 z-50 px-6 py-3 rounded-xl flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            Auto Lead Assignment
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Configure automatic lead assignment to telecallers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            settings?.is_enabled
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {settings?.is_enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeTelecallers.length}</p>
              <p className="text-xs text-white/60">Active Telecallers</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-500/20">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{queueStats.pending}</p>
              <p className="text-xs text-white/60">Pending Leads</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-500/20">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{queueStats.assigned}</p>
              <p className="text-xs text-white/60">Assigned Today</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/20">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white capitalize">
                {settings?.assignment_method?.replace('_', ' ') || 'N/A'}
              </p>
              <p className="text-xs text-white/60">Assignment Method</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'queue', label: 'Pending Queue', icon: List },
          { id: 'telecallers', label: 'Telecallers', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'queue' && queueStats.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                {queueStats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  {settings?.is_enabled ? (
                    <ToggleRight className="w-6 h-6 text-blue-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">Auto Assignment</h3>
                  <p className="text-sm text-white/60">
                    Automatically assign new leads to telecallers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSettings(prev => prev ? { ...prev, is_enabled: !prev.is_enabled } : prev)}
                disabled={!canManageSettings}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings?.is_enabled ? 'bg-blue-500' : 'bg-gray-600'
                } ${!canManageSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings?.is_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Assignment Method */}
            <div className="border-t border-white/10 pt-6">
              <label className="block text-sm font-medium text-white mb-3">
                Assignment Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['round_robin', 'fixed', 'manual'] as AssignmentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => setSettings(prev => prev ? { ...prev, assignment_method: method } : prev)}
                    disabled={!canManageSettings || !settings?.is_enabled}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      settings?.assignment_method === method
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                    } ${(!settings?.is_enabled || !canManageSettings) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {method === 'round_robin' && <RefreshCw className="w-5 h-5" />}
                      {method === 'fixed' && <UserCheck className="w-5 h-5" />}
                      {method === 'manual' && <Hand className="w-5 h-5" />}
                      <span className="font-medium">{ASSIGNMENT_METHOD_LABELS[method].split(' ')[0]}</span>
                    </div>
                    <p className="text-xs opacity-70">
                      {method === 'round_robin' && 'Distribute leads equally among all telecallers'}
                      {method === 'fixed' && 'Assign all leads to a specific telecaller'}
                      {method === 'manual' && 'Leads remain unassigned for manual assignment'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed Telecaller Selection */}
            {settings?.assignment_method === 'fixed' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/10 pt-6"
              >
                <label className="block text-sm font-medium text-white mb-3">
                  Select Fixed Telecaller
                </label>
                <select
                  value={settings.fixed_telecaller_id || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, fixed_telecaller_id: e.target.value || null } : prev)}
                  disabled={!canManageSettings || !settings?.is_enabled}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                >
                  <option value="">Select a telecaller</option>
                  {activeTelecallers.map((tc) => (
                    <option key={tc.user_id} value={tc.user_id}>
                      {tc.full_name} ({tc.email})
                    </option>
                  ))}
                </select>
                {activeTelecallers.length === 0 && (
                  <p className="mt-2 text-sm text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No active telecallers available
                  </p>
                )}
              </motion.div>
            )}

            {/* Admin Notification Toggle */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-500/20">
                    {settings?.notify_admin_on_unassigned ? (
                      <Bell className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <BellOff className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Admin Notifications</h3>
                    <p className="text-sm text-white/60">
                      Notify admin when no telecaller is available for assignment
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings(prev => prev ? { ...prev, notify_admin_on_unassigned: !prev.notify_admin_on_unassigned } : prev)}
                  disabled={!canManageSettings}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings?.notify_admin_on_unassigned ? 'bg-yellow-500' : 'bg-gray-600'
                  } ${!canManageSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings?.notify_admin_on_unassigned ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Button */}
            {canManageSettings && (
              <div className="border-t border-white/10 pt-6">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-xl font-medium transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Settings
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Pending Assignment Queue
              </h3>
              <p className="text-sm text-white/60 mt-1">
                Leads waiting to be assigned to a telecaller
              </p>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white/60">All leads have been assigned</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pendingQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{item.lead?.company_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-white/80">{item.lead?.contact_person}</p>
                          <p className="text-xs text-white/50">{item.lead?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-lg text-xs bg-blue-500/20 text-blue-400 capitalize">
                            {item.lead?.source || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/60 text-sm">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedQueueItem(item);
                              setShowAssignModal(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Telecallers Tab */}
      {activeTab === 'telecallers' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {telecallers.map((tc) => (
              <div
                key={tc.user_id}
                className={`bg-white/5 border rounded-xl p-4 ${
                  tc.is_active ? 'border-white/10' : 'border-red-500/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-white font-bold">
                      {tc.full_name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{tc.full_name}</h4>
                      <p className="text-xs text-white/50">{tc.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs ${
                    tc.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {tc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <p className="text-lg font-bold text-white">{tc.total_assigned}</p>
                    <p className="text-xs text-white/50">Total</p>
                  </div>
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <p className="text-lg font-bold text-yellow-400">{tc.pending_leads}</p>
                    <p className="text-xs text-white/50">Pending</p>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <p className="text-lg font-bold text-green-400">{tc.completed_leads}</p>
                    <p className="text-xs text-white/50">Converted</p>
                  </div>
                </div>
              </div>
            ))}

            {telecallers.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/60">No telecallers found</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Assignment Modal */}
      <AnimatePresence>
        {showAssignModal && selectedQueueItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Assign Lead</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-white/5 rounded-xl">
                <p className="text-white font-medium">{selectedQueueItem.lead?.company_name}</p>
                <p className="text-sm text-white/60">{selectedQueueItem.lead?.contact_person}</p>
                <span className="inline-block mt-2 px-2 py-1 rounded-lg text-xs bg-blue-500/20 text-blue-400 capitalize">
                  {selectedQueueItem.lead?.source}
                </span>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Select Telecaller
                </label>
                <select
                  value={selectedTelecaller}
                  onChange={(e) => setSelectedTelecaller(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Select a telecaller</option>
                  {activeTelecallers.map((tc) => (
                    <option key={tc.user_id} value={tc.user_id}>
                      {tc.full_name} ({tc.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAssign}
                  disabled={!selectedTelecaller || saving}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Assign Lead
                    </>
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
