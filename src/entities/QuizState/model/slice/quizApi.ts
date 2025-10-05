// src/entities/QuizState/model/slice/quizApi.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {RootState} from "../../../../app/providers/StoreProvider/store";

// REMOVED: CreateQuizChallengeRequest (now only exists in ChallengeState)
// This interface is now only in challengeApi.ts to avoid conflicts

export interface CreateQuizQuestionRequest {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    source?: string;
    additionalInfo?: string;
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

// Quiz Question types
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
    externalId?: string;
    usageCount: number;
    createdAt: string;
    lastUsed?: string;
}

// Quiz Session types
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
    enableAiHost: boolean;
    questionSource: 'app' | 'user';
    customQuestionIds?: string[];
}

// Quiz Round types
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

export const quizApi = createApi({
    reducerPath: 'quizApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://10.0.2.2:8082/challenger/api/quiz',
        prepareHeaders: (headers, {getState}) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['QuizQuestion', 'QuizSession', 'QuizRound'],
    endpoints: (builder) => ({
        // Question Management
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

        // Quiz Session Management
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

export const {
    // Question endpoints
    useCreateUserQuestionMutation,
    useGetUserQuestionsQuery,
    useDeleteUserQuestionMutation,
    useGetQuestionsByDifficultyQuery,
    useSearchQuestionsQuery,

    // Session endpoints
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