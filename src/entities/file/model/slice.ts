// src/entities/file/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {FileState, FileUploadResult, ProcessedFileInfo} from './types';

const initialState: FileState = {
    uploadingFiles: {},
    uploadProgress: {},
    uploadedFiles: [],
    errors: {},
    isUploading: false,
};

export const fileSlice = createSlice({
    name: 'file',
    initialState,
    reducers: {
        startUpload: (state, action: PayloadAction<ProcessedFileInfo>) => {
            const file = action.payload;
            state.uploadingFiles[file.uri] = file;
            state.uploadProgress[file.uri] = 0;
            state.isUploading = true;
            delete state.errors[file.uri];
        },
        updateProgress: (state, action: PayloadAction<{ uri: string; progress: number }>) => {
            const { uri, progress } = action.payload;
            state.uploadProgress[uri] = progress;
        },
        uploadSuccess: (state, action: PayloadAction<{ uri: string; result: FileUploadResult }>) => {
            const { uri, result } = action.payload;
            const file = state.uploadingFiles[uri];

            if (file && result.success) {
                state.uploadedFiles.push({ ...file, id: result.fileId });
            }

            delete state.uploadingFiles[uri];
            delete state.uploadProgress[uri];
            delete state.errors[uri];

            state.isUploading = Object.keys(state.uploadingFiles).length > 0;
        },
        uploadError: (state, action: PayloadAction<{ uri: string; error: string }>) => {
            const { uri, error } = action.payload;

            state.errors[uri] = error;
            delete state.uploadingFiles[uri];
            delete state.uploadProgress[uri];

            state.isUploading = Object.keys(state.uploadingFiles).length > 0;
        },
        removeFile: (state, action: PayloadAction<string>) => {
            const uri = action.payload;
            state.uploadedFiles = state.uploadedFiles.filter(file => file.uri !== uri);
            delete state.errors[uri];
        },
        clearErrors: (state) => {
            state.errors = {};
        },
        reset: () => initialState,
    },
});

export const fileActions = fileSlice.actions;