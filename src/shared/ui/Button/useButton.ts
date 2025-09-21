import {useCallback, useMemo} from 'react';
import type {StyleProp} from 'react-native';
import {StyleSheet, TextStyle, ViewStyle} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {ButtonSize, ButtonVariant} from './Button';
import {getButtonAccessibilityProps, staticButtonStyles} from './Button.styles';
import type {Spacing} from '../theme/types';

interface UseButtonOptions {
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    customContainerStyle?: StyleProp<ViewStyle>;
    customTextStyle?: StyleProp<TextStyle>;
}

interface UseButtonReturn {
    containerStyle: StyleProp<ViewStyle>;
    textStyle: StyleProp<TextStyle>;
    handlePress: (onPress?: () => void) => void;
    accessibilityProps: Record<string, any>;
    isInteractive: boolean;
}

// Export types for external use
export type { UseButtonOptions, UseButtonReturn };

/**
 * Custom hook for Button component logic and styling
 * Provides optimized styles and behavior for buttons
 */
export const useButton = (options: UseButtonOptions = {}): UseButtonReturn => {
    const {
        variant = ButtonVariant.PRIMARY,
        size = ButtonSize.MEDIUM,
        disabled = false,
        loading = false,
        fullWidth = false,
        customContainerStyle,
        customTextStyle,
    } = options;

    const { theme, components } = useTheme();

    // Determine effective variant (disabled takes precedence)
    const effectiveVariant = disabled ? ButtonVariant.DISABLED : variant;

    // Determine if button is interactive
    const isInteractive = !disabled && !loading;

    // Memoize container style
    const containerStyle = useMemo((): StyleProp<ViewStyle> => {
        const buttonTheme = components.button;
        const fullWidthStyle: ViewStyle = fullWidth ? { width: '100%' as const } : {};

        return StyleSheet.flatten([
            buttonTheme.base,
            buttonTheme.variants[effectiveVariant],
            buttonTheme.sizes[size],
            fullWidthStyle,
            loading && staticButtonStyles.loading,
            customContainerStyle,
        ]);
    }, [components.button, effectiveVariant, size, fullWidth, loading, customContainerStyle]);

    // Memoize text style
    const textStyle = useMemo((): StyleProp<TextStyle> => {
        const buttonTheme = components.button;
        const baseTextStyle = buttonTheme.text[effectiveVariant] || buttonTheme.text.primary;

        return StyleSheet.flatten([
            baseTextStyle,
            customTextStyle,
        ]);
    }, [components.button, effectiveVariant, customTextStyle]);

    // Memoize accessibility props
    const accessibilityProps = useMemo(() => {
        return getButtonAccessibilityProps(variant, disabled, loading);
    }, [variant, disabled, loading]);

    // Handle press with proper state checks
    const handlePress = useCallback((onPress?: () => void) => {
        if (isInteractive && onPress) {
            onPress();
        }
    }, [isInteractive]);

    return {
        containerStyle,
        textStyle,
        handlePress,
        accessibilityProps,
        isInteractive,
    };
};

/**
 * Hook for creating icon buttons with consistent sizing
 */
export const useIconButton = (
    size: ButtonSize = ButtonSize.MEDIUM,
    variant: ButtonVariant = ButtonVariant.GHOST
) => {
    const { theme } = useTheme();

    const iconSize = useMemo(() => {
        switch (size) {
            case ButtonSize.SMALL:
                return 16;
            case ButtonSize.MEDIUM:
                return 20;
            case ButtonSize.LARGE:
                return 24;
            default:
                return 20;
        }
    }, [size]);

    const buttonStyle = useMemo((): ViewStyle => {
        const baseSize = iconSize + (theme.spacing.md * 2);

        return {
            width: baseSize,
            height: baseSize,
            borderRadius: baseSize / 2,
            padding: theme.spacing.md,
        };
    }, [iconSize, theme.spacing.md]);

    return {
        iconSize,
        buttonStyle,
        variant,
    };
};

/**
 * Hook for button groups with consistent spacing
 */
export const useButtonGroup = (spacingKey: keyof Spacing = 'md') => {
    const { theme } = useTheme();

    const spacingValue = theme.spacing[spacingKey];

    const groupStyle = useMemo((): ViewStyle => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacingValue, // Note: gap might not be supported in older RN versions
    }), [spacingValue]);

    // Fallback for older React Native versions without gap support
    const groupStyleLegacy = useMemo((): ViewStyle => ({
        flexDirection: 'row',
        alignItems: 'center',
    }), []);

    const buttonSpacing = useMemo((): ViewStyle => ({
        marginRight: spacingValue,
    }), [spacingValue]);

    const lastButtonStyle = useMemo((): ViewStyle => ({
        marginRight: 0,
    }), []);

    return {
        groupStyle,
        groupStyleLegacy,
        buttonSpacing,
        lastButtonStyle,
        spacing: spacingValue,
    };
};

/**
 * Hook for animated button states
 */
export const useAnimatedButton = () => {
    const { theme } = useTheme();

    const pressedStyle = useMemo((): ViewStyle => ({
        transform: [{ scale: 0.98 }],
        opacity: 0.8,
    }), []);

    const loadingStyle = useMemo((): ViewStyle => ({
        opacity: 0.6,
    }), []);

    const disabledStyle = useMemo((): ViewStyle => ({
        opacity: 0.5,
    }), []);

    return {
        pressedStyle,
        loadingStyle,
        disabledStyle,
    };
};