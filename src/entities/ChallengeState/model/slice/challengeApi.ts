// src/entities/ChallengeState/model/slice/challengeApi.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import {CreateQuizQuestionRequest, QuizQuestion} from '../../../QuizState/model/slice/quizApi';
import NetworkConfigManager from '../../../../config/NetworkConfig';
// Import types from centralized types file
import type {
    ApiChallenge,
    ChallengeAccessUser,
    CreateChallengeRequest,
    CreateQuizChallengeRequest,
    CurrencyType,
    GetChallengesParams,
    LocationVerificationRequest,
    PaymentType,
    PhotoVerificationRequest,
    VerificationResponse,
    QuestAudioConfig,
    QuestAudioResponse,
    UpdateQuestAudioConfigRequest,
    UploadQuestAudioRequest,
    UploadAudioResponse,
    ChallengeAudioResponse,
    UpdateChallengeAudioConfigRequest,
} from '../types';


// Get base URL from centralized config
const BASE_URL = NetworkConfigManager.getInstance().getBaseUrl();

export const challengeApi = createApi({
    reducerPath: 'challengeApi',
    baseQuery: createBaseQueryWithAuth(BASE_URL),
    tagTypes: ['Challenge', 'Verification', 'QuizQuestion', 'ChallengeAccess', 'Quest'],
    endpoints: (builder) => ({
        // Existing endpoints
        getChallenges: builder.query<ApiChallenge[], GetChallengesParams>({
            query: (params) => ({
                url: '/challenges',
                params: {
                    ...params,
                    type: params.type === null ? undefined : params.type,
                },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({id}) => ({type: 'Challenge' as const, id})),
                        {type: 'Challenge', id: 'LIST'},
                    ]
                    : [{type: 'Challenge', id: 'LIST'}],
        }),

        // NEW: Get accessible challenges (public + user's private challenges)
        getAccessibleChallenges: builder.query<ApiChallenge[], {
            page?: number;
            size?: number;
        }>({
            query: ({ page = 0, size = 20 }) => ({
                url: '/challenges/accessible',
                params: { page, size },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Challenge' as const, id })),
                        { type: 'Challenge', id: 'LIST' },
                    ]
                    : [{ type: 'Challenge', id: 'LIST' }],
        }),

        getChallengeById: builder.query<ApiChallenge, string>({
            query: (id) => `/challenges/${id}`,
            providesTags: (result, error, id) => [{type: 'Challenge', id}],
        }),

        createChallenge: builder.mutation<ApiChallenge, CreateChallengeRequest>({
            query: (challenge) => ({
                url: '/challenges',
                method: 'POST',
                body: challenge,
            }),
            invalidatesTags: [{type: 'Challenge', id: 'LIST'}],
        }),

        updateChallenge: builder.mutation<ApiChallenge, {id: string} & Partial<CreateChallengeRequest>>({
            query: ({id, ...challenge}) => ({
                url: `/challenges/${id}`,
                method: 'PUT',
                body: challenge,
            }),
            invalidatesTags: (result, error, {id}) => [{type: 'Challenge', id}],
        }),

        deleteChallenge: builder.mutation<{message: string}, string>({
            query: (id) => ({
                url: `/challenges/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{type: 'Challenge', id}],
        }),

        joinChallenge: builder.mutation<{message: string}, {challengeId: string; userId?: string}>({
            query: ({challengeId, userId}) => ({
                url: `/challenges/${challengeId}/join`,
                method: 'POST',
                body: userId ? {userId} : {},
            }),
            invalidatesTags: (result, error, {challengeId}) => [{type: 'Challenge', id: challengeId}],
        }),

        submitChallengeCompletion: builder.mutation<{message: string}, {challengeId: string; completionData: any}>({
            query: ({challengeId, completionData}) => ({
                url: `/challenges/${challengeId}/complete`,
                method: 'POST',
                body: completionData,
            }),
            invalidatesTags: (result, error, {challengeId}) => [{type: 'Challenge', id: challengeId}],
        }),

        verifyChallengeCompletion: builder.mutation<VerificationResponse, {challengeId: string; verificationData: any}>({
            query: ({challengeId, verificationData}) => ({
                url: `/challenges/${challengeId}/verify`,
                method: 'POST',
                body: verificationData,
            }),
            invalidatesTags: (result, error, {challengeId}) => [{type: 'Challenge', id: challengeId}],
        }),

        searchChallenges: builder.query<ApiChallenge[], {
            q?: string;
            keyword?: string;
            page?: number;
            size?: number;
            limit?: number;
        }>({
            query: ({q, keyword, page = 0, size = 20, limit = 20}) => ({
                url: '/challenges/search',
                params: {
                    q: q || keyword,
                    page,
                    size: size || limit,
                },
            }),
            providesTags: [{type: 'Challenge', id: 'SEARCH'}],
        }),

        verifyPhotoChallenge: builder.mutation<VerificationResponse, PhotoVerificationRequest>({
            query: ({challengeId, image, prompt, aiPrompt}) => {
                const formData = new FormData();
                formData.append('image', image);
                if (prompt) formData.append('prompt', prompt);
                if (aiPrompt) formData.append('aiPrompt', aiPrompt);

                return {
                    url: `/challenges/${challengeId}/verify/photo`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: (result, error, {challengeId}) => [{type: 'Verification', id: challengeId}],
        }),

        verifyLocationChallenge: builder.mutation<VerificationResponse, LocationVerificationRequest>({
            query: ({challengeId, ...locationData}) => ({
                url: `/challenges/${challengeId}/verify/location`,
                method: 'POST',
                body: locationData,
            }),
            invalidatesTags: (result, error, {challengeId}) => [{type: 'Verification', id: challengeId}],
        }),

        getVerificationHistory: builder.query<any[], {challengeId: string; userId?: string}>({
            query: ({challengeId, userId}) => ({
                url: `/challenges/${challengeId}/verifications`,
                params: userId ? {userId} : undefined,
            }),
            providesTags: (_, __, {challengeId}) => [{type: 'Verification', id: challengeId}],
        }),

        // NEW: Grant access to users for private challenge
        grantAccess: builder.mutation<{ message: string }, {
            challengeId: string;
            userIds: number[];
        }>({
            query: ({ challengeId, userIds }) => ({
                url: `/challenges/${challengeId}/access/grant`,
                method: 'POST',
                body: { userIds },
            }),
            invalidatesTags: (result, error, { challengeId }) => [
                { type: 'Challenge', id: challengeId },
                { type: 'ChallengeAccess', id: challengeId },
            ],
        }),

        // NEW: Revoke access from user
        revokeAccess: builder.mutation<{ message: string }, {
            challengeId: string;
            userId: string;
        }>({
            query: ({ challengeId, userId }) => ({
                url: `/challenges/${challengeId}/access/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { challengeId }) => [
                { type: 'Challenge', id: challengeId },
                { type: 'ChallengeAccess', id: challengeId },
            ],
        }),

        // NEW: Get access list for private challenge
        getChallengeAccessList: builder.query<ChallengeAccessUser[], string>({
            query: (challengeId) => `/challenges/${challengeId}/access`,
            providesTags: (result, error, challengeId) => [
                { type: 'ChallengeAccess', id: challengeId },
            ],
        }),
    }),
});

export const enhancedChallengeApi = challengeApi.injectEndpoints({
    endpoints: (builder) => ({
        createQuizChallenge: builder.mutation<ApiChallenge, CreateQuizChallengeRequest>({
            query: (request) => ({
                url: '/challenges/quiz',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: [{type: 'Challenge', id: 'LIST'}],
        }),

        saveQuizQuestionsForChallenge: builder.mutation<QuizQuestion[], {
            challengeId: string;
            questions: CreateQuizQuestionRequest[];
        }>({
            query: ({challengeId, questions}) => ({
                url: `/challenges/${challengeId}/questions`,
                method: 'POST',
                body: {questions},
            }),
            invalidatesTags: [{type: 'QuizQuestion', id: 'USER_LIST'}],
        }),

        getQuestionsForChallenge: builder.query<QuizQuestion[], {
            challengeId: string;
            difficulty?: string;
            count?: number;
        }>({
            query: ({challengeId, difficulty, count = 10}) => ({
                url: `/challenges/${challengeId}/questions`,
                params: {difficulty, count},
            }),
            providesTags: (result, error, {challengeId}) => [
                {type: 'QuizQuestion', id: `CHALLENGE_${challengeId}`}
            ],
        }),

        // =============================================================================
        // QUEST AUDIO ENDPOINTS
        // =============================================================================

        updateQuestAudioConfig: builder.mutation<QuestAudioResponse, UpdateQuestAudioConfigRequest>({
            query: ({ questId, audioConfig }) => ({
                url: `/quests/${questId}/audio-config`,
                method: 'PUT',
                body: audioConfig,
            }),
            invalidatesTags: (result, error, { questId }) => [
                { type: 'Quest', id: questId },
                { type: 'Quest', id: 'LIST' },
            ],
        }),

        getQuestAudioConfig: builder.query<QuestAudioResponse | null, number>({
            query: (questId) => `/quests/${questId}/audio-config`,
            providesTags: (result, error, questId) => [
                { type: 'Quest', id: questId },
            ],
        }),

        removeQuestAudioConfig: builder.mutation<void, number>({
            query: (questId) => ({
                url: `/quests/${questId}/audio-config`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, questId) => [
                { type: 'Quest', id: questId },
                { type: 'Quest', id: 'LIST' },
            ],
        }),

        uploadQuestAudio: builder.mutation<UploadAudioResponse, UploadQuestAudioRequest>({
            query: ({ questId, audioFile }) => {
                const formData = new FormData();
                formData.append('file', {
                    uri: audioFile.uri,
                    name: audioFile.name,
                    type: audioFile.type,
                } as any);

                return {
                    url: `/quests/${questId}/audio`,
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                };
            },
            invalidatesTags: (result, error, { questId }) => [
                { type: 'Quest', id: questId },
            ],
        }),

        // =============================================================================
        // CHALLENGE AUDIO CONFIG ENDPOINTS
        // =============================================================================

        getChallengeAudioConfig: builder.query<ChallengeAudioResponse | null, string>({
            query: (challengeId) => `/challenges/${challengeId}/audio-config`,
            providesTags: (result, error, challengeId) => [
                { type: 'Challenge', id: `AUDIO_${challengeId}` },
            ],
        }),

        updateChallengeAudioConfig: builder.mutation<ChallengeAudioResponse, {
            challengeId: string;
            config: UpdateChallengeAudioConfigRequest;
        }>({
            query: ({ challengeId, config }) => ({
                url: `/challenges/${challengeId}/audio-config`,
                method: 'PUT',
                body: config,
            }),
            invalidatesTags: (result, error, { challengeId }) => [
                { type: 'Challenge', id: challengeId },
                { type: 'Challenge', id: `AUDIO_${challengeId}` },
            ],
        }),

        removeChallengeAudioConfig: builder.mutation<void, string>({
            query: (challengeId) => ({
                url: `/challenges/${challengeId}/audio-config`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, challengeId) => [
                { type: 'Challenge', id: challengeId },
                { type: 'Challenge', id: `AUDIO_${challengeId}` },
            ],
        }),
    }),
});

// Export all hooks
export const {
    // Existing hooks
    useGetChallengesQuery,
    useGetChallengeByIdQuery,
    useCreateChallengeMutation,
    useUpdateChallengeMutation,
    useDeleteChallengeMutation,
    useJoinChallengeMutation,
    useSubmitChallengeCompletionMutation,
    useVerifyChallengeCompletionMutation,
    useSearchChallengesQuery,
    useVerifyPhotoChallengeMutation,
    useVerifyLocationChallengeMutation,
    useGetVerificationHistoryQuery,

    // Quiz-related hooks
    useCreateQuizChallengeMutation,
    useSaveQuizQuestionsForChallengeMutation,
    useGetQuestionsForChallengeQuery,

    // NEW: Access control hooks
    useGetAccessibleChallengesQuery,
    useGrantAccessMutation,
    useRevokeAccessMutation,
    useGetChallengeAccessListQuery,

    // Quest audio hooks
    useUpdateQuestAudioConfigMutation,
    useGetQuestAudioConfigQuery,
    useRemoveQuestAudioConfigMutation,
    useUploadQuestAudioMutation,

    // Challenge audio config hooks
    useGetChallengeAudioConfigQuery,
    useUpdateChallengeAudioConfigMutation,
    useRemoveChallengeAudioConfigMutation,
} = enhancedChallengeApi;

// Re-export types for convenience
export type {
    ApiChallenge,
    CreateChallengeRequest,
    GetChallengesParams,
    VerificationResponse,
    PhotoVerificationRequest,
    LocationVerificationRequest,
    ChallengeAccessUser,
    CreateQuizChallengeRequest,
    // ===== ADD THESE TWO NEW EXPORTS =====
    PaymentType,
    CurrencyType,
};