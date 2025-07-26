// src/entities/user/api/index.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {baseQuery} from '../../../shared/api';
import type {UpdateUserProfileRequest, User, UserProfile, UserSearchFilters, UserStats,} from '../model/types';

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: baseQuery,
    tagTypes: ['User', 'UserStats'],
    endpoints: (builder) => ({
        // Get user profile
        getUserProfile: builder.query<UserProfile, string>({
            query: (userId) => `/users/${userId}`,
            providesTags: (result, error, userId) => [
                {type: 'User', id: userId},
            ],
        }),

        // Update user profile
        updateUserProfile: builder.mutation<UserProfile, {
            id: string;
        } & UpdateUserProfileRequest>({
            query: ({id, ...body}) => ({
                url: `/users/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, {id}) => [
                {type: 'User', id},
            ],
        }),

        // Get user statistics
        getUserStats: builder.query<UserStats, string>({
            query: (userId) => `/users/${userId}/stats`,
            providesTags: (result, error, userId) => [
                {type: 'UserStats', id: userId},
            ],
        }),

        // Search users
        searchUsers: builder.query<User[], UserSearchFilters>({
            query: (filters) => ({
                url: '/users/search',
                params: filters,
            }),
            providesTags: ['User'],
        }),

        // Get current user
        getCurrentUser: builder.query<UserProfile, void>({
            query: () => '/users/me',
            providesTags: ['User'],
        }),

        // Upload user avatar
        uploadUserAvatar: builder.mutation<{avatarUrl: string}, {
            userId: string;
            file: FormData;
        }>({
            query: ({userId, file}) => ({
                url: `/users/${userId}/avatar`,
                method: 'POST',
                body: file,
            }),
            invalidatesTags: (result, error, {userId}) => [
                {type: 'User', id: userId},
            ],
        }),

        // Follow/unfollow user
        followUser: builder.mutation<void, string>({
            query: (userId) => ({
                url: `/users/${userId}/follow`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, userId) => [
                {type: 'User', id: userId},
            ],
        }),

        unfollowUser: builder.mutation<void, string>({
            query: (userId) => ({
                url: `/users/${userId}/follow`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, userId) => [
                {type: 'User', id: userId},
            ],
        }),

        // Get user followers/following
        getUserFollowers: builder.query<User[], string>({
            query: (userId) => `/users/${userId}/followers`,
            providesTags: (result, error, userId) => [
                {type: 'User', id: `${userId}-followers`},
            ],
        }),

        getUserFollowing: builder.query<User[], string>({
            query: (userId) => `/users/${userId}/following`,
            providesTags: (result, error, userId) => [
                {type: 'User', id: `${userId}-following`},
            ],
        }),
    }),
});

export const {
    useGetUserProfileQuery,
    useUpdateUserProfileMutation,
    useGetUserStatsQuery,
    useSearchUsersQuery,
    useGetCurrentUserQuery,
    useUploadUserAvatarMutation,
    useFollowUserMutation,
    useUnfollowUserMutation,
    useGetUserFollowersQuery,
    useGetUserFollowingQuery,
} = userApi;