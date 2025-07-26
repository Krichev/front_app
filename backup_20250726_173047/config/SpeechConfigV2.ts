// src/services/speech/SpeechConfigV2.ts
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// WebSocket configuration
export interface WebSocketConfig {
    url: string;
    protocol?: string;
    headers?: Record<string, string>;
    reconnectAttempts: number;
    reconnectInterval: number;
}

// Audio configuration
export interface AudioConfig {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource: number; // Android MediaRecorder.AudioSource
    audioCategory?: string; // iOS audio session category
    audioCategoryOptions?: string[];
}

// Recognition configuration
export interface RecognitionConfig {
    language: string;
    maxDuration: number;
    continuous: boolean;
    interim: boolean;
    profanityFilter: boolean;
    automaticPunctuation: boolean;
    speakerDiarization: boolean;
}

// Authentication configuration
export interface AuthConfig {
    apiKey?: string;
    serviceUrl?: string;
    organizationId?: string;
    tokenRefreshInterval?: number;
}

// Full speech configuration
export interface SpeechConfig {
    webSocket?: WebSocketConfig;
    audio?: AudioConfig;
    recognition?: RecognitionConfig;
    auth?: AuthConfig;
    debug?: boolean;
    offline?: boolean;
    cacheResults?: boolean;
}

// Default configurations for different environments
const SPEECH_CONFIG: Record<Environment, SpeechConfig> = {
    development: {
        webSocket: {
            url: 'wss://dev-speech-api.example.com/v1/streaming',
            reconnectAttempts: 3,
            reconnectInterval: 1000,
        },
        audio: {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6, // MediaRecorder.AudioSource.MIC
        },
        recognition: {
            language: 'en-US',
            maxDuration: 120,
            continuous: true,
            interim: true,
            profanityFilter: false,
            automaticPunctuation: true,
            speakerDiarization: false,
        },
        auth: {
            serviceUrl: 'https://dev-auth.example.com',
            tokenRefreshInterval: 3600000, // 1 hour
        },
        debug: true,
        offline: true,
        cacheResults: true,
    },

    staging: {
        webSocket: {
            url: 'wss://staging-speech-api.example.com/v1/streaming',
            reconnectAttempts: 3,
            reconnectInterval: 2000,
        },
        audio: {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6,
        },
        recognition: {
            language: 'en-US',
            maxDuration: 90,
            continuous: true,
            interim: true,
            profanityFilter: true,
            automaticPunctuation: true,
            speakerDiarization: false,
        },
        auth: {
            serviceUrl: 'https://staging-auth.example.com',
            tokenRefreshInterval: 3600000,
        },
        debug: true,
        offline: false,
        cacheResults: true,
    },

    production: {
        webSocket: {
            url: 'wss://speech-api.example.com/v1/streaming',
            reconnectAttempts: 5,
            reconnectInterval: 3000,
        },
        audio: {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6,
        },
        recognition: {
            language: 'en-US',
            maxDuration: 60,
            continuous: true,
            interim: true,
            profanityFilter: true,
            automaticPunctuation: true,
            speakerDiarization: false,
        },
        auth: {
            serviceUrl: 'https://auth.example.com',
            tokenRefreshInterval: 3600000,
        },
        debug: false,
        offline: false,
        cacheResults: true,
    },
};

// Platform-specific configurations
const PLATFORM_CONFIGS: Record<string, Partial<SpeechConfig>> = {
    android: {
        audio: {
            sampleRate: 44100, // Higher sample rate for Android
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6,
        },
    },
    ios: {
        audio: {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 0, // Not used on iOS
            audioCategory: 'playAndRecord',
            audioCategoryOptions: ['allowBluetooth', 'defaultToSpeaker'],
        },
    },
};

// Storage keys
const CONFIG_STORAGE_KEY = 'speech_config_v2';
const API_KEY_STORAGE_KEY = 'speech_api_key';

/**
 * Speech configuration service (V2)
 */
export class SpeechConfigV2 {
    private static instance: SpeechConfigV2;
    private config: SpeechConfig;
    private environment: Environment;
    private isInitialized: boolean = false;

    private constructor() {
        // Set default environment based on __DEV__ flag
        this.environment = __DEV__ ? 'development' : 'production';

        // Initialize with default config
        this.config = this.getDefaultConfig();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SpeechConfigV2 {
        if (!this.instance) {
            this.instance = new SpeechConfigV2();
        }
        return this.instance;
    }

    /**
     * Get default configuration based on environment and platform
     */
    private getDefaultConfig(): SpeechConfig {
        // Get base config for current environment
        const baseConfig = SPEECH_CONFIG[this.environment] || SPEECH_CONFIG.production;

        // Apply platform-specific overrides
        const platformConfig = PLATFORM_CONFIGS[Platform.OS] || {};

        // Deep merge configs
        return this.mergeConfigs(baseConfig, platformConfig);
    }

    /**
     * Deep merge configurations
     */
    private mergeConfigs(base: SpeechConfig, override: Partial<SpeechConfig>): SpeechConfig {
        const result: SpeechConfig = { ...base };

        // Merge each section
        if (override.webSocket && base.webSocket) {
            result.webSocket = { ...base.webSocket, ...override.webSocket };
        }

        if (override.audio && base.audio) {
            result.audio = { ...base.audio, ...override.audio };
        }

        if (override.recognition && base.recognition) {
            result.recognition = { ...base.recognition, ...override.recognition };
        }

        if (override.auth && base.auth) {
            result.auth = { ...base.auth, ...override.auth };
        }

        // Override primitive properties
        if (typeof override.debug !== 'undefined') {
            result.debug = override.debug;
        }

        if (typeof override.offline !== 'undefined') {
            result.offline = override.offline;
        }

        if (typeof override.cacheResults !== 'undefined') {
            result.cacheResults = override.cacheResults;
        }

        return result;
    }

    /**
     * Initialize and load saved configuration
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Load environment setting if available
            const storedEnv = await AsyncStorage.getItem('speech_environment');
            if (storedEnv && (storedEnv === 'development' || storedEnv === 'staging' || storedEnv === 'production')) {
                this.environment = storedEnv;
            }

            // Load user preferences from storage
            const savedConfig = await AsyncStorage.getItem(CONFIG_STORAGE_KEY);
            if (savedConfig) {
                const userConfig = JSON.parse(savedConfig);
                this.config = this.mergeConfigs(this.config, userConfig);
            }

            // Load API key separately for security
            const apiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
            if (apiKey && this.config.auth) {
                this.config.auth.apiKey = apiKey;
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize speech config:', error);
            // Continue with default config if loading fails
        }
    }

    /**
     * Get the current configuration
     */
    public getConfig(): SpeechConfig {
        return JSON.parse(JSON.stringify(this.config)); // Deep clone
    }

    /**
     * Update configuration
     */
    public async updateConfig(newConfig: Partial<SpeechConfig>): Promise<SpeechConfig> {
        // Update current config
        this.config = this.mergeConfigs(this.config, newConfig);

        // Save to storage (excluding sensitive info)
        try {
            const configToStore = JSON.parse(JSON.stringify(this.config)); // Deep clone

            // Remove sensitive information
            if (configToStore.auth) {
                delete configToStore.auth.apiKey;
            }

            await AsyncStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configToStore));

            // Store API key separately if provided
            if (newConfig.auth?.apiKey) {
                await AsyncStorage.setItem(API_KEY_STORAGE_KEY, newConfig.auth.apiKey);
            }
        } catch (error) {
            console.error('Error saving speech config:', error);
        }

        return this.getConfig();
    }

    /**
     * Set current environment
     */
    public async setEnvironment(env: Environment): Promise<void> {
        this.environment = env;

        // Reset config to default for this environment
        this.config = this.getDefaultConfig();

        // Save environment setting
        await AsyncStorage.setItem('speech_environment', env);

        // Reload user preferences
        await this.initialize();
    }

    /**
     * Get current environment
     */
    public getEnvironment(): Environment {
        return this.environment;
    }

    /**
     * Check if websocket is available in the current configuration
     */
    public hasWebSocketSupport(): boolean {
        // Fix the TypeScript error by using optional chaining
        return !!this.config.webSocket?.url;
    }

    /**
     * Reset configuration to defaults
     */
    public async resetConfig(): Promise<void> {
        this.config = this.getDefaultConfig();

        try {
            await AsyncStorage.removeItem(CONFIG_STORAGE_KEY);
            await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
        } catch (error) {
            console.error('Error resetting speech config:', error);
        }
    }

    /**
     * Get localized configuration for a specific language
     */
    public getLanguageConfig(languageCode: string): SpeechConfig {
        if (!this.config.recognition) {
            return this.config;
        }

        const localizedConfig = JSON.parse(JSON.stringify(this.config)); // Deep clone
        if (localizedConfig.recognition) {
            localizedConfig.recognition.language = languageCode;
        }

        return localizedConfig;
    }

    /**
     * Check if a specific feature is available
     */
    public isFeatureAvailable(feature: string): boolean {
        switch (feature) {
            case 'webSocket':
                return this.hasWebSocketSupport();
            case 'offline':
                return !!this.config.offline;
            case 'speakerDiarization':
                return !!this.config.recognition?.speakerDiarization;
            case 'automaticPunctuation':
                return !!this.config.recognition?.automaticPunctuation;
            default:
                return false;
        }
    }
}

// Export a singleton instance for easy access
export const speechConfigV2 = SpeechConfigV2.getInstance();