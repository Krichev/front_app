// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import {Provider} from "react-redux";
import {store} from "./src/app/providers/StoreProvider/store.ts";
import AppNavigation from "./src/navigation/AppNavigator.tsx";
import {WWWGameProvider} from "./src/app/providers/WWWGameProvider.tsx";


const App: React.FC = () => {
    return (
        <Provider store={store}>
            <WWWGameProvider>
                <AppNavigation />
            </WWWGameProvider>
        </Provider>
    );
};

export default App;