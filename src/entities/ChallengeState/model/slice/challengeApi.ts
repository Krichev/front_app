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

// UPDATED: Added verificationDetails field to match backend
export interface CreateChallengeRequest {
    title: string;
    description?: string;
    type: string;
    visibility: string;
    status?: string;
    reward?: string;
    penalty?: string;
    verificationMethod?: string; // Single verification method enum: 'PHOTO' | 'LOCATION' | 'QUIZ' | 'MANUAL' | 'FITNESS_API' | 'ACTIVITY'
    verificationDetails?: Record<string, any>; // ADDED: Map for verification details
    targetGroup?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'ONE_TIME';
    startDate?: string; // Changed from Date to string to match backend LocalDateTime
    endDate?: string;   // Changed from Date to string to match backend LocalDateTime
    tags?: string[];    // ADDED: Support for tags
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
    timestamp: string;
}

// ADDED: Interface for quiz challenge creation
export interface CreateQuizChallengeRequest extends CreateChallengeRequest {
    questions: CreateQuizQuestionRequest[];
}

export const challengeApi = createApi({
    reducerPath: 'challengeApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://10.0.2.2:8082/challenger/api',
        prepareHeaders: (headers, {getState}) => {
            // Get the token from the state
            const token = (getState() as RootState).auth.accessToken;

            // If we have a token, add it to the headers
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            return headers;
        },
    }),
    tagTypes: ['Challenge', 'Verification', 'QuizQuestion'],
    endpoints: (builder) => ({
        // Get all challenges with filtering
        getChallenges: builder.query<ApiChallenge[], GetChallengesParams>({
            query: (params) => ({
                url: '/challenges',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({id}) => ({type: 'Challenge' as const, id})),
                        {type: 'Challenge', id: 'LIST'},
                    ]
                    : [{type: 'Challenge', id: 'LIST'}],
        }),

        // Get a single challenge by ID
        getChallengeById: builder.query<ApiChallenge, string>({
            query: (id) => {
                if (!id) {
                    throw new Error('Invalid challenge ID');
                }
                return `/challenges/${id}`;
            },
            providesTags: (_, __, id) => [{type: 'Challenge', id}],
        }),

        // Create a new challenge
        createChallenge: builder.mutation<ApiChallenge, CreateChallengeRequest>({
            query: (body) => ({
                url: '/challenges',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{type: 'Challenge', id: 'LIST'}],
        }),

        // Update an existing challenge
        updateChallenge: builder.mutation<ApiChallenge, Partial<ApiChallenge> & { id: string }>({
            query: ({id, ...patch}) => ({
                url: `/challenges/${id}`,
                method: 'PATCH',
                body: patch,
            }),
            invalidatesTags: (_, __, {id}) => [{type: 'Challenge', id}],
        }),

        // Delete a challenge
        deleteChallenge: builder.mutation<void, string>({
            query: (id) => ({
                url: `/challenges/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_, __, id) => [{type: 'Challenge', id}],
        }),

        // Join a challenge
        joinChallenge: builder.mutation<void, string>({
            query: (id) => ({
                url: `/challenges/${id}/join`,
                method: 'POST',
            }),
            invalidatesTags: (_, __, id) => [{type: 'Challenge', id}],
        }),

        // Complete a challenge or submit verification
        submitChallengeCompletion: builder.mutation<void, { id: string; proof?: any; notes?: string }>({
            query: ({id, proof, notes}) => ({
                url: `/challenges/${id}/complete`,
                method: 'POST',
                body: {
                    verificationData: proof,
                    notes,
                },
            }),
            invalidatesTags: (_, __, {id}) => [{type: 'Challenge', id}, {type: 'Verification', id}],
        }),

        // Verify challenge completion (admin/creator only)
        verifyChallengeCompletion: builder.mutation<void, {
            challengeId: string;
            userId: string;
            approved: boolean
        }>({
            query: ({challengeId, userId, approved}) => ({
                url: `/challenges/${challengeId}/verify`,
                method: 'POST',
                body: {
                    userId,
                    approved,
                },
            }),
            invalidatesTags: (_, __, {challengeId}) => [
                {type: 'Challenge', id: challengeId},
                {type: 'Verification', id: challengeId}
            ],
        }),

        // Search challenges
        searchChallenges: builder.query<ApiChallenge[], { q: string }>({
            query: ({q}) => ({
                url: '/challenges/search',
                params: {q},
            }),
            providesTags: [{type: 'Challenge', id: 'SEARCH'}],
        }),

        // Photo verification
        verifyPhotoChallenge: builder.mutation<VerificationResponse, PhotoVerificationRequest>({
            query: ({challengeId, image, prompt, aiPrompt}) => {
                const formData = new FormData();
                formData.append('challengeId', challengeId);
                formData.append('image', image);
                if (prompt) formData.append('prompt', prompt);
                if (aiPrompt) formData.append('aiPrompt', aiPrompt);

                return {
                    url: '/verification/photo',
                    method: 'POST',
                    body: formData,
                    formData: true,
                };
            },
            invalidatesTags: (_, __, {challengeId}) => [{type: 'Verification', id: challengeId}],
        }),

        // Location verification
        verifyLocationChallenge: builder.mutation<VerificationResponse, LocationVerificationRequest>({
            query: (body) => ({
                url: '/verification/location',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_, __, {challengeId}) => [{type: 'Verification', id: challengeId}],
        }),

        // Get verification history
        getVerificationHistory: builder.query<Array<Record<string, any>>, {
            challengeId: string;
            userId?: string
        }>({
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
                body: request,
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
    // Verification endpoints
    useVerifyPhotoChallengeMutation,
    useVerifyLocationChallengeMutation,
    useGetVerificationHistoryQuery,
} = challengeApi;

export const {
    useCreateQuizChallengeMutation,
    useSaveQuizQuestionsForChallengeMutation,
    useGetQuestionsForChallengeQuery,
} = enhancedChallengeApi;