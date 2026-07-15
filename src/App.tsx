import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Component, ReactNode, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModuleManagerProvider } from './contexts/ModuleManagerContext';
import ProtectedRoute from './components/ProtectedRoute';
import ModuleRouteGuard from './components/ModuleRouteGuard';
import DashboardLayout from './components/dashboard/DashboardLayout';

// Marketing Site Components
import Header from './components/Header';
import Hero from './components/Hero';
import Trust from './components/Trust';
import Services from './components/Services';
import WhyChooseUs from './components/WhyChooseUs';
import Portfolio from './components/Portfolio';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';

// Error Boundary to catch rendering errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Configuration error display - shows loading state while checking auth
function AuthLoadingScreen() {
  const { loading, profileLoaded, user } = useAuth();

  // Only show loading if we're loading AND we don't have a user yet
  // OR if we have a user but profile isn't loaded yet
  if (!loading && (!user || profileLoaded)) return null;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center fixed inset-0 z-[100]">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const OTPVerification = lazy(() => import('./pages/auth/OTPVerification'));
const Unauthorized = lazy(() => import('./pages/auth/Unauthorized'));

// Dashboard Pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const CRMPage = lazy(() => import('./pages/dashboard/leads/CRMPage'));
const LeadsPage = lazy(() => import('./pages/dashboard/leads/LeadsPage'));
const ClientsPage = lazy(() => import('./pages/dashboard/clients/ClientsPage'));
const WhatsAppPage = lazy(() => import('./pages/dashboard/whatsapp/WhatsAppPage'));
const ReviewsLayout = lazy(() => import('./components/reviews/ReviewsLayout'));
const ReviewsDashboardPage = lazy(() => import('./pages/dashboard/reviews/ReviewsDashboardPage'));
const ReviewsListPage = lazy(() => import('./pages/dashboard/reviews/ReviewsListPage'));
const ReviewDetailsPage = lazy(() => import('./pages/dashboard/reviews/ReviewDetailsPage'));
const ReplyManagementPage = lazy(() => import('./pages/dashboard/reviews/ReplyManagementPage'));
const ReviewsAnalyticsPage = lazy(() => import('./pages/dashboard/reviews/ReviewsAnalyticsPage'));
const ReviewsSettingsPage = lazy(() => import('./pages/dashboard/reviews/ReviewsSettingsPage'));
const InvoicesPage = lazy(() => import('./pages/dashboard/invoices/InvoicesPage'));
const TelecallerPage = lazy(() => import('./pages/dashboard/telecaller/TelecallerPage'));
const LeadIntegrationsPage = lazy(() => import('./pages/dashboard/lead-integrations/LeadIntegrationsPage'));
const NotificationsPage = lazy(() => import('./pages/dashboard/notifications/NotificationsPage'));
const ReportsPage = lazy(() => import('./pages/dashboard/reports/ReportsPage'));
const SocialPage = lazy(() => import('./pages/dashboard/social/SocialPage'));
const TeamPage = lazy(() => import('./pages/dashboard/team/TeamPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/settings/SettingsPage'));
const ModuleManagerPage = lazy(() => import('./pages/dashboard/settings/ModuleManagerPage'));
const MasterAdminPage = lazy(() => import('./pages/dashboard/master-admin/MasterAdminPage'));
const AutoAssignmentSettingsPage = lazy(() => import('./pages/dashboard/settings/AutoAssignmentSettingsPage'));
const ActivityLogPage = lazy(() => import('./pages/dashboard/activity/ActivityLogPage'));
const CalendarPage = lazy(() => import('./pages/dashboard/calendar/CalendarPage'));
const AIPage = lazy(() => import('./pages/dashboard/ai/AIPage'));
const ProjectsPage = lazy(() => import('./pages/dashboard/projects/ProjectsPage'));
const TasksPage = lazy(() => import('./pages/dashboard/tasks/TasksPage'));

// GST Pages
const GSTDashboardPage = lazy(() => import('./pages/dashboard/gst/GSTDashboardPage'));
const GSTClientsPage = lazy(() => import('./pages/dashboard/gst/GSTClientsPage'));
const GSTReturnsPage = lazy(() => import('./pages/dashboard/gst/GSTReturnsPage'));
const GSTDocumentsPage = lazy(() => import('./pages/dashboard/gst/GSTDocumentsPage'));
const GSTReportsPage = lazy(() => import('./pages/dashboard/gst/GSTReportsPage'));

// Services Pages
const ServicesCatalogPage = lazy(() => import('./pages/dashboard/services/ServicesCatalogPage'));
const ClientServicesPage = lazy(() => import('./pages/dashboard/services/ClientServicesPage'));

// Portal Admin Page
const AdminPortalClientsPage = lazy(() => import('./pages/dashboard/portal/AdminPortalClientsPage'));

// Client Portal
import PortalLayout from './components/portal/PortalLayout';
const PortalLogin = lazy(() => import('./pages/portal/auth/PortalLogin'));
const PortalForgotPassword = lazy(() => import('./pages/portal/auth/PortalForgotPassword'));
const PortalResetPassword = lazy(() => import('./pages/portal/auth/PortalResetPassword'));
const PortalDashboard = lazy(() => import('./pages/portal/dashboard/PortalDashboard'));
const PortalProfile = lazy(() => import('./pages/portal/PortalProfile'));
const PortalDocuments = lazy(() => import('./pages/portal/PortalDocuments'));
const PortalGSTReturns = lazy(() => import('./pages/portal/PortalGSTReturns'));
const PortalITR = lazy(() => import('./pages/portal/PortalITR'));
const PortalInvoices = lazy(() => import('./pages/portal/PortalInvoices'));
const PortalPayments = lazy(() => import('./pages/portal/PortalPayments'));
const PortalNotifications = lazy(() => import('./pages/portal/PortalNotifications'));
const PortalServices = lazy(() => import('./pages/portal/PortalServices'));

// Marketing Site
function MarketingSite() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header isScrolled={false} />
      <main>
        <Hero />
        <Trust />
        <Services />
        <WhyChooseUs />
        <Portfolio />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthLoadingScreen />
        <ModuleManagerProvider>
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen bg-black text-white flex items-center justify-center fixed inset-0 z-[100]">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        }>
        <Routes>
          {/* Marketing Site */}
          <Route path="/" element={<MarketingSite />} />

          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/verify-otp" element={<OTPVerification />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route
              path="crm"
              element={
                <ModuleRouteGuard moduleId="crm">
                  <ProtectedRoute requiredPermission="crm">
                    <CRMPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="leads"
              element={
                <ModuleRouteGuard moduleId="leads">
                  <ProtectedRoute requiredPermission="leads">
                    <LeadsPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="clients"
              element={
                <ModuleRouteGuard moduleId="clients">
                  <ProtectedRoute requiredPermission="clients">
                    <ClientsPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="projects"
              element={
                <ModuleRouteGuard moduleId="projects">
                  <ProtectedRoute requiredPermission="projects">
                    <ProjectsPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="team"
              element={
                <ProtectedRoute requiredPermission="team">
                  <TeamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="tasks"
              element={
                <ModuleRouteGuard moduleId="tasks">
                  <ProtectedRoute requiredPermission="tasks">
                    <TasksPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="social"
              element={
                <ModuleRouteGuard moduleId="social">
                  <ProtectedRoute requiredPermission="social">
                    <SocialPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="whatsapp"
              element={
                <ModuleRouteGuard moduleId="whatsapp">
                  <ProtectedRoute requiredPermission="whatsapp">
                    <WhatsAppPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="reviews"
              element={
                <ModuleRouteGuard moduleId="reviews">
                  <ProtectedRoute requiredPermission="reviews">
                    <ReviewsLayout />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            >
              <Route index element={<ReviewsDashboardPage />} />
              <Route path="list" element={<ReviewsListPage />} />
              <Route path="reply" element={<ReplyManagementPage />} />
              <Route path="analytics" element={<ReviewsAnalyticsPage />} />
              <Route path="settings" element={<ReviewsSettingsPage />} />
              <Route path=":id" element={<ReviewDetailsPage />} />
            </Route>
            <Route
              path="invoices"
              element={
                <ModuleRouteGuard moduleId="invoices">
                  <ProtectedRoute requiredPermission="invoices">
                    <InvoicesPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="gst"
              element={
                <ModuleRouteGuard moduleId="gst">
                  <ProtectedRoute requiredPermission="gst">
                    <GSTDashboardPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="gst/clients"
              element={
                <ProtectedRoute requiredPermission="gst">
                  <GSTClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="gst/returns"
              element={
                <ProtectedRoute requiredPermission="gst">
                  <GSTReturnsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="gst/documents"
              element={
                <ProtectedRoute requiredPermission="gst">
                  <GSTDocumentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="gst/reports"
              element={
                <ProtectedRoute requiredPermission="gst">
                  <GSTReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="telecaller"
              element={
                <ModuleRouteGuard moduleId="telecaller">
                  <ProtectedRoute requiredPermission="telecaller">
                    <TelecallerPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="lead-integrations"
              element={
                <ModuleRouteGuard moduleId="lead-integrations">
                  <ProtectedRoute requiredPermission="lead_integrations">
                    <LeadIntegrationsPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="notifications"
              element={
                <ModuleRouteGuard moduleId="notifications">
                  <ProtectedRoute requiredPermission="notifications">
                    <NotificationsPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="reports"
              element={
                <ModuleRouteGuard moduleId="reports">
                  <ProtectedRoute requiredPermission="reports">
                    <ReportsPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="ai"
              element={
                <ModuleRouteGuard moduleId="ai">
                  <ProtectedRoute requiredPermission="dashboard">
                    <AIPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute requiredPermission="settings">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="auto-assignment"
              element={
                <ModuleRouteGuard moduleId="auto-assignment">
                  <ProtectedRoute requiredPermission="settings">
                    <AutoAssignmentSettingsPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="modules"
              element={
                <ProtectedRoute requiredPermission="settings">
                  <ModuleManagerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="master-admin"
              element={
                <ProtectedRoute requiredPermission="settings">
                  <MasterAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="activity-logs"
              element={
                <ModuleRouteGuard moduleId="activity-logs">
                  <ProtectedRoute requiredPermission="dashboard">
                    <ActivityLogPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="calendar"
              element={
                <ModuleRouteGuard moduleId="calendar">
                  <ProtectedRoute requiredPermission="dashboard">
                    <CalendarPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="portal-clients"
              element={
                <ModuleRouteGuard moduleId="portal-clients">
                  <ProtectedRoute requiredPermission="clients">
                    <AdminPortalClientsPage />
                  </ProtectedRoute>
                </ModuleRouteGuard>
              }
            />
            <Route
              path="services-catalog"
              element={
                <ProtectedRoute requiredPermission="settings">
                  <ServicesCatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="client-services"
              element={
                <ProtectedRoute requiredPermission="clients">
                  <ClientServicesPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Client Portal Routes */}
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/portal/forgot-password" element={<PortalForgotPassword />} />
          <Route path="/portal/reset-password" element={<PortalResetPassword />} />
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="profile" element={<PortalProfile />} />
            <Route path="documents" element={<PortalDocuments />} />
            <Route path="gst-returns" element={<PortalGSTReturns />} />
            <Route path="itr" element={<PortalITR />} />
            <Route path="invoices" element={<PortalInvoices />} />
            <Route path="payments" element={<PortalPayments />} />
            <Route path="notifications" element={<PortalNotifications />} />
            <Route path="services" element={<PortalServices />} />
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </ModuleManagerProvider>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
