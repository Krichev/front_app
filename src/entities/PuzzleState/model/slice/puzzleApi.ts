// src/entities/PuzzleState/model/slice/puzzleApi.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';
import {
    AnswerResult,
    BoardStateUpdate,
    CreatePuzzleGameRequest,
    PuzzleGameDTO,
    PuzzleGameStatusDTO,
    PuzzleParticipantDTO,
    PuzzlePieceDTO,
    SpectatorViewDTO
} from '../types';

export const puzzleApi = createApi({
    reducerPath: 'puzzleApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    tagTypes: ['PuzzleGame', 'PuzzlePieces', 'PuzzleParticipant', 'PuzzleResults'],
    endpoints: (builder) => ({

        // =====================================================================
        // GAME LIFECYCLE
        // =====================================================================
        
        createPuzzleGame: builder.mutation<PuzzleGameDTO, CreatePuzzleGameRequest>({
            query: (body) => ({
                url: '/puzzle/games',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['PuzzleGame'],
        }),

        generatePuzzlePieces: builder.mutation<{ status: string; message: string }, number>({
            query: (gameId) => ({
                url: `/puzzle/games/${gameId}/generate`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, gameId) => [
                { type: 'PuzzleGame', id: gameId },
                'PuzzlePieces',
            ],
        }),

        getPuzzleGame: builder.query<PuzzleGameStatusDTO, number>({
            query: (gameId) => `/puzzle/games/${gameId}`,
            providesTags: (result, error, gameId) => [{ type: 'PuzzleGame', id: gameId }],
        }),

        joinPuzzleGame: builder.mutation<PuzzleParticipantDTO, number>({
            query: (gameId) => ({
                url: `/puzzle/games/${gameId}/join`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, gameId) => [{ type: 'PuzzleGame', id: gameId }],
        }),

        startPuzzleGame: builder.mutation<{ message: string }, number>({
            query: (gameId) => ({
                url: `/puzzle/games/${gameId}/start`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, gameId) => [{ type: 'PuzzleGame', id: gameId }],
        }),

        // =====================================================================
        // GAMEPLAY
        // =====================================================================

        getMyPieces: builder.query<PuzzlePieceDTO[], number>({
            query: (gameId) => `/puzzle/games/${gameId}/pieces`,
            providesTags: (result, error, gameId) => [
                { type: 'PuzzlePieces', id: gameId },
            ],
        }),

        updateBoardState: builder.mutation<void, { gameId: number; update: BoardStateUpdate }>({
            query: ({ gameId, update }) => ({
                url: `/puzzle/games/${gameId}/board`,
                method: 'PUT',
                body: update,
            }),
            // Use optimistic updates in the feature hook
        }),

        submitAnswer: builder.mutation<AnswerResult, { gameId: number; answer: string }>({
            query: ({ gameId, answer }) => ({
                url: `/puzzle/games/${gameId}/answer`,
                method: 'POST',
                params: { answer }, // Backend expects RequestParam
            }),
            invalidatesTags: (result, error, { gameId }) => [
                { type: 'PuzzleGame', id: gameId },
                { type: 'PuzzleResults', id: gameId },
            ],
        }),

        // =====================================================================
        // RESULTS & SPECTATING
        // =====================================================================

        getPuzzleResults: builder.query<PuzzleParticipantDTO[], number>({
            query: (gameId) => `/puzzle/games/${gameId}/results`,
            providesTags: (result, error, gameId) => [
                { type: 'PuzzleResults', id: gameId },
            ],
        }),

        getSpectatorView: builder.query<SpectatorViewDTO, number>({
            query: (gameId) => `/puzzle/games/${gameId}/spectate`,
        }),

        abandonPuzzleGame: builder.mutation<{ message: string }, number>({
            query: (gameId) => ({
                url: `/puzzle/games/${gameId}/abandon`,
                method: 'POST',
            }),
            invalidatesTags: ['PuzzleGame'],
        }),
    }),
});

export const {
    useCreatePuzzleGameMutation,
    useGeneratePuzzlePiecesMutation,
    useGetPuzzleGameQuery,
    useJoinPuzzleGameMutation,
    useStartPuzzleGameMutation,
    useGetMyPiecesQuery,
    useUpdateBoardStateMutation,
    useSubmitAnswerMutation,
    useGetPuzzleResultsQuery,
    useGetSpectatorViewQuery,
    useAbandonPuzzleGameMutation,
} = puzzleApi;
