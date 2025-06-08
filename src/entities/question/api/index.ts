// src/entities/question/api/index.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {baseQuery} from '../../../shared/api';
import type {CreateQuestionRequest, Question, QuestionFilters, UpdateQuestionRequest,} from '../model/types';

export const questionApi = createApi({
    reducerPath: 'questionApi',
    baseQuery: baseQuery,
    tagTypes: ['Question'],
    endpoints: (builder) => ({
        // Get questions with filters
        getQuestions: builder.query<Question[], QuestionFilters>({
            query: (filters) => ({
                url: '/questions',
                params: filters,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Question' as const, id })),
                        { type: 'Question', id: 'LIST' },
                    ]
                    : [{ type: 'Question', id: 'LIST' }],
        }),

        // Get user's questions
        getUserQuestions: builder.query<Question[], void>({
            query: () => '/questions/me',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Question' as const, id })),
                        { type: 'Question', id: 'USER_LIST' },
                    ]
                    : [{ type: 'Question', id: 'USER_LIST' }],
        }),

        // Get questions by difficulty
        getQuestionsByDifficulty: builder.query<Question[], {
            difficulty: 'Easy' | 'Medium' | 'Hard';
            count?: number;
        }>({
            query: ({ difficulty, count = 10 }) => ({
                url: `/questions/difficulty/${difficulty}`,
                params: { count },
            }),
            providesTags: (result, error, { difficulty }) => [
                { type: 'Question', id: `DIFFICULTY_${difficulty}` }
            ],
        }),

        // Search questions
        searchQuestions: builder.query<Question[], { keyword: string; limit?: number }>({
            query: ({ keyword, limit = 20 }) => ({
                url: '/questions/search',
                params: { keyword, limit },
            }),
            providesTags: [{ type: 'Question', id: 'SEARCH' }],
        }),

        // Create question
        createQuestion: builder.mutation<Question, CreateQuestionRequest>({
            query: (body) => ({
                url: '/questions',
                method: 'POST',
                body,
            }),
            invalidatesTags: [
                { type: 'Question', id: 'LIST' },
                { type: 'Question', id: 'USER_LIST' },
            ],
        }),

        // Update question
        updateQuestion: builder.mutation<Question, UpdateQuestionRequest>({
            query: ({ id, ...body }) => ({
                url: `/questions/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Question', id },
                { type: 'Question', id: 'LIST' },
                { type: 'Question', id: 'USER_LIST' },
            ],
        }),

        // Delete question
        deleteQuestion: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/questions/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Question', id },
                { type: 'Question', id: 'LIST' },
                { type: 'Question', id: 'USER_LIST' },
            ],
        }),

        // Get single question
        getQuestionById: builder.query<Question, string>({
            query: (id) => `/questions/${id}`,
            providesTags: (result, error, id) => [{ type: 'Question', id }],
        }),
    }),
});

export const {
    useGetQuestionsQuery,
    useGetUserQuestionsQuery,
    useGetQuestionsByDifficultyQuery,
    useSearchQuestionsQuery,
    useCreateQuestionMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
    useGetQuestionByIdQuery,
} = questionApi;