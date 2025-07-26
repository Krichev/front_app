// src/shared/api/base.ts
import {fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import type {RootState} from '../../app/store';

export const baseQuery = fetchBaseQuery({
    baseUrl: 'http://10.0.2.2:8082/challenger/api',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.accessToken;

        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    },
});

// Re-auth wrapper for handling token refresh
export const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // Handle token refresh logic here
        console.log('Token expired, handling refresh...');
    }

    return result;
};