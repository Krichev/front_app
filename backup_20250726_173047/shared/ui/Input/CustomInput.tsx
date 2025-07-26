// src/shared/ui/Input/Input.tsx - Fixed version
import React from 'react'
import {StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,} from 'react-native'
import {theme} from '../../styles/theme'

interface InputProps extends TextInputProps {
    label?: string
    error?: string
    required?: boolean
    containerStyle?: ViewStyle
    hint?: string
    disabled?: boolean // Explicitly add disabled prop
}

export const CustomInput: React.FC<InputProps> = ({
                                                label,
                                                error,
                                                required,
                                                containerStyle,
                                                hint,
                                                style,
                                                disabled = false,
                                                ...props
                                            }) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, disabled && styles.labelDisabled]}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}

            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    disabled && styles.inputDisabled,
                    props.multiline && styles.textArea,
                    style
                ].filter(Boolean)}
                placeholderTextColor={disabled ? theme.colors.text.disabled : theme.colors.text.disabled}
                editable={!disabled} // React Native uses editable instead of disabled
                selectTextOnFocus={!disabled}
                {...props}
            />

            {hint && !error && (
                <Text style={[styles.hint, disabled && styles.hintDisabled]}>
                    {hint}
                </Text>
            )}

            {error && (
                <Text style={styles.error}>{error}</Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    labelDisabled: {
        color: theme.colors.text.disabled,
    },
    required: {
        color: theme.colors.error,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    inputDisabled: {
        backgroundColor: theme.colors.background,
        color: theme.colors.text.disabled,
        opacity: 0.6,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    hint: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        marginTop: theme.spacing.xs,
    },
    hintDisabled: {
        color: theme.colors.text.disabled,
    },
    error: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
    },
})