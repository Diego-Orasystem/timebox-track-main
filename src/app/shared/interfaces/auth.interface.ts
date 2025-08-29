// =====================================================
// INTERFACES DE AUTENTICACIÓN
// Timebox Track - Sistema de Autenticación
// =====================================================

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  roles?: UserRole[];
  role_ids?: string[];
}

export interface LoginRequest {
  identifier: string; // username o email
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    isValid: boolean;
  };
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface UserRole {
  id: string;
  name: string;
  project_id?: string;
  timebox_id?: string;
  assigned_at?: string;
  expires_at?: string;
  is_active?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: 'PLATFORM' | 'PROJECT' | 'TEAM' | 'SUPPORT';
  is_active: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  is_active: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
  };
}
