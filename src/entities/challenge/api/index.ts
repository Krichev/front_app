// src/entities/challenge/api/index.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import type {Challenge, ChallengeParticipant} from '../model/types';

export const challengeApi = createApi({
    reducerPath: 'challengeApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/challenges/',
        prepareHeaders: (headers, { getState }) => {
            // Add auth token if available
            // const token = selectAuthToken(getState());
            // if (token) headers.set('authorization', `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ['Challenge', 'Participation'],
    endpoints: (builder) => ({
        getChallenges: builder.query<Challenge[], {
            status?: string;
            type?: string;
            limit?: number;
        }>({
            query: (params) => ({
                url: '',
                params,
            }),
            providesTags: ['Challenge'],
        }),

        getChallengeById: builder.query<Challenge, string>({
            query: (id) => id,
            providesTags: (result, error, id) => [{ type: 'Challenge', id }],
        }),

        createChallenge: builder.mutation<Challenge, Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>>({
            query: (challengeData) => ({
                url: '',
                method: 'POST',
                body: challengeData,
            }),
            invalidatesTags: ['Challenge'],
        }),

        updateChallenge: builder.mutation<Challenge, { id: string; updates: Partial<Challenge> }>({
            query: ({ id, updates }) => ({
                url: id,
                method: 'PATCH',
                body: updates,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Challenge', id }],
        }),

        deleteChallenge: builder.mutation<void, string>({
            query: (id) => ({
                url: id,
                method: 'DELETE',
            }),
            invalidatesTags: ['Challenge'],
        }),

        joinChallenge: builder.mutation<ChallengeParticipant, {
            challengeId: string;
            userId: string;
        }>({
            query: ({ challengeId, userId }) => ({
                url: `${challengeId}/join`,
                method: 'POST',
                body: { userId },
            }),
            invalidatesTags: ['Challenge', 'Participation'],
        }),

        leaveChallenge: builder.mutation<void, {
            challengeId: string;
            userId: string;
        }>({
            query: ({ challengeId, userId }) => ({
                url: `${challengeId}/leave`,
                method: 'POST',
                body: { userId },
            }),
            invalidatesTags: ['Challenge', 'Participation'],
        }),

        getMyParticipations: builder.query<ChallengeParticipant[], string>({
            query: (userId) => `participations/${userId}`,
            providesTags: ['Participation'],
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
    useLeaveChallenengeMutation,
    useGetMyParticipationsQuery,
} = challengeApi;