// src/shared/ui/DifficultySelector/DifficultySelector.tsx
import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native'
import {theme} from '../../styles/theme'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

interface DifficultySelectorProps {
    value: Difficulty
    onValueChange: (difficulty: Difficulty) => void
    style?: ViewStyle
    disabled?: boolean
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
                                                                          value,
                                                                          onValueChange,
                                                                          style,
                                                                          disabled = false
                                                                      }) => {
    const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard']

    return (
        <View style={[styles.container, style]}>
            {difficulties.map((difficulty) => (
                <TouchableOpacity
                    key={difficulty}
                    style={[
                        styles.button,
                        value === difficulty && styles.selectedButton,
                        disabled && styles.disabledButton
                    ]}
                    onPress={() => !disabled && onValueChange(difficulty)}
                    disabled={disabled}
                >
                    <Text
                        style={[
                            styles.text,
                            value === difficulty && styles.selectedText,
                            disabled && styles.disabledText
                        ]}
                    >
                        {difficulty}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    button: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginRight: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    selectedButton: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    text: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.fontWeight.medium,
    },
    selectedText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.fontWeight.bold,
    },
    disabledButton: {
        opacity: 0.5,
    },
    disabledText: {
        color: theme.colors.text.disabled,
    },
})