// src/entities/UserState/model/slice/userApi.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';

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
    email: string;
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
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://10.0.2.2:8082/challenger/api',
        prepareHeaders: (headers, { getState }) => {
            // Get the token from the state
            const token = (getState() as any).auth.token;

            // If we have a token, add it to the headers
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
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