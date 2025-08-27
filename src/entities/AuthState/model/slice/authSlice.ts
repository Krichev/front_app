// src/entities/AuthState/model/slice/authSlice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface User {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt?: string;
    statsCompleted?: number;
    statsCreated?: number;
    statsSuccess?: number;
    // Add any other user fields you have
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
}

const initialState: AuthState = {
    accessToken: null,
    refreshToken: null,
    user: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setTokens(state, action: PayloadAction<AuthState>) {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.user = action.payload.user;
        },
        updateUser(state, action: PayloadAction<User>) {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        updateUserField(state, action: PayloadAction<{ field: keyof User; value: any }>) {
            if (state.user) {
                (state.user as any)[action.payload.field] = action.payload.value;
            }
        },
        logout(state) {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
        },
    },
});

export const { setTokens, updateUser, updateUserField, logout } = authSlice.actions;
export default authSlice.reducer;