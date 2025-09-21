import {StyleSheet, TextStyle, ViewStyle} from 'react-native';
import {ButtonSize, ButtonVariant} from './Button';
import type {Theme} from '../theme/types';

/**
 * Helper function to get button styles from theme
 * This can be used for custom styling or when theme context is not available
 */
export const getButtonStylesFromTheme = (
    theme: Theme,
    variant: ButtonVariant = ButtonVariant.PRIMARY,
    size: ButtonSize = ButtonSize.MEDIUM,
    disabled: boolean = false
) => {
    const buttonTheme = theme.components.button;
    const effectiveVariant = disabled ? ButtonVariant.DISABLED : variant;

    const containerStyle: ViewStyle = {
        ...buttonTheme.base,
        ...buttonTheme.variants[effectiveVariant],
        ...buttonTheme.sizes[size],
    };

    const textStyle: TextStyle = {
        ...buttonTheme.text[effectiveVariant] || buttonTheme.text.primary,
    };

    return {
        container: containerStyle,
        text: textStyle,
    };
};

/**
 * Static styles that don't depend on theme
 * These can be used for layout or positioning that's consistent across themes
 */
export const staticButtonStyles = StyleSheet.create({
    fullWidth: {
        width: '100%' as const,
    },

    centered: {
        alignSelf: 'center',
    },

    leftAligned: {
        alignSelf: 'flex-start',
    },

    rightAligned: {
        alignSelf: 'flex-end',
    },

    // Loading state styles
    loading: {
        opacity: 0.7,
    },

    // Icon button specific styles
    iconOnly: {
        aspectRatio: 1,
        paddingHorizontal: 0,
    },

    // Button with icon and text
    withStartIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    withEndIcon: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },

    iconSpacing: {
        marginHorizontal: 8,
    },
});

/**
 * Helper function to create custom button variants
 * This allows extending the theme with additional button styles
 */
export const createCustomButtonVariant = (
    theme: Theme,
    customStyles: {
        container?: ViewStyle;
        text?: TextStyle;
    }
): { container: ViewStyle; text: TextStyle } => {
    return {
        container: {
            ...theme.components.button.base,
            ...customStyles.container,
        },
        text: {
            ...theme.components.button.text.primary,
            ...customStyles.text,
        },
    };
};

/**
 * Predefined style combinations for common use cases
 */
export const createCommonButtonStyles = (theme: Theme) => {
    return StyleSheet.create({
        // Floating Action Button
        fab: {
            ...theme.components.button.base,
            ...theme.components.button.variants.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            position: 'absolute',
            bottom: 16,
            right: 16,
            elevation: 6,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
        },

        // Compact button for toolbars
        compact: {
            ...theme.components.button.base,
            ...theme.components.button.variants.ghost,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            minHeight: 32,
        },

        // Link-style button
        link: {
            ...theme.components.button.base,
            backgroundColor: 'transparent',
            paddingHorizontal: 0,
            paddingVertical: theme.spacing.xs,
        },

        linkText: {
            ...theme.typography.body.medium,
            color: theme.colors.primary.main,
            textDecorationLine: 'underline',
        },

        // Danger button
        danger: {
            ...theme.components.button.base,
            ...theme.components.button.variants.primary,
            backgroundColor: theme.colors.error.main,
        },

        dangerText: {
            ...theme.components.button.text.primary,
            color: theme.colors.neutral.white,
        },

        // Success button
        success: {
            ...theme.components.button.base,
            ...theme.components.button.variants.primary,
            backgroundColor: theme.colors.success.main,
        },

        successText: {
            ...theme.components.button.text.primary,
            color: theme.colors.neutral.white,
        },
    });
};

/**
 * Animation helpers for button states
 */
export const buttonAnimations = {
    // Scale animation for press feedback
    pressScale: {
        transform: [{ scale: 0.98 }],
    },

    // Opacity for loading state
    loadingOpacity: {
        opacity: 0.6,
    },

    // Disabled state
    disabledOpacity: {
        opacity: 0.5,
    },
};

/**
 * Accessibility helpers
 */
export const getButtonAccessibilityProps = (
    variant: ButtonVariant,
    disabled: boolean,
    loading: boolean
) => {
    return {
        accessible: true,
        accessibilityRole: 'button' as const,
        accessibilityState: {
            disabled: disabled || loading,
        },
        accessibilityHint: loading ? 'Button is loading' : undefined,
    };
};