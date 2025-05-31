// src/shared/ui/SourceSelector/SourceSelector.tsx
import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {theme} from '../../styles/theme'

export type SourceType = 'app' | 'user'

interface SourceOption {
    value: SourceType
    label: string
    icon: string
    description?: string
}

interface SourceSelectorProps {
    value: SourceType
    onValueChange: (source: SourceType) => void
    style?: ViewStyle
    label?: string
    disabled?: boolean
}

const defaultOptions: SourceOption[] = [
    {
        value: 'app',
        label: 'App Questions',
        icon: 'brain',
        description: 'Use curated questions from our database'
    },
    {
        value: 'user',
        label: 'My Questions',
        icon: 'account-edit',
        description: 'Use your custom questions'
    }
]

export const CustomSourceSelector: React.FC<SourceSelectorProps> = ({
                                                                  value,
                                                                  onValueChange,
                                                                  style,
                                                                  label = 'Question Source',
                                                                  disabled = false
                                                              }) => {
    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={styles.label}>{label}</Text>
            )}

            <View style={styles.optionsContainer}>
                {defaultOptions.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.option,
                            value === option.value && styles.selectedOption,
                            disabled && styles.disabled
                        ]}
                        onPress={() => !disabled && onValueChange(option.value)}
                        disabled={disabled}
                    >
                        <MaterialCommunityIcons
                            name={option.icon}
                            size={20}
                            color={value === option.value ? theme.colors.text.inverse : theme.colors.text.secondary}
                            style={styles.icon}
                        />
                        <View style={styles.textContainer}>
                            <Text
                                style={[
                                    styles.optionText,
                                    value === option.value && styles.selectedText,
                                    disabled && styles.disabledText
                                ]}
                            >
                                {option.label}
                            </Text>
                            {option.description && (
                                <Text
                                    style={[
                                        styles.descriptionText,
                                        value === option.value && styles.selectedDescriptionText,
                                        disabled && styles.disabledText
                                    ]}
                                >
                                    {option.description}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
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
    optionsContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    selectedOption: {
        backgroundColor: theme.colors.primary,
    },
    icon: {
        marginRight: theme.spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    optionText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    selectedText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.fontWeight.bold,
    },
    descriptionText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
    },
    selectedDescriptionText: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    disabled: {
        opacity: 0.5,
    },
    disabledText: {
        color: theme.colors.text.disabled,
    },
})