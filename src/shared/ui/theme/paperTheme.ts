import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { Theme } from './types';
import { ThemeMode } from './types';

/**
 * Maps custom theme colors to react-native-paper MD3 theme format
 */
export const createPaperTheme = (customTheme: Theme, mode: ThemeMode): MD3Theme => {
    const baseTheme = mode === ThemeMode.DARK ? MD3DarkTheme : MD3LightTheme;
    
    // Configure fonts to match custom typography
    const fontConfig = {
        fontFamily: customTheme.typography.fontFamily.primary,
    };
    
    return {
        ...baseTheme,
        colors: {
            ...baseTheme.colors,
            // Primary colors
            primary: customTheme.colors.primary.main,
            primaryContainer: customTheme.colors.primary.light,
            onPrimary: customTheme.colors.primary.contrast,
            onPrimaryContainer: customTheme.colors.primary.dark,
            
            // Secondary colors
            secondary: customTheme.colors.secondary.main,
            secondaryContainer: customTheme.colors.secondary.light,
            onSecondary: customTheme.colors.secondary.contrast,
            onSecondaryContainer: customTheme.colors.secondary.dark,
            
            // Tertiary (using accent)
            tertiary: customTheme.colors.accent.main,
            tertiaryContainer: customTheme.colors.accent.light,
            onTertiary: customTheme.colors.accent.contrast,
            onTertiaryContainer: customTheme.colors.accent.dark,
            
            // Error colors
            error: customTheme.colors.error.main,
            errorContainer: customTheme.colors.error.background,
            onError: customTheme.colors.neutral.white,
            onErrorContainer: customTheme.colors.error.dark,
            
            // Background & Surface
            background: customTheme.colors.background.primary,
            onBackground: customTheme.colors.text.primary,
            surface: customTheme.colors.background.primary,
            onSurface: customTheme.colors.text.primary,
            surfaceVariant: customTheme.colors.background.secondary,
            onSurfaceVariant: customTheme.colors.text.secondary,
            
            // Surface containers (MD3 specific)
            surfaceDisabled: customTheme.colors.neutral.gray[200],
            onSurfaceDisabled: customTheme.colors.text.disabled,
            
            // Outline & borders
            outline: customTheme.colors.border.main,
            outlineVariant: customTheme.colors.border.light,
            
            // Inverse colors
            inverseSurface: customTheme.colors.background.dark,
            inverseOnSurface: customTheme.colors.text.inverse,
            inversePrimary: customTheme.colors.primary.light,
            
            // Elevation/shadow tint
            elevation: {
                level0: 'transparent',
                level1: customTheme.colors.background.primary,
                level2: customTheme.colors.background.secondary,
                level3: customTheme.colors.background.tertiary,
                level4: customTheme.colors.neutral.gray[100],
                level5: customTheme.colors.neutral.gray[200],
            },
            
            // Backdrop for modals
            backdrop: customTheme.colors.overlay.medium,
        },
        fonts: configureFonts({ config: fontConfig }),
        roundness: customTheme.layout.borderRadius.md,
    };
};

/**
 * Create dark mode variant of Paper theme
 */
export const createDarkPaperTheme = (customTheme: Theme): MD3Theme => {
    return createPaperTheme({
        ...customTheme,
        colors: {
            ...customTheme.colors,
            background: {
                primary: customTheme.colors.background.dark,
                secondary: customTheme.colors.neutral.gray[800],
                tertiary: customTheme.colors.neutral.gray[700],
                dark: customTheme.colors.neutral.black,
            },
            text: {
                primary: customTheme.colors.neutral.white,
                secondary: customTheme.colors.neutral.gray[300],
                disabled: customTheme.colors.neutral.gray[500],
                inverse: customTheme.colors.neutral.black,
            },
        },
    }, ThemeMode.DARK);
};
