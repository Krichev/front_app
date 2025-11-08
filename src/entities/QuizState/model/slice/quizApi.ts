// src/entities/QuizState/model/slice/quizApi.ts - FIXED VERSION
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import {APIDifficulty, MediaType, QuestionType} from '../../../../services/wwwGame/questionService';
import {QuestionVisibility} from "../types/question.types.ts";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateQuestionWithMediaRequest {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    source?: string;
    questionType?: QuestionType;
    mediaFileId?: number;
    questionMediaUrl?: string;
    questionMediaId?: string;
    questionMediaType?: MediaType;
}

// export interface QuizQuestionResponse {
//     id: number;
//     question: string;
//     answer: string;
//     difficulty: 'EASY' | 'MEDIUM' | 'HARD';
//     topic?: string;
//     additionalInfo?: string;
//     source?: string;
//     questionType: QuestionType;
//     questionMediaUrl?: string;
//     questionMediaId?: string;
//     questionMediaType?: MediaType;
//     questionThumbnailUrl?: string;
//     isUserCreated: boolean;
//     creatorId?: number;
//     creatorUsername?: string;
//     isActive: boolean;
//     usageCount: number;
//     createdAt: string;
//     updatedAt: string;
// }

export interface QuizQuestion {
    id: string;
    question: string;
    answer: string;
    difficulty: APIDifficulty;
    visibility: QuestionVisibility;
    topic?: string;
    additionalInfo?: string;
    source?: string;
    questionType: QuestionType;
    questionMediaUrl?: string;
    questionMediaId?: string;
    questionMediaType?: MediaType;
    questionThumbnailUrl?: string;
    isUserCreated: boolean;
    creatorId?: number;
    creatorUsername?: string;
    isActive: boolean;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateQuizQuestionRequest {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    source?: string;
}

export interface PaginatedQuestionResponse {
    content: QuizQuestion[];
    totalPages: number;
    totalElements: number;
    currentPage: number;
    pageSize: number;
}

export interface QuestionSearchParams {
    keyword?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
}

export interface UpdateQuestionVisibilityRequest {
    isPublic: boolean;
}

export interface UserRelationship {
    id: string;
    userId: string;
    username: string;
    relatedUserId: string;
    relatedUsername: string;
    status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
    createdAt: string;
    updatedAt: string;
}

export interface CreateRelationshipRequest {
    relatedUsername: string;
}

export interface QuizConfig {
    gameType: 'WWW';
    teamName: string;
    teamMembers: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    teamBased: boolean;
}

export interface QuizSession {
    id: string;
    challengeId: string;
    challengeTitle: string;
    hostUserId: string;
    hostUsername: string;
    teamName: string;
    teamMembers: string[];
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    roundTimeSeconds: number;
    totalRounds: number;
    completedRounds: number;
    correctAnswers: number;
    scorePercentage: number;
    enableAiHost: boolean;
    questionSource: string;
    status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'CANCELLED';
    startedAt?: string;
    completedAt?: string;
    totalDurationSeconds?: number;
    createdAt: string;
}

export interface StartQuizSessionRequest {
    challengeId: string;
    teamName: string;
    teamMembers: string[];
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    roundTimeSeconds: number;
    totalRounds: number;
    timePerRound: number;
    enableAiHost: boolean;
    questionSource: 'app' | 'user';
    customQuestionIds?: number[];
}

export interface QuizRound {
    id: string;
    quizSessionId: string;
    question: QuizQuestion;
    roundNumber: number;
    teamAnswer?: string;
    isCorrect: boolean;
    playerWhoAnswered?: string;
    discussionNotes?: string;
    roundStartedAt?: string;
    answerSubmittedAt?: string;
    discussionDurationSeconds?: number;
    totalRoundDurationSeconds?: number;
}

export interface SubmitRoundAnswerRequest {
    teamAnswer: string;
    playerWhoAnswered: string;
    discussionNotes?: string;
}

// ============================================================================
// API DEFINITION
// ============================================================================

export const quizApi = createApi({
    reducerPath: 'quizApi',
    baseQuery: createBaseQueryWithAuth('http://10.0.2.2:8082/challenger/api'),
    tagTypes: ['QuizQuestion', 'QuizSession', 'QuizRound', 'UserRelationship', 'UserQuestions', 'Topics'],
    endpoints: (builder) => ({

        createUserQuestion: builder.mutation<QuizQuestion, CreateQuizQuestionRequest>({
            query: (request) => ({
                url: '/questions',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: [{type: 'QuizQuestion', id: 'USER_LIST'}],
        }),

        getAvailableTopics: builder.query<string[], void>({
            query: () => '/quiz-questions/topics',
            providesTags: ['Topics'],
        }),

        getUserQuestions: builder.query<QuizQuestion[], void>({
            query: () => '/quiz/questions/me',
            providesTags: (result) =>
                result && Array.isArray(result)
                    ? [
                        ...result.map(({id}) => ({type: 'QuizQuestion' as const, id})),
                        {type: 'QuizQuestion', id: 'USER_LIST'},
                    ]
                    : [{type: 'QuizQuestion', id: 'USER_LIST'}],
        }),

        deleteUserQuestion: builder.mutation<{message: string}, string>({
            query: (questionId) => ({
                url: `/questions/${questionId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{type: 'QuizQuestion', id: 'USER_LIST'}],
        }),

        getQuestionsByDifficulty: builder.query<QuizQuestion[], {
            difficulty: 'EASY' | 'MEDIUM' | 'HARD';
            count?: number;
        }>({
            query: ({difficulty, count = 10}) => ({
                url: `/questions/difficulty/${difficulty}`,
                params: {count},
            }),
            providesTags: (result, error, {difficulty}) => [
                {type: 'QuizQuestion', id: `DIFFICULTY_${difficulty}`}
            ],
        }),

        searchQuestions: builder.query<QuizQuestion[], {keyword: string; limit?: number}>({
            query: ({keyword, limit = 20}) => ({
                url: '/questions/search',
                params: {keyword, limit},
            }),
            providesTags: [{type: 'QuizQuestion', id: 'SEARCH'}],
        }),

        // ========================================================================
        // NEW QUESTION ENDPOINTS (for access control)
        // ========================================================================

        getUserQuestionsPaginated: builder.query<PaginatedQuestionResponse, {
            page?: number;
            size?: number;
            sortBy?: string;
            sortDirection?: 'ASC' | 'DESC';
        }>({
            query: ({page = 0, size = 20, sortBy = 'createdAt', sortDirection = 'DESC'}) => ({
                url: '/quiz/questions/me',
                params: {page, size, sortBy, sortDirection},
            }),
            providesTags: (result) =>
                result?.content && Array.isArray(result.content)
                    ? [
                        ...result.content.map(({id}) => ({type: 'QuizQuestion' as const, id})),
                        {type: 'QuizQuestion', id: 'USER_LIST'},
                    ]
                    : [{type: 'QuizQuestion', id: 'USER_LIST'}],
        }),

        searchAccessibleQuestions: builder.query<PaginatedQuestionResponse, QuestionSearchParams>({
            query: (params) => ({
                url: '/questions/accessible',
                params,
            }),
            providesTags: [{type: 'QuizQuestion', id: 'ACCESSIBLE_LIST'}],
        }),

        updateQuestionVisibility: builder.mutation<QuizQuestion, {
            questionId: number;
            request: UpdateQuestionVisibilityRequest;
        }>({
            query: ({questionId, request}) => ({
                url: `/questions/${questionId}/visibility`,
                method: 'PUT',
                params: request,
            }),
            invalidatesTags: (result, error, {questionId}) => [
                {type: 'QuizQuestion', id: questionId.toString()},
                {type: 'QuizQuestion', id: 'USER_LIST'},
                {type: 'QuizQuestion', id: 'ACCESSIBLE_LIST'},
            ],
        }),

        // ========================================================================
        // RELATIONSHIP ENDPOINTS (NEW)
        // ========================================================================

        createRelationship: builder.mutation<UserRelationship, CreateRelationshipRequest>({
            query: (request) => ({
                url: '../relationships',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: [{type: 'UserRelationship', id: 'LIST'}],
        }),

        getMyRelationships: builder.query<UserRelationship[], void>({
            query: () => '../relationships/me',
            providesTags: (result) =>
                result && Array.isArray(result)
                    ? [
                        ...result.map(({id}) => ({type: 'UserRelationship' as const, id})),
                        {type: 'UserRelationship', id: 'LIST'},
                    ]
                    : [{type: 'UserRelationship', id: 'LIST'}],
        }),

        getPendingRequests: builder.query<UserRelationship[], void>({
            query: () => '../relationships/pending',
            providesTags: [{type: 'UserRelationship', id: 'PENDING_LIST'}],
        }),

        acceptRelationship: builder.mutation<UserRelationship, number>({
            query: (relationshipId) => ({
                url: `../relationships/${relationshipId}/accept`,
                method: 'PUT',
            }),
            invalidatesTags: [{type: 'UserRelationship', id: 'LIST'}, {type: 'UserRelationship', id: 'PENDING_LIST'}],
        }),

        rejectRelationship: builder.mutation<void, number>({
            query: (relationshipId) => ({
                url: `../relationships/${relationshipId}/reject`,
                method: 'DELETE',
            }),
            invalidatesTags: [{type: 'UserRelationship', id: 'LIST'}, {type: 'UserRelationship', id: 'PENDING_LIST'}],
        }),

        removeRelationship: builder.mutation<void, number>({
            query: (relationshipId) => ({
                url: `../relationships/${relationshipId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{type: 'UserRelationship', id: 'LIST'}],
        }),

        checkConnection: builder.query<{connected: boolean; status?: string}, string>({
            query: (username) => `../relationships/check/${username}`,
        }),

        // ========================================================================
        // QUIZ SESSION ENDPOINTS
        // ========================================================================

        startQuizSession: builder.mutation<QuizSession, StartQuizSessionRequest>({
            query: (request) => ({
                url: '/sessions',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: [{type: 'QuizSession', id: 'USER_LIST'}],
        }),

        beginQuizSession: builder.mutation<QuizSession, string>({
            query: (sessionId) => ({
                url: `/sessions/${sessionId}/begin`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, sessionId) => [
                {type: 'QuizSession', id: sessionId}
            ],
        }),

        submitRoundAnswer: builder.mutation<QuizRound, {
            sessionId: string;
            roundId: string;
            answer: SubmitRoundAnswerRequest;
        }>({
            query: ({sessionId, roundId, answer}) => ({
                url: `/sessions/${sessionId}/rounds/${roundId}/submit`,
                method: 'POST',
                body: answer,
            }),
            invalidatesTags: (result, error, {sessionId, roundId}) => [
                {type: 'QuizSession', id: sessionId},
                {type: 'QuizRound', id: `SESSION_${sessionId}`},
                {type: 'QuizRound', id: roundId},
                {type: 'QuizRound', id: `CURRENT_${sessionId}`},
            ],
        }),

        completeQuizSession: builder.mutation<QuizSession, string>({
            query: (sessionId) => ({
                url: `/sessions/${sessionId}/complete`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, sessionId) => [
                {type: 'QuizSession', id: sessionId},
                {type: 'QuizSession', id: 'USER_LIST'},
            ],
        }),

        getQuizSession: builder.query<QuizSession, string>({
            query: (sessionId) => `/sessions/${sessionId}`,
            providesTags: (result, error, sessionId) => [
                {type: 'QuizSession', id: sessionId}
            ],
        }),

        getUserQuizSessions: builder.query<QuizSession[], {limit?: number}>({
            query: ({limit = 20}) => ({
                url: '/sessions/me',
                params: {limit},
            }),
            providesTags: (result) =>
                result && Array.isArray(result)
                    ? [
                        ...result.map(({id}) => ({type: 'QuizSession' as const, id})),
                        {type: 'QuizSession', id: 'USER_LIST'},
                    ]
                    : [{type: 'QuizSession', id: 'USER_LIST'}],
        }),

        getQuizRounds: builder.query<QuizRound[], string>({
            query: (sessionId) => `/sessions/${sessionId}/rounds`,
            providesTags: (result, error, sessionId) => [
                {type: 'QuizRound', id: `SESSION_${sessionId}`}
            ],
        }),

        getCurrentRound: builder.query<QuizRound, string>({
            query: (sessionId) => `/sessions/${sessionId}/current-round`,
            providesTags: (result, error, sessionId) => [
                {type: 'QuizRound', id: `CURRENT_${sessionId}`}
            ],
        }),

        updateQuizSessionConfig: builder.mutation<QuizSession, {
            sessionId: string;
            config: any;
        }>({
            query: ({sessionId, config}) => ({
                url: `/sessions/${sessionId}/config`,
                method: 'PUT',
                body: config,
            }),
            invalidatesTags: (result, error, {sessionId}) => [
                {type: 'QuizSession', id: sessionId}
            ],
        }),

        createUserQuestionWithMedia: builder.mutation<QuizQuestion, CreateQuestionWithMediaRequest>({
            query: (questionData) => ({
                url: '/api/quiz/questions',
                method: 'POST',
                body: questionData,
            }),
            invalidatesTags: ['UserQuestions'],
        }),
    }),
});

// ============================================================================
// EXPORT HOOKS
// ============================================================================

export const {
    // Existing question hooks
    useCreateUserQuestionMutation,
    useGetUserQuestionsQuery,
    useDeleteUserQuestionMutation,
    useGetQuestionsByDifficultyQuery,
    useSearchQuestionsQuery,

    // NEW: Question access control hooks
    useGetUserQuestionsPaginatedQuery,
    useSearchAccessibleQuestionsQuery,
    useUpdateQuestionVisibilityMutation,

    // NEW: Relationship hooks
    useCreateRelationshipMutation,
    useGetMyRelationshipsQuery,
    useGetPendingRequestsQuery,
    useAcceptRelationshipMutation,
    useRejectRelationshipMutation,
    useRemoveRelationshipMutation,
    useCheckConnectionQuery,

    // Existing quiz session hooks
    useStartQuizSessionMutation,
    useBeginQuizSessionMutation,
    useSubmitRoundAnswerMutation,
    useCompleteQuizSessionMutation,
    useGetQuizSessionQuery,
    useGetUserQuizSessionsQuery,
    useGetQuizRoundsQuery,
    useGetAvailableTopicsQuery,
    useGetCurrentRoundQuery,
    useUpdateQuizSessionConfigMutation,

    useCreateUserQuestionWithMediaMutation,
} = quizApi;