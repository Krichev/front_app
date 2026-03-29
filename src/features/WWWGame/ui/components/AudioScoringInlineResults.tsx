import React from 'react';
import {Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useAppStyles} from '../../../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../../../shared/ui/theme';
import {AudioChallengeType, GenericScoringResponse} from '../../../../types/audioChallenge.types';

interface AudioScoringInlineResultsProps {
    scoringResult: GenericScoringResponse;
    reactionTimeMs: number | null;
    challengeType: AudioChallengeType;
}

export const AudioScoringInlineResults: React.FC<AudioScoringInlineResultsProps> = ({
    scoringResult,
    reactionTimeMs,
    challengeType,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = inlineScoringStyles;

    const getScoreColor = (score: number) => {
        if (score >= 90) return theme.colors.success.main;
        if (score >= 70) return theme.colors.success.light;
        if (score >= 50) return theme.colors.warning.main;
        return theme.colors.error.main;
    };

    const getReactionColor = (ms: number) => {
        if (ms < 100) return theme.colors.success.main;
        if (ms < 200) return theme.colors.warning.main;
        return theme.colors.error.main;
    };

    const overallScore = Math.round(scoringResult.overallScore);

    return (
        <View style={styles.container}>
            <View style={styles.mainRow}>
                {/* Compact Score Circle */}
                <View style={[styles.scoreCircle, { borderColor: getScoreColor(overallScore) }]}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
                        {overallScore}
                    </Text>
                    <Text style={styles.scoreLabel}>{t('wwwPhases.audioAnswer.scoring.overallScore')}</Text>
                </View>

                {/* Info Column */}
                <View style={styles.infoColumn}>
                    <View style={[styles.passBadge, { backgroundColor: scoringResult.passed ? theme.colors.success.main : theme.colors.error.main }]}>
                        <MaterialCommunityIcons 
                            name={scoringResult.passed ? 'check-decagram' : 'alert-circle'} 
                            size={14} 
                            color={theme.colors.text.inverse} 
                        />
                        <Text style={styles.passText}>
                            {scoringResult.passed 
                                ? t('wwwPhases.audioAnswer.scoring.passed') 
                                : t('wwwPhases.audioAnswer.scoring.failed')}
                        </Text>
                    </View>

                    {reactionTimeMs !== null && (
                        <View style={styles.reactionContainer}>
                            <MaterialCommunityIcons 
                                name="lightning-bolt" 
                                size={14} 
                                color={getReactionColor(reactionTimeMs)} 
                            />
                            <Text style={[styles.reactionText, { color: getReactionColor(reactionTimeMs) }]}>
                                {t('wwwPhases.audioAnswer.scoring.reactionTime', { ms: reactionTimeMs })}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Metrics Breakdown */}
            <View style={styles.metricsRow}>
                {scoringResult.pitchScore > 0 && (
                    <MetricItem 
                        label={t('wwwPhases.audioAnswer.scoring.pitchScore')} 
                        value={scoringResult.pitchScore} 
                        icon="music-note"
                        color={theme.colors.info.main}
                    />
                )}
                {scoringResult.rhythmScore > 0 && (
                    <MetricItem 
                        label={t('wwwPhases.audioAnswer.scoring.rhythmScore')} 
                        value={scoringResult.rhythmScore} 
                        icon="metronome"
                        color={theme.colors.warning.main}
                    />
                )}
                {scoringResult.voiceScore > 0 && (
                    <MetricItem 
                        label={t('wwwPhases.audioAnswer.scoring.voiceScore')} 
                        value={scoringResult.voiceScore} 
                        icon="account-voice"
                        color={theme.colors.secondary?.main || theme.colors.primary.main}
                    />
                )}
            </View>
        </View>
    );
};

interface MetricItemProps {
    label: string;
    value: number;
    icon: string;
    color: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, icon, color }) => {
    const { theme } = useAppStyles();
    const styles = inlineScoringStyles;
    
    return (
        <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
                <MaterialCommunityIcons name={icon} size={12} color={color} />
                <Text style={styles.metricLabel}>{label}</Text>
            </View>
            <View style={styles.metricBarContainer}>
                <View style={[styles.metricBarFill, { width: `${Math.max(5, value)}%`, backgroundColor: color }]} />
            </View>
            <Text style={[styles.metricValue, { color }]}>{Math.round(value)}</Text>
        </View>
    );
};

const inlineScoringStyles = createStyles(theme => ({
    container: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        width: '100%',
        marginVertical: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    scoreCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.primary,
    },
    scoreValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 8,
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
    },
    infoColumn: {
        marginLeft: theme.spacing.lg,
        flex: 1,
        gap: theme.spacing.xs,
    },
    passBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.full,
        gap: 4,
    },
    passText: {
        color: theme.colors.text.inverse,
        fontSize: 11,
        fontWeight: 'bold',
    },
    reactionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    reactionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
    },
    metricItem: {
        flex: 1,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    metricLabel: {
        fontSize: 10,
        color: theme.colors.text.secondary,
    },
    metricBarContainer: {
        height: 4,
        backgroundColor: theme.colors.border.light,
        borderRadius: 2,
        overflow: 'hidden',
    },
    metricBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    metricValue: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 2,
        textAlign: 'right',
    },
}));
