// src/entities/speech-recognition/model/types.ts
export interface StreamingConfig {
    language?: string;
    sampleRate?: number;
    maxDuration?: number;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
    serverUrl?: string;
}

export interface SpeechRecognitionConfig {
    recognition?: {
        language?: string;
        maxDuration?: number;
        continuous?: boolean;
        interimResults?: boolean;
    };
    audio?: {
        sampleRate?: number;
        channels?: number;
        encoding?: string;
    };
    webSocket?: {
        url?: string;
        reconnectAttempts?: number;
        reconnectInterval?: number;
    };
}

export interface TokenData {
    iamToken: string;
    expiresAt: number;
}

export interface SpeechRecognitionState {
    isRecording: boolean;
    isProcessing: boolean;
    currentResult: string;
    finalResult: string;
    error: string | null;
    quality: number;
    connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
}

export interface SpeechRecognitionResult {
    text: string;
    confidence: number;
    isFinal: boolean;
    timestamp: number;
    alternatives?: Array<{
        text: string;
        confidence: number;
    }>;
}
