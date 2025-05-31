// src/shared/ui/ScoreDisplay/ScoreDisplay.tsx
import React from 'react'
import {StyleSheet, Text, View, ViewStyle} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {CustomProgressBar} from '../ProgressBar/CustomProgressBar.tsx'
import {theme} from '../../styles/theme'

interface ScoreDisplayProps {
    score: number
    total: number
    teamName?: string
    showPercentage?: boolean
    showProgress?: boolean
    size?: 'sm' | 'md' | 'lg'
    style?: ViewStyle
    animate?: boolean
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
                                                              score,
                                                              total,
                                                              teamName,
                                                              showPercentage = true,
                                                              showProgress = true,
                                                              size = 'md',
                                                              style,
                                                              animate = false
                                                          }) => {
    const percentage = total > 0 ? (score / total) * 100 : 0
    const progress = total > 0 ? score / total : 0

    const getScoreColor = () => {
        if (percentage >= 80) return theme.colors.success
        if (percentage >= 60) return theme.colors.warning
        return theme.colors.error
    }

    const getScoreMessage = () => {
        if (percentage >= 90) return 'Outstanding!'
        if (percentage >= 80) return 'Excellent!'
        if (percentage >= 70) return 'Great job!'
        if (percentage >= 60) return 'Good effort!'
        if (percentage >= 50) return 'Not bad!'
        return 'Keep trying!'
    }

    const getScoreIcon = () => {
        if (percentage >= 80) return 'trophy'
        if (percentage >= 60) return 'thumb-up'
        return 'heart'
    }

    return (
        <View style={[styles.container, styles[size], style]}>
            {teamName && (
                <Text style={[styles.teamName, styles[`${size}TeamName`]]}>
                    {teamName}
                </Text>
            )}

            <View style={styles.scoreContainer}>
                <MaterialCommunityIcons
                    name={getScoreIcon()}
                    size={size === 'lg' ? 48 : size === 'md' ? 36 : 24}
                    color={getScoreColor()}
                    style={styles.scoreIcon}
                />

                <View style={styles.scoreDetails}>
                    <Text style={[styles.scoreText, styles[`${size}ScoreText`]]}>
                        {score}/{total}
                    </Text>

                    {showPercentage && (
                        <Text style={[styles.percentageText, styles[`${size}PercentageText`], { color: getScoreColor() }]}>
                            {percentage.toFixed(0)}%
                        </Text>
                    )}

                    <Text style={[styles.messageText, styles[`${size}MessageText`], { color: getScoreColor() }]}>
                        {getScoreMessage()}
                    </Text>
                </View>
            </View>

            {showProgress && (
                <CustomProgressBar
                    progress={progress}
                    color={getScoreColor()}
                    style={styles.progressBar}
                    height={size === 'lg' ? 8 : size === 'md' ? 6 : 4}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        alignItems: 'center',
        ...theme.shadow.medium,
    },
    sm: {
        padding: theme.spacing.md,
    },
    md: {
        padding: theme.spacing.lg,
    },
    lg: {
        padding: theme.spacing.xl,
    },
    teamName: {
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    smTeamName: {
        fontSize: theme.fontSize.md,
        marginBottom: theme.spacing.sm,
    },
    mdTeamName: {
        fontSize: theme.fontSize.lg,
        marginBottom: theme.spacing.md,
    },
    lgTeamName: {
        fontSize: theme.fontSize.xl,
        marginBottom: theme.spacing.lg,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    scoreIcon: {
        marginRight: theme.spacing.md,
    },
    scoreDetails: {
        alignItems: 'center',
    },
    scoreText: {
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    smScoreText: {
        fontSize: theme.fontSize.lg,
    },
    mdScoreText: {
        fontSize: theme.fontSize.xl,
    },
    lgScoreText: {
        fontSize: theme.fontSize.xxl,
    },
    percentageText: {
        fontWeight: theme.fontWeight.bold,
        marginBottom: theme.spacing.xs,
    },
    smPercentageText: {
        fontSize: theme.fontSize.md,
    },
    mdPercentageText: {
        fontSize: theme.fontSize.lg,
    },
    lgPercentageText: {
        fontSize: theme.fontSize.xl,
    },
    messageText: {
        fontWeight: theme.fontWeight.medium,
    },
    smMessageText: {
        fontSize: theme.fontSize.sm,
    },
    mdMessageText: {
        fontSize: theme.fontSize.md,
    },
    lgMessageText: {
        fontSize: theme.fontSize.lg,
    },
    progressBar: {
        width: '100%',
        marginTop: theme.spacing.md,
    },
})