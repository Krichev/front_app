// src/services/speech/SpeechRecognitionFactory.ts
import {
    FileUploadEvents,
    SpeechRecognitionConfig,
    SpeechRecognitionService,
    StreamingEvents
} from './SpeechRecognitionInterface';
import {FileSpeechRecognitionService} from './FileSpeechRecognitionService';
import {StreamingSpeechRecognitionService} from './StreamingSpeechRecognitionService'; // Your existing WebSocket implementation

export class SpeechRecognitionFactory {
    /**
     * Create a speech recognition service based on the configuration
     */
    static createService(
        config: SpeechRecognitionConfig,
        events: StreamingEvents | FileUploadEvents
    ): SpeechRecognitionService {
        switch (config.mode) {
            case 'streaming':
                return new StreamingSpeechRecognitionService(config, events as StreamingEvents);
            case 'file-upload':
                return new FileSpeechRecognitionServiceWrapper(config, events as FileUploadEvents);
            default:
                throw new Error(`Unsupported speech recognition mode: ${config.mode}`);
        }
    }

    /**
     * Get recommended configuration based on use case
     */
    static getRecommendedConfig(useCase: 'real-time' | 'final-answer' | 'discussion'): Partial<SpeechRecognitionConfig> {
        switch (useCase) {
            case 'real-time':
                return {
                    mode: 'streaming',
                    language: 'en-US',
                    sampleRate: 16000,
                    quality: 'medium',
                };
            case 'final-answer':
                return {
                    mode: 'file-upload',
                    language: 'en-US',
                    sampleRate: 16000,
                    quality: 'high',
                    maxRecordingDuration: 30000, // 30 seconds
                };
            case 'discussion':
                return {
                    mode: 'streaming', // Better for continuous discussion
                    language: 'en-US',
                    sampleRate: 16000,
                    quality: 'medium',
                };
            default:
                return {
                    mode: 'file-upload',
                    language: 'en-US',
                    sampleRate: 16000,
                    quality: 'medium',
                };
        }
    }
}

// Wrapper to adapt FileSpeechRecognitionService to the interface
class FileSpeechRecognitionServiceWrapper implements SpeechRecognitionService {
    private service: FileSpeechRecognitionService;
    private events: FileUploadEvents;

    constructor(config: SpeechRecognitionConfig, events: FileUploadEvents) {
        this.events = events;
        this.service = new FileSpeechRecognitionService({
            serverUrl: config.serverUrl || '',
            language: config.language,
            sampleRate: config.sampleRate,
            quality: config.quality,
        });
    }

    async initialize(): Promise<boolean> {
        try {
            return await this.service.initialize();
        } catch (error) {
            if (this.events.onError) {
                this.events.onError(error instanceof Error ? error.message : 'Initialization failed');
            }
            return false;
        }
    }

    async startRecording(): Promise<void> {
        try {
            await this.service.startRecording();
        } catch (error) {
            if (this.events.onError) {
                this.events.onError(error instanceof Error ? error.message : 'Failed to start recording');
            }
        }
    }

    async stopRecording(): Promise<void> {
        try {
            if (this.events.onProcessingStart) {
                this.events.onProcessingStart();
            }

            const filePath = await this.service.stopRecording();
            if (filePath) {
                const result = await this.service.recognizeAudioFile(filePath);

                if (result.success && result.recognizedText && this.events.onTranscription) {
                    this.events.onTranscription(result.recognizedText);
                } else if (!result.success && this.events.onError) {
                    this.events.onError(result.errorMessage || 'Recognition failed');
                }
            }
        } catch (error) {
            if (this.events.onError) {
                this.events.onError(error instanceof Error ? error.message : 'Failed to stop recording');
            }
        } finally {
            if (this.events.onProcessingEnd) {
                this.events.onProcessingEnd();
            }
        }
    }

    async cleanup(): Promise<void> {
        await this.service.cleanup();
    }

    isRecording(): boolean {
        return this.service.getRecordingStatus().isRecording;
    }

    isInitialized(): boolean {
        return this.service.getRecordingStatus().isInitialized;
    }

    getStatus() {
        const status = this.service.getRecordingStatus();
        return {
            ...status,
            mode: 'file-upload' as const,
        };
    }
}