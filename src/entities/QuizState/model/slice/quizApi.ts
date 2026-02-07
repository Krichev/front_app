// src/entities/QuizState/model/slice/quizApi.ts - FIXED VERSION
import {BaseQueryArg, createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import {APIDifficulty, MediaType, QuestionType} from '../../../../services/wwwGame/questionService';
import {CreateQuizQuestionRequest, QuestionVisibility, MediaSourceType} from "../types/question.types";
import {RootStateForApi} from '../../../../app/providers/StoreProvider/storeTypes';
import {Platform} from 'react-native';

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
    // External Media
    mediaSourceType?: MediaSourceType;
    externalMediaUrl?: string;
    questionVideoStartTime?: number;
    questionVideoEndTime?: number;
    answerMediaUrl?: string;
    answerVideoStartTime?: number;
    answerVideoEndTime?: number;
    answerTextVerification?: string;
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

    // External Media Support
    mediaSourceType?: MediaSourceType;
    externalMediaUrl?: string;
    externalMediaId?: string;
    questionVideoStartTime?: number;
    questionVideoEndTime?: number;
    answerMediaUrl?: string;
    answerExternalMediaId?: string;
    answerVideoStartTime?: number;
    answerVideoEndTime?: number;
    answerTextVerification?: string;

    // ===== AUDIO CHALLENGE FIELDS =====
    /** Type of audio challenge - only set for audio questions */
    audioChallengeType?: 'RHYTHM_CREATION' | 'RHYTHM_REPEAT' | 'SOUND_MATCH' | 'SINGING' | null;
    /** Reference media ID for challenges requiring reference audio */
    audioReferenceMediaId?: number | null;
    /** Start time in seconds for audio segment */
    audioSegmentStart?: number | null;
    /** End time in seconds for audio segment (null = play to end) */
    audioSegmentEnd?: number | null;
    /** Minimum score percentage to pass (0-100) */
    minimumScorePercentage?: number | null;
    /** BPM for rhythm challenges */
    rhythmBpm?: number | null;
    /** Time signature string (e.g., "4/4") */
    rhythmTimeSignature?: string | null;
    /** JSON string with additional config */
    audioChallengeConfig?: string | null;

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

export type UserRelationship = {
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

export type GameMode = 'STANDARD' | 'BRAIN_RING' | 'BLITZ';
export type BrainRingRoundStatus = 'WAITING_FOR_BUZZ' | 'PLAYER_ANSWERING' | 'CORRECT_ANSWER' | 'ALL_LOCKED_OUT';

export interface BuzzRequest {
    userId: number;
    timestamp: string; // ISO timestamp
}

export interface BuzzResponse {
    success: boolean;
    isFirstBuzzer: boolean;
    answerDeadline?: string;
    message: string;
}

export interface BrainRingAnswerRequest {
    userId: number;
    answer: string;
}

export interface BrainRingAnswerResponse {
    isCorrect: boolean;
    playerLockedOut: boolean;
    roundComplete: boolean;
    correctAnswer?: string;
    nextBuzzerAllowed: boolean;
    winnerUserId?: number;
}

export interface BrainRingState {
    currentBuzzerUserId?: number;
    currentBuzzerName?: string;
    lockedOutPlayers: number[];
    answerDeadline?: string;
    roundStatus: BrainRingRoundStatus;
    winnerUserId?: number;
}

export interface QuizConfig {
    gameType: 'WWW';
    teamName: string;
    teamMembers: string[];
    difficulty: APIDifficulty;
    gameMode: GameMode;
    answerTimeSeconds: number;
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    enableAiAnswerValidation: boolean;
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
    gameMode: GameMode;
    answerTimeSeconds: number;
    roundTimeSeconds: number;
    totalRounds: number;
    completedRounds: number;
    correctAnswers: number;
    scorePercentage: number;
    enableAiHost: boolean;
    enableAiAnswerValidation: boolean;
    questionSource: string;
    status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'CANCELLED';
    startedAt?: string;
    completedAt?: string;
    totalDurationSeconds?: number;
    createdAt: string;
    // Pause metadata
    pausedAt?: string;
    pausedAtRound?: number;
    remainingTimeSeconds?: number;
    pausedAnswer?: string;
    pausedNotes?: string;
}

export interface StartQuizSessionRequest {
    challengeId: string;
    teamName: string;
    teamMembers: string[];
    difficulty: APIDifficulty;
    gameMode?: GameMode;
    answerTimeSeconds?: number;
    roundTimeSeconds: number;
    totalRounds: number;
    enableAiHost: boolean;
    enableAiAnswerValidation?: boolean;
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
    hintUsed?: boolean;
    voiceRecordingUsed?: boolean;
    aiFeedback?: string;
    aiValidationUsed?: boolean;
    aiAccepted?: boolean;
    aiConfidence?: number;
    aiExplanation?: string;
}

export interface SubmitRoundAnswerRequest {
    teamAnswer: string;
    playerWhoAnswered: string;
    discussionNotes?: string;
}

export interface PauseQuizSessionRequest {
    pausedAtRound: number;
    remainingTimeSeconds: number;
    currentAnswer?: string;
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
         * ✅ UNIFIED: Create question with or without media in single atomic operation
         * ALWAYS uses FormData endpoint - backend handles both cases
         */
        createQuestionWithMedia: builder.mutation<
            QuizQuestion,
            {
                questionData: CreateQuizQuestionRequest;
                mediaFile?: { uri: string; name: string; type: string };
            }
        >({
            queryFn: async (
                { questionData, mediaFile },
                api,
                extraOptions,
                baseQuery
            ) => {
                try {
                    const state = api.getState() as RootStateForApi;
                    const token: string | null = state.auth.accessToken;

                    // ALWAYS use FormData - backend handles both cases
                    const formData = new FormData();

                    // Append question data as JSON blob
                    formData.append('questionData', JSON.stringify(questionData));

                    // CRITICAL FIX: Properly format file for React Native
                    if (mediaFile && mediaFile.uri) {
                        // Normalize URI for the platform
                        let fileUri = mediaFile.uri;

                        // Android content:// URIs should work as-is
                        // Android file:// URIs should work as-is
                        // If it's a bare path, add file:// prefix
                        if (Platform.OS === 'android') {
                            if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
                                fileUri = 'file://' + fileUri;
                            }
                        }

                        // iOS URIs typically work as-is
                        // But if they start with 'ph://' (Photos), we need to handle differently
                        // For now, assume the URI from FileService is already correct

                        // Determine file extension and type
                        const fileName = mediaFile.name || `video_${Date.now()}.mp4`;
                        const mimeType = mediaFile.type || 'video/mp4';

                        // CRITICAL: This is the React Native FormData format
                        const file = {
                            uri: fileUri,
                            type: mimeType,
                            name: fileName,
                        };

                        console.log('📎 [createQuestionWithMedia] Attaching file:', {
                            uri: fileUri.substring(0, 100) + '...',
                            type: mimeType,
                            name: fileName,
                            platform: Platform.OS,
                        });

                        // Append as 'mediaFile' to match @RequestPart("mediaFile")
                        formData.append('mediaFile', file as any);
                    } else {
                        console.log('⚠️ [createQuestionWithMedia] No media file to attach');
                    }

                    // Log the request
                    console.log('📦 [createQuestionWithMedia] FormData contents:', {
                        hasQuestionData: true,
                        questionType: questionData.questionType,
                        hasMediaFile: !!mediaFile,
                        mediaFileUri: mediaFile?.uri?.substring(0, 50),
                        hasExternalUrl: !!questionData.externalMediaUrl,
                        mediaSourceType: questionData.mediaSourceType,
                    });
                    
                    console.log('🚀 [createQuestionWithMedia] Sending request:', {
                        url: 'http://10.0.2.2:8082/challenger/api/quiz/questions/with-media',
                        hasToken: !!token,
                        hasMediaFile: !!mediaFile,
                        questionType: questionData.questionType,
                    });

                    const response = await fetch(
                        'http://10.0.2.2:8082/challenger/api/quiz/questions/with-media',
                        {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                ...(token && { 'Authorization': `Bearer ${token}` }),
                                // DO NOT set Content-Type - fetch will set it with boundary
                            },
                            body: formData,
                        }
                    );

                    console.log('📬 [createQuestionWithMedia] Response status:', response.status);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('❌ [createQuestionWithMedia] Failed:', response.status, errorText);
                        return {
                            error: {
                                status: response.status,
                                data: errorText,
                            },
                        };
                    }

                    const data: QuizQuestion = await response.json();
                    console.log('✅ [createQuestionWithMedia] Success:', {
                        id: data.id,
                        questionType: data.questionType,
                        mediaId: data.questionMediaId,
                        mediaUrl: data.questionMediaUrl?.substring(0, 50),
                    });

                    return { data };

                } catch (error) {
                    console.error('❌ [createQuestionWithMedia] Exception:', error);
                    return {
                        error: {
                            status: 'FETCH_ERROR',
                            error: error instanceof Error ? error.message : String(error),
                        },
                    };
                }
            },
            invalidatesTags: [
                { type: 'QuizQuestion', id: 'USER_LIST' },
                { type: 'QuizQuestion', id: 'LIST' },
                'Topics'
            ],
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
         * Get a single quiz question by ID
         */
        getQuizQuestionById: builder.query<QuizQuestion, number>({
            query: (id) => `/quiz-questions/${id}`,
            providesTags: (result, error, id) => [{ type: 'QuizQuestion', id }],
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

        pauseQuizSession: builder.mutation<QuizSession, {
            sessionId: string;
            pauseData: PauseQuizSessionRequest;
        }>({
            query: ({sessionId, pauseData}) => ({
                url: `/quiz/sessions/${sessionId}/pause`,
                method: 'PUT',
                body: pauseData,
            }),
            invalidatesTags: (result, error, {sessionId}) => [
                {type: 'QuizSession', id: sessionId},
                {type: 'QuizSession', id: 'USER_LIST'},
            ],
        }),

        resumeQuizSession: builder.mutation<QuizSession, string>({
            query: (sessionId) => ({
                url: `/quiz/sessions/${sessionId}/resume`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, sessionId) => [
                {type: 'QuizSession', id: sessionId},
                {type: 'QuizSession', id: 'USER_LIST'},
            ],
        }),

        abandonQuizSession: builder.mutation<void, string>({
            query: (sessionId) => ({
                url: `/quiz/sessions/${sessionId}/abandon`,
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

        // ========================================================================
        // BRAIN RING ENDPOINTS
        // ========================================================================

        buzz: builder.mutation<BuzzResponse, {
            sessionId: string;
            roundId: string;
            request: BuzzRequest;
        }>({
            query: ({sessionId, roundId, request}) => ({
                url: `/quiz/sessions/${sessionId}/rounds/${roundId}/buzz`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: (result, error, {sessionId, roundId}) => [
                {type: 'QuizRound', id: `BRAIN_RING_STATE_${roundId}`}
            ],
        }),

        submitBrainRingAnswer: builder.mutation<BrainRingAnswerResponse, {
            sessionId: string;
            roundId: string;
            request: BrainRingAnswerRequest;
        }>({
            query: ({sessionId, roundId, request}) => ({
                url: `/quiz/sessions/${sessionId}/rounds/${roundId}/brain-ring-answer`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: (result, error, {sessionId, roundId}) => [
                {type: 'QuizSession', id: sessionId},
                {type: 'QuizRound', id: `SESSION_${sessionId}`},
                {type: 'QuizRound', id: roundId},
                {type: 'QuizRound', id: `BRAIN_RING_STATE_${roundId}`}
            ],
        }),

        getBrainRingState: builder.query<BrainRingState, {
            sessionId: string;
            roundId: string;
        }>({
            query: ({sessionId, roundId}) => `/quiz/sessions/${sessionId}/rounds/${roundId}/brain-ring-state`,
            providesTags: (result, error, {sessionId, roundId}) => [
                {type: 'QuizRound', id: `BRAIN_RING_STATE_${roundId}`}
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
    useGetQuizQuestionByIdQuery, // ✅ NEW
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
    usePauseQuizSessionMutation,
    useResumeQuizSessionMutation,
    useAbandonQuizSessionMutation,
    useGetQuizSessionQuery,
    useGetUserQuizSessionsQuery,
    useGetQuizRoundsQuery,
    useGetAvailableTopicsQuery,
    useGetCurrentRoundQuery,
    useUpdateQuizSessionConfigMutation,

    // Brain Ring hooks
    useBuzzMutation,
    useSubmitBrainRingAnswerMutation,
    useGetBrainRingStateQuery,

    // ❌ REMOVED: useCreateUserQuestionWithMediaMutation (was duplicate)
} = quizApi;