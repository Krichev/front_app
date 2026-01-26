// App.tsx - USING CUSTOM HOOK
import 'react-native-gesture-handler';
import React from 'react';
import {Provider} from 'react-redux';
import {store} from './src/app/providers/StoreProvider/store.ts';
import AppNavigation from './src/navigation/AppNavigator.tsx';
import {WWWGameProvider} from './src/app/providers/WWWGameProvider.tsx';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {AuthInitializer} from './src/entities/AuthState/ui/AuthInitializer.tsx';
import {useKeychainInitializer} from './src/hooks/useKeychainInitializer';
import {ThemeProvider} from './src/shared/ui/theme/ThemeProvider';
import { I18nProvider } from './src/app/providers/I18nProvider';

/**
 * Inner app content with KeychainService initialization
 */
const AppContent: React.FC = () => {
    // Initialize KeychainService once on app start
    useKeychainInitializer();

    return (
        <AuthInitializer>
            <WWWGameProvider>
                <AppNavigation />
            </WWWGameProvider>
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