import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordFormValues, PasswordChangeResponse, PasswordChangeResult } from "./types";
import { useNavigate } from "react-router-dom";

export const usePasswordChange = (memberNumber: string, isFirstTimeLogin: boolean) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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

      const { data, error } = await supabase.rpc('handle_password_reset', {
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

      if (error) {
        console.error("[PasswordChange] Error:", error);
        toast.dismiss(loadingToast);
        toast.error(error.message || "Failed to change password");
        return;
      }

      if (!data) {
        console.error("[PasswordChange] Invalid response data:", data);
        toast.dismiss(loadingToast);
        toast.error("Unexpected server response");
        return;
      }

      const result = data as PasswordChangeResult;

      if (!result.success) {
        toast.dismiss(loadingToast);
        toast.error(result.error || "Failed to change password");
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Password changed successfully!");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
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