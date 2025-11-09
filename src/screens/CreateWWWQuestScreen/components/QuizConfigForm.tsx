// src/screens/CreateWWWQuestScreen/components/QuizConfigForm.tsx
import React from 'react';
import {StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {QuizConfig} from '../hooks/useQuestCreator';

interface QuizConfigFormProps {
    config: QuizConfig;
    teamMemberInput: string;
    onConfigChange: (config: QuizConfig) => void;
    onTeamMemberInputChange: (text: string) => void;
    onAddTeamMember: () => void;
    onRemoveTeamMember: (index: number) => void;
}

const QuizConfigForm: React.FC<QuizConfigFormProps> = ({
                                                           config,
                                                           teamMemberInput,
                                                           onConfigChange,
                                                           onTeamMemberInputChange,
                                                           onAddTeamMember,
                                                           onRemoveTeamMember,
                                                       }) => {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz Configuration</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Team Name</Text>
                <TextInput
                    style={styles.input}
                    value={config.teamName}
                    onChangeText={(text) => onConfigChange({ ...config, teamName: text })}
                    placeholder="Enter team name"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Team Members</Text>
                {config.teamMembers.map((member, index) => (
                    <View key={index} style={styles.memberRow}>
                        <Text style={styles.memberText}>{member}</Text>
                        <TouchableOpacity onPress={() => onRemoveTeamMember(index)}>
                            <MaterialCommunityIcons name="close-circle" size={24} color="#F44336" />
                        </TouchableOpacity>
                    </View>
                ))}
                <View style={styles.addMemberContainer}>
                    <TextInput
                        style={[styles.input, styles.memberInput]}
                        value={teamMemberInput}
                        onChangeText={onTeamMemberInputChange}
                        placeholder="Add team member"
                    />
                    <TouchableOpacity style={styles.addButton} onPress={onAddTeamMember}>
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.filterContainer}>
                    {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                        <TouchableOpacity
                            key={diff}
                            style={[
                                styles.filterChip,
                                config.difficulty === diff && styles.filterChipSelected,
                            ]}
                            onPress={() => onConfigChange({ ...config, difficulty: diff })}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    config.difficulty === diff && styles.filterChipTextSelected,
                                ]}
                            >
                                {diff}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Round Time (seconds): {config.roundTime}</Text>
                <View style={styles.filterContainer}>
                    {[30, 60, 90, 120].map((time) => (
                        <TouchableOpacity
                            key={time}
                            style={[
                                styles.filterChip,
                                config.roundTime === time && styles.filterChipSelected,
                            ]}
                            onPress={() => onConfigChange({ ...config, roundTime: time })}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    config.roundTime === time && styles.filterChipTextSelected,
                                ]}
                            >
                                {time}s
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Number of Rounds: {config.roundCount}</Text>
                <View style={styles.filterContainer}>
                    {[5, 10, 15, 20].map((count) => (
                        <TouchableOpacity
                            key={count}
                            style={[
                                styles.filterChip,
                                config.roundCount === count && styles.filterChipSelected,
                            ]}
                            onPress={() => onConfigChange({ ...config, roundCount: count })}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    config.roundCount === count && styles.filterChipTextSelected,
                                ]}
                            >
                                {count}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.switchContainer}>
                <Text style={styles.label}>Enable AI Host</Text>
                <Switch
                    value={config.enableAIHost}
                    onValueChange={(value) => onConfigChange({ ...config, enableAIHost: value })}
                />
            </View>

            <View style={styles.switchContainer}>
                <Text style={styles.label}>Team-Based Game</Text>
                <Switch
                    value={config.teamBased}
                    onValueChange={(value) => onConfigChange({ ...config, teamBased: value })}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f8f8f8',
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    filterChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    filterChipTextSelected: {
        color: '#fff',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
});

export default QuizConfigForm;