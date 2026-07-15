import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { Bell, CheckCircle, Circle, Trash2, BellOff, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OutletContext { portalClient: { id: string; client_id: string } }

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  invoice: '💰',
  document: '📄',
  gst: '📊',
  payment: '💳',
  task: '✅',
  general: '🔔',
};

const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function PortalNotifications() {
  const { portalClient } = useOutletContext<OutletContext>();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState('');

  useEffect(() => { if (portalClient?.id) loadNotifications(); }, [portalClient]);

  async function loadNotifications() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('portal_notifications')
      .select('*')
      .eq('portal_client_id', portalClient.id)
      .order('created_at', { ascending: false });
    if (err) setError('Failed to load notifications');
    else setNotifications(data || []);
    setLoading(false);
  }

  async function markRead(id: string) {
    await supabase.from('portal_notifications').update({ read: true }).eq('id', id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    await supabase.from('portal_notifications').update({ read: true }).eq('portal_client_id', portalClient.id).eq('read', false);
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }

  async function deleteNotification(id: string) {
    await supabase.from('portal_notifications').delete().eq('id', id);
    setNotifications(ns => ns.filter(n => n.id !== id));
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-emerald-400" /> Notifications
              {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">{unreadCount}</span>}
            </h1>
            <p className="text-gray-400">Stay updated with important alerts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadNotifications} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors">
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {error && <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>All ({notifications.length})</button>
        <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Unread ({unreadCount})</button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0
          ? (
            <div className="text-center py-16">
              <BellOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">{filter === 'unread' ? 'All notifications have been read' : 'No notifications yet'}</p>
            </div>
          )
          : filtered.map(notif => (
            <div key={notif.id}
              className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-all ${notif.read ? 'bg-white/3 border-white/5 opacity-70 hover:opacity-100' : 'bg-white/7 border-white/15 hover:bg-white/10'}`}
              onClick={() => !notif.read && markRead(notif.id)}>
              <div className="text-2xl flex-shrink-0">{TYPE_ICONS[notif.type] || '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium text-sm ${notif.read ? 'text-gray-300' : 'text-white'}`}>{notif.title}</p>
                  <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">{fmtDateTime(notif.created_at)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notif.read
                  ? <button onClick={e => { e.stopPropagation(); markRead(notif.id); }} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors" title="Mark as read"><CheckCircle className="w-3.5 h-3.5" /></button>
                  : <Circle className="w-3.5 h-3.5 text-gray-600" />
                }
                <button onClick={e => { e.stopPropagation(); deleteNotification(notif.id); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
