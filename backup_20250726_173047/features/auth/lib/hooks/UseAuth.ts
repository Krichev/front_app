// src/features/auth/lib/hooks/UseAuth.ts
import {useDispatch, useSelector} from 'react-redux';
import type {RootState} from '../../../../app/store';
import {authActions} from '../../model';
import type {LoginCredentials, User} from '../../model/types.ts';

// Hook that combines Redux state with any context if needed
export const useAuth = () => {
    const dispatch = useDispatch();
    const auth = useSelector((state: RootState) => state.auth);

    const login = async (credentials: LoginCredentials) => {
        try {
            dispatch(authActions.loginStart());
            // The actual login logic should be handled by the AuthProvider context
            // This hook just provides access to the Redux state
        } catch (error) {
            dispatch(authActions.loginFailure(error instanceof Error ? error.message : 'Login failed'));
            throw error;
        }
    };

    const logout = async () => {
        try {
            dispatch(authActions.setLoading(true));
            // The actual logout logic should be handled by the AuthProvider context
            dispatch(authActions.logout());
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateUser = (userData: Partial<User>) => {
        dispatch(authActions.updateUser(userData));
    };

    const clearError = () => {
        dispatch(authActions.clearError());
    };

    return {
        // State
        user: auth.user,
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        error: auth.error,

        // Actions
        login,
        logout,
        updateUser,
        clearError,
    };
};