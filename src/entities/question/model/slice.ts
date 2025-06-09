// src/entities/question/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {QuestionData, QuestionDifficulty, QuestionState} from './types';

const initialState: QuestionState = {
    questions: [],
    currentQuestion: null,
    isLoading: false,
    error: null,
    sources: [],
    categories: [],
    difficulty: null,
    selectedCategory: null,
};

export const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },
        setQuestions: (state, action: PayloadAction<QuestionData[]>) => {
            state.questions = action.payload;
            state.isLoading = false;
            state.error = null;
        },
        addQuestions: (state, action: PayloadAction<QuestionData[]>) => {
            state.questions.push(...action.payload);
        },
        setCurrentQuestion: (state, action: PayloadAction<QuestionData | null>) => {
            state.currentQuestion = action.payload;
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        setDifficulty: (state, action: PayloadAction<QuestionDifficulty | null>) => {
            state.difficulty = action.payload;
        },
        setSelectedCategory: (state, action: PayloadAction<string | null>) => {
            state.selectedCategory = action.payload;
        },
        updateQuestion: (state, action: PayloadAction<QuestionData>) => {
            const index = state.questions.findIndex(q => q.id === action.payload.id);
            if (index !== -1) {
                state.questions[index] = action.payload;
            }
            if (state.currentQuestion?.id === action.payload.id) {
                state.currentQuestion = action.payload;
            }
        },
        removeQuestion: (state, action: PayloadAction<string>) => {
            state.questions = state.questions.filter(q => q.id !== action.payload);
            if (state.currentQuestion?.id === action.payload) {
                state.currentQuestion = null;
            }
        },
        setSources: (state, action: PayloadAction<QuestionSource[]>) => {
            state.sources = action.payload;
        },
        setCategories: (state, action: PayloadAction<QuestionCategory[]>) => {
            state.categories = action.payload;
        },
        reset: () => initialState,
    },
});

export const questionActions = questionSlice.actions;