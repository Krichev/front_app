// src/entities/ChallengeState/model/slice/challengeApi.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {RootState} from "../../../../app/providers/StoreProvider/store";

// Define challenge types based on your DB schema
export interface Challenge {
    id: string;
    title: string;
    description?: string;
    type: string;
    visibility: string;
    status: string;
    created_at: string;
    updated_at: string;
    creator_id: string;
    reward?: string;
    penalty?: string;
    verificationMethod?: string; // JSON string of VerificationMethod[]
    targetGroup?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'ONE_TIME';
    startDate?: string;
    endDate?: string;
}

export interface CreateChallengeRequest {
    title: string;
    description?: string;
    type: string;
    visibility: string;
    status: string;
    reward?: string;
    penalty?: string;
    verificationMethod?: string; // JSON string of VerificationMethod[]
    targetGroup?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'ONE_TIME';
    startDate?: Date;
    endDate?: Date;
}

export interface GetChallengesParams {
    page?: number;
    limit?: number;
    type?: string;
    visibility?: string;
    status?: string;
    creator_id?: string;
    targetGroup?: string;
    participant_id?: string;
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

export const challengeApi = createApi({
    reducerPath: 'challengeApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://10.0.2.2:8082/challenger/api',
        prepareHeaders: (headers, {getState}) => {
            // Get the token from the state
            const token = (getState() as RootState).auth.accessToken;

            // If we have a token, add it to the headers
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }

            return headers;
        },
    }),
    tagTypes: ['Challenge', 'Verification'],
    endpoints: (builder) => ({
        // Get all challenges with filtering
        getChallenges: builder.query<Challenge[], GetChallengesParams>({
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
        getChallengeById: builder.query<Challenge, string>({
            query: (id) => `/challenges/${id}`,
            providesTags: (_, __, id) => [{type: 'Challenge', id}],
        }),

        // Create a new challenge
        createChallenge: builder.mutation<Challenge, CreateChallengeRequest>({
            query: (body) => ({
                url: '/challenges',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{type: 'Challenge', id: 'LIST'}],
        }),

        // Update an existing challenge
        updateChallenge: builder.mutation<Challenge, Partial<Challenge> & { id: string }>({
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
        submitChallengeCompletion: builder.mutation<void, { id: string; proof?: any }>({
            query: ({id, proof}) => ({
                url: `/challenges/${id}/complete`,
                method: 'POST',
                body: {proof},
            }),
            invalidatesTags: (_, __, {id}) => [{type: 'Challenge', id}],
        }),

        // Verify/approve challenge completion (for group admins)
        verifyChallengeCompletion: builder.mutation<void, { id: string; userId: string; approved: boolean }>({
            query: ({id, userId, approved}) => ({
                url: `/challenges/${id}/verify`,
                method: 'POST',
                body: {userId, approved},
            }),
            invalidatesTags: (_, __, {id}) => [{type: 'Challenge', id}],
        }),

        // Search challenges by keyword
        searchChallenges: builder.query<Challenge[], string>({
            query: (searchTerm) => ({
                url: '/challenges/search',
                params: {q: searchTerm},
            }),
            providesTags: [{type: 'Challenge', id: 'SEARCH'}],
        }),

        // NEW ENDPOINTS FOR VERIFICATION

        // Verify challenge with photo
        verifyPhotoChallenge: builder.mutation<VerificationResponse, FormData>({
            query: (formData) => ({
                url: '/verification/photo',
                method: 'POST',
                body: formData,
                formData: true,  // Important for multipart/form/data
            }),
            invalidatesTags: (_, __, formData) => {
                // Cast formData to any before using the get method
                const challengeId = (formData as any).get('challengeId')?.toString();
                return challengeId
                    ? [{type: 'Challenge', id: challengeId}, {type: 'Verification', id: challengeId}]
                    : [{type: 'Verification', id: 'LIST'}];
            },
        }),

        // Verify challenge with location
        verifyLocationChallenge: builder.mutation<VerificationResponse, LocationVerificationRequest>({
            query: (data) => ({
                url: '/verification/location',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (_, __, {challengeId}) => [
                {type: 'Challenge', id: challengeId},
                {type: 'Verification', id: challengeId}
            ],
        }),

        // Get verification history
        getVerificationHistory: builder.query<any[], { challengeId: string; userId?: string }>({
            query: ({challengeId, userId}) => ({
                url: `/challenges/${challengeId}/verifications`,
                params: userId ? {userId} : undefined,
            }),
            providesTags: (_, __, {challengeId}) => [{type: 'Verification', id: challengeId}],
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
} = challengeApi;