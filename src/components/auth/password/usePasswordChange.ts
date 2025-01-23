import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordFormValues, PasswordChangeResponse, PasswordChangeResult, logPasswordChangeAttempt, logPasswordChangeResponse } from "./types";
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

export const usePasswordChange = (
  memberNumber: string, 
  isFirstTimeLogin: boolean,
  onSuccess?: () => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const attemptReauthentication = async (email: string, password: string, retryCount = 0): Promise<boolean> => {
    try {
      console.log("[PasswordChange] Attempting re-authentication", { email, retryCount });
      
      // Add a delay before each attempt
      if (retryCount > 0) {
        const delay = INITIAL_DELAY * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log("[PasswordChange] Re-authentication attempt failed:", { retryCount, error });
        
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
    logPasswordChangeAttempt(memberNumber, isFirstTimeLogin, values);

    // Validate inputs
    if (!isFirstTimeLogin && !values.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    if (!values.newPassword || !values.confirmPassword) {
      toast.error("New password and confirmation are required");
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    const toastId = toast.loading("Changing password...");

    try {
      setIsSubmitting(true);
      
      console.log("[PasswordChange] Preparing RPC call", {
        memberNumber,
        isFirstTimeLogin,
        hasCurrentPassword: !!values.currentPassword
      });

      // Call the RPC function
      const { data, error } = await supabase.rpc('handle_password_reset', {
        member_number: memberNumber,
        new_password: values.newPassword,
        user_agent: navigator.userAgent,
        client_info: JSON.stringify({
          currentPassword: values.currentPassword || null,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timestamp: new Date().toISOString(),
          isFirstTimeLogin
        })
      });

      console.log("[PasswordChange] RPC response received", {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message
      });

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

      // Type guard for RPC response
      if (!data || !isPasswordChangeResult(data)) {
        console.error("[PasswordChange] Invalid RPC response:", data);
        toast.dismiss(toastId);
        toast.error("Unexpected server response");
        return;
      }

      const result = data;
      logPasswordChangeResponse({ data: result, error: null }, isFirstTimeLogin);

      if (!result.success) {
        toast.dismiss(toastId);
        toast.error(result.error || "Failed to change password");
        return;
      }

      // Add a delay before re-authentication
      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));

      // Attempt re-authentication with new password
      const email = `${memberNumber.toLowerCase()}@temp.com`;
      console.log("[PasswordChange] Starting re-authentication process");
      const reauthSuccess = await attemptReauthentication(email, values.newPassword);

      if (!reauthSuccess) {
        console.warn("[PasswordChange] Re-authentication failed after password change");
      } else {
        console.log("[PasswordChange] Re-authentication successful");
      }

      // Dismiss loading toast and show success
      toast.dismiss(toastId);
      toast.success("Password changed successfully!");

      // Call onSuccess callback
      onSuccess?.();
      
      // Sign out and redirect to login
      console.log("[PasswordChange] Signing out and redirecting");
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