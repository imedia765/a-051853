import { PostgrestError } from '@supabase/supabase-js';

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// The shape of the data returned by the RPC function
export interface PasswordChangeData {
  success: boolean;
  error?: string;
  message?: string;
  code?: string;
  locked_until?: string;
  details?: {
    isFirstTimeLogin: boolean;
    timestamp: string;
    [key: string]: any;
  };
}

// The full response from Supabase RPC call
export interface PasswordChangeResponse {
  data: PasswordChangeData | null;
  error: PostgrestError | null;
}

// The result after processing the RPC response
export interface PasswordChangeResult {
  success: boolean;
  error?: string;
  message?: string;
  code?: string;
  locked_until?: string;
  details?: {
    isFirstTimeLogin: boolean;
    timestamp: string;
    [key: string]: any;
  };
}

// Debug Helpers
export const logPasswordChangeAttempt = (
  memberNumber: string, 
  isFirstTimeLogin: boolean,
  values: Partial<PasswordFormValues>
) => {
  console.log("[PasswordChange] Attempt Details:", {
    memberNumber,
    isFirstTimeLogin,
    hasCurrentPassword: !!values.currentPassword,
    hasNewPassword: !!values.newPassword,
    hasConfirmPassword: !!values.confirmPassword,
    passwordsMatch: values.newPassword === values.confirmPassword,
    timestamp: new Date().toISOString()
  });
};

export const logPasswordChangeResponse = (
  response: PasswordChangeResponse,
  isFirstTimeLogin: boolean
) => {
  console.log("[PasswordChange] Response:", {
    success: response.data?.success,
    hasError: !!response.error,
    errorMessage: response.error?.message,
    details: response.data?.details,
    isFirstTimeLogin,
    timestamp: new Date().toISOString()
  });
};