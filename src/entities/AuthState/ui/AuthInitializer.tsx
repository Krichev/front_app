// src/entities/AuthState/ui/AuthInitializer.tsx - ENHANCED
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useDispatch} from 'react-redux';
import {setInitialized, setTokens} from '../model/slice/authSlice';
import KeychainService from '../../../services/auth/KeychainService';

/**
 * Component to initialize auth state on app start
 * Shows loading screen while checking for stored tokens
 */
export const AuthInitializer: React.FC<{children: React.ReactNode}> = ({children}) => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('🔄 Initializing authentication...');

                // Ensure keychain is initialized
                await KeychainService.initialize();

                // Load tokens from storage
                const storedData = await KeychainService.loadAuthTokens();

                if (storedData) {
                    console.log('✅ Found stored tokens, restoring session...');

                    // Restore auth state
                    dispatch(
                        setTokens({
                            accessToken: storedData.accessToken,
                            refreshToken: storedData.refreshToken,
                            user: storedData.user,
                        }),
                    );
                } else {
                    console.log('ℹ️ No stored tokens found, user needs to log in');
                    dispatch(setInitialized());
                }
            } catch (error) {
                console.error('❌ Error initializing authentication:', error);
                dispatch(setInitialized());
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, [dispatch]);

    // Show loading screen while initializing
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
});