// src/services/speech/SpeechToTextService.ts
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
}

export class SpeechToTextService {
    private config: STTConfig;
    private isRecording: boolean = false;
    private transcriptionListener: EmitterSubscription | null = null;
    private errorListener: EmitterSubscription | null = null;

    constructor(config: STTConfig) {
        this.config = config;
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
            }
        );

        // Setup error listener
        this.errorListener = DeviceEventEmitter.addListener(
            'onSTTError',
            (error: any) => {
                if (this.config.onError) {
                    this.config.onError(error);
                }
            }
        );
    }

    public startRecording(): void {
        if (this.isRecording) return;

        try {
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

        try {
            STTModule.stopStreaming();
            this.isRecording = false;
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
    }
}