// src/shared/config/speech.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SpeechRecognitionConfig {
    enabled: boolean;
    language: string;
    maxResults: number;
    interimResults: boolean;
    continuous: boolean;
    timeout: number;
    autoStart: boolean;
    voicePrompts: boolean;
    confidenceThreshold: number;
}

interface PlatformConfig {
    android: Partial<SpeechRecognitionConfig>;
    ios: Partial<SpeechRecognitionConfig>;
    web: Partial<SpeechRecognitionConfig>;
}

/**
 * Speech Recognition Configuration Service
 * Moved to shared/config according to FSD principles
 */
export class SpeechConfigService {
    private static instance: SpeechConfigService;
    private static readonly STORAGE_KEY = '@speech_config';

    private currentConfig: SpeechRecognitionConfig;

    // Default configurations for different environments
    private static readonly DEFAULT_CONFIG: SpeechRecognitionConfig = {
        enabled: true,
        language: 'en-US',
        maxResults: 5,
        interimResults: true,
        continuous: false,
        timeout: 10000,
        autoStart: false,
        voicePrompts: true,
        confidenceThreshold: 0.6,
    };

    private static readonly DEVELOPMENT_CONFIG: SpeechRecognitionConfig = {
        ...SpeechConfigService.DEFAULT_CONFIG,
        interimResults: true,
        continuous: true,
        timeout: 15000,
        confidenceThreshold: 0.4, // Lower threshold for development
    };

    private static readonly PRODUCTION_CONFIG: SpeechRecognitionConfig = {
        ...SpeechConfigService.DEFAULT_CONFIG,
        interimResults: false,
        continuous: false,
        timeout: 8000,
        confidenceThreshold: 0.7, // Higher threshold for production
    };

    private static readonly PLATFORM_CONFIGS: PlatformConfig = {
        android: {
            timeout: 12000,
            maxResults: 3,
            confidenceThreshold: 0.65,
        },
        ios: {
            timeout: 10000,
            maxResults: 5,
            confidenceThreshold: 0.6,
        },
        web: {
            timeout: 15000,
            maxResults: 8,
            continuous: true,
            confidenceThreshold: 0.5,
        },
    };

    private constructor() {
        // Initialize with environment-based config
        this.currentConfig = __DEV__
            ? SpeechConfigService.DEVELOPMENT_CONFIG
            : SpeechConfigService.PRODUCTION_CONFIG;

        this.applyPlatformSettings();
        this.loadStoredConfig();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SpeechConfigService {
        if (!SpeechConfigService.instance) {
            SpeechConfigService.instance = new SpeechConfigService();
        }
        return SpeechConfigService.instance;
    }

    /**
     * Get current configuration
     */
    public getConfig(): SpeechRecognitionConfig {
        return { ...this.currentConfig };
    }

    /**
     * Update configuration
     */
    public async updateConfig(updates: Partial<SpeechRecognitionConfig>): Promise<void> {
        this.currentConfig = {
            ...this.currentConfig,
            ...updates,
        };

        await this.saveConfig();
    }

    /**
     * Update single configuration option
     */
    public async updateConfigOption<K extends keyof SpeechRecognitionConfig>(
        key: K,
        value: SpeechRecognitionConfig[K]
    ): Promise<void> {
        this.currentConfig[key] = value;
        await this.saveConfig();
    }

    /**
     * Get configuration for specific language
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
        // Add platform-specific feature availability checks
        return !!this.currentConfig[feature];
    }

    /**
     * Reset to default configuration
     */
    public async resetToDefaults(): Promise<void> {
        this.currentConfig = __DEV__
            ? SpeechConfigService.DEVELOPMENT_CONFIG
            : SpeechConfigService.PRODUCTION_CONFIG;

        this.applyPlatformSettings();

        try {
            await AsyncStorage.removeItem(SpeechConfigService.STORAGE_KEY);
        } catch (error) {
            console.error('Error resetting speech config:', error);
        }
    }

    /**
     * Get supported languages
     */
    public getSupportedLanguages(): string[] {
        return [
            'en-US',
            'en-GB',
            'es-ES',
            'fr-FR',
            'de-DE',
            'it-IT',
            'pt-BR',
            'ru-RU',
            'ja-JP',
            'ko-KR',
            'zh-CN',
        ];
    }

    /**
     * Check if speech recognition is enabled and available
     */
    public isAvailable(): boolean {
        return this.currentConfig.enabled && this.isPlatformSupported();
    }

    /**
     * Load stored configuration from AsyncStorage
     */
    private async loadStoredConfig(): Promise<void> {
        try {
            const storedConfig = await AsyncStorage.getItem(SpeechConfigService.STORAGE_KEY);
            if (storedConfig) {
                const parsed = JSON.parse(storedConfig);
                this.currentConfig = {
                    ...this.currentConfig,
                    ...parsed,
                };
            }
        } catch (error) {
            console.error('Error loading speech config:', error);
            // Continue with default config if loading fails
        }
    }

    /**
     * Save current configuration to AsyncStorage
     */
    private async saveConfig(): Promise<void> {
        try {
            await AsyncStorage.setItem(
                SpeechConfigService.STORAGE_KEY,
                JSON.stringify(this.currentConfig)
            );
        } catch (error) {
            console.error('Error saving speech config:', error);
        }
    }

    /**
     * Apply platform-specific settings
     */
    private applyPlatformSettings(): void {
        const platform = this.getCurrentPlatform();
        const platformConfig = SpeechConfigService.PLATFORM_CONFIGS[platform];

        if (platformConfig) {
            this.currentConfig = {
                ...this.currentConfig,
                ...platformConfig,
            };
        }
    }

    /**
     * Get current platform
     */
    private getCurrentPlatform(): keyof PlatformConfig {
        // This would need to be adapted based on your platform detection logic
        // For React Native, you might use Platform.OS
        // For web, you might check navigator.userAgent

        if (typeof window !== 'undefined') {
            return 'web';
        }

        // Default to web for now - implement platform detection as needed
        return 'web';
    }

    /**
     * Check if platform supports speech recognition
     */
    private isPlatformSupported(): boolean {
        if (typeof window !== 'undefined') {
            return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        }

        // For React Native, check if speech recognition is available
        return true; // Assume available for now
    }
}

// Export singleton instance for easy access
export const speechConfig = SpeechConfigService.getInstance();

// Export configuration types
export type { SpeechRecognitionConfig, PlatformConfig };