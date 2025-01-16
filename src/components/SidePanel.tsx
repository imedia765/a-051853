import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Wallet,
  LogOut,
  Loader2
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
  const { userRole, userRoles, roleLoading, hasRole } = useRoleAccess();
  const { toast } = useToast();
  
  console.log('SidePanel rendered with:', {
    userRole,
    userRoles,
    roleLoading,
    timestamp: new Date().toISOString()
  });

  const handleLogoutClick = () => {
    handleSignOut(false);
  };

  const handleTabChange = (tab: string) => {
    console.log('Tab change requested:', {
      tab,
      userRole,
      userRoles,
      roleLoading,
      timestamp: new Date().toISOString()
    });
    
    if (roleLoading) {
      console.log('Roles still loading, deferring access check');
      return;
    }

    if (!userRole && !userRoles) {
      console.log('No user roles available');
      toast({
        title: "Access Error",
        description: "Your roles are not properly loaded. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    const hasAccess = shouldShowTab(tab);
    console.log('Access check:', { tab, userRole, userRoles, hasAccess });

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
    if (!userRole && !userRoles) return false;

    switch (tab) {
      case 'dashboard':
        return true; // All roles can access dashboard
      case 'users':
        return hasRole('admin') || hasRole('collector');
      case 'financials':
        return hasRole('admin') || hasRole('collector');
      case 'system':
        return hasRole('admin');
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-full bg-dashboard-card border-r border-dashboard-cardBorder">
      <div className="p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          Dashboard
          {roleLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
            disabled={roleLoading}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Button>

          {/* Members - For admins and collectors */}
          {shouldShowTab('users') && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleTabChange('users')}
              disabled={roleLoading}
            >
              <Users className="h-4 w-4" />
              Members
            </Button>
          )}

          {/* Financials - For admins and collectors */}
          {shouldShowTab('financials') && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleTabChange('financials')}
              disabled={roleLoading}
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
              disabled={roleLoading}
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
          disabled={roleLoading}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default SidePanel;