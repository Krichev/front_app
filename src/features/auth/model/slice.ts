// src/features/auth/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {AuthResponse, AuthState, User} from './types.ts';

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
        // Loading state
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        // Error handling
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        clearError: (state) => {
            state.error = null;
        },

        // Authentication actions
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

        // Set tokens (for refresh or manual token setting)
        setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
            const { accessToken, refreshToken } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.isAuthenticated = !!accessToken;
        },

        // Set user data
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = !!state.accessToken;
        },

        // Update user data (partial update)
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },

        // Logout
        logout: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
        },

        // Token refresh success
        refreshTokenSuccess: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
            const { accessToken, refreshToken } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;
            state.error = null;
        },

        // Token refresh failure
        refreshTokenFailure: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.error = 'Session expired. Please login again.';
        },

        // Registration actions
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
    },
});

// Export actions
export const authActions = authSlice.actions;

// Export reducer
export const authReducer = authSlice.reducer;