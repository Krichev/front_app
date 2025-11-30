// src/services/media/MediaUrlService.ts
import { Platform } from 'react-native';
import { store } from '../../app/providers/StoreProvider/store';

/**
 * Service to construct media proxy URLs
 * All media is served through backend proxy - never direct MinIO URLs
 */
class MediaUrlService {
    private static instance: MediaUrlService;

    private constructor() {}

    public static getInstance(): MediaUrlService {
        if (!MediaUrlService.instance) {
            MediaUrlService.instance = new MediaUrlService();
        }
        return MediaUrlService.instance;
    }

    /**
     * Get the base API URL based on platform
     */
    private getBaseUrl(): string {
        if (__DEV__) {
            if (Platform.OS === 'android') {
                return 'http://10.0.2.2:8082/challenger/api';
            }
            return 'http://localhost:8082/challenger/api';
        }
        // Production URL
        return 'https://your-production-api.com/challenger/api';
    }

    /**
     * Get current auth token from Redux store
     */
    public getAuthToken(): string | null {
        const state = store.getState();
        return state.auth.accessToken;
    }

    /**
     * Get auth headers for media requests
     */
    public getAuthHeaders(): Record<string, string> {
        const token = this.getAuthToken();
        if (token) {
            return {
                'Authorization': `Bearer ${token}`,
            };
        }
        return {};
    }

    /**
     * Build proxy URL for question media stream
     */
    public getQuestionMediaUrl(questionId: number): string {
        return `${this.getBaseUrl()}/media/question/${questionId}/stream`;
    }

    /**
     * Build proxy URL for question thumbnail
     */
    public getQuestionThumbnailUrl(questionId: number): string {
        return `${this.getBaseUrl()}/media/question/${questionId}/thumbnail`;
    }

    /**
     * Build proxy URL for media by ID
     */
    public getMediaByIdUrl(mediaId: string | number): string {
        return `${this.getBaseUrl()}/media/stream/${mediaId}`;
    }

    /**
     * Build proxy URL for thumbnail by media ID
     */
    public getThumbnailByIdUrl(mediaId: string | number): string {
        return `${this.getBaseUrl()}/media/thumbnail/${mediaId}`;
    }

    /**
     * Check if URL is already a proxy URL (from our backend)
     */
    public isProxyUrl(url: string): boolean {
        const baseUrl = this.getBaseUrl();
        return url.startsWith(baseUrl) || url.includes('/api/media/');
    }

    /**
     * Check if URL is a direct storage URL (MinIO/S3) - should not be used
     */
    public isDirectStorageUrl(url: string): boolean {
        return url.includes('localhost:9000') ||
               url.includes(':9000/') ||
               url.includes('minio') ||
               url.includes('s3.amazonaws.com') ||
               url.includes('X-Amz-');
    }

    /**
     * Convert any media URL to proxy URL
     * This handles legacy URLs that might be direct MinIO URLs
     */
    public toProxyUrl(
        url: string | undefined,
        questionId?: number,
        isThumbnail: boolean = false
    ): string | null {
        if (!url) return null;

        // Already a proxy URL - return as is
        if (this.isProxyUrl(url)) {
            return url;
        }

        // If we have a question ID, use question-based proxy
        if (questionId) {
            return isThumbnail
                ? this.getQuestionThumbnailUrl(questionId)
                : this.getQuestionMediaUrl(questionId);
        }

        // For S3 keys or direct URLs without question context,
        // we need media ID - log warning
        console.warn('Cannot convert URL without questionId:', url);
        return null;
    }
}

export default MediaUrlService;
