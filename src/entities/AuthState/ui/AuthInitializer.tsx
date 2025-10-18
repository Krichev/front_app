// src/entities/AuthState/ui/AuthInitializer.tsx
import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {setInitialized, setTokens} from '../model/slice/authSlice';
import KeychainService from '../../../services/auth/KeychainService';

/**
 * Component to initialize auth state on app start
 * This runs once when the app loads and loads stored tokens
 */
export const AuthInitializer: React.FC<{children: React.ReactNode}> = ({
                                                                           children,
                                                                       }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('🔄 Initializing authentication...');

                // Initialize the keychain service
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
                    console.log('ℹ️ No stored tokens found');
                    // Mark as initialized even if no tokens found
                    dispatch(setInitialized());
                }
            } catch (error) {
                console.error('❌ Error initializing authentication:', error);
                // Mark as initialized even on error
                dispatch(setInitialized());
            }
        };

        initializeAuth();
    }, [dispatch]);

    return <>{children}</>;
};