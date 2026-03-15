// src/shared/ui/theme/spacing.ts
import { moderateScale } from '../../lib/responsive';
import type {Layout, Spacing} from './types';

// Base spacing unit (4px)
const base = 4;

export const spacing: Spacing = {
    xs: base,        // 4
    sm: base * 2,    // 8
    md: base * 3,    // 12
    lg: base * 4,    // 16
    xl: base * 5,    // 20
    '2xl': base * 6, // 24
    '3xl': base * 8, // 32
    '4xl': base * 10, // 40
    '5xl': base * 12, // 48
};

/**
 * Returns spacing values run through moderateScale
 * Note: Use this only when explicit responsive spacing is needed
 */
export const scaledSpacing: Spacing = {
    xs: moderateScale(spacing.xs),
    sm: moderateScale(spacing.sm),
    md: moderateScale(spacing.md),
    lg: moderateScale(spacing.lg),
    xl: moderateScale(spacing.xl),
    '2xl': moderateScale(spacing['2xl']),
    '3xl': moderateScale(spacing['3xl']),
    '4xl': moderateScale(spacing['4xl']),
    '5xl': moderateScale(spacing['5xl']),
};

export const layout: Layout = {
    borderRadius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        '2xl': 24,
        '3xl': 32,
        full: 9999,
    },

    borderWidth: {
        none: 0,
        thin: 1,
        thick: 2,
    },

    // THIS WAS MISSING! - maxWidth property
    maxWidth: {
        xs: 320,
        sm: 480,
        md: 640,
        lg: 768,
        xl: 1024,
        '2xl': 1280,
        full: '100%',
    },
};

// Extended layout properties for internal use (not in the interface)
export const extendedLayout = {
    // These are additional layout properties used in your components
    // but not part of the TypeScript interface
    screenPadding: spacing.lg,
    cardPadding: spacing.lg,
    sectionSpacing: spacing['3xl'],
    itemSpacing: spacing.md,

    // Additional border widths for specific use cases
    borderWidthExtended: {
        none: 0,
        hairline: 0.5,
        thin: 1,
        medium: 2,
        thick: 3,
    },
};