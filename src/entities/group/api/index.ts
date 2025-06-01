// src/entities/group/api/index.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {baseQuery} from '../../../shared/api';
import type {CreateGroupRequest, Group, GroupFilters, GroupMember, JoinGroupRequest} from '../model/types';

export const groupApi = createApi({
    reducerPath: 'groupApi',
    baseQuery: baseQuery,
    tagTypes: ['Group', 'GroupMember'],
    endpoints: (builder) => ({
        // Get groups with filters
        getGroups: builder.query<Group[], GroupFilters>({
            query: (filters) => ({
                url: '/groups',
                params: filters,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Group' as const, id })),
                        { type: 'Group', id: 'LIST' },
                    ]
                    : [{ type: 'Group', id: 'LIST' }],
        }),

        // Get single group
        getGroupById: builder.query<Group, string>({
            query: (id) => `/groups/${id}`,
            providesTags: (result, error, id) => [{ type: 'Group', id }],
        }),

        // Get user's groups
        getUserGroups: builder.query<Group[], void>({
            query: () => '/groups/me',
            providesTags: [{ type: 'Group', id: 'USER_LIST' }],
        }),

        // Create group
        createGroup: builder.mutation<Group, CreateGroupRequest>({
            query: (data) => ({
                url: '/groups',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [
                { type: 'Group', id: 'LIST' },
                { type: 'Group', id: 'USER_LIST' },
            ],
        }),

        // Update group
        updateGroup: builder.mutation<Group, { id: string } & Partial<CreateGroupRequest>>({
            query: ({ id, ...data }) => ({
                url: `/groups/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Group', id },
                { type: 'Group', id: 'USER_LIST' },
            ],
        }),

        // Delete group
        deleteGroup: builder.mutation<void, string>({
            query: (id) => ({
                url: `/groups/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Group', id },
                { type: 'Group', id: 'LIST' },
                { type: 'Group', id: 'USER_LIST' },
            ],
        }),

        // Join group
        joinGroup: builder.mutation<void, JoinGroupRequest>({
            query: ({ groupId, message }) => ({
                url: `/groups/${groupId}/join`,
                method: 'POST',
                body: message ? { message } : undefined,
            }),
            invalidatesTags: (result, error, { groupId }) => [
                { type: 'Group', id: groupId },
                { type: 'Group', id: 'USER_LIST' },
                { type: 'GroupMember', id: groupId },
            ],
        }),

        // Leave group
        leaveGroup: builder.mutation<void, string>({
            query: (groupId) => ({
                url: `/groups/${groupId}/leave`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, groupId) => [
                { type: 'Group', id: groupId },
                { type: 'Group', id: 'USER_LIST' },
                { type: 'GroupMember', id: groupId },
            ],
        }),

        // Get group members
        getGroupMembers: builder.query<GroupMember[], string>({
            query: (groupId) => `/groups/${groupId}/members`,
            providesTags: (result, error, groupId) => [
                { type: 'GroupMember', id: groupId },
            ],
        }),

        // Update member role
        updateMemberRole: builder.mutation<void, {
            groupId: string;
            userId: string;
            role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
        }>({
            query: ({ groupId, userId, role }) => ({
                url: `/groups/${groupId}/members/${userId}/role`,
                method: 'PATCH',
                body: { role },
            }),
            invalidatesTags: (result, error, { groupId }) => [
                { type: 'GroupMember', id: groupId },
            ],
        }),

        // Remove member
        removeMember: builder.mutation<void, {
            groupId: string;
            userId: string;
        }>({
            query: ({ groupId, userId }) => ({
                url: `/groups/${groupId}/members/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { groupId }) => [
                { type: 'Group', id: groupId },
                { type: 'GroupMember', id: groupId },
            ],
        }),

        // Search groups
        searchGroups: builder.query<Group[], string>({
            query: (searchTerm) => ({
                url: '/groups/search',
                params: { q: searchTerm },
            }),
            providesTags: [{ type: 'Group', id: 'SEARCH' }],
        }),
    }),
});

export const {
    useGetGroupsQuery,
    useGetGroupByIdQuery,
    useGetUserGroupsQuery,
    useCreateGroupMutation,
    useUpdateGroupMutation,
    useDeleteGroupMutation,
    useJoinGroupMutation,
    useLeaveGroupMutation,
    useGetGroupMembersQuery,
    useUpdateMemberRoleMutation,
    useRemoveMemberMutation,
    useSearchGroupsQuery,
} = groupApi;
