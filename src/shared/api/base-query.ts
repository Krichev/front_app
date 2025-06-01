// src/shared/api/base-query.ts
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
