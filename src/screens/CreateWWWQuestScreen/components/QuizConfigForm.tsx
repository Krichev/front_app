// src/screens/CreateWWWQuestScreen/components/QuizConfigForm.tsx
import {Picker} from '@react-native-picker/picker';
import React from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {QuizConfig} from '../hooks/useQuestCreator';
import { Difficulty, DIFFICULTY_LEVELS } from '../../../shared/types/difficulty';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';

interface QuizConfigFormProps {
    config: QuizConfig;
    teamMemberInput: string;
    selectedQuestionsCount: number;
    onConfigChange: (config: QuizConfig) => void;
    onTeamMemberInputChange: (text: string) => void;
    onAddTeamMember: () => void;
    onRemoveTeamMember: (index: number) => void;
}

const QuizConfigForm: React.FC<QuizConfigFormProps> = ({
                                                           config,
                                                           teamMemberInput,
                                                           selectedQuestionsCount,
                                                           onConfigChange,
                                                           onTeamMemberInputChange,
                                                           onAddTeamMember,
                                                           onRemoveTeamMember,
                                                       }) => {
    const {t} = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const updateConfig = (updates: Partial<QuizConfig>) => {
        if (!config) return;
        onConfigChange({ ...config, ...updates });
    };

    // Helper function to display difficulty with proper capitalization
    const formatDifficultyDisplay = (difficulty: Difficulty): string => {
        switch (difficulty) {
            case 'EASY': return t('createQuest.quizConfig.easy');
            case 'MEDIUM': return t('createQuest.quizConfig.medium');
            case 'HARD': return t('createQuest.quizConfig.hard');
            default: return difficulty;
        }
    };

    // Early return if config is not provided
    if (!config) {
        return (
            <View style={styles.container}>
                <View style={styles.section}>
                    <Text style={styles.label}>{t('createQuest.quizConfig.loadingConfig')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Game Type */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.gameType')}</Text>
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>{t('createQuest.quizConfig.wwwQuiz')}</Text>
                </View>
            </View>

            {/* Game Mode */}
            <View style={styles.section}>
                <Text style={styles.label}>Game Mode *</Text>
                <View style={styles.difficultyContainer}>
                    {['STANDARD', 'BRAIN_RING', 'BLITZ'].map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[
                                styles.difficultyButton,
                                config?.gameMode === mode && styles.difficultyButtonActive
                            ]}
                            onPress={() => updateConfig({ gameMode: mode as any })}
                        >
                            <Text
                                style={[
                                    styles.difficultyText,
                                    config?.gameMode === mode && styles.difficultyTextActive
                                ]}
                            >
                                {mode.replace('_', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Answer Time (Brain Ring only) */}
            {config?.gameMode === 'BRAIN_RING' && (
                <View style={styles.section}>
                    <Text style={styles.label}>Answer Time (seconds) *</Text>
                    <View style={styles.timeContainer}>
                        <TouchableOpacity
                            onPress={() => updateConfig({ answerTimeSeconds: Math.max(10, (config?.answerTimeSeconds || 20) - 5) })}
                            style={styles.timeButton}
                        >
                            <Text style={styles.timeButtonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.timeValue}>{config?.answerTimeSeconds || 20}s</Text>
                        <TouchableOpacity
                            onPress={() => updateConfig({ answerTimeSeconds: Math.min(60, (config?.answerTimeSeconds || 20) + 5) })}
                            style={styles.timeButton}
                        >
                            <Text style={styles.timeButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Team Name */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.teamNameRequired')}</Text>
                <TextInput
                    style={styles.input}
                    value={config?.teamName || ''}
                    onChangeText={(text) => updateConfig({ teamName: text })}
                    placeholder={t('createQuest.quizConfig.teamNamePlaceholder')}
                    placeholderTextColor={theme.colors.text.disabled}
                />
            </View>

            {/* Team Members */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.teamMembersRequired')}</Text>

                {/* Display current members */}
                {(config?.teamMembers || []).map((member: string, index: number) => (
                    <View key={index} style={styles.memberRow}>
                        <Text style={styles.memberText}>{index + 1}. {member}</Text>
                        <TouchableOpacity
                            onPress={() => onRemoveTeamMember(index)}
                            style={styles.removeButton}
                        >
                            <Text style={styles.removeButtonText}>{t('createQuest.quizConfig.remove')}</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Add new member */}
                <View style={styles.addMemberContainer}>
                    <TextInput
                        style={[styles.input, styles.memberInput]}
                        value={teamMemberInput}
                        onChangeText={onTeamMemberInputChange}
                        placeholder={t('createQuest.quizConfig.addMemberPlaceholder')}
                        placeholderTextColor={theme.colors.text.disabled}
                    />
                    <TouchableOpacity
                        onPress={onAddTeamMember}
                        style={styles.addButton}
                    >
                        <Text style={styles.addButtonText}>{t('createQuest.quizConfig.add')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Difficulty Selection */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.difficulty')} *</Text>
                <View style={styles.difficultyContainer}>
                    {DIFFICULTY_LEVELS.map((diff: Difficulty) => (
                        <TouchableOpacity
                            key={diff}
                            style={[
                                styles.difficultyButton,
                                config?.difficulty === diff && styles.difficultyButtonActive
                            ]}
                            onPress={() => updateConfig({ difficulty: diff })}
                        >
                            <Text
                                style={[
                                    styles.difficultyText,
                                    config?.difficulty === diff && styles.difficultyTextActive
                                ]}
                            >
                                {formatDifficultyDisplay(diff)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Round Time */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.timePerQuestion')} *</Text>
                <View style={styles.timeContainer}>
                    <TouchableOpacity
                        onPress={() => updateConfig({ roundTime: Math.max(10, (config?.roundTime || 60) - 10) })}
                        style={styles.timeButton}
                    >
                        <Text style={styles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{t('common.seconds', { count: config?.roundTime || 60 })}</Text>
                    <TouchableOpacity
                        onPress={() => updateConfig({ roundTime: Math.min(300, (config?.roundTime || 60) + 10) })}
                        style={styles.timeButton}
                    >
                        <Text style={styles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Selected Questions Count - READ ONLY */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.roundCount')}</Text>
                <View style={[styles.infoBox, selectedQuestionsCount === 0 && styles.warningBox]}>
                    <Text style={[styles.infoText, selectedQuestionsCount === 0 && styles.warningText]}>
                        {selectedQuestionsCount === 0
                            ? t('createQuest.preview.noQuestionsDesc')
                            : t('createQuest.quizConfig.rounds', { count: selectedQuestionsCount })}
                    </Text>
                </View>
            </View>

            {/* AI Host Toggle */}
            <View style={styles.section}>
                <View style={styles.toggleRow}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.label}>{t('createQuest.quizConfig.enableAIHost')}</Text>
                        <Text style={styles.helperText}>
                            {t('createQuest.quizConfig.aiHostDescription')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            config?.enableAIHost && styles.toggleActive
                        ]}
                        onPress={() => updateConfig({ enableAIHost: !config?.enableAIHost })}
                    >
                        <View
                            style={[
                                styles.toggleThumb,
                                config?.enableAIHost && styles.toggleThumbActive
                            ]}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* AI Answer Validation Toggle */}
            <View style={styles.section}>
                <View style={styles.toggleRow}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.label}>{t('createQuest.quizConfig.enableAiAnswerValidation')}</Text>
                        <Text style={styles.helperText}>
                            {t('createQuest.quizConfig.aiAnswerValidationDesc')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            config?.enableAiAnswerValidation && styles.toggleActive
                        ]}
                        onPress={() => updateConfig({ enableAiAnswerValidation: !config?.enableAiAnswerValidation })}
                    >
                        <View
                            style={[
                                styles.toggleThumb,
                                config?.enableAiAnswerValidation && styles.toggleThumbActive
                            ]}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Team Based Toggle */}
            <View style={styles.section}>
                <View style={styles.toggleRow}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.label}>{t('createQuest.quizConfig.teamBased')}</Text>
                        <Text style={styles.helperText}>
                            {t('createQuest.quizConfig.teamBasedDescription')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            config?.teamBased && styles.toggleActive
                        ]}
                        onPress={() => updateConfig({ teamBased: !config?.teamBased })}
                    >
                        <View
                            style={[
                                styles.toggleThumb,
                                config?.teamBased && styles.toggleThumbActive
                            ]}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Participation Settings */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.participationSettings')}</Text>
                <View style={styles.toggleRow}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.label}>{t('createQuest.quizConfig.openEnrollment')}</Text>
                        <Text style={styles.helperText}>
                            {t('createQuest.quizConfig.openEnrollmentDesc')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            config?.allowOpenEnrollment && styles.toggleActive
                        ]}
                        onPress={() => updateConfig({ allowOpenEnrollment: !config?.allowOpenEnrollment })}
                    >
                        <View
                            style={[
                                styles.toggleThumb,
                                config?.allowOpenEnrollment && styles.toggleThumbActive
                            ]}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                    <Text style={styles.label}>{t('createQuest.quizConfig.maxParticipants')}</Text>
                    <TextInput
                        style={styles.input}
                        value={config?.maxParticipants?.toString() || ''}
                        onChangeText={(text) => updateConfig({ maxParticipants: text ? parseInt(text) : undefined })}
                        placeholder={t('createQuest.quizConfig.unlimited')}
                        placeholderTextColor={theme.colors.text.disabled}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Completion Settings */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.completionSettings')}</Text>
                <View style={styles.toggleRow}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.label}>{t('createQuest.quizConfig.shuffleQuestions')}</Text>
                        <Text style={styles.helperText}>
                            {t('createQuest.quizConfig.shuffleQuestionsDesc')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            config?.shuffleQuestions && styles.toggleActive
                        ]}
                        onPress={() => updateConfig({ shuffleQuestions: !config?.shuffleQuestions })}
                    >
                        <View
                            style={[
                                styles.toggleThumb,
                                config?.shuffleQuestions && styles.toggleThumbActive
                            ]}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                    <Text style={styles.label}>{t('createQuest.quizConfig.maxAttempts')}</Text>
                    <TextInput
                        style={styles.input}
                        value={config?.maxAttempts?.toString() || ''}
                        onChangeText={(text) => updateConfig({ maxAttempts: text ? parseInt(text) : undefined })}
                        placeholder="1"
                        placeholderTextColor={theme.colors.text.disabled}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Result Sharing Settings */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.resultSharing')}</Text>
                <View style={styles.toggleRow}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.label}>{t('createQuest.quizConfig.requireConsent')}</Text>
                        <Text style={styles.helperText}>
                            {t('createQuest.quizConfig.requireConsentDesc')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            config?.requireResultConsent && styles.toggleActive
                        ]}
                        onPress={() => updateConfig({ requireResultConsent: !config?.requireResultConsent })}
                    >
                        <View
                            style={[
                                styles.toggleThumb,
                                config?.requireResultConsent && styles.toggleThumbActive
                            ]}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Configuration Summary */}
            <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>{t('createQuest.quizConfig.configSummary')}</Text>
                <Text style={styles.summaryText}>• {t('createQuest.quizConfig.teamName')}: {config?.teamName || t('createQuest.quizConfig.notSet')}</Text>
                <Text style={styles.summaryText}>• {t('createQuest.quizConfig.teamMembers')}: {config?.teamMembers?.length || 0}</Text>
                <Text style={styles.summaryText}>• {t('createQuest.quizConfig.summaryDifficulty', { value: config?.difficulty ? formatDifficultyDisplay(config.difficulty) : t('createQuest.quizConfig.notSet') })}</Text>
                <Text style={styles.summaryText}>• {t('createQuest.quizConfig.summaryTime', { value: config?.roundTime || 60 })}</Text>
                <Text style={styles.summaryText}>• {t('createQuest.quizConfig.summaryQuestions', { count: selectedQuestionsCount })}</Text>
                <Text style={styles.summaryText}>• {t('createQuest.quizConfig.summaryAIHost', { value: config?.enableAIHost ? t('createQuest.quizConfig.yes') : t('createQuest.quizConfig.no') })}</Text>
                <Text style={styles.summaryText}>• {t('createQuest.quizConfig.summaryAiValidation', { value: config?.enableAiAnswerValidation ? t('createQuest.quizConfig.yes') : t('createQuest.quizConfig.no') })}</Text>
                <Text style={styles.summaryText}>• {t('createQuest.quizConfig.summaryTeamBased', { value: config?.teamBased ? t('createQuest.quizConfig.yes') : t('createQuest.quizConfig.no') })}</Text>
            </View>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing['2xl'],
    },
    label: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    helperText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    input: {
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        backgroundColor: theme.colors.background.paper,
    },
    infoBox: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    infoText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    warningBox: {
        backgroundColor: theme.colors.warning.background,
        borderColor: theme.colors.warning.main,
        borderWidth: theme.layout.borderWidth.thin,
    },
    warningText: {
        color: theme.colors.warning.dark,
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.sm,
    },
    memberText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        flex: 1,
    },
    removeButton: {
        backgroundColor: theme.colors.error.main,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
    },
    removeButtonText: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    addMemberContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    memberInput: {
        flex: 1,
    },
    addButton: {
        backgroundColor: theme.colors.success.main,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.layout.borderRadius.md,
        justifyContent: 'center',
    },
    addButtonText: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    difficultyContainer: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    difficultyButton: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: theme.layout.borderWidth.thick,
        borderColor: theme.colors.border.light,
        alignItems: 'center',
    },
    difficultyButtonActive: {
        borderColor: theme.colors.primary.main,
        backgroundColor: theme.colors.primary.main,
    },
    difficultyText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
    },
    difficultyTextActive: {
        color: theme.colors.neutral.white,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xl,
    },
    timeButton: {
        width: 50,
        height: 50,
        borderRadius: theme.layout.borderRadius.full,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeButtonText: {
        fontSize: theme.typography.fontSize['2xl'],
        color: theme.colors.neutral.white,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    timeValue: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        minWidth: 80,
        textAlign: 'center',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleInfo: {
        flex: 1,
    },
    inputRow: {
        marginTop: theme.spacing.lg,
    },
    toggle: {
        width: 56,
        height: 32,
        borderRadius: theme.layout.borderRadius.xl,
        backgroundColor: theme.colors.border.light,
        padding: 2,
    },
    toggleActive: {
        backgroundColor: theme.colors.success.main,
    },
    toggleThumb: {
        width: 28,
        height: 28,
        borderRadius: theme.layout.borderRadius.lg,
        backgroundColor: theme.colors.neutral.white,
    },
    toggleThumbActive: {
        marginLeft: 24,
    },
    summaryBox: {
        backgroundColor: theme.colors.info.background,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.primary.main,
        marginTop: theme.spacing.sm,
    },
    summaryTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary.main,
        marginBottom: theme.spacing.sm,
    },
    summaryText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
}));

export default QuizConfigForm;