// src/entities/MediaState/model/slice/mediaApi.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface MediaFile {
    id: string;
    filename: string;
    url: string;
    thumbnailUrl?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO';
    fileSize: number;
    mimeType: string;
    processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    uploadedBy: string;
    uploadedAt: string;
}

export interface UploadMediaResponse {
    id: string;
    filename: string;
    url: string;
    thumbnailUrl?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO';
    fileSize: number;
    processingStatus: string;
}

export interface DeleteMediaResponse {
    success: boolean;
    message: string;
}

// ============================================================================
// API DEFINITION
// ============================================================================

export const mediaApi = createApi({
    reducerPath: 'mediaApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    tagTypes: ['Media'],
    endpoints: (builder) => ({
        /**
         * Upload media file for quiz questions
         */
        uploadMedia: builder.mutation<UploadMediaResponse, FormData>({
            query: (formData) => ({
                url: '/api/media/upload/quiz-media',
                method: 'POST',
                body: formData,
                formData: true,
            }),
            invalidatesTags: ['Media'],
        }),

        /**
         * Get media file by ID
         */
        getMediaById: builder.query<MediaFile, string>({
            query: (mediaId) => `/api/media/${mediaId}`,
            providesTags: (result, error, mediaId) => [{ type: 'Media', id: mediaId }],
        }),

        /**
         * Get media URL by ID
         */
        getMediaUrl: builder.query<{ mediaUrl: string; thumbnailUrl?: string }, string>({
            query: (mediaId) => `/api/media/url/${mediaId}`,
        }),

        /**
         * Delete media file
         */
        deleteMedia: builder.mutation<DeleteMediaResponse, string>({
            query: (mediaId) => ({
                url: `/api/media/${mediaId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, mediaId) => [{ type: 'Media', id: mediaId }],
        }),

        /**
         * Get user's uploaded media files
         */
        getUserMedia: builder.query<MediaFile[], void>({
            query: () => '/api/media/user/me',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Media' as const, id })),
                        { type: 'Media', id: 'LIST' },
                    ]
                    : [{ type: 'Media', id: 'LIST' }],
        }),
    }),
});

// ============================================================================
// EXPORT HOOKS
// ============================================================================

export const {
    useUploadMediaMutation,
    useGetMediaByIdQuery,
    useGetMediaUrlQuery,
    useDeleteMediaMutation,
    useGetUserMediaQuery,
} = mediaApi;