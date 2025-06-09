// src/entities/speech-recognition/lib/speechFactory.ts
import {StreamingConfig} from '../model/types';
import {speechConfigV2} from '../../../shared/config/speechConfig';

// Interface for the streaming service (implementation would be in a separate file)
export interface StreamingSpeechRecognitionService {
    start(): Promise<void>;
    stop(): Promise<void>;
    isRecording(): boolean;
    getResult(): string;
    onResult(callback: (result: any) => void): void;
    onError(callback: (error: Error) => void): void;
}

// Factory class for creating speech recognition services
export class SpeechRecognitionFactory {
    private static services = new Map<string, StreamingSpeechRecognitionService>();

    private static getStreamingService(config: Partial<StreamingConfig>): StreamingSpeechRecognitionService {
        const configKey = JSON.stringify(config);

        if (!this.services.has(configKey)) {
            // Here you would create the actual service instance
            // For now, returning a mock interface
            const service: StreamingSpeechRecognitionService = {
                start: async () => {},
                stop: async () => {},
                isRecording: () => false,
                getResult: () => '',
                onResult: (callback) => {},
                onError: (callback) => {},
            };
            this.services.set(configKey, service);
        }

        return this.services.get(configKey)!;
    }

    static createStreamingService(language: string = 'en-US'): StreamingSpeechRecognitionService {
        const baseConfig = speechConfigV2.getConfig();

        const streamingConfig: Partial<StreamingConfig> = {
            language: language || baseConfig.recognition?.language || 'en-US',
            sampleRate: baseConfig.audio?.sampleRate,
            maxDuration: baseConfig.recognition?.maxDuration,
            autoReconnect: true,
            maxReconnectAttempts: baseConfig.webSocket?.reconnectAttempts,
            serverUrl: baseConfig.webSocket?.url,
        };

        return this.getStreamingService(streamingConfig);
    }

    static createCommandRecognitionService(): StreamingSpeechRecognitionService {
        return this.getStreamingService({
            maxDuration: 10,
            autoReconnect: false,
            serverUrl: speechConfigV2.getConfig().webSocket?.url,
        });
    }

    static createDictationService(language: string = 'en-US'): StreamingSpeechRecognitionService {
        return this.getStreamingService({
            language,
            maxDuration: 300,
            autoReconnect: true,
            maxReconnectAttempts: 5,
            serverUrl: speechConfigV2.getConfig().webSocket?.url,
        });
    }

    static createWWWGameDiscussionService(
        roundTime: number = 60,
        language: string = 'en-US'
    ): StreamingSpeechRecognitionService {
        return this.getStreamingService({
            language,
            maxDuration: roundTime,
            autoReconnect: true,
            maxReconnectAttempts: 3,
            serverUrl: speechConfigV2.getConfig().webSocket?.url,
        });
    }
}

// Export factory functions
export const {
    createStreamingService,
    createCommandRecognitionService,
    createDictationService,
    createWWWGameDiscussionService,
} = SpeechRecognitionFactory;