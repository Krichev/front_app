// src/services/auth/KeychainService.ts - SINGLETON KEYCHAIN MANAGER
import * as Keychain from 'react-native-keychain';
import {Mutex} from 'async-mutex';

export interface StoredAuthData {
    accessToken: string;
    refreshToken: string;
    user: any;
}

/**
 * Singleton service to manage keychain operations and prevent multiple DataStore instances
 */
class KeychainService {
    private static instance: KeychainService;
    private mutex: Mutex;
    private isInitialized: boolean = false;

    private constructor() {
        this.mutex = new Mutex();
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): KeychainService {
        if (!KeychainService.instance) {
            KeychainService.instance = new KeychainService();
        }
        return KeychainService.instance;
    }

    /**
     * Initialize the service (optional, but good practice)
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        await this.mutex.runExclusive(async () => {
            if (!this.isInitialized) {
                console.log('🔐 Initializing KeychainService...');
                this.isInitialized = true;
            }
        });
    }

    /**
     * Save auth tokens to keychain
     */
    public async saveAuthTokens(data: StoredAuthData): Promise<boolean> {
        return await this.mutex.runExclusive(async () => {
            try {
                console.log('🔐 Saving auth tokens to keychain...');

                await Keychain.setGenericPassword(
                    'authTokens',
                    JSON.stringify(data),
                    {
                        service: 'com.rhythmgame.auth',
                        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
                    }
                );

                console.log('✅ Auth tokens saved successfully');
                return true;
            } catch (error) {
                console.error('❌ Error saving auth tokens:', error);
                return false;
            }
        });
    }

    /**
     * Load auth tokens from keychain
     */
    public async loadAuthTokens(): Promise<StoredAuthData | null> {
        return await this.mutex.runExclusive(async () => {
            try {
                console.log('🔐 Loading auth tokens from keychain...');

                const credentials = await Keychain.getGenericPassword({
                    service: 'com.rhythmgame.auth',
                });

                if (credentials && credentials.password) {
                    const data = JSON.parse(credentials.password) as StoredAuthData;
                    console.log('✅ Auth tokens loaded successfully');
                    return data;
                }

                console.log('ℹ️ No auth tokens found in keychain');
                return null;
            } catch (error) {
                console.error('❌ Error loading auth tokens:', error);
                return null;
            }
        });
    }

    /**
     * Delete auth tokens from keychain
     */
    public async deleteAuthTokens(): Promise<boolean> {
        return await this.mutex.runExclusive(async () => {
            try {
                console.log('🔐 Deleting auth tokens from keychain...');

                await Keychain.resetGenericPassword({
                    service: 'com.rhythmgame.auth',
                });

                console.log('✅ Auth tokens deleted successfully');
                return true;
            } catch (error) {
                console.error('❌ Error deleting auth tokens:', error);
                return false;
            }
        });
    }

    /**
     * Check if auth tokens exist
     */
    public async hasAuthTokens(): Promise<boolean> {
        return await this.mutex.runExclusive(async () => {
            try {
                const credentials = await Keychain.getGenericPassword({
                    service: 'com.rhythmgame.auth',
                });
                return !!credentials;
            } catch (error) {
                console.error('❌ Error checking auth tokens:', error);
                return false;
            }
        });
    }

    /**
     * Update only the access token (for token refresh)
     */
    public async updateAccessToken(newAccessToken: string): Promise<boolean> {
        return await this.mutex.runExclusive(async () => {
            try {
                const existingData = await this.loadAuthTokens();
                if (!existingData) {
                    console.error('❌ No existing auth data found');
                    return false;
                }

                const updatedData: StoredAuthData = {
                    ...existingData,
                    accessToken: newAccessToken,
                };

                return await this.saveAuthTokens(updatedData);
            } catch (error) {
                console.error('❌ Error updating access token:', error);
                return false;
            }
        });
    }
}

// Export singleton instance
export default KeychainService.getInstance();