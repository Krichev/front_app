// src/screens/CreateWWWQuestScreen/components/QuizConfigForm.tsx
import React from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
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
    const updateConfig = (updates: Partial<QuizConfig>) => {
        if (!config) return;
        onConfigChange({ ...config, ...updates });
    };

    // Use APIDifficulty type (uppercase values)
    const difficulties: APIDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

    // Helper function to display difficulty with proper capitalization
    const formatDifficultyDisplay = (difficulty: APIDifficulty): string => {
        return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
    };

    // Early return if config is not provided
    if (!config) {
        return (
            <View style={styles.container}>
                <View style={styles.section}>
                    <Text style={styles.label}>Loading configuration...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Game Type */}
            <View style={styles.section}>
                <Text style={styles.label}>Game Type</Text>
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>WWW Quiz</Text>
                </View>
            </View>

            {/* Team Name */}
            <View style={styles.section}>
                <Text style={styles.label}>Team Name *</Text>
                <TextInput
                    style={styles.input}
                    value={config?.teamName || ''}
                    onChangeText={(text) => updateConfig({ teamName: text })}
                    placeholder="Enter your team name"
                    placeholderTextColor="#999"
                />
            </View>

            {/* Team Members */}
            <View style={styles.section}>
                <Text style={styles.label}>Team Members *</Text>

                {/* Display current members */}
                {(config?.teamMembers || []).map((member: string, index: number) => (
                    <View key={index} style={styles.memberRow}>
                        <Text style={styles.memberText}>{index + 1}. {member}</Text>
                        <TouchableOpacity
                            onPress={() => onRemoveTeamMember(index)}
                            style={styles.removeButton}
                        >
                            <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Add new member */}
                <View style={styles.addMemberContainer}>
                    <TextInput
                        style={[styles.input, styles.memberInput]}
                        value={teamMemberInput}
                        onChangeText={onTeamMemberInputChange}
                        placeholder="Add team member"
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                        onPress={onAddTeamMember}
                        style={styles.addButton}
                    >
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Difficulty Selection */}
            <View style={styles.section}>
                <Text style={styles.label}>Difficulty *</Text>
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
                <Text style={styles.label}>Discussion Time (seconds) *</Text>
                <View style={styles.timeContainer}>
                    <TouchableOpacity
                        onPress={() => updateConfig({ roundTime: Math.max(10, (config?.roundTime || 60) - 10) })}
                        style={styles.timeButton}
                    >
                        <Text style={styles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{config?.roundTime || 60}s</Text>
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
                <Text style={styles.label}>Number of Questions</Text>
                <View style={[styles.infoBox, selectedQuestionsCount === 0 && styles.warningBox]}>
                    <Text style={[styles.infoText, selectedQuestionsCount === 0 && styles.warningText]}>
                        {selectedQuestionsCount === 0
                            ? 'No questions selected - choose questions below'
                            : `${selectedQuestionsCount} question${selectedQuestionsCount !== 1 ? 's' : ''} selected`}
                    </Text>
                </View>
            </View>

            {/* AI Host Toggle */}
            <View style={styles.section}>
                <View style={styles.toggleRow}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.label}>Enable AI Host</Text>
                        <Text style={styles.helperText}>
                            AI will provide hints and feedback during the quiz
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
                        <Text style={styles.label}>Team Based Quiz</Text>
                        <Text style={styles.helperText}>
                            Enable collaborative gameplay
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

            {/* Configuration Summary */}
            <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Configuration Summary</Text>
                <Text style={styles.summaryText}>• Team: {config?.teamName || 'Not set'}</Text>
                <Text style={styles.summaryText}>• Members: {config?.teamMembers?.length || 0}</Text>
                <Text style={styles.summaryText}>• Difficulty: {config?.difficulty ? formatDifficultyDisplay(config.difficulty) : 'Not set'}</Text>
                <Text style={styles.summaryText}>• Time per question: {config?.roundTime || 60}s</Text>
                <Text style={styles.summaryText}>• Total questions: {selectedQuestionsCount}</Text>
                <Text style={styles.summaryText}>• AI Host: {config?.enableAIHost ? 'Yes' : 'No'}</Text>
                <Text style={styles.summaryText}>• Team Based: {config?.teamBased ? 'Yes' : 'No'}</Text>
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