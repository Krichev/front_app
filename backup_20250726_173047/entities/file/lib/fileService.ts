// src/entities/file/lib/fileService.ts
import {FileCompressionOptions, FileInfo, FileUploadResult, ProcessedFileInfo} from '../model/types';
import {validateFile} from './validation';
import {formatFileSize, getFileExtension, isImage, isVideo, safeToISOString} from './utils';

export class FileService {
    private static readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    private static readonly MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

    static processFile(fileInfo: FileInfo): ProcessedFileInfo {
        const type = fileInfo.type || 'application/octet-stream';
        const extension = getFileExtension(fileInfo.name);

        return {
            ...fileInfo,
            createdAt: safeToISOString(fileInfo.ctime),
            modifiedAt: safeToISOString(fileInfo.mtime),
            sizeFormatted: formatFileSize(fileInfo.size),
            isImage: isImage(type, fileInfo.name),
            isVideo: isVideo(type, fileInfo.name),
            extension,
        };
    }

    static async uploadFile(
        file: ProcessedFileInfo,
        endpoint: string,
        additionalFields?: Record<string, any>
    ): Promise<FileUploadResult> {
        try {
            const validation = validateFile(file);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error,
                };
            }

            const formData = this.createFormData(file, additionalFields);

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            return {
                success: true,
                fileId: result.id,
                url: result.url,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error',
            };
        }
    }

    static createFormData(file: ProcessedFileInfo, additionalFields?: Record<string, any>): FormData {
        const formData = new FormData();

        formData.append('file', {
            uri: file.uri,
            type: file.type,
            name: file.name,
        } as any);

        if (additionalFields) {
            Object.entries(additionalFields).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }

        return formData;
    }

    static async compressImage(
        file: ProcessedFileInfo,
        options: FileCompressionOptions = {}
    ): Promise<ProcessedFileInfo> {
        // Placeholder implementation - would need react-native-image-resizer
        console.log('Image compression would happen here:', options);
        return file;
    }

    static async deleteFile(uri: string): Promise<boolean> {
        try {
            // Placeholder - would use react-native-fs or similar
            console.log('File deletion would happen here:', uri);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    static async fileExists(uri: string): Promise<boolean> {
        try {
            // Placeholder - would use react-native-fs or similar
            console.log('File existence check would happen here:', uri);
            return true;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    static generateUniqueFilename(originalName: string, prefix: string = ''): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = getFileExtension(originalName);
        const baseName = originalName.replace(/\.[^/.]+$/, '');

        return `${prefix}${baseName}_${timestamp}_${random}.${extension}`;
    }
}

// Export individual functions for cleaner imports
export const {
    processFile,
    uploadFile,
    compressImage,
    deleteFile,
    generateUniqueFilename,
} = FileService;
