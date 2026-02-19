import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithAuth } from '../../../../app/api/baseQueryWithAuth';
import { 
    Wager, 
    CreateWagerRequest, 
    WagerOutcome, 
    Penalty, 
    PenaltySummary, 
    ScreenTimeBudget,
    SyncTimeRequest,
    ScreenTimeStatus,
    SubmitProofRequest,
    VerifyPenaltyRequest,
    AppealPenaltyRequest,
    PenaltyStatus
} from '../types';
import { Platform } from 'react-native';
import { RootStateForApi } from '../../../../app/providers/StoreProvider/storeTypes';

export const wagerApi = createApi({
    reducerPath: 'wagerApi',
    baseQuery: createBaseQueryWithAuth('http://10.0.2.2:8082/api'),
    tagTypes: ['Wager', 'Penalty', 'ScreenTime'],
    endpoints: (builder) => ({
        // ========================================================================
        // WAGER ENDPOINTS
        // ========================================================================
        createWager: builder.mutation<Wager, CreateWagerRequest>({
            query: (request) => ({
                url: '/wagers',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['Wager', 'ScreenTime'],
        }),

        getWager: builder.query<Wager, number>({
            query: (id) => `/wagers/${id}`,
            providesTags: (result, error, id) => [{ type: 'Wager', id }],
        }),

        acceptWager: builder.mutation<Wager, number>({
            query: (id) => ({
                url: `/wagers/${id}/accept`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Wager', id }, 'ScreenTime'],
        }),

        declineWager: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/wagers/${id}/decline`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Wager', id }],
        }),

        cancelWager: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/wagers/${id}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Wager', id }, 'ScreenTime'],
        }),

        settleWager: builder.mutation<WagerOutcome, number>({
            query: (id) => ({
                url: `/wagers/${id}/settle`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Wager', id }, 'Penalty', 'ScreenTime'],
        }),

        getWagersByChallenge: builder.query<Wager[], number>({
            query: (challengeId) => `/wagers/challenge/${challengeId}`,
            providesTags: ['Wager'],
        }),

        getMyActiveWagers: builder.query<Wager[], void>({
            query: () => '/wagers/my/active',
            providesTags: ['Wager'],
        }),

        getMyWagerHistory: builder.query<{ content: Wager[]; totalPages: number }, { page?: number; size?: number }>({
            query: ({ page = 0, size = 20 }) => ({
                url: '/wagers/my/history',
                params: { page, size },
            }),
            providesTags: ['Wager'],
        }),

        // ========================================================================
        // PENALTY ENDPOINTS
        // ========================================================================
        getMyPenalties: builder.query<{ content: Penalty[]; totalPages: number }, { status?: PenaltyStatus; page?: number; size?: number }>({
            query: ({ status, page = 0, size = 20 }) => ({
                url: '/penalties/my',
                params: { status, page, size },
            }),
            providesTags: ['Penalty'],
        }),

        getPenaltySummary: builder.query<PenaltySummary, void>({
            query: () => '/penalties/my/summary',
            providesTags: ['Penalty'],
        }),

        getPenaltiesToReview: builder.query<Penalty[], void>({
            query: () => '/penalties/to-review',
            providesTags: ['Penalty'],
        }),

        getPenalty: builder.query<Penalty, number>({
            query: (id) => `/penalties/${id}`,
            providesTags: (result, error, id) => [{ type: 'Penalty', id }],
        }),

        startPenalty: builder.mutation<Penalty, number>({
            query: (id) => ({
                url: `/penalties/${id}/start`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Penalty', id }],
        }),

        submitPenaltyProof: builder.mutation<
            Penalty,
            {
                id: number;
                description?: string;
                file?: { uri: string; name: string; type: string };
            }
        >({
            queryFn: async ({ id, description, file }, api, extraOptions, baseQuery) => {
                try {
                    const state = api.getState() as RootStateForApi;
                    const token = state.auth.accessToken;
                    const formData = new FormData();

                    if (description) {
                        formData.append('description', description);
                    }

                    if (file && file.uri) {
                        let fileUri = file.uri;
                        if (Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
                            fileUri = 'file://' + fileUri;
                        }
                        formData.append('file', {
                            uri: fileUri,
                            type: file.type || 'image/jpeg',
                            name: file.name || `proof_${Date.now()}.jpg`,
                        } as any);
                    }

                    const response = await fetch(
                        `http://10.0.2.2:8082/api/penalties/${id}/submit-proof`,
                        {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                ...(token && { 'Authorization': `Bearer ${token}` }),
                            },
                            body: formData,
                        }
                    );

                    if (!response.ok) {
                        const errorText = await response.text();
                        return { error: { status: response.status, data: errorText } };
                    }

                    const data = await response.json();
                    return { data };
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } };
                }
            },
            invalidatesTags: (result, error, { id }) => [{ type: 'Penalty', id }],
        }),

        verifyPenalty: builder.mutation<Penalty, { id: number; request: VerifyPenaltyRequest }>({
            query: ({ id, request }) => ({
                url: `/penalties/${id}/verify`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Penalty', id }],
        }),

        appealPenalty: builder.mutation<Penalty, { id: number; request: AppealPenaltyRequest }>({
            query: ({ id, request }) => ({
                url: `/penalties/${id}/appeal`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Penalty', id }],
        }),

        waivePenalty: builder.mutation<Penalty, number>({
            query: (id) => ({
                url: `/penalties/${id}/waive`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Penalty', id }],
        }),

        // ========================================================================
        // SCREEN TIME ENDPOINTS
        // ========================================================================
        getScreenTimeBudget: builder.query<ScreenTimeBudget, void>({
            query: () => '/screen-time/budget',
            providesTags: ['ScreenTime'],
        }),

        syncScreenTime: builder.mutation<ScreenTimeBudget, SyncTimeRequest>({
            query: (request) => ({
                url: '/screen-time/budget/sync',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['ScreenTime'],
        }),

        deductScreenTime: builder.mutation<ScreenTimeBudget, { minutes: number }>({
            query: (request) => ({
                url: '/screen-time/budget/deduct',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['ScreenTime'],
        }),

        getScreenTimeStatus: builder.query<ScreenTimeStatus, void>({
            query: () => '/screen-time/budget/status',
            providesTags: ['ScreenTime'],
        }),

        // ========================================================================
        // UNLOCK REQUEST ENDPOINTS
        // ========================================================================
        createUnlockRequest: builder.mutation<any, any>({
            query: (request) => ({
                url: '/unlock-requests',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['ScreenTime'],
        }),

        getMyPendingUnlockRequests: builder.query<any[], void>({
            query: () => '/unlock-requests/my/pending',
            providesTags: ['ScreenTime'],
        }),

        getUnlockRequestsToApprove: builder.query<any[], void>({
            query: () => '/unlock-requests/to-approve',
            providesTags: ['ScreenTime'],
        }),

        approveUnlockRequest: builder.mutation<any, { id: number; request: any }>({
            query: ({ id, request }) => ({
                url: `/unlock-requests/${id}/approve`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['ScreenTime'],
        }),

        denyUnlockRequest: builder.mutation<any, { id: number; request: any }>({
            query: ({ id, request }) => ({
                url: `/unlock-requests/${id}/deny`,
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['ScreenTime'],
        }),

        useEmergencyBypass: builder.mutation<any, void>({
            query: () => ({
                url: '/unlock-requests/emergency-bypass',
                method: 'POST',
            }),
            invalidatesTags: ['ScreenTime'],
        }),

        payPenaltyToUnlock: builder.mutation<any, { penaltyId: number; paymentType: string }>({
            query: ({ penaltyId, paymentType }) => ({
                url: '/unlock-requests/pay-penalty',
                method: 'POST',
                params: { penaltyId, paymentType },
            }),
            invalidatesTags: ['ScreenTime', 'Penalty'],
        }),

        getMyLockConfig: builder.query<any, void>({
            query: () => '/unlock-requests/config',
            providesTags: ['ScreenTime'],
        }),

        updateMyLockConfig: builder.mutation<any, any>({
            query: (config) => ({
                url: '/unlock-requests/config',
                method: 'PUT',
                body: config,
            }),
            invalidatesTags: ['ScreenTime'],
        }),
    }),
});

export const {
    useCreateWagerMutation,
    useGetWagerQuery,
    useAcceptWagerMutation,
    useDeclineWagerMutation,
    useCancelWagerMutation,
    useSettleWagerMutation,
    useGetWagersByChallengeQuery,
    useGetMyActiveWagersQuery,
    useGetMyWagerHistoryQuery,
    useGetMyPenaltiesQuery,
    useGetPenaltySummaryQuery,
    useGetPenaltiesToReviewQuery,
    useGetPenaltyQuery,
    useStartPenaltyMutation,
    useSubmitPenaltyProofMutation,
    useVerifyPenaltyMutation,
    useAppealPenaltyMutation,
    useWaivePenaltyMutation,
    useGetScreenTimeBudgetQuery,
    useSyncScreenTimeMutation,
    useDeductScreenTimeMutation,
    useGetScreenTimeStatusQuery,
    useCreateUnlockRequestMutation,
    useGetMyPendingUnlockRequestsQuery,
    useGetUnlockRequestsToApproveQuery,
    useApproveUnlockRequestMutation,
    useDenyUnlockRequestMutation,
    useUseEmergencyBypassMutation,
    usePayPenaltyToUnlockMutation,
    useGetMyLockConfigQuery,
    useUpdateMyLockConfigMutation,
} = wagerApi;
