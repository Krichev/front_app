// src/shared/ui/theme/index.ts
import type {Theme} from './types';
import {colors} from './colors';
import {typography} from './typography';
import {layout, spacing} from './spacing';
import {shadows} from './shadows';
import {components} from './components';
import {combineStyles, globalStyles, utilities} from './globalStyles';

/**
 * Main theme object implementing the Theme interface
 */
export const theme: Theme = {
    colors,
    typography,
    spacing,
    layout,
    shadows,
    components,
    utilities,
} as const;

// Export individual modules for direct import
export {
    colors,
    typography,
    spacing,
    layout,
    shadows,
    components,
    globalStyles,
    utilities,
    combineStyles,
};

// Export types for external use
export type {
    Theme,
    Colors,
    Typography,
    Spacing,
    Layout,
    Shadows,
    Components,
    UtilityStyles,
    CreateStylesFunction,
    StylesObject,
    UseThemeResult,
    ThemeConfig,
    ThemeProviderProps,
    ButtonStyles,
    InputStyles,
    ListStyles,
    CardStyles,
    ColorScheme,
    SemanticColor,
    HeadingStyle,
    BodyStyle,
    Shadow,
    ThemeMode,
    ThemedTheme,
    FontWeight,
    FontSize,
    LineHeight,
    LetterSpacing,
    FontWeightValue,
} from './types';

// Export style creation utilities

export {

    createStyles,

    createStaticStyles,

    useStyles,

    combineStyles as mergeStyles,

    createConditionalStyles,

    createResponsiveStyles,

} from './createStyles';



// Export ThemeProvider and hooks

export {

    ThemeProvider,

    useTheme,

    useThemeObject,

    useThemeColors,

    useThemeSpacing,

    useThemeTypography,

    withTheme,

    ThemeConsumer,

    ThemeContext,

} from './ThemeProvider';

// Export Paper theme utilities
export { createPaperTheme, createDarkPaperTheme } from './paperTheme';

// Export shared styles

export * from '../styles';



// Export shared hooks

export * from '../hooks/useAppStyles';



// Default export

export default theme;


