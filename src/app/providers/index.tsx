// src/app/providers/index.tsx
import React from 'react';
import {AuthProvider} from './auth-provider';
import {ThemeProvider} from './ThemeProvider';
import {WWWGameProvider} from './WWWGameProvider';
import StoreProvider from './StoreProvider';

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
export { StoreProvider } from './StoreProvider';
export { ThemeProvider } from './ThemeProvider';
export { WWWGameProvider } from './WWWGameProvider';
export { AuthProvider } from './auth-provider';