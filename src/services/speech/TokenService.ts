// src/services/speech/TokenService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TokenResponse {
    iamToken: string;
    expiresAt: number;
}

export class TokenService {
    private static readonly TOKEN_STORAGE_KEY = 'yandex_iam_token';
    private static readonly SERVER_URL = 'https://your-server-domain.com/get-iam-token'; // Update with your server URL
    private static readonly FOLDER_ID = 'b1g4a3qse3vma1o2ms01'; // Update with your Yandex folder ID

    // Get IAM token, fetching a new one if needed
    public static async getIAMToken(): Promise<string> {
        try {
            // Check for cached token
            const cachedToken = await this.getCachedToken();
            if (cachedToken) {
                return cachedToken;
            }

            // Fetch new token
            // const newToken = await this.fetchToken();
            // return newToken;
            return 'here will be token';
        } catch (error) {
            console.error('Error getting IAM token:', error);
            throw error;
        }
    }

    // Get folder ID
    public static getFolderId(): string {
        return this.FOLDER_ID;
    }

    // Check for cached valid token
    private static async getCachedToken(): Promise<string | null> {
        try {
            const tokenData = await AsyncStorage.getItem(this.TOKEN_STORAGE_KEY);

            if (tokenData) {
                const { iamToken, expiresAt } = JSON.parse(tokenData) as TokenResponse;

                // Check if token is still valid (with 5 minute buffer)
                if (expiresAt > Date.now() + 5 * 60 * 1000) {
                    return iamToken;
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting cached token:', error);
            return null;
        }
    }

    // Fetch new token from server
    private static async fetchToken(): Promise<string> {
        try {
            const response = await fetch(this.SERVER_URL);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.iamToken) {
                throw new Error('Invalid response: Missing iamToken');
            }

            // Calculate expiration (token typically valid for 12 hours)
            const expiresAt = Date.now() + 12 * 60 * 60 * 1000;

            // Cache the token
            await AsyncStorage.setItem(
                this.TOKEN_STORAGE_KEY,
                JSON.stringify({
                    iamToken: data.iamToken,
                    expiresAt
                })
            );

            return data.iamToken;
        } catch (error) {
            console.error('Error fetching IAM token:', error);
            throw error;
        }
    }
}