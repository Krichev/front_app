// src/app/providers/index.tsx
import React from 'react';

import {StoreProvider} from './store-provider';
import {AuthProvider} from './auth-provider';
import {ThemeProvider} from './ThemeProvider';
import {WWWGameProvider} from './WWWGameProvider';

interface AppProvidersProps {
    children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({children}) => {
    return (
        <StoreProvider>
            <ThemeProvider>
                <AuthProvider>
                    <WWWGameProvider>
                        {children}
                    </WWWGameProvider>
                </AuthProvider>
            </ThemeProvider>
        </StoreProvider>
    );
};

// Individual provider exports
export {StoreProvider} from './store-provider';
export {ThemeProvider} from './theme-provider';
export {WWWGameProvider} from './game-provider';
export {AuthProvider} from './auth-provider';