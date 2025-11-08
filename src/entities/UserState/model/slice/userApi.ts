// src/entities/UserState/model/slice/userApi.ts - UPDATED
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import {RootState} from '../../../../app/providers/StoreProvider/store';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt: Date;
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
    newToken?: string;
}

export interface UserStatsResponse {
    created: number;
    completed: number;
    success: number;
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
    reducerPath: 'userApi',
    baseQuery: createBaseQueryWithAuth('http://10.0.2.2:8082/challenger/api'),
    tagTypes: ['User', 'UserProfile'],
    endpoints: (builder) => ({
        getUserProfile: builder.query<UserProfile, string>({
            query: (userId) => `/users/${userId}`,
            providesTags: (result, error, userId) => [
                { type: 'User', id: userId },
                { type: 'UserProfile', id: userId },
            ],
        }),

        updateUserProfile: builder.mutation<UpdateUserProfileResponse, {
            userId: string;
            userData: UpdateUserProfileRequest;
        }>({
            query: ({ userId, userData }) => ({
                url: `/users/${userId}`,
                method: 'PATCH',
                body: userData,
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'User', id: userId },
                { type: 'UserProfile', id: userId },
                { type: 'User', id: 'LIST' },
            ],
            onQueryStarted: async ({ userId, userData }, { dispatch, queryFulfilled, getState }) => {
                try {
                    const { data } = await queryFulfilled;
                    const state = getState() as RootState;
                    const currentUser = state.auth.user;

                    if (currentUser && currentUser.id === userId) {
                        const updatedUser = {
                            ...currentUser,
                            ...data.user,
                        };

                        dispatch(updateUser(updatedUser));

                        if (data.newToken) {
                            await TokenRefreshService.updateTokensAndPersist(data.newToken, updatedUser);
                            console.log('✅ Username updated and new JWT token persisted');
                        } else {
                            await TokenRefreshService.updateUserAndPersist(updatedUser);
                            console.log('✅ User profile updated successfully');
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to update user profile:', error);
                }
            },
        }),

        getUserStats: builder.query<UserStatsResponse, string>({
            query: (userId) => `/users/${userId}/stats`,
            providesTags: (result, error, userId) => [
                { type: 'User', id: `${userId}-stats` },
            ],
        }),

        getUserGroups: builder.query<any[], string>({
            query: (userId) => `/users/${userId}/groups`,
            providesTags: (result, error, userId) => [
                { type: 'User', id: `${userId}-groups` },
            ],
        }),

        searchUsers: builder.query<UserProfile[], string>({
            query: (searchTerm) => ({
                url: '/users/search',
                params: { q: searchTerm },
            }),
            providesTags: [{ type: 'User', id: 'LIST' }],
        }),

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
                    const state = getState() as RootState;
                    const currentUser = state.auth.user;

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

        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),

        register: builder.mutation<AuthResponse, RegisterRequest>({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: userData,
            }),
        }),
    }),
});

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