// src/services/speech/SpeechConfig.ts
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuration interface for speech recognition
 */
export interface SpeechRecognitionConfig {
    // Service configuration
    serverUrl: string;
    apiKey?: string;
    organizationId?: string;

    // Audio configuration
    sampleRate: number;
    channels: number;
    bitsPerSample: number;

    // Recognition settings
    language: string;
    maxDuration: number;
    continuous: boolean;
    interim: boolean;
    reconnectAttempts: number;

    // Features
    enableProfanityFilter: boolean;
    enableAutomaticPunctuation: boolean;
    enableSpeakerDiarization: boolean;

    // Optional functionality
    enableOfflineMode: boolean;
    cacheRecognitionResults: boolean;

    // Debug options
    debugMode: boolean;
}

// Default configurations for different environments
const DEVELOPMENT_CONFIG: SpeechRecognitionConfig = {
    serverUrl: 'wss://dev-speech-api.example.com/v1/streaming',
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    language: 'en-US',
    maxDuration: 120,
    continuous: true,
    interim: true,
    reconnectAttempts: 3,
    enableProfanityFilter: false,
    enableAutomaticPunctuation: true,
    enableSpeakerDiarization: false,
    enableOfflineMode: true,
    cacheRecognitionResults: true,
    debugMode: true,
};

const PRODUCTION_CONFIG: SpeechRecognitionConfig = {
    serverUrl: 'wss://speech-api.example.com/v1/streaming',
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    language: 'en-US',
    maxDuration: 60,
    continuous: true,
    interim: true,
    reconnectAttempts: 5,
    enableProfanityFilter: true,
    enableAutomaticPunctuation: true,
    enableSpeakerDiarization: false,
    enableOfflineMode: false,
    cacheRecognitionResults: true,
    debugMode: false,
};

// Configuration for different platforms
const PLATFORM_SPECIFICS = {
    android: {
        sampleRate: 44100, // Higher sample rate for Android
        audioSource: 6, // MediaRecorder.AudioSource.MIC
    },
    ios: {
        sampleRate: 16000,
        audioCategory: 'playAndRecord',
        audioCategoryOptions: ['allowBluetooth', 'defaultToSpeaker'],
    },
};

// Storage key for user preferences
const STORAGE_KEY = 'speech_recognition_config';

/**
 * Speech configuration service
 */
export class SpeechConfig {
    private static instance: SpeechConfig;
    private currentConfig: SpeechRecognitionConfig;
    private isInitialized: boolean = false;

    private constructor() {
        // Initialize with default config based on environment
        this.currentConfig = __DEV__ ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;

        // Apply platform-specific settings
        this.applyPlatformSettings();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SpeechConfig {
        if (!this.instance) {
            this.instance = new SpeechConfig();
        }
        return this.instance;
    }

    /**
     * Apply platform-specific settings
     */
    private applyPlatformSettings(): void {
        if (Platform.OS === 'android' && PLATFORM_SPECIFICS.android) {
            this.currentConfig = { ...this.currentConfig, ...PLATFORM_SPECIFICS.android };
        } else if (Platform.OS === 'ios' && PLATFORM_SPECIFICS.ios) {
            this.currentConfig = { ...this.currentConfig, ...PLATFORM_SPECIFICS.ios };
        }
    }

    /**
     * Initialize and load saved configuration
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Load user preferences from storage
            const savedConfig = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedConfig) {
                const userConfig = JSON.parse(savedConfig);
                this.currentConfig = { ...this.currentConfig, ...userConfig };
            }

            // Apply any API keys from environment or secure storage here

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize speech config:', error);
            // Continue with default config if loading fails
        }
    }

    /**
     * Get the current configuration
     */
    public getConfig(): SpeechRecognitionConfig {
        return { ...this.currentConfig };
    }

    /**
     * Update configuration
     */
    public async updateConfig(newConfig: Partial<SpeechRecognitionConfig>): Promise<SpeechRecognitionConfig> {
        // Update current config
        this.currentConfig = { ...this.currentConfig, ...newConfig };

        // Save to storage
        try {
            // Don't store sensitive information
            const configToStore = { ...this.currentConfig };
            delete configToStore.apiKey;

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(configToStore));
        } catch (error) {
            console.error('Error saving speech config:', error);
        }

        return this.getConfig();
    }

    /**
     * Reset configuration to defaults
     */
    public async resetConfig(): Promise<void> {
        this.currentConfig = __DEV__ ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
        this.applyPlatformSettings();

        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error resetting speech config:', error);
        }
    }

    /**
     * Get configuration for a specific language
     */
    public getLanguageConfig(languageCode: string): SpeechRecognitionConfig {
        return {
            ...this.currentConfig,
            language: languageCode,
        };
    }

    /**
     * Check if feature is available on current platform
     */
    public isFeatureAvailable(feature: keyof SpeechRecognitionConfig): boolean {
        // Add platform-specific feature availability checks here
        // For example, some features might not be available on all platforms

        return !!this.currentConfig[feature];
    }
}

// Export a singleton instance for easy access
export const speechConfig = SpeechConfig.getInstance();