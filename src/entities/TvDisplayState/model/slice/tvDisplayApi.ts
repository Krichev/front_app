import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithAuth } from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';

export interface TvDisplayClaimDTO {
    success: boolean;
    roomCode: string;
    displayId: number;
}

export interface TvDisplayClaimRequest {
    pairingCode: string;
    roomCode: string;
}

export const tvDisplayApi = createApi({
    reducerPath: 'tvDisplayApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    endpoints: (builder) => ({
        claimTvDisplay: builder.mutation<TvDisplayClaimDTO, TvDisplayClaimRequest>({
            query: (body) => ({
                url: '/tv-displays/claim',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const { useClaimTvDisplayMutation } = tvDisplayApi;
