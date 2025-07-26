// authApi.ts
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import type {BaseQueryFn} from '@reduxjs/toolkit/query';
import {logout, setTokens} from './authSlice';
import * as Keychain from 'react-native-keychain';
import {RootState} from '../../../../app/providers/StoreProvider/store.ts';

// Define the interfaces for responses
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        // ...any other user fields
    };
}

interface SignupResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        // ...any other user fields
    };
}

// Base query with token refresh logic
const baseQuery = fetchBaseQuery({
    baseUrl: 'http://10.0.2.2:8082/challenger/api',
    prepareHeaders: async (headers, { getState }) => {
        const token = (getState() as RootState).auth.accessToken;

        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    },
});

const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // If you receive a 401 response, try to refresh the token
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
                const { accessToken, refreshToken, user } = refreshResult.data as LoginResponse;

                // Store the new tokens
                await Keychain.setGenericPassword('authTokens', JSON.stringify({ accessToken, refreshToken, user }));

                // Update the Redux state with the new tokens
                api.dispatch(setTokens({ accessToken, refreshToken, user }));

                // Retry the original query with the new access token
                result = await baseQuery(args, api, extraOptions);
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

    return result;
};

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, { username: string; password: string }>({
            query: (credentials) => ({
                url: 'auth/signin',
                method: 'POST',
                body: credentials,
            }),
        }),
        signup: builder.mutation<SignupResponse, { username: string; email: string; password: string }>({
            query: (user) => ({
                url: 'auth/signup',
                method: 'POST',
                body: user,
            }),
        }),
    }),
});

export const { useLoginMutation, useSignupMutation } = authApi;
