// src/app/providers/AuthProvider.tsx
import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store';
import {authActions} from '../../features/auth/model';
import * as Keychain from 'react-native-keychain';

// Types
interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: { username: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
    children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const dispatch = useDispatch();
    const { user, accessToken, refreshToken, isLoading } = useSelector((state: RootState) => state.auth);
    const [isInitializing, setIsInitializing] = useState(true);

    // Initialize auth state from keychain
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            setIsInitializing(true);

            // Check if we have stored tokens
            const credentials = await Keychain.getGenericPassword();

            if (credentials && credentials.password) {
                const storedTokens = JSON.parse(credentials.password);

                if (storedTokens.accessToken && storedTokens.refreshToken) {
                    // Restore auth state
                    dispatch(authActions.setTokens({
                        accessToken: storedTokens.accessToken,
                        refreshToken: storedTokens.refreshToken
                    }));

                    // Verify token is still valid
                    await verifyToken(storedTokens.accessToken);
                }
            }
        } catch (error) {
            console.error('Failed to initialize auth:', error);
            // Clear any invalid stored data
            await Keychain.resetGenericPassword();
            dispatch(authActions.logout());
        } finally {
            setIsInitializing(false);
        }
    };

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch(`${process.env.API_BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Token verification failed');
            }

            const data = await response.json();

            if (data.user) {
                dispatch(authActions.setUser(data.user));
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            await logout();
        }
    };

    const login = async (credentials: { username: string; password: string }) => {
        try {
            dispatch(authActions.setLoading(true));

            const response = await fetch(`${process.env.API_BASE_URL}/auth/signin`, {
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

            const data = await response.json();

            // Store tokens in Redux
            dispatch(authActions.setTokens({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            }));

            // Store user data
            if (data.user) {
                dispatch(authActions.setUser(data.user));
            }

            // Store tokens securely
            await Keychain.setGenericPassword(
                'authTokens',
                JSON.stringify({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken
                })
            );

        } catch (error) {
            console.error('Login error:', error);
            dispatch(authActions.setError(error instanceof Error ? error.message : 'Login failed'));
            throw error;
        } finally {
            dispatch(authActions.setLoading(false));
        }
    };

    const logout = async () => {
        try {
            dispatch(authActions.setLoading(true));

            // Call logout endpoint if we have a token
            if (accessToken) {
                try {
                    await fetch(`${process.env.API_BASE_URL}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });
                } catch (error) {
                    console.error('Logout API call failed:', error);
                    // Continue with local logout even if API call fails
                }
            }

            // Clear stored credentials
            await Keychain.resetGenericPassword();

            // Clear Redux state
            dispatch(authActions.logout());

        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch(authActions.setLoading(false));
        }
    };

    const refreshAuth = async () => {
        try {
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${process.env.API_BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();

            // Update tokens
            dispatch(authActions.setTokens({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            }));

            // Update stored tokens
            await Keychain.setGenericPassword(
                'authTokens',
                JSON.stringify({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken
                })
            );

        } catch (error) {
            console.error('Token refresh error:', error);
            await logout();
            throw error;
        }
    };

    const contextValue: AuthContextType = {
        user,
        isAuthenticated: !!accessToken && !!user,
        isLoading: isLoading || isInitializing,
        login,
        logout,
        refreshAuth,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth Guard component
export const AuthGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
                                                                                       children,
                                                                                       fallback = null
                                                                                   }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return fallback;
    }

    return isAuthenticated ? <>{children}</> : <>{fallback}</>;
};