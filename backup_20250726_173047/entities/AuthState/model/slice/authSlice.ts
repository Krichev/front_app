// src/entities/AuthState/model/slice/authSlice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface User {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt: string;
    updatedAt?: string;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Loading states
        setLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        // Set tokens and user
        setTokens(state, action: PayloadAction<{
            accessToken: string;
            refreshToken: string;
            user: User;
        }>) {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        },

        // Login actions
        loginStart(state) {
            state.isLoading = true;
            state.error = null;
        },

        loginSuccess(state, action: PayloadAction<{
            accessToken: string;
            refreshToken: string;
            user: User;
        }>) {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        },

        loginFailure(state, action: PayloadAction<string>) {
            state.isLoading = false;
            state.error = action.payload;
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
        },

        // Logout
        logout(state) {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
        },

        // Update user
        updateUser(state, action: PayloadAction<Partial<User>>) {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },

        // Error handling
        setError(state, action: PayloadAction<string>) {
            state.error = action.payload;
            state.isLoading = false;
        },

        clearError(state) {
            state.error = null;
        },

        // Refresh token
        refreshTokenStart(state) {
            state.isLoading = true;
            state.error = null;
        },

        refreshTokenSuccess(state, action: PayloadAction<{
            accessToken: string;
            refreshToken: string;
        }>) {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.isLoading = false;
            state.error = null;
        },

        refreshTokenFailure(state, action: PayloadAction<string>) {
            state.isLoading = false;
            state.error = action.payload;
        },

        // Session management
        sessionExpired(state) {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.error = 'Session expired. Please log in again.';
        },

        // Reset state
        resetAuth(state) {
            return initialState;
        },
    },
});

// Export actions
export const {
    setLoading,
    setTokens,
    loginStart,
    loginSuccess,
    loginFailure,
    logout,
    updateUser,
    setError,
    clearError,
    refreshTokenStart,
    refreshTokenSuccess,
    refreshTokenFailure,
    sessionExpired,
    resetAuth,
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Export types
export type { AuthState, User };

// Selectors
export const authSelectors = {
    selectUser: (state: { auth: AuthState }) => state.auth.user,
    selectIsAuthenticated: (state: { auth: AuthState }) => state.auth.isAuthenticated,
    selectIsLoading: (state: { auth: AuthState }) => state.auth.isLoading,
    selectError: (state: { auth: AuthState }) => state.auth.error,
    selectAccessToken: (state: { auth: AuthState }) => state.auth.accessToken,
    selectRefreshToken: (state: { auth: AuthState }) => state.auth.refreshToken,
};