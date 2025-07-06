// App.tsx - Updated with proper StoreProvider integration
import 'react-native-gesture-handler';
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar, StyleSheet} from 'react-native';
import {AppProviders} from './src/app/providers';
import AppNavigation from './src/navigation/AppNavigator';

const App: React.FC = () => {
    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent={true}
            />
            <AppProviders>
                <AppNavigation />
            </AppProviders>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default App;