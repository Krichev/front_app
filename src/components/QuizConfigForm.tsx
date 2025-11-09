// src/components/QuizConfigForm.tsx
import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {QuizConfig} from '../entities/QuizState/model/slice/quizApi';

interface QuizConfigFormProps {
    quizConfig: QuizConfig;
    onConfigChange: (config: QuizConfig) => void;
}

export const QuizConfigForm: React.FC<QuizConfigFormProps> = ({
                                                                  quizConfig,
                                                                  onConfigChange
                                                              }) => {
    const [teamMemberInput, setTeamMemberInput] = useState('');

    const updateConfig = (updates: Partial<QuizConfig>) => {
        onConfigChange({ ...quizConfig, ...updates });
    };

    const addTeamMember = () => {
        if (teamMemberInput.trim()) {
            const newMembers = [...quizConfig.teamMembers, teamMemberInput.trim()];
            updateConfig({ teamMembers: newMembers });
            setTeamMemberInput('');
        }
    };

    const removeTeamMember = (index: number) => {
        const newMembers = quizConfig.teamMembers.filter((_, i) => i !== index);
        updateConfig({ teamMembers: newMembers });
    };

    const difficulties: Array<'EASY' | 'MEDIUM' | 'HARD'> = ['EASY', 'MEDIUM', 'HARD'];

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
                    value={quizConfig.teamName}
                    onChangeText={(text) => updateConfig({ teamName: text })}
                    placeholder="Enter your team name"
                    placeholderTextColor="#999"
                />
            </View>

            {/* Team Members */}
            <View style={styles.section}>
                <Text style={styles.label}>Team Members *</Text>

                {/* Display current members */}
                {quizConfig.teamMembers.map((member, index) => (
                    <View key={index} style={styles.memberRow}>
                        <Text style={styles.memberText}>{index + 1}. {member}</Text>
                        <TouchableOpacity
                            onPress={() => removeTeamMember(index)}
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
                        onChangeText={setTeamMemberInput}
                        placeholder="Add team member"
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                        onPress={addTeamMember}
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
                    {difficulties.map((diff) => (
                        <TouchableOpacity
                            key={diff}
                            style={[
                                styles.difficultyButton,
                                quizConfig.difficulty === diff && styles.difficultyButtonActive
                            ]}
                            onPress={() => updateConfig({ difficulty: diff })}
                        >
                            <Text
                                style={[
                                    styles.difficultyText,
                                    quizConfig.difficulty === diff && styles.difficultyTextActive
                                ]}
                            >
                                {diff}
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
                        onPress={() => updateConfig({ roundTime: Math.max(10, quizConfig.roundTime - 10) })}
                        style={styles.timeButton}
                    >
                        <Text style={styles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{quizConfig.roundTime}s</Text>
                    <TouchableOpacity
                        onPress={() => updateConfig({ roundTime: Math.min(300, quizConfig.roundTime + 10) })}
                        style={styles.timeButton}
                    >
                        <Text style={styles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Round Count */}
            <View style={styles.section}>
                <Text style={styles.label}>Number of Questions *</Text>
                <View style={styles.timeContainer}>
                    <TouchableOpacity
                        onPress={() => updateConfig({ roundCount: Math.max(1, quizConfig.roundCount - 1) })}
                        style={styles.timeButton}
                    >
                        <Text style={styles.timeButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{quizConfig.roundCount}</Text>
                    <TouchableOpacity
                        onPress={() => updateConfig({ roundCount: Math.min(50, quizConfig.roundCount + 1) })}
                        style={styles.timeButton}
                    >
                        <Text style={styles.timeButtonText}>+</Text>
                    </TouchableOpacity>
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
                            quizConfig.enableAIHost && styles.toggleActive
                        ]}
                        onPress={() => updateConfig({ enableAIHost: !quizConfig.enableAIHost })}
                    >
                        <View
                            style={[
                                styles.toggleThumb,
                                quizConfig.enableAIHost && styles.toggleThumbActive
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
                            quizConfig.teamBased && styles.toggleActive
                        ]}
                        onPress={() => updateConfig({ teamBased: !quizConfig.teamBased })}
                    >
                        <View
                            style={[
                                styles.toggleThumb,
                                quizConfig.teamBased && styles.toggleThumbActive
                            ]}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Configuration Summary */}
            <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Configuration Summary</Text>
                <Text style={styles.summaryText}>• Team: {quizConfig.teamName || 'Not set'}</Text>
                <Text style={styles.summaryText}>• Members: {quizConfig.teamMembers.length}</Text>
                <Text style={styles.summaryText}>• Difficulty: {quizConfig.difficulty}</Text>
                <Text style={styles.summaryText}>• Time per question: {quizConfig.roundTime}s</Text>
                <Text style={styles.summaryText}>• Total questions: {quizConfig.roundCount}</Text>
                <Text style={styles.summaryText}>• AI Host: {quizConfig.enableAIHost ? 'Yes' : 'No'}</Text>
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