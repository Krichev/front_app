// src/entities/TournamentState/model/slice/tournamentQuestionApi.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {RootState} from '../../../../app/providers/StoreProvider/store';
import NetworkConfigManager from '../../../../config/NetworkConfig';

// Types
export type APIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type UIDifficulty = 'Easy' | 'Medium' | 'Hard';

export enum QuestionType {
    WHAT_WHERE_WHEN = 'WHAT_WHERE_WHEN',
    BLITZ = 'BLITZ',
    OWN_QUESTION = 'OWN_QUESTION',
    STANDARD = 'STANDARD'
}

export enum MediaType {
    IMAGE = 'IMAGE',
    AUDIO = 'AUDIO',
    VIDEO = 'VIDEO'
}

export interface QuizQuestionDTO {
    id: number;
    question: string;
    answer: string;
    difficulty: APIDifficulty;
    topic: string;
    source: string;
    authors: string;
    comments: string;
    passCriteria: string;
    additionalInfo: string;
    questionType: QuestionType;
    questionMediaUrl?: string;
    questionMediaId?: string;
    questionMediaType?: MediaType;
    questionThumbnailUrl?: string;
    usageCount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TournamentQuestionSummaryDTO {
    id: number;
    quizQuestionId: number;
    tournamentId: number;
    tournamentTitle: string;
    displayOrder: number;
    questionPreview: string;
    difficulty: APIDifficulty;
    topic: string;
    questionType: QuestionType;
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

export interface TournamentQuestionDetailDTO {
    id: number;
    tournamentId: number;
    tournamentTitle: string;
    displayOrder: number;
    legacyQuestionNum: number;
    quizQuestionId: number;
    effectiveQuestion: string;
    effectiveAnswer: string;
    effectiveSources: string;
    bankQuestion: QuizQuestionDTO;
    customQuestion?: string;
    customAnswer?: string;
    customSources?: string;
    tournamentType: string;
    topicNum: number;
    notices: string;
    images: string;
    rating: number;
    points: number;
    timeLimitSeconds: number;
    isBonusQuestion: boolean;
    isMandatory: boolean;
    isActive: boolean;
    hasCustomQuestion: boolean;
    hasCustomAnswer: boolean;
    hasCustomSources: boolean;
    hasAnyCustomizations: boolean;
    hasMedia: boolean;
    enteredDate: string;
    updatedAt: string;
    addedBy: number;
}

export interface AddQuestionToTournamentRequest {
    tournamentTitle: string;
    quizQuestionId: number;
    points?: number;
}

export interface UpdateTournamentQuestionRequest {
    customQuestion?: string;
    customAnswer?: string;
    points?: number;
}

export interface BulkAddQuestionsRequest {
    tournamentId: number;
    tournamentTitle: string;
    questionsToAdd: Array<{
        quizQuestionId: number;
        points?: number;
        timeLimitSeconds?: number;
        isBonusQuestion?: boolean;
        customQuestion?: string;
        customAnswer?: string;
    }>;
}

export interface ReorderQuestionsRequest {
    questionIds: number[];
}

export interface TournamentQuestionStatsDTO {
    tournamentId: number;
    tournamentTitle: string;
    totalQuestions: number;
    activeQuestions: number;
    inactiveQuestions: number;
    bonusQuestions: number;
    mandatoryQuestions: number;
    questionsWithCustomizations: number;
    questionsWithMedia: number;
    totalPoints: number;
    averagePoints: number;
    minPoints: number;
    maxPoints: number;
    difficultyDistribution: Record<APIDifficulty, number>;
    questionTypeDistribution: Record<QuestionType, number>;
    topicDistribution: Record<string, number>;
    averageRating: number;
    questionsWithRating: number;
}

export const tournamentQuestionApi = createApi({
    reducerPath: 'tournamentQuestionApi',
    baseQuery: fetchBaseQuery({
        baseUrl: NetworkConfigManager.getInstance().getBaseUrl(),
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            headers.set('Content-Type', 'application/json');
            headers.set('Accept', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['TournamentQuestion', 'TournamentQuestionStats'],
    endpoints: (builder) => ({
        // Get all questions for a tournament
        getTournamentQuestions: builder.query<TournamentQuestionSummaryDTO[], number>({
            query: (tournamentId) => `/tournaments/${tournamentId}/questions`,
            providesTags: (result, error, tournamentId) =>
                result
                    ? [
                        ...result.map(({ id }) => ({
                            type: 'TournamentQuestion' as const,
                            id
                        })),
                        { type: 'TournamentQuestion', id: `LIST_${tournamentId}` },
                    ]
                    : [{ type: 'TournamentQuestion', id: `LIST_${tournamentId}` }],
        }),

        // Get single question details
        getQuestionDetail: builder.query<
            TournamentQuestionDetailDTO,
            { tournamentId: number; questionId: number }
        >({
            query: ({ tournamentId, questionId }) =>
                `/tournaments/${tournamentId}/questions/${questionId}`,
            providesTags: (result, error, { questionId }) => [
                { type: 'TournamentQuestion', id: questionId }
            ],
        }),

        // Add question to tournament
        addQuestionToTournament: builder.mutation<
            TournamentQuestionDetailDTO,
            { tournamentId: number; request: AddQuestionToTournamentRequest }
        >({
            query: ({ tournamentId, request }) => ({
                url: `/tournaments/${tournamentId}/questions`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: (result, error, { tournamentId }) => [
                { type: 'TournamentQuestion', id: `LIST_${tournamentId}` },
                { type: 'TournamentQuestionStats', id: tournamentId },
            ],
        }),

        // Update tournament question
        updateTournamentQuestion: builder.mutation<
            TournamentQuestionDetailDTO,
            {
                tournamentId: number;
                questionId: number;
                request: UpdateTournamentQuestionRequest
            }
        >({
            query: ({ tournamentId, questionId, request }) => ({
                url: `/tournaments/${tournamentId}/questions/${questionId}`,
                method: 'PUT',
                body: request,
            }),
            invalidatesTags: (result, error, { tournamentId, questionId }) => [
                { type: 'TournamentQuestion', id: questionId },
                { type: 'TournamentQuestion', id: `LIST_${tournamentId}` },
                { type: 'TournamentQuestionStats', id: tournamentId },
            ],
        }),

        // Delete question
        deleteQuestion: builder.mutation<
            void,
            { tournamentId: number; questionId: number }
        >({
            query: ({ tournamentId, questionId }) => ({
                url: `/tournaments/${tournamentId}/questions/${questionId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { tournamentId, questionId }) => [
                { type: 'TournamentQuestion', id: questionId },
                { type: 'TournamentQuestion', id: `LIST_${tournamentId}` },
                { type: 'TournamentQuestionStats', id: tournamentId },
            ],
        }),

        // Reorder questions
        reorderQuestions: builder.mutation<
            void,
            { tournamentId: number; request: ReorderQuestionsRequest }
        >({
            query: ({ tournamentId, request }) => ({
                url: `/tournaments/${tournamentId}/questions/reorder`,
                method: 'PUT',
                body: request,
            }),
            invalidatesTags: (result, error, { tournamentId }) => [
                { type: 'TournamentQuestion', id: `LIST_${tournamentId}` },
            ],
        }),

        // Get tournament statistics
        getTournamentStatistics: builder.query<TournamentQuestionStatsDTO, number>({
            query: (tournamentId) => `/tournaments/${tournamentId}/questions/stats`,
            providesTags: (result, error, tournamentId) => [
                { type: 'TournamentQuestionStats', id: tournamentId }
            ],
        }),

        // Bulk add questions
        bulkAddQuestions: builder.mutation<
            TournamentQuestionSummaryDTO[],
            { tournamentId: number; request: BulkAddQuestionsRequest }
        >({
            query: ({ tournamentId, request }) => ({
                url: `/tournaments/${tournamentId}/questions/bulk`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: (result, error, { tournamentId }) => [
                { type: 'TournamentQuestion', id: `LIST_${tournamentId}` },
                { type: 'TournamentQuestionStats', id: tournamentId },
            ],
        }),

        // Get questions by difficulty (custom endpoint)
        getQuestionsByDifficulty: builder.query<
            TournamentQuestionSummaryDTO[],
            { tournamentId: number; difficulty: APIDifficulty; limit?: number }
        >({
            query: ({ tournamentId }) => `/tournaments/${tournamentId}/questions`,
            transformResponse: (response: TournamentQuestionSummaryDTO[], meta, arg) => {
                const { difficulty, limit = 10 } = arg;

                // Filter by difficulty and active status
                const filtered = response.filter(q =>
                    q.difficulty === difficulty && q.isActive
                );

                // Shuffle and limit
                const shuffled = filtered.sort(() => Math.random() - 0.5);
                return shuffled.slice(0, limit);
            },
            providesTags: (result, error, { tournamentId, difficulty }) => [
                {
                    type: 'TournamentQuestion',
                    id: `DIFFICULTY_${tournamentId}_${difficulty}`
                }
            ],
        }),
    }),
});

// Export hooks
export const {
    useGetTournamentQuestionsQuery,
    useGetQuestionDetailQuery,
    useAddQuestionToTournamentMutation,
    useUpdateTournamentQuestionMutation,
    useDeleteQuestionMutation,
    useReorderQuestionsMutation,
    useGetTournamentStatisticsQuery,
    useBulkAddQuestionsMutation,
    useGetQuestionsByDifficultyQuery,
} = tournamentQuestionApi;

// Utility functions
export const DIFFICULTY_MAPPING = {
    'Easy': 'EASY' as const,
    'Medium': 'MEDIUM' as const,
    'Hard': 'HARD' as const,
    'EASY': 'Easy' as const,
    'MEDIUM': 'Medium' as const,
    'HARD': 'Hard' as const
};

export const convertToAPIDifficulty = (difficulty: UIDifficulty): APIDifficulty => {
    return DIFFICULTY_MAPPING[difficulty];
};

export const convertToUIDifficulty = (difficulty: APIDifficulty): UIDifficulty => {
    return DIFFICULTY_MAPPING[difficulty];
};