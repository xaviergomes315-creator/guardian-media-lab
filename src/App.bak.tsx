import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Component, ReactNode } from 'react';
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
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OTPVerification from './pages/auth/OTPVerification';
import Unauthorized from './pages/auth/Unauthorized';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import CRMPage from './pages/dashboard/leads/CRMPage';
import LeadsPage from './pages/dashboard/leads/LeadsPage';
import ClientsPage from './pages/dashboard/clients/ClientsPage';
import WhatsAppPage from './pages/dashboard/whatsapp/WhatsAppPage';
import ReviewsLayout from './components/reviews/ReviewsLayout';
import ReviewsDashboardPage from './pages/dashboard/reviews/ReviewsDashboardPage';
import ReviewsListPage from './pages/dashboard/reviews/ReviewsListPage';
import ReviewDetailsPage from './pages/dashboard/reviews/ReviewDetailsPage';
import ReplyManagementPage from './pages/dashboard/reviews/ReplyManagementPage';
import ReviewsAnalyticsPage from './pages/dashboard/reviews/ReviewsAnalyticsPage';
import ReviewsSettingsPage from './pages/dashboard/reviews/ReviewsSettingsPage';
import InvoicesPage from './pages/dashboard/invoices/InvoicesPage';
import TelecallerPage from './pages/dashboard/telecaller/TelecallerPage';
import LeadIntegrationsPage from './pages/dashboard/lead-integrations/LeadIntegrationsPage';
import NotificationsPage from './pages/dashboard/notifications/NotificationsPage';
import ReportsPage from './pages/dashboard/reports/ReportsPage';
import SocialPage from './pages/dashboard/social/SocialPage';
import TeamPage from './pages/dashboard/team/TeamPage';
import SettingsPage from './pages/dashboard/settings/SettingsPage';
import ModuleManagerPage from './pages/dashboard/settings/ModuleManagerPage';
import AutoAssignmentSettingsPage from './pages/dashboard/settings/AutoAssignmentSettingsPage';
import ActivityLogPage from './pages/dashboard/activity/ActivityLogPage';
import CalendarPage from './pages/dashboard/calendar/CalendarPage';
import AIPage from './pages/dashboard/ai/AIPage';
import ProjectsPage from './pages/dashboard/projects/ProjectsPage';
import TasksPage from './pages/dashboard/tasks/TasksPage';

// GST Pages
import GSTDashboardPage from './pages/dashboard/gst/GSTDashboardPage';
import GSTClientsPage from './pages/dashboard/gst/GSTClientsPage';
import GSTReturnsPage from './pages/dashboard/gst/GSTReturnsPage';
import GSTDocumentsPage from './pages/dashboard/gst/GSTDocumentsPage';
import GSTReportsPage from './pages/dashboard/gst/GSTReportsPage';

// Services Pages
import ServicesCatalogPage from './pages/dashboard/services/ServicesCatalogPage';
import ClientServicesPage from './pages/dashboard/services/ClientServicesPage';

// Portal Admin Page
import AdminPortalClientsPage from './pages/dashboard/portal/AdminPortalClientsPage';

// Client Portal
import PortalLayout from './components/portal/PortalLayout';
import PortalLogin from './pages/portal/auth/PortalLogin';
import PortalForgotPassword from './pages/portal/auth/PortalForgotPassword';
import PortalResetPassword from './pages/portal/auth/PortalResetPassword';
import PortalDashboard from './pages/portal/dashboard/PortalDashboard';
import PortalProfile from './pages/portal/PortalProfile';
import PortalDocuments from './pages/portal/PortalDocuments';
import PortalGSTReturns from './pages/portal/PortalGSTReturns';
import PortalITR from './pages/portal/PortalITR';
import PortalInvoices from './pages/portal/PortalInvoices';
import PortalPayments from './pages/portal/PortalPayments';
import PortalNotifications from './pages/portal/PortalNotifications';
import PortalServices from './pages/portal/PortalServices';

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
      </BrowserRouter>
      </ModuleManagerProvider>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
