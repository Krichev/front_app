// src/entities/question/api/index.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {baseQuery} from '../../../shared/api';
import type {CreateQuestionRequest, Question, QuestionFilters} from '../model/types';

export const questionApi = createApi({
    reducerPath: 'questionApi',
    baseQuery: baseQuery,
    tagTypes: ['Question'],
    endpoints: (builder) => ({
        // Get questions by filters
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
            providesTags: [{ type: 'Question', id: 'USER_LIST' }],
        }),

        // Create question
        createQuestion: builder.mutation<Question, CreateQuestionRequest>({
            query: (data) => ({
                url: '/questions',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [
                { type: 'Question', id: 'LIST' },
                { type: 'Question', id: 'USER_LIST' },
            ],
        }),

        // Update question
        updateQuestion: builder.mutation<Question, { id: string } & Partial<CreateQuestionRequest>>({
            query: ({ id, ...data }) => ({
                url: `/questions/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Question', id },
                { type: 'Question', id: 'USER_LIST' },
            ],
        }),

        // Delete question
        deleteQuestion: builder.mutation<void, string>({
            query: (id) => ({
                url: `/questions/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Question', id },
                { type: 'Question', id: 'USER_LIST' },
            ],
        }),

        // Get questions by difficulty
        getQuestionsByDifficulty: builder.query<Question[], {
            difficulty: 'EASY' | 'MEDIUM' | 'HARD';
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
    }),
});

export const {
    useGetQuestionsQuery,
    useGetUserQuestionsQuery,
    useCreateQuestionMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
    useGetQuestionsByDifficultyQuery,
    useSearchQuestionsQuery,
} = questionApi;
