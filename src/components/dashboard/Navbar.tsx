import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, User, Settings,
  LogOut, ChevronDown, Menu, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../types';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type?: string;
}

interface NavbarProps {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

export default function Navbar({ sidebarCollapsed, onMenuClick }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchResults, setSearchResults] = useState<{ category: string; label: string; path: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  async function loadNotifications() {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, read, created_at, type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  }

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }

  async function markOneRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'CRM Pipeline', path: '/dashboard/crm' },
    { label: 'Leads', path: '/dashboard/leads' },
    { label: 'Clients', path: '/dashboard/clients' },
    { label: 'Projects', path: '/dashboard/projects' },
    { label: 'Tasks', path: '/dashboard/tasks' },
    { label: 'Team Management', path: '/dashboard/team' },
    { label: 'Invoices', path: '/dashboard/invoices' },
    { label: 'GST Module', path: '/dashboard/gst' },
    { label: 'Telecaller CRM', path: '/dashboard/telecaller' },
    { label: 'WhatsApp Messaging', path: '/dashboard/whatsapp' },
    { label: 'Google Reviews', path: '/dashboard/reviews' },
    { label: 'Social Media', path: '/dashboard/social' },
    { label: 'Reports & Analytics', path: '/dashboard/reports' },
    { label: 'Calendar', path: '/dashboard/calendar' },
    { label: 'Notifications', path: '/dashboard/notifications' },
    { label: 'AI Assistant', path: '/dashboard/ai' },
    { label: 'Lead Integrations', path: '/dashboard/lead-integrations' },
    { label: 'Activity Logs', path: '/dashboard/activity-logs' },
    { label: 'Services Catalog', path: '/dashboard/services-catalog' },
    { label: 'Client Services', path: '/dashboard/client-services' },
    { label: 'Settings', path: '/dashboard/settings' },
    { label: 'Module Manager', path: '/dashboard/modules' },
  ];

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    // Show nav item matches immediately while the debounced data query runs.
    const navMatches = NAV_ITEMS.filter(item => item.label.toLowerCase().includes(q.toLowerCase())).slice(0, 4);
    setSearchResults(navMatches.map(r => ({ category: 'Pages', label: r.label, path: r.path })));
    setShowSearchResults(true);

    // Debounce the Supabase data search by 300ms.
    searchTimer.current = setTimeout(async () => {
      const pattern = `%${q}%`;
      const results: { category: string; label: string; path: string }[] = [];

      try {
        const [leadsRes, clientsRes, invoicesRes] = await Promise.all([
          supabase.from('leads').select('id, name').ilike('name', pattern).limit(5),
          supabase.from('clients').select('id, name').ilike('name', pattern).limit(5),
          supabase.from('invoices').select('id, invoice_number').ilike('invoice_number', pattern).limit(5),
        ]);

        if (leadsRes.data) {
          leadsRes.data.forEach((l: any) => results.push({ category: 'Leads', label: l.name, path: `/dashboard/leads` }));
        }
        if (clientsRes.data) {
          clientsRes.data.forEach((c: any) => results.push({ category: 'Clients', label: c.name, path: `/dashboard/clients` }));
        }
        if (invoicesRes.data) {
          invoicesRes.data.forEach((i: any) => results.push({ category: 'Invoices', label: i.invoice_number, path: `/dashboard/invoices` }));
        }
      } catch (e) {
        console.error('Search error:', e);
      }

      // Merge nav matches (first) with data results, grouped by category.
      const grouped: { category: string; label: string; path: string }[] = [];
      const byCat: Record<string, { category: string; label: string; path: string }[]> = {};
      [...navMatches.map(r => ({ category: 'Pages', label: r.label, path: r.path })), ...results].forEach(r => {
        if (!byCat[r.category]) byCat[r.category] = [];
        byCat[r.category].push(r);
      });
      Object.entries(byCat).forEach(([, items]) => {
        grouped.push(...items);
      });
      setSearchResults(grouped);
      setShowSearchResults(grouped.length > 0);
    }, 300);
  };

  const handleSearchNav = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchResults(false);
    setShowMobileSearch(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const fmtTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-xl z-30 flex items-center justify-between px-4 lg:px-6 border-b border-white/5 transition-all duration-300 ${
        sidebarCollapsed ? 'md:left-[72px]' : 'md:left-[260px]'
      }`}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors md:hidden flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Search */}
        <div className="relative hidden md:block flex-1 max-w-md lg:max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
            placeholder="Search pages, modules..."
            className="w-full pl-10 pr-4 h-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
          />
          <AnimatePresence>
            {showSearchResults && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 max-h-80 overflow-y-auto"
              >
                {(() => {
                  // Group results by category for display
                  const categories: Record<string, { category: string; label: string; path: string }[]> = {};
                  searchResults.forEach(r => {
                    if (!categories[r.category]) categories[r.category] = [];
                    categories[r.category].push(r);
                  });
                  return Object.entries(categories).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{category}</div>
                      {items.map((r, idx) => (
                        <button
                          key={`${r.path}-${idx}`}
                          onMouseDown={() => handleSearchNav(r.path)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-colors text-left"
                        >
                          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Search Button */}
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors md:hidden flex-shrink-0"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Backdrop for mobile */}
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] glass-card p-4 max-h-96 overflow-y-auto z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white text-sm">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => { navigate('/dashboard/notifications'); setShowNotifications(false); }}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        View all
                      </button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="empty-state py-8">
                      <Bell className="w-8 h-8 text-gray-600 mb-2" />
                      <p className="text-gray-500 text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markOneRead(n.id)}
                          className={`p-3 rounded-xl cursor-pointer transition-colors ${
                            !n.read
                              ? 'bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/15'
                              : 'bg-white/3 hover:bg-white/7'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-sm font-medium leading-tight ${n.read ? 'text-gray-300' : 'text-white'}`}>
                              {n.title}
                            </p>
                            <span className="text-xs text-gray-500 flex-shrink-0">{fmtTime(n.created_at)}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="avatar avatar-sm">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xs">{profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}</span>
              )}
            </div>
            <div className="hidden lg:block text-left min-w-0">
              <p className="text-sm font-medium text-white truncate max-w-[120px]">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.role ? ROLE_LABELS[profile.role] : 'User'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block flex-shrink-0" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <>
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowProfile(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-56 glass-card p-2 z-50"
                >
                  <button
                    onClick={() => { navigate('/dashboard/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button
                    onClick={() => { navigate('/dashboard/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Settings</span>
                  </button>
                  <div className="my-2 border-t border-white/10" />
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Logout</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 p-4 bg-[#0a0a0a]/98 backdrop-blur-xl border-b border-white/10 md:hidden z-50"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search pages, modules..."
                className="w-full pl-10 pr-10 h-11 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                autoFocus
              />
              <button
                onClick={() => { setShowMobileSearch(false); setSearchQuery(''); setShowSearchResults(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-3 glass-card p-2 max-h-60 overflow-y-auto">
                {(() => {
                  const categories: Record<string, { category: string; label: string; path: string }[]> = {};
                  searchResults.forEach(r => {
                    if (!categories[r.category]) categories[r.category] = [];
                    categories[r.category].push(r);
                  });
                  return Object.entries(categories).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{category}</div>
                      {items.map((r, idx) => (
                        <button
                          key={`${r.path}-${idx}`}
                          onClick={() => handleSearchNav(r.path)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-colors text-left"
                        >
                          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
