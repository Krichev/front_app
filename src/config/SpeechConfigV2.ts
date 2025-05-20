// src/config/SpeechConfigV2.ts
import {Platform} from 'react-native';

interface SpeechEndpoints {
    fileUpload: string;
    webSocket?: string;
}

interface SpeechEnvironmentConfig {
    development: SpeechEndpoints;
    production: SpeechEndpoints;
    local?: SpeechEndpoints; // For testing with local IP
}

export const SPEECH_CONFIG: SpeechEnvironmentConfig = {
    development: {
        fileUpload: Platform.OS === 'ios'
            ? 'http://localhost:8080/api/speech/recognize'
            : 'http://10.0.2.2:8080/api/speech/recognize',
        webSocket: Platform.OS === 'ios'
            ? 'ws://localhost:8080/api/speech/stream'
            : 'ws://10.0.2.2:8080/api/speech/stream',
    },
    production: {
        fileUpload: 'https://your-production-server.com/api/speech/recognize',
        webSocket: 'wss://your-production-server.com/api/speech/stream',
    },
    local: {
        // Replace with your actual local IP for testing on real devices
        fileUpload: 'http://192.168.1.100:8080/api/speech/recognize',
        webSocket: 'ws://192.168.1.100:8080/api/speech/stream',
    },
};

export const DEFAULT_STT_CONFIG = {
    language: 'en-US',
    sampleRate: 16000,
    quality: 'medium' as const,
    maxRecordingDuration: 10000, // 10 seconds
    // WebSocket specific
    reconnectAttempts: 5,
    reconnectDelay: 1000,
};

export const USE_CASE_CONFIGS = {
    'real-time': {
        preferredMode: 'streaming' as const,
        maxRecordingDuration: 0, // No limit for streaming
        quality: 'medium' as const,
    },
    'final-answer': {
        preferredMode: 'file-upload' as const,
        maxRecordingDuration: 30000, // 30 seconds
        quality: 'high' as const,
    },
    'discussion': {
        preferredMode: 'streaming' as const,
        maxRecordingDuration: 0, // No limit
        quality: 'medium' as const,
    },
} as const;

/**
 * Get the appropriate speech config based on environment and use case
 */
export function getSpeechConfig(
    useCase: keyof typeof USE_CASE_CONFIGS = 'discussion',
    environment: 'development' | 'production' | 'local' = __DEV__ ? 'development' : 'production'
) {
    const endpoints = SPEECH_CONFIG[environment];
    const useCaseConfig = USE_CASE_CONFIGS[useCase];

    return {
        ...DEFAULT_STT_CONFIG,
        ...useCaseConfig,
        fileUploadUrl: endpoints.fileUpload,
        webSocketUrl: endpoints.webSocket,
        environment,
        useCase,
    };
}

/**
 * Check if streaming mode is available (requires WebSocket URL)
 */
export function isStreamingAvailable(
    environment: 'development' | 'production' | 'local' = __DEV__ ? 'development' : 'production'
): boolean {
    return !!SPEECH_CONFIG[environment].webSocket;
}

/**
 * Get all available STT modes for current environment
 */
export function getAvailableModes(
    environment: 'development' | 'production' | 'local' = __DEV__ ? 'development' : 'production'
): Array<'streaming' | 'file-upload'> {
    const modes: Array<'streaming' | 'file-upload'> = ['file-upload'];

    if (isStreamingAvailable(environment)) {
        modes.push('streaming');
    }

    return modes;
}