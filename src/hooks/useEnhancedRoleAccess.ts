import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useRoleStore, mapRolesToPermissions } from '@/store/roleStore';
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type UserRole = Database['public']['Enums']['app_role'];

const fetchUserRolesFromSupabase = async () => {
  console.log('Starting role fetch from Supabase...');
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    console.log('No authenticated user found during role fetch');
    return [];
  }

  console.log('Fetching roles for user:', session.user.id);
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }

  console.log('Roles fetched successfully:', data);
  return data?.map(item => item.role as UserRole) || [];
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
    retry: 1,
    meta: {
      onSuccess: (data: UserRole[]) => {
        console.log('Role query succeeded, updating store:', data);
        setUserRoles(data);
        const primaryRole = data.includes('admin') 
          ? 'admin' 
          : data.includes('collector')
            ? 'collector'
            : data.includes('member')
              ? 'member'
              : null;
        
        setUserRole(primaryRole);
        const permissions = mapRolesToPermissions(data);
        setPermissions(permissions);
        setIsLoading(false);
        setError(null);
      },
      onError: (error: Error) => {
        console.error('Role query failed:', error);
        setError(error);
        setIsLoading(false);
        toast({
          title: "Error fetching roles",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });
};