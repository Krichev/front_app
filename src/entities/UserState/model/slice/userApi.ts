// src/entities/UserState/model/slice/userApi.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import api from '../../../../features/auth/api.js';
import authService from '../../../../features/auth/authService';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt: string;
    statsCompleted?: number;
    statsCreated?: number;
    statsSuccess?: number;
}

export interface UpdateUserProfileRequest {
    username?: string;
    bio?: string;
    avatar?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: UserProfile;
    token: string;
}

export const userApi = createApi({

    async updateProfile(profileData) {
        try {
            const response = await api.put('/users/profile', profileData);

            // If username was changed, we'll receive a new token
            if (response.data.newToken) {
                await authService.updateAuthToken(response.data.newToken);
                // Update stored user data
                const userData = {
                    id: response.data.id,
                    userName: response.data.userName,
                    email: response.data.email,
                    fullName: response.data.fullName,
                    phoneNumber: response.data.phoneNumber,
                    address: response.data.address,
                };
                await authService.updateUserData(userData);
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateUsername(newUsername) {
        try {
            const response = await api.put('/users/profile/username', {
                newUsername,
            });

            // Update token and user data
            if (response.data.token) {
                await authService.updateAuthToken(response.data.token);
                await authService.updateUserData(response.data.user);
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getProfile() {
        const response = await api.get('/users/profile');
        return response.data;
    },

    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://10.0.2.2:8082/challenger/api',
        prepareHeaders: (headers, { getState }) => {
            // Get the token from the state - FIXED: using accessToken instead of token
            const token = (getState() as any).auth.accessToken;

            // If we have a token, add it to the headers
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            return headers;
        },
    }),
    tagTypes: ['User'],
    endpoints: (builder) => ({
        // Get user profile
        getUserProfile: builder.query<UserProfile, string>({
            query: (userId) => `/users/${userId}`,
            providesTags: (_, __, userId) => [{ type: 'User', id: userId }],
        }),

        // Update user profile
        updateUserProfile: builder.mutation<UserProfile, { id: string } & UpdateUserProfileRequest>({
            query: ({ id, ...body }) => ({
                url: `/users/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_, __, { id }) => [{ type: 'User', id }],
        }),

        // Login
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),

        // Register
        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: userData,
            }),
        }),

        // Get user stats
        getUserStats: builder.query<{ completed: number; created: number; success: number }, string>({
            query: (userId) => `/users/${userId}/stats`,
            providesTags: (_, __, userId) => [{ type: 'User', id: `${userId}-stats` }],
        }),

        // Get user groups
        getUserGroups: builder.query<any[], string>({
            query: (userId) => `/users/${userId}/groups`,
            providesTags: (_, __, userId) => [{ type: 'User', id: `${userId}-groups` }],
        }),

        // Search users
        searchUsers: builder.query<UserProfile[], string>({
            query: (searchTerm) => ({
                url: '/users/search',
                params: { q: searchTerm },
            }),
            providesTags: ['User'],
        }),
    }),
});

export const {
    useGetUserProfileQuery,
    useUpdateUserProfileMutation,
    useLoginMutation,
    useRegisterMutation,
    useGetUserStatsQuery,
    useGetUserGroupsQuery,
    useSearchUsersQuery,
} = userApi;