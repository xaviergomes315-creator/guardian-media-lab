import { Navigate, useLocation } from 'react-router-dom';
import { useModuleManager } from '../contexts/ModuleManagerContext';

interface ModuleRouteGuardProps {
  moduleId: string;
  children: React.ReactNode;
}

export default function ModuleRouteGuard({ moduleId, children }: ModuleRouteGuardProps) {
  const { isModuleEnabled, loading } = useModuleManager();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isModuleEnabled(moduleId)) {
    return <Navigate to="/unauthorized" state={{ from: location, message: 'Module is disabled' }} replace />;
  }

  return <>{children}</>;
}
