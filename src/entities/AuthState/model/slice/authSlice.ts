// src/entities/AuthState/model/slice/authSlice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import * as Keychain from 'react-native-keychain';

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

// Enhanced action creators with persistence
export const setTokensWithPersistence = (authData: AuthState) => async (dispatch: any) => {
    try {
        // Update Redux state
        dispatch(setTokens(authData));

        // Persist to Keychain
        if (authData.accessToken && authData.refreshToken && authData.user) {
            await Keychain.setGenericPassword('authTokens', JSON.stringify({
                accessToken: authData.accessToken,
                refreshToken: authData.refreshToken,
                user: authData.user
            }));
            console.log('Tokens persisted to Keychain successfully');
        }
    } catch (error) {
        console.error('Error persisting tokens:', error);
        // Still update Redux state even if persistence fails
        dispatch(setTokens(authData));
    }
};

export const updateUserWithPersistence = (userData: User) => async (dispatch: any, getState: any) => {
    try {
        // Update Redux state
        dispatch(updateUser(userData));

        // Get current auth state
        const currentState = getState().auth;

        // Update persistent storage with new user data
        if (currentState.accessToken && currentState.refreshToken) {
            await Keychain.setGenericPassword('authTokens', JSON.stringify({
                accessToken: currentState.accessToken,
                refreshToken: currentState.refreshToken,
                user: userData
            }));
            console.log('User data updated in persistent storage');
        }
    } catch (error) {
        console.error('Error updating user data in storage:', error);
        // Still update Redux state even if persistence fails
        dispatch(updateUser(userData));
    }
};

export const logoutWithCleanup = () => async (dispatch: any) => {
    try {
        // Clear Redux state
        dispatch(logout());

        // Clear Keychain
        await Keychain.resetGenericPassword();

        console.log('Logout completed - all tokens cleared');
    } catch (error) {
        console.error('Error during logout cleanup:', error);
        // Still clear Redux state even if Keychain clear fails
        dispatch(logout());
    }
};

export const { setTokens, updateUser, updateUserField, logout } = authSlice.actions;
export default authSlice.reducer;