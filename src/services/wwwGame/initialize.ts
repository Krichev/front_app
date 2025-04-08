// src/services/wwwGame/initialize.ts
// Helper to initialize WWW Game services at app startup

import {loadConfig} from './config';
import {initializeWWWGameServices} from './index';

/**
 * Initialize all WWW Game services with stored configuration
 * Call this function when your app starts
 */
export async function initializeWWWGame(): Promise<void> {
    // Load configuration
    const config = await loadConfig();

    // Initialize services with loaded configuration
    initializeWWWGameServices({
        apiKey: config.aiHost.apiKey || undefined,
        enableExtendedFeatures: config.aiHost.enabled
    });

    console.log('WWW Game services initialized');
}

/**
 * Check if the game services are properly initialized
 */
export function isWWWGameInitialized(): boolean {
    try {
        // Try to import and access the QuestionService
        const { QuestionService } = require('./questionService');
        return !!QuestionService.isInitialized;
    } catch (error) {
        return false;
    }
}