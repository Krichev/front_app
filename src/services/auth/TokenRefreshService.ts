// src/services/auth/TokenRefreshService.ts - UPDATED
import KeychainService from './KeychainService';
import {store} from '../../app/providers/StoreProvider/store';
import {logout, setTokens} from '../../entities/AuthState/model/slice/authSlice';

class TokenRefreshService {
    /**
     * Load tokens from storage and update Redux
     */
    static async loadTokensFromStorage(): Promise<boolean> {
        try {
            const storedData = await KeychainService.loadAuthTokens();

            if (storedData) {
                store.dispatch(
                    setTokens({
                        accessToken: storedData.accessToken,
                        refreshToken: storedData.refreshToken,
                        user: storedData.user,
                    })
                );
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error loading tokens:', error);
            return false;
        }
    }

    /**
     * Save tokens to storage
     */
    static async saveTokensToStorage(accessToken: string, refreshToken: string, user: any): Promise<void> {
        await KeychainService.saveAuthTokens({
            accessToken,
            refreshToken,
            user,
        });
    }

    /**
     * Clear all tokens
     */
    static async clearTokens(): Promise<void> {
        await KeychainService.deleteAuthTokens();
        store.dispatch(logout());
    }
}

export default TokenRefreshService;