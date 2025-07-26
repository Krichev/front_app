// src/app/providers/index.tsx
import React from 'react';

import {StoreProvider} from './StoreProvider';
import {AuthProvider} from './AuthProvider';
import {ThemeProvider} from './ThemeProvider';
import {WWWGameProvider} from './GameProvider';

interface AppProvidersProps {
    children: React.ReactNode;
}

/**
 * Main App Providers wrapper that combines all application providers
 * in the correct order. The order is important:
 * 1. StoreProvider - Redux store must be available first
 * 2. ThemeProvider - Theme context for styling
 * 3. AuthProvider - Authentication context (depends on store)
 * 4. WWWGameProvider - Game-specific context
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
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

// Individual provider exports for direct usage
export { StoreProvider } from './StoreProvider';
export { ThemeProvider, useTheme, Theme } from './ThemeProvider';
export { WWWGameProvider, useWWWGame } from './GameProvider';
export { AuthProvider, useAuth, AuthGuard } from './AuthProvider';