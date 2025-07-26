// src/entities/file/model/selectors.ts
import type {RootState} from '../../../app/store';

export const fileSelectors = {
    selectUploadingFiles: (state: RootState) =>
        state.file ? Object.values(state.file.uploadingFiles) : [],
    selectUploadProgress: (state: RootState) =>
        state.file?.uploadProgress || {},
    selectUploadedFiles: (state: RootState) =>
        state.file?.uploadedFiles || [],
    selectErrors: (state: RootState) =>
        state.file?.errors || {},
    selectIsUploading: (state: RootState) =>
        state.file?.isUploading || false,
    selectHasErrors: (state: RootState) =>
        Object.keys(state.file?.errors || {}).length > 0,
    selectFileProgress: (uri: string) => (state: RootState) =>
        state.file?.uploadProgress?.[uri] || 0,
    selectFileError: (uri: string) => (state: RootState) =>
        state.file?.errors?.[uri],
    selectUploadedFileByUri: (uri: string) => (state: RootState) =>
        state.file?.uploadedFiles?.find(file => file.uri === uri),
};
