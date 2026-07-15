import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: UserRole | UserRole[];
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, profile, loading, profileLoaded, hasPermission } = useAuth();
  const location = useLocation();

  // Wait for both auth loading AND profile to be loaded (if user exists)
  if (loading || (user && !profileLoaded)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check if user account is active
  if (profile && !profile.is_active) {
    return <Navigate to="/auth/login" state={{ from: location, message: 'Account is inactive' }} replace />;
  }

  // Check role requirement
  if (requiredRole && profile) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(profile.role)) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
