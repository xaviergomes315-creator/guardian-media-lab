import { useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, ROLE_PERMISSIONS, RolePermission, UserPermission } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Hook for role-based access control
 */
export function useRBAC() {
  const { profile, user } = useAuth();

  const role = useMemo(() => profile?.role ?? null, [profile]);
  const isAuthenticated = useMemo(() => !!user, [user]);
  const isActive = useMemo(() => profile?.is_active ?? false, [profile]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!profile || !isAuthenticated || !isActive) return false;

      const permissions = ROLE_PERMISSIONS[profile.role];
      return permissions.includes('all') || permissions.includes(permission);
    },
    [profile, isAuthenticated, isActive]
  );

  /**
   * Check if user has any of the given permissions
   */
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!profile || !isAuthenticated || !isActive) return false;

      const rolePermissions = ROLE_PERMISSIONS[profile.role];
      if (rolePermissions.includes('all')) return true;

      return permissions.some((p) => rolePermissions.includes(p));
    },
    [profile, isAuthenticated, isActive]
  );

  /**
   * Check if user has all of the given permissions
   */
  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!profile || !isAuthenticated || !isActive) return false;

      const rolePermissions = ROLE_PERMISSIONS[profile.role];
      if (rolePermissions.includes('all')) return true;

      return permissions.every((p) => rolePermissions.includes(p));
    },
    [profile, isAuthenticated, isActive]
  );

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!profile) return false;

      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(profile.role);
    },
    [profile]
  );

  /**
   * Check if user can access admin features
   */
  const isAdmin = useMemo(() => {
    return hasRole(['super_admin', 'admin']);
  }, [hasRole]);

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = useMemo(() => {
    return hasRole('super_admin');
  }, [hasRole]);

  /**
   * Check if user is telecaller
   */
  const isTelecaller = useMemo(() => {
    return hasRole('telecaller');
  }, [hasRole]);

  /**
   * Check if user is accountant
   */
  const isAccountant = useMemo(() => {
    return hasRole('accountant');
  }, [hasRole]);

  /**
   * Check if user is client
   */
  const isClient = useMemo(() => {
    return hasRole('client');
  }, [hasRole]);

  /**
   * Get all permissions for current user
   */
  const getAllPermissions = useCallback((): string[] => {
    if (!profile) return [];
    return ROLE_PERMISSIONS[profile.role];
  }, [profile]);

  /**
   * Fetch role permissions from database (for admin use)
   */
  const fetchRolePermissions = useCallback(async (roleName: UserRole): Promise<RolePermission[]> => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', roleName);

    if (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }

    return data || [];
  }, []);

  /**
   * Fetch user-specific permissions from database
   */
  const fetchUserPermissions = useCallback(async (userId: string): Promise<UserPermission[]> => {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }

    return data || [];
  }, []);

  /**
   * Grant permission to user (admin only)
   */
  const grantPermission = useCallback(
    async (userId: string, permission: string): Promise<boolean> => {
      if (!isAdmin) {
        console.error('Only admins can grant permissions');
        return false;
      }

      const { error } = await supabase.from('user_permissions').upsert(
        {
          user_id: userId,
          permission,
          granted: true,
          granted_by: user?.id,
        },
        { onConflict: 'user_id,permission' }
      );

      if (error) {
        console.error('Error granting permission:', error);
        return false;
      }

      return true;
    },
    [isAdmin, user]
  );

  /**
   * Revoke permission from user (admin only)
   */
  const revokePermission = useCallback(
    async (userId: string, permission: string): Promise<boolean> => {
      if (!isAdmin) {
        console.error('Only admins can revoke permissions');
        return false;
      }

      const { error } = await supabase.from('user_permissions').upsert(
        {
          user_id: userId,
          permission,
          granted: false,
          granted_by: user?.id,
        },
        { onConflict: 'user_id,permission' }
      );

      if (error) {
        console.error('Error revoking permission:', error);
        return false;
      }

      return true;
    },
    [isAdmin, user]
  );

  /**
   * Update user role (super admin only)
   */
  const updateUserRole = useCallback(
    async (userId: string, newRole: UserRole): Promise<boolean> => {
      if (!isSuperAdmin) {
        console.error('Only super admins can update roles');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }

      return true;
    },
    [isSuperAdmin]
  );

  return {
    role,
    isAuthenticated,
    isActive,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isTelecaller,
    isAccountant,
    isClient,
    getAllPermissions,
    fetchRolePermissions,
    fetchUserPermissions,
    grantPermission,
    revokePermission,
    updateUserRole,
  };
}

/**
 * Hook to check if user can perform a specific action on a resource
 */
export function useCanAccess(resource: string, action: 'create' | 'read' | 'update' | 'delete' | 'manage'): boolean {
  const { hasPermission } = useRBAC();
  const permission = action === 'manage' ? resource : `${resource}:${action}`;
  return hasPermission(permission);
}

/**
 * Higher-order hook to guard components with permissions
 */
export function usePermissionGuard(requiredPermissions: string | string[], requireAll = false) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAuthenticated, isActive } = useRBAC();

  const permissions = useMemo(() =>
    Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions],
    [requiredPermissions]
  );

  const canAccess = useMemo(() => {
    if (!isAuthenticated || !isActive) return false;

    if (requireAll) {
      return hasAllPermissions(permissions);
    }

    return hasAnyPermission(permissions);
  }, [isAuthenticated, isActive, requireAll, permissions, hasAllPermissions, hasAnyPermission]);

  return {
    canAccess,
    missingPermissions: canAccess
      ? []
      : permissions.filter((p) => !hasPermission(p)),
  };
}

/**
 * Hook for role-based navigation visibility
 */
export function useNavVisibility() {
  const { hasPermission } = useRBAC();

  const getVisibleMenuItems = useCallback(
    (items: Array<{ permission?: string; path: string; label: string }>) => {
      return items.filter((item) => {
        if (!item.permission) return true;
        return hasPermission(item.permission);
      });
    },
    [hasPermission]
  );

  return {
    getVisibleMenuItems,
    canShowDashboard: hasPermission('dashboard'),
    canShowCRM: hasPermission('crm'),
    canShowClients: hasPermission('clients'),
    canShowProjects: hasPermission('projects'),
    canShowTeam: hasPermission('team'),
    canShowTasks: hasPermission('tasks'),
    canShowSocial: hasPermission('social'),
    canShowWhatsApp: hasPermission('whatsapp'),
    canShowReviews: hasPermission('reviews'),
    canShowInvoices: hasPermission('invoices'),
    canShowGST: hasPermission('gst'),
    canShowTelecaller: hasPermission('telecaller'),
    canShowReports: hasPermission('reports'),
    canShowAI: hasPermission('ai'),
    canShowPortalClients: hasPermission('portal'),
    canShowSettings: hasPermission('settings'),
    canShowNotifications: hasPermission('notifications'),
  };
}

export default useRBAC;
