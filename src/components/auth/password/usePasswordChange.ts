import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PasswordFormValues, PasswordChangeResponse } from "./types";

interface PasswordChangeData {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  details?: {
    timestamp: string;
    [key: string]: any;
  };
}

const MAX_RETRIES = 3;

export const usePasswordChange = (memberNumber: string, onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const isPasswordChangeData = (data: any): data is PasswordChangeData => {
    return (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      typeof data.success === 'boolean'
    );
  };

  const handlePasswordChange = async (values: PasswordFormValues, retryCount = 0) => {
    if (retryCount >= MAX_RETRIES) {
      toast.error("Maximum retry attempts reached. Please try again later.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Changing password...");

    try {
      const { data: rpcData, error } = await supabase.rpc('handle_password_reset', {
        member_number: memberNumber,
        new_password: values.newPassword,
        current_password: values.currentPassword,
        ip_address: null,
        user_agent: navigator.userAgent,
        client_info: {
          timestamp: new Date().toISOString(),
          browser: navigator.userAgent,
          platform: navigator.platform
        }
      });

      if (error) {
        console.error("[PasswordChange] Error:", error);
        toast.dismiss(toastId);
        
        if (error.code === 'PGRST301' && retryCount < MAX_RETRIES) {
          return handlePasswordChange(values, retryCount + 1);
        } else {
          toast.error(error.message || "Failed to change password");
        }
        return;
      }

      if (!isPasswordChangeData(rpcData) || !rpcData.success) {
        console.error("[PasswordChange] Invalid response:", rpcData);
        toast.dismiss(toastId);
        toast.error(isPasswordChangeData(rpcData) ? rpcData.message || "Failed to change password" : "Invalid response from server");
        return;
      }

      toast.dismiss(toastId);
      toast.success("Password changed successfully");
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error("[PasswordChange] Unexpected error:", error);
      toast.dismiss(toastId);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handlePasswordChange
  };
};