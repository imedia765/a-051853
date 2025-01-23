import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  PasswordFormValues, 
  PasswordChangeResponse, 
  PasswordChangeData,
  logPasswordChangeAttempt, 
  logPasswordChangeResponse 
} from "./types";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 2000;

export const usePasswordChange = (
  memberNumber: string,
  onSuccess?: () => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const attemptReauthentication = async (
    email: string, 
    password: string, 
    retryCount = 0
  ): Promise<boolean> => {
    try {
      console.log("[PasswordChange] Starting re-authentication attempt", { 
        email, 
        retryCount,
        timestamp: new Date().toISOString()
      });

      if (retryCount > 0) {
        const delay = INITIAL_DELAY * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (error) {
        console.error("[PasswordChange] Re-authentication failed:", { 
          retryCount, 
          error,
          timestamp: new Date().toISOString()
        });
        
        if (retryCount < MAX_RETRIES) {
          return attemptReauthentication(email, password, retryCount + 1);
        }
        return false;
      }

      console.log("[PasswordChange] Re-authentication successful");
      return !!data.user;
    } catch (error) {
      console.error("[PasswordChange] Re-authentication error:", error);
      return false;
    }
  };

  const handlePasswordChange = async (values: PasswordFormValues) => {
    console.log("[PasswordChange] Starting password change process", {
      memberNumber,
      timestamp: new Date().toISOString()
    });

    logPasswordChangeAttempt(memberNumber, values);

    const toastId = toast.loading("Changing password...");

    try {
      setIsSubmitting(true);
      
      const { data: rpcData, error } = await supabase.rpc(
        'handle_password_reset',
        {
          member_number: memberNumber,
          new_password: values.newPassword,
          current_password: values.currentPassword,
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent,
          client_info: {
            currentPassword: values.currentPassword,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: new Date().toISOString()
          }
        }
      );

      // Validate and type the response data
      const isValidResponse = (data: unknown): data is PasswordChangeData => {
        return (
          typeof data === 'object' && 
          data !== null && 
          'success' in data && 
          typeof (data as any).success === 'boolean'
        );
      };

      if (!isValidResponse(rpcData)) {
        console.error("[PasswordChange] Invalid response format:", rpcData);
        toast.dismiss(toastId);
        toast.error("Unexpected server response");
        return;
      }

      const response: PasswordChangeResponse = { 
        data: rpcData,
        error 
      };
      logPasswordChangeResponse(response);

      if (error) {
        console.error("[PasswordChange] RPC Error:", error);
        toast.dismiss(toastId);
        
        if (error.message.includes("invalid auth credentials")) {
          toast.error("Current password is incorrect");
        } else {
          toast.error(error.message || "Failed to change password");
        }
        return;
      }

      if (!response.data.success) {
        toast.dismiss(toastId);
        toast.error(response.data.error || "Failed to change password");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));

      const email = `${memberNumber.toLowerCase()}@temp.com`;
      console.log("[PasswordChange] Attempting re-authentication", { 
        email,
        timestamp: new Date().toISOString()
      });

      const reauthSuccess = await attemptReauthentication(email, values.newPassword);

      if (!reauthSuccess) {
        console.warn("[PasswordChange] Re-authentication failed, but password was changed");
        toast.dismiss(toastId);
        toast.success("Password changed successfully! Please log in again.");
        
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      console.log("[PasswordChange] Process completed successfully");
      toast.dismiss(toastId);
      toast.success("Password changed successfully!");

      onSuccess?.();
      
      await supabase.auth.signOut();
      navigate('/login');

    } catch (error: any) {
      console.error("[PasswordChange] Unexpected error:", error);
      toast.dismiss(toastId);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handlePasswordChange
  };
};