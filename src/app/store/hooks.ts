// src/app/store/hooks.ts
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import type {AppDispatch, RootState} from './index';

// Typed hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Auth-specific hook
export const useAuth = () => useAppSelector((state) => state.auth);

// Loading states hook with proper type checking
export const useIsLoading = () => {
    const auth = useAppSelector((state) => state.auth);

    // Safely check if gameSession exists and has isLoading property
    const gameSession = useAppSelector((state) => {
        if ('gameSession' in state && state.gameSession && typeof state.gameSession === 'object') {
            return state.gameSession as { isLoading?: boolean };
        }
        return null;
    });

    return auth.isLoading || (gameSession?.isLoading ?? false);
};

// API loading states with proper error handling
export const useApiLoadingStates = () => {
    return useAppSelector((state) => {
        // Helper function to check if API slice has pending queries
        const hasLoadingQueries = (apiSlice: any) => {
            if (!apiSlice?.queries) return false;
            return Object.values(apiSlice.queries).some((query: any) => query?.status === 'pending');
        };

        return {
            authLoading: hasLoadingQueries(state.authApi),
            userLoading: hasLoadingQueries(state.userApi),
            challengeLoading: hasLoadingQueries(state.challengeApi),
            groupLoading: hasLoadingQueries(state.groupApi),
            quizLoading: hasLoadingQueries(state.quizApi),
        };
    });
};

// Store status hook with comprehensive state checking
export const useStoreStatus = () => {
    const auth = useAppSelector((state) => state.auth);
    const apiStates = useApiLoadingStates();

    // Safely get gameSession state
    const gameSession = useAppSelector((state) => {
        if ('gameSession' in state && state.gameSession && typeof state.gameSession === 'object') {
            return state.gameSession as { isLoading?: boolean; error?: string };
        }
        return { isLoading: false, error: null };
    });

    return {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading || gameSession.isLoading,
        hasErrors: !!(auth.error || gameSession.error),
        apiLoading: Object.values(apiStates).some(loading => loading),
        authError: auth.error,
        gameSessionError: gameSession.error,
    };
};

// Additional utility hooks
export const useAuthToken = () => {
    return useAppSelector((state) => state.auth.accessToken);
};

export const useCurrentUser = () => {
    return useAppSelector((state) => state.auth.user);
};

export const useIsAuthenticated = () => {
    return useAppSelector((state) => state.auth.isAuthenticated);
};