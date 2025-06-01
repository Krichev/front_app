// src/features/auth/api/index.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {baseQuery} from '../../../shared/api';
import type {AuthResponse, LoginCredentials, RefreshTokenRequest, SignupData,} from '../model/types';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQuery,
    tagTypes: ['Auth'],
    endpoints: (builder) => ({
        // Login
        login: builder.mutation<AuthResponse, LoginCredentials>({
            query: (credentials) => ({
                url: '/auth/signin',
                method: 'POST',
                body: credentials,
            }),
        }),

        // Signup
        signup: builder.mutation<AuthResponse, SignupData>({
            query: (userData) => ({
                url: '/auth/signup',
                method: 'POST',
                body: {
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                },
            }),
        }),

        // Logout
        logout: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),

        // Refresh token
        refreshToken: builder.mutation<AuthResponse, RefreshTokenRequest>({
            query: (data) => ({
                url: '/auth/refresh-token',
                method: 'POST',
                body: data,
            }),
        }),

        // Verify token
        verifyToken: builder.query<{valid: boolean}, void>({
            query: () => '/auth/verify',
            providesTags: ['Auth'],
        }),

        // Request password reset
        requestPasswordReset: builder.mutation<{message: string}, {email: string}>({
            query: (data) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: data,
            }),
        }),

        // Reset password
        resetPassword: builder.mutation<{message: string}, {
            token: string;
            password: string;
        }>({
            query: (data) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body: data,
            }),
        }),

        // Change password
        changePassword: builder.mutation<{message: string}, {
            currentPassword: string;
            newPassword: string;
        }>({
            query: (data) => ({
                url: '/auth/change-password',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useRefreshTokenMutation,
    useVerifyTokenQuery,
    useRequestPasswordResetMutation,
    useResetPasswordMutation,
    useChangePasswordMutation,
} = authApi;