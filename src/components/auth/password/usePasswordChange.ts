import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordFormValues, PasswordChangeResponse, PasswordChangeResult } from "./types";
import { useNavigate } from "react-router-dom";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1500;

export const usePasswordChange = (memberNumber: string, isFirstTimeLogin: boolean) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const attemptReauthentication = async (email: string, password: string, retryCount = 0): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log("[PasswordChange] Re-authentication attempt failed:", { retryCount, error });
        
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY * (retryCount + 1)));
          return attemptReauthentication(email, password, retryCount + 1);
        }
        
        return false;
      }

      return !!data.user;
    } catch (error) {
      console.error("[PasswordChange] Re-authentication error:", error);
      return false;
    }
  };

  const handlePasswordChange = async (values: PasswordFormValues) => {
    console.log("[PasswordChange] Starting password change process", {
      memberNumber,
      isFirstTimeLogin,
      timestamp: new Date().toISOString()
    });

    if (!isFirstTimeLogin && !values.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (!values.newPassword || !values.confirmPassword) {
      toast.error("New password and confirmation are required");
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading("Changing password...");

      const { data: rpcData, error: rpcError } = await supabase.rpc('handle_password_reset', {
        member_number: memberNumber,
        new_password: values.newPassword,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent,
        client_info: JSON.stringify({
          platform: navigator.platform,
          language: navigator.language,
          timestamp: new Date().toISOString(),
          isFirstTimeLogin,
          currentPassword: isFirstTimeLogin ? undefined : values.currentPassword
        })
      }) as PasswordChangeResponse;

      if (rpcError) {
        console.error("[PasswordChange] RPC Error:", rpcError);
        toast.dismiss(loadingToast);
        toast.error(rpcError.message || "Failed to change password");
        return;
      }

      if (!rpcData || typeof rpcData !== 'object') {
        console.error("[PasswordChange] Invalid RPC response:", rpcData);
        toast.dismiss(loadingToast);
        toast.error("Unexpected server response");
        return;
      }

      const result = rpcData as PasswordChangeResult;

      if (!result.success) {
        toast.dismiss(loadingToast);
        toast.error(result.error || "Failed to change password");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));

      const email = `${memberNumber.toLowerCase()}@temp.com`;
      const reauthSuccess = await attemptReauthentication(email, values.newPassword);

      if (!reauthSuccess) {
        console.warn("[PasswordChange] Re-authentication failed after password change");
      }

      toast.dismiss(loadingToast);
      toast.success("Password changed successfully!");
      
      setTimeout(() => {
        supabase.auth.signOut().finally(() => {
          navigate('/login');
        });
      }, 2000);

    } catch (error: any) {
      console.error("[PasswordChange] Unexpected error:", error);
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