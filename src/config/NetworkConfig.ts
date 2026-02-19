// src/config/NetworkConfig.ts
import Config from 'react-native-config';
import { Platform } from 'react-native';

/**
 * Centralized API configuration.
 * Reads from .env via react-native-config.
 * 
 * Environment variables:
 *   API_BASE_URL          - Main Challenger backend URL (with /api)
 *   KARAOKE_API_BASE_URL  - Karaoke service URL (with /api)
 *   ENVIRONMENT           - 'development' | 'production'
 */

// Default fallbacks for local development (Android emulator)
const DEV_DEFAULTS = {
    API_BASE_URL: Platform.select({
        android: 'http://10.0.2.2:8080/api',
        ios: 'http://localhost:8080/api',
        default: 'http://localhost:8080/api',
    }),
    KARAOKE_API_BASE_URL: Platform.select({
        android: 'http://10.0.2.2:8081/api',
        ios: 'http://localhost:8081/api',
        default: 'http://localhost:8081/api',
    }),
};

class NetworkConfigManager {
    private static instance: NetworkConfigManager;

    private readonly apiBaseUrl: string;
    private readonly karaokeApiBaseUrl: string;
    private readonly environment: string;

    private constructor() {
        this.apiBaseUrl = Config.API_BASE_URL || DEV_DEFAULTS.API_BASE_URL!;
        this.karaokeApiBaseUrl = Config.KARAOKE_API_BASE_URL || DEV_DEFAULTS.KARAOKE_API_BASE_URL!;
        this.environment = Config.ENVIRONMENT || (__DEV__ ? 'development' : 'production');

        if (__DEV__) {
            console.log('🌐 NetworkConfig initialized:');
            console.log(`   API_BASE_URL: ${this.apiBaseUrl}`);
            console.log(`   KARAOKE_API_BASE_URL: ${this.karaokeApiBaseUrl}`);
            console.log(`   ENVIRONMENT: ${this.environment}`);
        }
    }

    public static getInstance(): NetworkConfigManager {
        if (!NetworkConfigManager.instance) {
            NetworkConfigManager.instance = new NetworkConfigManager();
        }
        return NetworkConfigManager.instance;
    }

    /** Main Challenger API base URL (e.g., http://155.212.244.150:8081/api) */
    public getBaseUrl(): string {
        return this.apiBaseUrl;
    }

    /** Karaoke service base URL (e.g., http://155.212.244.150:8083/api) */
    public getKaraokeBaseUrl(): string {
        return this.karaokeApiBaseUrl;
    }

    /** Auth endpoint base URL (main API + /auth) */
    public getAuthBaseUrl(): string {
        return `${this.apiBaseUrl}/auth`;
    }

    /** Competitive endpoint base URL (main API + /competitive) */
    public getCompetitiveBaseUrl(): string {
        return `${this.apiBaseUrl}/competitive`;
    }

    public getEnvironment(): string {
        return this.environment;
    }

    public isDevelopment(): boolean {
        return this.environment === 'development' || __DEV__;
    }
}

export default NetworkConfigManager;
