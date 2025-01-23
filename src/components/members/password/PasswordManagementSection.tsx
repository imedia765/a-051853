import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, LockKeyhole, Key, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PasswordManagementSectionProps {
  memberId: string;
  memberNumber: string;
  passwordSetAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  passwordResetRequired: boolean;
}

const PasswordManagementSection = ({
  memberId,
  memberNumber,
  passwordSetAt,
  failedLoginAttempts,
  lockedUntil,
  passwordResetRequired,
}: PasswordManagementSectionProps) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handlePasswordReset = async () => {
    try {
      setIsResetting(true);
      
      // Generate a temporary password (member number + random string)
      const tempPassword = `${memberNumber}${Math.random().toString(36).slice(-4)}`;
      
      const { data, error } = await supabase.rpc('handle_password_reset', {
        member_number: memberNumber,
        new_password: tempPassword,
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent,
        client_info: JSON.stringify({
          platform: navigator.platform,
          language: navigator.language
        })
      });

      if (error) throw error;

      toast.success("Password has been reset", {
        description: `Temporary password: ${tempPassword}`
      });

      setShowResetConfirm(false);
    } catch (error: any) {
      toast.error("Failed to reset password", {
        description: error.message
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleUnlockAccount = async () => {
    try {
      const { error } = await supabase.rpc('reset_failed_login', {
        member_number: memberNumber
      });

      if (error) throw error;

      toast.success("Account has been unlocked");
    } catch (error: any) {
      toast.error("Failed to unlock account", {
        description: error.message
      });
    }
  };

  return (
    <div className="space-y-4 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-dashboard-accent1">Password Status</h4>
          <div className="flex items-center gap-2">
            {passwordSetAt ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                <LockKeyhole className="w-3 h-3 mr-1" />
                Password Set
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                <Key className="w-3 h-3 mr-1" />
                No Password
              </Badge>
            )}
            
            {lockedUntil && new Date(lockedUntil) > new Date() && (
              <Badge variant="outline" className="bg-red-500/10 text-red-500">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            )}
            
            {passwordResetRequired && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset Required
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lockedUntil && new Date(lockedUntil) > new Date() && (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleUnlockAccount}
              className="bg-dashboard-card hover:bg-dashboard-cardHover"
            >
              <Lock className="w-4 h-4 mr-2" />
              Unlock
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            className="bg-dashboard-card hover:bg-dashboard-cardHover"
          >
            <Key className="w-4 h-4 mr-2" />
            Reset Password
          </Button>
        </div>
      </div>

      {failedLoginAttempts > 0 && (
        <p className="text-sm text-dashboard-muted">
          Failed login attempts: {failedLoginAttempts}
        </p>
      )}

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the member's password and generate a temporary password. The member will be required to change their password on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePasswordReset}
              disabled={isResetting}
              className="bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
            >
              {isResetting ? "Resetting..." : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PasswordManagementSection;