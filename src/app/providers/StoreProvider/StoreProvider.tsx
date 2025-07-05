// src/app/providers/StoreProvider.tsx
import React from 'react';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, store} from '../store';

interface StoreProviderProps {
    children: React.ReactNode;
    loading?: React.ComponentType<any> | React.ReactElement | null;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({
                                                                children,
                                                                loading = null
                                                            }) => {
    return (
        <Provider store={store}>
            <PersistGate loading={loading} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    );
};