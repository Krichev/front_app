// src/screens/CreateWWWQuestScreen/components/QuestionSourceSelector.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {QuestionSource} from '../../../services/wwwGame/questionService';

interface QuestionSourceSelectorProps {
    questionSource: QuestionSource;
    onSourceChange: (source: QuestionSource) => void;
    onAddQuestion: () => void;
}

const QuestionSourceSelector: React.FC<QuestionSourceSelectorProps> = ({
                                                                           questionSource,
                                                                           onSourceChange,
                                                                           onAddQuestion,
                                                                       }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Select Question Source</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={onAddQuestion}
                >
                    <MaterialCommunityIcons name="plus-circle" size={24} color="#007AFF" />
                    <Text style={styles.addButtonText}>Add Custom</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        questionSource === 'app' && styles.toggleButtonActive
                    ]}
                    onPress={() => onSourceChange('app')}
                >
                    <MaterialCommunityIcons
                        name="brain"
                        size={24}
                        color={questionSource === 'app' ? '#fff' : '#666'}
                    />
                    <Text
                        style={[
                            styles.toggleText,
                            questionSource === 'app' && styles.toggleTextActive
                        ]}
                    >
                        App Questions
                    </Text>
                    <Text
                        style={[
                            styles.toggleSubtext,
                            questionSource === 'app' && styles.toggleSubtextActive
                        ]}
                    >
                        Curated questions
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        questionSource === 'user' && styles.toggleButtonActive
                    ]}
                    onPress={() => onSourceChange('user')}
                >
                    <MaterialCommunityIcons
                        name="account-edit"
                        size={24}
                        color={questionSource === 'user' ? '#fff' : '#666'}
                    />
                    <Text
                        style={[
                            styles.toggleText,
                            questionSource === 'user' && styles.toggleTextActive
                        ]}
                    >
                        My Questions
                    </Text>
                    <Text
                        style={[
                            styles.toggleSubtext,
                            questionSource === 'user' && styles.toggleSubtextActive
                        ]}
                    >
                        Your created questions
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    toggleContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    toggleButton: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        backgroundColor: '#f8f8f8',
        gap: 8,
    },
    toggleButtonActive: {
        borderColor: '#007AFF',
        backgroundColor: '#007AFF',
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    toggleTextActive: {
        color: '#fff',
    },
    toggleSubtext: {
        fontSize: 12,
        color: '#666',
    },
    toggleSubtextActive: {
        color: '#e0e0e0',
    },
});

export default QuestionSourceSelector;