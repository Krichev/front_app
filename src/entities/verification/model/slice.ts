// src/entities/verification/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {PermissionState, VerificationConfig, VerificationMethod, VerificationResult, VerificationState} from './types';

const initialState: VerificationState = {
    isVerifying: false,
    currentMethod: null,
    results: [],
    permissions: {
        camera: 'unavailable',
        location: 'unavailable',
        microphone: 'unavailable',
        storage: 'unavailable',
    },
    error: null,
    config: null,
    progress: 0,
};

export const verificationSlice = createSlice({
    name: 'verification',
    initialState,
    reducers: {
        startVerification: (state, action: PayloadAction<{ method: VerificationMethod; config: VerificationConfig }>) => {
            state.isVerifying = true;
            state.currentMethod = action.payload.method;
            state.config = action.payload.config;
            state.error = null;
            state.progress = 0;
        },
        updateProgress: (state, action: PayloadAction<number>) => {
            state.progress = Math.max(0, Math.min(100, action.payload));
        },
        setVerificationResult: (state, action: PayloadAction<VerificationResult>) => {
            state.results.push(action.payload);
            state.progress = 100;
        },
        completeVerification: (state) => {
            state.isVerifying = false;
            state.currentMethod = null;
            state.progress = 100;
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isVerifying = false;
            state.currentMethod = null;
        },
        updatePermissions: (state, action: PayloadAction<Partial<PermissionState>>) => {
            state.permissions = { ...state.permissions, ...action.payload };
        },
        setPermissionStatus: (state, action: PayloadAction<{ permission: keyof PermissionState; status: PermissionState[keyof PermissionState] }>) => {
            state.permissions[action.payload.permission] = action.payload.status;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearResults: (state) => {
            state.results = [];
        },
        reset: () => initialState,
    },
});

export const verificationActions = verificationSlice.actions;
