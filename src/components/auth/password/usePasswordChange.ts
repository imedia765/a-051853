import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PasswordFormValues, PasswordChangeResponse, logPasswordChangeAttempt, logPasswordChangeResponse } from "./types";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 2000;

export const usePasswordChange = (
  memberNumber: string, 
  isFirstTimeLogin: boolean,
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

      // Add exponential backoff delay
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
      isFirstTimeLogin,
      timestamp: new Date().toISOString()
    });

    logPasswordChangeAttempt(memberNumber, isFirstTimeLogin, values);

    const toastId = toast.loading("Changing password...");

    try {
      setIsSubmitting(true);
      
      // Call the RPC function
      const { data: responseData, error: rpcError }: PasswordChangeResponse = await supabase.rpc(
        'handle_password_reset',
        {
          member_number: memberNumber,
          new_password: values.newPassword,
          current_password: values.currentPassword || null,
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent,
          client_info: {
            currentPassword: values.currentPassword || null,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: new Date().toISOString(),
            isFirstTimeLogin
          }
        }
      );

      if (rpcError) {
        console.error("[PasswordChange] RPC Error:", rpcError);
        toast.dismiss(toastId);
        
        if (rpcError.message.includes("invalid auth credentials")) {
          toast.error("Current password is incorrect");
        } else {
          toast.error(rpcError.message || "Failed to change password");
        }
        return;
      }

      if (!responseData || typeof responseData.success !== 'boolean') {
        console.error("[PasswordChange] Invalid response format:", responseData);
        toast.dismiss(toastId);
        toast.error("Unexpected server response");
        return;
      }

      if (!responseData.success) {
        toast.dismiss(toastId);
        toast.error(responseData.error || "Failed to change password");
        return;
      }

      // Wait for password update to propagate
      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));

      // Attempt re-authentication with new password
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
        
        // Sign out and redirect even if re-auth fails
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      console.log("[PasswordChange] Process completed successfully");
      toast.dismiss(toastId);
      toast.success("Password changed successfully!");

      // Call onSuccess callback
      onSuccess?.();
      
      // Sign out and redirect
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