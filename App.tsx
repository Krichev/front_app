// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {AppProviders} from './src/app/providers';
import {AppNavigator} from './src/app/navigation/AppNavigator';

const App: React.FC = () => {
    return (
        <GestureHandlerRootView style={styles.container}>
            <AppProviders>
                <AppNavigator />
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