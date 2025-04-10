// Updated App.tsx with GestureHandlerRootView
import 'react-native-gesture-handler';
import React from 'react';
import {Provider} from "react-redux";
import {store} from "./src/app/providers/StoreProvider/store.ts";
import AppNavigation from "./src/navigation/AppNavigator.tsx";
import {WWWGameProvider} from "./src/app/providers/WWWGameProvider.tsx";
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';

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