// src/screens/CreateWWWQuestScreen/components/SelectedQuestionsPreview.tsx
import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {MultimediaQuestionData} from '../hooks/useQuestionsManager';

interface SelectedQuestionsPreviewProps {
    questions: any[];
    newCustomQuestions: MultimediaQuestionData[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onRemoveCustomQuestion: (index: number) => void;
}

const QUESTIONS_PER_PAGE = 5;

const SelectedQuestionsPreview: React.FC<SelectedQuestionsPreviewProps> = ({
                                                                               questions,
                                                                               newCustomQuestions,
                                                                               isCollapsed,
                                                                               onToggleCollapse,
                                                                               onRemoveCustomQuestion,
                                                                           }) => {
    const [previewPage, setPreviewPage] = useState(1);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

    const totalQuestions = questions.length;
    const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
    const startIndex = (previewPage - 1) * QUESTIONS_PER_PAGE;
    const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, totalQuestions);
    const visibleQuestions = questions.slice(startIndex, endIndex);

    const toggleExpanded = (index: number) => {
        setExpandedQuestions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    if (totalQuestions === 0) {
        return null;
    }

    return (
        <View style={styles.section}>
            <TouchableOpacity
                style={styles.previewHeader}
                onPress={onToggleCollapse}
            >
                <View style={styles.previewHeaderLeft}>
                    <MaterialCommunityIcons
                        name="playlist-check"
                        size={24}
                        color="#4CAF50"
                    />
                    <Text style={styles.sectionTitle}>
                        Selected Questions ({totalQuestions})
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={28}
                    color="#333"
                />
            </TouchableOpacity>

            {!isCollapsed && (
                <View style={styles.previewContent}>
                    {visibleQuestions.map((question, displayIndex) => {
                        const globalIndex = startIndex + displayIndex;
                        const isExpanded = expandedQuestions.has(globalIndex);
                        const isCustom = question.source === 'custom';

                        return (
                            <View key={globalIndex} style={styles.previewCard}>
                                <View style={styles.previewCardHeader}>
                                    <View style={styles.previewCardHeaderLeft}>
                                        <Text style={styles.questionNumber}>
                                            Q{globalIndex + 1}
                                        </Text>
                                        <View
                                            style={[
                                                styles.difficultyBadge,
                                                styles[`difficulty${question.difficulty || 'MEDIUM'}`],
                                            ]}
                                        >
                                            <Text style={styles.difficultyText}>
                                                {question.difficulty}
                                            </Text>
                                        </View>
                                        <View style={styles.sourceBadge}>
                                            <Text style={styles.sourceText}>
                                                {question.source === 'app' ? 'App' :
                                                    question.source === 'user' ? 'My' : 'Custom'}
                                            </Text>
                                        </View>
                                    </View>
                                    {isCustom && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                const customIndex = newCustomQuestions.findIndex(
                                                    (q) => q.id === question.id
                                                );
                                                if (customIndex !== -1) {
                                                    onRemoveCustomQuestion(customIndex);
                                                }
                                            }}
                                            style={styles.removeButton}
                                        >
                                            <MaterialCommunityIcons
                                                name="close-circle"
                                                size={24}
                                                color="#F44336"
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text
                                    style={styles.questionText}
                                    numberOfLines={isExpanded ? undefined : 2}
                                >
                                    {question.question}
                                </Text>

                                {question.topic && (
                                    <Text style={styles.topicText}>
                                        Topic: {question.topic}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    onPress={() => toggleExpanded(globalIndex)}
                                    style={styles.expandButton}
                                >
                                    <Text style={styles.expandButtonText}>
                                        {isExpanded ? 'Show Less' : 'Show More'}
                                    </Text>
                                    <MaterialCommunityIcons
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color="#007AFF"
                                    />
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={styles.expandedContent}>
                                        <View style={styles.answerContainer}>
                                            <Text style={styles.answerLabel}>Answer:</Text>
                                            <Text style={styles.answerText}>
                                                {question.answer}
                                            </Text>
                                        </View>
                                        {question.additionalInfo && (
                                            <View style={styles.additionalInfoContainer}>
                                                <Text style={styles.additionalInfoLabel}>
                                                    Additional Info:
                                                </Text>
                                                <Text style={styles.additionalInfoText}>
                                                    {question.additionalInfo}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.paginationButton,
                                    previewPage === 1 && styles.paginationButtonDisabled,
                                ]}
                                onPress={() => setPreviewPage(previewPage - 1)}
                                disabled={previewPage === 1}
                            >
                                <Text style={styles.paginationButtonText}>← Previous</Text>
                            </TouchableOpacity>

                            <Text style={styles.paginationText}>
                                Page {previewPage} of {totalPages}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.paginationButton,
                                    previewPage >= totalPages && styles.paginationButtonDisabled,
                                ]}
                                onPress={() => setPreviewPage(previewPage + 1)}
                                disabled={previewPage >= totalPages}
                            >
                                <Text style={styles.paginationButtonText}>Next →</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
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
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    previewHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    previewContent: {
        marginTop: 16,
    },
    previewCard: {
        backgroundColor: '#f0f7ff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    previewCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    previewCardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#007AFF',
    },
    difficultyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyEASY: {
        backgroundColor: '#4CAF50',
    },
    difficultyEasy: {
        backgroundColor: '#4CAF50',
    },
    difficultyMEDIUM: {
        backgroundColor: '#FF9800',
    },
    difficultyMedium: {
        backgroundColor: '#FF9800',
    },
    difficultyHARD: {
        backgroundColor: '#F44336',
    },
    difficultyHard: {
        backgroundColor: '#F44336',
    },
    difficultyText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    sourceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#9C27B0',
    },
    sourceText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    removeButton: {
        padding: 4,
    },
    questionText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    topicText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    expandButtonText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    expandedContent: {
        marginTop: 12,
    },
    answerContainer: {
        padding: 12,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
        marginBottom: 12,
    },
    answerLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2E7D32',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 14,
        color: '#1B5E20',
    },
    additionalInfoContainer: {
        padding: 12,
        backgroundColor: '#fff3e0',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    additionalInfoLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#E65100',
        marginBottom: 4,
    },
    additionalInfoText: {
        fontSize: 14,
        color: '#E65100',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        gap: 12,
    },
    paginationButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
    },
    paginationButtonDisabled: {
        backgroundColor: '#ccc',
    },
    paginationButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    paginationText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
});

export default SelectedQuestionsPreview;