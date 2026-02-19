import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithAuth } from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';
import {
    QuestInvitationDTO,
    InvitationSummaryDTO,
    UserInvitationPreferencesDTO,
    CreateQuestInvitationRequest,
    RespondToInvitationRequest,
    CreateCounterOfferRequest,
    RespondToCounterOfferRequest,
    UpdateInvitationPreferencesRequest,
    QuestInvitationStatus,
} from '../types';

export const invitationApi = createApi({
    reducerPath: 'invitationApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    tagTypes: ['Invitation', 'InvitationPreferences', 'ReceivedInvitations', 'SentInvitations'],
    endpoints: (builder) => ({
        // Create invitation
        createInvitation: builder.mutation<QuestInvitationDTO, CreateQuestInvitationRequest>({
            query: (body) => ({
                url: '/invitations',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SentInvitations'],
        }),
        
        // Get received invitations
        getReceivedInvitations: builder.query<InvitationSummaryDTO[], QuestInvitationStatus[] | void>({
            query: (statuses) => {
                const params = new URLSearchParams();
                if (statuses) {
                    statuses.forEach(status => params.append('statuses', status));
                }
                return {
                    url: '/invitations/received',
                    params: statuses ? { statuses: statuses.join(',') } : undefined, // passing as comma separated string usually works or multiple params
                };
            },
            providesTags: ['ReceivedInvitations'],
        }),
        
        // Get sent invitations
        getSentInvitations: builder.query<InvitationSummaryDTO[], void>({
            query: () => '/invitations/sent',
            providesTags: ['SentInvitations'],
        }),
        
        // Get invitation details
        getInvitation: builder.query<QuestInvitationDTO, number>({
            query: (id) => `/invitations/${id}`,
            providesTags: (result, error, id) => [{ type: 'Invitation', id }],
        }),
        
        // Respond to invitation
        respondToInvitation: builder.mutation<QuestInvitationDTO, { id: number; body: RespondToInvitationRequest }>({
            query: ({ id, body }) => ({
                url: `/invitations/${id}/respond`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Invitation', id },
                'ReceivedInvitations',
            ],
        }),
        
        // Cancel invitation
        cancelInvitation: builder.mutation<void, number>({
            query: (id) => ({
                url: `/invitations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['SentInvitations'],
        }),
        
        // Create counter-offer
        createCounterOffer: builder.mutation<QuestInvitationDTO, { id: number; body: CreateCounterOfferRequest }>({
            query: ({ id, body }) => ({
                url: `/invitations/${id}/counter-offer`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Invitation', id },
                'ReceivedInvitations',
            ],
        }),
        
        // Respond to counter-offer
        respondToCounterOffer: builder.mutation<QuestInvitationDTO, { 
            invitationId: number; 
            negotiationId: number; 
            body: RespondToCounterOfferRequest 
        }>({
            query: ({ invitationId, negotiationId, body }) => ({
                url: `/invitations/${invitationId}/negotiations/${negotiationId}/respond`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { invitationId }) => [
                { type: 'Invitation', id: invitationId },
                'SentInvitations',
            ],
        }),
        
        // Check if can invite
        canInviteUser: builder.query<{ canInvite: boolean }, number>({
            query: (targetUserId) => `/invitations/can-invite/${targetUserId}`,
        }),
        
        // Get preferences
        getInvitationPreferences: builder.query<UserInvitationPreferencesDTO, void>({
            query: () => '/users/me/invitation-preferences',
            providesTags: ['InvitationPreferences'],
        }),
        
        // Update preferences
        updateInvitationPreferences: builder.mutation<UserInvitationPreferencesDTO, UpdateInvitationPreferencesRequest>({
            query: (body) => ({
                url: '/users/me/invitation-preferences',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['InvitationPreferences'],
        }),
    }),
});

export const {
    useCreateInvitationMutation,
    useGetReceivedInvitationsQuery,
    useGetSentInvitationsQuery,
    useGetInvitationQuery,
    useRespondToInvitationMutation,
    useCancelInvitationMutation,
    useCreateCounterOfferMutation,
    useRespondToCounterOfferMutation,
    useCanInviteUserQuery,
    useGetInvitationPreferencesQuery,
    useUpdateInvitationPreferencesMutation,
} = invitationApi;
