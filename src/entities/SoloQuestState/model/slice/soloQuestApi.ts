// src/entities/SoloQuestState/model/slice/soloQuestApi.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';
import {
    AppealRequest,
    CheckInRequest,
    CheckInResponse,
    ApplicationActionRequest,
    CreateApplicationRequest,
    CreateSoloQuestRequest,
    SoloQuestApplication,
    SoloQuestDetails,
    SoloQuestFeedParams,
    UpdateProfileDetailsRequest,
    UserProfileDetails,
    UserReputation,
} from '../types';

export const soloQuestApi = createApi({
    reducerPath: 'soloQuestApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    tagTypes: ['SoloQuest', 'SoloQuestFeed', 'SoloQuestApplication', 'UserProfileDetails', 'Reputation'],
    endpoints: (builder) => ({

        // =================================================================
        // PROFILE (Phase 1)
        // =================================================================

        getMyProfileDetails: builder.query<UserProfileDetails, void>({
            query: () => '/profile/details',
            providesTags: ['UserProfileDetails'],
        }),

        updateMyProfileDetails: builder.mutation<UserProfileDetails, UpdateProfileDetailsRequest>({
            query: (body) => ({
                url: '/profile/details',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['UserProfileDetails'],
        }),

        getUserProfileDetails: builder.query<UserProfileDetails, number>({
            query: (userId) => `/users/${userId}/profile/details`,
            providesTags: (result, error, userId) => [{ type: 'UserProfileDetails', id: userId }],
        }),

        // =================================================================
        // SOLO QUEST CRUD (Phase 2)
        // =================================================================

        createSoloQuest: builder.mutation<SoloQuestDetails, CreateSoloQuestRequest>({
            query: (body) => ({
                url: '/solo-quests',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SoloQuest', 'SoloQuestFeed'],
        }),

        getSoloQuestFeed: builder.query<SoloQuestDetails[], SoloQuestFeedParams>({
            query: (params) => ({
                url: '/solo-quests/feed',
                params,
            }),
            providesTags: ['SoloQuestFeed'],
        }),

        getSoloQuest: builder.query<SoloQuestDetails, number>({
            query: (id) => `/solo-quests/${id}`,
            providesTags: (result, error, id) => [{ type: 'SoloQuest', id }],
        }),

        getMySoloQuests: builder.query<SoloQuestDetails[], void>({
            query: () => '/solo-quests/my',
            providesTags: ['SoloQuest'],
        }),

        cancelSoloQuest: builder.mutation<SoloQuestDetails, number>({
            query: (id) => ({
                url: `/solo-quests/${id}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'SoloQuest', id }],
        }),

        // =================================================================
        // APPLICATIONS (Phase 3)
        // =================================================================

        applyToQuest: builder.mutation<SoloQuestApplication, { id: number; body: CreateApplicationRequest }>({
            query: ({ id, body }) => ({
                url: `/solo-quests/${id}/applications`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SoloQuestApplication', 'SoloQuestFeed'],
        }),

        getQuestApplications: builder.query<SoloQuestApplication[], number>({
            query: (id) => `/solo-quests/${id}/applications`,
            providesTags: ['SoloQuestApplication'],
        }),

        getMyApplications: builder.query<SoloQuestApplication[], void>({
            query: () => '/solo-quests/my/applications',
            providesTags: ['SoloQuestApplication'],
        }),

        acceptApplication: builder.mutation<SoloQuestApplication, { applicationId: number; body: ApplicationActionRequest }>({
            query: ({ applicationId, body }) => ({
                url: `/solo-quests/applications/${applicationId}/accept`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SoloQuestApplication', 'SoloQuest'],
        }),

        declineApplication: builder.mutation<SoloQuestApplication, { applicationId: number; body: ApplicationActionRequest }>({
            query: ({ applicationId, body }) => ({
                url: `/solo-quests/applications/${applicationId}/decline`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SoloQuestApplication'],
        }),

        sendCounterMessage: builder.mutation<SoloQuestApplication, { applicationId: number; body: ApplicationActionRequest }>({
            query: ({ applicationId, body }) => ({
                url: `/solo-quests/applications/${applicationId}/message`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SoloQuestApplication'],
        }),

        replyToCounterMessage: builder.mutation<SoloQuestApplication, { applicationId: number; body: ApplicationActionRequest }>({
            query: ({ applicationId, body }) => ({
                url: `/solo-quests/applications/${applicationId}/reply`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['SoloQuestApplication'],
        }),

        withdrawApplication: builder.mutation<void, number>({
            query: (applicationId) => ({
                url: `/solo-quests/applications/${applicationId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['SoloQuestApplication'],
        }),

        // =================================================================
        // CHECK-IN (Phase 4)
        // =================================================================

        checkIn: builder.mutation<CheckInResponse, { id: number; body: CheckInRequest }>({
            query: ({ id, body }) => ({
                url: `/solo-quests/${id}/checkin`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'SoloQuest', id }],
        }),

        getQuestWager: builder.query<any, number>({
            query: (id) => `/solo-quests/${id}/wager`,
            providesTags: (result, error, id) => [{ type: 'SoloQuest', id }],
        }),

        disputeQuest: builder.mutation<void, number>({
            query: (id) => ({
                url: `/solo-quests/${id}/dispute`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'SoloQuest', id }],
        }),

        // =================================================================
        // REPUTATION (Phase 5)
        // =================================================================

        getUserReputation: builder.query<UserReputation, number>({
            query: (userId) => `/users/${userId}/reputation`,
            providesTags: (result, error, userId) => [{ type: 'Reputation', id: userId }],
        }),

        appealMark: builder.mutation<void, { userId: number; body: AppealRequest }>({
            query: ({ userId, body }) => ({
                url: `/users/${userId}/reputation/appeal`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { userId }) => [{ type: 'Reputation', id: userId }],
        }),
    }),
});

export const {
    useGetMyProfileDetailsQuery,
    useUpdateMyProfileDetailsMutation,
    useGetUserProfileDetailsQuery,
    useCreateSoloQuestMutation,
    useGetSoloQuestFeedQuery,
    useGetSoloQuestQuery,
    useGetMySoloQuestsQuery,
    useCancelSoloQuestMutation,
    useApplyToQuestMutation,
    useGetQuestApplicationsQuery,
    useGetMyApplicationsQuery,
    useAcceptApplicationMutation,
    useDeclineApplicationMutation,
    useSendCounterMessageMutation,
    useReplyToCounterMessageMutation,
    useWithdrawApplicationMutation,
    useCheckInMutation,
    useGetQuestWagerQuery,
    useDisputeQuestMutation,
    useGetUserReputationQuery,
    useAppealMarkMutation,
} = soloQuestApi;
