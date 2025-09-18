import {Platform} from 'react-native';
import {colors} from './colors';

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
});

export const typography = {
    // Font families
    fontFamily,

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

    // Font weights
    fontWeight: {
        regular: '400',
        medium: '500',
        semiBold: '600',
        bold: '700',
    },

    // Text styles
    heading: {
        h1: {
            fontSize: 36,
            lineHeight: 44,
            fontWeight: Platform.select({ ios: '700', android: 'bold' }),
            color: colors.text.primary,
            fontFamily: fontFamily.bold,
        },
        h2: {
            fontSize: 30,
            lineHeight: 36,
            fontWeight: Platform.select({ ios: '600', android: 'bold' }),
            color: colors.text.primary,
            fontFamily: fontFamily.semiBold,
        },
        h3: {
            fontSize: 24,
            lineHeight: 32,
            fontWeight: Platform.select({ ios: '600', android: 'bold' }),
            color: colors.text.primary,
            fontFamily: fontFamily.semiBold,
        },
        h4: {
            fontSize: 20,
            lineHeight: 28,
            fontWeight: Platform.select({ ios: '600', android: 'bold' }),
            color: colors.text.primary,
            fontFamily: fontFamily.semiBold,
        },
        h5: {
            fontSize: 18,
            lineHeight: 24,
            fontWeight: Platform.select({ ios: '500', android: 'bold' }),
            color: colors.text.primary,
            fontFamily: fontFamily.medium,
        },
        h6: {
            fontSize: 16,
            lineHeight: 20,
            fontWeight: Platform.select({ ios: '500', android: 'bold' }),
            color: colors.text.primary,
            fontFamily: fontFamily.medium,
        },
    },

    body: {
        large: {
            fontSize: 18,
            lineHeight: 28,
            fontWeight: '400',
            color: colors.text.primary,
            fontFamily: fontFamily.regular,
        },
        regular: {
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '400',
            color: colors.text.primary,
            fontFamily: fontFamily.regular,
        },
        small: {
            fontSize: 14,
            lineHeight: 20,
            fontWeight: '400',
            color: colors.text.primary,
            fontFamily: fontFamily.regular,
        },
    },

    caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
        color: colors.text.secondary,
        fontFamily: fontFamily.regular,
    },

    button: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: Platform.select({ ios: '600', android: 'bold' }),
        fontFamily: fontFamily.semiBold,
        textTransform: 'none',
    },

    link: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '400',
        color: colors.primary.main,
        fontFamily: fontFamily.regular,
        textDecorationLine: 'underline',
    },
};