// src/entities/GroupState/model/slice/groupApi.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {RootState} from '../../../../app/providers/StoreProvider/store.ts';

export interface Group {
    id: string;
    name: string;
    description: string;
    type: 'CHALLENGE' | 'SOCIAL';
    privacy_setting: 'PUBLIC' | 'PRIVATE' | 'INVITATION_ONLY';
    member_count: number;
    created_at: string;
    updated_at: string;
    creator_id: string;
    role: 'ADMIN' | 'MEMBER' | 'MODERATOR';
}

export const groupApi = createApi({
    reducerPath: 'groupApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://10.0.2.2:8082/challenger/api',
        prepareHeaders: (headers, { getState }) => {
            // Get the token from the state
            const token = (getState() as RootState).auth.accessToken;

            // If we have a token, add it to the headers
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }

            return headers;
        },
    }),
    tagTypes: ['Group'],
    endpoints: (builder) => ({
        // Get all groups the user is a member of
        getUserGroups: builder.query<Group[], void>({
            query: () => '/groups/me',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Group' as const, id })),
                        { type: 'Group', id: 'LIST' },
                    ]
                    : [{ type: 'Group', id: 'LIST' }],
        }),

        // Join a group
        joinGroup: builder.mutation<{ message: string }, string>({
            query: (groupId) => ({
                url: `/groups/${groupId}/join`,
                method: 'POST',
            }),
            invalidatesTags: [{ type: 'Group', id: 'LIST' }],
        }),

        // Get groups by specific user ID
        getUserGroupsByUserId: builder.query<Group[], string>({
            query: (userId) => `/groups/user/${userId}`,
            providesTags: (result, error, userId) => [{ type: 'Group', id: userId }],
        }),
    }),
});

export const {
    useGetUserGroupsQuery,
    useJoinGroupMutation,
    useGetUserGroupsByUserIdQuery,
} = groupApi;