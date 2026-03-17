/**
 * Media Utility Functions
 * Helper functions for working with media files and URLs
 */
import { MediaType } from '../shared/types';

export class MediaUtils {
    /**
     * Determine media type from file extension or MIME type
     */
    static getMediaType(urlOrMimeType: string): MediaType | 'UNKNOWN' {
        const lower = urlOrMimeType.toLowerCase();

        // Check for video
        if (
            lower.includes('video/') ||
            /\.(mp4|mov|avi|wmv|flv|webm|m4v|mkv)(\?|$)/.test(lower)
        ) {
            return MediaType.VIDEO;
        }

        // Check for audio
        if (
            lower.includes('audio/') ||
            /\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/.test(lower)
        ) {
            return MediaType.AUDIO;
        }

        // Check for image
        if (
            lower.includes('image/') ||
            /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/.test(lower)
        ) {
            return MediaType.IMAGE;
        }

        return 'UNKNOWN';
    }

    /**
     * Helper to normalize media type to uppercase canonical format
     */
    static normalizeMediaType(type?: string): MediaType | undefined {
        if (!type) return undefined;
        const upper = type.toUpperCase();
        if (upper === 'IMAGE' || upper === 'VIDEO' || upper === 'AUDIO') {
            return upper as MediaType;
        }
        return undefined;
    }

    /**
     * Check if URL is a presigned MinIO/S3 URL
     */
    static isPresignedUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            return (
                urlObj.searchParams.has('X-Amz-Algorithm') ||
                urlObj.searchParams.has('AWSAccessKeyId') ||
                url.includes('amazonaws.com') ||
                url.includes('minio')
            );
        } catch {
            return false;
        }
    }

    /**
     * Get time remaining before presigned URL expires
     * @returns Minutes remaining, or null if not determinable
     */
    static getUrlExpiryTime(url: string): number | null {
        try {
            const urlObj = new URL(url);
            const expiresParam =
                urlObj.searchParams.get('X-Amz-Expires') ||
                urlObj.searchParams.get('Expires');

            if (expiresParam) {
                const expirySeconds = parseInt(expiresParam, 10);
                return Math.floor(expirySeconds / 60); // Convert to minutes
            }
        } catch {
            return null;
        }
        return null;
    }

    /**
     * Format file size in human-readable format
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get media icon name for MaterialCommunityIcons
     */
    static getMediaIconName(mediaType?: string): string {
        const type = this.normalizeMediaType(mediaType);
        switch (type) {
            case MediaType.IMAGE:
                return 'image';
            case MediaType.VIDEO:
                return 'video';
            case MediaType.AUDIO:
                return 'music';
            default:
                return 'file-document';
        }
    }

    /**
     * Get display label for media type
     */
    static getMediaLabel(mediaType?: string): string {
        const type = this.normalizeMediaType(mediaType);
        switch (type) {
            case MediaType.IMAGE:
                return '📷 Image';
            case MediaType.VIDEO:
                return '🎥 Video';
            case MediaType.AUDIO:
                return '🎵 Audio';
            default:
                return '📎 Media';
        }
    }

    /**
     * Check if media type supports thumbnails
     */
    static supportsThumbnails(mediaType?: string): boolean {
        const type = this.normalizeMediaType(mediaType);
        return type === MediaType.IMAGE || type === MediaType.VIDEO;
    }

    /**
     * Validate media URL
     */
    static isValidMediaUrl(url?: string): boolean {
        if (!url) return false;

        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * Extract filename from URL
     */
    static getFilenameFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

            // Remove query parameters
            return filename.split('?')[0];
        } catch {
            return 'unknown';
        }
    }

    /**
     * Get file extension from URL or filename
     */
    static getFileExtension(urlOrFilename: string): string {
        const filename = this.getFilenameFromUrl(urlOrFilename);
        const lastDotIndex = filename.lastIndexOf('.');

        if (lastDotIndex === -1) return '';

        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * Check if URL needs refresh (close to expiry)
     * @param url - Presigned URL
     * @param thresholdMinutes - Minutes before expiry to consider "needs refresh"
     */
    static needsRefresh(url: string, thresholdMinutes: number = 5): boolean {
        const expiryMinutes = this.getUrlExpiryTime(url);

        if (expiryMinutes === null) {
            // If we can't determine expiry, assume it needs refresh after reasonable time
            return false;
        }

        return expiryMinutes <= thresholdMinutes;
    }

    /**
     * Get MIME type from file extension
     */
    static getMimeType(extension: string): string {
        const mimeTypes: { [key: string]: string } = {
            // Images
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            bmp: 'image/bmp',
            svg: 'image/svg+xml',

            // Videos
            mp4: 'video/mp4',
            mov: 'video/quicktime',
            avi: 'video/x-msvideo',
            webm: 'video/webm',
            mkv: 'video/x-matroska',

            // Audio
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            ogg: 'audio/ogg',
            m4a: 'audio/mp4',
            aac: 'audio/aac',
            flac: 'audio/flac',
        };

        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Validate media file type for upload
     */
    static isValidMediaType(mimeType: string, allowedTypes: string[] = ['image', 'video', 'audio']): boolean {
        const type = mimeType.split('/')[0].toLowerCase();
        return allowedTypes.map(t => t.toLowerCase()).includes(type);
    }

    /**
     * Get recommended thumbnail size based on media type
     */
    static getThumbnailDimensions(mediaType: string): { width: number; height: number } {
        const type = this.normalizeMediaType(mediaType);
        switch (type) {
            case MediaType.IMAGE:
                return { width: 300, height: 300 };
            case MediaType.VIDEO:
                return { width: 320, height: 180 }; // 16:9 aspect ratio
            default:
                return { width: 150, height: 150 };
        }
    }

    /**
     * Format duration in seconds to human-readable format
     */
    static formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Check if media requires authentication
     */
    static requiresAuth(url: string): boolean {
        // Presigned URLs don't need additional auth headers
        return !this.isPresignedUrl(url);
    }

    /**
     * Sanitize filename for safe storage
     */
    static sanitizeFilename(filename: string): string {
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
    }

    /**
     * Generate cache key for media URL
     */
    static getCacheKey(mediaId: string | number): string {
        return `media_url_${mediaId}`;
    }
}

export default MediaUtils;
