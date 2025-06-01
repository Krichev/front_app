// src/shared/ui/Badge/Badge.tsx
import React from 'react'
import {StyleSheet, Text, View, ViewStyle} from 'react-native'
import {theme} from '../../styles/theme'


interface BadgeProps {
    text: string
    variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'neutral'
    size?: 'sm' | 'md'
    style?: ViewStyle
}

export const Badge: React.FC<BadgeProps> = ({
                                                text,
                                                variant = 'primary',
                                                size = 'md',
                                                style
                                            }) => {
    return (
        <View style={[styles.badge, styles[variant], styles[size], style]}>
            <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
                {text}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.md,
        alignSelf: 'flex-start',
    },

    // Variants
    primary: {
        backgroundColor: theme.colors.primaryLight,
    },
    secondary: {
        backgroundColor: '#E3F2FD',
    },
    success: {
        backgroundColor: theme.colors.successLight,
    },
    error: {
        backgroundColor: theme.colors.errorLight,
    },
    warning: {
        backgroundColor: '#FFF9C4',
    },
    neutral: {
        backgroundColor: '#f0f0f0',
    },

    // Sizes
    sm: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
    },
    md: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },

    // Text
    text: {
        fontWeight: theme.fontWeight.semibold,
        fontSize: theme.fontSize.xs,
    },
    primaryText: {
        color: theme.colors.primary,
    },
    secondaryText: {
        color: theme.colors.secondary,
    },
    successText: {
        color: theme.colors.success,
    },
    errorText: {
        color: theme.colors.error,
    },
    warningText: {
        color: '#F57C00',
    },
    neutralText: {
        color: theme.colors.text.secondary,
    },

    smText: {
        fontSize: 10,
    },
    mdText: {
        fontSize: theme.fontSize.xs,
    },
})