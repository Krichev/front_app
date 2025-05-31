// src/shared/ui/GameSettingsForm/GameSettingsForm.tsx
import React from 'react'
// Import TouchableOpacity
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native'
import {Difficulty, DifficultySelector} from '../DifficultySelector/DifficultySelector'
import {Toggle} from '../Toggle/Toggle'
import {Card} from '../Card/Card'
import {theme} from '../../styles/theme'

export interface GameSettings {
    difficulty: Difficulty
    roundTime: number
    roundCount: number
    enableAIHost: boolean
}

interface TimeOption {
    label: string
    value: number
}

interface CountOption {
    label: string
    value: number
}

interface GameSettingsFormProps {
    settings: GameSettings
    onSettingsChange: (settings: GameSettings) => void
    timeOptions?: TimeOption[]
    countOptions?: CountOption[]
    showAIHostToggle?: boolean
    style?: ViewStyle
    disabled?: boolean
}

const defaultTimeOptions: TimeOption[] = [
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '120s', value: 120 },
]

const defaultCountOptions: CountOption[] = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '20', value: 20 },
]

export const GameSettingsForm: React.FC<GameSettingsFormProps> = ({
                                                                      settings,
                                                                      onSettingsChange,
                                                                      timeOptions = defaultTimeOptions,
                                                                      countOptions = defaultCountOptions,
                                                                      showAIHostToggle = true,
                                                                      style,
                                                                      disabled = false
                                                                  }) => {
    const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
        onSettingsChange({
            ...settings,
            [key]: value
        })
    }

    const OptionButton: React.FC<{
        label: string
        value: number
        currentValue: number
        onPress: () => void
        disabled?: boolean
    }> = ({ label, value, currentValue, onPress, disabled }) => (
        <TouchableOpacity
            style={[
                styles.optionButton,
                value === currentValue && styles.selectedOption,
                disabled && styles.disabledOption
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text
                style={[
                    styles.optionText,
                    value === currentValue && styles.selectedOptionText,
                    disabled && styles.disabledText
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    )

    return (
        <Card style={[styles.container, style]} padding="lg">
            <Text style={styles.sectionTitle}>Game Settings</Text>

            {/* Difficulty Selection */}
            <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Difficulty Level</Text>
                <DifficultySelector
                    value={settings.difficulty}
                    onValueChange={(difficulty) => updateSetting('difficulty', difficulty)}
                    disabled={disabled}
                />
            </View>

            {/* Round Time Selection */}
            <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Discussion Time</Text>
                <View style={styles.optionsContainer}>
                    {timeOptions.map((option) => (
                        <OptionButton
                            key={option.value}
                            label={option.label}
                            value={option.value}
                            currentValue={settings.roundTime}
                            onPress={() => updateSetting('roundTime', option.value)}
                            disabled={disabled}
                        />
                    ))}
                </View>
                <Text style={styles.settingHint}>
                    Time allowed for team discussion per question
                </Text>
            </View>

            {/* Round Count Selection */}
            <View style={styles.settingGroup}>
                <Text style={styles.settingLabel}>Number of Questions</Text>
                <View style={styles.optionsContainer}>
                    {countOptions.map((option) => (
                        <OptionButton
                            key={option.value}
                            label={option.label}
                            value={option.value}
                            currentValue={settings.roundCount}
                            onPress={() => updateSetting('roundCount', option.value)}
                            disabled={disabled}
                        />
                    ))}
                </View>
                <Text style={styles.settingHint}>
                    Total number of questions in the game
                </Text>
            </View>

            {/* AI Host Toggle */}
            {showAIHostToggle && (
                <View style={styles.settingGroup}>
                    <View style={styles.toggleContainer}>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.settingLabel}>AI Host</Text>
                            <Text style={styles.settingHint}>
                                AI will analyze discussions and provide feedback
                            </Text>
                        </View>
                        <Toggle
                            value={settings.enableAIHost}
                            onValueChange={(value) => updateSetting('enableAIHost', value)}
                            disabled={disabled}
                        />
                    </View>
                </View>
            )}
        </Card>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    settingGroup: {
        marginBottom: theme.spacing.lg,
    },
    settingLabel: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    settingHint: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
        marginTop: theme.spacing.xs,
        fontStyle: 'italic',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    optionButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginRight: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        minWidth: 60,
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    disabledOption: {
        opacity: 0.5,
    },
    optionText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.fontWeight.medium,
    },
    selectedOptionText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.fontWeight.bold,
    },
    disabledText: {
        color: theme.colors.text.disabled,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleInfo: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
})

