// src/entities/question/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Question, QuestionDifficulty} from './types';

interface QuestionState {
    questions: Question[];
    userQuestions: Question[];
    selectedQuestions: Question[];
    filters: {
        difficulty?: QuestionDifficulty;
        topic?: string;
        search?: string;
    };
    isLoading: boolean;
    error: string | null;
}

const initialState: QuestionState = {
    questions: [],
    userQuestions: [],
    selectedQuestions: [],
    filters: {},
    isLoading: false,
    error: null,
};

export const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        setQuestions: (state, action: PayloadAction<Question[]>) => {
            state.questions = action.payload;
        },

        setUserQuestions: (state, action: PayloadAction<Question[]>) => {
            state.userQuestions = action.payload;
        },

        addQuestion: (state, action: PayloadAction<Question>) => {
            if (action.payload.isUserCreated) {
                state.userQuestions.push(action.payload);
            } else {
                state.questions.push(action.payload);
            }
        },

        updateQuestion: (state, action: PayloadAction<Question>) => {
            const questionList = action.payload.isUserCreated
                ? state.userQuestions
                : state.questions;

            const index = questionList.findIndex(q => q.id === action.payload.id);
            if (index !== -1) {
                questionList[index] = action.payload;
            }
        },

        removeQuestion: (state, action: PayloadAction<{ id: string; isUserCreated: boolean }>) => {
            if (action.payload.isUserCreated) {
                state.userQuestions = state.userQuestions.filter(q => q.id !== action.payload.id);
            } else {
                state.questions = state.questions.filter(q => q.id !== action.payload.id);
            }
            // Also remove from selected questions
            state.selectedQuestions = state.selectedQuestions.filter(q => q.id !== action.payload.id);
        },

        selectQuestion: (state, action: PayloadAction<Question>) => {
            const exists = state.selectedQuestions.find(q => q.id === action.payload.id);
            if (!exists) {
                state.selectedQuestions.push(action.payload);
            }
        },

        deselectQuestion: (state, action: PayloadAction<string>) => {
            state.selectedQuestions = state.selectedQuestions.filter(q => q.id !== action.payload);
        },

        clearSelectedQuestions: (state) => {
            state.selectedQuestions = [];
        },

        setFilters: (state, action: PayloadAction<Partial<QuestionState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        clearFilters: (state) => {
            state.filters = {};
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const questionActions = questionSlice.actions;
export const questionReducer = questionSlice.reducer;