// src/app/api/baseQueryWithAuth.ts
// Shared base query with automatic token refresh for ALL API endpoints
import {BaseQueryFn, FetchArgs, fetchBaseQuery, FetchBaseQueryError} from '@reduxjs/toolkit/query/react';
import {RootState} from '../providers/StoreProvider/store';
import {logout, setTokens} from '../../entities/AuthState/model/slice/authSlice';
import {Alert} from 'react-native';
import KeychainService from "../../services/auth/KeychainService.ts";

const networkConfig = {
    retryAttempts: 3,
    retryDelay: 1000,
};

/**
 * Creates a base query with automatic token refresh for any API endpoint
 * @param baseUrl - The base URL for the API
 */
export const createBaseQueryWithAuth = (baseUrl: string): BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> => {
    return async (args, api, extraOptions) => {
        const baseQuery = fetchBaseQuery({
            baseUrl,
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
                console.log('🔄 Network error detected, attempting retry...');

                for (let attempt = 1; attempt <= networkConfig.retryAttempts; attempt++) {
                    console.log(`🔄 Retry attempt ${attempt}/${networkConfig.retryAttempts}`);
                    await new Promise(resolve => setTimeout(resolve, networkConfig.retryDelay * attempt));

                    result = await baseQuery(args, api, extraOptions);

                    if (!result.error || result.error.status !== 'FETCH_ERROR') {
                        console.log(`✅ Retry attempt ${attempt} succeeded`);
                        break;
                    }
                }
            }
        }

        // Handle 401 errors - try to refresh token
        if (result.error && result.error.status === 401) {
            console.log('🔑 Access token expired (401), attempting to refresh...');
            const refreshToken = (api.getState() as RootState).auth.refreshToken;

            if (refreshToken) {
                try {
                    // Create a separate base query for the auth endpoint
                    const authBaseQuery = fetchBaseQuery({
                        baseUrl: 'http://10.0.2.2:8082/challenger/api/auth',
                    });

                    // Attempt to get a new access token using the refresh token
                    const refreshResult = await authBaseQuery(
                        {
                            url: '/refresh-token',
                            method: 'POST',
                            body: {refreshToken},
                        },
                        api,
                        extraOptions
                    );

                    if (refreshResult.data) {
                        const {accessToken, refreshToken: newRefreshToken, user} = refreshResult.data as {
                            accessToken: string;
                            refreshToken: string;
                            user: any;
                        };

                        // Store the new tokens in Keychain
                        await KeychainService.saveAuthTokens({
                            accessToken,
                            refreshToken: newRefreshToken,
                            user
                        });

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
                        await KeychainService.deleteAuthTokens()

                        Alert.alert(
                            'Session Expired',
                            'Your session has expired. Please log in again.',
                            [{text: 'OK'}]
                        );
                    }
                } catch (error) {
                    console.error('❌ Error during token refresh:', error);
                    api.dispatch(logout());
                    await KeychainService.deleteAuthTokens()

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
                await KeychainService.deleteAuthTokens()

                Alert.alert(
                    'Authentication Required',
                    'Please log in to continue.',
                    [{text: 'OK'}]
                );
            }
        }

        return result;
    };
};