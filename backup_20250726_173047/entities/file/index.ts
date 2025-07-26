// src/entities/file/index.ts
export type {
    FileInfo,
    ProcessedFileInfo,
    FileUploadResult,
    FileValidationResult,
    FileCompressionOptions,
    FileState,
} from './model/types';

export { fileSlice, fileActions } from './model/slice';
export { fileSelectors } from './model/selectors';

export {
    processFile,
    validateFile,
    compressImage,
    uploadFile,
    deleteFile,
    generateUniqueFilename,
} from './lib/fileService';

export {
    validateFileType,
    validateFileSize,
    validateImage,
    validateVideo,
} from './lib/validation';

export {
    formatFileSize,
    getFileExtension,
    getMimeType,
    isImage,
    isVideo,
    formatFileMetadata,
} from './lib/utils';