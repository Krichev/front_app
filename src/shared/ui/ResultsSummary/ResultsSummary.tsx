// src/shared/ui/ResultsSummary/ResultsSummary.tsx
import React from 'react'
import {FlatList, StyleSheet, Text, View, ViewStyle} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {CustomCard} from '../Card/CustomCard.tsx'
import {Badge} from '../Badge/Badge'
import {ScoreDisplay} from '../ScoreDisplay/ScoreDisplay'
import {theme} from '../../styles/theme'

export interface PlayerPerformance {
    player: string
    correct: number
    total: number
    percentage: number
}

export interface RoundResult {
    questionNumber: number
    question: string
    correctAnswer: string
    teamAnswer: string
    isCorrect: boolean
    playerWhoAnswered: string
    discussionNotes?: string
}

interface ResultsSummaryProps {
    teamName: string
    score: number
    totalRounds: number
    playerPerformances: PlayerPerformance[]
    roundResults: RoundResult[]
    feedback?: string
    onShareResults?: () => void
    onPlayAgain?: () => void
    style?: ViewStyle
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
                                                                  teamName,
                                                                  score,
                                                                  totalRounds,
                                                                  playerPerformances,
                                                                  roundResults,
                                                                  feedback,
                                                                  onShareResults,
                                                                  onPlayAgain,
                                                                  style
                                                              }) => {
    const renderPlayerPerformance = () => (
        <CustomCard style={styles.section}>
            <Text style={styles.sectionTitle}>Player Performance</Text>
            {playerPerformances.length > 0 ? (
                playerPerformances.map((performance, index) => (
                    <View key={index} style={styles.playerItem}>
                        <View style={styles.playerInfo}>
                            <Text style={styles.playerName}>{performance.player}</Text>
                            <Text style={styles.playerStats}>
                                {performance.correct}/{performance.total} ({performance.percentage.toFixed(0)}%)
                            </Text>
                        </View>
                        <View style={styles.playerProgressBar}>
                            <View
                                style={[
                                    styles.playerProgress,
                                    { width: `${performance.percentage}%` }
                                ]}
                            />
                        </View>
                    </View>
                ))
            ) : (
                <Text style={styles.noDataText}>No player performance data available</Text>
            )}
        </CustomCard>
    )

    const renderRoundResult = ({ item }: { item: RoundResult }) => (
        <View style={styles.roundItem}>
            <View style={styles.roundHeader}>
                <Text style={styles.roundNumber}>Q{item.questionNumber}</Text>
                <Badge
                    text={item.isCorrect ? 'CORRECT' : 'INCORRECT'}
                    variant={item.isCorrect ? 'success' : 'error'}
                    size="sm"
                />
            </View>

            <Text style={styles.roundQuestion} numberOfLines={2}>
                {item.question}
            </Text>

            <View style={styles.answerSection}>
                <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Your answer:</Text>
                    <Text style={styles.answerText}>{item.teamAnswer}</Text>
                </View>

                {!item.isCorrect && (
                    <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Correct answer:</Text>
                        <Text style={[styles.answerText, styles.correctAnswer]}>
                            {item.correctAnswer}
                        </Text>
                    </View>
                )}

                {item.playerWhoAnswered && (
                    <Text style={styles.answeredBy}>
                        Answered by: {item.playerWhoAnswered}
                    </Text>
                )}
            </View>
        </View>
    )

    const renderQuestionResults = () => (
        <CustomCard style={styles.section}>
            <Text style={styles.sectionTitle}>Question Results</Text>
            <FlatList
                data={roundResults}
                renderItem={renderRoundResult}
                keyExtractor={(item) => item.questionNumber.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
            />
        </CustomCard>
    )

    const renderFeedback = () => {
        if (!feedback) return null

        return (
            <CustomCard style={styles.section}>
                <View style={styles.feedbackHeader}>
                    <CustomIcon
                        name="comment-text"
                        size={20}
                        color={theme.colors.secondary}
                    />
                    <Text style={styles.sectionTitle}>Game Analysis</Text>
                </View>
                <Text style={styles.feedbackText}>{feedback}</Text>
            </CustomCard>
        )
    }

    return (
        <View style={[styles.container, style]}>
            {/* Score Display */}
            <ScoreDisplay
                score={score}
                total={totalRounds}
                teamName={teamName}
                showPercentage
                showProgress
                size="lg"
                style={styles.scoreSection}
            />

            {/* AI Feedback */}
            {renderFeedback()}

            {/* Player Performance */}
            {renderPlayerPerformance()}

            {/* Question Results */}
            {renderQuestionResults()}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scoreSection: {
        marginBottom: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    feedbackText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
    playerItem: {
        marginBottom: theme.spacing.lg,
    },
    playerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    playerName: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    playerStats: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    playerProgressBar: {
        height: 8,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
    },
    playerProgress: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.sm,
    },
    noDataText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: theme.spacing.lg,
    },
    roundItem: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        paddingVertical: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    roundHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    roundNumber: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.secondary,
    },
    roundQuestion: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        lineHeight: 22,
        marginBottom: theme.spacing.md,
    },
    answerSection: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.sm,
    },
    answerRow: {
        marginBottom: theme.spacing.sm,
    },
    answerLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
        marginBottom: theme.spacing.xs,
    },
    answerText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.primary,
        fontWeight: theme.fontWeight.medium,
    },
    correctAnswer: {
        color: theme.colors.success,
    },
    answeredBy: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
        fontStyle: 'italic',
        marginTop: theme.spacing.sm,
    },
})