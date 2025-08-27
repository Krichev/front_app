// Updated App.tsx with GestureHandlerRootView
import 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import {Provider, useDispatch} from "react-redux";
import {store} from "./src/app/providers/StoreProvider/store.ts";
import AppNavigation from "./src/navigation/AppNavigator.tsx";
import {WWWGameProvider} from "./src/app/providers/WWWGameProvider.tsx";
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import TokenRefreshService from "./src/services/auth/TokenRefreshService.ts";

// Add this to your main App component or a wrapper component
export const AppWithTokenInitialization: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('🔄 Initializing authentication...');

                // Load tokens from storage on app start
                const tokensLoaded = await TokenRefreshService.loadTokensFromStorage();

                if (tokensLoaded) {
                    console.log('✅ Authentication initialized successfully');
                } else {
                    console.log('❌ No valid tokens found - user needs to login');
                }
            } catch (error) {
                console.error('❌ Error initializing authentication:', error);
            }
        };

        initializeAuth();
    }, [dispatch]);

    return <>{children}</>;
};
const App: React.FC = () => {
    return (
        <GestureHandlerRootView style={styles.container}>
            <Provider store={store}>
                <WWWGameProvider>
                    <AppNavigation />
                </WWWGameProvider>
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