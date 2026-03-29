// src/screens/CreateWWWQuestScreen/components/SelectedQuestionsPreview.tsx
import React, {useState} from 'react';
import {Text, TouchableOpacity, View, ViewStyle} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';

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
    const {t} = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
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

    const getDifficultyLabel = (difficulty?: string): string => {
        const normalizedDifficulty = (difficulty || 'MEDIUM').toUpperCase();
        switch (normalizedDifficulty) {
            case 'EASY': return t('createQuest.quizConfig.easy');
            case 'MEDIUM': return t('createQuest.quizConfig.medium');
            case 'HARD': return t('createQuest.quizConfig.hard');
            default: return difficulty || 'MEDIUM';
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
                        color={theme.colors.success.main}
                    />
                    <Text style={styles.sectionTitle}>
                        {t('createQuest.preview.title')} ({totalQuestions})
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={28}
                    color={theme.colors.text.primary}
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
                                            {t('createQuest.preview.questionNumber', { number: globalIndex + 1 })}
                                        </Text>
                                        <View
                                            style={[
                                                styles.difficultyBadge,
                                                getDifficultyStyle(question.difficulty), // ✅ Use helper function
                                            ]}
                                        >
                                            <Text style={styles.difficultyText}>
                                                {getDifficultyLabel(question.difficulty)}
                                            </Text>
                                        </View>
                                        <View style={styles.sourceBadge}>
                                            <Text style={styles.sourceText}>
                                                {question.source === 'app' ? t('createQuest.preview.fromApp') :
                                                     t('createQuest.preview.fromUser')}
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
                                                color={theme.colors.primary.main}
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
                                            <Text style={styles.detailLabel}>{t('createQuest.questionList.question')}:</Text>
                                            <Text style={styles.detailText}>{question.question}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t('createQuest.questionList.answer')}:</Text>
                                            <Text style={styles.detailText}>{question.answer}</Text>
                                        </View>
                                        {question.topic && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>{t('createQuest.questionList.topic')}:</Text>
                                                <Text style={styles.detailText}>{question.topic}</Text>
                                            </View>
                                        )}
                                        {question.additionalInfo && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>{t('createQuest.questionList.additionalInfo')}:</Text>
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
                                    color={previewPage === 1 ? theme.colors.text.disabled : theme.colors.primary.main}
                                />
                            </TouchableOpacity>

                            <Text style={styles.paginationText}>
                                {t('createQuest.preview.page', { current: previewPage, total: totalPages })}
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
                                    color={previewPage === totalPages ? theme.colors.text.disabled : theme.colors.primary.main}
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    section: {
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.small,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    previewHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    previewContent: {
        marginTop: theme.spacing.lg,
    },
    previewCard: {
        backgroundColor: theme.colors.info.background,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: theme.layout.borderWidth.thick,
        borderColor: theme.colors.primary.main,
    },
    previewCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    previewCardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        flex: 1,
    },
    previewCardHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    questionNumber: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary.main,
    },
    difficultyBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.lg,
    },
    difficultyEasy: {
        backgroundColor: theme.colors.success.main,
    },
    difficultyMedium: {
        backgroundColor: theme.colors.warning.main,
    },
    difficultyHard: {
        backgroundColor: theme.colors.error.main,
    },
    difficultyText: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    sourceBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.lg,
        backgroundColor: theme.colors.accent.main,
    },
    sourceText: {
        color: theme.colors.neutral.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    expandButton: {
        padding: theme.spacing.xs,
    },
    removeButton: {
        padding: theme.spacing.xs,
    },
    questionPreview: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    expandedContent: {
        gap: theme.spacing.md,
    },
    detailRow: {
        gap: theme.spacing.xs,
    },
    detailLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
    },
    detailText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        lineHeight: 20,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.lg,
        gap: theme.spacing.lg,
    },
    paginationButton: {
        padding: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.background.tertiary,
    },
    paginationButtonDisabled: {
        backgroundColor: theme.colors.background.secondary,
    },
    paginationText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
}));

export default SelectedQuestionsPreview;