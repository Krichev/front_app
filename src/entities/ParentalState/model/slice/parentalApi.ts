import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithAuth } from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';

export interface ParentalLink {
    id: number;
    parentUserId: number;
    parentUsername: string;
    childUserId: number;
    childUsername: string;
    childAvatarUrl?: string;
    status: 'PENDING' | 'ACTIVE' | 'REVOKED';
    verifiedAt?: string;
    permissions: {
        canSetBudget: boolean;
        canViewActivity: boolean;
        canApproveWagers: boolean;
        canGrantTime: boolean;
    };
    createdAt: string;
}

export interface ChildSettings {
    childUserId: number;
    dailyBudgetMinutes: number;
    maxWagerAmount: number;
    allowMoneyWagers: boolean;
    allowScreenTimeWagers: boolean;
    allowSocialWagers: boolean;
    maxExtensionRequestsPerDay: number;
    restrictedCategories: string[];
    contentAgeRating: 'E' | 'E10' | 'T' | 'M';
    notifications: {
        onLowTime: boolean;
        onWager: boolean;
        dailySummary: boolean;
        onPenalty: boolean;
    };
}

export interface ChildScreenTime {
    childUserId: number;
    childUsername: string;
    dailyBudgetMinutes: number;
    availableMinutes: number;
    lockedMinutes: number;
    usedTodayMinutes: number;
    lastActivityAt?: string;
    isCurrentlyLocked: boolean;
}

export interface TimeExtensionRequest {
    id: number;
    childUserId: number;
    childUsername: string;
    minutesRequested: number;
    reason?: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
    minutesGranted?: number;
    parentMessage?: string;
    respondedAt?: string;
    expiresAt: string;
    createdAt: string;
}

export interface ParentalApproval {
    id: number;
    childUserId: number;
    childUsername: string;
    approvalType: 'WAGER' | 'MONEY_WAGER' | 'HIGH_STAKES' | 'FEATURE_ACCESS';
    requestDetails: Record<string, any>;
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
    expiresAt: string;
    createdAt: string;
}

export const parentalApi = createApi({
    reducerPath: 'parentalApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    tagTypes: ['ParentalLink', 'ChildSettings', 'Approval', 'Extension'],
    endpoints: (builder) => ({
        // ========== LINK MANAGEMENT ==========
        getLinkedChildren: builder.query<ParentalLink[], void>({
            query: () => '/parental/children',
            providesTags: ['ParentalLink'],
        }),

        getLinkedParents: builder.query<ParentalLink[], void>({
            query: () => '/parental/parents',
            providesTags: ['ParentalLink'],
        }),

        requestLink: builder.mutation<ParentalLink, { childUserId: number }>({
            query: (body) => ({
                url: '/parental/link',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ParentalLink'],
        }),

        acceptLink: builder.mutation<ParentalLink, { linkId: number; verificationCode: string }>({
            query: ({ linkId, verificationCode }) => ({
                url: `/parental/link/${linkId}/accept`,
                method: 'POST',
                body: { verificationCode },
            }),
            invalidatesTags: ['ParentalLink'],
        }),

        rejectLink: builder.mutation<void, number>({
            query: (linkId) => ({
                url: `/parental/link/${linkId}/reject`,
                method: 'POST',
            }),
            invalidatesTags: ['ParentalLink'],
        }),

        // ========== CHILD SETTINGS ==========
        getChildSettings: builder.query<ChildSettings, number>({
            query: (childId) => `/parental/children/${childId}/settings`,
            providesTags: (result, error, childId) => [{ type: 'ChildSettings', id: childId }],
        }),

        updateChildSettings: builder.mutation<ChildSettings, { childId: number; settings: Partial<ChildSettings> }>({
            query: ({ childId, settings }) => ({
                url: `/parental/children/${childId}/settings`,
                method: 'PUT',
                body: settings,
            }),
            invalidatesTags: (result, error, { childId }) => [{ type: 'ChildSettings', id: childId }],
        }),

        getChildScreenTime: builder.query<ChildScreenTime, number>({
            query: (childId) => `/parental/children/${childId}/screen-time`,
            providesTags: ['ChildSettings'],
        }),

        // ========== APPROVALS ==========
        getPendingApprovals: builder.query<ParentalApproval[], void>({
            query: () => '/parental/approvals/pending',
            providesTags: ['Approval'],
        }),

        approveRequest: builder.mutation<ParentalApproval, { approvalId: number; notes?: string }>({
            query: ({ approvalId, notes }) => ({
                url: `/parental/approvals/${approvalId}/approve`,
                method: 'POST',
                body: { notes },
            }),
            invalidatesTags: ['Approval'],
        }),

        denyRequest: builder.mutation<ParentalApproval, { approvalId: number; reason?: string }>({
            query: ({ approvalId, reason }) => ({
                url: `/parental/approvals/${approvalId}/deny`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: ['Approval'],
        }),

        // ========== TIME EXTENSIONS ==========
        requestTimeExtension: builder.mutation<TimeExtensionRequest, { minutes: number; reason?: string }>({
            query: (body) => ({
                url: '/screen-time/extension/request',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Extension'],
        }),

        getExtensionRequests: builder.query<TimeExtensionRequest[], void>({
            query: () => '/screen-time/extension/requests',
            providesTags: ['Extension'],
        }),

        approveExtension: builder.mutation<TimeExtensionRequest, { requestId: number; minutesToGrant: number; message?: string }>({
            query: ({ requestId, minutesToGrant, message }) => ({
                url: `/parental/extensions/${requestId}/approve`,
                method: 'POST',
                body: { minutesToGrant, message },
            }),
            invalidatesTags: ['Extension', 'ChildSettings'],
        }),

        denyExtension: builder.mutation<TimeExtensionRequest, { requestId: number; message?: string }>({
            query: ({ requestId, message }) => ({
                url: `/parental/extensions/${requestId}/deny`,
                method: 'POST',
                body: { message },
            }),
            invalidatesTags: ['Extension'],
        }),
    }),
});

export const {
    useGetLinkedChildrenQuery,
    useGetLinkedParentsQuery,
    useRequestLinkMutation,
    useAcceptLinkMutation,
    useRejectLinkMutation,
    useGetChildSettingsQuery,
    useUpdateChildSettingsMutation,
    useGetChildScreenTimeQuery,
    useGetPendingApprovalsQuery,
    useApproveRequestMutation,
    useDenyRequestMutation,
    useRequestTimeExtensionMutation,
    useGetExtensionRequestsQuery,
    useApproveExtensionMutation,
    useDenyExtensionMutation,
} = parentalApi;
