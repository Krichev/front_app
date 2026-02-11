// src/entities/AuthState/model/slice/authSlice.ts - COMPLETE FIX
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import KeychainService from '../../../../services/auth/KeychainService';

export interface User {
    id: string; // FIXED: Changed from number to string to match UserProfile
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt?: string;
    childAccount?: boolean;
}

export interface AuthState {
    isAuthenticated: boolean;
    isInitialized: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    isInitialized: false,
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

        setInitialized: state => {
            state.isInitialized = true;
        },

        updateAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
        },

        // NEW: Add updateUser action to update user data
        updateUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        },

        logout: state => {
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isInitialized = true;

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
    updateUser, // EXPORT the new action
    logout,
    clearAuthState,
} = authSlice.actions;

export default authSlice.reducer;