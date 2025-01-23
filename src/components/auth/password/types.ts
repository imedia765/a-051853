import { PostgrestError } from '@supabase/supabase-js';

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeData {
  success: boolean;
  error?: string;
  message?: string;
  code?: string;
}

export interface PasswordChangeResponse {
  data: PasswordChangeData | null;
  error: PostgrestError | null;
}

export type PasswordChangeResult = {
  success: boolean;
  error?: string;
  message?: string;
  code?: string;
  locked_until?: string;
}