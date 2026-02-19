import {Platform} from 'react-native';

export interface NetworkConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

class NetworkConfigManager {
    private static instance: NetworkConfigManager;
    private config: NetworkConfig;

    private constructor() {
        this.config = this.getDefaultConfig();
    }

    public static getInstance(): NetworkConfigManager {
        if (!NetworkConfigManager.instance) {
            NetworkConfigManager.instance = new NetworkConfigManager();
        }
        return NetworkConfigManager.instance;
    }

    private getDefaultConfig(): NetworkConfig {
        const isDevelopment = __DEV__;

        let baseUrl: string;

        if (isDevelopment) {
            if (Platform.OS === 'android') {
                // Try 10.0.2.2 first (Android emulator), fallback to your machine's IP
                baseUrl = 'http://10.0.2.2:8082/api';
                // Alternative: 'http://192.168.1.XXX:8082/api' (replace XXX with your IP)
            } else if (Platform.OS === 'ios') {
                baseUrl = 'http://localhost:8082/api';
            } else {
                baseUrl = 'http://localhost:8082/api';
            }
        } else {
            // Production - REPLACE WITH YOUR ACTUAL API URL
            baseUrl = 'https://your-production-api.com/api';
        }

        return {
            baseUrl,
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
        };
    }

    public getConfig(): NetworkConfig {
        return { ...this.config };
    }

    public getBaseUrl(): string {
        return this.config.baseUrl;
    }

    public getAlternativeUrls(): string[] {
        const alternatives: string[] = [];

        if (Platform.OS === 'android') {
            alternatives.push(
                'http://10.0.2.2:8082/api',
                'http://localhost:8082/api',
                'http://127.0.0.1:8082/api',
                'http://192.168.1.100:8082/api' // REPLACE WITH YOUR MACHINE'S IP
            );
        } else {
            alternatives.push(
                'http://localhost:8082/api',
                'http://127.0.0.1:8082/api',
                'http://192.168.1.100:8082/api' // REPLACE WITH YOUR MACHINE'S IP
            );
        }

        return alternatives;
    }
}

export default NetworkConfigManager;