// src/entities/TournamentState/model/slice/tournamentQuestionApi.ts - UPDATED
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';

export type UIDifficulty = 'Easy' | 'Medium' | 'Hard';
export type APIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface TournamentQuestionSummaryDTO {
    id: number;
    quizQuestionId: number;
    tournamentId: number;
    tournamentTitle: string;
    displayOrder: number;
    questionPreview: string;
    difficulty: APIDifficulty;
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

export const convertToAPIDifficulty = (difficulty: UIDifficulty): APIDifficulty => {
    const mapping: Record<UIDifficulty, APIDifficulty> = {
        'Easy': 'EASY',
        'Medium': 'MEDIUM',
        'Hard': 'HARD'
    };
    return mapping[difficulty];
};

export const convertToUIDifficulty = (difficulty: APIDifficulty): UIDifficulty => {
    const mapping: Record<APIDifficulty, UIDifficulty> = {
        'EASY': 'Easy',
        'MEDIUM': 'Medium',
        'HARD': 'Hard'
    };
    return mapping[difficulty];
};

export const tournamentQuestionApi = createApi({
    reducerPath: 'tournamentQuestionApi',
    baseQuery: createBaseQueryWithAuth('http://10.0.2.2:8082/challenger/api'),
    tagTypes: ['TournamentQuestion', 'TournamentStats'],
    endpoints: (builder) => ({
        getQuestionsByDifficulty: builder.query<TournamentQuestionSummaryDTO[], {
            tournamentId: number;
            difficulty: APIDifficulty;
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