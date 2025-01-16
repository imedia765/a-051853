import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Wallet,
  LogOut
} from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

interface SidePanelProps {
  onTabChange: (tab: string) => void;
  userRole?: string;
}

const SidePanel = ({ onTabChange }: SidePanelProps) => {
  const { handleSignOut } = useAuthSession();
  const { userRole, hasRole } = useRoleAccess();
  const { toast } = useToast();
  
  console.log('SidePanel rendered with role:', userRole);

  const handleLogoutClick = () => {
    handleSignOut(false);
  };

  const handleTabChange = (tab: string) => {
    console.log('Tab change requested:', tab, 'Current role:', userRole);
    
    if (!userRole) {
      console.log('No user role available');
      return;
    }

    const hasAccess = shouldShowTab(tab);
    console.log('Access check:', { tab, userRole, hasAccess });

    if (hasAccess) {
      onTabChange(tab);
    } else {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this section.",
        variant: "destructive",
      });
    }
  };

  const shouldShowTab = (tab: string): boolean => {
    if (!userRole) return false;

    switch (tab) {
      case 'dashboard':
        return true; // All roles can access dashboard
      case 'users':
        return hasRole('admin') || hasRole('collector');
      case 'financials':
      case 'system':
        return hasRole('admin');
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-full bg-dashboard-card border-r border-dashboard-cardBorder">
      <div className="p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-white">
          Dashboard
        </h2>
        <p className="text-sm text-dashboard-muted">
          Manage your account
        </p>
      </div>
      
      <ScrollArea className="flex-1 px-4 lg:px-6">
        <div className="space-y-1.5">
          {/* Dashboard - Always visible */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm"
            onClick={() => handleTabChange('dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Button>

          {/* Members - Only for admins and collectors */}
          {shouldShowTab('users') && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleTabChange('users')}
            >
              <Users className="h-4 w-4" />
              Members
            </Button>
          )}

          {/* Financials - Only for admins */}
          {shouldShowTab('financials') && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleTabChange('financials')}
            >
              <Wallet className="h-4 w-4" />
              Collectors & Financials
            </Button>
          )}

          {/* System - Only for admins */}
          {shouldShowTab('system') && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleTabChange('system')}
            >
              <Settings className="h-4 w-4" />
              System
            </Button>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 lg:p-6 border-t border-dashboard-cardBorder">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm text-dashboard-muted hover:text-white"
          onClick={handleLogoutClick}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default SidePanel;