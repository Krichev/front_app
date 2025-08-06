// src/entities/AuthState/ui/AuthNavigationHandler.tsx - IMPROVED VERSION
import React, {useEffect, useRef} from 'react';
import {useSelector} from 'react-redux';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {RootState} from '../../../app/providers/StoreProvider/store';
import {RootStackParamList} from '../../../navigation/AppNavigator';
import {StackNavigationProp} from '@react-navigation/stack';

type AuthNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * This component listens for changes in the authentication state
 * and automatically navigates based on the auth state
 */
export const AuthNavigationHandler: React.FC = () => {
    const navigation = useNavigation<AuthNavigationProp>();
    const { accessToken } = useSelector((state: RootState) => state.auth);
    const previousAuthState = useRef<boolean | null>(null);

    useEffect(() => {
        const isAuthenticated = !!accessToken;

        // Only navigate if the auth state actually changed
        if (previousAuthState.current !== isAuthenticated) {
            if (isAuthenticated) {
                // User just became authenticated, navigate to Main screen
                console.log('User authenticated, navigating to Main screen');
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [
                            {
                                name: 'Main',
                                params: { screen: 'Home' },
                            },
                        ],
                    })
                );
            } else if (previousAuthState.current === true) {
                // User was authenticated but now isn't (logged out)
                console.log('User logged out, navigating to Login screen');
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    })
                );
            }

            // Update the previous state reference
            previousAuthState.current = isAuthenticated;
        }
    }, [accessToken, navigation]);

    // This component doesn't render anything
    return null;
};

/**
 * Hook to use in components that need to check if a user can access them
 * based on authentication state
 */
export const useAuthGuard = () => {
    const navigation = useNavigation<AuthNavigationProp>();
    const { accessToken } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!accessToken) {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            );
        }
    }, [accessToken, navigation]);

    return { isAuthenticated: !!accessToken };
};