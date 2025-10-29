// src/entities/AuthState/model/slice/authSlice.ts - FIXED VERSION
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import KeychainService from '../../../../services/auth/KeychainService';

export interface User {
    id: number;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    isInitialized: boolean; // NEW: Track if auth state has been initialized
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    isInitialized: false, // Start as not initialized
    accessToken: null,
    refreshToken: null,
    user: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setTokens: (
            state,
            action: PayloadAction<{
                accessToken: string;
                refreshToken: string;
                user: User;
            }>,
        ) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.isInitialized = true;
        },

        // NEW: Set initialized state without tokens (for when no stored tokens exist)
        setInitialized: state => {
            state.isInitialized = true;
        },

        updateAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
        },

        logout: state => {
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isInitialized = true; // Keep initialized as true

            // Delete tokens from keychain
            KeychainService.deleteAuthTokens().catch(error => {
                console.error('Error deleting tokens from keychain:', error);
            });
        },

        clearAuthState: state => {
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isInitialized = true;
        },
    },
});

export const {
    setTokens,
    setInitialized,
    updateAccessToken,
    logout,
    clearAuthState,
} = authSlice.actions;

export default authSlice.reducer;