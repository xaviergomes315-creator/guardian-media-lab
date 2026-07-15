import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Link, RefreshCw, Bell, Save, CheckCircle, ExternalLink, Calendar, AlertCircle,
} from 'lucide-react';
import { reviewSettingsService } from '../../../services/reviewsService';
import { ReviewSettings, ReviewSyncInterval, REVIEW_SYNC_INTERVAL_LABELS } from '../../../types';

export default function ReviewsSettingsPage() {
  const [settings, setSettings] = useState<ReviewSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      let data = await reviewSettingsService.get();
      if (!data) {
        data = await reviewSettingsService.upsert({
          is_connected: false,
          business_name: '',
          location: '',
          auto_sync: false,
          sync_interval: 'daily',
          notify_new_reviews: true,
          notify_negative_reviews: true,
          notify_pending_replies: true,
        });
      }
      setSettings(data);
    } catch {
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await reviewSettingsService.upsert({
        is_connected: settings.is_connected,
        business_name: settings.business_name,
        location: settings.location,
        auto_sync: settings.auto_sync,
        sync_interval: settings.sync_interval,
        notify_new_reviews: settings.notify_new_reviews,
        notify_negative_reviews: settings.notify_negative_reviews,
        notify_pending_replies: settings.notify_pending_replies,
      });
      setSettings(updated);
      showToast('success', 'Settings saved');
    } catch {
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = () => {
    if (!settings?.is_connected) {
      showToast('error', 'Google Business API integration requires OAuth setup. Please contact your administrator to configure API credentials.');
    }
  };

  const updateField = <K extends keyof ReviewSettings>(key: K, value: ReviewSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="empty-state glass-card">
        <p className="text-gray-400">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Google Business Connection */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Link className="w-5 h-5" />
          Google Business Connection
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${settings.is_connected ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                {settings.is_connected ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <ExternalLink className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">
                  {settings.is_connected ? 'Connected to Google Business' : 'Not Connected'}
                </p>
                <p className="text-sm text-gray-400">
                  {settings.is_connected
                    ? settings.business_name || 'Business connected'
                    : 'Connect to sync reviews automatically'}
                </p>
              </div>
            </div>
            <button
              onClick={handleConnect}
              className={`btn-${settings.is_connected ? 'secondary' : 'primary'} flex items-center gap-2`}
            >
              {settings.is_connected ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  Connect Google
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Business Name</label>
              <input
                type="text"
                value={settings.business_name || ''}
                onChange={(e) => updateField('business_name', e.target.value)}
                placeholder="Your Business Name"
                className="form-input h-11"
              />
            </div>
            <div>
              <label className="form-label">Location</label>
              <input
                type="text"
                value={settings.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="City, Country"
                className="form-input h-11"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Auto Sync Settings */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Auto Sync Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Enable Auto Sync</p>
              <p className="text-sm text-gray-400">Automatically fetch new reviews from Google</p>
            </div>
            <button
              onClick={() => updateField('auto_sync', !settings.auto_sync)}
              className={`w-12 h-6 rounded-full transition-colors ${settings.auto_sync ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings.auto_sync ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {settings.auto_sync && (
            <div>
              <label className="form-label flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Sync Interval
              </label>
              <select
                value={settings.sync_interval}
                onChange={(e) => updateField('sync_interval', e.target.value as ReviewSyncInterval)}
                className="form-select h-11"
              >
                {(Object.keys(REVIEW_SYNC_INTERVAL_LABELS) as ReviewSyncInterval[]).map((interval) => (
                  <option key={interval} value={interval} className="bg-gray-900">
                    {REVIEW_SYNC_INTERVAL_LABELS[interval]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {settings.last_synced_at && (
            <div className="p-3 rounded-lg bg-white/5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">
                  Last synced: {new Date(settings.last_synced_at).toLocaleString()}
                </span>
              </div>
              {settings.total_reviews_synced !== undefined && (
                <span className="text-xs text-gray-500 pl-6">
                  Total synced reviews: {settings.total_reviews_synced}
                </span>
              )}
            </div>
          )}

          {settings.sync_status === 'syncing' && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-sm text-blue-300">Synchronization in progress...</span>
            </div>
          )}

          {settings.sync_error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">Sync Error: {settings.sync_error}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </h3>
        <div className="space-y-4">
          {[
            { key: 'notify_new_reviews' as const, label: 'New Reviews', description: 'Get notified when you receive a new review' },
            { key: 'notify_negative_reviews' as const, label: 'Negative Reviews', description: 'Get alerted on reviews with 3 stars or less' },
            { key: 'notify_pending_replies' as const, label: 'Pending Replies', description: 'Reminder for reviews that need a response' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
              <button
                onClick={() => updateField(item.key, !settings[item.key])}
                className={`w-12 h-6 rounded-full transition-colors ${settings[item.key] ? 'bg-blue-600' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-white text-sm font-medium shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </div>
  );
}
