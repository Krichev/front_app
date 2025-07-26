// src/services/speech/TokenService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TokenData {
    iamToken: string;
    expiresAt: number;
}

export class TokenService {
    private static readonly TOKEN_STORAGE_KEY = 'yandex_iam_token';
    private static readonly SERVER_URL = 'https://your-auth-server.com/get-token';
    private static readonly FOLDER_ID = 'your-yandex-folder-id'; // Replace with your folder ID

    /**
     * Get a valid IAM token, fetching a new one if needed
     */
    static async getIAMToken(): Promise<string> {
        try {
            // Check for cached token
            const cachedToken = await this.getCachedToken();
            if (cachedToken) {
                return cachedToken;
            }

            // Fetch new token
            // return await this.fetchNewToken();
            return '';
        } catch (error) {
            console.error('Error getting IAM token:', error);
            throw new Error('Failed to get IAM token');
        }
    }

    /**
     * Get Yandex folder ID
     */
    static getFolderId(): string {
        return this.FOLDER_ID;
    }

    /**
     * Check if a cached token exists and is still valid
     */
    private static async getCachedToken(): Promise<string | null> {
        try {
            const storedData = await AsyncStorage.getItem(this.TOKEN_STORAGE_KEY);
            if (!storedData) return null;

            const tokenData: TokenData = JSON.parse(storedData);
            const now = Date.now();

            // Check if token is still valid (with 5 minute buffer)
            if (tokenData.expiresAt > now + 5 * 60 * 1000) {
                return tokenData.iamToken;
            }

            return null;
        } catch (error) {
            console.error('Error reading cached token:', error);
            return null;
        }
    }

    /**
     * Fetch new token from server
     */
    private static async fetchNewToken(): Promise<string> {
        try {
            const response = await fetch(this.SERVER_URL);

            if (!response.ok) {
                throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.iamToken) {
                throw new Error('Invalid response: Missing iamToken');
            }

            // Cache the token (typically valid for 12 hours)
            const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
            await AsyncStorage.setItem(
                this.TOKEN_STORAGE_KEY,
                JSON.stringify({
                    iamToken: data.iamToken,
                    expiresAt,
                })
            );

            return data.iamToken;
        } catch (error) {
            console.error('Error fetching new token:', error);
            throw error;
        }
    }
}