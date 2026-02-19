// src/services/media/MediaUploadService.ts
import {RootState, store} from '../../app/providers/StoreProvider/store';

const __DEV__ = process.env.NODE_ENV !== 'production';

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessedFileInfo {
    uri: string;
    type: string;
    name: string;
    size: number;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface MediaUploadResponse {
    success: boolean;
    mediaId?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    mediaType?: string;
    processingStatus?: string;
    message?: string;
    error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Service for handling media uploads with progress tracking and authentication
 */
export class MediaUploadService {
    private static readonly API_BASE_URL = 'http://10.0.2.2:8082';

    /**
     * Get authorization headers with JWT token from Redux store
     */
    private static getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        try {
            const state = store.getState() as RootState;
            const token = state.auth?.accessToken;
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                console.warn('⚠️ No access token found in auth state');
            }
        } catch (error) {
            console.error('❌ Error getting auth headers:', error);
        }

        return headers;
    }

    /**
     * Upload media file for quiz questions with progress tracking
     *
     * @param file - The file to upload (ProcessedFileInfo with uri, type, name, size)
     * @param questionId - Optional question ID to associate with the media
     * @param onProgress - Optional callback for upload progress updates
     * @returns Promise with MediaUploadResponse
     */
    static async uploadQuizMedia(
        file: ProcessedFileInfo,
        questionId?: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<MediaUploadResponse> {
        try {
            console.log('📤 Uploading quiz media:', {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                questionId,
            });

            // Create FormData for multipart upload
            const formData = new FormData();

            // Append file with proper structure for React Native
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            // Add questionId if provided
            if (questionId) {
                formData.append('questionId', questionId);
            }

            // Get auth headers
            const headers = this.getAuthHeaders();

            // Create XMLHttpRequest for progress tracking
            return new Promise<MediaUploadResponse>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Setup progress tracking
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress: UploadProgress = {
                                loaded: event.loaded,
                                total: event.total,
                                percentage: Math.round((event.loaded / event.total) * 100),
                            };
                            onProgress(progress);
                        }
                    });
                }

                // Setup response handlers
                xhr.addEventListener('load', () => {
                    try {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const response = JSON.parse(xhr.responseText);
                            console.log('✅ Media upload successful:', response);

                            // Transform backend response to our format
                            const uploadResponse: MediaUploadResponse = {
                                success: true,
                                mediaId: response.id || response.mediaId,
                                mediaUrl: response.url || response.mediaUrl,
                                thumbnailUrl: response.thumbnailUrl,
                                mediaType: response.mediaType,
                                processingStatus: response.processingStatus,
                                message: response.message || 'Media uploaded successfully',
                            };

                            resolve(uploadResponse);
                        } else {
                            console.error('❌ Upload failed with status:', xhr.status);
                            const errorResponse = JSON.parse(xhr.responseText || '{}');
                            reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
                        }
                    } catch (error) {
                        console.error('❌ Error parsing response:', error);
                        reject(new Error('Failed to parse server response'));
                    }
                });

                xhr.addEventListener('error', () => {
                    console.error('❌ Network error during upload');
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('abort', () => {
                    console.warn('⚠️ Upload aborted');
                    reject(new Error('Upload aborted'));
                });

                // Open connection and set headers
                xhr.open('POST', `${this.API_BASE_URL}/api/media/upload/quiz-media`);

                // Set authorization header
                if (headers['Authorization']) {
                    xhr.setRequestHeader('Authorization', headers['Authorization']);
                }

                // Accept JSON response
                xhr.setRequestHeader('Accept', 'application/json');

                // Send the request
                xhr.send(formData as any);
            });

        } catch (error) {
            console.error('❌ Error in uploadQuizMedia:', error);
            throw error;
        }
    }

    /**
     * Upload avatar/profile picture
     *
     * @param file - The image file to upload
     * @param onProgress - Optional callback for upload progress updates
     * @returns Promise with MediaUploadResponse
     */
    static async uploadAvatar(
        file: ProcessedFileInfo,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<MediaUploadResponse> {
        try {
            console.log('📤 Uploading avatar:', {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            });

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Avatar must be an image file');
            }

            // Create FormData
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            const headers = this.getAuthHeaders();

            // Create XMLHttpRequest for progress tracking
            return new Promise<MediaUploadResponse>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                if (onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress: UploadProgress = {
                                loaded: event.loaded,
                                total: event.total,
                                percentage: Math.round((event.loaded / event.total) * 100),
                            };
                            onProgress(progress);
                        }
                    });
                }

                xhr.addEventListener('load', () => {
                    try {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const response = JSON.parse(xhr.responseText);
                            console.log('✅ Avatar upload successful:', response);

                            const uploadResponse: MediaUploadResponse = {
                                success: true,
                                mediaId: response.id || response.mediaId,
                                mediaUrl: response.url || response.mediaUrl,
                                thumbnailUrl: response.thumbnailUrl,
                                mediaType: response.mediaType,
                                processingStatus: response.processingStatus,
                                message: response.message || 'Avatar uploaded successfully',
                            };

                            resolve(uploadResponse);
                        } else {
                            const errorResponse = JSON.parse(xhr.responseText || '{}');
                            reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
                        }
                    } catch (error) {
                        reject(new Error('Failed to parse server response'));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload aborted'));
                });

                xhr.open('POST', `${this.API_BASE_URL}/api/media/upload/avatar`);

                if (headers['Authorization']) {
                    xhr.setRequestHeader('Authorization', headers['Authorization']);
                }

                xhr.setRequestHeader('Accept', 'application/json');
                xhr.send(formData as any);
            });

        } catch (error) {
            console.error('❌ Error in uploadAvatar:', error);
            throw error;
        }
    }

    /**
     * Get media URL by ID
     *
     * @param mediaId - The media ID
     * @returns Promise with media URL
     */
    static async getMediaUrl(mediaId: string): Promise<string> {
        try {
            const headers = this.getAuthHeaders();

            const response = await fetch(
                `${this.API_BASE_URL}/api/media/url/${mediaId}`,
                {
                    method: 'GET',
                    headers,
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to get media URL: ${response.status}`);
            }

            const data = await response.json();
            return data.mediaUrl;

        } catch (error) {
            console.error('❌ Error getting media URL:', error);
            throw error;
        }
    }

    /**
     * Delete media by ID
     *
     * @param mediaId - The media ID to delete
     * @returns Promise with success status
     */
    static async deleteMedia(mediaId: string): Promise<boolean> {
        try {
            const headers = this.getAuthHeaders();

            const response = await fetch(
                `${this.API_BASE_URL}/api/media/${mediaId}`,
                {
                    method: 'DELETE',
                    headers,
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to delete media: ${response.status}`);
            }

            const data = await response.json();
            return data.success;

        } catch (error) {
            console.error('❌ Error deleting media:', error);
            throw error;
        }
    }
}

export default MediaUploadService;