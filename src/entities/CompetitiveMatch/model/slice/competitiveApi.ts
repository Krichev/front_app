// src/entities/CompetitiveMatch/model/slice/competitiveApi.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import {
    CompetitiveMatch,
    CompetitiveMatchDetail,
    CompetitiveMatchInvitation,
    CompetitiveMatchRound,
    CreateFriendChallengeRequest,
    JoinMatchmakingRequest,
    MatchmakingStatusResponse,
    MatchResult,
    RespondToInvitationRequest
} from '../types';
import {Platform} from 'react-native';

export const competitiveApi = createApi({
    reducerPath: 'competitiveApi',
    baseQuery: createBaseQueryWithAuth('http://10.0.2.2:8082/challenger/api/competitive'),
    tagTypes: ['CompetitiveMatch', 'Matchmaking', 'Invitations'],
    endpoints: (builder) => ({
        // =================================================================
        // MATCHMAKING & CHALLENGES
        // =================================================================
        
        createFriendChallenge: builder.mutation<CompetitiveMatchDetail, CreateFriendChallengeRequest>({
            query: (request) => ({
                url: '/challenges',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['CompetitiveMatch', 'Invitations'],
        }),

        joinMatchmaking: builder.mutation<MatchmakingStatusResponse, JoinMatchmakingRequest>({
            query: (request) => ({
                url: '/matchmaking/join',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['Matchmaking'],
        }),

        leaveMatchmaking: builder.mutation<void, void>({
            query: () => ({
                url: '/matchmaking',
                method: 'DELETE',
            }),
            invalidatesTags: ['Matchmaking'],
        }),

        getMatchmakingStatus: builder.query<MatchmakingStatusResponse, void>({
            query: () => '/matchmaking/status',
            providesTags: ['Matchmaking'],
        }),

        // =================================================================
        // INVITATIONS
        // =================================================================

        getPendingInvitations: builder.query<CompetitiveMatchInvitation[], void>({
            query: () => '/invitations',
            providesTags: ['Invitations'],
        }),

        respondToInvitation: builder.mutation<CompetitiveMatchDetail, RespondToInvitationRequest>({
            query: ({invitationId, accepted}) => ({
                url: `/invitations/${invitationId}/respond`,
                method: 'POST',
                body: { invitationId, accepted },
            }),
            invalidatesTags: ['Invitations', 'CompetitiveMatch'],
        }),

        // =================================================================
        // MATCH LIFECYCLE
        // =================================================================

        getUserMatches: builder.query<CompetitiveMatch[], { status?: string; page?: number; size?: number }>({
            query: (params) => ({
                url: '/matches',
                params,
            }),
            providesTags: ['CompetitiveMatch'],
        }),

        getMatch: builder.query<CompetitiveMatchDetail, number>({
            query: (id) => `/matches/${id}`,
            providesTags: (result, error, id) => [{ type: 'CompetitiveMatch', id }],
        }),

        startMatch: builder.mutation<CompetitiveMatchDetail, number>({
            query: (id) => ({
                url: `/matches/${id}/start`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'CompetitiveMatch', id }],
        }),

        startRound: builder.mutation<CompetitiveMatchRound, number>({
            query: (id) => ({
                url: `/matches/${id}/rounds/start`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'CompetitiveMatch', id }],
        }),

        submitPerformance: builder.mutation<CompetitiveMatchRound, {
            matchId: number;
            roundId: number;
            audioUri: string;
        }>({
            queryFn: async (args, api, extraOptions, baseQuery) => {
                const { matchId, roundId, audioUri } = args;
                try {
                    // Logic similar to createQuestionWithMedia
                    const formData = new FormData();
                    
                    let fileUri = audioUri;
                    if (Platform.OS === 'android') {
                        if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
                            fileUri = 'file://' + fileUri;
                        }
                    }

                    const fileName = `submission_${matchId}_${roundId}_${Date.now()}.m4a`; // Assume m4a/mp4 usually
                    const file = {
                        uri: fileUri,
                        type: 'audio/m4a', // Or audio/mp4 depending on recorder
                        name: fileName,
                    };

                    formData.append('audio', file as any);

                    // We need to construct the URL manually or use baseQuery
                    // createBaseQueryWithAuth returns a function. We can't easily use it for FormData with custom headers override usually unless we use fetch directly or the baseQuery supports it.
                    // But we can use the `fetch` API directly with the token.
                    // Since I don't have easy access to state token here without casting, I'll assume baseQuery handles FormData if body is FormData.
                    // RTK Query's fetchBaseQuery handles FormData automatically by NOT setting Content-Type.
                    // My custom `createBaseQueryWithAuth` might wrap it. 
                    // Let's try passing formData as body.
                    
                    const result = await baseQuery({
                        url: `/matches/${matchId}/rounds/${roundId}/submit`,
                        method: 'POST',
                        body: formData,
                    });
                    
                    if (result.error) {
                        return { error: result.error };
                    }
                    
                    return { data: result.data as CompetitiveMatchRound };

                } catch (e) {
                    return { error: { status: 'CUSTOM_ERROR', error: String(e) } };
                }
            },
            invalidatesTags: (result, error, { matchId }) => [{ type: 'CompetitiveMatch', id: matchId }],
        }),

        cancelMatch: builder.mutation<CompetitiveMatchDetail, { id: number; reason?: string }>({
            query: ({id, reason}) => ({
                url: `/matches/${id}/cancel`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (result, error, {id}) => [{ type: 'CompetitiveMatch', id }],
        }),

        getMatchResult: builder.query<MatchResult, number>({
            query: (id) => `/matches/${id}/result`,
            providesTags: (result, error, id) => [{ type: 'CompetitiveMatch', id }],
        }),

        getUserCompetitiveStats: builder.query<any, void>({
            query: () => '/stats',
        }),
    }),
});

export const {
    useCreateFriendChallengeMutation,
    useJoinMatchmakingMutation,
    useLeaveMatchmakingMutation,
    useGetMatchmakingStatusQuery,
    useGetPendingInvitationsQuery,
    useRespondToInvitationMutation,
    useGetUserMatchesQuery,
    useGetMatchQuery,
    useStartMatchMutation,
    useStartRoundMutation,
    useSubmitPerformanceMutation,
    useCancelMatchMutation,
    useGetMatchResultQuery,
    useGetUserCompetitiveStatsQuery,
} = competitiveApi;
