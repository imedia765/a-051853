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
}