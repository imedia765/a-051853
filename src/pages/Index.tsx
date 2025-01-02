import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import DashboardView from '@/components/DashboardView';
import MembersList from '@/components/MembersList';
import CollectorsList from '@/components/CollectorsList';
import SidePanel from '@/components/SidePanel';
import TotalCount from '@/components/TotalCount';
import MemberSearch from '@/components/MemberSearch';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user role
  const { data: roleData, isError: roleError } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      console.log('Fetching user role...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user logged in');
      
      console.log('User ID:', session.user.id);

      // First check if user is admin using the RPC function
      const { data: isAdmin, error: adminError } = await supabase.rpc('current_user_is_admin');
      console.log('Is admin check result:', isAdmin, 'Error:', adminError);
      if (adminError) {
        console.error('Admin check error:', adminError);
        toast({
          title: "Error checking admin status",
          description: adminError.message,
          variant: "destructive",
        });
      }
      if (isAdmin) return 'admin';

      // Then check if user is collector
      const { data: isCollector, error: collectorError } = await supabase.rpc('current_user_is_collector');
      console.log('Is collector check result:', isCollector, 'Error:', collectorError);
      if (collectorError) {
        console.error('Collector check error:', collectorError);
        toast({
          title: "Error checking collector status",
          description: collectorError.message,
          variant: "destructive",
        });
      }
      if (isCollector) return 'collector';

      // Get member profile to verify role
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('role, member_number, auth_user_id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      console.log('Member data:', memberData, 'Error:', memberError);
      if (memberError) {
        console.error('Member fetch error:', memberError);
        toast({
          title: "Error fetching member data",
          description: memberError.message,
          variant: "destructive",
        });
      }

      // Additional check for profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      console.log('Profile data:', profileData, 'Error:', profileError);
      
      // If no member data found, default to member role
      if (!memberData) {
        console.log('No member data found, defaulting to member role');
        return 'member';
      }

      return memberData.role || 'member';
    },
  });

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const { data: membersData } = useQuery({
    queryKey: ['members_count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      
      return { totalCount: count || 0 };
    },
  });

  const canAccessTab = (tab: string) => {
    console.log('Checking access for tab:', tab, 'User role:', userRole);
    switch (userRole) {
      case 'admin':
        return true;
      case 'collector':
        return ['dashboard', 'users'].includes(tab);
      case 'member':
      default:
        return tab === 'dashboard';
    }
  };

  useEffect(() => {
    checkAuth();
    if (roleData) {
      console.log('Setting user role:', roleData);
      setUserRole(roleData);
      // Reset to dashboard if current tab isn't accessible
      if (roleData === 'member' && activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        toast({
          title: "Access Restricted",
          description: "You only have access to the dashboard.",
        });
      }
    }
  }, [roleData]);

  const renderContent = () => {
    if (!canAccessTab(activeTab)) {
      setActiveTab('dashboard');
      return <DashboardView onLogout={handleLogout} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onLogout={handleLogout} />;
      case 'users':
        return (
          <>
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-medium mb-2 text-white">Members</h1>
                <p className="text-dashboard-muted">View and manage member information</p>
              </div>
            </header>
            <TotalCount 
              items={[{
                count: membersData?.totalCount || 0,
                label: "Total Members",
                icon: <Users className="w-6 h-6 text-dashboard-accent1" />
              }]}
            />
            <MemberSearch 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <MembersList searchTerm={searchTerm} userRole={userRole} />
          </>
        );
      case 'collectors':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2 text-white">Collectors</h1>
              <p className="text-dashboard-muted">View and manage collector information</p>
            </header>
            <CollectorsList />
          </>
        );
      case 'settings':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2 text-white">Settings</h1>
              <p className="text-dashboard-muted">Configure your application settings</p>
            </header>
            <div className="bg-dashboard-card p-6 rounded-lg border border-white/10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Dark Mode</p>
                    <p className="text-sm text-dashboard-muted">Toggle dark mode</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SidePanel onTabChange={setActiveTab} userRole={userRole} />
      <div className="pl-64">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;
