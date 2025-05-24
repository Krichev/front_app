// src/services/speech/SpeechRecognitionFactory.ts
import {StreamingConfig, StreamingSpeechRecognitionService} from './StreamingSpeechRecognitionService';
import {speechConfigV2} from "../../config/SpeechConfigV2.ts";

/**
 * Factory class for creating and managing speech recognition services
 */
export class SpeechRecognitionFactory {
    /**
     * Get the streaming speech recognition service instance
     * @param config Optional configuration to override defaults
     */
    public static getStreamingService(config?: Partial<StreamingConfig>): StreamingSpeechRecognitionService {
        // Get the singleton instance
        const service = StreamingSpeechRecognitionService.getInstance();

        // Initialize with merged config if provided
        if (config) {
            service.initialize(config).catch(error => {
                console.error('Error initializing speech recognition service:', error);
            });
        }

        return service;
    }

    /**
     * Create a configured streaming service based on environment and language
     * @param language Language code (e.g., 'en-US', 'fr-FR')
     */
    public static createConfiguredService(language?: string): StreamingSpeechRecognitionService {
        // Get the base config from the config service
        const baseConfig = speechConfigV2.getConfig();

        // Create streaming config from the base config
        const streamingConfig: Partial<StreamingConfig> = {
            language: language || baseConfig.recognition?.language || 'en-US',
            sampleRate: baseConfig.audio?.sampleRate,
            maxDuration: baseConfig.recognition?.maxDuration,
            autoReconnect: true,
            maxReconnectAttempts: baseConfig.webSocket?.reconnectAttempts,
            serverUrl: baseConfig.webSocket?.url,
        };

        // Get and initialize the service
        return this.getStreamingService(streamingConfig);
    }

    /**
     * Create a service optimized for short voice commands
     */
    public static createCommandRecognitionService(): StreamingSpeechRecognitionService {
        return this.getStreamingService({
            maxDuration: 10, // Short 10-second limit for commands
            autoReconnect: false, // No need to reconnect for short commands
            serverUrl: speechConfigV2.getConfig().webSocket?.url,
        });
    }

    /**
     * Create a service optimized for long-form dictation
     */
    public static createDictationService(language: string = 'en-US'): StreamingSpeechRecognitionService {
        return this.getStreamingService({
            language,
            maxDuration: 300, // 5 minutes
            autoReconnect: true,
            maxReconnectAttempts: 5,
            serverUrl: speechConfigV2.getConfig().webSocket?.url,
        });
    }

    /**
     * Create a service optimized for the WWW game's discussion phase
     */
    public static createWWWGameDiscussionService(
        roundTime: number = 60,
        language: string = 'en-US'
    ): StreamingSpeechRecognitionService {
        return this.getStreamingService({
            language,
            maxDuration: roundTime, // Use the game's round time
            autoReconnect: true,
            maxReconnectAttempts: 3,
            serverUrl: speechConfigV2.getConfig().webSocket?.url,
        });
    }
}