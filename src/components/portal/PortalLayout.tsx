import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate, useNavigationType, NavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  User,
  FileCheck,
  Receipt,
  CreditCard,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  FolderOpen,
  ClipboardList,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { portalService } from '../../services/api';
import { PortalClient } from '../../types';

const sidebarItems = [
  { path: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/portal/services', label: 'My Services', icon: Briefcase },
  { path: '/portal/profile', label: 'My Profile', icon: User },
  { path: '/portal/documents', label: 'Documents', icon: FolderOpen },
  { path: '/portal/gst-returns', label: 'GST Returns', icon: FileCheck },
  { path: '/portal/itr', label: 'ITR', icon: ClipboardList },
  { path: '/portal/invoices', label: 'Invoices', icon: Receipt },
  { path: '/portal/payments', label: 'Payments', icon: CreditCard },
  { path: '/portal/notifications', label: 'Notifications', icon: Bell },
];

export default function PortalLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalClient, setPortalClient] = useState<PortalClient | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadPortalClient();
  }, [user]);

  useEffect(() => {
    if (portalClient) {
      loadUnreadNotifications();
    }
  }, [portalClient]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const loadPortalClient = async () => {
    if (!user) return;
    try {
      const client = await portalService.clients.getByUserId(user.id);
      if (!client || !client.is_active) {
        navigate('/unauthorized');
        return;
      }
      setPortalClient(client);
    } catch (error) {
      console.error('Error loading portal client:', error);
      navigate('/unauthorized');
    }
  };

  const loadUnreadNotifications = async () => {
    if (!portalClient) return;
    try {
      const count = await portalService.notifications.getUnreadCount(portalClient.id);
      setUnreadNotifications(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/portal/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Determine animation direction based on navigation type
  const getAnimationVariants = () => {
    // Don't animate on POP (back/forward) to avoid jarring effect
    if (navigationType === NavigationType.Pop) {
      return {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 1, y: 0 },
      };
    }
    // Animate on PUSH (forward navigation)
    return {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
    };
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/10 backdrop-blur-sm"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 260,
          x: mobileMenuOpen ? 0 : (isMobile ? -260 : 0)
        }}
        className={`fixed left-0 top-0 h-full bg-gray-900/50 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : ''
        } lg:translate-x-0 transition-transform duration-300`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <Link to="/portal/dashboard" className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg opacity-80" />
              <Shield className="relative z-10 w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="text-lg font-bold font-sora bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Client Portal
                </span>
                <p className="text-xs text-gray-500">Guardian Media Lab</p>
              </div>
            )}
          </Link>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-gray-800 border border-white/10 items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              {item.path === '/portal/notifications' && unreadNotifications > 0 && !sidebarCollapsed && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          {portalClient && (
            <div className={`flex items-center gap-3 mb-4 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0">
                {portalClient.profile_photo ? (
                  <img src={portalClient.profile_photo} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-white">
                    {portalClient.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{portalClient.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{portalClient.email}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/10 transition-all duration-200 w-full ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div
        className="relative transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 260) }}
      >
        {/* Page Content */}
        <main className="min-h-screen p-4 lg:p-6">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={location.pathname}
              {...getAnimationVariants()}
              transition={{ duration: 0.15 }}
            >
              <Outlet context={{ portalClient, unreadNotifications, refreshNotifications: loadUnreadNotifications }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
