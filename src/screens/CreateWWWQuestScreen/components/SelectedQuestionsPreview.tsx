// src/screens/CreateWWWQuestScreen/components/SelectedQuestionsPreview.tsx
import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface SelectedQuestionsPreviewProps {
    questions: any[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const QUESTIONS_PER_PAGE = 5;

const SelectedQuestionsPreview: React.FC<SelectedQuestionsPreviewProps> = ({
                                                                               questions,
                                                                               isCollapsed,
                                                                               onToggleCollapse,
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

    // ✅ Helper function to get difficulty style with proper typing
    const getDifficultyStyle = (difficulty?: string): ViewStyle => {
        const normalizedDifficulty = (difficulty || 'MEDIUM').toUpperCase();

        switch (normalizedDifficulty) {
            case 'EASY':
                return styles.difficultyEasy;
            case 'MEDIUM':
                return styles.difficultyMedium;
            case 'HARD':
                return styles.difficultyHard;
            default:
                return styles.difficultyMedium;
        }
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
                                                getDifficultyStyle(question.difficulty), // ✅ Use helper function
                                            ]}
                                        >
                                            <Text style={styles.difficultyText}>
                                                {question.difficulty || 'MEDIUM'}
                                            </Text>
                                        </View>
                                        <View style={styles.sourceBadge}>
                                            <Text style={styles.sourceText}>
                                                {question.source === 'app' ? 'App' :
                                                     'User'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.previewCardHeaderRight}>
                                        <TouchableOpacity
                                            onPress={() => toggleExpanded(globalIndex)}
                                            style={styles.expandButton}
                                        >
                                            <MaterialCommunityIcons
                                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={20}
                                                color="#007AFF"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Question Preview (Collapsed) */}
                                {!isExpanded && (
                                    <Text style={styles.questionPreview} numberOfLines={2}>
                                        {question.question}
                                    </Text>
                                )}

                                {/* Question Details (Expanded) */}
                                {isExpanded && (
                                    <View style={styles.expandedContent}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Question:</Text>
                                            <Text style={styles.detailText}>{question.question}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Answer:</Text>
                                            <Text style={styles.detailText}>{question.answer}</Text>
                                        </View>
                                        {question.topic && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Topic:</Text>
                                                <Text style={styles.detailText}>{question.topic}</Text>
                                            </View>
                                        )}
                                        {question.additionalInfo && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Additional Info:</Text>
                                                <Text style={styles.detailText}>{question.additionalInfo}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.paginationButton,
                                    previewPage === 1 && styles.paginationButtonDisabled,
                                ]}
                                onPress={() => setPreviewPage(Math.max(1, previewPage - 1))}
                                disabled={previewPage === 1}
                            >
                                <MaterialCommunityIcons
                                    name="chevron-left"
                                    size={20}
                                    color={previewPage === 1 ? '#ccc' : '#007AFF'}
                                />
                            </TouchableOpacity>

                            <Text style={styles.paginationText}>
                                Page {previewPage} of {totalPages}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.paginationButton,
                                    previewPage === totalPages && styles.paginationButtonDisabled,
                                ]}
                                onPress={() => setPreviewPage(Math.min(totalPages, previewPage + 1))}
                                disabled={previewPage === totalPages}
                            >
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={20}
                                    color={previewPage === totalPages ? '#ccc' : '#007AFF'}
                                />
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
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    previewCardHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    difficultyEasy: {
        backgroundColor: '#4CAF50',
    },
    difficultyMedium: {
        backgroundColor: '#FF9800',
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
    expandButton: {
        padding: 4,
    },
    removeButton: {
        padding: 4,
    },
    questionPreview: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    expandedContent: {
        gap: 12,
    },
    detailRow: {
        gap: 4,
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    detailText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 16,
    },
    paginationButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    paginationButtonDisabled: {
        backgroundColor: '#f5f5f5',
    },
    paginationText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
});

export default SelectedQuestionsPreview;