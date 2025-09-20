// src/shared/ui/theme/typography.ts
import {Platform} from 'react-native';
import {colors} from './colors';
import type {FontWeightValue, Typography} from './types';

const fontFamily = Platform.select({
    ios: {
        regular: 'System',
        medium: 'System',
        semiBold: 'System',
        bold: 'System',
    },
    android: {
        regular: 'Roboto',
        medium: 'Roboto-Medium',
        semiBold: 'Roboto-Medium',
        bold: 'Roboto-Bold',
    },
}) as {
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
};

export const typography: Typography = {
    // Font families
    fontFamily: {
        primary: fontFamily.regular,
        secondary: fontFamily.medium,
        mono: Platform.select({
            ios: 'Courier',
            android: 'monospace',
        }) as string,
    },

    // Font weights - using proper FontWeightValue types
    fontWeight: {
        light: '300' as FontWeightValue,
        regular: '400' as FontWeightValue,
        medium: '500' as FontWeightValue,
        semibold: '600' as FontWeightValue,
        bold: '700' as FontWeightValue,
    },

    // Font sizes
    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
        loose: 2,
    },

    // Letter spacing
    letterSpacing: {
        tighter: -0.05,
        tight: -0.025,
        normal: 0,
        wide: 0.025,
        wider: 0.05,
        widest: 0.1,
    },

    // Predefined heading styles
    heading: {
        h1: {
            fontSize: 36,
            lineHeight: 44,
            fontWeight: '700' as FontWeightValue,
            letterSpacing: -0.025,
            color: colors.text.primary,
            fontFamily: fontFamily.bold,
        },
        h2: {
            fontSize: 30,
            lineHeight: 36,
            fontWeight: '600' as FontWeightValue,
            letterSpacing: -0.02,
            color: colors.text.primary,
            fontFamily: fontFamily.semiBold,
        },
        h3: {
            fontSize: 24,
            lineHeight: 32,
            fontWeight: '600' as FontWeightValue,
            letterSpacing: -0.015,
            color: colors.text.primary,
            fontFamily: fontFamily.semiBold,
        },
        h4: {
            fontSize: 20,
            lineHeight: 28,
            fontWeight: '600' as FontWeightValue,
            letterSpacing: -0.01,
            color: colors.text.primary,
            fontFamily: fontFamily.semiBold,
        },
        h5: {
            fontSize: 18,
            lineHeight: 24,
            fontWeight: '500' as FontWeightValue,
            letterSpacing: -0.005,
            color: colors.text.primary,
            fontFamily: fontFamily.medium,
        },
        h6: {
            fontSize: 16,
            lineHeight: 20,
            fontWeight: '500' as FontWeightValue,
            letterSpacing: 0,
            color: colors.text.primary,
            fontFamily: fontFamily.medium,
        },
    },

    // Body text styles
    body: {
        large: {
            fontSize: 18,
            lineHeight: 28,
            fontWeight: '400' as FontWeightValue,
            color: colors.text.primary,
            fontFamily: fontFamily.regular,
        },
        medium: {
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '400' as FontWeightValue,
            color: colors.text.primary,
            fontFamily: fontFamily.regular,
        },
        small: {
            fontSize: 14,
            lineHeight: 20,
            fontWeight: '400' as FontWeightValue,
            color: colors.text.primary,
            fontFamily: fontFamily.regular,
        },
    },

    // Caption text style
    caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400' as FontWeightValue,
        color: colors.text.secondary,
        fontFamily: fontFamily.regular,
    },

    // Button text style
    button: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600' as FontWeightValue,
        fontFamily: fontFamily.semiBold,
        textTransform: 'none' as const,
    },
};