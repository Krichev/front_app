// src/entities/user/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {User, UserPreferences} from './types';

interface UserState {
    currentUser: User | null;
    preferences: UserPreferences | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: UserState = {
    currentUser: null,
    preferences: null,
    isLoading: false,
    error: null,
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setCurrentUser: (state, action: PayloadAction<User>) => {
            state.currentUser = action.payload;
        },

        updateCurrentUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.currentUser) {
                state.currentUser = {...state.currentUser, ...action.payload};
            }
        },

        setUserPreferences: (state, action: PayloadAction<UserPreferences>) => {
            state.preferences = action.payload;
        },

        updateUserPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
            if (state.preferences) {
                state.preferences = {...state.preferences, ...action.payload};
            }
        },

        clearCurrentUser: (state) => {
            state.currentUser = null;
            state.preferences = null;
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const userActions = userSlice.actions;
export const userReducer = userSlice.reducer;