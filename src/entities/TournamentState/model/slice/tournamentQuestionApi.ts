// src/entities/TournamentState/model/slice/tournamentQuestionApi.ts - UPDATED
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';
import { Difficulty } from '../../../../shared/types/difficulty';

export type { Difficulty as APIDifficulty } from '../../../../shared/types/difficulty';

export interface TournamentQuestionSummaryDTO {
    id: string;
    quizQuestionId: number;
    tournamentId: number;
    tournamentTitle: string;
    displayOrder: number;
    questionPreview: string;
    difficulty: Difficulty;
    topic: string;
    questionType: string;
    hasMedia: boolean;
    points: number;
    isBonusQuestion: boolean;
    isMandatory: boolean;
    isActive: boolean;
    rating: number;
    hasCustomizations: boolean;
    enteredDate: string;
    updatedAt: string;
}

export interface TournamentStatistics {
    tournamentId: number;
    tournamentTitle: string;
    totalQuestions: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    averageRating: number;
    hasMediaCount: number;
}

export const tournamentQuestionApi = createApi({
    reducerPath: 'tournamentQuestionApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    tagTypes: ['TournamentQuestion', 'TournamentStats'],
    endpoints: (builder) => ({
        getQuestionsByDifficulty: builder.query<TournamentQuestionSummaryDTO[], {
            tournamentId: number;
            difficulty: Difficulty;
            count?: number;
        }>({
            query: ({ tournamentId, difficulty, count = 10 }) => ({
                url: `/tournaments/${tournamentId}/questions`,
                params: { difficulty, limit: count },
            }),
            providesTags: (result, error, { tournamentId, difficulty }) => [
                { type: 'TournamentQuestion', id: `${tournamentId}-${difficulty}` }
            ],
        }),

        getTournamentStatistics: builder.query<TournamentStatistics, number>({
            query: (tournamentId) => `/tournaments/${tournamentId}/statistics`,
            providesTags: (result, error, tournamentId) => [
                { type: 'TournamentStats', id: tournamentId }
            ],
        }),

        getAllTournamentQuestions: builder.query<TournamentQuestionSummaryDTO[], number>({
            query: (tournamentId) => `/tournaments/${tournamentId}/questions`,
            providesTags: (result, error, tournamentId) => [
                { type: 'TournamentQuestion', id: `${tournamentId}-all` }
            ],
        }),
    }),
});

export const {
    useGetQuestionsByDifficultyQuery,
    useGetTournamentStatisticsQuery,
    useGetAllTournamentQuestionsQuery,
} = tournamentQuestionApi;