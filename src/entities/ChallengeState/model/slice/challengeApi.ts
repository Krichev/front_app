// src/entities/ChallengeState/model/slice/challengeApi.ts - UPDATED
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import {CreateQuizQuestionRequest, QuizQuestion} from '../../../QuizState/model/slice/quizApi';

// Update the Challenge interface with proper participants typing
export interface ApiChallenge {
    id: string;
    title: string;
    description?: string;
    type: string;
    visibility: string;
    status: string;
    created_at: string;
    updated_at: string;
    creator_id: string;
    participants: string[] | string | null;
    reward?: string;
    penalty?: string;
    verificationMethod?: string;
    targetGroup?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'ONE_TIME';
    startDate?: string;
    endDate?: string;
    quizConfig?: string;
    userIsCreator?: boolean;
    userRole?: string;
}

export interface CreateChallengeRequest {
    title: string;
    description?: string;
    type: string;
    visibility: string;
    status: string;
    reward?: string;
    penalty?: string;
    verificationMethod?: string;
    verificationDetails?: Record<string, any>;
    targetGroup?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'ONE_TIME';
    startDate?: string;
    endDate?: string;
    tags?: string[];
    quizConfig?: string;
}

export interface QuizChallengeConfig {
    defaultDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
    defaultRoundTimeSeconds: number;
    defaultTotalRounds: number;
    enableAiHost: boolean;
    questionSource: string;
    allowCustomQuestions: boolean;
    gameType: string;
    teamName: string;
    teamMembers: string[];
    teamBased?: boolean;
}

export interface CreateQuizChallengeRequest {
    title: string;
    description: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    startDate?: Date;
    endDate?: Date;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONE_TIME';
    quizConfig: QuizChallengeConfig;
    customQuestions: CreateQuizQuestionRequest[];
}

export interface GetChallengesParams {
    page?: number;
    limit?: number;
    type?: string | null;
    visibility?: string;
    status?: string;
    creator_id?: string;
    targetGroup?: string;
    participant_id?: string | undefined;
}

export interface VerificationResponse {
    success: boolean;
    isVerified: boolean;
    message: string;
    details?: Record<string, any>;
}

export interface PhotoVerificationRequest {
    challengeId: string;
    image: any;
    prompt?: string;
    aiPrompt?: string;
}

export interface LocationVerificationRequest {
    challengeId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export const challengeApi = createApi({
    reducerPath: 'challengeApi',
    baseQuery: createBaseQueryWithAuth('http://10.0.2.2:8082/challenger/api'),
    tagTypes: ['Challenge', 'Verification', 'QuizQuestion'],
    endpoints: (builder) => ({
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

        searchChallenges: builder.query<ApiChallenge[], {keyword: string; limit?: number}>({
            query: ({keyword, limit = 20}) => ({
                url: '/challenges/search',
                params: {keyword, limit},
            }),
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
    }),
});

export const {
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
    useCreateQuizChallengeMutation,
    useSaveQuizQuestionsForChallengeMutation,
    useGetQuestionsForChallengeQuery,
} = enhancedChallengeApi;