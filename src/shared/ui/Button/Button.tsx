import React from 'react';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import i18n from 'i18next';
import {useTheme} from '../theme/ThemeProvider';

// New enum that maps to theme variants
export enum ButtonVariant {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    OUTLINE = 'outline',
    GHOST = 'ghost',
    DISABLED = 'disabled',
}

// New enum that maps to theme sizes
export enum ButtonSize {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
}

interface ButtonProps {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    fullWidth?: boolean;
    loading?: boolean;
    loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
                                                  children,
                                                  variant = ButtonVariant.PRIMARY,
                                                  size = ButtonSize.MEDIUM,
                                                  disabled = false,
                                                  onPress,
                                                  style,
                                                  textStyle,
                                                  fullWidth = false,
                                                  loading = false,
                                                  loadingText,
                                              }) => {
    const { theme, components } = useTheme();

    // Get theme-based styles
    const buttonStyles = components.button;

    // Determine the variant to use (disabled takes precedence)
    const effectiveVariant = disabled ? ButtonVariant.DISABLED : variant;

    // Create fullWidth style object with proper typing
    const fullWidthStyle: ViewStyle = fullWidth ? { width: '100%' as const } : {};

    // Combine styles from theme
    const containerStyle: StyleProp<ViewStyle> = StyleSheet.flatten([
        buttonStyles.base,
        buttonStyles.variants[effectiveVariant],
        buttonStyles.sizes[size],
        fullWidthStyle,
        style,
    ]);

    // Get text style based on variant
    const getTextStyle = (): StyleProp<TextStyle> => {
        const baseTextStyle = buttonStyles.text[effectiveVariant] || buttonStyles.text.primary;

        return StyleSheet.flatten([
            baseTextStyle,
            textStyle,
        ]);
    };

    // Handle press with disabled state
    const handlePress = () => {
        if (!disabled && !loading && onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={disabled || loading ? 1 : 0.7}
        >
            {loading ? (
                <Text style={getTextStyle()}>{loadingText || i18n.t('common.loading')}</Text>
            ) : (
                <Text style={getTextStyle()}>
                    {children}
                </Text>
            )}
        </TouchableOpacity>
    );
};

// Legacy support - mapping old enums to new ones for backward compatibility
export const ButtonTheme = {
    CLEAR: ButtonVariant.GHOST,
    CLEAR_INVERTED: ButtonVariant.GHOST,
    OUTLINE: ButtonVariant.OUTLINE,
    BACKGROUND: ButtonVariant.PRIMARY,
    BACKGROUND_INVERTED: ButtonVariant.SECONDARY,
} as const;

// Export types for external use
export type { ButtonProps };