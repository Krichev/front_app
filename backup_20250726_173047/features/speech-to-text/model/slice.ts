// src/features/speech-to-text/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {SpeechToTextConfig, SpeechToTextMode} from './types';

interface SpeechToTextState {
    config: SpeechToTextConfig;
    isActive: boolean;
    transcriptHistory: Array<{
        id: string;
        text: string;
        timestamp: number;
        confidence: number;
    }>;
}

const initialState: SpeechToTextState = {
    config: {
        mode: 'command',
        language: 'en-US',
        autoStart: false,
        showInterimResults: true,
        highlightConfidence: true,
    },
    isActive: false,
    transcriptHistory: [],
};

export const speechToTextSlice = createSlice({
    name: 'speechToText',
    initialState,
    reducers: {
        updateConfig: (state, action: PayloadAction<Partial<SpeechToTextConfig>>) => {
            state.config = { ...state.config, ...action.payload };
        },
        setMode: (state, action: PayloadAction<SpeechToTextMode>) => {
            state.config.mode = action.payload;
        },
        setActive: (state, action: PayloadAction<boolean>) => {
            state.isActive = action.payload;
        },
        addTranscript: (state, action: PayloadAction<{ text: string; confidence: number }>) => {
            const transcript = {
                id: `transcript_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                text: action.payload.text,
                timestamp: Date.now(),
                confidence: action.payload.confidence,
            };
            state.transcriptHistory.push(transcript);
        },
        clearHistory: (state) => {
            state.transcriptHistory = [];
        },
        reset: () => initialState,
    },
});

export const speechToTextActions = speechToTextSlice.actions;
