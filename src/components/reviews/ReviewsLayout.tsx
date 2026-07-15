import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Star, RefreshCw, Download, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { reviewsService } from '../../services/reviewsService';
import { exportReviews, ExportFormat } from '../../utils/reviewExport';
import { useReviewAnalytics } from '../../hooks/useReviewAnalytics';
import { GoogleReview } from '../../types';
import { supabase } from '../../lib/supabase';

export default function ReviewsLayout() {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const analytics = useReviewAnalytics(reviews);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewsService.getAll();
      setReviews(data);
    } catch {
      showToast('error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-reviews');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Extract success count from reports
      const added = data?.added || 0;
      const updated = data?.updated || 0;
      const deleted = data?.deleted || 0;

      showToast('success', `Sync completed: +${added} new, ~${updated} updated, -${deleted} deleted.`);
      await fetchReviews();
    } catch (err: any) {
      console.error('Google Reviews sync failed:', err);
      showToast('error', err.message || 'Failed to sync Google Reviews');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (reviews.length === 0) {
      showToast('error', 'No reviews to export');
      setShowExportMenu(false);
      return;
    }
    exportReviews({ reviews, averageRating: analytics.averageRating, format });
    showToast('success', `Reviews exported to ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            Google Business Reviews
          </h1>
          <p className="text-sm text-gray-400 mt-1">Monitor, analyze, and respond to customer reviews</p>
        </div>
        <div className="flex gap-2 relative">
          <button onClick={handleSync} disabled={syncing} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-44 glass-card p-2 z-50"
                >
                  {(['pdf', 'csv', 'excel'] as ExportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors capitalize"
                    >
                      Export as {fmt.toUpperCase()}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Dashboard', path: '/dashboard/reviews', end: true },
          { id: 'list', label: 'Reviews', path: '/dashboard/reviews/list', end: false },
          { id: 'reply', label: 'Reply Management', path: '/dashboard/reviews/reply', end: false },
          { id: 'analytics', label: 'Analytics', path: '/dashboard/reviews/analytics', end: false },
          { id: 'settings', label: 'Settings', path: '/dashboard/reviews/settings', end: false },
        ].map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ reviews, loading, fetchReviews, analytics, showToast }} />

      {/* Toast */}
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}
