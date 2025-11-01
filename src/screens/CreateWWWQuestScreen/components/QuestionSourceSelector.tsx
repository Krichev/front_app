// src/screens/CreateWWWQuestScreen/components/QuestionSourceSelector.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {QuestionSource} from "../../../services/wwwGame/questionService.ts";

interface QuestionSourceSelectorProps {
    questionSource: QuestionSource;
    onSourceChange: (source: QuestionSource) => void;
    onAddCustomQuestion: () => void;
    onAddMediaQuestion: () => void;
}

const QuestionSourceSelector: React.FC<QuestionSourceSelectorProps> = ({
                                                                           questionSource,
                                                                           onSourceChange,
                                                                           onAddCustomQuestion,
                                                                           onAddMediaQuestion,
                                                                       }) => {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question Source</Text>

            <View style={styles.sourceContainer}>
                <TouchableOpacity
                    style={[
                        styles.sourceButton,
                        questionSource === 'app' && styles.sourceButtonActive,
                    ]}
                    onPress={() => onSourceChange('app')}
                >
                    <MaterialCommunityIcons
                        name="database"
                        size={24}
                        color={questionSource === 'app' ? '#fff' : '#007AFF'}
                    />
                    <Text
                        style={[
                            styles.sourceButtonText,
                            questionSource === 'app' && styles.sourceButtonTextActive,
                        ]}
                    >
                        App Questions
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.sourceButton,
                        questionSource === 'user' && styles.sourceButtonActive,
                    ]}
                    onPress={() => onSourceChange('user')}
                >
                    <MaterialCommunityIcons
                        name="account"
                        size={24}
                        color={questionSource === 'user' ? '#fff' : '#007AFF'}
                    />
                    <Text
                        style={[
                            styles.sourceButtonText,
                            questionSource === 'user' && styles.sourceButtonTextActive,
                        ]}
                    >
                        My Questions
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.addButtonsContainer}>
                <TouchableOpacity
                    style={styles.addQuestionButton}
                    onPress={onAddCustomQuestion}
                >
                    <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
                    <Text style={styles.addQuestionButtonText}>Add Text Question</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.addQuestionButton, styles.mediaButton]}
                    onPress={onAddMediaQuestion}
                >
                    <MaterialCommunityIcons name="image-plus" size={20} color="#fff" />
                    <Text style={styles.addQuestionButtonText}>Add Media Question</Text>
                </TouchableOpacity>
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
    sourceContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    sourceButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#007AFF',
        backgroundColor: '#fff',
        gap: 8,
    },
    sourceButtonActive: {
        backgroundColor: '#007AFF',
    },
    sourceButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    sourceButtonTextActive: {
        color: '#fff',
    },
    addButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    addQuestionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    mediaButton: {
        backgroundColor: '#FF9800',
    },
    addQuestionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default QuestionSourceSelector;