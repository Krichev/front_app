// src/features/auth/model/Types.ts

export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface SignupData {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
    message?: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    token: string;
    password: string;
    confirmPassword: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface AuthError {
    message: string;
    code?: string;
    field?: string;
}

// API Response interfaces
export interface LoginResponse extends AuthResponse {}
export interface SignupResponse extends AuthResponse {}
export interface RefreshTokenResponse extends AuthResponse {}

export interface TokenVerificationResponse {
    valid: boolean;
    user?: User;
    expiresAt?: string;
}

export interface LogoutResponse {
    message: string;
    success: boolean;
}