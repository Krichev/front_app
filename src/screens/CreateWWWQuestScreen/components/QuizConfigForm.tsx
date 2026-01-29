// src/screens/CreateWWWQuestScreen/components/QuizConfigForm.tsx
import {Picker} from '@react-native-picker/picker';
import React from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {QuizConfig} from '../hooks/useQuestCreator';
import {APIDifficulty} from '../../../services/wwwGame/questionService';

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

    const updateConfig = (updates: Partial<QuizConfig>) => {
        if (!config) return;
        onConfigChange({ ...config, ...updates });
    };

    // Use APIDifficulty type (uppercase values)
    const difficulties: APIDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

    // Helper function to display difficulty with proper capitalization
    const formatDifficultyDisplay = (difficulty: APIDifficulty): string => {
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

            {/* Team Name */}
            <View style={styles.section}>
                <Text style={styles.label}>{t('createQuest.quizConfig.teamNameRequired')}</Text>
                <TextInput
                    style={styles.input}
                    value={config?.teamName || ''}
                    onChangeText={(text) => updateConfig({ teamName: text })}
                    placeholder={t('createQuest.quizConfig.teamNamePlaceholder')}
                    placeholderTextColor="#999"
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
                        placeholderTextColor="#999"
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
                    {difficulties.map((diff: APIDifficulty) => (
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
                    <Text style={styles.timeValue}>{t('createQuest.quizConfig.seconds', { count: config?.roundTime || 60 })}</Text>
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
                        placeholderTextColor="#999"
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
                        placeholderTextColor="#999"
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
                <Text style={styles.summaryText}>• {t('createQuest.quizConfig.summaryTeamBased', { value: config?.teamBased ? t('createQuest.quizConfig.yes') : t('createQuest.quizConfig.no') })}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    infoBox: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 16,
        color: '#666',
    },
    warningBox: {
        backgroundColor: '#fff3cd',
        borderColor: '#ffc107',
        borderWidth: 1,
    },
    warningText: {
        color: '#856404',
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    memberText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    removeButton: {
        backgroundColor: '#ff4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    addMemberContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    memberInput: {
        flex: 1,
    },
    addButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        borderRadius: 8,
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    difficultyContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    difficultyButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    difficultyButtonActive: {
        borderColor: '#2196F3',
        backgroundColor: '#2196F3',
    },
    difficultyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    difficultyTextActive: {
        color: '#fff',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    timeButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeButtonText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '600',
    },
    timeValue: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
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
        marginTop: 16,
    },
    toggle: {
        width: 56,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ddd',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#4CAF50',
    },
    toggleThumb: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        marginLeft: 24,
    },
    summaryBox: {
        backgroundColor: '#f0f7ff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2196F3',
        marginTop: 8,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2196F3',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
});

export default QuizConfigForm;