// src/entities/file/lib/utils.ts
import {ProcessedFileInfo} from '../model/types';

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex + 1).toLowerCase() : '';
};

export const getMimeType = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
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
        mkv: 'video/x-matroska',

        // Documents
        pdf: 'application/pdf',
        txt: 'text/plain',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

        // Audio
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        aac: 'audio/aac',

        // Archives
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

export const isImage = (fileType: string, filename?: string): boolean => {
    const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (SUPPORTED_IMAGE_TYPES.includes(fileType.toLowerCase())) {
        return true;
    }

    if (filename) {
        const ext = getFileExtension(filename);
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    }

    return false;
};

export const isVideo = (fileType: string, filename?: string): boolean => {
    const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];

    if (SUPPORTED_VIDEO_TYPES.includes(fileType.toLowerCase())) {
        return true;
    }

    if (filename) {
        const ext = getFileExtension(filename);
        return ['mp4', 'mov', 'avi', 'mkv'].includes(ext);
    }

    return false;
};

export const safeToISOString = (date: Date | string | number | undefined): string => {
    if (!date) return new Date().toISOString();

    try {
        if (date instanceof Date) {
            return date.toISOString();
        }

        if (typeof date === 'string') {
            return new Date(date).toISOString();
        }

        if (typeof date === 'number') {
            return new Date(date).toISOString();
        }

        return new Date().toISOString();
    } catch {
        return new Date().toISOString();
    }
};

export const formatFileMetadata = (file: ProcessedFileInfo): Record<string, string> => {
    return {
        'File Name': file.name,
        'Size': file.sizeFormatted,
        'Type': file.type,
        'Created': new Date(file.createdAt).toLocaleDateString(),
        'Modified': new Date(file.modifiedAt).toLocaleDateString(),
        ...(file.width && file.height && {
            'Dimensions': `${file.width} × ${file.height}`,
        }),
    };
};

export const generateFileId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const sanitizeFilename = (filename: string): string => {
    return filename
        .replace(/[^a-z0-9.-]/gi, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
};