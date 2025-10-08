// src/entities/AuthState/model/slice/authSlice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import * as Keychain from 'react-native-keychain';
import {jwtDecode} from 'jwt-decode';

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
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isRefreshing: boolean;
}

interface JwtPayload {
    exp: number;
    iat: number;
    sub: string;
}

const initialState: AuthState = {
    accessToken: null,
    refreshToken: null,
    user: null,
    isRefreshing: false,
};

// Helper function to check if token is expired or about to expire
export const isTokenExpired = (token: string | null, bufferMinutes: number = 1): boolean => {
    if (!token) return true;

    try {
        const decoded = jwtDecode<JwtPayload>(token);
        const currentTime = Date.now() / 1000; // Convert to seconds
        const bufferTime = bufferMinutes * 60; // Convert minutes to seconds

        // Token is expired or will expire within buffer time
        return decoded.exp - bufferTime <= currentTime;
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setTokens(state, action: PayloadAction<Omit<AuthState, 'isRefreshing'>>) {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.user = action.payload.user;
        },
        setRefreshing(state, action: PayloadAction<boolean>) {
            state.isRefreshing = action.payload;
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
            state.isRefreshing = false;
        },
    },
});

// Enhanced action creators with persistence
export const setTokensWithPersistence = (authData: Omit<AuthState, 'isRefreshing'>) => async (dispatch: any) => {
    try {
        dispatch(setTokens(authData));

        if (authData.accessToken && authData.refreshToken && authData.user) {
            await Keychain.setGenericPassword('authTokens', JSON.stringify({
                accessToken: authData.accessToken,
                refreshToken: authData.refreshToken,
                user: authData.user
            }));
            console.log('✅ Tokens persisted to Keychain successfully');
        }
    } catch (error) {
        console.error('❌ Error persisting tokens:', error);
        dispatch(setTokens(authData));
    }
};

export const updateUserWithPersistence = (userData: User) => async (dispatch: any, getState: any) => {
    try {
        dispatch(updateUser(userData));

        const currentState = getState().auth;

        if (currentState.accessToken && currentState.refreshToken) {
            await Keychain.setGenericPassword('authTokens', JSON.stringify({
                accessToken: currentState.accessToken,
                refreshToken: currentState.refreshToken,
                user: userData
            }));
            console.log('✅ User data updated in persistent storage');
        }
    } catch (error) {
        console.error('❌ Error updating user data in storage:', error);
        dispatch(updateUser(userData));
    }
};

export const logoutWithCleanup = () => async (dispatch: any) => {
    try {
        dispatch(logout());
        await Keychain.resetGenericPassword();
        console.log('✅ Logout completed - all tokens cleared');
    } catch (error) {
        console.error('❌ Error during logout cleanup:', error);
        dispatch(logout());
    }
};

export const { setTokens, setRefreshing, updateUser, updateUserField, logout } = authSlice.actions;
export default authSlice.reducer;

