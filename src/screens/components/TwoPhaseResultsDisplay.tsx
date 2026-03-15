import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme';
import { RhythmBeatIndicators } from './RhythmBeatIndicators';
import { BeatIndicator, EnhancedRhythmScoringResult } from '../../types/rhythmChallenge.types';
import { ClientTimingScore } from '../../hooks/useBeatMatcher';
import { SoundQualityBadge } from './SoundQualityBadge';

interface TwoPhaseResultsDisplayProps {
    clientTimingScore: ClientTimingScore;
    serverResult: EnhancedRhythmScoringResult | null;
    isAnalyzingSound: boolean;
    beatIndicators: BeatIndicator[];
    onRetry: () => void;
    onContinue: () => void;
}

/**
 * Enhanced results display that shows timing results immediately and 
 * animates in sound quality results once the server completes analysis.
 */
export const TwoPhaseResultsDisplay: React.FC<TwoPhaseResultsDisplayProps> = ({
    clientTimingScore,
    serverResult,
    isAnalyzingSound,
    beatIndicators,
    onRetry,
    onContinue,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    // Animation for score crossfade and sound section entry
    const soundSectionAnim = useRef(new Animated.Value(0)).current;
    const scoreScaleAnim = useRef(new Animated.Value(1)).current;
    
    const [displayScore, setDisplayScore] = useState(clientTimingScore.overallScore);

    // When server result arrives with sound similarity, crossfade the score
    useEffect(() => {
        if (serverResult?.soundSimilarityEnabled) {
            // Animate score change
            Animated.sequence([
                Animated.timing(scoreScaleAnim, {
                    toValue: 1.2,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scoreScaleAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
            
            // Set the combined score
            setDisplayScore(serverResult.combinedScore);

            // Animate sound section entry
            Animated.timing(soundSectionAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        }
    }, [serverResult, scoreScaleAnim, soundSectionAnim]);

    const getScoreColor = (score: number) => {
        if (score >= 90) return theme.colors.success.main;
        if (score >= 70) return theme.colors.info.main;
        if (score >= 50) return theme.colors.warning.main;
        return theme.colors.error.main;
    };

    const scoreColor = getScoreColor(displayScore);

    return (
        <View style={styles.container}>
            {/* Score Circle */}
            <View style={styles.scoreHeader}>
                <Animated.View style={[
                    styles.scoreCircle, 
                    { borderColor: scoreColor, transform: [{ scale: scoreScaleAnim }] }
                ]}>
                    <Text style={[styles.scoreValue, { color: scoreColor }]}>
                        {Math.round(displayScore)}
                    </Text>
                    <Text style={styles.scoreLabel}>{t('rhythmChallenge.overallScore')}</Text>
                </Animated.View>

                <View style={[
                    styles.passBadge, 
                    { backgroundColor: clientTimingScore.passed ? theme.colors.success.main : theme.colors.error.main }
                ]}>
                    <MaterialCommunityIcons 
                        name={clientTimingScore.passed ? "check-decagram" : "close-circle"} 
                        size={20} 
                        color={theme.colors.text.inverse} 
                    />
                    <Text style={styles.passBadgeText}>
                        {clientTimingScore.passed ? t('common.passed') : t('common.failed')}
                    </Text>
                </View>
            </View>

            {/* Beat Indicators */}
            <View style={styles.section}>
                <RhythmBeatIndicators beats={beatIndicators} mode="results" />
            </View>

            {/* Timing Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <MaterialCommunityIcons name="check-bold" size={20} color={theme.colors.success.main} />
                    <View>
                        <Text style={styles.statValue}>{clientTimingScore.perfectBeats}</Text>
                        <Text style={styles.statLabel}>{t('rhythmChallenge.perfect')}</Text>
                    </View>
                </View>
                <View style={styles.statItem}>
                    <MaterialCommunityIcons name="thumb-up" size={20} color={theme.colors.info.main} />
                    <View>
                        <Text style={styles.statValue}>{clientTimingScore.goodBeats}</Text>
                        <Text style={styles.statLabel}>{t('rhythmChallenge.good')}</Text>
                    </View>
                </View>
                <View style={styles.statItem}>
                    <MaterialCommunityIcons name="close" size={20} color={theme.colors.error.main} />
                    <View>
                        <Text style={styles.statValue}>{clientTimingScore.missedBeats}</Text>
                        <Text style={styles.statLabel}>{t('rhythmChallenge.missed')}</Text>
                    </View>
                </View>
                <View style={styles.statItem}>
                    <MaterialCommunityIcons name="timer-outline" size={20} color={theme.colors.primary.main} />
                    <View>
                        <Text style={styles.statValue}>{Math.round(clientTimingScore.averageErrorMs)}ms</Text>
                        <Text style={styles.statLabel}>{t('rhythmChallenge.avgError')}</Text>
                    </View>
                </View>
            </View>

            {/* Sound Analysis Section (Phase B) */}
            {(isAnalyzingSound || serverResult?.soundSimilarityEnabled) && (
                <View style={styles.soundSection}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="equalizer" size={20} color={theme.colors.text.primary} />
                        <Text style={styles.sectionTitle}>{t('rhythmChallenge.soundScore')}</Text>
                    </View>

                    {isAnalyzingSound && !serverResult ? (
                        <View style={styles.loadingCard}>
                            <ActivityIndicator color={theme.colors.primary.main} />
                            <View style={styles.loadingTextContainer}>
                                <Text style={styles.loadingTitle}>{t('rhythmChallenge.analyzingSound')}</Text>
                                <Text style={styles.loadingDesc}>{t('rhythmChallenge.analyzingSoundDesc')}</Text>
                            </View>
                        </View>
                    ) : serverResult?.soundSimilarityEnabled ? (
                        <Animated.View style={{ opacity: soundSectionAnim }}>
                            <View style={styles.breakdownRow}>
                                <View style={styles.breakdownItem}>
                                    <Text style={styles.breakdownValue}>{Math.round(serverResult.overallScore)}</Text>
                                    <Text style={styles.breakdownLabel}>{t('rhythmChallenge.timingScore')}</Text>
                                </View>
                                <Text style={styles.breakdownOperator}>+</Text>
                                <View style={styles.breakdownItem}>
                                    <Text style={styles.breakdownValue}>{Math.round(serverResult.soundSimilarityScore || 0)}</Text>
                                    <Text style={styles.breakdownLabel}>{t('rhythmChallenge.soundScore')}</Text>
                                </View>
                                <Text style={styles.breakdownOperator}>=</Text>
                                <View style={styles.breakdownItem}>
                                    <Text style={[styles.breakdownValue, { color: scoreColor }]}>
                                        {Math.round(serverResult.combinedScore)}
                                    </Text>
                                    <Text style={styles.breakdownLabel}>{t('rhythmChallenge.combinedScore')}</Text>
                                </View>
                            </View>

                            {/* Per-beat sound scores */}
                            {serverResult.perBeatSoundScores && (
                                <View style={styles.soundBadgesRow}>
                                    {serverResult.perBeatSoundScores.map((score, idx) => (
                                        <SoundQualityBadge 
                                            key={idx} 
                                            score={score} 
                                            quality={serverResult.soundDetails?.[idx]?.userQuality || 'CLEAR'} 
                                            compact
                                        />
                                    ))}
                                </View>
                            )}
                        </Animated.View>
                    ) : null}
                </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <MaterialCommunityIcons name="replay" size={24} color={theme.colors.text.primary} />
                    <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                    <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.text.inverse} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        padding: theme.spacing.xl,
        gap: theme.spacing.xl,
    },
    scoreHeader: {
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: '900',
    },
    scoreLabel: {
        fontSize: 10,
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    passBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 6,
        borderRadius: theme.layout.borderRadius.full,
        gap: 6,
    },
    passBadgeText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 14,
    },
    section: {
        width: '100%',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.md,
    },
    statItem: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        gap: theme.spacing.md,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    soundSection: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    loadingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.md,
    },
    loadingTextContainer: {
        flex: 1,
    },
    loadingTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    loadingDesc: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
    },
    breakdownItem: {
        alignItems: 'center',
    },
    breakdownValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    breakdownLabel: {
        fontSize: 10,
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
    },
    breakdownOperator: {
        fontSize: 18,
        color: theme.colors.text.disabled,
        fontWeight: 'bold',
    },
    soundBadgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: theme.spacing.md,
        justifyContent: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.lg,
        marginTop: theme.spacing.lg,
    },
    retryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.neutral.gray[600],
        gap: theme.spacing.sm,
    },
    retryButtonText: {
        color: theme.colors.text.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    continueButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary.main,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        gap: theme.spacing.sm,
        ...theme.shadows.medium,
    },
    continueButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
    },
}));
