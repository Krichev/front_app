// src/services/media/MediaUploadService.ts
import {RootState, store} from '../../app/providers/StoreProvider/store';

const __DEV__ = process.env.NODE_ENV !== 'production';

// Types
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


/**
 * Service for handling media uploads with progress tracking and authentication
 */
export class MediaUploadService {
    // private static readonly API_BASE_URL = __DEV__
    //     ? 'http://10.0.2.2:8082/challenger'  // Android emulator
    //     : 'https://your-production-api.com'; // Production URL

    private static readonly API_BASE_URL = 'http://10.0.2.2:8082/challenger'; // Production URL

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
     */
    static async uploadQuizMedia(
        file: ProcessedFileInfo,
        questionId?: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<MediaUploadResponse> {
        try {
            // Validate file before upload
            const validation = this.validateMediaFile(file);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid file'
                };
            }

            const formData = new FormData();

            // Add file with proper type casting for React Native
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            // Add question ID if provided
            if (questionId) {
                formData.append('questionId', questionId);
            }

            // Add metadata
            formData.append('mediaCategory', 'QUIZ_QUESTION');

            const xhr = new XMLHttpRequest();
            console.log('URL');
            console.log(`${this.API_BASE_URL}/api/media/upload/quiz-media`);
            return new Promise<MediaUploadResponse>((resolve, reject) => {
                // Track upload progress
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress: UploadProgress = {
                                loaded: event.loaded,
                                total: event.total,
                                percentage: Math.round((event.loaded / event.total) * 100)
                            };
                            onProgress(progress);
                        }
                    });
                }

                xhr.addEventListener('load', () => {
                    try {
                        const response = JSON.parse(xhr.responseText);

                        if (xhr.status === 200) {
                            resolve(response as MediaUploadResponse);
                        } else if (xhr.status === 401) {
                            reject(new Error('Authentication failed. Please login again.'));
                        } else if (xhr.status === 403) {
                            reject(new Error('Access denied. You do not have permission to upload media.'));
                        } else {
                            reject(new Error(response.error || response.message || `Upload failed with status ${xhr.status}`));
                        }
                    } catch (error) {
                        reject(new Error('Invalid response format from server'));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload. Please check your connection.'));
                });

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload timeout. The file may be too large or connection is slow.'));
                });

                xhr.open('POST', `${this.API_BASE_URL}/api/media/upload/quiz-media`);

                // Get auth headers and set them
                const authHeaders = this.getAuthHeaders();
                Object.keys(authHeaders).forEach(key => {
                    xhr.setRequestHeader(key, authHeaders[key]);
                });

                // Don't set Content-Type for FormData - browser will set it with boundary
                // Set timeout (60 seconds for large files)
                xhr.timeout = 60000;

                console.log('📤 Uploading quiz media:', file.name);
                xhr.send(formData);
            });
        } catch (error) {
            console.error('❌ Media upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            };
        }
    }

    /**
     * Upload avatar/profile picture
     */
    static async uploadAvatar(
        file: ProcessedFileInfo,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<MediaUploadResponse> {
        try {
            // Validate file before upload
            const validation = this.validateMediaFile(file);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid file'
                };
            }

            const formData = new FormData();

            // Add file
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            const xhr = new XMLHttpRequest();

            return new Promise<MediaUploadResponse>((resolve, reject) => {
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress: UploadProgress = {
                                loaded: event.loaded,
                                total: event.total,
                                percentage: Math.round((event.loaded / event.total) * 100)
                            };
                            onProgress(progress);
                        }
                    });
                }

                xhr.addEventListener('load', () => {
                    try {
                        const response = JSON.parse(xhr.responseText);

                        if (xhr.status === 200) {
                            resolve(response as MediaUploadResponse);
                        } else if (xhr.status === 401) {
                            reject(new Error('Authentication failed. Please login again.'));
                        } else {
                            reject(new Error(response.error || response.message || `Upload failed with status ${xhr.status}`));
                        }
                    } catch (error) {
                        reject(new Error('Invalid response format from server'));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload timeout'));
                });

                xhr.open('POST', `${this.API_BASE_URL}/api/media/upload/avatar`);

                // Set auth headers
                const authHeaders = this.getAuthHeaders();
                Object.keys(authHeaders).forEach(key => {
                    xhr.setRequestHeader(key, authHeaders[key]);
                });

                xhr.timeout = 30000;

                console.log('📤 Uploading avatar:', file.name);
                xhr.send(formData);
            });
        } catch (error) {
            console.error('❌ Avatar upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown avatar upload error'
            };
        }
    }

    /**
     * Delete media file
     */
    static async deleteMedia(mediaId: string): Promise<boolean> {
        try {
            const authHeaders = this.getAuthHeaders();

            const response = await fetch(`${this.API_BASE_URL}/api/media/${mediaId}`, {
                method: 'DELETE',
                headers: authHeaders,
            });

            if (response.status === 401) {
                console.error('❌ Authentication failed during media deletion');
                return false;
            }

            if (response.ok) {
                const result = await response.json();
                return result.success || true;
            }
            return false;
        } catch (error) {
            console.error('❌ Media deletion error:', error);
            return false;
        }
    }

    /**
     * Get media info by ID
     */
    static async getMediaInfo(mediaId: string): Promise<MediaUploadResponse | null> {
        try {
            const authHeaders = this.getAuthHeaders();

            const response = await fetch(`${this.API_BASE_URL}/api/media/${mediaId}`, {
                method: 'GET',
                headers: authHeaders,
            });

            if (response.ok) {
                return await response.json() as MediaUploadResponse;
            }
            return null;
        } catch (error) {
            console.error('❌ Get media info error:', error);
            return null;
        }
    }

    /**
     * Get media URL by media ID
     */
    static async getMediaUrl(mediaId: string): Promise<{ mediaUrl: string; thumbnailUrl: string } | null> {
        try {
            const authHeaders = this.getAuthHeaders();

            const response = await fetch(`${this.API_BASE_URL}/api/media/url/${mediaId}`, {
                method: 'GET',
                headers: authHeaders,
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('❌ Get media URL error:', error);
            return null;
        }
    }

    /**
     * Validate media file before upload
     */
    static validateMediaFile(file: ProcessedFileInfo): { isValid: boolean; error?: string } {
        // Check if file exists
        if (!file || !file.uri) {
            return {isValid: false, error: 'No file selected'};
        }

        // Check file size limits
        const maxSizes = {
            image: 10 * 1024 * 1024,  // 10MB
            video: 100 * 1024 * 1024, // 100MB
            audio: 50 * 1024 * 1024,  // 50MB
        };

        let mediaType: 'image' | 'video' | 'audio';

        if (file.type.startsWith('image/')) {
            mediaType = 'image';
        } else if (file.type.startsWith('video/')) {
            mediaType = 'video';
        } else if (file.type.startsWith('audio/')) {
            mediaType = 'audio';
        } else {
            return {isValid: false, error: 'Unsupported file type'};
        }

        if (file.size > maxSizes[mediaType]) {
            const maxSizeMB = Math.round(maxSizes[mediaType] / (1024 * 1024));
            return {
                isValid: false,
                error: `File too large. Maximum size for ${mediaType} is ${maxSizeMB}MB`
            };
        }

        // Check supported formats
        const supportedTypes = {
            image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            video: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'],
            audio: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/m4a', 'audio/ogg']
        };

        if (!supportedTypes[mediaType].includes(file.type.toLowerCase())) {
            return {
                isValid: false,
                error: `Unsupported ${mediaType} format. Supported formats: ${supportedTypes[mediaType].join(', ')}`
            };
        }

        return {isValid: true};
    }

    /**
     * Get file type category from MIME type
     */
    static getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'unknown' {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'unknown';
    }

    /**
     * Format file size for display
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Generate thumbnail for video (placeholder - requires native implementation)
     */
    static async generateVideoThumbnail(videoUri: string): Promise<string | null> {
        // This would require native implementation or a library like react-native-video-processing
        console.log('⚠️ Video thumbnail generation not implemented yet:', videoUri);
        return null;
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        try {
            const state = store.getState() as RootState;
            return !!state.auth?.accessToken;
        } catch (error) {
            console.error('❌ Error checking authentication:', error);
            return false;
        }
    }

    /**
     * Get current user ID from store
     */
    static getCurrentUserId(): string | null {
        try {
            const state = store.getState() as RootState;
            return state.auth?.user?.id || null;
        } catch (error) {
            console.error('❌ Error getting current user ID:', error);
            return null;
        }
    }
}

export default MediaUploadService;