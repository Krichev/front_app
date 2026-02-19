import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithAuth } from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';
import { 
    UserRelationship, 
    RelationshipType, 
    RelationshipStatus, 
    CreateRelationshipRequest, 
    UpdateRelationshipRequest,
    ContactGroup,
    UserPrivacySettings,
    UserSuggestion,
    MutualConnection
} from '../../../QuizState/model/types/question.types';

export const relationshipApi = createApi({
    reducerPath: 'relationshipApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    tagTypes: ['Relationship', 'ContactGroup', 'PrivacySettings', 'Suggestion'],
    endpoints: (builder) => ({
        getRelationships: builder.query<{ content: UserRelationship[], totalElements: number }, { 
            relatedUserId?: string | number,
            type?: RelationshipType, 
            status?: RelationshipStatus, 
            sort?: string, 
            page?: number, 
            size?: number 
        }>({
            query: (params) => ({
                url: '/relationships',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.content.map(({ id }) => ({ type: 'Relationship' as const, id })),
                        { type: 'Relationship', id: 'LIST' },
                    ]
                    : [{ type: 'Relationship', id: 'LIST' }],
        }),

        createRelationship: builder.mutation<UserRelationship, CreateRelationshipRequest>({
            query: (body) => ({
                url: '/relationships',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Relationship', id: 'LIST' }, { type: 'Suggestion', id: 'LIST' }],
        }),

        updateRelationship: builder.mutation<UserRelationship, { id: string; data: UpdateRelationshipRequest }>({
            query: ({ id, data }) => ({
                url: `/relationships/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Relationship', id }, { type: 'Relationship', id: 'LIST' }],
        }),

        acceptRelationship: builder.mutation<UserRelationship, string>({
            query: (id) => ({
                url: `/relationships/${id}/accept`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Relationship', id }, { type: 'Relationship', id: 'LIST' }],
        }),

        rejectRelationship: builder.mutation<void, string>({
            query: (id) => ({
                url: `/relationships/${id}/reject`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Relationship', id }, { type: 'Relationship', id: 'LIST' }],
        }),

        removeRelationship: builder.mutation<void, string>({
            query: (id) => ({
                url: `/relationships/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Relationship', id: 'LIST' }],
        }),

        toggleFavorite: builder.mutation<UserRelationship, string>({
            query: (id) => ({
                url: `/relationships/${id}/favorite`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Relationship', id }, { type: 'Relationship', id: 'LIST' }],
        }),

        getSuggestions: builder.query<UserSuggestion[], void>({
            query: () => '/relationships/suggestions',
            providesTags: [{ type: 'Suggestion', id: 'LIST' }],
        }),

        getMutualConnections: builder.query<MutualConnection[], string>({
            query: (userId) => `/relationships/mutual/${userId}`,
        }),

        // Contact Groups
        getContactGroups: builder.query<ContactGroup[], void>({
            query: () => '/contact-groups',
            providesTags: [{ type: 'ContactGroup', id: 'LIST' }],
        }),

        createContactGroup: builder.mutation<ContactGroup, { name: string; color?: string; icon?: string }>({
            query: (body) => ({
                url: '/contact-groups',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'ContactGroup', id: 'LIST' }],
        }),

        updateContactGroup: builder.mutation<ContactGroup, { id: string; data: { name?: string; color?: string; icon?: string } }>({
            query: ({ id, data }) => ({
                url: `/contact-groups/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'ContactGroup', id }, { type: 'ContactGroup', id: 'LIST' }],
        }),

        deleteContactGroup: builder.mutation<void, string>({
            query: (id) => ({
                url: `/contact-groups/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'ContactGroup', id: 'LIST' }],
        }),

        addMembersToGroup: builder.mutation<void, { groupId: string; relationshipIds: string[] }>({
            query: ({ groupId, relationshipIds }) => ({
                url: `/contact-groups/${groupId}/members`,
                method: 'POST',
                body: relationshipIds,
            }),
            invalidatesTags: (result, error, { groupId }) => [{ type: 'ContactGroup', id: groupId }, { type: 'ContactGroup', id: 'LIST' }],
        }),

        removeMemberFromGroup: builder.mutation<void, { groupId: string; relationshipId: string }>({
            query: ({ groupId, relationshipId }) => ({
                url: `/contact-groups/${groupId}/members/${relationshipId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { groupId }) => [{ type: 'ContactGroup', id: groupId }, { type: 'ContactGroup', id: 'LIST' }],
        }),

        // Privacy Settings
        getPrivacySettings: builder.query<UserPrivacySettings, void>({
            query: () => '/privacy-settings',
            providesTags: [{ type: 'PrivacySettings', id: 'CURRENT' }],
        }),

        updatePrivacySettings: builder.mutation<UserPrivacySettings, UserPrivacySettings>({
            query: (body) => ({
                url: '/privacy-settings',
                method: 'PUT',
                body,
            }),
            invalidatesTags: [{ type: 'PrivacySettings', id: 'CURRENT' }],
        }),
    }),
});

export const {
    useGetRelationshipsQuery,
    useCreateRelationshipMutation,
    useUpdateRelationshipMutation,
    useAcceptRelationshipMutation,
    useRejectRelationshipMutation,
    useRemoveRelationshipMutation,
    useToggleFavoriteMutation,
    useGetSuggestionsQuery,
    useGetMutualConnectionsQuery,
    useGetContactGroupsQuery,
    useCreateContactGroupMutation,
    useUpdateContactGroupMutation,
    useDeleteContactGroupMutation,
    useAddMembersToGroupMutation,
    useRemoveMemberFromGroupMutation,
    useGetPrivacySettingsQuery,
    useUpdatePrivacySettingsMutation,
} = relationshipApi;
