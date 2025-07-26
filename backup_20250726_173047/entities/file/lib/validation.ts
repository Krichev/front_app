// src/entities/file/lib/validation.ts
import {FileValidationResult, ProcessedFileInfo} from '../model/types';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
];

const SUPPORTED_VIDEO_TYPES = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
];

export const validateFile = (file: ProcessedFileInfo): FileValidationResult => {
    // Check file size limits
    if (file.isImage && file.size > MAX_IMAGE_SIZE) {
        return {
            isValid: false,
            error: `Image size must be less than ${formatFileSize(MAX_IMAGE_SIZE)}`,
        };
    }

    if (file.isVideo && file.size > MAX_VIDEO_SIZE) {
        return {
            isValid: false,
            error: `Video size must be less than ${formatFileSize(MAX_VIDEO_SIZE)}`,
        };
    }

    if (!file.isImage && !file.isVideo && file.size > MAX_DOCUMENT_SIZE) {
        return {
            isValid: false,
            error: `File size must be less than ${formatFileSize(MAX_DOCUMENT_SIZE)}`,
        };
    }

    // Check supported file types
    if (file.isImage && !SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        return {
            isValid: false,
            error: 'Unsupported image format. Please use JPEG, PNG, GIF, or WebP.',
        };
    }

    if (file.isVideo && !SUPPORTED_VIDEO_TYPES.includes(file.type)) {
        return {
            isValid: false,
            error: 'Unsupported video format. Please use MP4, MOV, AVI, or MKV.',
        };
    }

    return { isValid: true };
};

export const validateFileType = (type: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(type.toLowerCase());
};

export const validateFileSize = (size: number, maxSize: number): boolean => {
    return size <= maxSize;
};

export const validateImage = (file: ProcessedFileInfo): FileValidationResult => {
    if (!file.isImage) {
        return { isValid: false, error: 'File is not an image' };
    }

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        return { isValid: false, error: 'Unsupported image format' };
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return { isValid: false, error: 'Image file too large' };
    }

    return { isValid: true };
};

export const validateVideo = (file: ProcessedFileInfo): FileValidationResult => {
    if (!file.isVideo) {
        return { isValid: false, error: 'File is not a video' };
    }

    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
        return { isValid: false, error: 'Unsupported video format' };
    }

    if (file.size > MAX_VIDEO_SIZE) {
        return { isValid: false, error: 'Video file too large' };
    }

    return { isValid: true };
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};