// src/entities/question/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {Question} from './types';

interface QuestionState {
    userQuestions: Question[];
    selectedQuestions: Question[];
    isLoading: boolean;
    error: string | null;
}

const initialState: QuestionState = {
    userQuestions: [],
    selectedQuestions: [],
    isLoading: false,
    error: null,
};

export const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        setUserQuestions: (state, action: PayloadAction<Question[]>) => {
            state.userQuestions = action.payload;
        },
        addUserQuestion: (state, action: PayloadAction<Question>) => {
            state.userQuestions.push(action.payload);
        },
        updateUserQuestion: (state, action: PayloadAction<Question>) => {
            const index = state.userQuestions.findIndex(q => q.id === action.payload.id);
            if (index !== -1) {
                state.userQuestions[index] = action.payload;
            }
        },
        removeUserQuestion: (state, action: PayloadAction<string>) => {
            state.userQuestions = state.userQuestions.filter(q => q.id !== action.payload);
        },
        setSelectedQuestions: (state, action: PayloadAction<Question[]>) => {
            state.selectedQuestions = action.payload;
        },
        addSelectedQuestion: (state, action: PayloadAction<Question>) => {
            if (!state.selectedQuestions.find(q => q.id === action.payload.id)) {
                state.selectedQuestions.push(action.payload);
            }
        },
        removeSelectedQuestion: (state, action: PayloadAction<string>) => {
            state.selectedQuestions = state.selectedQuestions.filter(q => q.id !== action.payload);
        },
        clearSelectedQuestions: (state) => {
            state.selectedQuestions = [];
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
