// src/components/GameSettingsForm.tsx
import React from 'react'
import {Button, ScrollView, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {Card} from "../Card/Card.tsx";
import {Input} from "../Input/Input.tsx";
import {SourceSelector} from "../SourceSelector/SourceSelector.tsx";
import {TeamMemberList} from "../TeamMemberList/TeamMemberList.tsx";
import {DifficultySelector} from "../DifficultySelector/DifficultySelector.tsx";
import {Toggle} from "../Toggle/Toggle.tsx";

export interface GameSettings {
    title: string
    description: string
    reward: string
    teamName: string
    teamMembers: string[]
    difficulty: Difficulty
    roundTime: number
    roundCount: number
    enableAIHost: boolean
    questionSource: SourceType
    selectedUserQuestions?: string[]
}

export interface GameSettingsFormProps {
    settings: GameSettings
    onSettingsChange: (settings: Partial<GameSettings>) => void
    onSubmit: () => void
    style?: ViewStyle
    isLoading?: boolean
    submitText?: string
    showChallengeDetails?: boolean
    showQuestionSource?: boolean
    userQuestionsCount?: number
    appQuestionsCount?: number
    newMemberValue: string
    onNewMemberChange: (value: string) => void
    onAddMember: (member: string) => void
    onRemoveMember: (index: number) => void
    errors?: Partial<Record<keyof GameSettings, string>>
    children?: React.ReactNode // For custom sections like question selection
}

export const GameSettingsForm: React.FC<GameSettingsFormProps> = ({
                                                                      settings,
                                                                      onSettingsChange,
                                                                      onSubmit,
                                                                      style,
                                                                      isLoading = false,
                                                                      submitText = 'Create Game',
                                                                      showChallengeDetails = true,
                                                                      showQuestionSource = true,
                                                                      userQuestionsCount = 0,
                                                                      appQuestionsCount = 0,
                                                                      newMemberValue,
                                                                      onNewMemberChange,
                                                                      onAddMember,
                                                                      onRemoveMember,
                                                                      errors = {},
                                                                      children
                                                                  }) => {
    const updateSetting = <K extends keyof GameSettings>(
        key: K,
        value: GameSettings[K]
    ) => {
        onSettingsChange({ [key]: value })
    }

    const timeOptions = [30, 60, 90, 120]
    const countOptions = [5, 10, 15, 20]

    return (
        <ScrollView
            style={[styles.container, style]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* Challenge Details Section */}
            {showChallengeDetails && (
                <Card
                    style={[
                        styles.section,
                        errors.title && styles.errorSection
                    ]}
                    padding="lg"
                    shadow="small"
                >
                    <Text style={styles.sectionTitle}>Challenge Details</Text>

                    <Input
                        label="Title"
                        value={settings.title}
                        onChangeText={(value) => updateSetting('title', value)}
                        placeholder="Enter challenge title"
                        required
                        error={errors.title}
                    />

                    <Input
                        label="Description"
                        value={settings.description}
                        onChangeText={(value) => updateSetting('description', value)}
                        placeholder="Describe your challenge"
                        multiline
                        numberOfLines={3}
                        error={errors.description}
                    />

                    <Input
                        label="Reward"
                        value={settings.reward}
                        onChangeText={(value) => updateSetting('reward', value)}
                        placeholder="Enter reward (e.g., 100 points)"
                        error={errors.reward}
                    />
                </Card>
            )}

            {/* Question Source Section */}
            {showQuestionSource && (
                <Card
                    style={[
                        styles.section,
                        errors.questionSource && styles.errorSection
                    ]}
                    padding="lg"
                    shadow="small"
                >
                    <SourceSelector
                        value={settings.questionSource}
                        onValueChange={(value) => updateSetting('questionSource', value)}
                        label="Question Source"
                    />

                    {/* Question count info */}
                    <View style={styles.questionInfo}>
                        {settings.questionSource === 'app' && (
                            <Text style={styles.infoText}>
                                📚 {appQuestionsCount} app questions available for {settings.difficulty} difficulty
                            </Text>
                        )}

                        {settings.questionSource === 'user' && (
                            <Text style={styles.infoText}>
                                ✏️ {userQuestionsCount} custom questions available
                            </Text>
                        )}
                    </View>

                    {errors.questionSource && (
                        <Text style={styles.errorText}>{errors.questionSource}</Text>
                    )}
                </Card>
            )}

            {/* Custom content (e.g., question selection) */}
            {children}

            {/* Team Setup Section */}
            <Card
                style={[
                    styles.section,
                    (errors.teamName || errors.teamMembers) && styles.errorSection
                ]}
                padding="lg"
                shadow="small"
            >
                <Text style={styles.sectionTitle}>Team Setup</Text>

                <Input
                    label="Team Name"
                    value={settings.teamName}
                    onChangeText={(value) => updateSetting('teamName', value)}
                    placeholder="Enter team name"
                    required
                    error={errors.teamName}
                />

                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        Team Members <Text style={styles.required}>*</Text>
                    </Text>
                    <TeamMemberList
                        members={settings.teamMembers}
                        newMemberValue={newMemberValue}
                        onNewMemberChange={onNewMemberChange}
                        onAddMember={onAddMember}
                        onRemoveMember={onRemoveMember}
                        placeholder="Add team member"
                        maxMembers={6}
                    />
                    {errors.teamMembers && (
                        <Text style={styles.errorText}>{errors.teamMembers}</Text>
                    )}
                </View>
            </Card>

            {/* Game Settings Section */}
            <Card
                style={[
                    styles.section,
                    (errors.difficulty || errors.roundTime || errors.roundCount) && styles.errorSection
                ]}
                padding="lg"
                shadow="small"
            >
                <Text style={styles.sectionTitle}>Game Settings</Text>

                {/* Difficulty */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Difficulty</Text>
                    <DifficultySelector
                        value={settings.difficulty}
                        onValueChange={(value) => updateSetting('difficulty', value)}
                    />
                    {errors.difficulty && (
                        <Text style={styles.errorText}>{errors.difficulty}</Text>
                    )}
                </View>

                {/* Discussion Time */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Discussion Time</Text>
                    <View style={styles.optionButtons}>
                        {timeOptions.map((time) => (
                            <Button
                                key={time}
                                variant={settings.roundTime === time ? 'primary' : 'outline'}
                                size="sm"
                                onPress={() => updateSetting('roundTime', time)}
                                style={styles.optionButton}
                            >
                                {time}s
                            </Button>
                        ))}
                    </View>
                    {errors.roundTime && (
                        <Text style={styles.errorText}>{errors.roundTime}</Text>
                    )}
                </View>

                {/* Number of Questions */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Number of Questions</Text>
                    <View style={styles.optionButtons}>
                        {countOptions.map((count) => (
                            <Button
                                key={count}
                                variant={settings.roundCount === count ? 'primary' : 'outline'}
                                size="sm"
                                onPress={() => updateSetting('roundCount', count)}
                                style={styles.optionButton}
                            >
                                {count}
                            </Button>
                        ))}
                    </View>

                    {/* Warning for insufficient user questions */}
                    {settings.questionSource === 'user' &&
                        userQuestionsCount > 0 &&
                        userQuestionsCount < settings.roundCount && (
                            <Text style={styles.warningText}>
                                ⚠️ You only have {userQuestionsCount} custom questions.
                                The game will use all available questions.
                            </Text>
                        )}

                    {errors.roundCount && (
                        <Text style={styles.errorText}>{errors.roundCount}</Text>
                    )}
                </View>

                {/* AI Host Toggle */}
                <View style={styles.formGroup}>
                    <Toggle
                        value={settings.enableAIHost}
                        onValueChange={(value) => updateSetting('enableAIHost', value)}
                        label="Enable AI Host"
                    />
                    <Text style={styles.helpText}>
                        {settings.enableAIHost
                            ? "🤖 AI Host will analyze discussions and provide feedback"
                            : "🔇 AI Host features will be disabled"
                        }
                    </Text>
                </View>
            </Card>

            {/* Submit Button */}
            <View style={styles.submitContainer}>
                <Button
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    onPress={onSubmit}
                    disabled={isLoading}
                    fullWidth
                    icon={isLoading ? undefined : "play"}
                >
                    {isLoading ? 'Creating...' : submitText}
                </Button>

                {/* General error message */}
                {errors.general && (
                    <Text style={[styles.errorText, styles.generalError]}>
                        {errors.general}
                    </Text>
                )}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    errorSection: {
        borderColor: theme.colors.error,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    formGroup: {
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
    optionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    optionButton: {
        marginBottom: theme.spacing.sm,
        minWidth: 60,
    },
    questionInfo: {
        backgroundColor: theme.colors.primaryLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.sm,
    },
    infoText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    helpText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        marginTop: theme.spacing.xs,
        fontStyle: 'italic',
    },
    warningText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.warning,
        marginTop: theme.spacing.sm,
        fontStyle: 'italic',
    },
    errorText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
    },
    generalError: {
        textAlign: 'center',
        marginTop: theme.spacing.md,
    },
    submitContainer: {
        marginTop: theme.spacing.lg,
    },
})

// Usage example:
/*
const CreateGameScreen = () => {
    const [settings, setSettings] = useState<GameSettings>({
        title: 'What? Where? When? Quiz',
        description: 'Test your knowledge!',
        reward: '100 points',
        teamName: 'Team Intellect',
        teamMembers: ['Player 1'],
        difficulty: 'Medium',
        roundTime: 60,
        roundCount: 10,
        enableAIHost: true,
        questionSource: 'app'
    })

    const [newMember, setNewMember] = useState('')
    const [errors, setErrors] = useState<Partial<Record<keyof GameSettings, string>>>({})

    const handleSubmit = () => {
        // Validation and submission logic
    }

    return (
        <GameSettingsForm
            settings={settings}
            onSettingsChange={(updates) => setSettings(prev => ({ ...prev, ...updates }))}
            onSubmit={handleSubmit}
            newMemberValue={newMember}
            onNewMemberChange={setNewMember}
            onAddMember={(member) => {
                setSettings(prev => ({
                    ...prev,
                    teamMembers: [...prev.teamMembers, member]
                }))
                setNewMember('')
            }}
            onRemoveMember={(index) => {
                setSettings(prev => ({
                    ...prev,
                    teamMembers: prev.teamMembers.filter((_, i) => i !== index)
                }))
            }}
            errors={errors}
            userQuestionsCount={15}
            appQuestionsCount={100}
        />
    )
}
*/