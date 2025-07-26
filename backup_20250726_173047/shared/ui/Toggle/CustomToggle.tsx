// src/shared/ui/Toggle/Toggle.tsx
import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native'
import {theme} from '../../styles/theme'

interface ToggleProps {
    value: boolean
    onValueChange: (value: boolean) => void
    label?: string
    style?: ViewStyle
    disabled?: boolean
}

export const CustomToggle: React.FC<ToggleProps> = ({
                                                  value,
                                                  onValueChange,
                                                  label,
                                                  style,
                                                  disabled = false
                                              }) => {
    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={[
                    styles.toggle,
                    value ? styles.toggleActive : styles.toggleInactive,
                    disabled && styles.disabled
                ]}
                onPress={() => !disabled && onValueChange(!value)}
                disabled={disabled}
            >
                <View
                    style={[
                        styles.knob,
                        value ? styles.knobActive : styles.knobInactive,
                    ]}
                />
            </TouchableOpacity>
            {label && (
                <Text style={[styles.label, disabled && styles.labelDisabled]}>
                    {label}
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleActive: {
        backgroundColor: theme.colors.primary,
    },
    toggleInactive: {
        backgroundColor: theme.colors.disabled,
    },
    knob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        ...theme.shadow.small,
    },
    knobActive: {
        alignSelf: 'flex-end',
    },
    knobInactive: {
        alignSelf: 'flex-start',
    },
    label: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
    },
    disabled: {
        opacity: 0.5,
    },
    labelDisabled: {
        color: theme.colors.text.disabled,
    },
})