// src/shared/ui/Button/CustomButton.tsx - Fixed imports
// src/shared/ui/Card/CustomCard.tsx - Fixed imports
// src/shared/ui/Badge/Badge.tsx - Fixed imports
import React from 'react';
import {StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle} from 'react-native';
import {theme} from '../../config';

interface Props {
    title?: string;
    children?: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export const CustomButton: React.FC<Props> = ({
                                                  title,
                                                  children,
                                                  onPress,
                                                  disabled = false,
                                                  loading = false,
                                                  style,
                                                  textStyle,
                                                  variant = 'primary',
                                                  size = 'md',
                                                  ...props
                                              }) => {
    const buttonStyle = [
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        loading && styles.loading,
        style
    ].filter(Boolean);

    const combinedTextStyle = [
        styles.text,
        styles[`${variant}Text` as keyof typeof styles],
        disabled && styles.disabledText,
        textStyle
    ].filter(Boolean);

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            <Text style={combinedTextStyle}>
                {loading ? 'Loading...' : title || children}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 44,
        ...theme.shadow.small,
    },

    // Variants
    primary: {
        backgroundColor: theme.colors.primary,
    },
    secondary: {
        backgroundColor: theme.colors.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },

    // Sizes
    sm: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        minHeight: 32,
    },
    md: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        minHeight: 44,
    },
    lg: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        minHeight: 52,
    },

    // States
    disabled: {
        backgroundColor: theme.colors.disabled,
        opacity: 0.6,
    },
    loading: {
        opacity: 0.7,
    },

    // Text styles
    text: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    primaryText: {
        color: theme.colors.text.inverse,
    },
    secondaryText: {
        color: theme.colors.text.inverse,
    },
    outlineText: {
        color: theme.colors.primary,
    },
    disabledText: {
        color: theme.colors.text.disabled,
    },
});



