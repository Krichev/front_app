// src/services/media/MediaUploadService.ts
import {ProcessedFileInfo} from '../speech/FileService';

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

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export class MediaUploadService {
    private static readonly API_BASE_URL = __DEV__
        ? 'http://10.0.2.2:8080'  // Android emulator
        : 'https://your-production-api.com'; // Production URL

    /**
     * Upload media file for quiz questions with progress tracking
     */
    static async uploadQuizMedia(
        file: ProcessedFileInfo,
        questionId?: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<MediaUploadResponse> {
        try {
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
            formData.append('uploadedBy', 'current_user_id'); // Replace with actual user ID

            const xhr = new XMLHttpRequest();

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
                        } else {
                            reject(new Error(response.message || `Upload failed with status ${xhr.status}`));
                        }
                    } catch (error) {
                        reject(new Error('Invalid response format'));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload timeout'));
                });

                xhr.open('POST', `${this.API_BASE_URL}/api/media/upload/quiz-media`);

                // Set headers - don't set Content-Type for FormData, let browser set it
                xhr.setRequestHeader('Accept', 'application/json');

                // Set timeout (30 seconds for large files)
                xhr.timeout = 30000;

                xhr.send(formData);
            });

        } catch (error) {
            console.error('Media upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            };
        }
    }

    /**
     * Upload temporary media for new questions (without question ID)
     */
    static async uploadTempMedia(
        file: ProcessedFileInfo,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<MediaUploadResponse> {
        // Generate temporary question ID
        const tempQuestionId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        return this.uploadQuizMedia(file, tempQuestionId, onProgress);
    }

    /**
     * Upload avatar media
     */
    static async uploadAvatar(
        file: ProcessedFileInfo,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<MediaUploadResponse> {
        try {
            const formData = new FormData();

            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            } as any);

            const response = await fetch(`${this.API_BASE_URL}/api/media/upload/avatar`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok) {
                return result as MediaUploadResponse;
            } else {
                return {
                    success: false,
                    error: result.message || 'Avatar upload failed'
                };
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
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
            const response = await fetch(`${this.API_BASE_URL}/api/media/${mediaId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                return result.success || true;
            }
            return false;
        } catch (error) {
            console.error('Media deletion error:', error);
            return false;
        }
    }

    /**
     * Get media info by ID
     */
    static async getMediaInfo(mediaId: string): Promise<MediaUploadResponse | null> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/media/${mediaId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json() as MediaUploadResponse;
            }
            return null;
        } catch (error) {
            console.error('Get media info error:', error);
            return null;
        }
    }

    /**
     * Generate presigned URL for direct upload to S3
     */
    static async getPresignedUploadUrl(
        fileName: string,
        fileType: string,
        category: 'QUIZ_QUESTION' | 'AVATAR' | 'CHALLENGE_PROOF' = 'QUIZ_QUESTION'
    ): Promise<{ uploadUrl: string; mediaUrl: string } | null> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/media/presigned-upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    fileName,
                    fileType,
                    category
                }),
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Presigned URL error:', error);
            return null;
        }
    }

    /**
     * Validate media file before upload
     */
    static validateMediaFile(file: ProcessedFileInfo): { isValid: boolean; error?: string } {
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
            return { isValid: false, error: 'Unsupported file type' };
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
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            video: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'],
            audio: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/m4a', 'audio/ogg']
        };

        if (!supportedTypes[mediaType].includes(file.type)) {
            return {
                isValid: false,
                error: `Unsupported ${mediaType} format. Supported formats: ${supportedTypes[mediaType].join(', ')}`
            };
        }

        return { isValid: true };
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
     * Generate thumbnail for video (placeholder - would need native implementation)
     */
    static async generateVideoThumbnail(videoUri: string): Promise<string | null> {
        // This would require native implementation or a library like react-native-video-processing
        console.log('Video thumbnail generation not implemented yet:', videoUri);
        return null;
    }
}

export default MediaUploadService;