// src/features/auth/model/types.ts
import {User} from '../../../entities/user/model/types';

// Auth state interface
export interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// Login credentials
export interface LoginCredentials {
    username: string;
    password: string;
}

// Signup data
export interface SignupData {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

// Auth response from API
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

// Refresh token request
export interface RefreshTokenRequest {
    refreshToken: string;
}

// Refresh token response
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

// Password reset request
export interface PasswordResetRequest {
    email: string;
}

// Password reset confirm
export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
}

// Change password request
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

// Auth error types
export interface AuthError {
    message: string;
    code?: string;
    field?: string;
}

// OAuth provider types
export type OAuthProvider = 'google' | 'facebook' | 'apple' | 'github';

// OAuth credentials
export interface OAuthCredentials {
    provider: OAuthProvider;
    token: string;
    email?: string;
}

// Two-factor authentication
export interface TwoFactorAuthRequest {
    userId: string;
    code: string;
}

// Email verification
export interface EmailVerificationRequest {
    token: string;
}

// Resend verification email
export interface ResendVerificationRequest {
    email: string;
}

// Auth permissions
export type Permission =
    | 'read_profile'
    | 'write_profile'
    | 'read_questions'
    | 'write_questions'
    | 'read_challenges'
    | 'write_challenges'
    | 'read_groups'
    | 'write_groups'
    | 'admin_panel'
    | 'moderate_content';

// User role with permissions
export interface UserRole {
    id: string;
    name: string;
    permissions: Permission[];
}

// Extended auth response with roles and permissions
export interface ExtendedAuthResponse extends AuthResponse {
    roles: UserRole[];
    permissions: Permission[];
}

// Session info
export interface SessionInfo {
    id: string;
    userId: string;
    device: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    lastActivityAt: string;
    isCurrentSession: boolean;
}

// Auth configuration
export interface AuthConfig {
    apiBaseUrl: string;
    tokenRefreshThreshold: number; // minutes before expiry to refresh
    maxRetries: number;
    enableBiometric: boolean;
    enableRememberMe: boolean;
    sessionTimeout: number; // minutes
}

// Biometric auth
export interface BiometricAuthOptions {
    title: string;
    subtitle?: string;
    description?: string;
    fallbackTitle?: string;
    negativeText?: string;
}

// Auth context type (for providers)
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    permissions: Permission[];
    roles: UserRole[];
    login: (credentials: LoginCredentials) => Promise<void>;
    loginWithOAuth: (credentials: OAuthCredentials) => Promise<void>;
    logout: () => Promise<void>;
    signup: (userData: SignupData) => Promise<void>;
    refreshToken: () => Promise<void>;
    resetPassword: (request: PasswordResetRequest) => Promise<void>;
    confirmPasswordReset: (request: PasswordResetConfirm) => Promise<void>;
    changePassword: (request: ChangePasswordRequest) => Promise<void>;
    verifyEmail: (request: EmailVerificationRequest) => Promise<void>;
    resendVerification: (request: ResendVerificationRequest) => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
    clearError: () => void;
    hasPermission: (permission: Permission) => boolean;
    hasRole: (roleName: string) => boolean;
}

// Auth storage keys
export const AUTH_STORAGE_KEYS = {
    ACCESS_TOKEN: '@auth/access_token',
    REFRESH_TOKEN: '@auth/refresh_token',
    USER: '@auth/user',
    PERMISSIONS: '@auth/permissions',
    ROLES: '@auth/roles',
    BIOMETRIC_ENABLED: '@auth/biometric_enabled',
    REMEMBER_ME: '@auth/remember_me',
} as const;

// Auth action types for Redux
export const AUTH_ACTION_TYPES = {
    LOGIN_START: 'auth/loginStart',
    LOGIN_SUCCESS: 'auth/loginSuccess',
    LOGIN_FAILURE: 'auth/loginFailure',
    LOGOUT: 'auth/logout',
    REFRESH_START: 'auth/refreshStart',
    REFRESH_SUCCESS: 'auth/refreshSuccess',
    REFRESH_FAILURE: 'auth/refreshFailure',
    UPDATE_USER: 'auth/updateUser',
    SET_TOKENS: 'auth/setTokens',
    CLEAR_ERROR: 'auth/clearError',
    SET_LOADING: 'auth/setLoading',
} as const;

// Auth status enum
export enum AuthStatus {
    IDLE = 'idle',
    LOADING = 'loading',
    AUTHENTICATED = 'authenticated',
    UNAUTHENTICATED = 'unauthenticated',
    ERROR = 'error',
}

// Token validation result
export interface TokenValidationResult {
    isValid: boolean;
    isExpired: boolean;
    expiresAt?: number;
    needsRefresh?: boolean;
}

// Auth guards
export interface AuthGuardConfig {
    requireAuth?: boolean;
    requirePermissions?: Permission[];
    requireRoles?: string[];
    redirectOnFail?: string;
    fallbackComponent?: React.ComponentType;
}

// Auth event types
export type AuthEventType =
    | 'login'
    | 'logout'
    | 'signup'
    | 'token_refresh'
    | 'permission_changed'
    | 'session_expired'
    | 'unauthorized_access';

// Auth event data
export interface AuthEvent {
    type: AuthEventType;
    timestamp: string;
    userId?: string;
    metadata?: Record<string, any>;
}

// Auth analytics
export interface AuthAnalytics {
    loginAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    lastLoginAt?: string;
    deviceInfo?: {
        platform: string;
        version: string;
        model?: string;
    };
}