export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeData {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export interface PasswordChangeResponse {
  data: PasswordChangeData | null;
  error: Error | null;
}