// src/shared/ui/Input/Input.tsx
import React from 'react'
import {StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,} from 'react-native'
import {theme} from '../../styles/theme'

interface InputProps extends TextInputProps {
    label?: string
    error?: string
    required?: boolean
    containerStyle?: ViewStyle
    hint?: string
}

export const Input: React.FC<InputProps> = ({
                                                label,
                                                error,
                                                required,
                                                containerStyle,
                                                hint,
                                                style,
                                                ...props
                                            }) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}

            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    props.multiline && styles.textArea,
                    style
                ]}
                placeholderTextColor={theme.colors.text.disabled}
                {...props}
            />

            {hint && !error && (
                <Text style={styles.hint}>{hint}</Text>
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
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    hint: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        marginTop: theme.spacing.xs,
    },
    error: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
    },
})