// src/features/auth/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {User} from '../../../entities/user/model/types';
import {AuthResponse, AuthState, LoginCredentials,} from './types';

const initialState: AuthState = {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Login actions
        loginStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },

        loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
            const { accessToken, refreshToken, user } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        },

        loginFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.error = action.payload;
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
        },

        // Logout action
        logout: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
        },

        // Token management
        setTokens: (state, action: PayloadAction<{
            accessToken: string;
            refreshToken: string;
            user: User;
        }>) => {
            const { accessToken, refreshToken, user } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        },

        refreshTokenStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },

        refreshTokenSuccess: (state, action: PayloadAction<{
            accessToken: string;
            refreshToken: string;
        }>) => {
            const { accessToken, refreshToken } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.isLoading = false;
            state.error = null;
        },

        refreshTokenFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.error = action.payload;
            // Don't logout on refresh failure, let the component handle it
        },

        // User management
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },

        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        },

        // Error and loading management
        clearError: (state) => {
            state.error = null;
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        // Authentication status
        setAuthenticated: (state, action: PayloadAction<boolean>) => {
            state.isAuthenticated = action.payload;
            if (!action.payload) {
                state.accessToken = null;
                state.refreshToken = null;
                state.user = null;
            }
        },

        // Session management
        sessionExpired: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.error = 'Session expired. Please log in again.';
        },

        // Password reset
        passwordResetStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },

        passwordResetSuccess: (state) => {
            state.isLoading = false;
            state.error = null;
        },

        passwordResetFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.error = action.payload;
        },

        // Email verification
        emailVerificationStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },

        emailVerificationSuccess: (state) => {
            state.isLoading = false;
            state.error = null;
            if (state.user) {
                state.user.emailVerified = true;
            }
        },

        emailVerificationFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.error = action.payload;
        },

        // Signup actions
        signupStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },

        signupSuccess: (state, action: PayloadAction<AuthResponse>) => {
            const { accessToken, refreshToken, user } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        },

        signupFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.error = action.payload;
            state.isAuthenticated = false;
        },

        // Reset entire state
        resetAuthState: () => initialState,

        // Hydrate state (for persistence)
        hydrateAuthState: (state, action: PayloadAction<Partial<AuthState>>) => {
            return { ...state, ...action.payload };
        },
    },
});

// Export actions
export const authActions = authSlice.actions;

// Export reducer
export const authReducer = authSlice.reducer;

// Selectors
export const authSelectors = {
    // Basic selectors
    selectUser: (state: { auth: AuthState }) => state.auth.user,
    selectIsAuthenticated: (state: { auth: AuthState }) => state.auth.isAuthenticated,
    selectIsLoading: (state: { auth: AuthState }) => state.auth.isLoading,
    selectError: (state: { auth: AuthState }) => state.auth.error,
    selectAccessToken: (state: { auth: AuthState }) => state.auth.accessToken,
    selectRefreshToken: (state: { auth: AuthState }) => state.auth.refreshToken,

    // Derived selectors
    selectUserId: (state: { auth: AuthState }) => state.auth.user?.id,
    selectUsername: (state: { auth: AuthState }) => state.auth.user?.username,
    selectUserEmail: (state: { auth: AuthState }) => state.auth.user?.email,
    selectUserAvatar: (state: { auth: AuthState }) => state.auth.user?.avatar,

    // Status selectors
    selectAuthStatus: (state: { auth: AuthState }) => {
        if (state.auth.isLoading) return 'loading';
        if (state.auth.error) return 'error';
        if (state.auth.isAuthenticated) return 'authenticated';
        return 'unauthenticated';
    },

    selectHasValidSession: (state: { auth: AuthState }) =>
        state.auth.isAuthenticated &&
        state.auth.accessToken &&
        state.auth.user,

    selectNeedsReauthentication: (state: { auth: AuthState }) =>
        !state.auth.isAuthenticated && state.auth.refreshToken,
};

// Action creators for complex operations
export const createAuthActionCreators = (dispatch: any) => ({
    // Login with credentials
    loginWithCredentials: async (credentials: LoginCredentials) => {
        dispatch(authActions.loginStart());
        try {
            // This would be handled by the AuthProvider or API middleware
            // Just dispatching the start action here
        } catch (error) {
            dispatch(authActions.loginFailure(error instanceof Error ? error.message : 'Login failed'));
        }
    },

    // Logout with cleanup
    logoutWithCleanup: async () => {
        try {
            // Clear any additional data before logout
            dispatch(authActions.logout());
        } catch (error) {
            console.error('Logout error:', error);
            // Still logout even if cleanup fails
            dispatch(authActions.logout());
        }
    },

    // Refresh token with retry
    refreshTokenWithRetry: async (maxRetries: number = 3) => {
        let attempts = 0;

        while (attempts < maxRetries) {
            try {
                dispatch(authActions.refreshTokenStart());
                // This would be handled by the AuthProvider or API middleware
                return;
            } catch (error) {
                attempts++;
                if (attempts >= maxRetries) {
                    dispatch(authActions.refreshTokenFailure('Failed to refresh token'));
                    dispatch(authActions.sessionExpired());
                }
            }
        }
    },

    // Update user profile
    updateUserProfile: (userData: Partial<User>) => {
        dispatch(authActions.updateUser(userData));
    },
});

// Type for the auth slice state
export type { AuthState };

// Export default
export default authSlice;