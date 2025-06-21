// src/features/www-game-discussion/ui/DiscussionAnalysis.tsx
import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {DiscussionAnalysisResult} from '../model/types';
import {CustomIcon} from "../../../shared/components/Icon/CustomIcon.tsx";

interface DiscussionAnalysisProps {
    result: DiscussionAnalysisResult | null;
    correctAnswer: string;
    onClose?: () => void;
}

export const DiscussionAnalysis: React.FC<DiscussionAnalysisProps> = ({
                                                                          result,
                                                                          correctAnswer,
                                                                          onClose,
                                                                      }) => {
    if (!result) {
        return (
            <View style={styles.container}>
                <Text style={styles.noAnalysisText}>No analysis available</Text>
            </View>
        );
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return '#51cf66';
        if (confidence >= 0.5) return '#ffd43b';
        return '#ff6b6b';
    };

    const getConfidenceLabel = (confidence: number) => {
        if (confidence >= 0.8) return 'High';
        if (confidence >= 0.5) return 'Medium';
        return 'Low';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Discussion Analysis</Text>
                {onClose && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <CustomIcon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Answer Status */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <CustomIcon
                            name={result.correctAnswerMentioned ? 'check-circle' : 'alert-circle'}
                            size={20}
                            color={result.correctAnswerMentioned ? '#51cf66' : '#ff6b6b'}
                        />
                        <Text style={styles.sectionTitle}>Answer Status</Text>
                    </View>
                    <Text style={styles.answerStatus}>
                        {result.correctAnswerMentioned
                            ? `✅ Correct answer "${correctAnswer}" was mentioned during discussion`
                            : `❌ Correct answer "${correctAnswer}" was not mentioned`
                        }
                    </Text>
                </View>

                {/* Confidence */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <CustomIcon name="gauge" size={20} color="#4dabf7" />
                        <Text style={styles.sectionTitle}>Team Confidence</Text>
                    </View>
                    <View style={styles.confidenceContainer}>
                        <View style={styles.confidenceBar}>
                            <View
                                style={[
                                    styles.confidenceFill,
                                    {
                                        width: `${result.confidence * 100}%`,
                                        backgroundColor: getConfidenceColor(result.confidence)
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.confidenceText, { color: getConfidenceColor(result.confidence) }]}>
                            {getConfidenceLabel(result.confidence)} ({Math.round(result.confidence * 100)}%)
                        </Text>
                    </View>
                </View>

                {/* Best Guesses */}
                {result.bestGuesses.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <CustomIcon name="lightbulb" size={20} color="#ffd43b" />
                            <Text style={styles.sectionTitle}>Team Guesses</Text>
                        </View>
                        <View style={styles.guessesList}>
                            {result.bestGuesses.map((guess, index) => (
                                <View key={index} style={styles.guessItem}>
                                    <Text style={styles.guessNumber}>{index + 1}</Text>
                                    <Text style={styles.guessText}>{guess}</Text>
                                    {guess.toLowerCase().includes(correctAnswer.toLowerCase()) && (
                                        <CustomIcon name="check" size={16} color="#51cf66" />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Key Topics */}
                {result.keyTopics.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <CustomIcon name="tag-multiple" size={20} color="#9c88ff" />
                            <Text style={styles.sectionTitle}>Key Topics Discussed</Text>
                        </View>
                        <View style={styles.topicsContainer}>
                            {result.keyTopics.map((topic, index) => (
                                <View key={index} style={styles.topicTag}>
                                    <Text style={styles.topicText}>{topic}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Analysis Text */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <CustomIcon name="text-box" size={20} color="#4dabf7" />
                        <Text style={styles.sectionTitle}>Analysis</Text>
                    </View>
                    <Text style={styles.analysisText}>{result.analysis}</Text>
                </View>

                {/* Suggestions */}
                {result.suggestions.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <CustomIcon name="comment-text" size={20} color="#51cf66" />
                            <Text style={styles.sectionTitle}>Suggestions for Next Time</Text>
                        </View>
                        <View style={styles.suggestionsList}>
                            {result.suggestions.map((suggestion, index) => (
                                <View key={index} style={styles.suggestionItem}>
                                    <CustomIcon name="chevron-right" size={16} color="#51cf66" />
                                    <Text style={styles.suggestionText}>{suggestion}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        margin: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    answerStatus: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    confidenceContainer: {
        gap: 8,
    },
    confidenceBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    confidenceFill: {
        height: '100%',
        borderRadius: 4,
    },
    confidenceText: {
        fontSize: 14,
        fontWeight: '600',
    },
    guessesList: {
        gap: 8,
    },
    guessItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        gap: 12,
    },
    guessNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4dabf7',
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 24,
    },
    guessText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    topicsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    topicTag: {
        backgroundColor: '#e7f3ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#9c88ff',
    },
    topicText: {
        fontSize: 12,
        color: '#9c88ff',
        fontWeight: '500',
    },
    analysisText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    suggestionsList: {
        gap: 8,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    noAnalysisText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#999',
        marginTop: 40,
    },
});
