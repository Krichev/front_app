// src/entities/QuizState/model/slice/quizApi.ts - MERGED VERSION
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';

// ============================================================================
// EXISTING TYPES (from your current file)
// ============================================================================

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
    hintUsed: boolean;
    voiceRecordingUsed: boolean;
    aiFeedback?: string;
}

export interface SubmitRoundAnswerRequest {
    roundNumber: number;
    teamAnswer: string;
    playerWhoAnswered: string;
    discussionNotes?: string;
    hintUsed?: boolean;
    voiceRecordingUsed?: boolean;
}

// ============================================================================
// NEW TYPES (for access control feature)
// ============================================================================

export enum QuestionVisibility {
    PRIVATE = 'PRIVATE',
    FRIENDS_FAMILY = 'FRIENDS_FAMILY',
    QUIZ_ONLY = 'QUIZ_ONLY',
    PUBLIC = 'PUBLIC'
}

export enum RelationshipType {
    FRIEND = 'FRIEND',
    FAMILY = 'FAMILY',
    BLOCKED = 'BLOCKED'
}

export enum RelationshipStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED'
}

// ============================================================================
// UPDATED TYPES (with new fields)
// ============================================================================

export interface CreateQuizQuestionRequest {
    question: string;
    answer: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    source?: string;
    additionalInfo?: string;
    // NEW: Access control fields
    visibility: QuestionVisibility;
    originalQuizId?: number;
}

export interface QuizQuestion {
    id: string;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    source?: string;
    additionalInfo?: string;
    isUserCreated: boolean;
    creatorId?: string;
    creatorUsername?: string;
    externalId?: string;
    usageCount: number;
    createdAt: string;
    lastUsed?: string;
    // NEW: Access control fields
    visibility: QuestionVisibility;
    originalQuizId?: number;
    originalQuizTitle?: string;
    canEdit: boolean;
    canDelete: boolean;
    canUseInQuiz: boolean;
}

export interface UpdateQuestionVisibilityRequest {
    visibility: QuestionVisibility;
    originalQuizId?: number;
}

export interface QuestionSearchParams {
    keyword?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    quizId?: number;
    page?: number;
    size?: number;
}

// NEW: Relationship types
export interface UserRelationship {
    id: number;
    userId: number;
    relatedUserId: number;
    relatedUserUsername: string;
    relatedUserAvatar?: string;
    relationshipType: RelationshipType;
    status: RelationshipStatus;
    createdAt: string;
}

export interface CreateRelationshipRequest {
    relatedUserId: number;
    relationshipType: RelationshipType;
}

// NEW: Paginated response type
export interface PaginatedQuestionResponse {
    content: QuizQuestion[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getVisibilityLabel = (visibility: QuestionVisibility): string => {
    switch (visibility) {
        case QuestionVisibility.PRIVATE:
            return 'Only Me';
        case QuestionVisibility.FRIENDS_FAMILY:
            return 'Friends & Family';
        case QuestionVisibility.QUIZ_ONLY:
            return 'This Quiz Only';
        case QuestionVisibility.PUBLIC:
            return 'Everyone (Public)';
        default:
            return visibility;
    }
};

export const getVisibilityDescription = (visibility: QuestionVisibility): string => {
    switch (visibility) {
        case QuestionVisibility.PRIVATE:
            return 'Only you can see and use this question';
        case QuestionVisibility.FRIENDS_FAMILY:
            return 'You and your friends/family can use this question';
        case QuestionVisibility.QUIZ_ONLY:
            return 'Only accessible in the quiz where it was added';
        case QuestionVisibility.PUBLIC:
            return 'Everyone can find and use this question';
        default:
            return '';
    }
};

export const getVisibilityIcon = (visibility: QuestionVisibility): string => {
    switch (visibility) {
        case QuestionVisibility.PRIVATE:
            return '🔒';
        case QuestionVisibility.FRIENDS_FAMILY:
            return '👥';
        case QuestionVisibility.QUIZ_ONLY:
            return '🎯';
        case QuestionVisibility.PUBLIC:
            return '🌍';
        default:
            return '❓';
    }
};

// ============================================================================
// API DEFINITION
// ============================================================================

export const quizApi = createApi({
    reducerPath: 'quizApi',
    baseQuery: createBaseQueryWithAuth('http://10.0.2.2:8082/challenger/api/quiz'),
    tagTypes: ['QuizQuestion', 'QuizSession', 'QuizRound', 'UserRelationship'],
    endpoints: (builder) => ({
        // ========================================================================
        // EXISTING QUESTION ENDPOINTS (kept as-is)
        // ========================================================================

        createUserQuestion: builder.mutation<QuizQuestion, CreateQuizQuestionRequest>({
            query: (request) => ({
                url: '/questions',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: [{type: 'QuizQuestion', id: 'USER_LIST'}],
        }),

        getUserQuestions: builder.query<QuizQuestion[], void>({
            query: () => '/questions/me',
            providesTags: (result) =>
                result
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
                url: '/questions/me',
                params: {page, size, sortBy, sortDirection},
            }),
            providesTags: (result) =>
                result?.content
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
            query: () => '../relationships',
            providesTags: [{type: 'UserRelationship', id: 'LIST'}],
        }),

        getPendingRequests: builder.query<UserRelationship[], void>({
            query: () => '../relationships/pending',
            providesTags: [{type: 'UserRelationship', id: 'PENDING'}],
        }),

        acceptRelationship: builder.mutation<UserRelationship, number>({
            query: (relationshipId) => ({
                url: `../relationships/${relationshipId}/accept`,
                method: 'PUT',
            }),
            invalidatesTags: [
                {type: 'UserRelationship', id: 'LIST'},
                {type: 'UserRelationship', id: 'PENDING'},
                {type: 'QuizQuestion', id: 'ACCESSIBLE_LIST'},
            ],
        }),

        rejectRelationship: builder.mutation<void, number>({
            query: (relationshipId) => ({
                url: `../relationships/${relationshipId}/reject`,
                method: 'PUT',
            }),
            invalidatesTags: [{type: 'UserRelationship', id: 'PENDING'}],
        }),

        removeRelationship: builder.mutation<void, number>({
            query: (relationshipId) => ({
                url: `../relationships/${relationshipId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [
                {type: 'UserRelationship', id: 'LIST'},
                {type: 'QuizQuestion', id: 'ACCESSIBLE_LIST'},
            ],
        }),

        checkConnection: builder.query<boolean, number>({
            query: (otherUserId) => `../relationships/check/${otherUserId}`,
        }),

        // ========================================================================
        // EXISTING QUIZ SESSION ENDPOINTS (kept as-is)
        // ========================================================================

        startQuizSession: builder.mutation<QuizSession, StartQuizSessionRequest>({
            query: (request) => ({
                url: '/sessions',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: [{type: 'QuizSession', id: 'LIST'}],
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
            request: SubmitRoundAnswerRequest;
        }>({
            query: ({sessionId, request}) => ({
                url: `/sessions/${sessionId}/rounds/submit`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: (result, error, {sessionId}) => [
                {type: 'QuizSession', id: sessionId},
                {type: 'QuizRound', id: `SESSION_${sessionId}`}
            ],
        }),

        completeQuizSession: builder.mutation<QuizSession, string>({
            query: (sessionId) => ({
                url: `/sessions/${sessionId}/complete`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, sessionId) => [
                {type: 'QuizSession', id: sessionId}
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
                result
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
    useGetCurrentRoundQuery,
    useUpdateQuizSessionConfigMutation,
} = quizApi;