// src/services/auth/KeychainService.ts - FINAL FIXED VERSION
import * as Keychain from 'react-native-keychain';
import {Mutex} from 'async-mutex';
import {Platform} from 'react-native';

export interface StoredAuthData {
    accessToken: string;
    refreshToken: string;
    user: any;
}

class KeychainService {
    private static instance: KeychainService | null = null;
    private mutex: Mutex;
    private isInitialized: boolean = false;
    private readonly SERVICE_NAME = 'com.rhythmgame.auth';

    private constructor() {
        this.mutex = new Mutex();
        console.log(`🔐 KeychainService created for ${Platform.OS}`);
    }

    public static getInstance(): KeychainService {
        if (!KeychainService.instance) {
            KeychainService.instance = new KeychainService();
        }
        return KeychainService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('🔐 KeychainService already initialized');
            return;
        }

        return await this.mutex.runExclusive(async () => {
            if (!this.isInitialized) {
                console.log(`🔐 Initializing KeychainService for ${Platform.OS}...`);

                if (Platform.OS === 'android') {
                    console.log('📱 Android: Using Android Keystore');
                } else if (Platform.OS === 'ios') {
                    console.log('🍎 iOS: Using iOS Keychain');
                }

                this.isInitialized = true;
                console.log('✅ KeychainService initialized successfully');
            }
        });
    }

    /**
     * Save auth tokens securely
     */
    public async saveAuthTokens(data: StoredAuthData): Promise<boolean> {
        return await this.mutex.runExclusive(async () => {
            try {
                console.log('🔐 Saving auth tokens to secure storage...');

                // Build options conditionally - only include properties that have values
                const options: Record<string, any> = {
                    service: this.SERVICE_NAME,
                    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
                };

                // Add Android-specific storage type
                if (Platform.OS === 'android') {
                    options.storage = Keychain.STORAGE_TYPE.AES;
                }

                await Keychain.setGenericPassword(
                    'authTokens',
                    JSON.stringify(data),
                    options
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
     * Load auth tokens from secure storage
     */
    public async loadAuthTokens(): Promise<StoredAuthData | null> {
        return await this.mutex.runExclusive(async () => {
            try {
                console.log('🔐 Loading auth tokens from secure storage...');

                const credentials = await Keychain.getGenericPassword({
                    service: this.SERVICE_NAME,
                });

                if (credentials && credentials.password) {
                    const data = JSON.parse(credentials.password) as StoredAuthData;
                    console.log('✅ Auth tokens loaded successfully');
                    return data;
                }

                console.log('ℹ️ No auth tokens found');
                return null;
            } catch (error) {
                console.error('❌ Error loading auth tokens:', error);
                return null;
            }
        });
    }

    /**
     * Delete auth tokens from secure storage
     */
    public async deleteAuthTokens(): Promise<boolean> {
        return await this.mutex.runExclusive(async () => {
            try {
                console.log('🔐 Deleting auth tokens from secure storage...');

                await Keychain.resetGenericPassword({
                    service: this.SERVICE_NAME,
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
                    service: this.SERVICE_NAME,
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

    /**
     * Get platform-specific storage info (for debugging)
     */
    public getStorageInfo(): { platform: string; storageType: string } {
        return {
            platform: Platform.OS,
            storageType: Platform.OS === 'ios' ? 'iOS Keychain' : 'Android Keystore/AES',
        };
    }

    /**
     * Reset the singleton (use ONLY for testing)
     */
    public static resetInstance(): void {
        if (__DEV__) {
            console.warn('⚠️ Resetting KeychainService singleton (DEV only)');
            KeychainService.instance = null;
        } else {
            throw new Error('resetInstance() can only be called in development mode');
        }
    }
}

// Export ONLY the singleton instance
export default KeychainService.getInstance();

// Also export the class for type checking
export {KeychainService};