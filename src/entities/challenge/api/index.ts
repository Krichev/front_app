// src/entities/challenge/api/index.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {baseQuery} from '../../../shared/api';
import type {Challenge, ChallengeFilters, CreateChallengeRequest, VerificationRecord,} from '../model/types';

export const challengeApi = createApi({
    reducerPath: 'challengeApi',
    baseQuery: baseQuery,
    tagTypes: ['Challenge', 'Verification'],
    endpoints: (builder) => ({
        // Get challenges with filters
        getChallenges: builder.query<Challenge[], ChallengeFilters>({
            query: (filters) => ({
                url: '/challenges',
                params: filters,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({id}) => ({type: 'Challenge' as const, id})),
                        {type: 'Challenge', id: 'LIST'},
                    ]
                    : [{type: 'Challenge', id: 'LIST'}],
        }),

        // Get single challenge
        getChallengeById: builder.query<Challenge, string>({
            query: (id) => `/challenges/${id}`,
            providesTags: (result, error, id) => [{type: 'Challenge', id}],
        }),

        // Create challenge
        createChallenge: builder.mutation<Challenge, CreateChallengeRequest>({
            query: (body) => ({
                url: '/challenges',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{type: 'Challenge', id: 'LIST'}],
        }),

        // Update challenge
        updateChallenge: builder.mutation<Challenge, {
            id: string;
            data: Partial<Challenge>;
        }>({
            query: ({id, data}) => ({
                url: `/challenges/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, {id}) => [
                {type: 'Challenge', id},
                {type: 'Challenge', id: 'LIST'},
            ],
        }),

        // Delete challenge
        deleteChallenge: builder.mutation<void, string>({
            query: (id) => ({
                url: `/challenges/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                {type: 'Challenge', id},
                {type: 'Challenge', id: 'LIST'},
            ],
        }),

        // Join challenge
        joinChallenge: builder.mutation<void, string>({
            query: (id) => ({
                url: `/challenges/${id}/join`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [
                {type: 'Challenge', id},
            ],
        }),

        // Leave challenge
        leaveChallenge: builder.mutation<void, string>({
            query: (id) => ({
                url: `/challenges/${id}/leave`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [
                {type: 'Challenge', id},
            ],
        }),

        // Submit challenge completion
        submitChallengeCompletion: builder.mutation<void, {
            id: string;
            proof?: any;
        }>({
            query: ({id, proof}) => ({
                url: `/challenges/${id}/complete`,
                method: 'POST',
                body: {proof},
            }),
            invalidatesTags: (result, error, {id}) => [
                {type: 'Challenge', id},
                {type: 'Verification', id},
            ],
        }),

        // Verify challenge completion
        verifyChallengeCompletion: builder.mutation<void, {
            id: string;
            userId: string;
            approved: boolean;
            feedback?: string;
        }>({
            query: ({id, userId, approved, feedback}) => ({
                url: `/challenges/${id}/verify`,
                method: 'POST',
                body: {userId, approved, feedback},
            }),
            invalidatesTags: (result, error, {id}) => [
                {type: 'Challenge', id},
                {type: 'Verification', id},
            ],
        }),

        // Get verification history
        getVerificationHistory: builder.query<VerificationRecord[], {
            challengeId: string;
            userId?: string;
        }>({
            query: ({challengeId, userId}) => ({
                url: `/challenges/${challengeId}/verifications`,
                params: userId ? {userId} : undefined,
            }),
            providesTags: (result, error, {challengeId}) => [
                {type: 'Verification', id: challengeId},
            ],
        }),

        // Search challenges
        searchChallenges: builder.query<Challenge[], string>({
            query: (searchTerm) => ({
                url: '/challenges/search',
                params: {q: searchTerm},
            }),
            providesTags: [{type: 'Challenge', id: 'SEARCH'}],
        }),

        // Get user's challenges
        getUserChallenges: builder.query<Challenge[], {
            userId: string;
            type?: 'created' | 'joined' | 'completed';
        }>({
            query: ({userId, type}) => ({
                url: `/users/${userId}/challenges`,
                params: type ? {type} : undefined,
            }),
            providesTags: (result, error, {userId}) => [
                {type: 'Challenge', id: `USER_${userId}`},
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
    useLeaveChallengeM

    ,
    useSubmitChallengeCompletionMutation,
    useVerifyChallengeCompletionMutation,
    useGetVerificationHistoryQuery,
    useSearchChallengesQuery,
    useGetUserChallengesQuery,
} = challengeApi;