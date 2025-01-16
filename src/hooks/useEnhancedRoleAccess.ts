import { useQuery } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/integrations/supabase/client';
import { useRoleStore, mapRolesToPermissions } from '@/store/roleStore';
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type UserRole = Database['public']['Enums']['app_role'];

const fetchUserRolesFromSupabase = async () => {
  console.log('Starting role fetch from Supabase...');
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    console.log('No authenticated user found during role fetch');
    return ['member' as UserRole];
  }

  console.log('Fetching roles for user:', session.user.id);
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .throwOnError();

    if (error) {
      console.error('Error fetching user roles:', error);
      throw handleSupabaseError(error);
    }

    if (!data || data.length === 0) {
      console.log('No roles found, defaulting to member role');
      return ['member' as UserRole];
    }

    console.log('Roles fetched successfully:', data);
    return data.map(item => item.role as UserRole) || ['member' as UserRole];
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    // Default to member role on error to prevent infinite loading
    return ['member' as UserRole];
  }
};

export const useEnhancedRoleAccess = () => {
  const { toast } = useToast();
  const setUserRoles = useRoleStore((state) => state.setUserRoles);
  const setUserRole = useRoleStore((state) => state.setUserRole);
  const setIsLoading = useRoleStore((state) => state.setIsLoading);
  const setError = useRoleStore((state) => state.setError);
  const setPermissions = useRoleStore((state) => state.setPermissions);

  return useQuery({
    queryKey: ['userRoles'],
    queryFn: fetchUserRolesFromSupabase,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    meta: {
      onSuccess: (data: UserRole[]) => {
        console.log('Role query succeeded, updating store:', data);
        setUserRoles(data);
        const primaryRole = data.includes('admin' as UserRole) 
          ? 'admin' as UserRole
          : data.includes('collector' as UserRole)
            ? 'collector' as UserRole
            : 'member' as UserRole;
        
        setUserRole(primaryRole);
        const permissions = mapRolesToPermissions(data);
        setPermissions(permissions);
        setIsLoading(false);
        setError(null);
      },
      onError: (error: Error) => {
        console.error('Role query failed:', error);
        // Set default member role on error
        const defaultRole: UserRole[] = ['member' as UserRole];
        setUserRoles(defaultRole);
        setUserRole('member' as UserRole);
        setPermissions(mapRolesToPermissions(defaultRole));
        setIsLoading(false);
        setError(error);
        toast({
          title: "Warning",
          description: "Using default member access. Some features may be limited.",
          variant: "destructive",
        });
      },
      onSettled: () => {
        setIsLoading(false);
      }
    }
  });
};