// src/entities/speech-recognition/lib/tokenService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TokenData} from '../model/types';

const TOKEN_STORAGE_KEY = 'yandex_iam_token';
const SERVER_URL = 'https://your-auth-server.com/get-token';
const FOLDER_ID = 'your-yandex-folder-id';

export const tokenService = {
    async getIAMToken(): Promise<string> {
        try {
            const cachedToken = await this.getCachedToken();
            if (cachedToken) {
                return cachedToken;
            }

            // In a real implementation, you would fetch a new token
            return '';
        } catch (error) {
            console.error('Error getting IAM token:', error);
            throw new Error('Failed to get IAM token');
        }
    },

    getFolderId(): string {
        return FOLDER_ID;
    },

    async clearCachedToken(): Promise<void> {
        try {
            await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing cached token:', error);
        }
    },

     async getCachedToken(): Promise<string | null> {
        try {
            const storedData = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
            if (!storedData) return null;

            const tokenData: TokenData = JSON.parse(storedData);
            const now = Date.now();

            if (tokenData.expiresAt > now + 5 * 60 * 1000) {
                return tokenData.iamToken;
            }

            return null;
        } catch (error) {
            console.error('Error reading cached token:', error);
            return null;
        }
    },
};

// Export individual functions for cleaner imports
export const { getIAMToken, getFolderId, clearCachedToken } = tokenService;
