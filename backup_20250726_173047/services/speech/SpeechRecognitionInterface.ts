export interface SpeechRecognitionConfig {
    serverUrl?: string;
    iamToken?: string;
    folderId?: string;
    language?: string;
    sampleRate?: number;
    mode: 'streaming' | 'file-upload';
    quality?: 'low' | 'medium' | 'high';
    maxRecordingDuration?: number;
}

export interface SpeechRecognitionResult {
    success: boolean;
    recognizedText?: string;
    errorMessage?: string;
    confidence?: number;
    isPartial?: boolean; // For streaming results
}

export interface SpeechRecognitionService {
    initialize(): Promise<boolean>;
    startRecording(): Promise<void>;
    stopRecording(): Promise<void>;
    cleanup(): Promise<void>;
    isRecording(): boolean;
    isInitialized(): boolean;
    getStatus(): {
        isInitialized: boolean;
        isRecording: boolean;
        hasPermission: boolean;
        mode: 'streaming' | 'file-upload';
    };
}

// Event types for streaming
export interface StreamingEvents {
    onPartialTranscription?: (text: string) => void;
    onFinalTranscription?: (text: string) => void;
    onError?: (error: string) => void;
    onReconnecting?: (attempt: number) => void;
    onReconnectFailed?: () => void;
}

// Event types for file upload
export interface FileUploadEvents {
    onTranscription?: (text: string) => void;
    onError?: (error: string) => void;
    onProcessingStart?: () => void;
    onProcessingEnd?: () => void;
}