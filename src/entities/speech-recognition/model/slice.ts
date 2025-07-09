// src/entities/speech-recognition/model/Slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {SpeechRecognitionResult, SpeechRecognitionState} from './types';

const initialState: SpeechRecognitionState = {
    isRecording: false,
    isProcessing: false,
    currentResult: '',
    finalResult: '',
    error: null,
    quality: 0,
    connectionStatus: 'disconnected',
};

export const speechRecognitionSlice = createSlice({
    name: 'speechRecognition',
    initialState,
    reducers: {
        startRecording: (state) => {
            state.isRecording = true;
            state.isProcessing = true;
            state.error = null;
            state.currentResult = '';
        },
        stopRecording: (state) => {
            state.isRecording = false;
            state.isProcessing = false;
        },
        setResult: (state, action: PayloadAction<SpeechRecognitionResult>) => {
            const { text, isFinal } = action.payload;
            if (isFinal) {
                state.finalResult = text;
                state.currentResult = '';
            } else {
                state.currentResult = text;
            }
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isRecording = false;
            state.isProcessing = false;
        },
        setConnectionStatus: (state, action: PayloadAction<SpeechRecognitionState['connectionStatus']>) => {
            state.connectionStatus = action.payload;
        },
        setQuality: (state, action: PayloadAction<number>) => {
            state.quality = action.payload;
        },
        reset: () => initialState,
    },
});

export const speechRecognitionActions = speechRecognitionSlice.actions;
