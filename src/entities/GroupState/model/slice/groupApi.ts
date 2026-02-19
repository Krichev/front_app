// src/entities/GroupState/model/slice/groupApi.ts - UPDATED
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';

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
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    tagTypes: ['Group'],
    endpoints: (builder) => ({
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

        joinGroup: builder.mutation<{ message: string }, string>({
            query: (groupId) => ({
                url: `/groups/${groupId}/join`,
                method: 'POST',
            }),
            invalidatesTags: [{ type: 'Group', id: 'LIST' }],
        }),

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