import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import type {BaseQueryFn} from '@reduxjs/toolkit/query';
import {logout, setTokens} from './authSlice';
import * as Keychain from 'react-native-keychain';
import {RootState} from '../../../../app/providers/StoreProvider/store';
import NetworkConfigManager from '../../../../config/NetworkConfig';

// Define the interfaces for responses
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        bio?: string;
        avatar?: string;
        createdAt: string;
    };
}

interface SignupResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        bio?: string;
        avatar?: string;
        createdAt: string;
    };
}

// Enhanced base query with better error handling and retry logic
const baseQuery = fetchBaseQuery({
    baseUrl: NetworkConfigManager.getInstance().getBaseUrl(),
    timeout: 30000, // 30 seconds timeout
    prepareHeaders: async (headers, { getState }) => {
        const token = (getState() as RootState).auth.accessToken;

        // Add Bearer token to Authorization header
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        // Set content type
        headers.set('Content-Type', 'application/json');
        headers.set('Accept', 'application/json');

        return headers;
    },
});

// Enhanced base query with retry and better error handling
const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
    const networkConfig = NetworkConfigManager.getInstance().getConfig();
    let result = await baseQuery(args, api, extraOptions);

    // Enhanced error handling
    if (result.error) {
        console.error('API Request Error:', {
            error: result.error,
            args,
            timestamp: new Date().toISOString()
        });

        // Handle network errors with retry logic
        if (result.error.status === 'FETCH_ERROR' ||
            result.error.status === 'TIMEOUT_ERROR' ||
            (result.error as any)?.message?.includes('Network request failed')) {

            console.log('Network error detected, attempting retry...');

            // Retry with exponential backoff
            for (let attempt = 1; attempt <= networkConfig.retryAttempts; attempt++) {
                console.log(`Retry attempt ${attempt}/${networkConfig.retryAttempts}`);

                // Wait before retry
                await new Promise(resolve =>
                    setTimeout(resolve, networkConfig.retryDelay * attempt)
                );

                result = await baseQuery(args, api, extraOptions);

                if (!result.error || result.error.status !== 'FETCH_ERROR') {
                    console.log(`Retry attempt ${attempt} succeeded`);
                    break;
                }
            }
        }

        // If still failing after retries and it's a 401, try to refresh token
        if (result.error && result.error.status === 401) {
            console.log('Access token expired, attempting to refresh...');
            const refreshToken = (api.getState() as RootState).auth.refreshToken;

            if (refreshToken) {
                // Attempt to get a new access token using the refresh token
                const refreshResult = await baseQuery(
                    {
                        url: 'auth/refresh-token',
                        method: 'POST',
                        body: { refreshToken },
                    },
                    api,
                    extraOptions
                );

                if (refreshResult.data) {
                    const { accessToken, refreshToken: newRefreshToken, user } = refreshResult.data as LoginResponse;

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

                    console.log('Token refreshed successfully');
                } else {
                    // Refresh token failed, log out the user
                    api.dispatch(logout());
                    await Keychain.resetGenericPassword();
                    console.log('Session expired, please log in again.');
                }
            } else {
                // No refresh token available, log out the user
                api.dispatch(logout());
                await Keychain.resetGenericPassword();
                console.log('No refresh token, please log in again.');
            }
        }
    }

    return result;
};

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Auth'],
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, { username: string; password: string }>({
            query: (credentials) => ({
                url: 'auth/signin',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['Auth'],
            onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;

                    // Map API response to match User interface
                    const mappedUser = {
                        id: data.user.id,
                        username: data.user.username, // Map 'name' from API to 'username' for our app
                        email: data.user.email,
                        bio: data.user.bio,
                        avatar: data.user.avatar,
                        createdAt: data.user.createdAt,
                    };

                    // Store tokens in Keychain
                    await Keychain.setGenericPassword('authTokens', JSON.stringify({
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        user: mappedUser
                    }));

                    // Update Redux state
                    dispatch(setTokens({
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        user: mappedUser
                    }));

                    console.log('Login successful, Bearer token will be added automatically to future requests');
                } catch (error) {
                    console.error('Login error in onQueryStarted:', error);
                }
            },
        }),
        signup: builder.mutation<SignupResponse, { username: string; email: string; password: string }>({
            query: (userData) => ({
                url: 'auth/signup',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['Auth'],
        }),
        refreshToken: builder.mutation<LoginResponse, { refreshToken: string }>({
            query: (tokenData) => ({
                url: 'auth/refresh-token',
                method: 'POST',
                body: tokenData,
            }),
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: 'auth/logout',
                method: 'POST',
            }),
            onQueryStarted: async (args, { dispatch }) => {
                // Clear tokens regardless of API response
                dispatch(logout());
                await Keychain.resetGenericPassword();
            },
        }),
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
} = authApi;