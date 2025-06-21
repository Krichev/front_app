// src/entities/question/ui/question-card.tsx
import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {Badge, CustomCard} from "../../../shared/ui";
import {theme} from "../../../shared/config";
import type {Question} from "../model/types";

export interface QuestionCardProps {
    question: Question
    isSelected?: boolean
    onPress?: () => void
    onEdit?: () => void
    onDelete?: () => void
    showAnswer?: boolean
    style?: ViewStyle
    selectable?: boolean
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
                                                              question,
                                                              isSelected = false,
                                                              onPress,
                                                              onEdit,
                                                              onDelete,
                                                              showAnswer = false,
                                                              style,
                                                              selectable = false
                                                          }) => {
    const handlePress = () => {
        if (onPress) {
            onPress()
        }
    }

    const getDifficultyBadgeVariant = () => {
        switch (question.difficulty) {
            case 'Easy':
                return 'success'
            case 'Medium':
                return 'warning'
            case 'Hard':
                return 'error'
            default:
                return 'neutral'
        }
    }

    // Combine styles safely
    const cardStyle: ViewStyle[] = [
        styles.card,
        isSelected && styles.selectedCard,
        selectable && styles.selectableCard,
        style
    ].filter(Boolean) as ViewStyle[]

    const CardContent = () => (
        <CustomCard
            style={cardStyle}
            padding="md"
            shadow="small"
        >
            {/* Header with difficulty badge and actions */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Badge
                        text={question.difficulty}
                        variant={getDifficultyBadgeVariant()}
                        size="sm"
                    />
                    {question.isUserCreated && (
                        <Badge
                            text="Custom"
                            variant="primary"
                            size="sm"
                            style={styles.customBadge}
                        />
                    )}
                </View>

                <View style={styles.headerRight}>
                    {isSelected && selectable && (
                        <CustomIcon
                            name="check-circle"
                            size={20}
                            color={theme.colors.success}
                            style={styles.selectedIcon}
                        />
                    )}

                    {(onEdit || onDelete) && (
                        <View style={styles.actions}>
                            {onEdit && (
                                <TouchableOpacity
                                    onPress={onEdit}
                                    style={styles.actionButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <CustomIcon
                                        name="pencil"
                                        size={18}
                                        color={theme.colors.text.secondary}
                                    />
                                </TouchableOpacity>
                            )}

                            {onDelete && (
                                <TouchableOpacity
                                    onPress={onDelete}
                                    style={styles.actionButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <CustomIcon
                                        name="delete"
                                        size={18}
                                        color={theme.colors.error}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {/* Question text */}
            <Text style={styles.questionText} numberOfLines={showAnswer ? undefined : 3}>
                {question.question}
            </Text>

            {/* Answer (if shown) */}
            {showAnswer && question.answer && (
                <View style={styles.answerContainer}>
                    <Text style={styles.answerLabel}>Answer:</Text>
                    <Text style={styles.answerText}>{question.answer}</Text>
                </View>
            )}

            {/* Topic */}
            {question.topic && (
                <Text style={styles.topicText}>Topic: {question.topic}</Text>
            )}

            {/* Footer with creation date */}
            <View style={styles.footer}>
                {question.createdAt && (
                    <Text style={styles.dateText}>
                        Created: {new Date(question.createdAt).toLocaleDateString()}
                    </Text>
                )}

                {selectable && (
                    <Text style={styles.selectHint}>
                        {isSelected ? 'Selected' : 'Tap to select'}
                    </Text>
                )}
            </View>
        </CustomCard>
    )

    if (onPress && selectable) {
        return (
            <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
                <CardContent />
            </TouchableOpacity>
        )
    }

    return <CardContent />
}

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
    },
    selectedCard: {
        borderColor: theme.colors.success,
        borderWidth: 2,
        backgroundColor: theme.colors.successLight,
    },
    selectableCard: {
        borderColor: theme.colors.border,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    customBadge: {
        marginLeft: theme.spacing.xs,
    },
    selectedIcon: {
        marginRight: theme.spacing.sm,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
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
        marginBottom: theme.spacing.sm,
    },
    answerLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.fontWeight.medium,
        marginBottom: theme.spacing.xs,
    },
    answerText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.primary,
        fontWeight: theme.fontWeight.medium,
    },
    topicText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        fontStyle: 'italic',
        marginBottom: theme.spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
    },
    dateText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
    },
    selectHint: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
        fontStyle: 'italic',
    },
})