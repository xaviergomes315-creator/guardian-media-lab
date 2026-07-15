import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  MessageCircle,
  Star,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Notification } from '../../../types';

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking as read:', error);
    } else {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error marking all as read:', error);
    } else {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      showToast('All notifications marked as read');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
    } else {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setDeleteConfirm(null);
      showToast('Notification deleted');
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return MessageCircle;
      case 'review': return Star;
      case 'invoice': return FileText;
      case 'lead': return Users;
      case 'follow_up': return Clock;
      case 'upcoming_reminder': return BellRing;
      case 'missed_reminder': return AlertCircle;
      case 'task_completed': return CheckCircle;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'whatsapp': return 'bg-green-500/20 text-green-400';
      case 'review': return 'bg-yellow-500/20 text-yellow-400';
      case 'invoice': return 'bg-purple-500/20 text-purple-400';
      case 'lead': return 'bg-blue-500/20 text-blue-400';
      case 'follow_up': return 'bg-orange-500/20 text-orange-400';
      case 'upcoming_reminder': return 'bg-cyan-500/20 text-cyan-400';
      case 'missed_reminder': return 'bg-red-500/20 text-red-400';
      case 'task_completed': return 'bg-emerald-500/20 text-emerald-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const uniqueTypes = [...new Set(notifications.map(n => n.type))];

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' || (filter === 'unread' && !n.read);
    const matchesType = typeFilter === 'all' || n.type === typeFilter;
    const matchesSearch = searchQuery === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentNotifications = filteredNotifications.slice(indexOfFirst, indexOfLast);

  const stats = [
    { label: 'Total', value: notifications.length, icon: Bell },
    { label: 'Unread', value: notifications.filter(n => !n.read).length, icon: AlertCircle, highlight: true },
    ...uniqueTypes.slice(0, 2).map(type => ({
      label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      value: notifications.filter(n => n.type === type).length,
      icon: getTypeIcon(type),
    })),
  ];

  return (
    <div className="space-y-4 md:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-sora text-white flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            Notification Center
          </h1>
          <p className="text-sm text-gray-400 mt-1">Stay updated with all your important alerts</p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={notifications.filter(n => !n.read).length === 0}
          className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          Mark All Read
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`glass-card p-3 md:p-5 ${stat.highlight ? 'ring-2 ring-blue-500/50' : ''}`}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${
                stat.highlight ? 'bg-blue-500' : 'bg-white/10'
              }`}>
                <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.highlight ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`text-lg md:text-2xl font-bold ${stat.highlight ? 'text-blue-400' : 'text-white'}`}>{stat.value}</p>
                <p className="text-xs md:text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search notifications..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white min-w-[120px]"
          >
            <option value="all" className="bg-gray-900">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type} className="bg-gray-900">
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setFilter('all'); setCurrentPage(1); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === 'all' ? 'bg-white/10 text-white' : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => { setFilter('unread'); setCurrentPage(1); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 md:space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading notifications...</div>
        ) : currentNotifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No notifications found
          </div>
        ) : (
          currentNotifications.map((notification, idx) => {
            const Icon = getTypeIcon(notification.type);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`glass-card p-3 md:p-4 hover:bg-white/5 transition-colors ${
                  !notification.read ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium text-sm md:text-base ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs md:text-sm text-gray-400 mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                        {new Date(notification.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-blue-400"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {notification.action_url && (
                      <a
                        href={notification.action_url}
                        className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        title="Go to"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(notification.id)}
                      className="p-1.5 md:p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredNotifications.length)} of {filteredNotifications.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Notification</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
