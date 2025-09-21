// src/shared/ui/theme/ThemeProvider.tsx
import React, {createContext, useCallback, useContext, useMemo} from 'react';
import type {Theme, ThemeConfig, ThemeProviderProps, UseThemeResult} from './types';
import {ThemeMode} from './types'; // Import ThemeMode as a value, not a type
import {theme as defaultTheme} from './index';

/**
 * Theme Context for providing theme throughout the app
 */
interface ThemeContextValue extends UseThemeResult {
    setTheme: (newTheme: Theme) => void;
    updateConfig: (config: Partial<ThemeConfig>) => void;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Enhanced Theme Provider component with full TypeScript support
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
                                                                children,
                                                                theme: initialTheme = defaultTheme,
                                                                config = {},
                                                            }) => {
    const [currentTheme, setCurrentTheme] = React.useState<Theme>(initialTheme);
    const [currentMode, setCurrentMode] = React.useState<ThemeMode>(
        config.mode || ThemeMode.LIGHT
    );
    const [themeConfig, setThemeConfig] = React.useState<ThemeConfig>(config);

    /**
     * Apply theme configuration to base theme
     */
    const applyThemeConfig = useCallback((baseTheme: Theme, config: ThemeConfig): Theme => {
        const {
            customColors,
            customTypography,
            customSpacing,
            customComponents,
        } = config;

        return {
            ...baseTheme,
            ...(customColors && {
                colors: {
                    ...baseTheme.colors,
                    ...customColors,
                },
            }),
            ...(customTypography && {
                typography: {
                    ...baseTheme.typography,
                    ...customTypography,
                },
            }),
            ...(customSpacing && {
                spacing: {
                    ...baseTheme.spacing,
                    ...customSpacing,
                },
            }),
            ...(customComponents && {
                components: {
                    ...baseTheme.components,
                    ...customComponents,
                },
            }),
        };
    }, []);

    /**
     * Update theme with new configuration
     */
    const updateConfig = useCallback((newConfig: Partial<ThemeConfig>) => {
        const updatedConfig = { ...themeConfig, ...newConfig };
        setThemeConfig(updatedConfig);

        const configuredTheme = applyThemeConfig(initialTheme, updatedConfig);
        setCurrentTheme(configuredTheme);
    }, [themeConfig, initialTheme, applyThemeConfig]);

    /**
     * Set new theme
     */
    const setTheme = useCallback((newTheme: Theme) => {
        setCurrentTheme(newTheme);
    }, []);

    /**
     * Set theme mode (light/dark)
     */
    const setMode = useCallback((mode: ThemeMode) => {
        setCurrentMode(mode);
        updateConfig({ mode });
    }, [updateConfig]);

    /**
     * Memoized theme context value
     */
    const contextValue = useMemo<ThemeContextValue>(() => ({
        theme: currentTheme,
        colors: currentTheme.colors,
        spacing: currentTheme.spacing,
        typography: currentTheme.typography,
        layout: currentTheme.layout,
        shadows: currentTheme.shadows,
        components: currentTheme.components,
        utilities: currentTheme.utilities,
        setTheme,
        updateConfig,
        mode: currentMode,
        setMode,
    }), [
        currentTheme,
        setTheme,
        updateConfig,
        currentMode,
        setMode,
    ]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * Hook to access theme context with full TypeScript support
 */
export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
};

/**
 * Hook to access only theme object (lighter alternative)
 */
export const useThemeObject = (): Theme => {
    const { theme } = useTheme();
    return theme;
};

/**
 * Hook to access specific theme properties
 */
export const useThemeColors = () => {
    const { colors } = useTheme();
    return colors;
};

export const useThemeSpacing = () => {
    const { spacing } = useTheme();
    return spacing;
};

export const useThemeTypography = () => {
    const { typography } = useTheme();
    return typography;
};

/**
 * Higher-order component for theme injection
 */
export function withTheme<P extends object>(
    Component: React.ComponentType<P & { theme: Theme }>
): React.FC<P> {
    return (props: P) => {
        const theme = useThemeObject();
        return <Component {...props} theme={theme} />;
    };
}

/**
 * Theme consumer component for render prop pattern
 */
interface ThemeConsumerProps {
    children: (theme: UseThemeResult) => React.ReactNode;
}

export const ThemeConsumer: React.FC<ThemeConsumerProps> = ({ children }) => {
    const theme = useTheme();
    return <>{children(theme)}</>;
};

/**
 * Utility component for conditional rendering based on theme mode
 */
interface ConditionalThemeProps {
    mode: ThemeMode;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const ConditionalTheme: React.FC<ConditionalThemeProps> = ({
                                                                      mode,
                                                                      children,
                                                                      fallback = null,
                                                                  }) => {
    const { mode: currentMode } = useTheme();
    return currentMode === mode ? <>{children}</> : <>{fallback}</>;
};

// Export context for advanced usage
export { ThemeContext };

// Export default theme for reference
export { defaultTheme };