import { Database } from "@/integrations/supabase/types";
import { useRoleStore } from '@/store/roleStore';

export type UserRole = Database['public']['Enums']['app_role'];

interface RoleState {
  userRole: UserRole | null;
  userRoles: UserRole[] | null;
  isLoading: boolean;
  error: Error | null;
  permissions: {
    canManageUsers: boolean;
    canCollectPayments: boolean;
    canAccessSystem: boolean;
    canViewAudit: boolean;
    canManageCollectors: boolean;
  };
}

export const useRoleAccess = () => {
  const {
    userRole,
    userRoles,
    isLoading: roleLoading,
    error,
    permissions
  } = useRoleStore() as RoleState;

  const hasRole = (role: UserRole): boolean => {
    console.log('Checking role:', { role, userRole, userRoles });
    if (!userRoles) return false;
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const canAccessTab = (tab: string): boolean => {
    if (!userRoles) return false;

    switch (tab) {
      case 'dashboard':
        return true;
      case 'users':
        return hasRole('admin') || hasRole('collector');
      case 'financials':
      case 'system':
        return hasRole('admin');
      default:
        return false;
    }
  };

  const hasPermission = (permission: keyof RoleState['permissions']): boolean => {
    return permissions[permission] || false;
  };

  return {
    userRole,
    userRoles,
    roleLoading,
    error,
    permissions,
    canAccessTab,
    hasRole,
    hasAnyRole,
    hasPermission
  };
};