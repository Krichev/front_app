// src/features/auth/index.ts
export {authApi} from './api';
export {authSlice, authActions} from './model';
export type {AuthState, LoginCredentials, SignupData} from './model/types';
export {LoginForm} from './ui/login-form';
export {SignupForm} from './ui/signup-form';
export {AuthGuard} from './ui/auth-guard';
export {LogoutButton} from './ui/logout-button';

// Re-export hooks
export {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useRefreshTokenMutation,
} from './api';

export {useAuth} from './lib/hooks/use-auth';