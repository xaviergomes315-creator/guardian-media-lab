import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  Folder,
  CheckSquare,
  Share2,
  MessageCircle,
  Star,
  FileText,
  BarChart3,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Phone,
  Bell,
  Landmark,
  Globe,
  Zap,
  X,
  ArrowRightLeft,
  History,
  Calendar,
  Package,
  Puzzle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useModuleManager } from '../../contexts/ModuleManagerContext';
import { ROLE_LABELS } from '../../types';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', permissions: ['dashboard'], moduleId: 'dashboard' },
  { icon: UserPlus, label: 'CRM', path: '/dashboard/crm', permissions: ['crm', 'leads'], moduleId: 'crm' },
  { icon: Users, label: 'Leads', path: '/dashboard/leads', permissions: ['leads', 'crm'], moduleId: 'leads' },
  { icon: Briefcase, label: 'Clients', path: '/dashboard/clients', permissions: ['clients'], moduleId: 'clients' },
  { icon: Globe, label: 'Portal Clients', path: '/dashboard/portal-clients', permissions: ['portal'], moduleId: 'portal-clients' },
  { icon: Package, label: 'Services Catalog', path: '/dashboard/services-catalog', permissions: ['settings'], moduleId: 'settings' },
  { icon: Briefcase, label: 'Client Services', path: '/dashboard/client-services', permissions: ['clients'], moduleId: 'clients' },
  { icon: Folder, label: 'Projects', path: '/dashboard/projects', permissions: ['projects'], moduleId: 'projects' },
  { icon: Users, label: 'Team', path: '/dashboard/team', permissions: ['team'], moduleId: 'rbac' },
  { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks', permissions: ['tasks'], moduleId: 'tasks' },
  { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar', permissions: ['dashboard'], moduleId: 'calendar' },
  { icon: Share2, label: 'Social Media', path: '/dashboard/social', permissions: ['social'], moduleId: 'social' },
  { icon: MessageCircle, label: 'WhatsApp', path: '/dashboard/whatsapp', permissions: ['whatsapp'], moduleId: 'whatsapp' },
  { icon: Star, label: 'Reviews', path: '/dashboard/reviews', permissions: ['reviews'], moduleId: 'reviews' },
  { icon: FileText, label: 'Invoices', path: '/dashboard/invoices', permissions: ['invoices'], moduleId: 'invoices' },
  { icon: Landmark, label: 'GST', path: '/dashboard/gst', permissions: ['gst'], moduleId: 'gst' },
  { icon: Phone, label: 'Telecaller', path: '/dashboard/telecaller', permissions: ['telecaller'], moduleId: 'telecaller' },
  { icon: Zap, label: 'Lead Integrations', path: '/dashboard/lead-integrations', permissions: ['lead_integrations'], moduleId: 'lead-integrations' },
  { icon: ArrowRightLeft, label: 'Auto Assignment', path: '/dashboard/auto-assignment', permissions: ['settings'], moduleId: 'auto-assignment' },
  { icon: Bell, label: 'Notifications', path: '/dashboard/notifications', permissions: ['notifications'], moduleId: 'notifications' },
  { icon: History, label: 'Activity Logs', path: '/dashboard/activity-logs', permissions: ['dashboard'], moduleId: 'activity-logs' },
  { icon: BarChart3, label: 'Reports', path: '/dashboard/reports', permissions: ['reports'], moduleId: 'reports' },
  { icon: Bot, label: 'AI Assistant', path: '/dashboard/ai', permissions: ['ai', 'dashboard'], moduleId: 'ai' },
  { icon: Puzzle, label: 'Module Manager', path: '/dashboard/modules', permissions: ['settings'], moduleId: 'settings' },
  { icon: Shield, label: 'Master Admin', path: '/dashboard/master-admin', permissions: ['settings'], moduleId: 'settings' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings', permissions: ['settings'], moduleId: 'settings' },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, open, setOpen }: SidebarProps) {
  const { profile, hasPermission } = useAuth();
  const { isModuleEnabled } = useModuleManager();
  const location = useLocation();

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.path === '/dashboard/master-admin') {
      return profile?.role === 'super_admin';
    }
    return item.permissions.some((p) => hasPermission(p)) && isModuleEnabled(item.moduleId);
  });

  // Check if current path matches or is a sub-route
  const isItemActive = (path: string) => {
    if (location.pathname === path) return true;
    // Also match sub-routes (e.g., /dashboard/reviews/settings should highlight Reviews)
    if (location.pathname.startsWith(path + '/')) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0a0a0a]/98 backdrop-blur-xl z-50 flex flex-col md:hidden border-r border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
              <NavLink to="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold font-sora text-white">GWU</span>
              </NavLink>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 overscroll-contain">
              <ul className="space-y-1">
                {filteredMenuItems.map((item) => {
                  const isActive = isItemActive(item.path);
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'group-hover:text-white'}`} />
                        <span className="text-sm font-medium truncate">{item.label}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User Profile */}
            <div className="border-t border-white/10 p-4 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{profile?.role ? ROLE_LABELS[profile.role] : 'Client'}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        className="fixed left-0 top-0 bottom-0 bg-[#0a0a0a]/95 backdrop-blur-xl z-40 hidden md:flex flex-col border-r border-white/5"
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <NavLink to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="text-lg font-bold font-sora text-white whitespace-nowrap"
                >
                  GWU
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 overscroll-contain">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive = isItemActive(item.path);
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group overflow-hidden ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'group-hover:text-white'}`} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="text-sm font-medium truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!collapsed && isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                      />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="border-t border-white/10 p-4 bg-white/[0.02]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="avatar flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}</span>
              )}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{profile?.role ? ROLE_LABELS[profile.role] : 'Client'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="m-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </motion.aside>
    </>
  );
}
