import { Member } from "@/types/member";
import RoleBadge from "./RoleBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle2 } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface MembershipDetailsProps {
  memberProfile: Member;
  userRole: string | null;
}

type AppRole = 'admin' | 'collector' | 'member';

const MembershipDetails = ({ memberProfile, userRole }: MembershipDetailsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // First check if user is a collector
  const { data: collectorStatus } = useQuery({
    queryKey: ['collectorStatus', memberProfile.id],
    queryFn: async () => {
      console.log('Checking collector status for member:', memberProfile.id);
      const { data, error } = await supabase
        .from('members_collectors')
        .select('name')
        .eq('member_profile_id', memberProfile.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking collector status:', error);
        return null;
      }

      console.log('Collector status result:', data);
      return data ? 'collector' : null;
    },
    enabled: !!memberProfile.id
  });

  // Then check user_roles table, prioritizing admin role
  const { data: roleFromTable } = useQuery({
    queryKey: ['userRole', memberProfile.auth_user_id],
    queryFn: async () => {
      if (!memberProfile.auth_user_id) return null;
      
      console.log('Checking user_roles for:', memberProfile.auth_user_id);
      
      // First check for admin role
      const { data: adminRole, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', memberProfile.auth_user_id)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminError) {
        console.error('Error checking admin role:', adminError);
        return null;
      }

      if (adminRole) {
        console.log('User is an admin');
        return 'admin';
      }

      // If not admin, check for collector role
      const { data: collectorRole, error: collectorError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', memberProfile.auth_user_id)
        .eq('role', 'collector')
        .maybeSingle();

      if (collectorError) {
        console.error('Error checking collector role:', collectorError);
        return null;
      }

      if (collectorRole) {
        console.log('User is a collector');
        return 'collector';
      }

      // Finally check for member role
      const { data: memberRole, error: memberError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', memberProfile.auth_user_id)
        .eq('role', 'member')
        .maybeSingle();

      if (memberError) {
        console.error('Error checking member role:', memberError);
        return null;
      }

      if (memberRole) {
        console.log('User is a member');
        return 'member';
      }

      return null;
    },
    enabled: !!memberProfile.auth_user_id,
    retry: false
  });

  // Determine final role
  const displayRole = roleFromTable || collectorStatus || 'member';
  console.log('Final determined role:', displayRole);
  
  const isAdmin = displayRole === 'admin';

  const handleRoleChange = async (newRole: AppRole) => {
    if (!memberProfile.auth_user_id) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', memberProfile.auth_user_id);

      if (deleteError) throw deleteError;

      // Then insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: memberProfile.auth_user_id,
          role: newRole
        });

      if (insertError) throw insertError;

      // Invalidate all relevant queries
      await queryClient.invalidateQueries({ queryKey: ['userRole'] });
      await queryClient.invalidateQueries({ queryKey: ['collectorStatus'] });

      toast({
        title: "Success",
        description: `Role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-dashboard-muted text-sm">Membership Details</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-dashboard-text flex items-center gap-2">
            Status:{' '}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              memberProfile?.status === 'active' 
                ? 'bg-dashboard-accent3/20 text-dashboard-accent3' 
                : 'bg-dashboard-muted/20 text-dashboard-muted'
            }`}>
              {memberProfile?.status || 'Pending'}
              {memberProfile?.status === 'active' && (
                <CheckCircle2 className="w-4 h-4 ml-1 text-dashboard-accent3" />
              )}
            </span>
          </div>
          {isAdmin && (
            <span className="bg-dashboard-accent1/20 text-dashboard-accent1 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          )}
        </div>
        <div className="text-dashboard-text flex items-center gap-2">
          <span className="text-dashboard-accent2">Type:</span>
          <span className="flex items-center gap-2">
            {memberProfile?.membership_type || 'Standard'}
            {displayRole === 'admin' ? (
              <div className="ml-2">
                <Select onValueChange={handleRoleChange}>
                  <SelectTrigger className="w-[140px] h-8 bg-dashboard-accent1/10 border-dashboard-accent1/20">
                    <SelectValue placeholder="Change Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="collector">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Collector
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Member
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <RoleBadge role={displayRole} />
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MembershipDetails;