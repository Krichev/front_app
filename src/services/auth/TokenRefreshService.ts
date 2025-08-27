// src/services/auth/TokenRefreshService.ts
import * as Keychain from 'react-native-keychain';
import {store} from '../../app/providers/StoreProvider/store';
import {setTokens, updateUser} from '../../entities/AuthState/model/slice/authSlice';

interface User {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt?: string;
    statsCompleted?: number;
    statsCreated?: number;
    statsSuccess?: number;
}

interface AuthData {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export class TokenRefreshService {
    /**
     * Update tokens and persist to storage
     */
    static async updateTokensAndPersist(newToken: string, user: User): Promise<void> {
        try {
            const currentState = store.getState().auth;

            const authData: AuthData = {
                accessToken: newToken,
                refreshToken: currentState.refreshToken || '', // Keep existing refresh token
                user: user,
            };

            // Update Redux state
            store.dispatch(setTokens(authData));

            // Persist to Keychain
            await Keychain.setGenericPassword('authTokens', JSON.stringify(authData));

            console.log('✅ Token updated and persisted successfully');
        } catch (error) {
            console.error('❌ Error updating tokens:', error);
            throw error;
        }
    }

    /**
     * Update user data and persist to storage
     */
    static async updateUserAndPersist(user: User): Promise<void> {
        try {
            const currentState = store.getState().auth;

            // Update Redux state
            store.dispatch(updateUser(user));

            // Update persistent storage
            if (currentState.accessToken && currentState.refreshToken) {
                const authData = {
                    accessToken: currentState.accessToken,
                    refreshToken: currentState.refreshToken,
                    user: user,
                };

                await Keychain.setGenericPassword('authTokens', JSON.stringify(authData));
                console.log('✅ User data updated and persisted successfully');
            }
        } catch (error) {
            console.error('❌ Error updating user data:', error);
            throw error;
        }
    }

    /**
     * Load tokens from storage and update Redux
     */
    static async loadTokensFromStorage(): Promise<boolean> {
        try {
            const credentials = await Keychain.getGenericPassword();

            if (credentials && typeof credentials.password === 'string') {
                const authData: AuthData = JSON.parse(credentials.password);

                if (authData.accessToken && authData.refreshToken && authData.user) {
                    store.dispatch(setTokens(authData));
                    console.log('✅ Tokens loaded from storage successfully');
                    return true;
                }
            }

            console.log('❌ No valid tokens found in storage');
            return false;
        } catch (error) {
            console.error('❌ Error loading tokens from storage:', error);
            return false;
        }
    }

    /**
     * Clear all tokens from storage and Redux
     */
    static async clearAllTokens(): Promise<void> {
        try {
            // Clear Redux state
            store.dispatch({ type: 'auth/logout' });

            // Clear persistent storage
            await Keychain.resetGenericPassword();

            console.log('✅ All tokens cleared successfully');
        } catch (error) {
            console.error('❌ Error clearing tokens:', error);
            throw error;
        }
    }

    /**
     * Get current access token from Redux state
     */
    static getCurrentAccessToken(): string | null {
        const state = store.getState();
        return state.auth.accessToken;
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        const state = store.getState();
        return !!(state.auth.accessToken && state.auth.user);
    }

    /**
     * Get current user from Redux state
     */
    static getCurrentUser(): User | null {
        const state = store.getState();
        return state.auth.user;
    }
}

export default TokenRefreshService;