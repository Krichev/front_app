// App.tsx
import 'react-native-gesture-handler';
import React, {useCallback} from 'react';
import {Provider} from 'react-redux';
import {store} from './src/app/providers/StoreProvider/store.ts';
import AppNavigation, {navigationRef} from './src/navigation/AppNavigator.tsx';
import {WWWGameProvider} from './src/app/providers/WWWGameProvider.tsx';
import {ScreenTimeProvider} from './src/app/providers/ScreenTimeProvider.tsx';
import {AppLockOverlay} from './src/features/ScreenTime/ui/AppLockOverlay.tsx';
import {LowTimeWarningBanner} from './src/features/ScreenTime/ui/LowTimeWarningBanner.tsx';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {AuthInitializer} from './src/entities/AuthState/ui/AuthInitializer.tsx';
import {ThemeProvider} from './src/shared/ui/theme/ThemeProvider';
import { I18nProvider, useI18n } from './src/app/providers/I18nProvider';

/**
 * Inner app content with KeychainService initialization
 */
const AppContent: React.FC = () => {
    const { currentLanguage } = useI18n();

    const handleViewPenalties = useCallback(() => {
        // Navigate to penalties - the overlay might block interaction unless we handle this carefully.
        // But since we are passing this callback, the overlay calls it on press.
        // We rely on the overlay staying visible but maybe allowing the navigation transition underneath
        // OR the overlay might momentarily hide or we might need to unlock?
        // Actually the requirement is "Lock should be dismissible ONLY if time is restored".
        // But we want to allow user to view penalties to UNLOCK the time.
        // So we navigate to PenaltyDashboard.
        navigationRef.current?.navigate('PenaltyDashboard');
    }, []);

    const handleOpenSettings = useCallback(() => {
        navigationRef.current?.navigate('Main', { screen: 'Settings' });
    }, []);

    return (
        <AuthInitializer>
            <ScreenTimeProvider>
                <WWWGameProvider>
                    <AppNavigation key={currentLanguage} />
                    <AppLockOverlay 
                        onViewPenalties={handleViewPenalties}
                        onOpenSettings={handleOpenSettings}
                    />
                    <LowTimeWarningBanner />
                </WWWGameProvider>
            </ScreenTimeProvider>
        </AuthInitializer>
    );
};

/**
 * Main App Component
 */
const App: React.FC = () => {
    return (
        <GestureHandlerRootView style={styles.container}>
            <Provider store={store}>
                <I18nProvider>
                    <ThemeProvider>
                        <AppContent />
                    </ThemeProvider>
                </I18nProvider>
            </Provider>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default App;
