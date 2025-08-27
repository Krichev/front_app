// src/entities/UserState/model/slice/userApi.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {updateUser} from '../../../AuthState/model/slice/authSlice';
import {RootState} from '../../../../app/providers/StoreProvider/store';
import {TokenRefreshService} from '../../../../services/auth/TokenRefreshService';

// Interfaces
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

export interface UpdateUserProfileResponse {
    user: UserProfile;
    newToken?: string; // JWT token returned when username is changed
}

export interface UserStatsResponse {
    created: number;
    completed: number;
    success: number; // This could be a percentage or ratio
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

// Create base query with auth token
const baseQuery = fetchBaseQuery({
    baseUrl: 'http://10.0.2.2:8082/challenger/api',
    prepareHeaders: (headers, { getState }) => {
        // Get the token from the state
        const state = getState() as RootState;
        const token = state.auth.accessToken;

        // If we have a token, add it to the headers
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');

        return headers;
    },
});

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery,
    tagTypes: ['User', 'UserProfile'],
    endpoints: (builder) => ({
        // Get user profile by ID
        getUserProfile: builder.query<UserProfile, string>({
            query: (userId) => `/users/${userId}`,
            providesTags: (result, error, userId) => [
                { type: 'User', id: userId },
                { type: 'UserProfile', id: userId },
            ],
        }),

        // Update user profile
        updateUserProfile: builder.mutation<UpdateUserProfileResponse, { id: string } & UpdateUserProfileRequest>({
            query: ({ id, ...body }) => ({
                url: `/users/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'User', id },
                { type: 'UserProfile', id },
                { type: 'User', id: 'LIST' },
            ],
            // Handle auth state synchronization and token refresh
            onQueryStarted: async ({ id, username, ...profileData }, { dispatch, queryFulfilled, getState }) => {
                try {
                    const { data: response } = await queryFulfilled;

                    // Get current auth state
                    const state = getState() as RootState;
                    const currentUser = state.auth.user;

                    // If this is the current authenticated user, update the auth state
                    if (currentUser && currentUser.id === id) {
                        const updatedUser = {
                            ...currentUser,
                            ...response.user,
                        };

                        // If username was changed and we received a new token, update everything
                        if (response.newToken) {
                            console.log('🔄 Username changed, updating token and persisting to storage');

                            // Use centralized token refresh service
                            await TokenRefreshService.updateTokensAndPersist(response.newToken, updatedUser);

                            console.log('✅ Username updated and new JWT token persisted successfully');
                        } else {
                            // Just update user data
                            console.log('👤 Updating user profile data');

                            await TokenRefreshService.updateUserAndPersist(updatedUser);

                            console.log('✅ User profile updated successfully');
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to update user profile:', error);
                }
            },
        }),

        // Get user statistics
        getUserStats: builder.query<UserStatsResponse, string>({
            query: (userId) => `/users/${userId}/stats`,
            providesTags: (result, error, userId) => [
                { type: 'User', id: `${userId}-stats` },
            ],
        }),

        // Get user groups
        getUserGroups: builder.query<any[], string>({
            query: (userId) => `/users/${userId}/groups`,
            providesTags: (result, error, userId) => [
                { type: 'User', id: `${userId}-groups` },
            ],
        }),

        // Search users
        searchUsers: builder.query<UserProfile[], string>({
            query: (searchTerm) => ({
                url: '/users/search',
                params: { q: searchTerm },
            }),
            providesTags: [{ type: 'User', id: 'LIST' }],
        }),

        // Get multiple user profiles (for lists, search, etc.)
        getUserProfiles: builder.query<UserProfile[], { ids?: string[]; search?: string }>({
            query: ({ ids, search }) => {
                const params = new URLSearchParams();
                if (ids?.length) {
                    params.append('ids', ids.join(','));
                }
                if (search) {
                    params.append('search', search);
                }
                return `/users?${params.toString()}`;
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'UserProfile' as const, id })),
                        { type: 'User', id: 'LIST' },
                    ]
                    : [{ type: 'User', id: 'LIST' }],
        }),

        // Additional endpoint specifically for username updates if needed
        updateUsername: builder.mutation<{ user: UserProfile; newToken?: string }, { userId: string; username: string }>({
            query: ({ userId, username }) => ({
                url: `/users/${userId}/username`,
                method: 'PUT',
                body: { username },
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'User', id: userId },
                { type: 'UserProfile', id: userId },
                { type: 'User', id: 'LIST' },
            ],
            onQueryStarted: async ({ userId, username }, { dispatch, queryFulfilled, getState }) => {
                try {
                    const { data } = await queryFulfilled;

                    // Get current auth state
                    const state = getState() as RootState;
                    const currentUser = state.auth.user;

                    // If this is the current authenticated user, update the auth state
                    if (currentUser && currentUser.id === userId) {
                        dispatch(updateUser({
                            ...currentUser,
                            ...data.user,
                        }));
                    }
                } catch (error) {
                    console.error('Failed to update username:', error);
                }
            },
        }),

        // Login endpoint (if you want to handle auth through this API)
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),

        // Register endpoint (if you want to handle auth through this API)
        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: userData,
            }),
        }),
    }),
});

// Export hooks for use in components
export const {
    useGetUserProfileQuery,
    useUpdateUserProfileMutation,
    useGetUserStatsQuery,
    useGetUserGroupsQuery,
    useSearchUsersQuery,
    useGetUserProfilesQuery,
    useUpdateUsernameMutation,
    useLoginMutation,
    useRegisterMutation,
} = userApi;