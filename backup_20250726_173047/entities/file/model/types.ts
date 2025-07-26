// src/entities/file/model/types.ts
export interface FileInfo {
    name: string;
    size: number;
    type: string;
    uri: string;
    ctime?: Date | string | number;
    mtime?: Date | string | number;
    width?: number;
    height?: number;
    duration?: number;
}

export interface ProcessedFileInfo extends FileInfo {
    createdAt: string;
    modifiedAt: string;
    sizeFormatted: string;
    isImage: boolean;
    isVideo: boolean;
    extension: string;
    id?: string;
}

export interface FileUploadResult {
    success: boolean;
    fileId?: string;
    url?: string;
    error?: string;
}

export interface FileValidationResult {
    isValid: boolean;
    error?: string;
}

export interface FileCompressionOptions {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
}

export interface FileState {
    uploadingFiles: Record<string, ProcessedFileInfo>;
    uploadProgress: Record<string, number>;
    uploadedFiles: ProcessedFileInfo[];
    errors: Record<string, string>;
    isUploading: boolean;
}