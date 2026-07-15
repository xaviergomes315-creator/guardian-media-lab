import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Puzzle,
  Search,
  Lock,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useModuleManager } from '../../../contexts/ModuleManagerContext';

export default function ModuleManagerPage() {
  const { modules, isModuleEnabled, toggleModule, loading } = useModuleManager();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'core' | 'optional'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = async (moduleId: string, label: string) => {
    setTogglingId(moduleId);
    // Capture the state BEFORE toggling, since toggleModule updates state
    // and isModuleEnabled would then read the new (post-toggle) state.
    const wasEnabled = isModuleEnabled(moduleId);
    try {
      await toggleModule(moduleId);
      showToast('success', `${label} ${wasEnabled ? 'disabled' : 'enabled'}`);
    } catch {
      showToast('error', `Failed to toggle ${label}`);
    }
    setTogglingId(null);
  };

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchesSearch =
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === 'all' || (filter === 'core' && m.isCore) || (filter === 'optional' && !m.isCore);
      return matchesSearch && matchesFilter;
    });
  }, [modules, searchQuery, filter]);

  const coreCount = modules.filter((m) => m.isCore).length;
  const activeCount = modules.filter((m) => isModuleEnabled(m.id)).length;
  const inactiveCount = modules.length - activeCount;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
          <Puzzle className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white">Module Manager</h1>
          <p className="text-sm text-gray-400">Enable or disable application modules</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{modules.length}</p>
              <p className="text-xs text-gray-400">Total Modules</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeCount}</p>
              <p className="text-xs text-gray-400">Active</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{inactiveCount}</p>
              <p className="text-xs text-gray-400">Inactive</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{coreCount}</p>
              <p className="text-xs text-gray-400">Core Protected</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-gray-300">
            <span className="text-white font-medium">Core modules</span> (Authentication, Dashboard,
            Company Settings, RBAC) are always enabled and cannot be disabled. Disabling a module
            hides it from the sidebar and blocks its routes — module data is preserved.
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex p-1 bg-white/5 rounded-xl">
          {[
            { value: 'all', label: 'All' },
            { value: 'core', label: 'Core' },
            { value: 'optional', label: 'Optional' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value as 'all' | 'core' | 'optional')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredModules.map((module, idx) => {
            const enabled = isModuleEnabled(module.id);
            const isCore = module.isCore;
            const isToggling = togglingId === module.id;

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`glass-card p-4 md:p-5 transition-all ${
                  enabled ? 'border-white/10' : 'border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      enabled
                        ? 'bg-gradient-to-br from-blue-500/20 to-blue-700/20'
                        : 'bg-white/5'
                    }`}
                  >
                    <module.icon
                      className={`w-5 h-5 md:w-6 md:h-6 ${enabled ? 'text-blue-400' : 'text-gray-500'}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {isCore && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 text-xs font-medium">
                        <Lock className="w-3 h-3" />
                        Core
                      </span>
                    )}
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                        enabled
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {enabled ? (
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
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-white mb-1">{module.label}</h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{module.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {enabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visible in sidebar</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hidden from sidebar</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggle(module.id, module.label)}
                    disabled={isCore || isToggling}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                      enabled
                        ? 'bg-blue-600'
                        : 'bg-white/10'
                    } ${isCore ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'} ${
                      isToggling ? 'opacity-50' : ''
                    }`}
                  >
                    {isToggling ? (
                      <Loader2 className="w-4 h-4 text-white absolute top-1 left-1 animate-spin" />
                    ) : (
                      <motion.div
                        className="absolute top-1 w-4 h-4 rounded-full bg-white"
                        animate={{ left: enabled ? 26 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                </div>

                {isCore && (
                  <p className="mt-3 text-xs text-gray-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    This module is protected and cannot be disabled.
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {filteredModules.length === 0 && !loading && (
        <div className="glass-card p-12 flex flex-col items-center justify-center">
          <Puzzle className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400">No modules found matching your search.</p>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
