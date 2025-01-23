import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordFormValues, PasswordChangeResponse, PasswordChangeResult } from "./types";
import { useNavigate } from "react-router-dom";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1500;

const isPasswordChangeResult = (data: unknown): data is PasswordChangeResult => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as PasswordChangeResult).success === 'boolean'
  );
};

export const usePasswordChange = (memberNumber: string, isFirstTimeLogin: boolean) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const attemptReauthentication = async (email: string, password: string, retryCount = 0): Promise<boolean> => {
    try {
      console.log("[PasswordChange] Attempting re-authentication", { email, retryCount });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log("[PasswordChange] Re-authentication attempt failed:", { retryCount, error });
        
        if (retryCount < MAX_RETRIES) {
          // Wait longer between each retry
          const delay = INITIAL_DELAY * Math.pow(2, retryCount);
          console.log(`[PasswordChange] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
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

    // Skip current password validation for first-time login
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

      console.log("[PasswordChange] Calling RPC function");
      const response = await supabase.rpc('handle_password_reset', {
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
      });

      // Handle RPC errors
      if (response.error) {
        console.error("[PasswordChange] RPC Error:", response.error);
        toast.dismiss(loadingToast);
        toast.error(response.error.message || "Failed to change password");
        return;
      }

      // Validate RPC response
      if (!response.data || !isPasswordChangeResult(response.data)) {
        console.error("[PasswordChange] Invalid RPC response:", response.data);
        toast.dismiss(loadingToast);
        toast.error("Unexpected server response");
        return;
      }

      const result = response.data;

      if (!result.success) {
        toast.dismiss(loadingToast);
        if (result.error?.includes("current password")) {
          toast.error("Current password is incorrect");
        } else {
          toast.error(result.error || "Failed to change password");
        }
        return;
      }

      console.log("[PasswordChange] Password changed successfully, attempting re-authentication");

      // Initial delay before first re-authentication attempt
      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));

      // Attempt re-authentication with new password
      const email = `${memberNumber.toLowerCase()}@temp.com`;
      const reauthSuccess = await attemptReauthentication(email, values.newPassword);

      if (!reauthSuccess) {
        console.warn("[PasswordChange] Re-authentication failed after password change");
        // Even if re-auth fails, we'll still consider the password change successful
        // since the RPC call succeeded
      }

      toast.dismiss(loadingToast);
      toast.success("Password changed successfully!");
      
      // Always redirect to login to ensure a fresh session
      setTimeout(() => {
        // Sign out current session before redirecting
        console.log("[PasswordChange] Signing out and redirecting to login");
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