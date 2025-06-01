// src/features/auth/model/types.ts
import type {User} from '../../../entities/user';
// src/features/auth/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {AuthResponse, AuthState} from './types';

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
    confirmPassword: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

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
        loginStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },

        loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
            const {accessToken, refreshToken, user} = action.payload;
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
        },

        logout: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
        },

        setTokens: (state, action: PayloadAction<{
            accessToken: string;
            refreshToken: string;
            user: User;
        }>) => {
            const {accessToken, refreshToken, user} = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.user = user;
            state.isAuthenticated = true;
        },

        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = {...state.user, ...action.payload};
            }
        },

        clearError: (state) => {
            state.error = null;
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;