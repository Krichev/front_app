// src/entities/question/api/index.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import type {QuestionData, QuestionDifficulty} from '../model/types';
import {QuestionApiService} from '../../../shared/api/question/service';

export const questionApi = createApi({
    reducerPath: 'questionApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/questions/', // Base URL for your API
    }),
    tagTypes: ['Question'],
    endpoints: (builder) => ({
        // Fetch random questions using the shared service
        fetchRandomQuestions: builder.query<QuestionData[], {
            count?: number;
            difficulty?: QuestionDifficulty;
        }>({
            queryFn: async ({ count = 10, difficulty }) => {
                try {
                    const questions = await QuestionApiService.fetchRandomQuestions(count, difficulty);
                    return { data: questions };
                } catch (error) {
                    return {
                        error: {
                            status: 500,
                            data: error instanceof Error ? error.message : 'Unknown error',
                        },
                    };
                }
            },
            providesTags: ['Question'],
        }),

        // Search questions using the shared service
        searchQuestions: builder.query<QuestionData[], {
            keyword: string;
            count?: number;
            difficulty?: QuestionDifficulty;
        }>({
            queryFn: async ({ keyword, count = 10, difficulty }) => {
                try {
                    const questions = await QuestionApiService.searchQuestions(keyword, count, difficulty);
                    return { data: questions };
                } catch (error) {
                    return {
                        error: {
                            status: 500,
                            data: error instanceof Error ? error.message : 'Unknown error',
                        },
                    };
                }
            },
            providesTags: ['Question'],
        }),

        // Create custom question (if you have a backend)
        createQuestion: builder.mutation<QuestionData, Omit<QuestionData, 'id'>>({
            query: (questionData) => ({
                url: '',
                method: 'POST',
                body: questionData,
            }),
            invalidatesTags: ['Question'],
        }),

        // Update question
        updateQuestion: builder.mutation<QuestionData, { id: string; updates: Partial<QuestionData> }>({
            query: ({ id, updates }) => ({
                url: id,
                method: 'PATCH',
                body: updates,
            }),
            invalidatesTags: ['Question'],
        }),

        // Delete question
        deleteQuestion: builder.mutation<void, string>({
            query: (id) => ({
                url: id,
                method: 'DELETE',
            }),
            invalidatesTags: ['Question'],
        }),
    }),
});

export const {
    useFetchRandomQuestionsQuery,
    useSearchQuestionsQuery,
    useCreateQuestionMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
} = questionApi;