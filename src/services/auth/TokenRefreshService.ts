// src/services/auth/TokenRefreshService.ts - FIXED VERSION
import {store} from '../../app/providers/StoreProvider/store';
import {clearAuthState, setTokens} from '../../entities/AuthState/model/slice/authSlice';
import KeychainService from './KeychainService';
import axios from 'axios';
import NetworkConfigManager from "../../config/NetworkConfig.ts";


const API_BASE_URL = NetworkConfigManager.getInstance().getBaseUrl();


class TokenRefreshService {
    private isRefreshing: boolean = false;
    private refreshSubscribers: Array<(token: string) => void> = [];

    /**
     * Subscribe to token refresh
     */
    private subscribeTokenRefresh(callback: (token: string) => void): void {
        this.refreshSubscribers.push(callback);
    }

    /**
     * Notify all subscribers of new token
     */
    private onTokenRefreshed(token: string): void {
        this.refreshSubscribers.forEach(callback => callback(token));
        this.refreshSubscribers = [];
    }

    /**
     * Refresh the access token
     */
    public async refreshAccessToken(): Promise<string | null> {
        if (this.isRefreshing) {
            // If already refreshing, wait for the refresh to complete
            return new Promise(resolve => {
                this.subscribeTokenRefresh(token => {
                    resolve(token);
                });
            });
        }

        this.isRefreshing = true;

        try {
            const state = store.getState();
            const refreshToken = state.auth.refreshToken;

            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            console.log('🔄 Refreshing access token...');

            // Call your refresh token API endpoint
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
            });

            const {accessToken, refreshToken: newRefreshToken} = response.data;

            // Update tokens in Redux
            const currentUser = state.auth.user;
            if (currentUser) {
                store.dispatch(
                    setTokens({
                        accessToken,
                        refreshToken: newRefreshToken || refreshToken,
                        user: currentUser,
                    }),
                );

                // Save to keychain
                await KeychainService.saveAuthTokens({
                    accessToken,
                    refreshToken: newRefreshToken || refreshToken,
                    user: currentUser,
                });
            }

            console.log('✅ Access token refreshed successfully');

            // Notify all waiting requests
            this.onTokenRefreshed(accessToken);
            this.isRefreshing = false;

            return accessToken;
        } catch (error) {
            console.error('❌ Error refreshing token:', error);
            this.isRefreshing = false;

            // Clear auth state if refresh fails
            store.dispatch(clearAuthState());
            await KeychainService.deleteAuthTokens();

            return null;
        }
    }

    /**
     * Load tokens from storage and restore auth state
     */
    public async loadTokensFromStorage(): Promise<boolean> {
        try {
            const storedData = await KeychainService.loadAuthTokens();

            if (storedData) {
                store.dispatch(
                    setTokens({
                        accessToken: storedData.accessToken,
                        refreshToken: storedData.refreshToken,
                        user: storedData.user,
                    }),
                );
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Error loading tokens from storage:', error);
            return false;
        }
    }

    /**
     * Clear all auth data
     */
    public async clearAuthData(): Promise<void> {
        try {
            await KeychainService.deleteAuthTokens();
            store.dispatch(clearAuthState());
        } catch (error) {
            console.error('❌ Error clearing auth data:', error);
        }
    }
}

export default new TokenRefreshService();