// Modified src/services/speech/SpeechToTextService.ts
import {DeviceEventEmitter, EmitterSubscription, NativeModules} from 'react-native';

// Interface for the native module
interface STTModuleInterface {
    startStreaming: (iamToken: string, folderId: string) => void;
    sendAudioChunk: (base64Chunk: string) => void;
    stopStreaming: () => void;
}

// Get the native module
const { STTModule } = NativeModules as { STTModule: STTModuleInterface };

// Configuration type
export interface STTConfig {
    iamToken: string;
    folderId: string;
    onTranscription?: (text: string) => void;
    onError?: (error: any) => void;
    onReconnecting?: (attempt: number) => void;
    onReconnectFailed?: () => void;
    maxReconnectAttempts?: number;
}

export class SpeechToTextService {
    private config: STTConfig;
    private isRecording: boolean = false;
    private transcriptionListener: EmitterSubscription | null = null;
    private errorListener: EmitterSubscription | null = null;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    constructor(config: STTConfig) {
        this.config = config;
        this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
        this.setupListeners();
    }

    private setupListeners(): void {
        // Remove any existing listeners
        this.removeListeners();

        // Setup transcription listener
        this.transcriptionListener = DeviceEventEmitter.addListener(
            'onTranscription',
            (text: string) => {
                if (this.config.onTranscription) {
                    this.config.onTranscription(text);
                }
                // Reset reconnect attempts on successful transcription
                this.reconnectAttempts = 0;
            }
        );

        // Setup error listener with reconnection logic
        this.errorListener = DeviceEventEmitter.addListener(
            'onSTTError',
            (error: any) => {
                console.log('STT Error received:', error);

                // Check if it's a connection error
                const isConnectionError =
                    error &&
                    (error.message?.includes('WebSocket') ||
                        error.message?.includes('connection') ||
                        error.message?.includes('Unable to resolve host'));

                if (isConnectionError && this.isRecording) {
                    this.handleReconnect();
                } else if (this.config.onError) {
                    this.config.onError(error);
                }
            }
        );

        // Add WebSocket close listener
        DeviceEventEmitter.addListener('onWebSocketClose', () => {
            console.log('WebSocket connection closed');
            if (this.isRecording) {
                this.handleReconnect();
            }
        });
    }

    private handleReconnect(): void {
        // Clear any existing reconnect timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Check if we've reached max attempts
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            if (this.config.onReconnectFailed) {
                this.config.onReconnectFailed();
            }
            if (this.config.onError) {
                this.config.onError(new Error('Max reconnect attempts reached'));
            }
            return;
        }

        // Increment attempt counter
        this.reconnectAttempts++;

        // Notify about reconnection attempt
        if (this.config.onReconnecting) {
            this.config.onReconnecting(this.reconnectAttempts);
        }

        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        // Try to reconnect with exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);

        this.reconnectTimeout = setTimeout(() => {
            try {
                // Try to restart the streaming
                STTModule.startStreaming(this.config.iamToken, this.config.folderId);
            } catch (error) {
                console.error('Error during reconnection attempt:', error);
                // Try again if we haven't reached max attempts
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.handleReconnect();
                } else if (this.config.onReconnectFailed) {
                    this.config.onReconnectFailed();
                }
            }
        }, backoffDelay);
    }

    public startRecording(): void {
        if (this.isRecording) return;

        try {
            // Reset reconnect attempts when starting fresh
            this.reconnectAttempts = 0;
            STTModule.startStreaming(this.config.iamToken, this.config.folderId);
            this.isRecording = true;
        } catch (error) {
            console.error('Error starting STT recording:', error);
            if (this.config.onError) {
                this.config.onError(error);
            }
        }
    }

    public stopRecording(): void {
        if (!this.isRecording) return;

        // Clear any reconnection attempt
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        try {
            STTModule.stopStreaming();
            this.isRecording = false;
            this.reconnectAttempts = 0;
        } catch (error) {
            console.error('Error stopping STT recording:', error);
            if (this.config.onError) {
                this.config.onError(error);
            }
        }
    }

    public cleanup(): void {
        this.stopRecording();
        this.removeListeners();
    }

    private removeListeners(): void {
        if (this.transcriptionListener) {
            this.transcriptionListener.remove();
            this.transcriptionListener = null;
        }

        if (this.errorListener) {
            this.errorListener.remove();
            this.errorListener = null;
        }

        // Remove WebSocket close listener
        DeviceEventEmitter.removeAllListeners('onWebSocketClose');
    }
}