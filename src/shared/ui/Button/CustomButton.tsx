// src/shared/ui/Button/Button.tsx - RECOMMENDED FIX
import React from 'react'
import {ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {theme} from '../../styles/theme'

interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | string // Allow any string
    size?: 'sm' | 'md' | 'lg' | string // Allow any string
    disabled?: boolean
    loading?: boolean
    icon?: string
    iconPosition?: 'left' | 'right'
    onPress: () => void
    children: React.ReactNode
    style?: ViewStyle | ViewStyle[] | (ViewStyle | false | undefined)[] // Accept style arrays
    textStyle?: TextStyle
    fullWidth?: boolean
}

export const CustomButton: React.FC<ButtonProps> = ({
                                                  variant = 'primary',
                                                  size = 'md',
                                                  disabled = false,
                                                  loading = false,
                                                  icon,
                                                  iconPosition = 'left',
                                                  onPress,
                                                  children,
                                                  style,
                                                  textStyle,
                                                  fullWidth = false,
                                                  ...props
                                              }) => {
    // Process style arrays safely
    const processedStyle = React.useMemo(() => {
        if (!style) return undefined
        if (Array.isArray(style)) {
            const validStyles = style.filter(Boolean) as ViewStyle[]
            return StyleSheet.flatten(validStyles)
        }
        return style
    }, [style])

    // Safe style getter that handles unknown variants
    const getVariantStyle = (styleName: keyof typeof styles) => {
        return styles[styleName] || styles.primary
    }

    const buttonStyle = [
        styles.base,
        getVariantStyle(variant as keyof typeof styles),
        getVariantStyle(size as keyof typeof styles),
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        processedStyle
    ]

    const textStyleCombined = [
        styles.text,
        getVariantStyle(`${variant}Text` as keyof typeof styles),
        getVariantStyle(`${size}Text` as keyof typeof styles),
        textStyle
    ]

    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20
    const iconColor = variant === 'outline' || variant === 'ghost'
        ? theme.colors.primary
        : 'white'

    const renderIcon = () => {
        if (!icon) return null
        return (
            <MaterialCommunityIcons
                name={icon}
                size={iconSize}
                color={iconColor}
                style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}
            />
        )
    }

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="small"
                        color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : 'white'}
                    />
                    {typeof children === 'string' && (
                        <Text style={[textStyleCombined, styles.loadingText]}>
                            {children}
                        </Text>
                    )}
                </View>
            )
        }

        return (
            <>
                {iconPosition === 'left' && renderIcon()}
                <Text style={textStyleCombined}>{children}</Text>
                {iconPosition === 'right' && renderIcon()}
            </>
        )
    }

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {renderContent()}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.md,
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
    ghost: {
        backgroundColor: 'transparent',
    },
    danger: {
        backgroundColor: theme.colors.error,
    },

    // Sizes
    sm: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 32,
    },
    md: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        minHeight: 44,
    },
    lg: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        minHeight: 52,
    },

    // Text styles
    text: {
        fontWeight: theme.fontWeight.semibold,
        textAlign: 'center',
    },
    primaryText: {
        color: theme.colors.text.inverse,
        fontSize: theme.fontSize.md,
    },
    secondaryText: {
        color: theme.colors.text.inverse,
        fontSize: theme.fontSize.md,
    },
    outlineText: {
        color: theme.colors.primary,
        fontSize: theme.fontSize.md,
    },
    ghostText: {
        color: theme.colors.primary,
        fontSize: theme.fontSize.md,
    },
    dangerText: {
        color: theme.colors.text.inverse,
        fontSize: theme.fontSize.md,
    },

    // Size text
    smText: {
        fontSize: theme.fontSize.sm,
    },
    mdText: {
        fontSize: theme.fontSize.md,
    },
    lgText: {
        fontSize: theme.fontSize.lg,
    },

    // States
    disabled: {
        backgroundColor: theme.colors.disabled,
        opacity: 0.7,
    },
    fullWidth: {
        width: '100%',
    },

    // Icons
    iconLeft: {
        marginRight: theme.spacing.sm,
    },
    iconRight: {
        marginLeft: theme.spacing.sm,
    },

    // Loading
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingText: {
        marginLeft: theme.spacing.sm,
    },
})