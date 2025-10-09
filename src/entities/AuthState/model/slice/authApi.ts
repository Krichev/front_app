// src/entities/AuthState/model/slice/authApi.ts - UPDATED with better error handling
import {BaseQueryFn, createApi, FetchArgs, fetchBaseQuery, FetchBaseQueryError} from '@reduxjs/toolkit/query/react';
import {RootState} from '../../../../app/providers/StoreProvider/store';
import {logout, setTokens} from './authSlice';
import * as Keychain from 'react-native-keychain';
import {Alert} from 'react-native';

export interface User {
    id: string;
    username: string;
    email: string;
    profilePictureUrl?: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface SignupRequest {
    username: string;
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: User;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

const networkConfig = {
    retryAttempts: 3,
    retryDelay: 1000,
};

// Custom base query with automatic token refresh
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    const baseQuery = fetchBaseQuery({
        baseUrl: 'http://10.0.2.2:8082/challenger/api/auth',
        prepareHeaders: (headers, {getState}) => {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    });

    let result = await baseQuery(args, api, extraOptions);
    console.log(result);
    // Handle network errors with retry
    if (result.error && result.error.status === 'FETCH_ERROR') {
        if ((result.error as any)?.message?.includes('Network request failed')) {
            console.log('Network error detected, attempting retry...');

            for (let attempt = 1; attempt <= networkConfig.retryAttempts; attempt++) {
                console.log(`Retry attempt ${attempt}/${networkConfig.retryAttempts}`);
                await new Promise(resolve => setTimeout(resolve, networkConfig.retryDelay * attempt));

                result = await baseQuery(args, api, extraOptions);

                if (!result.error || result.error.status !== 'FETCH_ERROR') {
                    console.log(`Retry attempt ${attempt} succeeded`);
                    break;
                }
            }
        }
    }

    // Handle 401 errors - try to refresh token
    if (result.error && result.error.status === 401) {
        console.log('Access token expired (401), attempting to refresh...');
        const refreshToken = (api.getState() as RootState).auth.refreshToken;

        if (refreshToken) {
            try {
                // Attempt to get a new access token using the refresh token
                const refreshResult = await baseQuery(
                    {
                        url: '/refresh-token',
                        method: 'POST',
                        body: {refreshToken},
                    },
                    api,
                    extraOptions
                );

                if (refreshResult.data) {
                    const {accessToken, refreshToken: newRefreshToken, user} = refreshResult.data as LoginResponse;

                    // Store the new tokens in Keychain
                    await Keychain.setGenericPassword('authTokens', JSON.stringify({
                        accessToken,
                        refreshToken: newRefreshToken,
                        user
                    }));

                    // Update the Redux state with the new tokens
                    api.dispatch(setTokens({
                        accessToken,
                        refreshToken: newRefreshToken,
                        user
                    }));

                    // Retry the original query with the new access token
                    result = await baseQuery(args, api, extraOptions);

                    console.log('✅ Token refreshed successfully');
                } else {
                    // Refresh token failed, log out the user
                    console.log('❌ Refresh token failed, logging out user');
                    api.dispatch(logout());
                    await Keychain.resetGenericPassword();

                    // Show user-friendly error message
                    Alert.alert(
                        'Session Expired',
                        'Your session has expired. Please log in again.',
                        [{text: 'OK'}]
                    );
                }
            } catch (error) {
                console.error('❌ Error during token refresh:', error);
                api.dispatch(logout());
                await Keychain.resetGenericPassword();

                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again.',
                    [{text: 'OK'}]
                );
            }
        } else {
            // No refresh token available, log out the user
            console.log('❌ No refresh token available, logging out user');
            api.dispatch(logout());
            await Keychain.resetGenericPassword();

            Alert.alert(
                'Authentication Required',
                'Please log in to continue.',
                [{text: 'OK'}]
            );
        }
    }

    return result;
};

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: '/signin',
                method: 'POST',
                body: credentials,
            }),
        }),
        signup: builder.mutation<{ message: string }, SignupRequest>({
            query: (userData) => ({
                url: '/signup',
                method: 'POST',
                body: userData,
            }),
        }),
        refreshToken: builder.mutation<LoginResponse, RefreshTokenRequest>({
            query: (body) => ({
                url: '/refresh-token',
                method: 'POST',
                body,
            }),
        }),
        logout: builder.mutation<{ message: string }, RefreshTokenRequest>({
            query: (body) => ({
                url: '/logout',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
} = authApi;