// src/shared/ui/QuestionCard/QuestionCard.tsx
import React from 'react'
import {StyleSheet, Text, View, ViewStyle} from 'react-native'
import {Badge} from '../Badge/Badge'
import {theme} from '../../styles/theme'
import {Card} from "../Card/Card.tsx";

export interface QuestionCardData {
    id: string
    question: string
    answer: string
    difficulty?: 'Easy' | 'Medium' | 'Hard'
    topic?: string
    source?: string
    isUserCreated?: boolean
}

interface QuestionCardProps {
    question: QuestionCardData
    showAnswer?: boolean
    showDifficulty?: boolean
    isSelected?: boolean
    style?: ViewStyle
    onPress?: () => void
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
                                                              question,
                                                              showAnswer = false,
                                                              showDifficulty = true,
                                                              isSelected = false,
                                                              style,
                                                              onPress
                                                          }) => {
    const getDifficultyVariant = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'success'
            case 'Hard': return 'error'
            default: return 'warning'
        }
    }

    return (
        <Card
            style={[
                styles.container,
                isSelected && styles.selected,
                style
            ]}
            padding="md"
            onPress={onPress}
        >
            <View style={styles.header}>
                {showDifficulty && question.difficulty && (
                    <Badge
                        text={question.difficulty}
                        variant={getDifficultyVariant(question.difficulty)}
                        size="sm"
                    />
                )}
                {question.isUserCreated && (
                    <Badge
                        text="Custom"
                        variant="secondary"
                        size="sm"
                        style={styles.customBadge}
                    />
                )}
            </View>

            <Text style={styles.questionText} numberOfLines={showAnswer ? undefined : 3}>
                {question.question}
            </Text>

            {showAnswer && (
                <View style={styles.answerContainer}>
                    <Text style={styles.answerLabel}>Answer:</Text>
                    <Text style={styles.answerText}>{question.answer}</Text>
                </View>
            )}

            {question.topic && (
                <Text style={styles.topicText}>Topic: {question.topic}</Text>
            )}
        </Card>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },
    selected: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
        backgroundColor: theme.colors.primaryLight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    customBadge: {
        marginLeft: theme.spacing.sm,
    },
    questionText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        lineHeight: 22,
        marginBottom: theme.spacing.sm,
    },
    answerContainer: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        marginTop: theme.spacing.sm,
    },
    answerLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
        fontWeight: theme.fontWeight.medium,
        marginBottom: theme.spacing.xs,
    },
    answerText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.primary,
        fontWeight: theme.fontWeight.medium,
    },
    topicText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
        fontStyle: 'italic',
        marginTop: theme.spacing.xs,
    },
})