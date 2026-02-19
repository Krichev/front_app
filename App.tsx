// App.tsx
import 'react-native-gesture-handler';
import RemoteLogService from './src/services/logging/RemoteLogService';

// Initialize remote logging as early as possible
// Only active in RELEASE builds (unless force-enabled)
RemoteLogService.getInstance().initialize();

// Catch uncaught JS errors
const globalHandler = (global as any).ErrorUtils?.getGlobalHandler();
if ((global as any).ErrorUtils) {
    (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
        console.error(`[FATAL=${isFatal}] Uncaught exception: ${error?.message}`, error);
        // Call original handler
        if (globalHandler) {
            globalHandler(error, isFatal);
        }
    });
}

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
import { navigateToTabWithRef } from './src/utils/navigation';
import { useAppUpdate, UpdateModal } from './src/features/AppUpdate';

const linking = {
    prefixes: ['challengerapp://', 'https://play.yourapp.com'],
    config: {
        screens: {
            ControllerLobby: 'join/:roomCode',
        },
    },
};

/**
 * Inner app content with KeychainService initialization
 */
const AppContent: React.FC = () => {
    const { currentLanguage } = useI18n();
    const { showModal, checkForUpdate, ...updateProps } = useAppUpdate();

    React.useEffect(() => {
        // Delay update check to not block app startup
        const timer = setTimeout(() => {
            checkForUpdate(); // auto-check (respects 4-hour interval)
        }, 3000);
        return () => clearTimeout(timer);
    }, [checkForUpdate]);

    const handleViewPenalties = useCallback(() => {
        // Navigate to penalties - the overlay might block interaction unless we handle this carefully.
        // But since we are passing this callback, the overlay calls it on press.
        // We rely on the overlay staying visible but maybe allowing the navigation transition underneath
        // OR the overlay might momentarily hide or we might need to unlock?
        // Actually the requirement is "Lock should be dismissible ONLY if time is restored".
        // But we want to allow user to view penalties to UNLOCK the time.
        // So we navigate to PenaltyDashboard.
        if (navigationRef.current?.isReady()) {
            navigationRef.current?.navigate('PenaltyDashboard');
        }
    }, []);

    const handleOpenSettings = useCallback(() => {
        navigateToTabWithRef('Settings');
    }, []);

    return (
        <AuthInitializer>
            <ScreenTimeProvider>
                <WWWGameProvider>
                    <AppNavigation key={currentLanguage} linking={linking} />
                    <AppLockOverlay 
                        onViewPenalties={handleViewPenalties}
                        onOpenSettings={handleOpenSettings}
                    />
                    <LowTimeWarningBanner />
                    <UpdateModal visible={showModal} {...updateProps} />
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
