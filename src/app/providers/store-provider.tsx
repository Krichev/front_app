// src/app/providers/store-provider.tsx
import React from 'react';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, store} from '../store';
import {CustomLoadingState} from '../../shared/ui';

interface StoreProviderProps {
    children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({children}) => {
    return (
        <Provider store={store}>
            <PersistGate
                loading={<CustomLoadingState text="Loading app..." />}
                persistor={persistor}
            >
                {children}
            </PersistGate>
        </Provider>
    );
};