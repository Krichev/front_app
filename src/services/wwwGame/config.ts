// src/services/wwwGame/config.ts
// Configuration for WWW Game services

import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Default configuration for WWW Game services
 */
export interface WWWGameConfig {
    // AI Host configuration
    aiHost: {
        enabled: boolean;
        apiKey: string | null;
        model: string;
        temperature: number;
        useVoice: boolean;
    };

    // Question service configuration
    questions: {
        useExternalSource: boolean;
        cacheResults: boolean;
        maxCachedQuestions: number;
        defaultDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
    };

    // Game configuration
    game: {
        defaultRoundTime: number;
        defaultRoundCount: number;
        enableHints: boolean;
        enableDiscussionAnalysis: boolean;
    };
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: WWWGameConfig = {
    aiHost: {
        enabled: true,
        apiKey: null, // Will be loaded from storage if available
        model: 'deepseek-chat',
        temperature: 0.7,
        useVoice: Platform.OS !== 'web' // Enable voice on mobile platforms by default
    },
    questions: {
        useExternalSource: true,
        cacheResults: true,
        maxCachedQuestions: 100,
        defaultDifficulty: 'Medium'
    },
    game: {
        defaultRoundTime: 60,
        defaultRoundCount: 10,
        enableHints: true,
        enableDiscussionAnalysis: true
    }
};

// Current configuration
let currentConfig: WWWGameConfig = { ...DEFAULT_CONFIG };

/**
 * Load configuration from AsyncStorage
 */
export async function loadConfig(): Promise<WWWGameConfig> {
    try {
        const storedConfig = await AsyncStorage.getItem('wwwGameConfig');
        if (storedConfig) {
            currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
        }

        // Load API key separately (more secure)
        const apiKey = await AsyncStorage.getItem('wwwGameApiKey');
        if (apiKey) {
            currentConfig.aiHost.apiKey = apiKey;
        }

        return currentConfig;
    } catch (error) {
        console.error('Error loading WWW Game configuration:', error);
        return DEFAULT_CONFIG;
    }
}

/**
 * Save configuration to AsyncStorage
 */
export async function saveConfig(config: Partial<WWWGameConfig>): Promise<void> {
    try {
        // Update current config
        currentConfig = { ...currentConfig, ...config };

        // Store API key separately
        if (config.aiHost?.apiKey) {
            await AsyncStorage.setItem('wwwGameApiKey', config.aiHost.apiKey);

            // Remove API key from config before storing (security best practice)
            const configToStore = { ...currentConfig };
            configToStore.aiHost.apiKey = null;

            await AsyncStorage.setItem('wwwGameConfig', JSON.stringify(configToStore));
        } else {
            // Store without API key
            const configToStore = { ...currentConfig };
            configToStore.aiHost.apiKey = null;

            await AsyncStorage.setItem('wwwGameConfig', JSON.stringify(configToStore));
        }
    } catch (error) {
        console.error('Error saving WWW Game configuration:', error);
    }
}

/**
 * Get the current configuration
 */
export function getConfig(): WWWGameConfig {
    return { ...currentConfig };
}

/**
 * Update configuration
 */
export function updateConfig(config: Partial<WWWGameConfig>): WWWGameConfig {
    currentConfig = { ...currentConfig, ...config };

    // Save in background
    saveConfig(currentConfig).catch(console.error);

    return { ...currentConfig };
}