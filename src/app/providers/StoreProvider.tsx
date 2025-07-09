// src/app/providers/StoreProvider.tsx
import React, {ErrorInfo, ReactNode, Suspense} from 'react';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {ErrorBoundary} from 'react-error-boundary';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {persistor, store} from '../store';

// Types
interface StoreProviderProps {
    children: ReactNode;
}

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

// Error Fallback Component
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => (
    <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
            {error.message || 'An unexpected error occurred'}
        </Text>
        <Text style={styles.retryButton} onPress={resetErrorBoundary}>
            Try Again
        </Text>
    </View>
);

// Loading Component for PersistGate
const PersistLoading: React.FC = () => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading app...</Text>
    </View>
);

// Main Store Provider Component
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
    const handleError = (error: Error, errorInfo: ErrorInfo) => {
        // Log error to crash reporting service (e.g., Crashlytics, Sentry)
        console.error('Store Provider Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Component Stack:', errorInfo.componentStack || 'No component stack available');

        // You can add crash reporting here
        // crashlytics().recordError(error);
        // Sentry.captureException(error, {
        //   extra: { componentStack: errorInfo.componentStack }
        // });
    };

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={handleError}
            onReset={() => {
                // Optional: Reset any application state if needed
                console.log('Resetting store provider error boundary');
            }}
        >
            <Provider store={store}>
                <PersistGate
                    loading={<PersistLoading />}
                    persistor={persistor}
                    onBeforeLift={() => {
                        // Optional: Add any logic before the persisted state is loaded
                        console.log('Loading persisted state...');
                    }}
                >
                    <Suspense fallback={<PersistLoading />}>
                        {children}
                    </Suspense>
                </PersistGate>
            </Provider>
        </ErrorBoundary>
    );
};

// Styles
const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#dc3545',
        marginBottom: 10,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    retryButton: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        textAlign: 'center',
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6c757d',
        fontWeight: '500',
    },
});

// Export types for convenience
export type { StoreProviderProps };