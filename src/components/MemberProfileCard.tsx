import { Card, CardContent } from "@/components/ui/card";
import { Member } from "@/types/member";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProfileHeader from "./profile/ProfileHeader";
import ProfileAvatar from "./profile/ProfileAvatar";
import ContactInfo from "./profile/ContactInfo";
import AddressDetails from "./profile/AddressDetails";
import MembershipDetails from "./profile/MembershipDetails";

interface MemberProfileCardProps {
  memberProfile: Member | null;
}

const MemberProfileCard = ({ memberProfile }: MemberProfileCardProps) => {
  const { toast } = useToast();

  // Fetch the user's role from members_roles table using our RPC function
  const { data: userRole, isError: roleError } = useQuery({
    queryKey: ['userRole', memberProfile?.auth_user_id],
    queryFn: async () => {
      if (!memberProfile?.auth_user_id) return null;
      
      console.log('Fetching role for user:', memberProfile.auth_user_id);
      
      const { data, error } = await supabase.rpc(
        'get_user_role',
        { user_auth_id: memberProfile.auth_user_id }
      );

      if (error) {
        console.error('Error fetching user role:', error);
        toast({
          title: "Error fetching role",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      console.log('Fetched role:', data);
      return data;
    },
    enabled: !!memberProfile?.auth_user_id,
    retry: 1,
  });

  if (!memberProfile) {
    return (
      <Card className="bg-dashboard-card border-white/10 shadow-lg">
        <ProfileHeader />
        <CardContent>
          <p className="text-dashboard-text">
            Your profile has not been set up yet. Please contact an administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dashboard-card border-white/10 shadow-lg hover:border-dashboard-accent1/50 transition-all duration-300">
      <ProfileHeader />
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <ProfileAvatar memberProfile={memberProfile} />
          
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ContactInfo memberProfile={memberProfile} />
                <AddressDetails memberProfile={memberProfile} />
              </div>

              <div className="space-y-4">
                <MembershipDetails 
                  memberProfile={memberProfile}
                  userRole={userRole}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberProfileCard;