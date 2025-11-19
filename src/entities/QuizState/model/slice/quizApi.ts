// src/entities/QuizState/model/slice/quizApi.ts - FIXED VERSION
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import {APIDifficulty, MediaType, QuestionType} from '../../../../services/wwwGame/questionService';
import {CreateQuizQuestionRequest, QuestionVisibility} from "../types/question.types.ts";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Request to create a new question (with or without media)
 * ✅ Aligned with backend CreateQuestionRequest
 */
export interface CreateQuestionRequest {
    question: string;
    answer: string;
    difficulty: APIDifficulty;
    topic?: string;
    additionalInfo?: string;
    source?: string;
    questionType?: QuestionType;
    // Media properties - matches backend exactly
    questionMediaUrl?: string;
    questionMediaId?: string;
    questionMediaType?: MediaType;
    // Access control
    visibility?: QuestionVisibility;
}

/**
 * Complete Quiz Question response from backend
 * ✅ Aligned with backend QuizQuestionDTO
 */
export interface QuizQuestion {
    // Basic identifiers
    id: number;  // ✅ Changed from string to number (matches backend Long)
    externalId?: string;
    legacyQuestionId?: number;

    // Core question content
    question: string;
    answer: string;

    // Classification
    difficulty: APIDifficulty;
    questionType: QuestionType;
    topic?: string;
    source?: string;

    // Enhanced metadata
    authors?: string;
    comments?: string;
    passCriteria?: string;
    additionalInfo?: string;

    // Media properties
    questionMediaUrl?: string;
    questionMediaId?: string;
    questionMediaType?: MediaType;
    questionThumbnailUrl?: string;

    // User creation tracking
    isUserCreated: boolean;
    creatorId?: number;
    creatorUsername?: string;

    // Access control
    visibility: QuestionVisibility;
    originalQuizId?: number;
    originalQuizTitle?: string;

    // Access information for current user
    canEdit?: boolean;
    canDelete?: boolean;
    canUseInQuiz?: boolean;

    // Status and usage
    isActive: boolean;
    usageCount: number;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

/**
 * Paginated response for questions
 */
export interface PaginatedQuestionResponse {
    content: QuizQuestion[];
    totalPages: number;
    totalElements: number;
    currentPage: number;
    pageSize: number;
}

/**
 * Search parameters for questions
 */
export interface QuestionSearchParams {
    keyword?: string;
    difficulty?: APIDifficulty;
    topic?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
}

/**
 * Request to update question visibility
 */
export interface UpdateQuestionVisibilityRequest {
    visibility: QuestionVisibility;
    originalQuizId?: number;  // Required if visibility is QUIZ_ONLY
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
    difficulty: APIDifficulty;
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
    difficulty: APIDifficulty;
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
    difficulty: APIDifficulty;
    roundTimeSeconds: number;
    totalRounds: number;
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

        /**
         * ✅ Create a new user question (unified endpoint)
         * This handles both text-only and questions with media
         */
        createUserQuestion: builder.mutation<QuizQuestion, CreateQuestionRequest>({
            query: (request) => ({
                url: '/quiz/questions',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: [{type: 'QuizQuestion', id: 'USER_LIST'}, 'Topics'],
        }),

        /**
         * ✅ NEW: Create question with media using multipart/form-data
         * This is the NEW unified endpoint that handles media upload + question creation atomically
         */
        createQuestionWithMedia: builder.mutation<
            QuizQuestion,
            {
                questionData: CreateQuizQuestionRequest;
                mediaFile?: { uri: string; name: string; type: string };
            }
        >({
            query: ({ questionData, mediaFile }) => {
                const formData = new FormData();

                // Add question as JSON blob
                const questionBlob = new Blob([JSON.stringify(questionData)], {
                    type: 'application/json',
                });
                formData.append('questionData', questionBlob);

                // Add media if present
                if (mediaFile) {
                    formData.append('mediaFile', {
                        uri: mediaFile.uri,
                        name: mediaFile.name,
                        type: mediaFile.type,
                    } as any);
                }

                return {
                    url: '/quiz/questions/with-media',
                    method: 'POST',
                    body: formData,
                    formData: true,
                };
            },
            invalidatesTags: [{type: 'QuizQuestion', id: 'USER_LIST'}, 'Topics'],
        }),

        /**
         * Get paginated user questions
         */
        getUserQuestionsPaginated: builder.query<PaginatedQuestionResponse, QuestionSearchParams>({
            query: (params) => ({
                url: '/quiz/questions/me',
                params: {
                    page: params.page ?? 0,
                    size: params.size ?? 20,
                    sortBy: params.sortBy ?? 'createdAt',
                    sortDirection: params.sortDirection ?? 'DESC',
                    ...(params.keyword && {keyword: params.keyword}),
                    ...(params.difficulty && {difficulty: params.difficulty}),
                    ...(params.topic && {topic: params.topic}),
                },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.content.map(({id}) => ({type: 'QuizQuestion' as const, id})),
                        {type: 'QuizQuestion', id: 'USER_LIST'},
                    ]
                    : [{type: 'QuizQuestion', id: 'USER_LIST'}],
        }),

        /**
         * Get all user questions (non-paginated)
         */
        getUserQuestions: builder.query<QuizQuestion[], void>({
            query: () => '/quiz/questions/me?size=1000',
            transformResponse: (response: PaginatedQuestionResponse) => response.content,
            providesTags: (result) =>
                result && Array.isArray(result)
                    ? [
                        ...result.map(({id}) => ({type: 'QuizQuestion' as const, id})),
                        {type: 'QuizQuestion', id: 'USER_LIST'},
                    ]
                    : [{type: 'QuizQuestion', id: 'USER_LIST'}],
        }),

        /**
         * Delete a user question
         */
        deleteUserQuestion: builder.mutation<{ message: string }, number>({
            query: (questionId) => ({
                url: `/quiz/questions/${questionId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, questionId) => [
                {type: 'QuizQuestion', id: questionId},
                {type: 'QuizQuestion', id: 'USER_LIST'},
            ],
        }),

        /**
         * Update question visibility
         */
        updateQuestionVisibility: builder.mutation<QuizQuestion, { questionId: number, request: UpdateQuestionVisibilityRequest }>({
            query: ({questionId, request}) => ({
                url: `/quiz/questions/${questionId}/visibility`,
                method: 'PATCH',
                body: request,
            }),
            invalidatesTags: (result, error, {questionId}) => [
                {type: 'QuizQuestion', id: questionId},
                {type: 'QuizQuestion', id: 'USER_LIST'},
            ],
        }),

        /**
         * Get available topics
         */
        getAvailableTopics: builder.query<string[], void>({
            query: () => '/quiz-questions/topics',
            providesTags: ['Topics'],
        }),

        /**
         * Search questions (app questions)
         */
        searchQuestions: builder.query<PaginatedQuestionResponse, QuestionSearchParams>({
            query: (params) => ({
                url: '/quiz-questions/search',
                params: {
                    page: params.page ?? 0,
                    size: params.size ?? 20,
                    sortBy: params.sortBy ?? 'createdAt',
                    sortDirection: params.sortDirection ?? 'DESC',
                    ...(params.keyword && {keyword: params.keyword}),
                    ...(params.difficulty && {difficulty: params.difficulty}),
                    ...(params.topic && {topic: params.topic}),
                },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.content.map(({id}) => ({type: 'QuizQuestion' as const, id})),
                        {type: 'QuizQuestion', id: 'LIST'},
                    ]
                    : [{type: 'QuizQuestion', id: 'LIST'}],
        }),

        /**
         * Search accessible questions (public + friends + quiz-specific)
         */
        searchAccessibleQuestions: builder.query<PaginatedQuestionResponse, QuestionSearchParams & { quizId?: number }>({
            query: (params) => ({
                url: '/quiz/questions/accessible',
                params: {
                    page: params.page ?? 0,
                    size: params.size ?? 20,
                    ...(params.keyword && {keyword: params.keyword}),
                    ...(params.difficulty && {difficulty: params.difficulty}),
                    ...(params.topic && {topic: params.topic}),
                    ...(params.quizId && {quizId: params.quizId}),
                },
            }),
            providesTags: [{type: 'QuizQuestion', id: 'ACCESSIBLE_LIST'}],
        }),

        // ========================================================================
        // RELATIONSHIP ENDPOINTS
        // ========================================================================

        createRelationship: builder.mutation<UserRelationship, string>({
            query: (username) => ({
                url: '../relationships',
                method: 'POST',
                body: { username },
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

        checkConnection: builder.query<{ connected: boolean; status?: string }, string>({
            query: (username) => `../relationships/check/${username}`,
        }),

        // ========================================================================
        // QUIZ SESSION ENDPOINTS
        // ========================================================================

        startQuizSession: builder.mutation<QuizSession, StartQuizSessionRequest>({
            query: (request) => ({
                url: '/quiz/sessions',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: [{type: 'QuizSession', id: 'USER_LIST'}],
        }),

        beginQuizSession: builder.mutation<QuizSession, string>({
            query: (sessionId) => ({
                url: `/quiz/sessions/${sessionId}/begin`,
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
                url: `/quiz/sessions/${sessionId}/rounds/${roundId}/submit`,
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
                url: `/quiz/sessions/${sessionId}/complete`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, sessionId) => [
                {type: 'QuizSession', id: sessionId},
                {type: 'QuizSession', id: 'USER_LIST'},
            ],
        }),

        getQuizSession: builder.query<QuizSession, string>({
            query: (sessionId) => `/quiz/sessions/${sessionId}`,
            providesTags: (result, error, sessionId) => [
                {type: 'QuizSession', id: sessionId}
            ],
        }),

        getUserQuizSessions: builder.query<QuizSession[], { limit?: number }>({
            query: ({limit = 20}) => ({
                url: '/quiz/sessions/me',
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
            query: (sessionId) => `/quiz/sessions/${sessionId}/rounds`,
            providesTags: (result, error, sessionId) => [
                {type: 'QuizRound', id: `SESSION_${sessionId}`}
            ],
        }),

        getCurrentRound: builder.query<QuizRound, string>({
            query: (sessionId) => `/quiz/sessions/${sessionId}/current-round`,
            providesTags: (result, error, sessionId) => [
                {type: 'QuizRound', id: `CURRENT_${sessionId}`}
            ],
        }),

        updateQuizSessionConfig: builder.mutation<QuizSession, {
            sessionId: string;
            config: any;
        }>({
            query: ({sessionId, config}) => ({
                url: `/quiz/sessions/${sessionId}/config`,
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
// EXPORT HOOKS - FIXED (Removed duplicate)
// ============================================================================

export const {
    // ✅ Question hooks (no more duplicate!)
    useCreateUserQuestionMutation,
    useCreateQuestionWithMediaMutation, // ✅ NEW unified endpoint
    useGetUserQuestionsQuery,
    useDeleteUserQuestionMutation,
    useSearchQuestionsQuery,

    // Question access control hooks
    useGetUserQuestionsPaginatedQuery,
    useSearchAccessibleQuestionsQuery,
    useUpdateQuestionVisibilityMutation,

    // Relationship hooks
    useCreateRelationshipMutation,
    useGetMyRelationshipsQuery,
    useGetPendingRequestsQuery,
    useAcceptRelationshipMutation,
    useRejectRelationshipMutation,
    useRemoveRelationshipMutation,
    useCheckConnectionQuery,

    // Quiz session hooks
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

    // ❌ REMOVED: useCreateUserQuestionWithMediaMutation (was duplicate)
} = quizApi;