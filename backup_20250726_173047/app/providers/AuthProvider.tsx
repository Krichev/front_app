// src/app/providers/auth-provider.tsx
import React, {createContext, useContext, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../providers/StoreProvider/store.ts';
import {authActions} from '../../features/auth';
import {User} from '../../entities/user/model/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth context interface
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    signup: (userData: SignupData) => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
}

// Auth credentials interfaces
interface LoginCredentials {
    username: string;
    password: string;
}

interface SignupData {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

// Auth response from API
interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
    ACCESS_TOKEN: '@auth/access_token',
    REFRESH_TOKEN: '@auth/refresh_token',
    USER: '@auth/user',
} as const;

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useDispatch();
    const authState = useSelector((state: RootState) => state.auth);
    const [isInitializing, setIsInitializing] = useState(true);

    // Initialize auth state from storage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const [accessToken, refreshToken, userJson] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
                    AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
                    AsyncStorage.getItem(STORAGE_KEYS.USER),
                ]);

                if (accessToken && refreshToken && userJson) {
                    const user: User = JSON.parse(userJson);

                    // Validate user object has required properties
                    if (user.id && user.username && user.email) {
                        dispatch(authActions.setTokens({
                            accessToken,
                            refreshToken,
                            user,
                        }));
                    } else {
                        // Invalid user data, clear storage
                        await clearAuthStorage();
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                await clearAuthStorage();
            } finally {
                setIsInitializing(false);
            }
        };

        initializeAuth();
    }, [dispatch]);

    // Save auth data to storage when state changes
    useEffect(() => {
        const saveAuthData = async () => {
            if (authState.isAuthenticated && authState.user && authState.accessToken && authState.refreshToken) {
                try {
                    await Promise.all([
                        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authState.accessToken),
                        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authState.refreshToken),
                        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authState.user)),
                    ]);
                } catch (error) {
                    console.error('Error saving auth data:', error);
                }
            }
        };

        if (!isInitializing) {
            saveAuthData();
        }
    }, [authState.isAuthenticated, authState.user, authState.accessToken, authState.refreshToken, isInitializing]);

    // Clear auth storage helper
    const clearAuthStorage = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
                AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
                AsyncStorage.removeItem(STORAGE_KEYS.USER),
            ]);
        } catch (error) {
            console.error('Error clearing auth storage:', error);
        }
    };

    // Login function
    const login = async (credentials: LoginCredentials): Promise<void> => {
        try {
            dispatch(authActions.loginStart());

            // Make API call to login endpoint
            const response = await fetch(`${process.env.API_BASE_URL || 'http://10.0.2.2:8082/challenger/api'}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const authResponse: AuthResponse = await response.json();

            // Ensure user object has all required properties
            const user: User = {
                id: authResponse.user.id,
                username: authResponse.user.username,
                email: authResponse.user.email,
                bio: authResponse.user.bio,
                avatar: authResponse.user.avatar,
                createdAt: authResponse.user.createdAt,
                updatedAt: authResponse.user.updatedAt,
            };

            dispatch(authActions.loginSuccess({
                accessToken: authResponse.accessToken,
                refreshToken: authResponse.refreshToken,
                user,
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            dispatch(authActions.loginFailure(errorMessage));
            throw error;
        }
    };

    // Signup function
    const signup = async (userData: SignupData): Promise<void> => {
        try {
            dispatch(authActions.loginStart());

            // Validate passwords match if confirmPassword is provided
            if (userData.confirmPassword && userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Make API call to signup endpoint
            const response = await fetch(`${process.env.API_BASE_URL || 'http://10.0.2.2:8082/challenger/api'}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Signup failed');
            }

            const authResponse: AuthResponse = await response.json();

            // Ensure user object has all required properties
            const user: User = {
                id: authResponse.user.id,
                username: authResponse.user.username,
                email: authResponse.user.email,
                bio: authResponse.user.bio,
                avatar: authResponse.user.avatar,
                createdAt: authResponse.user.createdAt,
                updatedAt: authResponse.user.updatedAt,
            };

            dispatch(authActions.loginSuccess({
                accessToken: authResponse.accessToken,
                refreshToken: authResponse.refreshToken,
                user,
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Signup failed';
            dispatch(authActions.loginFailure(errorMessage));
            throw error;
        }
    };

    // Logout function
    const logout = async (): Promise<void> => {
        try {
            // Clear storage first
            await clearAuthStorage();

            // Then update Redux state
            dispatch(authActions.logout());
        } catch (error) {
            console.error('Error during logout:', error);
            // Even if there's an error, still update Redux state
            dispatch(authActions.logout());
        }
    };

    // Update user function
    const updateUser = (userData: Partial<User>): void => {
        dispatch(authActions.updateUser(userData));
    };

    // Context value
    const contextValue: AuthContextType = {
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading || isInitializing,
        login,
        logout,
        signup,
        updateUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth guard hook
export const useAuthGuard = (redirectOnUnauthenticated: boolean = true) => {
    const { isAuthenticated, isLoading } = useAuth();

    return {
        isAuthenticated,
        isLoading,
        canAccess: isAuthenticated && !isLoading,
    };
};

// Export types for external use
export type { AuthContextType, LoginCredentials, SignupData };