// src/entities/AuthState/ui/AuthNavigationHandler.tsx
import React, {useEffect} from 'react';
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

    useEffect(() => {
        // When auth state changes, trigger navigation
        if (accessToken) {
            // User is authenticated, navigate to Main screen
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'Main',
                    params: { screen: 'Home' },
                })
            );
        } else if (navigation.canGoBack()) {
            // User is not authenticated, navigate to Login screen
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'Login',
                })
            );
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
                CommonActions.navigate({
                    name: 'Login',
                })
            );
        }
    }, [accessToken, navigation]);

    return { isAuthenticated: !!accessToken };
};