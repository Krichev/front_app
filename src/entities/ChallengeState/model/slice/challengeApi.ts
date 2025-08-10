// src/entities/ChallengeState/model/slice/challengeApi.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {RootState} from "../../../../app/providers/StoreProvider/store";
import {CreateQuizQuestionRequest, QuizQuestion} from "../../../QuizState/model/slice/quizApi.ts";

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
    participants: string[] | string | null; // Allow multiple types for participants
    reward?: string;
    penalty?: string;
    verificationMethod?: string; // JSON string of VerificationMethod[]
    targetGroup?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'ONE_TIME';
    startDate?: string;
    endDate?: string;
    quizConfig?: string; // JSON string of QuizConfig
    userIsCreator?: boolean; // Flag indicating if the current user is the creator
    userRole?: string; // Optional field to store the user's role (CREATOR, PARTICIPANT, etc.)
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
    verificationDetails?: Record<string, any>;  // ✅ Add this missing field
    targetGroup?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'ONE_TIME';
    startDate?: string;   // ✅ Changed to string
    endDate?: string;     // ✅ Changed to string
    tags?: string[];      // ✅ Add this missing field
    quizConfig?: string;
}

// Backend Quiz Challenge Config - matches Java QuizChallengeConfig
export interface QuizChallengeConfig {
    defaultDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
    defaultRoundTimeSeconds: number;
    defaultTotalRounds: number;
    enableAiHost: boolean;
    questionSource: string;
    allowCustomQuestions: boolean;
}

// Correct CreateQuizChallengeRequest interface that matches the Java backend exactly
export interface CreateQuizChallengeRequest {
    title: string;
    description: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    startDate?: Date;
    endDate?: Date;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONE_TIME';
    quizConfig: QuizChallengeConfig; // Required, matches backend
    customQuestions: CreateQuizQuestionRequest[]; // Backend expects 'customQuestions'
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
    image: any; // FormData
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
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://10.0.2.2:8082/challenger/api',
        prepareHeaders: (headers, {getState}) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
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
            query: ({keyword, limit = 10}) => ({
                url: '/challenges/search',
                params: {keyword, limit},
            }),
            providesTags: [{type: 'Challenge', id: 'SEARCH'}],
        }),

        // Photo verification for challenges
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

        // Location verification for challenges
        verifyLocationChallenge: builder.mutation<VerificationResponse, LocationVerificationRequest>({
            query: ({challengeId, latitude, longitude, accuracy}) => ({
                url: `/challenges/${challengeId}/verify/location`,
                method: 'POST',
                body: {latitude, longitude, accuracy},
            }),
            invalidatesTags: (result, error, {challengeId}) => [{type: 'Verification', id: challengeId}],
        }),

        // Get verification history for a challenge
        getVerificationHistory: builder.query<VerificationResponse[], {challengeId: string; userId?: string}>({
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

        // Create quiz challenge with question saving
        createQuizChallenge: builder.mutation<ApiChallenge, CreateQuizChallengeRequest>({
            query: (request) => ({
                url: '/challenges/quiz',
                method: 'POST',
                body: request, // Direct pass-through since interfaces now match
            }),
            invalidatesTags: [{type: 'Challenge', id: 'LIST'}],
        }),

        // Save quiz questions for reuse
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

        // Get saved questions for a challenge
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
    // New endpoints
    useVerifyPhotoChallengeMutation,
    useVerifyLocationChallengeMutation,
    useGetVerificationHistoryQuery,
    // Enhanced endpoints
    useCreateQuizChallengeMutation,
    useSaveQuizQuestionsForChallengeMutation,
    useGetQuestionsForChallengeQuery,
} = enhancedChallengeApi;
